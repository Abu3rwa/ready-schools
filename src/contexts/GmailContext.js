import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
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

// Gmail status enum for better state management
export const GMAIL_STATUS = {
  UNCONFIGURED: 'unconfigured',
  CONFIGURING: 'configuring',
  CONFIGURED: 'configured',
  ERROR: 'error',
  TOKEN_EXPIRED: 'token_expired',
  CHECKING: 'checking',
  DISMISSED: 'dismissed'
};

// Error types for better error handling
export const GMAIL_ERRORS = {
  AUTHENTICATION_FAILED: 'authentication_failed',
  TOKEN_EXPIRED: 'token_expired',
  NETWORK_ERROR: 'network_error',
  QUOTA_EXCEEDED: 'quota_exceeded',
  CONFIGURATION_ERROR: 'configuration_error',
  UNKNOWN_ERROR: 'unknown_error'
};

export const GmailProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(GMAIL_STATUS.CHECKING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  
  // Refs to prevent concurrent operations
  const operationInProgress = useRef(false);
  const checkTimeoutRef = useRef(null);

  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Classify error type for better handling
  const classifyError = useCallback((error) => {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
      return GMAIL_ERRORS.TOKEN_EXPIRED;
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return GMAIL_ERRORS.AUTHENTICATION_FAILED;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return GMAIL_ERRORS.NETWORK_ERROR;
    }
    if (message.includes('quota') || message.includes('limit')) {
      return GMAIL_ERRORS.QUOTA_EXCEEDED;
    }
    if (message.includes('config')) {
      return GMAIL_ERRORS.CONFIGURATION_ERROR;
    }
    
    return GMAIL_ERRORS.UNKNOWN_ERROR;
  }, []);

  // Enhanced error handling with recovery suggestions
  const handleError = useCallback((error, context = '') => {
    const errorType = classifyError(error);
    const enhancedError = {
      type: errorType,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      canRetry: [GMAIL_ERRORS.NETWORK_ERROR, GMAIL_ERRORS.UNKNOWN_ERROR].includes(errorType),
      requiresReauth: [GMAIL_ERRORS.AUTHENTICATION_FAILED, GMAIL_ERRORS.TOKEN_EXPIRED].includes(errorType)
    };

    setError(enhancedError);
    
    // Auto-update status based on error type
    if (enhancedError.requiresReauth) {
      setStatus(GMAIL_STATUS.TOKEN_EXPIRED);
    } else {
      setStatus(GMAIL_STATUS.ERROR);
    }

    console.error(`Gmail ${context} error:`, enhancedError);
  }, [classifyError]);

  // Clear error and reset to appropriate state
  const clearError = useCallback(() => {
    setError(null);
    if (status === GMAIL_STATUS.ERROR || status === GMAIL_STATUS.TOKEN_EXPIRED) {
      setStatus(GMAIL_STATUS.UNCONFIGURED);
    }
  }, [status]);

  // Enhanced configuration check with caching
  const checkGmailConfiguration = useCallback(async (forceRefresh = false) => {
    if (!currentUser) {
      setStatus(GMAIL_STATUS.UNCONFIGURED);
      setTokenInfo(null);
      return false;
    }

    // Prevent concurrent checks
    if (operationInProgress.current && !forceRefresh) {
      return status === GMAIL_STATUS.CONFIGURED;
    }

    // Use cached result if recent (within 5 minutes) and not forcing refresh
    const cacheValid = lastChecked && (Date.now() - lastChecked) < 300000;
    if (cacheValid && !forceRefresh) {
      return status === GMAIL_STATUS.CONFIGURED;
    }

    operationInProgress.current = true;
    setStatus(GMAIL_STATUS.CHECKING);
    clearError();

    try {
      const tokens = await gmailService.getGmailTokens(currentUser.uid);
      const isConfigured = !!(tokens && (tokens.accessToken || tokens.refreshToken));
      
      if (isConfigured) {
        setStatus(GMAIL_STATUS.CONFIGURED);
        setTokenInfo({
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
          expiryTime: tokens.expiryTime,
          isExpired: tokens.expiryTime && Date.now() >= tokens.expiryTime
        });
        
        // If token is expired, update status accordingly
        if (tokens.expiryTime && Date.now() >= tokens.expiryTime) {
          setStatus(GMAIL_STATUS.TOKEN_EXPIRED);
        }
      } else {
        setStatus(GMAIL_STATUS.UNCONFIGURED);
        setTokenInfo(null);
      }
      
      setLastChecked(Date.now());
      return isConfigured;
    } catch (error) {
      handleError(error, 'configuration check');
      return false;
    } finally {
      operationInProgress.current = false;
    }
  }, [currentUser, status, lastChecked, handleError, clearError]);

  // Auto-check configuration when user changes
  useEffect(() => {
    if (currentUser) {
      checkGmailConfiguration();
    } else {
      setStatus(GMAIL_STATUS.UNCONFIGURED);
      setTokenInfo(null);
      setError(null);
    }
  }, [currentUser, checkGmailConfiguration]);

  // Enhanced Gmail setup with proper state management
  const setupGmail = useCallback(async () => {
    if (loading || operationInProgress.current) {
      return;
    }

    setLoading(true);
    setStatus(GMAIL_STATUS.CONFIGURING);
    clearError();
    operationInProgress.current = true;

    try {
      // Clear any existing Gmail errors first
      if (currentUser) {
        await gmailService.clearGmailError(currentUser.uid);
      }
      
      await gmailService.initiateGmailAuth();
      // Note: actual status update will happen in handleGmailCallback
    } catch (error) {
      handleError(error, 'setup');
      setStatus(GMAIL_STATUS.ERROR);
    } finally {
      setLoading(false);
      operationInProgress.current = false;
    }
  }, [currentUser, loading, handleError, clearError]);

  // Enhanced OAuth callback handling
  const handleGmailCallback = useCallback(async (code, state) => {
    setLoading(true);
    setStatus(GMAIL_STATUS.CONFIGURING);
    clearError();

    try {
      await gmailService.handleGmailCallback(code, state);
      setStatus(GMAIL_STATUS.CONFIGURED);
      
      // Refresh configuration to get latest token info
      setTimeout(() => checkGmailConfiguration(true), 1000);
    } catch (error) {
      handleError(error, 'OAuth callback');
      setStatus(GMAIL_STATUS.ERROR);
    } finally {
      setLoading(false);
    }
  }, [handleError, clearError, checkGmailConfiguration]);

  // Enhanced email sending with retry logic
  const sendEmail = useCallback(async (to, subject, body, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      // Check if we need to refresh configuration first
      if (status === GMAIL_STATUS.TOKEN_EXPIRED || status === GMAIL_STATUS.UNCONFIGURED) {
        throw new Error('Gmail not properly configured. Please re-authenticate.');
      }

      const result = await gmailService.sendEmail(to, subject, body);
      
      // Clear any previous errors on success
      if (error) {
        clearError();
      }
      
      return result;
    } catch (emailError) {
      const errorType = classifyError(emailError);
      
      // Retry for certain error types
      if (retryCount < maxRetries && [GMAIL_ERRORS.NETWORK_ERROR, GMAIL_ERRORS.UNKNOWN_ERROR].includes(errorType)) {
        console.log(`Retrying email send (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return sendEmail(to, subject, body, retryCount + 1);
      }
      
      // If authentication error, trigger re-check
      if (errorType === GMAIL_ERRORS.TOKEN_EXPIRED || errorType === GMAIL_ERRORS.AUTHENTICATION_FAILED) {
        checkGmailConfiguration(true);
      }
      
      handleError(emailError, 'send email');
      throw emailError;
    }
  }, [status, error, clearError, classifyError, handleError, checkGmailConfiguration]);

  // Periodic health check (every 10 minutes when configured)
  useEffect(() => {
    if (status === GMAIL_STATUS.CONFIGURED) {
      const healthCheck = setInterval(() => {
        checkGmailConfiguration(false);
      }, 10 * 60 * 1000); // 10 minutes

      return () => clearInterval(healthCheck);
    }
  }, [status, checkGmailConfiguration]);

  // Computed properties for UI
  const isConfigured = status === GMAIL_STATUS.CONFIGURED;
  const shouldPrompt = [GMAIL_STATUS.UNCONFIGURED, GMAIL_STATUS.TOKEN_EXPIRED].includes(status) && status !== GMAIL_STATUS.DISMISSED;
  const canRetry = error?.canRetry || false;
  const requiresReauth = error?.requiresReauth || status === GMAIL_STATUS.TOKEN_EXPIRED;

  const value = {
    // Status
    status,
    isConfigured,
    shouldPrompt,
    loading,
    error,
    tokenInfo,
    lastChecked,
    
    // Computed flags
    canRetry,
    requiresReauth,
    
    // Actions
    setupGmail,
    handleGmailCallback,
    sendEmail,
    checkGmailConfiguration,
    clearError,
    
    // Constants for consumers
    GMAIL_STATUS,
    GMAIL_ERRORS
  };

  return (
    <GmailContext.Provider value={value}>{children}</GmailContext.Provider>
  );
};