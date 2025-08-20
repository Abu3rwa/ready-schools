/**
 * Utility script to reset Gmail configuration for a specific user
 * This script directly updates Firestore to reset Gmail integration fields
 * Uses Firebase Admin SDK for proper permissions
 * Run this from the functions directory: node reset-gmail-config.js [userId]
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import readline from 'readline';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp({
    projectId: "smile3-8c8c5",
  });
}

const db = getFirestore();

// Function to reset Gmail configuration
async function resetGmailConfig(userId = null) {
  try {
    console.log("🔧 Gmail Configuration Reset Tool");
    console.log("=" .repeat(40));
    
    // If no userId provided, ask for it
    if (!userId) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      userId = await new Promise((resolve) => {
        rl.question("Enter the user ID to reset Gmail configuration for: ", (answer) => {
          rl.close();
          resolve(answer);
        });
      });
      
      if (!userId) {
        console.log("❌ No user ID provided. Exiting.");
        return;
      }
    }
    
    console.log(`\n👤 Resetting Gmail configuration for user: ${userId}`);
    
    // First, let's check the current state
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log("❌ User not found in database");
      return;
    }
    
    const userData = userDoc.data();
    console.log("\n📊 Current Gmail Configuration:");
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   Display Name: ${userData.displayName || 'N/A'}`);
    console.log(`   Gmail Configured: ${userData.gmail_configured || false}`);
    console.log(`   Access Token: ${userData.gmail_access_token ? 'Present' : 'Missing'}`);
    console.log(`   Refresh Token: ${userData.gmail_refresh_token ? 'Present' : 'Missing'}`);
    console.log(`   Token Expiry: ${userData.gmail_token_expiry ? new Date(userData.gmail_token_expiry).toISOString() : 'N/A'}`);
    console.log(`   Last Error: ${userData.gmail_last_error || 'None'}`);
    
    // Reset all Gmail configuration fields
    const resetData = {
      gmail_configured: false,
      gmail_access_token: null,
      gmail_refresh_token: null,
      gmail_token_expiry: null,
      gmail_token_error: null,
      gmail_token_error_time: null,
      gmail_last_error: null,
      gmail_error_time: null,
      gmail_token_last_refresh: null
    };
    
    console.log("\n🔄 Resetting Gmail configuration fields...");
    await userRef.update(resetData);
    
    console.log("✅ Gmail configuration reset successfully!");
    console.log("\n📋 Reset Fields:");
    Object.keys(resetData).forEach(field => {
      console.log(`   ${field}: ${resetData[field]}`);
    });
    
    console.log("\n🎯 Next Steps:");
    console.log("   1. The user will need to re-authenticate with Gmail");
    console.log("   2. Go to the app and try to configure Gmail again");
    console.log("   3. The user should see a 'Configure Gmail' option");
    
  } catch (error) {
    console.error("❌ Error resetting Gmail configuration:", error);
    console.error("Error details:", error.message);
  }
}

// Function to list all users with Gmail configuration issues
async function listUsersWithGmailIssues() {
  try {
    console.log("🔍 Scanning for users with Gmail configuration issues...");
    
    const usersRef = db.collection("users");
    const usersSnapshot = await usersRef.get();
    
    const usersWithIssues = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const hasGmailConfig = userData.gmail_configured || false;
      const hasAccessToken = !!userData.gmail_access_token;
      const hasRefreshToken = !!userData.gmail_refresh_token;
      const tokenExpiry = userData.gmail_token_expiry;
      const isExpired = tokenExpiry && new Date(tokenExpiry) < new Date();
      
      // Check for various issues
      if (hasGmailConfig && (!hasAccessToken || !hasRefreshToken)) {
        usersWithIssues.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          issue: "Configured but missing tokens"
        });
      } else if (hasGmailConfig && isExpired) {
        usersWithIssues.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          issue: "Expired tokens"
        });
      } else if (userData.gmail_last_error) {
        usersWithIssues.push({
          id: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          issue: `Error: ${userData.gmail_last_error}`
        });
      }
    });
    
    if (usersWithIssues.length === 0) {
      console.log("✅ No users with Gmail configuration issues found");
    } else {
      console.log(`\n⚠️  Found ${usersWithIssues.length} users with Gmail issues:`);
      usersWithIssues.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Name: ${user.displayName || 'N/A'}`);
        console.log(`   Issue: ${user.issue}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error scanning users:", error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--list') || args.includes('-l')) {
    await listUsersWithGmailIssues();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log("🔧 Gmail Configuration Reset Tool");
    console.log("=" .repeat(40));
    console.log("\nUsage:");
    console.log("  node reset-gmail-config.js [userId]");
    console.log("  node reset-gmail-config.js --list");
    console.log("  node reset-gmail-config.js --help");
    console.log("\nOptions:");
    console.log("  userId          Reset Gmail config for specific user ID");
    console.log("  --list, -l      List all users with Gmail configuration issues");
    console.log("  --help, -h      Show this help message");
  } else {
    const userId = args[0] || null;
    await resetGmailConfig(userId);
  }
}

// Run the main function
main().then(() => {
  console.log("\n✅ Script completed");
  process.exit(0);
}).catch(error => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
