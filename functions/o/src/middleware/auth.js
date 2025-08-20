import { getAuth } from "firebase-admin/auth";

export const requireAuth = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No authentication token provided");
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    return decodedToken;
  } catch (error) {
    console.error("Authentication error:", error);
    throw error;
  }
};
