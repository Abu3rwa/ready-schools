// Comprehensive Email Diagnostic Script
// Run this to identify why emails appear sent but aren't delivered

const { getFirestore } = require('firebase-admin/firestore');
const { initializeApp } = require('firebase-admin/app');

// Initialize Firebase Admin
initializeApp({
  projectId: "smile3-8c8c5",
});

const db = getFirestore();

async function diagnoseEmailSystem() {
  try {
    console.log("🔍 COMPREHENSIVE EMAIL DIAGNOSTIC\n");
    console.log("=" .repeat(50));

    // 1. Check Gmail API configuration
    console.log("\n1. 🔐 GMAIL API CONFIGURATION");
    console.log("-".repeat(30));
    
    const usersSnapshot = await db.collection('users').limit(10).get();
    
    if (usersSnapshot.empty) {
      console.log("❌ No users found in database");
      return;
    }

    let gmailConfiguredUsers = 0;
    let usersWithTokens = 0;
    let usersWithExpiredTokens = 0;

    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const hasGmailConfig = userData.gmail_configured || false;
      const hasAccessToken = !!userData.gmail_access_token;
      const hasRefreshToken = !!userData.gmail_refresh_token;
      const tokenExpiry = userData.gmail_token_expiry;
      const isExpired = tokenExpiry && new Date(tokenExpiry) < new Date();
      
      if (hasGmailConfig) gmailConfiguredUsers++;
      if (hasAccessToken && hasRefreshToken) usersWithTokens++;
      if (isExpired) usersWithExpiredTokens++;

      console.log(`\n👤 User: ${userData.email || userData.name || doc.id}`);
      console.log(`   Gmail configured: ${hasGmailConfig ? '✅' : '❌'}`);
      console.log(`   Access token: ${hasAccessToken ? '✅' : '❌'}`);
      console.log(`   Refresh token: ${hasRefreshToken ? '✅' : '❌'}`);
      console.log(`   Token expiry: ${tokenExpiry ? new Date(tokenExpiry).toISOString() : 'N/A'}`);
      console.log(`   Token expired: ${isExpired ? '⚠️ YES' : '✅ NO'}`);
      console.log(`   Last error: ${userData.gmail_last_error || 'None'}`);
      console.log(`   Last error time: ${userData.gmail_error_time || 'N/A'}`);
      console.log(`   Token refresh time: ${userData.gmail_token_last_refresh || 'N/A'}`);
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total users: ${usersSnapshot.size}`);
    console.log(`   Gmail configured: ${gmailConfiguredUsers}`);
    console.log(`   Users with tokens: ${usersWithTokens}`);
    console.log(`   Users with expired tokens: ${usersWithExpiredTokens}`);

    // 2. Check recent email activity
    console.log("\n\n2. 📧 RECENT EMAIL ACTIVITY");
    console.log("-".repeat(30));
    
    const emailsSnapshot = await db.collection('emails').orderBy('date', 'desc').limit(20).get();
    
    if (emailsSnapshot.empty) {
      console.log("❌ No email records found in 'emails' collection");
      
      // Check if emails are being saved elsewhere
      console.log("\n🔍 Checking other possible email collections...");
      const collections = await db.listCollections();
      const emailCollections = collections.filter(col => 
        col.id.includes('email') || col.id.includes('mail') || col.id.includes('message')
      );
      
      if (emailCollections.length > 0) {
        console.log("Found potential email collections:", emailCollections.map(c => c.id));
      }
    } else {
      console.log(`Found ${emailsSnapshot.size} recent email records`);
      
      let successfulEmails = 0;
      let failedEmails = 0;
      let emailsByMethod = {};

      emailsSnapshot.forEach(doc => {
        const emailData = doc.data();
        const status = emailData.sentStatus || 'unknown';
        const method = emailData.method || 'unknown';
        
        if (status === 'sent') successfulEmails++;
        else if (status === 'failed') failedEmails++;
        
        emailsByMethod[method] = (emailsByMethod[method] || 0) + 1;

        console.log(`\n📨 Email: ${doc.id}`);
        console.log(`   To: ${emailData.recipients?.join(', ') || emailData.to || 'N/A'}`);
        console.log(`   Subject: ${emailData.subject || 'N/A'}`);
        console.log(`   Date: ${emailData.date || 'N/A'}`);
        console.log(`   Status: ${status}`);
        console.log(`   Method: ${method}`);
        console.log(`   Message ID: ${emailData.messageId || 'N/A'}`);
        console.log(`   Error: ${emailData.error || 'None'}`);
      });

      console.log(`\n📊 EMAIL SUMMARY:`);
      console.log(`   Total emails: ${emailsSnapshot.size}`);
      console.log(`   Successful: ${successfulEmails}`);
      console.log(`   Failed: ${failedEmails}`);
      console.log(`   By method:`, emailsByMethod);
    }

    // 3. Check Firebase Functions logs
    console.log("\n\n3. 📋 FIREBASE FUNCTIONS LOGS");
    console.log("-".repeat(30));
    console.log("   🔍 Check the Firebase Console > Functions > Logs");
    console.log("   🔍 Look for these specific error patterns:");
    console.log("      - Gmail API authentication errors (401, 403)");
    console.log("      - Token expiration messages");
    console.log("      - Rate limiting errors (429)");
    console.log("      - SMTP fallback errors");
    console.log("      - Email validation failures");

    // 4. Check Gmail API quotas and limits
    console.log("\n\n4. 📊 GMAIL API QUOTAS & LIMITS");
    console.log("-".repeat(30));
    console.log("   🔍 Gmail API Daily Limits:");
    console.log("      - Free tier: 1,000 emails/day");
    console.log("      - Paid tier: 100,000 emails/day");
    console.log("   🔍 Rate Limits:");
    console.log("      - 250 emails/second per user");
    console.log("      - 1,000 emails/second per project");

    // 5. Common issues and solutions
    console.log("\n\n5. 🚨 COMMON ISSUES & SOLUTIONS");
    console.log("-".repeat(30));
    
    if (usersWithExpiredTokens > 0) {
      console.log("   ⚠️  EXPIRED TOKENS DETECTED");
      console.log("      - Users need to re-authenticate with Gmail");
      console.log("      - Solution: Clear gmail_configured flag and re-authenticate");
    }
    
    if (gmailConfiguredUsers > 0 && usersWithTokens === 0) {
      console.log("   ⚠️  MISSING TOKENS DETECTED");
      console.log("      - Users marked as configured but no tokens found");
      console.log("      - Solution: Re-authenticate Gmail integration");
    }

    console.log("\n   🔍 OTHER POTENTIAL ISSUES:");
    console.log("      - Emails being sent to spam/junk folders");
    console.log("      - Recipient email servers blocking emails");
    console.log("      - Invalid email addresses in database");
    console.log("      - Gmail API project not enabled");
    console.log("      - OAuth2 scopes insufficient");

    // 6. Immediate actions
    console.log("\n\n6. 🚀 IMMEDIATE ACTIONS");
    console.log("-".repeat(30));
    console.log("   1. Deploy updated functions with enhanced logging");
    console.log("   2. Check Firebase Functions logs for detailed errors");
    console.log("   3. Test Gmail API status using /getGmailStatus endpoint");
    console.log("   4. Send test email using /testGmailDelivery endpoint");
    console.log("   5. Check recipient spam/junk folders");
    console.log("   6. Verify Gmail API is enabled in Google Cloud Console");

    // 7. Testing recommendations
    console.log("\n\n7. 🧪 TESTING RECOMMENDATIONS");
    console.log("-".repeat(30));
    console.log("   1. Test with your own email address first");
    console.log("   2. Check if emails appear in Gmail Sent folder");
    console.log("   3. Verify email headers and sender information");
    console.log("   4. Test with different recipient email providers");
    console.log("   5. Check if emails are being rate-limited");

  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
  }
}

// Run the diagnostic
diagnoseEmailSystem().then(() => {
  console.log("\n\n✅ Email system diagnostic completed");
  console.log("🔍 Check the output above for issues and follow the recommendations");
  process.exit(0);
}).catch(error => {
  console.error("❌ Diagnostic failed:", error);
  process.exit(1);
});
