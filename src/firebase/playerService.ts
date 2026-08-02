import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "./index";
import type { Player } from "../context/GameContext";

const playersRef = collection(db, "players");

export async function addPlayerToFirestore(player: Player) {
  await addDoc(playersRef, player);
}

export async function getPlayersFromFirestore(): Promise<Player[]> {
  const snapshot = await getDocs(playersRef);

  return snapshot.docs.map((doc) => doc.data() as Player);
}

export async function clearPlayersFromFirestore() {
  const snapshot = await getDocs(playersRef);

  await Promise.all(
    snapshot.docs.map((d) => deleteDoc(doc(db, "players", d.id)))
  );
}