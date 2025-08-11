export const commonCoreStandards = [
  {
    code: "CCSS.ELA.L.5.2c",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Language",
    cluster: "Conventions of Standard English",
    description: "Use a comma to set off the words yes and no (e.g., Yes, thank you), to set off a tag question from the rest of the sentence (e.g., It's true, isn't it?), and to indicate direct address (e.g., Is that you, Steve?).",
    keywords: ["punctuation", "comma", "grammar", "conventions"],
  },
  {
    code: "CCSS.ELA.L.5.2e",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Language",
    cluster: "Conventions of Standard English",
    description: "Spell grade-appropriate words correctly, consulting references as needed.",
    keywords: ["spelling", "vocabulary", "reference skills"],
  },
  {
    code: "CCSS.ELA.L.5.3",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Language",
    cluster: "Knowledge of Language",
    description: "Use knowledge of language and its conventions when writing, speaking, reading, or listening.",
    keywords: ["language", "conventions", "communication"],
  },
  {
    code: "CCSS.ELA.L.5.4a",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Language",
    cluster: "Vocabulary Acquisition and Use",
    description: "Use context (e.g., cause/effect relationships and comparisons in text) as a clue to the meaning of a word or phrase.",
    keywords: ["context clues", "vocabulary", "comprehension"],
  },
  {
    code: "CCSS.ELA.RI.5.1",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Reading Informational Text",
    cluster: "Key Ideas and Details",
    description: "Quote accurately from a text when explaining what the text says explicitly and when drawing inferences from the text.",
    keywords: ["quoting", "inference", "evidence", "comprehension"],
  },
  {
    code: "CCSS.ELA.RI.5.3",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Reading Informational Text",
    cluster: "Key Ideas and Details",
    description: "Explain the relationships or interactions between two or more individuals, events, ideas, or concepts in a historical, scientific, or technical text based on specific information in the text.",
    keywords: ["relationships", "connections", "analysis", "nonfiction"],
  },
  {
    code: "CCSS.ELA.RI.5.4",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Reading Informational Text",
    cluster: "Craft and Structure",
    description: "Determine the meaning of general academic and domain-specific words and phrases in a text relevant to a grade 5 topic or subject area.",
    keywords: ["vocabulary", "academic language", "context"],
  },
  {
    code: "CCSS.ELA.RL.5.2",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Reading Literature",
    cluster: "Key Ideas and Details",
    description: "Determine a theme of a story, drama, or poem from details in the text, including how characters in a story or drama respond to challenges or how the speaker in a poem reflects upon a topic; summarize the text.",
    keywords: ["theme", "summary", "character analysis", "poetry"],
  },
  {
    code: "CCSS.ELA.SL.5.1",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Speaking and Listening",
    cluster: "Comprehension and Collaboration",
    description: "Engage effectively in a range of collaborative discussions (one-on-one, in groups, and teacher-led) with diverse partners on grade 5 topics and texts, building on others' ideas and expressing their own clearly.",
    keywords: ["discussion", "collaboration", "speaking", "listening"],
  },
  {
    code: "CCSS.ELA.W.5.1a",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Writing",
    cluster: "Text Types and Purposes",
    description: "Introduce a topic or text clearly, state an opinion, and create an organizational structure in which ideas are logically grouped to support the writer's purpose.",
    keywords: ["writing", "organization", "opinion", "structure"],
  },
  {
    code: "CCSS.ELA.W.5.4",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Writing",
    cluster: "Production and Distribution of Writing",
    description: "Produce clear and coherent writing in which the development and organization are appropriate to task, purpose, and audience.",
    keywords: ["writing", "organization", "audience", "purpose"],
  },
  {
    code: "CCSS.ELA.W.5.7",
    framework: "CCSS",
    subject: "ELA",
    gradeLevel: "5",
    domain: "Writing",
    cluster: "Research to Build and Present Knowledge",
    description: "Conduct short research projects that use several sources to build knowledge through investigation of different aspects of a topic.",
    keywords: ["research", "investigation", "sources", "writing"],
  }
];

export const importStandardsData = async (standardsService) => {
  try {
    const result = await standardsService.bulkImportStandards(commonCoreStandards);
    console.log('Standards import result:', result);
    return result;
  } catch (error) {
    console.error('Error importing standards:', error);
    throw error;
  }
};