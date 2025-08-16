// Shared proficiency scales for standards-based assessment
export const PROFICIENCY_SCALES = {
  four_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy", percentageMapping: 55 },
    { level: 2, label: "Developing", description: "Student can demonstrate concept with 75% accuracy", percentageMapping: 70 },
    { level: 3, label: "Proficient", "description": "Student can demonstrate concept with 90% accuracy", percentageMapping: 85 },
    { level: 4, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others", percentageMapping: 100 }
  ],
  five_point: [
    { level: 1, label: "Novice", description: "With help, student can demonstrate concept with 50% accuracy", percentageMapping: 50 },
    { level: 2, label: "Approaching", description: "Student can demonstrate concept with 65% accuracy", percentageMapping: 65 },
    { level: 3, label: "Developing", description: "Student can demonstrate concept with 80% accuracy", percentageMapping: 80 },
    { level: 4, label: "Proficient", description: "Student can demonstrate concept with 95% accuracy", percentageMapping: 95 },
    { level: 5, label: "Advanced", description: "Student can demonstrate concept with 100% accuracy and can teach others", percentageMapping: 100 }
  ]
};

export const getProficiencyLevelLabel = (scale, level) => {
  const scaleData = PROFICIENCY_SCALES[scale];
  if (!scaleData) return "Unknown";
  
  const levelData = scaleData.find(item => item.level === level);
  return levelData ? levelData.label : "Unknown";
};

export const getProficiencyLevelDescription = (scale, level) => {
  const scaleData = PROFICIENCY_SCALES[scale];
  if (!scaleData) return "Unknown";
  
  const levelData = scaleData.find(item => item.level === level);
  return levelData ? levelData.description : "Unknown";
};

export const getDefaultProficiencyScale = () => 'four_point';

export const getProficiencyScaleOptions = () => [
  { value: 'four_point', label: '4-Point Scale' },
  { value: 'five_point', label: '5-Point Scale' }
];
