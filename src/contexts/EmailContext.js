import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { dailyUpdateService } from "../services/dailyUpdateService";
import { saveDailyUpdateEmail } from "../services/dailyUpdateEmailService";

// Initial state
const initialState = {
  // Email sending state
  sending: false,
  progress: null,

  // Email history
  emailHistory: [],
  loadingHistory: false,

  // Daily updates
  dailyUpdateData: null,
  loadingDailyUpdates: false,

  // Error handling
  error: null,

  // Success messages
  successMessage: null,
};

// Action types
const EMAIL_ACTIONS = {
  SET_SENDING: "SET_SENDING",
  SET_PROGRESS: "SET_PROGRESS",
  SET_EMAIL_HISTORY: "SET_EMAIL_HISTORY",
  SET_LOADING_HISTORY: "SET_LOADING_HISTORY",
  SET_DAILY_UPDATE_DATA: "SET_DAILY_UPDATE_DATA",
  SET_LOADING_DAILY_UPDATES: "SET_LOADING_DAILY_UPDATES",
  SET_ERROR: "SET_ERROR",
  SET_SUCCESS_MESSAGE: "SET_SUCCESS_MESSAGE",
  CLEAR_ERROR: "CLEAR_ERROR",
  CLEAR_SUCCESS: "CLEAR_SUCCESS",
  ADD_EMAIL_TO_HISTORY: "ADD_EMAIL_TO_HISTORY",
};

// Reducer
const emailReducer = (state, action) => {
  switch (action.type) {
    case EMAIL_ACTIONS.SET_SENDING:
      return {
        ...state,
        sending: action.payload,
      };

    case EMAIL_ACTIONS.SET_PROGRESS:
      return {
        ...state,
        progress: action.payload,
      };

    case EMAIL_ACTIONS.SET_EMAIL_HISTORY:
      return {
        ...state,
        emailHistory: action.payload,
      };

    case EMAIL_ACTIONS.SET_LOADING_HISTORY:
      return {
        ...state,
        loadingHistory: action.payload,
      };

    case EMAIL_ACTIONS.SET_DAILY_UPDATE_DATA:
      return {
        ...state,
        dailyUpdateData: action.payload,
      };

    case EMAIL_ACTIONS.SET_LOADING_DAILY_UPDATES:
      return {
        ...state,
        loadingDailyUpdates: action.payload,
      };

    case EMAIL_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        successMessage: null,
      };

    case EMAIL_ACTIONS.SET_SUCCESS_MESSAGE:
      return {
        ...state,
        successMessage: action.payload,
        error: null,
      };

    case EMAIL_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case EMAIL_ACTIONS.CLEAR_SUCCESS:
      return {
        ...state,
        successMessage: null,
      };

    case EMAIL_ACTIONS.ADD_EMAIL_TO_HISTORY:
      return {
        ...state,
        emailHistory: [action.payload, ...state.emailHistory],
      };

    default:
      return state;
  }
};

// Create context
const EmailContext = createContext();

// Provider component
export const EmailProvider = ({ children }) => {
  const [state, dispatch] = useReducer(emailReducer, initialState);

  // Action creators
  const setSending = useCallback((sending) => {
    dispatch({ type: EMAIL_ACTIONS.SET_SENDING, payload: sending });
  }, []);

  const setProgress = useCallback((progress) => {
    dispatch({ type: EMAIL_ACTIONS.SET_PROGRESS, payload: progress });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: EMAIL_ACTIONS.SET_ERROR, payload: error });
  }, []);

  const setSuccessMessage = useCallback((message) => {
    dispatch({ type: EMAIL_ACTIONS.SET_SUCCESS_MESSAGE, payload: message });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: EMAIL_ACTIONS.CLEAR_ERROR });
  }, []);

  const clearSuccess = useCallback(() => {
    dispatch({ type: EMAIL_ACTIONS.CLEAR_SUCCESS });
  }, []);

  const addEmailToHistory = useCallback((email) => {
    dispatch({ type: EMAIL_ACTIONS.ADD_EMAIL_TO_HISTORY, payload: email });
  }, []);

  // Email operations
  const sendDailyUpdates = useCallback(
    async (contexts, date = new Date()) => {
      setSending(true);
      setError(null);

      try {
        const result = await dailyUpdateService.sendDailyUpdatesWithProgress(
          contexts,
          date,
          (progressData) => {
            setProgress(progressData);
          }
        );

        if (result.success) {
          // Extract the emailsSent count directly from the result data
          const emailsSentCount = result.data?.emailsSent || 0;
          setSuccessMessage(
            `Daily updates sent successfully! ${emailsSentCount} emails sent.`
          );

          // Save each email to the frontend and database
          if (result.data?.savedEmails?.length > 0) {
            for (const emailData of result.data.savedEmails) {
              try {
                // Save to database
                const emailToSave = {
                  studentId: emailData.studentId,
                  date: emailData.date,
                  subject: emailData.subject,
                  content: emailData.content,
                  sentStatus: emailData.sentStatus || 'Sent',
                  type: emailData.type || 'daily_update',
                  attendance: emailData.attendance,
                  grades: emailData.grades,
                  behavior: emailData.behavior,
                  assignments: emailData.assignments,
                  classwork: emailData.classwork || [],
                  homework: emailData.homework || [],
                  upcomingAssignments: emailData.upcomingAssignments || [],
                  metadata: emailData.metadata
                };
                
                await saveDailyUpdateEmail(emailToSave);
                
                // Add to email history
                const emailRecord = {
                  id: Date.now() + Math.random(),
                  type: "Daily Update",
                  subject: emailData.subject,
                  recipients: 1,
                  status: "Sent",
                  date: new Date(emailData.date),
                  details: emailData,
                };
                addEmailToHistory(emailRecord);
              } catch (saveError) {
                console.error('Error saving email to history:', saveError);
              }
            }
          }

          return result;
        } else {
          setError(result.error || "Failed to send daily updates");
          return result;
        }
      } catch (error) {
        setError(
          error.message || "An error occurred while sending daily updates"
        );
        throw error;
      } finally {
        setSending(false);
        setProgress(null);
      }
    },
    [setSending, setError, setSuccessMessage, setProgress, addEmailToHistory]
  );

  const sendStudentDailyUpdate = useCallback(
    async (studentId, contexts, date = new Date()) => {
      setSending(true);
      setError(null);

      try {
        const result = await dailyUpdateService.sendDailyUpdateForStudent(
          studentId,
          contexts,
          date
        );

        if (result.success) {
          setSuccessMessage(
            `Daily update sent successfully to ${
              result.data?.studentName || "student"
            }`
          );

          // Add to email history
          const emailRecord = {
            id: Date.now(),
            type: "Student Daily Update",
            subject: `Daily Update - ${result.data?.studentName || "Student"}`,
            recipients: result.data?.parentEmails?.length || 0,
            status: "Sent",
            date: new Date(),
            details: result.data,
          };
          addEmailToHistory(emailRecord);

          return result;
        } else {
          setError(result.error || "Failed to send student daily update");
          return result;
        }
      } catch (error) {
        setError(
          error.message ||
            "An error occurred while sending student daily update"
        );
        throw error;
      } finally {
        setSending(false);
      }
    },
    [setSending, setError, setSuccessMessage, addEmailToHistory]
  );

  const previewDailyUpdates = useCallback(
    async (contexts, date = new Date()) => {
      dispatch({
        type: EMAIL_ACTIONS.SET_LOADING_DAILY_UPDATES,
        payload: true,
      });
      setError(null);

      try {
        const result = await dailyUpdateService.previewAllDailyUpdates(
          contexts,
          date
        );

        if (result.success) {
          dispatch({
            type: EMAIL_ACTIONS.SET_DAILY_UPDATE_DATA,
            payload: result.data  // Use result.data directly since it already contains dailyUpdates and classSummary
          });
          return result;
        } else {
          setError(result.error || "Failed to load daily update preview");
          return result;
        }
      } catch (error) {
        setError(
          error.message ||
            "An error occurred while loading daily update preview"
        );
        throw error;
      } finally {
        dispatch({
          type: EMAIL_ACTIONS.SET_LOADING_DAILY_UPDATES,
          payload: false,
        });
      }
    },
    [setError]
  );

  const previewStudentDailyUpdate = useCallback(
    async (studentId, contexts, date = new Date()) => {
      setError(null);

      try {
        const result = await dailyUpdateService.previewDailyUpdate(
          studentId,
          contexts,
          date
        );

        if (result.success) {
          return result;
        } else {
          setError(
            result.error || "Failed to load student daily update preview"
          );
          return result;
        }
      } catch (error) {
        setError(
          error.message ||
            "An error occurred while loading student daily update preview"
        );
        throw error;
      }
    },
    [setError]
  );

  // Load email history (placeholder for future implementation)
  const loadEmailHistory = useCallback(async () => {
    dispatch({ type: EMAIL_ACTIONS.SET_LOADING_HISTORY, payload: true });

    try {
      // This would typically fetch from a database
      // For now, we'll just use the in-memory history
      const history = state.emailHistory;
      dispatch({ type: EMAIL_ACTIONS.SET_EMAIL_HISTORY, payload: history });
    } catch (error) {
      setError("Failed to load email history");
    } finally {
      dispatch({ type: EMAIL_ACTIONS.SET_LOADING_HISTORY, payload: false });
    }
  }, [state.emailHistory, setError]);

  // Clear daily update data
  const clearDailyUpdateData = useCallback(() => {
    dispatch({ type: EMAIL_ACTIONS.SET_DAILY_UPDATE_DATA, payload: null });
  }, []);

  // Context value
  const value = {
    // State
    ...state,

    // Actions
    sendDailyUpdates,
    sendStudentDailyUpdate,
    previewDailyUpdates,
    previewStudentDailyUpdate,
    loadEmailHistory,
    clearDailyUpdateData,

    // UI actions
    setError,
    setSuccessMessage,
    clearError,
    clearSuccess,
  };

  return (
    <EmailContext.Provider value={value}>{children}</EmailContext.Provider>
  );
};

// Custom hook to use the email context
export const useEmail = () => {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error("useEmail must be used within an EmailProvider");
  }
  return context;
};
