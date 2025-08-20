// Test script to diagnose email delivery issues
// Run this in your Firebase Functions directory

const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

// Initialize Firebase Admin
initializeApp({
  projectId: "smile3-8c8c5",
});

const db = getFirestore();

async function testEmailSystem() {
  try {
    console.log("🔍 Testing Email System...\n");

    // 1. Check Gmail API configuration
    console.log("1. Checking Gmail API configuration...");
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    if (usersSnapshot.empty) {
      console.log("❌ No users found in database");
      return;
    }

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      console.log(`\nUser: ${userData.email || userData.name || doc.id}`);
      console.log(`  Gmail configured: ${userData.gmail_configured || false}`);
      console.log(`  Has access token: ${!!userData.gmail_access_token}`);
      console.log(`  Has refresh token: ${!!userData.gmail_refresh_token}`);
      console.log(`  Token expiry: ${userData.gmail_token_expiry ? new Date(userData.gmail_token_expiry).toISOString() : 'N/A'}`);
      console.log(`  Last error: ${userData.gmail_last_error || 'None'}`);
      console.log(`  Last error time: ${userData.gmail_error_time || 'N/A'}`);
    });

    // 2. Check recent email logs
    console.log("\n2. Checking recent email activity...");
    const emailsSnapshot = await db.collection('emails').orderBy('date', 'desc').limit(10).get();
    
    if (emailsSnapshot.empty) {
      console.log("❌ No email records found");
    } else {
      emailsSnapshot.forEach(doc => {
        const emailData = doc.data();
        console.log(`\nEmail: ${doc.id}`);
        console.log(`  To: ${emailData.recipients?.join(', ') || emailData.to || 'N/A'}`);
        console.log(`  Subject: ${emailData.subject || 'N/A'}`);
        console.log(`  Date: ${emailData.date || 'N/A'}`);
        console.log(`  Status: ${emailData.sentStatus || 'N/A'}`);
        console.log(`  Method: ${emailData.method || 'N/A'}`);
      });
    }

    // 3. Check Firebase Functions logs
    console.log("\n3. Firebase Functions Logs...");
    console.log("   Check the Firebase Console > Functions > Logs for recent errors");
    console.log("   Look for Gmail API errors, token expiration, or SMTP failures");

    // 4. Recommendations
    console.log("\n4. Recommendations:");
    console.log("   - Check if Gmail tokens are expired");
    console.log("   - Verify Gmail API quotas and limits");
    console.log("   - Check spam/junk folders in recipient accounts");
    console.log("   - Verify sender email addresses are correct");
    console.log("   - Check if emails are being blocked by recipient servers");

  } catch (error) {
    console.error("❌ Error testing email system:", error);
  }
}

// Run the test
testEmailSystem().then(() => {
  console.log("\n✅ Email system test completed");
  process.exit(0);
}).catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
