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

// Schema
// academicPeriods: {
//   id,
//   name: "2024-2025",
//   startDate: string (ISO),
//   endDate: string (ISO),
//   semesters: [
//     { id, name, startDate, endDate, terms: [ { id, name, startDate, endDate } ] }
//   ],
//   userId,
//   createdAt: Date,
//   updatedAt: Date
// }

export const listAcademicPeriods = async () => {
	const userId = getCurrentUserId();
	if (!userId) throw new Error("User not authenticated.");

	const col = collection(db, "academicPeriods");
	const q = query(col, where("userId", "==", userId));
	const snapshot = await getDocs(q);
	return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createAcademicPeriod = async (period) => {
	const userId = getCurrentUserId();
	if (!userId) throw new Error("User not authenticated.");

	const col = collection(db, "academicPeriods");
	const now = new Date();
	const newDoc = {
		name: period.name,
		startDate: period.startDate || null,
		endDate: period.endDate || null,
		semesters: period.semesters || [],
		userId,
		createdAt: now,
		updatedAt: now,
	};
	const ref = await addDoc(col, newDoc);
	return { id: ref.id, ...newDoc };
};

export const updateAcademicPeriod = async (id, updates) => {
	const userId = getCurrentUserId();
	if (!userId) throw new Error("User not authenticated.");

	const ref = doc(db, "academicPeriods", id);
	await updateDoc(ref, { ...updates, updatedAt: new Date() });
	return { id, ...updates };
};

export const deleteAcademicPeriod = async (id) => {
	const userId = getCurrentUserId();
	if (!userId) throw new Error("User not authenticated.");

	const ref = doc(db, "academicPeriods", id);
	await deleteDoc(ref);
	return { id };
};
