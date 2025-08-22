import { onRequest } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import { google } from "googleapis";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

// Prefer UPPERCASE env keys (Gen 2 .env requirement), fallback to lowercase
const oauthClientId =
  process.env.GMAIL_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.gmail_client_id ||
  process.env.google_client_id;

const oauthClientSecret =
  process.env.GMAIL_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.gmail_client_secret ||
  process.env.google_client_secret;

const redirectPath = "/apiDriveAuthCallback";

const stateSecret =
  process.env.OAUTH_STATE_SECRET ||
  process.env.oauth_state_secret ||
  "change-me";

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS || process.env.cors_allowed_origins || "http://localhost:3000";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function setCors(req, res) {
  const origin = req.get("origin");
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
  }
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

function signState(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", stateSecret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyState(state) {
  const [data, sig] = String(state || "").split(".");
  if (!data || !sig) return null;
  const expected = crypto.createHmac("sha256", stateSecret).update(data).digest("base64url");
  if (sig !== expected) return null;
  const json = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  if (!json.ts || Date.now() - json.ts > 10 * 60 * 1000) return null; // 10 minutes max age
  return json;
}

async function requireAuth(req) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.substring(7) : null;
  if (!token) return null;
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

export const driveAuthStart = onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");

  // Extract token from query parameter (new approach)
  let token = req.query.token;
  let decoded = null;
  
  if (token) {
    try {
      decoded = await getAuth().verifyIdToken(token);
    } catch (e) {
      // Invalid token
    }
  }
  
  // Fallback: try to get auth from header
  if (!decoded) {
    decoded = await requireAuth(req);
  }
  
  // Fallback: try to get from form data or query params (old approach)
  if (!decoded) {
    if (req.method === "POST" && req.body && req.body.idToken) {
      token = req.body.idToken;
    } else if (req.query.idToken) {
      token = req.query.idToken;
    }
    
    if (token) {
      try {
        decoded = await getAuth().verifyIdToken(token);
      } catch (e) {
        // Invalid token
      }
    }
  }
  
  if (!decoded) return res.status(401).json({ error: "unauthenticated" });

  const host = `${req.protocol}://${req.get("host")}`;
  const redirectUri = `${host}${redirectPath}`;

  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "/settings";
  const state = signState({ uid: decoded.uid, redirect, ts: Date.now() });

  const params = new URLSearchParams({
    client_id: String(oauthClientId || ""),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

export const driveAuthCallback = onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  try {
    const { code, state } = req.query;
    const payload = verifyState(state);
    if (!payload) return res.status(400).send("Invalid state");
    const { uid, redirect } = payload;

    const host = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${host}${redirectPath}`;

    const oauth2 = new google.auth.OAuth2(oauthClientId, oauthClientSecret, redirectUri);
    const { tokens } = await oauth2.getToken(String(code));
    if (!tokens?.refresh_token && !tokens?.access_token) {
      // Redirect to frontend app with error
      const frontendUrl = process.env.FRONTEND_URL || "https://smile3-8c8c5.web.app";
      return res.redirect(`${frontendUrl}${redirect || "/settings"}?drive=error`);
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
      drive_configured: true,
      integrations: {
        drive: {
          refresh_token: tokens.refresh_token || null,
          token_expiry: tokens.expiry_date || null,
          last_connected: new Date().toISOString(),
        },
      },
    }, { merge: true });

    // Redirect to frontend app with success
    const frontendUrl = process.env.FRONTEND_URL || "https://smile3-8c8c5.web.app";
    return res.redirect(`${frontendUrl}${redirect || "/settings"}?drive=connected`);
  } catch (e) {
    // Redirect to frontend app with error
    const frontendUrl = process.env.FRONTEND_URL || "https://smile3-8c8c5.web.app";
    return res.redirect(`${frontendUrl}/settings?drive=error`);
  }
});

export const driveFiles = onRequest(async (req, res) => {
  setCors(req, res);
  if (req.method === "OPTIONS") return res.status(204).send("");

  const decoded = await requireAuth(req);
  if (!decoded) return res.status(401).json({ error: "unauthenticated" });

  try {
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const data = userDoc.data() || {};
    const refresh = data?.integrations?.drive?.refresh_token;
    
    if (!data.drive_configured || !refresh) {
      return res.status(403).json({ error: "drive_not_connected", action: "connect_drive" });
    }

    // Log OAuth configuration for debugging
    console.log(`Drive API - OAuth config check:`, {
      hasClientId: !!oauthClientId,
      hasClientSecret: !!oauthClientSecret,
      hasRefreshToken: !!refresh,
      userId: decoded.uid
    });

    const host = `${req.protocol}://${req.get("host")}`;
    const redirectUri = `${host}${redirectPath}`;
    const oauth2 = new google.auth.OAuth2(oauthClientId, oauthClientSecret, redirectUri);
    oauth2.setCredentials({ refresh_token: refresh });

    const drive = google.drive({ version: "v3", auth: oauth2 });
    const pageSizeMax = Number(process.env.DRIVE_FILES_PAGE_SIZE_MAX || process.env.drive_files_page_size_max || 50);
    const inputSize = Math.min(Math.max(parseInt(req.query.pageSize) || 25, 1), pageSizeMax);
    
    // Log the raw query parameters for debugging
    console.log(`Drive API - Raw query params:`, {
      q: req.query.q,
      qType: typeof req.query.q,
      qTrimmed: req.query.q?.trim(),
      isEmpty: req.query.q?.trim() === ""
    });
    
    // Build the search query
    let q = "mimeType != 'application/vnd.google-apps.folder'"; // Default: exclude folders
    
    if (req.query.q && typeof req.query.q === "string" && req.query.q.trim() !== "") {
      // Escape special characters and prepare search term
      const searchTerm = req.query.q.trim()
        .replace(/'/g, "\\'")  // Escape single quotes
        .replace(/\\/g, "\\\\"); // Escape backslashes
      
      // Log the processed search term
      console.log(`Drive API - Processed search term: "${searchTerm}"`);
      
      // Construct search query with proper escaping
      q = `(name contains '${searchTerm}' or fullText contains '${searchTerm}') and mimeType != 'application/vnd.google-apps.folder'`;
      
      // Add case-insensitive search if term contains uppercase
      if (/[A-Z]/.test(searchTerm)) {
        const lowerTerm = searchTerm.toLowerCase();
        const upperTerm = searchTerm.toUpperCase();
        q = `(name contains '${searchTerm}' or name contains '${lowerTerm}' or name contains '${upperTerm}' or fullText contains '${searchTerm}') and mimeType != 'application/vnd.google-apps/folder'`;
      }
    }
    
    // Log the final query being used
    console.log(`Drive API - Final query: "${q}"`);
    
    // Also test a simple query to see if we can get any files at all
    if (req.query.q && req.query.q.trim() !== "") {
      console.log(`Drive API - Testing simple query for comparison...`);
      try {
        const simpleResp = await drive.files.list({
          q: "mimeType != 'application/vnd.google-apps.folder'",
          pageSize: 5,
          fields: "files(id, name, mimeType)",
          corpora: "user",
          supportsAllDrives: false,
          includeItemsFromAllDrives: false,
        });
        console.log(`Drive API - Simple query result: ${simpleResp.data.files?.length || 0} files found`);
        if (simpleResp.data.files && simpleResp.data.files.length > 0) {
          console.log(`Drive API - Sample files:`, simpleResp.data.files.map(f => f.name));
        }
      } catch (e) {
        console.log(`Drive API - Simple query test failed:`, e.message);
      }
    }

    console.log(`Drive API request - User: ${decoded.uid}, Query: ${q}, PageSize: ${inputSize}`);

    const resp = await drive.files.list({
      q,
      pageToken: typeof req.query.pageToken === "string" ? req.query.pageToken : undefined,
      pageSize: inputSize,
      fields: "nextPageToken, files(id, name, mimeType, iconLink, webViewLink)",
      corpora: "user",
      supportsAllDrives: false,
      includeItemsFromAllDrives: false,
      orderBy: "modifiedTime desc",
    });

    // Enhanced logging for Drive API response
    console.log(`Drive API response - Details:`, {
      filesFound: resp.data.files?.length || 0,
      hasNextPage: !!resp.data.nextPageToken,
      mimeTypes: resp.data.files?.map(f => f.mimeType).filter((v, i, a) => a.indexOf(v) === i) || [],
      queryUsed: q
    });
    
    // Log individual files for debugging
    if (resp.data.files && resp.data.files.length > 0) {
      console.log(`Drive API - Files returned:`, resp.data.files.map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        webViewLink: f.webViewLink
      })));
    } else {
      console.log(`Drive API - No files returned for query: "${q}"`);
    }
    
    return res.status(200).json({ files: resp.data.files || [], nextPageToken: resp.data.nextPageToken });
  } catch (e) {
    console.error("Drive API error:", e);
    
    // Provide more specific error information
    if (e.code === 401) {
      return res.status(401).json({ error: "drive_token_expired", action: "reconnect_drive" });
    } else if (e.code === 403) {
      return res.status(403).json({ error: "drive_permission_denied", action: "check_permissions" });
    } else if (e.code === 429) {
      return res.status(429).json({ error: "drive_rate_limited", action: "try_later" });
    } else if (e.message && e.message.includes("invalid_grant")) {
      return res.status(401).json({ error: "drive_token_invalid", action: "reconnect_drive" });
    }
    
    // Generic error with more details
    return res.status(502).json({ 
      error: "upstream_error", 
      details: e.message || "Unknown error",
      code: e.code || "unknown"
    });
  }
});


