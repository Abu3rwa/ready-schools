import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getCurrentUserId } from "./apiService";

export const getSubjects = async () => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const subjectsCol = collection(db, "subjects");
  const q = query(subjectsCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createSubject = async (subject) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const subjectsCol = collection(db, "subjects");
  const newSubject = {
    name: subject.name,
    code: subject.code || subject.name,
    color: subject.color || null,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const ref = await addDoc(subjectsCol, newSubject);
  return { id: ref.id, ...newSubject };
};

export const updateSubject = async (id, updates) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const subjectRef = doc(db, "subjects", id);
  await updateDoc(subjectRef, { ...updates, updatedAt: new Date() });
  return { id, ...updates };
};

export const deleteSubject = async (id) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("User not authenticated.");

  const subjectRef = doc(db, "subjects", id);
  await deleteDoc(subjectRef);
  return { id };
};


