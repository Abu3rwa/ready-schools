import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Leaderboard Calculation Service
 * Handles ranking calculations, real-time updates, and performance analytics
 */
class LeaderboardService {
  constructor() {
    this.listeners = new Map(); // Store active listeners for cleanup
    this.cache = new Map(); // Cache for frequently accessed data
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
  }

  /**
   * Calculate rankings for a specific month
   * @param {string} userId - Teacher's user ID
   * @param {string} month - Month in YYYY-MM format
   * @param {Array} students - Array of student objects
   * @returns {Promise<Array>} - Sorted rankings array
   */
  async calculateRankings(userId, month, students) {
    try {
      // Get all assessments for the month
      const assessmentsRef = collection(db, 'characterTraitAssessments');
      const q = query(
        assessmentsRef,
        where('userId', '==', userId),
        where('month', '==', month),
        orderBy('assessmentDate', 'desc')
      );

      const assessmentsSnapshot = await getDocs(q);
      const assessments = [];
      assessmentsSnapshot.forEach((doc) => {
        assessments.push({ id: doc.id, ...doc.data() });
      });

      // Group assessments by student
      const studentAssessments = {};
      assessments.forEach(assessment => {
        if (!studentAssessments[assessment.studentId]) {
          studentAssessments[assessment.studentId] = [];
        }
        studentAssessments[assessment.studentId].push(assessment);
      });

      // Calculate rankings for each student
      const rankings = students.map(student => {
        const studentData = studentAssessments[student.id] || [];
        
        const totalStars = studentData.reduce((sum, assessment) => {
          return sum + (assessment.quoteScore || 0) + (assessment.challengeScore || 0);
        }, 0);
        
        const quoteStars = studentData.reduce((sum, assessment) => {
          return sum + (assessment.quoteScore || 0);
        }, 0);
        
        const challengeStars = studentData.reduce((sum, assessment) => {
          return sum + (assessment.challengeScore || 0);
        }, 0);
        
        const assessmentCount = studentData.length;
        const averageScore = assessmentCount > 0 ? totalStars / (assessmentCount * 2) : 0; // Max 5 per category

        // Calculate consistency score (percentage of days assessed)
        const daysInMonth = this.getDaysInMonth(month);
        const consistency = (assessmentCount / daysInMonth) * 100;

        // Calculate improvement trend
        const improvement = this.calculateImprovementTrend(studentData);

        // Calculate performance categories
        const performance = this.calculatePerformanceMetrics(studentData);

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          studentImage: student.photoURL || null,
          totalStars,
          quoteStars,
          challengeStars,
          assessmentCount,
          averageScore: Math.round(averageScore * 100) / 100,
          consistency: Math.round(consistency * 100) / 100,
          improvement,
          performance,
          recentActivity: this.getRecentActivity(studentData),
          streaks: this.calculateStreaks(studentData),
          rank: 0, // Will be assigned after sorting
          previousRank: 0, // For animation purposes
          rankChange: 0 // For trend indicators
        };
      });

      // Sort rankings using sophisticated algorithm
      const sortedRankings = this.applySortingAlgorithm(rankings);

      // Assign ranks and calculate rank changes
      sortedRankings.forEach((student, index) => {
        student.rank = index + 1;
      });

      // Cache the results
      this.cacheRankings(userId, month, sortedRankings);

      return sortedRankings;
    } catch (error) {
      console.error('Error calculating rankings:', error);
      throw error;
    }
  }

  /**
   * Apply sophisticated sorting algorithm with tie-breakers
   * @param {Array} rankings - Array of student ranking objects
   * @returns {Array} - Sorted rankings
   */
  applySortingAlgorithm(rankings) {
    return rankings.sort((a, b) => {
      // Primary sort: Total stars (higher is better)
      if (b.totalStars !== a.totalStars) {
        return b.totalStars - a.totalStars;
      }
      
      // Tie-breaker 1: Assessment count (consistency matters)
      if (b.assessmentCount !== a.assessmentCount) {
        return b.assessmentCount - a.assessmentCount;
      }
      
      // Tie-breaker 2: Average score (quality over quantity)
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      
      // Tie-breaker 3: Improvement trend (growth mindset)
      if (b.improvement !== a.improvement) {
        return b.improvement - a.improvement;
      }
      
      // Tie-breaker 4: Consistency percentage
      if (b.consistency !== a.consistency) {
        return b.consistency - a.consistency;
      }
      
      // Final tie-breaker: Alphabetical by name
      return a.studentName.localeCompare(b.studentName);
    });
  }

  /**
   * Calculate improvement trend based on recent vs. older assessments
   * @param {Array} assessments - Student's assessments
   * @returns {number} - Improvement score (-5 to +5)
   */
  calculateImprovementTrend(assessments) {
    if (assessments.length < 3) return 0;

    // Sort by date
    const sorted = assessments.sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));
    
    // Compare recent 1/3 vs older 1/3
    const third = Math.floor(sorted.length / 3);
    const recent = sorted.slice(-third);
    const older = sorted.slice(0, third);
    
    const recentAvg = recent.reduce((sum, a) => sum + a.totalScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, a) => sum + a.totalScore, 0) / older.length;
    
    return Math.round((recentAvg - olderAvg) * 100) / 100;
  }

  /**
   * Calculate performance metrics
   * @param {Array} assessments - Student's assessments
   * @returns {object} - Performance metrics
   */
  calculatePerformanceMetrics(assessments) {
    if (assessments.length === 0) {
      return {
        quoteStrongSuits: 0,
        challengeStrongSuits: 0,
        overallGrade: 'N/A',
        strongestArea: 'N/A',
        growthArea: 'N/A'
      };
    }

    const quoteScores = assessments.map(a => a.quoteScore || 0);
    const challengeScores = assessments.map(a => a.challengeScore || 0);
    
    const quoteAvg = quoteScores.reduce((a, b) => a + b, 0) / quoteScores.length;
    const challengeAvg = challengeScores.reduce((a, b) => a + b, 0) / challengeScores.length;
    const overallAvg = (quoteAvg + challengeAvg) / 2;
    
    // Count strong performances (4-5 stars)
    const quoteStrongSuits = quoteScores.filter(score => score >= 4).length;
    const challengeStrongSuits = challengeScores.filter(score => score >= 4).length;
    
    // Determine overall grade
    let overallGrade = 'Needs Improvement';
    if (overallAvg >= 4.5) overallGrade = 'Excellent';
    else if (overallAvg >= 3.5) overallGrade = 'Proficient';
    else if (overallAvg >= 2.5) overallGrade = 'Developing';
    
    return {
      quoteStrongSuits,
      challengeStrongSuits,
      overallGrade,
      strongestArea: quoteAvg > challengeAvg ? 'Quote Understanding' : 'Challenge Completion',
      growthArea: quoteAvg < challengeAvg ? 'Quote Understanding' : 'Challenge Completion',
      quoteAverage: Math.round(quoteAvg * 100) / 100,
      challengeAverage: Math.round(challengeAvg * 100) / 100
    };
  }

  /**
   * Get recent activity summary
   * @param {Array} assessments - Student's assessments
   * @returns {object} - Recent activity data
   */
  getRecentActivity(assessments) {
    const last7Days = assessments
      .filter(a => {
        const assessmentDate = new Date(a.assessmentDate);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return assessmentDate >= weekAgo;
      })
      .sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

    return {
      recentAssessments: last7Days.length,
      lastAssessmentDate: last7Days.length > 0 ? last7Days[0].assessmentDate : null,
      recentAverage: last7Days.length > 0 
        ? last7Days.reduce((sum, a) => sum + a.totalScore, 0) / last7Days.length 
        : 0
    };
  }

  /**
   * Calculate assessment streaks
   * @param {Array} assessments - Student's assessments
   * @returns {object} - Streak data
   */
  calculateStreaks(assessments) {
    if (assessments.length === 0) return { current: 0, longest: 0 };

    const sortedDates = assessments
      .map(a => a.assessmentDate)
      .sort()
      .map(date => new Date(date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = sortedDates[i - 1];
      const currentDate = sortedDates[i];
      const dayDiff = Math.abs(currentDate - prevDate) / (1000 * 60 * 60 * 24);

      if (dayDiff <= 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak from most recent date
    const today = new Date();
    if (sortedDates.length > 0) {
      const lastDate = sortedDates[sortedDates.length - 1];
      const daysSinceLastAssessment = Math.abs(today - lastDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLastAssessment <= 1) {
        currentStreak = tempStreak;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Update leaderboard in Firestore with real-time sync
   * @param {string} userId - Teacher's user ID
   * @param {string} month - Month in YYYY-MM format
   * @param {Array} rankings - Calculated rankings
   * @param {object} stats - Monthly statistics
   */
  async updateLeaderboard(userId, month, rankings, stats) {
    try {
      // Check if leaderboard document exists
      const leaderboardRef = collection(db, 'monthlyLeaderboards');
      const q = query(
        leaderboardRef,
        where('userId', '==', userId),
        where('month', '==', month)
      );
      
      const snapshot = await getDocs(q);
      
      const leaderboardData = {
        userId,
        month,
        rankings,
        totalAssessments: stats.totalAssessments || 0,
        averageClassScore: stats.averageClassScore || 0,
        topPerformer: stats.topPerformer || null,
        lastUpdated: serverTimestamp(),
        calculatedAt: new Date().toISOString(),
        version: '1.0' // For future schema migrations
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

      // Update cache
      this.cacheRankings(userId, month, rankings);
      
      return true;
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for assessment changes
   * @param {string} userId - Teacher's user ID
   * @param {string} month - Month in YYYY-MM format
   * @param {Function} callback - Callback function for updates
   * @returns {Function} - Unsubscribe function
   */
  subscribeToAssessmentUpdates(userId, month, callback) {
    const assessmentsRef = collection(db, 'characterTraitAssessments');
    const q = query(
      assessmentsRef,
      where('userId', '==', userId),
      where('month', '==', month),
      orderBy('assessmentDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assessments = [];
      snapshot.forEach((doc) => {
        assessments.push({ id: doc.id, ...doc.data() });
      });
      
      callback(assessments);
    });

    // Store listener for cleanup
    const listenerId = `${userId}-${month}`;
    this.listeners.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Get student performance analytics
   * @param {string} studentId - Student ID
   * @param {string} month - Month in YYYY-MM format
   * @returns {Promise<object>} - Student analytics
   */
  async getStudentAnalytics(studentId, month) {
    try {
      const cached = this.getCachedStudentAnalytics(studentId, month);
      if (cached) return cached;

      const assessmentsRef = collection(db, 'characterTraitAssessments');
      const q = query(
        assessmentsRef,
        where('studentId', '==', studentId),
        where('month', '==', month),
        orderBy('assessmentDate', 'asc')
      );

      const snapshot = await getDocs(q);
      const assessments = [];
      snapshot.forEach((doc) => {
        assessments.push({ id: doc.id, ...doc.data() });
      });

      const analytics = {
        totalAssessments: assessments.length,
        totalStars: assessments.reduce((sum, a) => sum + a.totalScore, 0),
        averageScore: assessments.length > 0 
          ? assessments.reduce((sum, a) => sum + a.totalScore, 0) / assessments.length 
          : 0,
        improvement: this.calculateImprovementTrend(assessments),
        performance: this.calculatePerformanceMetrics(assessments),
        streaks: this.calculateStreaks(assessments),
        recentActivity: this.getRecentActivity(assessments),
        weeklyTrend: this.calculateWeeklyTrend(assessments),
        recommendations: this.generateRecommendations(assessments)
      };

      // Cache the analytics
      this.cacheStudentAnalytics(studentId, month, analytics);

      return analytics;
    } catch (error) {
      console.error('Error getting student analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate weekly trend data
   * @param {Array} assessments - Student's assessments
   * @returns {Array} - Weekly trend data
   */
  calculateWeeklyTrend(assessments) {
    const weeks = {};
    
    assessments.forEach(assessment => {
      const date = new Date(assessment.assessmentDate);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { scores: [], count: 0 };
      }
      
      weeks[weekKey].scores.push(assessment.totalScore);
      weeks[weekKey].count++;
    });

    return Object.entries(weeks).map(([week, data]) => ({
      week,
      average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
      count: data.count
    })).sort((a, b) => new Date(a.week) - new Date(b.week));
  }

  /**
   * Generate personalized recommendations
   * @param {Array} assessments - Student's assessments
   * @returns {Array} - Array of recommendation objects
   */
  generateRecommendations(assessments) {
    const recommendations = [];
    
    if (assessments.length === 0) {
      recommendations.push({
        type: 'engagement',
        priority: 'high',
        message: 'Start participating in character trait assessments to track growth!'
      });
      return recommendations;
    }

    const performance = this.calculatePerformanceMetrics(assessments);
    const improvement = this.calculateImprovementTrend(assessments);
    const recentActivity = this.getRecentActivity(assessments);

    // Low participation
    if (recentActivity.recentAssessments < 3) {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Try to participate more consistently in daily assessments.'
      });
    }

    // Low quote scores
    if (performance.quoteAverage < 3) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        message: 'Focus on understanding daily quotes more deeply. Ask questions about their meaning.'
      });
    }

    // Low challenge scores
    if (performance.challengeAverage < 3) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        message: 'Put more effort into completing daily character challenges.'
      });
    }

    // Positive trends
    if (improvement > 1) {
      recommendations.push({
        type: 'praise',
        priority: 'low',
        message: 'Great improvement! Keep up the excellent work!'
      });
    }

    return recommendations;
  }

  /**
   * Utility functions
   */
  getDaysInMonth(month) {
    const [year, monthNum] = month.split('-');
    return new Date(year, monthNum, 0).getDate();
  }

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  cacheRankings(userId, month, rankings) {
    const key = `rankings-${userId}-${month}`;
    this.cache.set(key, {
      data: rankings,
      timestamp: Date.now()
    });
  }

  getCachedRankings(userId, month) {
    const key = `rankings-${userId}-${month}`;
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  cacheStudentAnalytics(studentId, month, analytics) {
    const key = `analytics-${studentId}-${month}`;
    this.cache.set(key, {
      data: analytics,
      timestamp: Date.now()
    });
  }

  getCachedStudentAnalytics(studentId, month) {
    const key = `analytics-${studentId}-${month}`;
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    
    this.cache.delete(key);
    return null;
  }

  /**
   * Cleanup method to remove listeners and clear cache
   */
  cleanup() {
    // Unsubscribe from all listeners
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
    
    // Clear cache
    this.cache.clear();
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();
export default leaderboardService;