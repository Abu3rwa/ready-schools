import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const behaviorCollection = collection(db, "behaviors");

// Function to record a new behavior incident
export const recordBehavior = async (behaviorData) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const docData = {
    ...behaviorData,
    userId: user.uid,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(behaviorCollection, docData);
  return { id: docRef.id, ...docData };
};

// Function to update a behavior record
export const updateBehavior = async (behaviorId, updatedData) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const behaviorDoc = doc(db, "behaviors", behaviorId);
  await updateDoc(behaviorDoc, updatedData);
  return { id: behaviorId, ...updatedData };
};

// Function to delete a behavior record
export const deleteBehavior = async (behaviorId) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const behaviorDoc = doc(db, "behaviors", behaviorId);
  await deleteDoc(behaviorDoc);
  return { id: behaviorId };
};

// Analytics functions
export const getBehaviorAnalytics = async (filters = {}) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const behaviorsCol = collection(db, "behaviors");
  let q = query(behaviorsCol, where("userId", "==", user.uid));

  // Apply filters
  if (filters.studentId) {
    q = query(q, where("studentId", "==", filters.studentId));
  }

  if (filters.startDate && filters.endDate) {
    q = query(
      q,
      where("date", ">=", filters.startDate),
      where("date", "<=", filters.endDate)
    );
  }

  const snapshot = await getDocs(q);
  const behaviors = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return behaviors;
};

// Get skill frequency analysis
export const getSkillFrequencyAnalysis = async (filters = {}) => {
  const behaviors = await getBehaviorAnalytics(filters);
  
  const skillFrequency = {};
  const skillTypeCount = {};

  behaviors.forEach(behavior => {
    if (behavior.skills) {
      behavior.skills.forEach(skill => {
        const skillName = skill.skill;
        const skillType = skill.type;

        // Count total occurrences
        skillFrequency[skillName] = (skillFrequency[skillName] || 0) + 1;

        // Count by type (strength vs growth)
        if (!skillTypeCount[skillName]) {
          skillTypeCount[skillName] = { strength: 0, growth: 0 };
        }
        skillTypeCount[skillName][skillType]++;
      });
    }
  });

  return {
    skillFrequency,
    skillTypeCount,
    totalBehaviors: behaviors.length
  };
};

// Get student behavior trends
export const getStudentBehaviorTrends = async (studentId, timeRange = '30d') => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  const behaviors = await getBehaviorAnalytics({
    studentId,
    startDate,
    endDate
  });

  // Group by date
  const dailyData = {};
  behaviors.forEach(behavior => {
    const date = new Date(behavior.date.toDate()).toDateString();
    if (!dailyData[date]) {
      dailyData[date] = { strengths: 0, growthAreas: 0, total: 0 };
    }
    
    if (behavior.skills) {
      behavior.skills.forEach(skill => {
        dailyData[date].total++;
        if (skill.type === 'strength') {
          dailyData[date].strengths++;
        } else {
          dailyData[date].growthAreas++;
        }
      });
    }
  });

  return dailyData;
};

// Export behavior data for reports
export const exportBehaviorData = async (filters = {}, format = 'csv') => {
  const behaviors = await getBehaviorAnalytics(filters);
  
  if (format === 'csv') {
    return generateCSVExport(behaviors);
  } else if (format === 'json') {
    return behaviors;
  }
  
  throw new Error('Unsupported export format');
};

const generateCSVExport = (behaviors) => {
  const headers = [
    'Date',
    'Student Name',
    'Description',
    'Skills',
    'Skill Types',
    'Restorative Action',
    'Created At'
  ];
  
  const csvData = behaviors.map(behavior => {
    const skills = behavior.skills?.map(s => s.skill).join('; ') || '';
    const skillTypes = behavior.skills?.map(s => s.type).join('; ') || '';
    
    return [
      new Date(behavior.date.toDate()).toLocaleDateString(),
      behavior.studentName || 'Unknown',
      `"${behavior.description}"`,
      `"${skills}"`,
      `"${skillTypes}"`,
      `"${behavior.restorativeAction || ''}"`,
      new Date(behavior.createdAt.toDate()).toLocaleString()
    ].join(',');
  });
  
  return [headers.join(','), ...csvData].join('\n');
};

// Get behavior insights and recommendations
export const getBehaviorInsights = async (filters = {}) => {
  const behaviors = await getBehaviorAnalytics(filters);
  const skillAnalysis = await getSkillFrequencyAnalysis(filters);
  
  const insights = {
    totalObservations: behaviors.length,
    topStrengths: [],
    topGrowthAreas: [],
    recommendations: []
  };
  
  // Analyze top strengths and growth areas
  const skillStats = Object.entries(skillAnalysis.skillTypeCount);
  
  // Top strengths
  insights.topStrengths = skillStats
    .sort(([,a], [,b]) => b.strength - a.strength)
    .slice(0, 3)
    .map(([skill, stats]) => ({
      skill,
      count: stats.strength
    }));
  
  // Top growth areas
  insights.topGrowthAreas = skillStats
    .sort(([,a], [,b]) => b.growth - a.growth)
    .slice(0, 3)
    .map(([skill, stats]) => ({
      skill,
      count: stats.growth
    }));
  
  // Generate recommendations
  if (insights.topGrowthAreas.length > 0) {
    insights.recommendations.push(
      `Focus on developing ${insights.topGrowthAreas[0].skill} skills through targeted activities and explicit instruction.`
    );
  }
  
  if (insights.topStrengths.length > 0) {
    insights.recommendations.push(
      `Leverage students' strengths in ${insights.topStrengths[0].skill} to support peer learning and leadership opportunities.`
    );
  }
  
  const strengthRatio = Object.values(skillAnalysis.skillTypeCount)
    .reduce((sum, skill) => sum + skill.strength, 0) / 
    Object.values(skillAnalysis.skillTypeCount)
    .reduce((sum, skill) => sum + skill.strength + skill.growth, 0);
  
  if (strengthRatio < 0.4) {
    insights.recommendations.push(
      "Consider increasing positive reinforcement and opportunities for students to demonstrate their strengths."
    );
  }
  
  return insights;
};
