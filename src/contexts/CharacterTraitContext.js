import { createContext, useContext, useState, useEffect, useCallback } from 'react';
 import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useStudents } from './StudentContext';
import { getCurrentMonthTrait } from '../services/characterTraitService';

// Create Context
const CharacterTraitContext = createContext();

// Custom hook to use the context
export const useCharacterTrait = () => {
  const context = useContext(CharacterTraitContext);
  if (!context) {
    throw new Error('useCharacterTrait must be used within a CharacterTraitProvider');
  }
  return context;
};

// Provider Component
export const CharacterTraitProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { students } = useStudents();

  // State management
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());
  const [currentMonthTrait, setCurrentMonthTrait] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [assessmentStatus, setAssessmentStatus] = useState({});
  const [yesterdayContent, setYesterdayContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalAssessments: 0,
    averageClassScore: 0,
    topPerformer: null
  });

  // Real-time listeners cleanup
  useEffect(() => {
    let unsubscribeAssessments = null;
    let unsubscribeLeaderboard = null;

    if (currentUser?.uid && currentMonth) {
      console.log('🔥 Setting up Firebase listeners...');
      console.log('👤 User ID:', currentUser.uid);
      console.log('📅 Current month:', currentMonth);
      console.log('🔍 Query will search for documents with userId:', currentUser.uid, 'and month:', currentMonth);
      
      // Subscribe to assessments for current month
      const assessmentsRef = collection(db, 'characterTraitAssessments');
      const assessmentsQuery = query(
        assessmentsRef,
        where('userId', '==', currentUser.uid),
        where('month', '==', currentMonth),
        orderBy('assessmentDate', 'desc')
      );

      console.log('🔍 Assessment query setup complete');
      console.log('🔍 Query details:', {
        collection: 'characterTraitAssessments',
        userId: currentUser.uid,
        month: currentMonth
      });

      unsubscribeAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
        console.log('🔥 Firebase listener triggered - assessments snapshot received');
        console.log('📊 Snapshot size:', snapshot.size);
        console.log('📊 Snapshot empty:', snapshot.empty);
        
        const assessmentData = [];
        snapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          console.log('📝 Assessment doc:', data);
          assessmentData.push(data);
        });
        
        console.log('🛠️ Total assessments loaded:', assessmentData.length);
        setAssessments(assessmentData);
        updateAssessmentStatus(assessmentData);
        calculateLeaderboard(assessmentData);
      }, (error) => {
        console.error('❌ Firebase listener error:', error);
      });

      // Subscribe to monthly leaderboard
      const leaderboardRef = collection(db, 'monthlyLeaderboards');
      const leaderboardQuery = query(
        leaderboardRef,
        where('userId', '==', currentUser.uid),
        where('month', '==', currentMonth)
      );

      unsubscribeLeaderboard = onSnapshot(leaderboardQuery, (snapshot) => {
        console.log('🏆 Leaderboard listener triggered:', snapshot.size, 'documents');
        if (!snapshot.empty) {
          const leaderboardDoc = snapshot.docs[0];
          const data = leaderboardDoc.data();
          console.log('🏆 Leaderboard data:', data);
          // Only apply remote rankings if present and non-empty to avoid overwriting fresh local calculations
          if (Array.isArray(data.rankings) && data.rankings.length > 0) {
            setLeaderboard(data.rankings);
          } else {
            console.log('ℹ️ Remote leaderboard has no rankings; keeping current in-memory leaderboard');
          }
          setMonthlyStats({
            totalAssessments: data.totalAssessments || 0,
            averageClassScore: data.averageClassScore || 0,
            topPerformer: data.topPerformer || null
          });
        } else {
          console.log('🏆 No leaderboard data found for current month');
        }
      }, (error) => {
        console.error('❌ Leaderboard listener error:', error);
      });
    }

    // Cleanup function
    return () => {
      if (unsubscribeAssessments) unsubscribeAssessments();
      if (unsubscribeLeaderboard) unsubscribeLeaderboard();
    };
  }, [currentUser?.uid, currentMonth]);

  /**
   * Calculate leaderboard rankings with animations
   */
  const calculateLeaderboard = useCallback((assessmentData) => {
    if (!students.length) {
      return;
    }

    const rankings = students.map(student => {
      const studentAssessments = assessmentData.filter(a => a.studentId === student.id);
      
      const totalStars = studentAssessments.reduce((sum, assessment) => {
        return sum + (assessment.starRating || assessment.totalScore || 0);
      }, 0);
      
      const assessmentCount = studentAssessments.length;
      const averageScore = assessmentCount > 0 ? totalStars / assessmentCount : 0;

      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        studentImage: student.photoURL || null,
        totalStars,
        assessmentCount,
        averageScore: Math.round(averageScore * 100) / 100,
        previousRank: 0 // Will be updated with animation logic
      };
    });

    // Sort by total stars, then by assessment count, then by average score
    rankings.sort((a, b) => {
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
      if (b.assessmentCount !== a.assessmentCount) return b.assessmentCount - a.assessmentCount;
      return b.averageScore - a.averageScore;
    });

    // Update leaderboard with rank assignments
    setLeaderboard(prevLeaderboard => {
      // Assign ranks and track previous positions for animations
      rankings.forEach((student, index) => {
        student.rank = index + 1;
        
        // Find previous rank for animation
        const previousEntry = prevLeaderboard.find(p => p.studentId === student.studentId);
        student.previousRank = previousEntry ? previousEntry.rank : student.rank;
        student.rankChange = previousEntry ? previousEntry.rank - student.rank : 0;
      });
      
      return rankings;
    });
    
    // Update monthly statistics
    const totalAssessments = assessmentData.length;
    const averageClassScore = rankings.length > 0 
      ? rankings.reduce((sum, r) => sum + r.averageScore, 0) / rankings.length 
      : 0;
    const topPerformer = rankings.length > 0 ? rankings[0].studentId : null;
    
    const stats = {
      totalAssessments,
      averageClassScore: Math.round(averageClassScore * 100) / 100,
      topPerformer
    };
    
    setMonthlyStats(stats);

    // Save to Firestore for persistence
    saveLeaderboardToFirestore(rankings, stats);
  }, [students]); // Removed leaderboard from dependencies to avoid stale closure

  // Expose refresh function globally for immediate updates
  useEffect(() => {
    const forceRefresh = () => {
      if (assessments.length > 0) {
        calculateLeaderboard(assessments);
      }
    };
    
    window.refreshCharacterLeaderboard = forceRefresh;
    
    return () => {
      delete window.refreshCharacterLeaderboard;
    };
  }, [assessments, calculateLeaderboard]);

  // Trigger leaderboard calculation when both assessments and students are available
  useEffect(() => {
    if (assessments.length > 0 && students.length > 0) {
      calculateLeaderboard(assessments);
    }
  }, [assessments, students, calculateLeaderboard]);

  // Fetch current month's character trait
  useEffect(() => {
    const fetchCurrentTrait = async () => {
      if (currentUser?.uid) {
        try {
          const trait = await getCurrentMonthTrait(currentUser.uid);
          setCurrentMonthTrait(trait);
        } catch (error) {
          console.error('Error fetching current month trait:', error);
          setCurrentMonthTrait(null);
        }
      }
    };
    
    fetchCurrentTrait();
  }, [currentUser?.uid]);

  /**
   * Get current month in YYYY-MM format
   */
  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Load yesterday's content from email records
   */
  const loadYesterdayContent = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      // Calculate yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Query yesterday's emails with character trait content
      const emailsRef = collection(db, 'dailyUpdateEmails');
      const q = query(
        emailsRef,
        where('userId', '==', currentUser.uid),
        where('date', '==', yesterdayStr),
        where('sentStatus', '==', 'sent')
      );
      
      const emailsSnapshot = await getDocs(q);
      const contentMap = {};
      
      emailsSnapshot.forEach((doc) => {
        const emailData = doc.data();
        
        if (emailData.studentId) {
          contentMap[emailData.studentId] = {
            quote: emailData.characterTraitQuote || '',
            challenge: emailData.characterTraitChallenge || '',
            characterTrait: emailData.characterTrait || 'Character Development',
            studentName: emailData.studentName || '',
            emailDate: yesterdayStr,
            emailId: doc.id
          };
        }
      });
      
      // If no email content found, create sample content for testing
      if (Object.keys(contentMap).length === 0 && students.length > 0) {
        const sampleQuotes = [
          "Success is not final, failure is not fatal: it is the courage to continue that counts.",
          "The only way to do great work is to love what you do.",
          "Believe you can and you're halfway there.",
          "It does not matter how slowly you go as long as you do not stop.",
          "The future belongs to those who believe in the beauty of their dreams.",
          "In the middle of difficulty lies opportunity.",
          "The only impossible journey is the one you never begin.",
          "What lies behind us and what lies before us are tiny matters compared to what lies within us."
        ];
        
        const sampleChallenges = [
          "Practice kindness by helping someone without expecting anything in return.",
          "Show perseverance by not giving up on a difficult task today.",
          "Demonstrate respect by listening carefully to others without interrupting.",
          "Take responsibility by admitting a mistake and working to fix it.",
          "Display courage by standing up for what is right, even when it's difficult.",
          "Show gratitude by thanking someone who has helped you.",
          "Practice patience by staying calm in a challenging situation.",
          "Demonstrate honesty by telling the truth, even when it's hard."
        ];
        
        students.forEach((student, index) => {
          contentMap[student.id] = {
            quote: sampleQuotes[index % sampleQuotes.length],
            challenge: sampleChallenges[index % sampleChallenges.length],
            characterTrait: currentMonthTrait?.name || 'Character Development',
            studentName: `${student.firstName} ${student.lastName}`,
            emailDate: yesterdayStr,
            emailId: `sample_${student.id}`
          };
        });
      }
      
      setYesterdayContent(contentMap);
      console.log('📧 Loaded yesterday\'s content:', Object.keys(contentMap).length, 'students');
      
    } catch (error) {
      console.error('Error loading yesterday\'s content:', error);
      
      // Fallback to sample content on error
      if (students.length > 0) {
        const fallbackContent = {};
        students.forEach(student => {
          fallbackContent[student.id] = {
            quote: "Every day is a new opportunity to grow and learn!",
            challenge: "Try something new today that makes you curious!",
            characterTrait: currentMonthTrait?.name || 'Character Development',
            studentName: `${student.firstName} ${student.lastName}`,
            emailDate: new Date().toISOString().split('T')[0],
            emailId: `fallback_${student.id}`
          };
        });
        setYesterdayContent(fallbackContent);
      }
    }
  }, [currentUser?.uid, students, currentMonthTrait]);

  // Load yesterday's content when students or user changes
  useEffect(() => {
    if (currentUser?.uid && students.length > 0) {
      loadYesterdayContent();
    }
  }, [currentUser?.uid, students.length, loadYesterdayContent]);

  /**
   * Update assessment status based on current assessments
   */
  const updateAssessmentStatus = useCallback((assessmentData) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAssessments = assessmentData.filter(a => a.assessmentDate === today);
    
    const status = {};
    students.forEach(student => {
      const hasAssessment = todayAssessments.some(a => a.studentId === student.id);
      status[student.id] = {
        assessed: hasAssessment,
        assessment: hasAssessment ? todayAssessments.find(a => a.studentId === student.id) : null
      };
    });
    
    setAssessmentStatus(status);
  }, [students]);

  /**
   * Save leaderboard to Firestore
   */
  const saveLeaderboardToFirestore = async (rankings, stats) => {
    if (!currentUser?.uid) return;

    try {
      const leaderboardRef = collection(db, 'monthlyLeaderboards');
      const q = query(
        leaderboardRef,
        where('userId', '==', currentUser.uid),
        where('month', '==', currentMonth)
      );
      
      const snapshot = await getDocs(q);
      
      const leaderboardData = {
        userId: currentUser.uid,
        month: currentMonth,
        rankings,
        ...stats,
        lastUpdated: serverTimestamp()
      };

      if (snapshot.empty) {
        // Create new leaderboard document
        await addDoc(leaderboardRef, {
          ...leaderboardData,
          createdAt: serverTimestamp()
        });
      } else {
        // Update existing leaderboard document
        const docRef = doc(db, 'monthlyLeaderboards', snapshot.docs[0].id);
        await updateDoc(docRef, leaderboardData);
      }
    } catch (error) {
      console.error('Error saving leaderboard:', error);
    }
  };

  /**
   * Get today's assessments for loading existing ratings
   */
  const getTodaysAssessments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return assessments.filter(a => a.assessmentDate === today);
  }, [assessments]);

  /**
   * Set student content (for manual input)
   */
  const setStudentContent = useCallback((studentId, quote, challenge, characterTrait) => {
    setYesterdayContent(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        quote: quote || '',
        challenge: challenge || '',
        characterTrait: characterTrait || 'Character Development'
      }
    }));
  }, []);

  /**
   * Assess a student with star rating (1-5 stars)
   */
  const assessStudent = async (studentId, starRating, notes = '') => {
    if (!currentUser?.uid) {
      console.error('No user authenticated');
      return;
    }

    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        throw new Error('Student not found');
      }

      const assessment = {
        userId: currentUser.uid,
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        assessmentDate: today,
        month: currentMonth,
        starRating: starRating, // 1-5 stars
        totalScore: starRating,
        notes: notes || '',
        assessedBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Check if assessment already exists for today
      const existingAssessment = assessments.find(a => 
        a.studentId === studentId && a.assessmentDate === today
      );

      if (existingAssessment) {
        // Update existing assessment
        const docRef = doc(db, 'characterTraitAssessments', existingAssessment.id);
        await updateDoc(docRef, {
          starRating: starRating,
          totalScore: starRating,
          notes: notes || '',
          updatedAt: serverTimestamp()
        });
        // Optimistically update local state for immediate UI feedback
        setAssessments(prev => prev.map(a => (
          a.id === existingAssessment.id ? { ...a, starRating, totalScore: starRating, notes } : a
        )));
      } else {
        // Create new assessment
        const docRef = await addDoc(collection(db, 'characterTraitAssessments'), assessment);
        // Optimistically add to local state
        setAssessments(prev => [
          { ...assessment, id: docRef.id },
          ...prev
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error assessing student:', {
        error: error.message,
        code: error.code,
        details: error,
        studentId,
        starRating,
        userId: currentUser?.uid
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get content for a specific date (simplified - students always ready)
   */
  const getContentForDate = async (date) => {
    // Students are always ready for assessment
    return yesterdayContent;
  };

  /**
   * Refresh leaderboard data
   */
  const refreshLeaderboard = useCallback(async () => {
    if (assessments.length > 0) {
      calculateLeaderboard(assessments);
    }
  }, [assessments, calculateLeaderboard]);

  /**
   * Get student's monthly performance
   */
  const getStudentPerformance = useCallback((studentId) => {
    const student = leaderboard.find(s => s.studentId === studentId);
    if (!student) return null;

    const studentAssessments = assessments.filter(a => a.studentId === studentId);
    
    return {
      ...student,
      recentAssessments: studentAssessments.slice(0, 7), // Last 7 assessments
      consistency: studentAssessments.length > 0 
        ? (studentAssessments.length / getDaysInMonth()) * 100 
        : 0,
      improvement: calculateImprovement(studentAssessments)
    };
  }, [leaderboard, assessments]);

  /**
   * Calculate improvement trend
   */
  const calculateImprovement = (studentAssessments) => {
    if (studentAssessments.length < 2) return 0;
    
    const recent = studentAssessments.slice(0, 3);
    const older = studentAssessments.slice(-3);
    
    const recentAvg = recent.reduce((sum, a) => sum + a.totalScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + a.totalScore, 0) / older.length;
    
    return recentAvg - olderAvg;
  };

  /**
   * Get number of days in current month
   */
  const getDaysInMonth = () => {
    const [year, month] = currentMonth.split('-');
    return new Date(year, month, 0).getDate();
  };

  // Context value
  const value = {
    // State
    currentMonth,
    currentMonthTrait,
    leaderboard,
    assessmentStatus,
    yesterdayContent,
    loading,
    assessments,
    monthlyStats,
    user: currentUser, // Add for backward compatibility

    // Actions
    assessStudent,
    loadYesterdayContent,
    getContentForDate,
    refreshLeaderboard,
    setCurrentMonth,
    getStudentPerformance,
    setStudentContent,
    getTodaysAssessments,

    // Utilities
    getCurrentMonth,
    getDaysInMonth
  };

  return (
    <CharacterTraitContext.Provider value={value}>
      {children}
    </CharacterTraitContext.Provider>
  );
};

export default CharacterTraitContext;