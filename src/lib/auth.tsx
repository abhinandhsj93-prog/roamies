import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as firebaseSignOut,
  type User,
} from '@react-native-firebase/auth';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

type AuthState = {
  // undefined while Firebase restores the session, null for guests
  user: User | null | undefined;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => onAuthStateChanged(getAuth(), setUser), []);

  // Returns false when the user backs out of the Google sheet.
  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return false;
      const { idToken } = response.data;
      if (!idToken) throw new Error('Google did not return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
      return true;
    } catch (error) {
      if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return false;
      throw error;
    }
  }

  async function signOut() {
    await GoogleSignin.signOut();
    await firebaseSignOut(getAuth());
  }

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
