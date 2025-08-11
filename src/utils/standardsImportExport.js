import Papa from 'papaparse';

// Helper to extract unique standards from a CSV row
const extractStandards = (standardsString) => {
  if (!standardsString) return [];
  return standardsString.split(';').filter(Boolean);
};

// Helper to get standard description based on your standards list
const getStandardDescription = (standardCode) => {
  const descriptions = {
    'L.5.2c': 'Use a comma to set off the words yes and no (e.g., Yes, thank you), to set off a tag question from the rest of the sentence (e.g., It is true, is it not?), and to indicate direct address (e.g., Is that you, Steve?).',
    'L.5.2e': 'Spell grade-appropriate words correctly, consulting references as needed.',
    'L.5.3': 'Use knowledge of language and its conventions when writing, speaking, reading, or listening.',
    'L.5.4a': 'Use context (e.g., cause/effect relationships and comparisons in text) as a clue to the meaning of a word or phrase.',
    'L.5.4b': 'Use common, grade-appropriate Greek and Latin affixes and roots as clues to the meaning of a word.',
    'L.5.5': 'Demonstrate understanding of figurative language, word relationships, and nuances in word meanings.',
    'L.5.5c': 'Use the relationship between particular words (e.g., synonyms, antonyms, homographs) to better understand each of the words.',
    'L.5.6': 'Acquire and use accurately grade-appropriate general academic and domain-specific words and phrases.',
    'RF.5.3': 'Know and apply grade-level phonics and word analysis skills in decoding words.',
    'RF.5.3a': 'Use combined knowledge of all letter-sound correspondences, syllabication patterns, and morphology to read accurately unfamiliar multisyllabic words.',
    'RF.5.4b': 'Read on-level prose and poetry orally with accuracy, appropriate rate, and expression.',
    'RF.5.4c': 'Use context to confirm or self-correct word recognition and understanding, rereading as necessary.',
    'RI.5.1': 'Quote accurately from a text when explaining what the text says explicitly and when drawing inferences.',
    'RI.5.3': 'Explain relationships or interactions between individuals, events, ideas, or concepts in text.',
    'RI.5.4': 'Determine the meaning of general academic and domain-specific words and phrases.',
    'RI.5.5': 'Compare and contrast the overall structure of events, ideas, concepts, or information in texts.',
    'RI.5.6': 'Analyze multiple accounts of the same event or topic, noting similarities and differences in point of view.',
    'RI.5.7': 'Draw on information from multiple print or digital sources.',
    'RI.5.8': 'Explain how an author uses reasons and evidence to support particular points.',
    'RI.5.9': 'Integrate information from several texts on the same topic.',
    'RI.5.10': 'Read and comprehend informational texts at the high end of grades 4–5 text complexity band.',
    'RL.5.2': 'Determine a theme of a story, drama, or poem from details in the text.',
    'RL.5.10': 'Read and comprehend literature at the high end of grades 4–5 text complexity band.',
    'SL.5.1': 'Engage effectively in collaborative discussions.',
    'SL.5.1a': 'Come to discussions prepared, having read or studied required material.',
    'SL.5.1b': 'Follow agreed-upon rules for discussions and carry out assigned roles.',
    'SL.5.1c': 'Pose and respond to specific questions by elaborating on remarks of others.',
    'SL.5.1d': 'Review key ideas expressed and draw conclusions from discussions.',
    'SL.5.2': 'Summarize information presented in diverse media and formats.',
    'W.5.1a': 'Introduce a topic clearly, state an opinion, and create an organizational structure.',
    'W.5.4': 'Produce clear and coherent writing appropriate to task, purpose, and audience.',
    'W.5.7': 'Conduct short research projects using several sources.',
    'W.5.8': 'Recall relevant information from experiences or gather from print/digital sources.',
    'W.5.9': 'Draw evidence from literary or informational texts to support analysis.',
    'W.5.9b': 'Apply grade 5 Reading standards to informational texts.'
  };
  return descriptions[standardCode] || 'Description not available';
};

// Parse CSV and extract standards
export const parseStandardsCSV = (csvContent) => {
  const { data } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });

  // Create a map to track lessons per standard
  const standardLessonsCount = {};
  const standardLessons = {};

  // Process each row
  data.forEach(row => {
    const standards = extractStandards(row.Standards);
    standards.forEach(standard => {
      // Count lessons
      standardLessonsCount[standard] = (standardLessonsCount[standard] || 0) + 1;
      
      // Track lessons
      if (!standardLessons[standard]) {
        standardLessons[standard] = [];
      }
      standardLessons[standard].push({
        date: row.Date,
        group: row["Instructional Group"],
        teachingLevel: row["Teaching Level"],
        lesson: row.Lesson
      });
    });
  });

  // Transform into standards objects
  const standards = Object.keys(standardLessonsCount).map(code => ({
    code: code,
    framework: 'CCSS',
    subject: code.startsWith('L.') ? 'Language' :
            code.startsWith('RF.') ? 'Reading Foundational' :
            code.startsWith('RI.') ? 'Reading Informational' :
            code.startsWith('RL.') ? 'Reading Literature' :
            code.startsWith('SL.') ? 'Speaking and Listening' :
            code.startsWith('W.') ? 'Writing' : 'Other',
    gradeLevel: '5',
    domain: code.split('.')[0],
    description: getStandardDescription(code),
    lessonCount: standardLessonsCount[code],
    lessons: standardLessons[code],
    keywords: [
      code.split('.')[0], // Domain
      'Grade 5',
      'ELA',
      ...getStandardDescription(code)
        .toLowerCase()
        .split(/[.,;()]/)
        .map(s => s.trim())
        .filter(s => s.length > 3)
    ]
  }));

  return standards;
};

// Export standards to CSV
export const exportStandardsToCSV = (standards) => {
  // Deduplicate by standard code and merge basic metadata
  const byCode = new Map();

  (standards || []).forEach((s) => {
    const code = s.code || "";
    if (!code) return;

    if (!byCode.has(code)) {
      byCode.set(code, { ...s });
    } else {
      const existing = byCode.get(code);
      // Prefer non-empty/longer description
      const descA = existing.description || "";
      const descB = s.description || "";
      existing.description = descB.length > descA.length ? descB : descA;
      // Aggregate lesson counts
      existing.lessonCount = (existing.lessonCount || 0) + (s.lessonCount || 0);
      // Union keywords
      const kwA = Array.isArray(existing.keywords) ? existing.keywords : [];
      const kwB = Array.isArray(s.keywords) ? s.keywords : [];
      existing.keywords = Array.from(new Set([...kwA, ...kwB])).filter(Boolean);
      // Keep other primary fields if missing
      existing.framework = existing.framework || s.framework;
      existing.subject = existing.subject || s.subject;
      existing.gradeLevel = existing.gradeLevel || s.gradeLevel;
      existing.domain = existing.domain || s.domain;
      byCode.set(code, existing);
    }
  });

  const merged = Array.from(byCode.values()).sort((a, b) =>
    (a.code || "").localeCompare(b.code || "")
  );

  const csvData = merged.map((standard) => ({
    "Standard Code": standard.code,
    Framework: standard.framework,
    Subject: standard.subject,
    "Grade Level": standard.gradeLevel,
    Domain: standard.domain,
    Description: standard.description,
    "Lesson Count": standard.lessonCount || 0,
    Keywords: (standard.keywords || []).join(", "),
  }));

  return Papa.unparse(csvData);
};
