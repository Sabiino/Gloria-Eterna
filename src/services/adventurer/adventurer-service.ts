import { db } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
export type AdmissionProgress = { completed: boolean; bestScore: number; totalQuestions: number; attempts: number; completedAt?: string; contentVersion: string };
export async function getAdmissionProgress(uid: string): Promise<AdmissionProgress | null> { if (!db) return null; const snap = await getDoc(doc(db, 'users', uid, 'career', 'adventurerAdmission')); if (!snap.exists()) return null; const d=snap.data(); return { completed:!!d.objectives?.introduction?.completed,bestScore:d.objectives?.introduction?.bestScore??0,totalQuestions:5,attempts:d.objectives?.introduction?.attempts??0,contentVersion:d.objectives?.introduction?.contentVersion??'' }; }
export async function submitIntroductionQuiz(answers: Record<string,string>, attemptId: string) { return httpsCallable(getFunctions(), 'submitAdventurerIntroductionQuiz')({ answers, attemptId }); }
