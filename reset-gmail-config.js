/**
 * Utility script to reset Gmail configuration for a specific user
 * This script calls the updated Cloud Function to reset Gmail integration fields
 */

// Function to reset Gmail configuration
async function resetGmailConfig(userId = null) {
  try {
    console.log("🔧 Gmail Configuration Reset Tool");
    console.log("=" .repeat(40));
    
    // If no userId provided, ask for it
    if (!userId) {
      // Use readline for Node.js input instead of browser prompt
      const readline = await import('readline');
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
    
    // Call the Cloud Function using direct HTTP request
    const functionUrl = "https://us-central1-smile3-8c8c5.cloudfunctions.net/resetGmailConfiguration";
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: userId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log("✅ Gmail configuration reset successfully!");
    console.log("Result:", result);
    
    console.log("\n🎯 Next Steps:");
    console.log("   1. The user will need to re-authenticate with Gmail");
    console.log("   2. Go to the app and try to configure Gmail again");
    console.log("   3. The user should see a 'Configure Gmail' option");
    
  } catch (error) {
    console.error("❌ Error resetting Gmail configuration:", error);
    console.error("Error details:", error.message);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log("🔧 Gmail Configuration Reset Tool");
    console.log("=" .repeat(40));
    console.log("\nUsage:");
    console.log("  node reset-gmail-config.js [userId]");
    console.log("  node reset-gmail-config.js --help");
    console.log("\nOptions:");
    console.log("  userId          Reset Gmail config for specific user ID");
    console.log("  --help, -h      Show this help message");
    console.log("\nNote: If no userId is provided, you will be prompted to enter one.");
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