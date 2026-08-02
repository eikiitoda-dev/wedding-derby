import { collection, addDoc } from "firebase/firestore";
import { db } from "./index";

export async function testFirestore() {
  try {
    await addDoc(collection(db, "test"), {
      message: "Firebase接続成功",
      createdAt: new Date(),
    });

    console.log("✅ Firestore接続成功");
  } catch (error) {
    console.error("❌ Firestore接続失敗", error);
  }
}