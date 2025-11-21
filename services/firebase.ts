import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyATmNgKgkdUWrk0x43FuqtexprTV-XEk20",
  authDomain: "quizzy-c1d1b.firebaseapp.com",
  projectId: "quizzy-c1d1b",
  storageBucket: "quizzy-c1d1b.firebasestorage.app",
  messagingSenderId: "1021958199524",
  appId: "1:1021958199524:web:38ddfe94b12178339c34f1",
  measurementId: "G-L10NGFE063"
};

let app;
let auth: any;
let googleProvider: any;

try {
  app = initializeApp(firebaseConfig);
  // Initialize Auth service specifically with the app instance
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

export { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
};