import { getAuth } from 'firebase-admin/auth';

export const requireAuth = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    throw Object.assign(new Error('Missing token'), { status: 401 });
  }
  try {
    const decoded = await getAuth().verifyIdToken(token);
    return decoded;
  } catch (e) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
}; 