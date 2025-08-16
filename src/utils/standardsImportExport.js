import Papa from "papaparse";
import { standardDescriptions } from "../data/standardDescriptions";

// Parse CSV and extract standards
export const parseStandardsCSV = (csvContent) => {
  try {
    const parsedData = Papa.parse(csvContent, { header: true }).data;

    // Track standards and their lesson counts
    const standardsMap = new Map();

    parsedData.forEach((row) => {
      if (!row.Standards) return;

      const standards = row.Standards.split(";")
        .map((code) => code.trim())
        .filter(Boolean);

      standards.forEach((code) => {
        if (!standardsMap.has(code)) {
          standardsMap.set(code, {
            code,
            description: standardDescriptions[code] || "",
            lessons: new Set(),
            lessonCount: 0,
          });
        }

        const standard = standardsMap.get(code);
        standard.lessons.add(row.Lesson);
        standard.lessonCount = standard.lessons.size;
      });
    });

    return Array.from(standardsMap.values()).map((standard) => ({
      code: standard.code,
      description: standard.description,
      lessonCount: standard.lessonCount,
    }));
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error("Failed to parse standards CSV");
  }
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
