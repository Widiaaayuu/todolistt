import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
    apiKey: "AIzaSyCHRHqiUR_fYHLuMOTe9WxHql2Ro8M92cM",
    authDomain: "todolist-e75d4.firebaseapp.com",
    projectId: "todolist-e75d4",
    storageBucket: "todolist-e75d4.firebasestorage.app",
    messagingSenderId: "1090756922108",
    appId: "1:1090756922108:web:7e725cad907e5c89722579",
    measurementId: "G-1L4YW6HZPV"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

