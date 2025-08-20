/**
 * Debug script to help identify Gmail OAuth flow issues
 */

console.log("🔍 Gmail OAuth Flow Debug");
console.log("=" .repeat(40));

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log("✅ Running in browser environment");
  
  // Check current URL
  console.log("📍 Current URL:", window.location.href);
  console.log("📍 Origin:", window.location.origin);
  
  // Check if we're on the callback page
  if (window.location.pathname === '/auth/gmail/callback') {
    console.log("🎯 On Gmail callback page");
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    console.log("📋 URL Parameters:");
    console.log("   Code:", code ? "Present" : "Missing");
    console.log("   State:", state ? "Present" : "Missing");
    console.log("   Error:", error || "None");
    
    if (error) {
      console.error("❌ OAuth Error:", error);
    }
  } else {
    console.log("📄 Not on callback page");
  }
  
  // Check session storage
  const savedState = sessionStorage.getItem('gmail_auth_state');
  console.log("🔐 Saved state:", savedState ? "Present" : "Missing");
  
} else {
  console.log("❌ Not in browser environment");
}

// Test the OAuth URL construction
function testOAuthUrl() {
  const CLIENT_ID = '610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com';
  const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
  const redirectUri = 'https://smile3-8c8c5.firebaseapp.com/auth/gmail/callback';
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', SCOPES.join(' '));
  authUrl.searchParams.append('access_type', 'offline');
  authUrl.searchParams.append('state', 'test_state');
  authUrl.searchParams.append('prompt', 'consent');
  
  console.log("🔗 Generated OAuth URL:");
  console.log(authUrl.toString());
  
  return authUrl.toString();
}

// Test Cloud Function endpoints
async function testEndpoints() {
  console.log("\n🧪 Testing Cloud Function Endpoints...");
  
  const endpoints = [
    {
      name: "Reset Gmail Config",
      url: "https://us-central1-smile3-8c8c5.cloudfunctions.net/resetGmailConfiguration",
      method: "POST"
    },
    {
      name: "Gmail OAuth Callback",
      url: "https://us-central1-smile3-8c8c5.cloudfunctions.net/handleGmailOAuthCallback", 
      method: "POST"
    }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'sEoZ0W5LMSV8IrxviJj0JBKOb5t1',
          code: 'test_code',
          state: 'test_state'
        })
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

// Run tests
if (typeof window !== 'undefined') {
  testOAuthUrl();
  testEndpoints();
}

console.log("\n📋 Debug Instructions:");
console.log("1. Open browser console (F12)");
console.log("2. Go to Settings → Email Settings → Gmail Setup");
console.log("3. Click 'Connect Gmail'");
console.log("4. Check console for any errors");
console.log("5. If redirected to callback page, check URL parameters");
