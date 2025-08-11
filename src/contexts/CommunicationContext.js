import React, { createContext, useState, useEffect, useContext } from "react";
import { getAuth } from "firebase/auth";
import { 
  saveDailyUpdateEmail, 
  getDailyUpdateEmails, 
  updateDailyUpdateEmail, 
  deleteDailyUpdateEmail 
} from "../services/dailyUpdateEmailService";

// Create the context
const CommunicationContext = createContext();

// Create a custom hook to use the communication context
export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error(
      "useCommunication must be used within a CommunicationProvider"
    );
  }
  return context;
};

// Create the provider component
export const CommunicationProvider = ({ children }) => {
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch communications on component mount
  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);
        console.log('Fetching daily update emails...');
        const data = await getDailyUpdateEmails();
        console.log('Fetched emails:', data);
        setCommunications(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);

  // Function to create a new daily update email
  const createCommunication = async (emailData) => {
    try {
      console.log('Creating communication with data:', emailData);
      
      // Format the data for daily update email
      const dailyUpdateData = {
        ...emailData,  // Include all original data
        type: 'daily_update',
        // Add any missing required fields with defaults
        attendance: emailData.attendance || {
          status: 'Present',
          notes: ''
        },
        grades: emailData.grades || [],
        behavior: emailData.behavior || [],
        assignments: emailData.assignments || [],
        classwork: emailData.classwork || [],
        homework: emailData.homework || [],
        upcomingAssignments: emailData.upcomingAssignments || [],
        // Add metadata if not present
        metadata: {
          ...emailData.metadata,
          createdAt: emailData.metadata?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      console.log('Formatted daily update data:', dailyUpdateData);

      const result = await saveDailyUpdateEmail(dailyUpdateData);
      setCommunications(prev => [...prev, result.email]);
      return result.email;
    } catch (error) {
      console.error("Error creating daily update email:", error);
      throw error;
    }
  };

  // Function to update a daily update email
  const updateCommunication = async (emailId, updates) => {
    try {
      const result = await updateDailyUpdateEmail(emailId, updates);
      const updatedCommunications = communications.map((comm) =>
        comm.id === emailId ? { ...comm, ...updates } : comm
      );
      setCommunications(updatedCommunications);
      return result;
    } catch (error) {
      console.error("Error updating daily update email:", error);
      throw error;
    }
  };

  // Function to delete a daily update email
  const deleteCommunication = async (emailId) => {
    try {
      await deleteDailyUpdateEmail(emailId);
      const updatedCommunications = communications.filter(
        (comm) => comm.id !== emailId
      );
      setCommunications(updatedCommunications);
      return true;
    } catch (error) {
      console.error("Error deleting daily update email:", error);
      throw error;
    }
  };

  // Function to get communications for a specific student
  const getCommunicationsByStudent = async (studentId) => {
    try {
      return await getDailyUpdateEmails({ studentId });
    } catch (error) {
      console.error("Error fetching student communications:", error);
      throw error;
    }
  };

  // Function to get communications by status
  const getCommunicationsByStatus = async (status) => {
    try {
      return await getDailyUpdateEmails({ sentStatus: status });
    } catch (error) {
      console.error("Error fetching communications by status:", error);
      throw error;
    }
  };

  // Function to send a draft communication
  const sendCommunication = async (emailId) => {
    try {
      const result = await updateDailyUpdateEmail(emailId, {
        sentStatus: "Sent",
        sentAt: new Date().toISOString()
      });
      
      const updatedCommunications = communications.map((comm) =>
        comm.id === emailId
          ? { ...comm, sentStatus: "Sent", sentAt: new Date().toISOString() }
          : comm
      );

      setCommunications(updatedCommunications);
      return result;
    } catch (error) {
      console.error("Error sending communication:", error);
      throw error;
    }
  };

  // Function to create bulk communications to multiple students
  const createBulkCommunication = async (studentIds, emailTemplate) => {
    try {
      const createdEmails = [];
      for (const studentId of studentIds) {
        const emailData = {
          ...emailTemplate,
          studentId,
          date: new Date().toISOString().split("T")[0]
        };
        const result = await saveDailyUpdateEmail(emailData);
        createdEmails.push(result.email);
      }

      setCommunications([...communications, ...createdEmails]);
      return createdEmails;
    } catch (error) {
      console.error("Error creating bulk communications:", error);
      throw error;
    }
  };

  // Create the value object to be provided by the context
  const value = {
    communications,
    loading,
    error,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    getCommunicationsByStudent,
    getCommunicationsByStatus,
    sendCommunication,
    createBulkCommunication,
  };

  return (
    <CommunicationContext.Provider value={value}>
      {children}
    </CommunicationContext.Provider>
  );
};

export default CommunicationContext;
