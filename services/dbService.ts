
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Session } from '../types';

export const saveSessionToHistory = async (userId: string, session: Session) => {
  if (!db) return;
  
  try {
    // Firestore throws an error if fields are 'undefined'.
    // We sanitize the object by stripping undefined values using JSON serialization.
    // This is necessary because the optional 'file' in config might be undefined.
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
