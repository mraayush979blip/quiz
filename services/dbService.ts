import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Session } from '../types';

export const saveSessionToHistory = async (userId: string, session: Session) => {
  if (!db) return;
  
  try {
    const safeSession = JSON.parse(JSON.stringify(session));

    await addDoc(collection(db, `users/${userId}/sessions`), {
      ...safeSession,
      createdAt: serverTimestamp(),
      timestamp: Date.now() 
    });
  } catch (e) {
    console.error("Error saving session:", e);
    throw e;
  }
};

export const getUserHistory = async (userId: string): Promise<Session[]> => {
  if (!db) return [];

  try {
    const q = query(
      collection(db, `users/${userId}/sessions`),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
};

export const updateSessionScore = async (userId: string, sessionId: string, score: number, total: number, duration?: number) => {
  if (!db) return;

  try {
    const sessionRef = doc(db, `users/${userId}/sessions`, sessionId);
    const updateData: any = {
      score: score,
      totalQuestions: total,
      completedAt: new Date().toISOString()
    };
    
    if (duration !== undefined) {
      updateData.duration = duration;
    }

    await updateDoc(sessionRef, updateData);
  } catch (e) {
    console.error("Error updating score:", e);
  }
};

export const deleteSession = async (userId: string, sessionId: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, `users/${userId}/sessions`, sessionId));
  } catch (e) {
    console.error("Error deleting session:", e);
    throw e;
  }
};

// --- GLOBAL CONFIG (Safe Mode) ---

export const saveGlobalConfig = async (key: string, value: any) => {
  if (!db) return;
  try {
    // This will fail if Firestore Rules block 'config/global'
    // Ensure rules allow write for specific admin email
    await setDoc(doc(db, 'config', 'global'), { [key]: value }, { merge: true });
  } catch (e: any) {
    console.error("Error saving global config (Check Firestore Rules):", e.message);
    // Don't throw, just log, so app doesn't crash. 
    // The UI will likely fallback to local state.
  }
};

export const getGlobalConfig = async (key: string) => {
  if (!db) return null;
  try {
    const docRef = doc(db, 'config', 'global');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data()[key];
    } else {
      return null;
    }
  } catch (e: any) {
    // Silent fail for permission errors to avoid console spam if rules aren't set up
    if (!e.message.includes("insufficient permissions")) {
       console.error("Error fetching global config:", e);
    }
    return null;
  }
};