// Test OAuth flow with updated URLs
const testOAuthFlow = async () => {
  console.log('🔧 Testing OAuth Flow with Updated URLs');
  console.log('========================================\n');

  // Test the OAuth callback endpoint
  try {
    console.log('🧪 Testing OAuth Callback with real parameters...');
    
    const response = await fetch('https://handlegmailoauthcallback-jhyfivohoq-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'test_code_123',
        state: 'test_state_123',
        userId: 'sEoZ0W5LMSV8IrxviJj0JBKOb5t1',
        redirect_uri: 'http://localhost:3000/auth/gmail/callback'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ OAuth callback endpoint is working!');
    } else {
      console.log('❌ OAuth callback endpoint returned error:', data.error);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Try the OAuth flow in your browser');
  console.log('2. Check if the "Failed to fetch" error is resolved');
  console.log('3. If still failing, check browser console for CORS errors');
};

testOAuthFlow();
