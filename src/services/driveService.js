import { auth } from "../firebase";

const API_BASE = (
  (typeof process !== "undefined" ? process.env.REACT_APP_API_BASE_URL : "") ||
  "https://us-central1-smile3-8c8c5.cloudfunctions.net"
);

// const API_BASE = (
//   (typeof process !== "undefined" ? process.env.REACT_APP_API_BASE_URL : "") ||
//   "https://smile3-8c8c5.web.app"
// );
async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("unauthenticated");
  // Force refresh to ensure a valid, non-expired token is used
  return await user.getIdToken(true);
}

export async function getDriveFiles({ search = "", pageSize = 25, pageToken } = {}) {
  if (!API_BASE) throw new Error("api_base_missing");
  const token = await getIdToken();
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (pageSize) params.set("pageSize", String(pageSize));
  if (pageToken) params.set("pageToken", pageToken);
  const url = `${API_BASE}/apiDriveFiles?${params.toString()}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 401) throw new Error("unauthenticated");
  if (resp.status === 403) return { files: [], nextPageToken: undefined, notConnected: true };
  if (!resp.ok) throw new Error(`drive_error_${resp.status}`);
  return await resp.json();
}

export async function startDriveAuth(redirect = "/settings") {
  if (!API_BASE) throw new Error("api_base_missing");
  const token = await getIdToken();
  
  // Create the auth URL with the token as a query parameter
  const params = new URLSearchParams({ 
    redirect,
    token // Pass token as query param for the backend to extract
  });
  const url = `${API_BASE}/apiDriveAuthStart?${params.toString()}`;
  
  // Use window.location.href for a direct redirect instead of form submission
  // This is more reliable and avoids the "Failed to fetch" error
  window.location.href = url;
}

// Keep the old function for backward compatibility but mark as deprecated
export function getDriveAuthStartUrl(redirect = "/settings") {
  console.warn("getDriveAuthStartUrl is deprecated. Use startDriveAuth() instead.");
  if (!API_BASE) return null;
  const params = new URLSearchParams({ redirect });
  return `${API_BASE}/apiDriveAuthStart?${params.toString()}`;
}


