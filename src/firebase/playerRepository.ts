import { addDoc, collection } from "firebase/firestore";
import { db } from "./index";

export interface Player {
  playerName: string;
  horseName: string;
}

export async function createPlayer(player: Player) {
  await addDoc(collection(db, "players"), player);
}