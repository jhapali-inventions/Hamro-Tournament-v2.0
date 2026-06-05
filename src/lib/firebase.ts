/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// The exact, fully operational production configuration supplied by the user
const defaultFirebaseConfig = {
  apiKey: "AIzaSyAPEWF1t1YKFG2-hrzY7IWBaumM4xyLwOs",
  authDomain: "hamro-tournament-09.firebaseapp.com",
  databaseURL: "https://hamro-tournament-09-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hamro-tournament-09",
  storageBucket: "hamro-tournament-09.firebasestorage.app",
  messagingSenderId: "167377472023",
  appId: "1:167377472023:web:ef825e192f564c5ccdea52"
};

let app;
try {
  // If a configuration exists from the set_up_firebase tool, we should attempt to load it.
  // Otherwise we fall back to the user's pre-configured project credentials, ensuring out-of-the-box operation.
  app = getApps().length > 0 ? getApp() : initializeApp(defaultFirebaseConfig);
} catch (e) {
  app = initializeApp(defaultFirebaseConfig);
}

export const auth = getAuth(app);
export const db = getFirestore(app);

// Test Firestore database connectivity and report standard offline errors if appropriate
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore reports client is offline. Please check network connectivity.");
    }
  }
}
testConnection();

// Mandatory Error Handling schemas and function wrapper defined in the master skill guidelines
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Secure Error Handled: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
