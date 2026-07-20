import { initializeApp, getApps } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  getRedirectResult,
  initializeAuth,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      err.code === "auth/already-initialized"
    ) {
      return getAuth(app);
    }
    throw err;
  }
}

const auth = createAuth();
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export { firebaseConfig, app, auth, googleProvider };

function isPopupBlockedError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "auth/popup-blocked"
  );
}

const redirectBootstrapPromise = (async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (err) {
    console.error("Google redirect sign-in failed:", err);
    return null;
  }
})();

export async function initAuth(
  onUser: (user: User | null) => void,
): Promise<() => void> {
  await redirectBootstrapPromise;
  return watchAuth(onUser);
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    if (isPopupBlockedError(err)) {
      await signInWithRedirect(auth, googleProvider);
      return new Promise<User>(() => {});
    }
    throw err;
  }
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
