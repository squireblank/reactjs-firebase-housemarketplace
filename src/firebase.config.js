// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdJ1xJBnhRz2nm8OO3VlGsz2YrIa2oJhw",
  authDomain: "house-marketplace-e949d.firebaseapp.com",
  projectId: "house-marketplace-e949d",
  storageBucket: "house-marketplace-e949d.appspot.com",
  messagingSenderId: "656587382215",
  appId: "1:656587382215:web:53a162e415e336e8960de2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore();
