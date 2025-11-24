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
  setDoc, // Added setDoc
  getDoc, // Added getDoc
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

// --- GLOBAL CONFIG (For Admin Voice Key) ---

export const saveGlobalConfig = async (key: string, value: any) => {
  if (!db) return;
  try {
    // Using a 'config' collection and 'global' document to store app-wide settings
    await setDoc(doc(db, 'config', 'global'), { [key]: value }, { merge: true });
  } catch (e) {
    console.error("Error saving global config:", e);
    throw e;
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
  } catch (e) {
    console.error("Error fetching global config:", e);
    return null;
  }
};