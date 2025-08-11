// Get email configuration for production
const getEmailConfig = () => {
  try {
    // Get credentials from environment variables (set by Cloud Functions from secrets)
    const email = process.env.SMTP_EMAIL || 'abdulhafeez.alameen@amly.us';
    const password = process.env.SMTP_PASSWORD || 'xgwv lchq wfvb enfz';

    return {
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: email,
        pass: password,
      },
      debug: true // Enable debug output
    };
  } catch (error) {
    console.error("Email configuration error:", error.message);
    throw new Error("Failed to configure email service: " + error.message);
  }
};

// Export the function directly - no caching at module level
// This ensures no initialization happens during module loading
export default getEmailConfig;
