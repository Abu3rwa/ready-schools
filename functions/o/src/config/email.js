// Get email configuration for production
const getEmailConfig = () => {
  try {
    // Get credentials from environment variables (set by Cloud Functions from secrets)
    const email = process.env.SMTP_EMAIL || "abdulhafeez.alameen@amly.us";
    const password = process.env.SMTP_PASSWORD || "xgwv lchq wfvb enfz";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUrl = process.env.APP_URL
      ? `${process.env.APP_URL}/auth/gmail/callback`
      : null;

    // Return both SMTP and OAuth configs
    return {
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
