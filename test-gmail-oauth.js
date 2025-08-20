/**
 * Test script to verify Gmail OAuth flow
 * This will help us debug the OAuth callback issue
 */

// Test the OAuth callback endpoint
async function testGmailOAuthCallback() {
  console.log("🧪 Testing Gmail OAuth Callback...");
  
  const functionUrl = "https://us-central1-smile3-8c8c5.cloudfunctions.net/handleGmailOAuthCallback";
  
  try {
    // Test with dummy data to see if the endpoint is accessible
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'test_code',
        state: 'test_state',
        userId: 'sEoZ0W5LMSV8IrxviJj0JBKOb5t1'
      })
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Function is accessible:", result);
    } else {
      const errorText = await response.text();
      console.log("❌ Function error:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Test the reset function
async function testResetFunction() {
  console.log("\n🧪 Testing Gmail Reset Function...");
  
  const functionUrl = "https://us-central1-smile3-8c8c5.cloudfunctions.net/resetGmailConfiguration";
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'sEoZ0W5LMSV8IrxviJj0JBKOb5t1'
      })
    });
    
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log("✅ Reset function working:", result);
    } else {
      const errorText = await response.text();
      console.log("❌ Reset function error:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

// Run tests
async function runTests() {
  console.log("🔧 Gmail OAuth Flow Test");
  console.log("=" .repeat(40));
  
  await testResetFunction();
  await testGmailOAuthCallback();
  
  console.log("\n📋 Next Steps:");
  console.log("1. If both functions work, try the OAuth flow again");
  console.log("2. If OAuth callback fails, check the browser console for errors");
  console.log("3. Make sure you're using the correct redirect URI");
}

runTests().catch(console.error);
