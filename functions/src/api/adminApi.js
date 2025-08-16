import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const assertAdmin = async (uid) => {
  const db = getFirestore();
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || userDoc.data()?.admin !== true) {
    throw new HttpsError("permission-denied", "Admin privileges required");
  }
};

export const adminBanUser = onCall(async (request) => {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }
    await assertAdmin(request.auth.uid);

    const { uid, disabled } = request.data || {};
    if (!uid || typeof disabled !== "boolean") {
      throw new HttpsError("invalid-argument", "uid and disabled are required");
    }

    await getAuth().updateUser(uid, { disabled });

    const db = getFirestore();
    await db.collection("users").doc(uid).set({ banned: disabled }, { merge: true });

    return { success: true, uid, banned: disabled };
  } catch (error) {
    const message = error?.message || "Failed to update user status";
    console.error("adminBanUser error:", message);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", message);
  }
});

export const adminDeleteUser = onCall(async (request) => {
  try {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }
    await assertAdmin(request.auth.uid);

    const { uid } = request.data || {};
    if (!uid) {
      throw new HttpsError("invalid-argument", "uid is required");
    }

    // Delete from Auth
    await getAuth().deleteUser(uid);

    // Delete user document
    const db = getFirestore();
    await db.collection("users").doc(uid).delete();

    return { success: true, uid };
  } catch (error) {
    const message = error?.message || "Failed to delete user";
    console.error("adminDeleteUser error:", message);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", message);
  }
}); 