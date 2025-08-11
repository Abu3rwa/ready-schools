// This file is now deprecated as Google authentication is handled directly in AuthContext
// Import this file is no longer necessary as all authentication is handled through AuthContext

// This empty export is kept for backward compatibility
// Any code still importing this should be updated to use AuthContext directly
export const signInWithGoogle = async () => {
  console.warn('googleAuthService.signInWithGoogle is deprecated. Use AuthContext.signInWithGoogle instead.');
  throw new Error('googleAuthService.signInWithGoogle is deprecated. Use AuthContext.signInWithGoogle instead.');
};
