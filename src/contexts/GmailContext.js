import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { gmailService } from "../services/gmailService";
import { useAuth } from "./AuthContext";

const GmailContext = createContext();

export const useGmail = () => {
  const context = useContext(GmailContext);
  if (!context) {
    throw new Error("useGmail must be used within a GmailProvider");
  }
  return context;
};

export const GmailProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shouldPrompt, setShouldPrompt] = useState(false);

  // Check configuration when user changes
  useEffect(() => {
    if (currentUser) {
      checkGmailConfiguration();
    } else {
      setIsConfigured(false);
      setShouldPrompt(false);
    }
  }, [currentUser]);

  // Check if Gmail is configured for the user
  const checkGmailConfiguration = useCallback(async () => {
    if (!currentUser) {
      setIsConfigured(false);
      return false;
    }

    try {
      const tokens = await gmailService.getGmailTokens(currentUser.uid);
      const configured = !!(tokens && (tokens.accessToken || tokens.refreshToken));
      setIsConfigured(configured);
      setShouldPrompt(!configured);
      return configured;
    } catch (error) {
      console.error("Error checking Gmail configuration:", error);
      setIsConfigured(false);
      setShouldPrompt(true);
      return false;
    }
  }, [currentUser]);

  // Initialize Gmail configuration
  const setupGmail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Clear any existing Gmail errors first
      if (currentUser) {
        await gmailService.clearGmailError(currentUser.uid);
      }
      await gmailService.initiateGmailAuth();
    } catch (error) {
      setError(error.message);
      console.error("Error setting up Gmail:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Handle OAuth callback
  const handleGmailCallback = useCallback(async (code, state) => {
    setLoading(true);
    setError(null);
    try {
      await gmailService.handleGmailCallback(code, state);
      setIsConfigured(true);
      setShouldPrompt(false);
    } catch (error) {
      setError(error.message);
      console.error("Error handling Gmail callback:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send email using Gmail
  const sendEmail = useCallback(async (to, subject, body) => {
    setLoading(true);
    setError(null);
    try {
      const result = await gmailService.sendEmail(to, subject, body);
      return result;
    } catch (error) {
      setError(error.message);
      console.error("Error sending email:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    isConfigured,
    shouldPrompt,
    loading,
    error,
    setupGmail,
    handleGmailCallback,
    sendEmail,
    checkGmailConfiguration,
    setShouldPrompt,
  };

  return (
    <GmailContext.Provider value={value}>{children}</GmailContext.Provider>
  );
};
