import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

/**
 * Configuração oficial do Firebase para o Torneio de Sinuca.
 * Estas credenciais permitem a sincronização em tempo real entre dispositivos.
 */
const firebaseConfig = {
  apiKey: "AIzaSyCU4nXYaq7pe8l9rdmr9GNAOFh8SiB6Ru8",
  authDomain: "torneio-sinuca-316c7.firebaseapp.com",
  projectId: "torneio-sinuca-316c7",
  storageBucket: "torneio-sinuca-316c7.firebasestorage.app",
  messagingSenderId: "41144086070",
  appId: "1:41144086070:web:d4acb0b70700a14fa9b297"
};

// Inicializa o Firebase Core
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore passando a instância do app explicitamente
// Isso resolve o erro "Service firestore is not available"
export const db = getFirestore(app);