# Email Service Issue Analysis

## 1. Current Implementation

The current email service in `functions/src/services/emailService.js` is designed to send emails using one of two methods:

1.  **Gmail API (OAuth2)**: This is the preferred method, intended for users who have authenticated the application with their Google account. It sends emails on behalf of the user.
2.  **SMTP Fallback**: If the Gmail API method fails or is not available for a user, the system falls back to using a single, shared set of SMTP credentials.

The configuration for both methods is located in `functions/src/config/email.js`. Currently, the SMTP credentials are hardcoded as a fallback.

## 2. The Problem

The primary issue is the use of a single, centralized set of SMTP credentials for all users who do not use the Gmail API. This presents several significant problems:

- **Security Risk**: Storing SMTP credentials directly in the configuration (even if using environment variables) is a security risk. If these credentials are ever compromised, an attacker could gain the ability to send emails from that account, potentially leading to spam, phishing attacks, or other malicious activities.
- **Lack of Sender Identity**: All emails sent via the SMTP fallback appear to come from the same address (e.g., `abdulhafeez.alameen@amly.us`). This means emails are not personalized and do not reflect the actual teacher sending the communication, which can confuse parents.
- **Sending Limits & Reputation**: Using one account for all fallback email traffic runs a high risk of hitting the email provider's sending limits. This could cause email delivery to fail for all users relying on the fallback. Furthermore, if any of this traffic is marked as spam, it will damage the reputation of the sending email address and domain, affecting deliverability for everyone.
- **Scalability Issues**: This approach does not scale. As more teachers use the system, the reliance on a single SMTP account will become a major bottleneck and point of failure.

## 3. Recommended Solution

To address these issues, the system should move away from the shared SMTP fallback and enforce the use of per-user authentication via the Gmail API (OAuth2).

### Proposed Changes:

1.  **Disable SMTP Fallback**: The SMTP transport and fallback logic in `emailService.js` should be removed. The system should be designed to _only_ send emails via the user's authenticated Gmail account.
2.  **Enforce User Authentication**: The application flow should require teachers to authenticate with their Google account before they can send any emails. If a user has not provided consent, the "send email" feature should be disabled for them, with a clear message guiding them to the authentication page.
3.  **Error Handling**: If the Gmail API call fails, the system should not fall back to another method. Instead, it should return a clear error message to the user, allowing them to retry or report the issue. This makes the system's behavior more predictable and secure.

By implementing these changes, the system will be more secure, scalable, and provide a better experience for both teachers and parents, as all communications will correctly originate from the teacher's own email account.
