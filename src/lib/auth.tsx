import type { User } from '@react-native-firebase/auth';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Firebase and Google sign-in are native modules. They're missing in Expo Go and on web,
// where the app still runs so the UI can be previewed; sign-in is just unavailable there.
export const signInAvailable =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

function nativeAuth() {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const firebase = require('@react-native-firebase/auth') as typeof import('@react-native-firebase/auth');
  const google =
    require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { firebase, google };
}

let configured = false;
function configureGoogle() {
  if (configured) return;
  nativeAuth().google.GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  configured = true;
}

type AuthState = {
  // undefined while Firebase restores the session, null for guests
  user: User | null | undefined;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(signInAvailable ? undefined : null);

  useEffect(() => {
    if (!signInAvailable) return;
    configureGoogle();
    const { getAuth, onAuthStateChanged } = nativeAuth().firebase;
    return onAuthStateChanged(getAuth(), setUser);
  }, []);

  // Returns false when the user backs out of the Google sheet.
  async function signInWithGoogle() {
    if (!signInAvailable) throw new Error('Sign-in needs the development build of the app.');
    const { firebase, google } = nativeAuth();
    try {
      await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await google.GoogleSignin.signIn();
      if (!google.isSuccessResponse(response)) return false;
      const { idToken } = response.data;
      if (!idToken) throw new Error('Google did not return an ID token. Check EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      await firebase.signInWithCredential(firebase.getAuth(), firebase.GoogleAuthProvider.credential(idToken));
      return true;
    } catch (error) {
      if (google.isErrorWithCode(error) && error.code === google.statusCodes.IN_PROGRESS) return false;
      throw error;
    }
  }

  async function signOut() {
    if (!signInAvailable) return;
    const { firebase, google } = nativeAuth();
    await google.GoogleSignin.signOut();
    await firebase.signOut(firebase.getAuth());
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
