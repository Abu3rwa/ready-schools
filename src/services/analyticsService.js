import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const getClassSkillsProfile = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const profileDoc = await getDoc(doc(db, "analytics", user.uid));
  if (!profileDoc.exists()) return null;
  return profileDoc.data();
};


