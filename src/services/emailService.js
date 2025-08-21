// Unified service: delegate to gmailService to avoid duplication of OAuth handlers
import { gmailService } from './gmailService';

// Backwards-compatible exports for any legacy imports
export const initiateGmailAuth = (...args) => gmailService.initiateGmailAuth(...args);
export const handleGmailCallback = (...args) => gmailService.handleGmailCallback(...args);
export const getGmailTokens = (...args) => gmailService.getGmailTokens(...args);
export const sendEmail = (...args) => gmailService.sendEmail(...args);
export const clearGmailError = (...args) => gmailService.clearGmailError(...args);
export const checkHealth = (...args) => gmailService.checkHealth(...args);

// Default export for consumers expecting emailService
const emailService = gmailService;
export default emailService;