import { getFirestore } from "firebase-admin/firestore";

// One-time migration to map legacy behavior type/severity to skills structure
export const migrateBehaviorStructure = async () => {
  const db = getFirestore();
  const batch = db.batch();
  const snap = await db.collection("behaviors").get();

  const mapLegacyToSkill = (doc) => {
    const d = doc.data();
    if (Array.isArray(d.skills) && d.skills.length > 0) return null; // already migrated
    const description = d.description || "";
    // Simple heuristics; real mapping could be more sophisticated
    if (/called out|interrupt|shout/i.test(description)) {
      return [{ skill: "Self-Regulation", type: "growth" }];
    }
    if (/helped|supported|team|group/i.test(description)) {
      return [{ skill: "Collaboration", type: "strength" }];
    }
    return [{ skill: "Resilience", type: d.type === "Positive" ? "strength" : "growth" }];
  };

  let updates = 0;
  snap.forEach((doc) => {
    const skills = mapLegacyToSkill(doc);
    if (skills) {
      batch.set(doc.ref, {
        skills,
        restorativeAction: (doc.data().actionTaken ?? ""),
        legacy: true,
      }, { merge: true });
      updates += 1;
    }
  });

  if (updates > 0) {
    await batch.commit();
  }
  return { updated: updates };
};


