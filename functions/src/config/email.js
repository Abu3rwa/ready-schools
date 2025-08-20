// Get email configuration for production
const getEmailConfig = () => {
  try {
    // Get credentials from environment variables (set by Cloud Functions from secrets)
    const email = process.env.SMTP_EMAIL || "abdulhafeez.alameen@amly.us";
    const password = process.env.SMTP_PASSWORD || "xgwv lchq wfvb enfz";
    // Get Google OAuth2 credentials
    const clientId =
      "610841874714-qid6baodcg3fgt3vijkog0s8hk76c4n5.apps.googleusercontent.com";
    const clientSecret = "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";
    const redirectUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/auth/gmail/callback`
      : null;

    // Return both SMTP and OAuth configs
    return {
      /*
      smtp: {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: email,
          pass: password,
        },
        debug: true, // Enable debug output
      },
      */
      oauth:
        clientId && clientSecret
          ? {
              clientId,
              clientSecret,
              redirectUrl,
              gmailScopes: [
                "https://www.googleapis.com/auth/gmail.send",
                "https://www.googleapis.com/auth/userinfo.email",
              ],
            }
          : null,
    };
  } catch (error) {
    console.error("Email configuration error:", error.message);
    throw new Error("Failed to configure email service: " + error.message);
  }
};

// Export the function directly - no caching at module level
// This ensures no initialization happens during module loading
export default getEmailConfig;
