import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";

import { db } from "./index";


export type Player = {

  id: string;

  playerName: string;

  horseName: string;

  tableNumber: number;

  score: number;

};


export type RaceEvent = {

  type:
    | "none"
    | "banana";

  eventId: number;

  expiresAt: number;

};


/*
 * レース開始・停止
 */

export async function setRaceStarted(
  started: boolean
) {

  await setDoc(

    doc(
      db,
      "game",
      "status"
    ),

    {

      raceStarted:
        started,

      raceId:
        started
          ? Date.now()
          : 0,

      /*
       * 旧・共通イベント欄はnoneのまま残す。
       * バナナ本体は各players/{id}へ書き込む。
       */
      eventType:
        "none",

      eventId:
        0,

      eventExpiresAt:
        0,

    },

    {
      merge: true,
    }

  );

}


/*
 * 参加者を監視
 */

export function subscribePlayers(
  callback: (
    players: Player[]
  ) => void
) {

  return onSnapshot(

    collection(
      db,
      "players"
    ),

    (snapshot) => {

      callback(

        snapshot.docs.map(
          (document) => {

            const data =
              document.data();


            return {

              id:
                document.id,

              playerName:
                data.playerName ?? "",

              horseName:
                data.horseName ?? "",

              tableNumber:
                data.tableNumber ?? 0,

              score:
                data.score ?? 0,

            };

          }
        )

      );

    }

  );

}


/*
 * レース状態を監視
 */

export function subscribeRaceStarted(
  callback: (
    started: boolean,
    raceId: number
  ) => void
) {

  return onSnapshot(

    doc(
      db,
      "game",
      "status"
    ),

    (snapshot) => {

      const data =
        snapshot.data();


      callback(

        data?.raceStarted ?? false,

        data?.raceId ?? 0

      );

    }

  );

}


/*
 * 旧・共通バナナイベントAPI
 *
 * 既存コードとの互換性のため残す。
 * 新しい本番GamePageでは使用しない。
 */

export async function setRaceEvent(
  event: RaceEvent
) {

  await setDoc(

    doc(
      db,
      "game",
      "status"
    ),

    {

      eventType:
        event.type,

      eventId:
        event.eventId,

      eventExpiresAt:
        event.expiresAt,

    },

    {
      merge: true,
    }

  );

}


export function subscribeRaceEvent(
  callback: (
    event: RaceEvent
  ) => void
) {

  return onSnapshot(

    doc(
      db,
      "game",
      "status"
    ),

    (snapshot) => {

      const data =
        snapshot.data();


      callback({

        type:
          data?.eventType === "banana"
            ? "banana"
            : "none",

        eventId:
          data?.eventId ?? 0,

        expiresAt:
          data?.eventExpiresAt ?? 0,

      });

    }

  );

}


/*
 * ゲームを完全にリセット
 */

export async function resetGame() {

  await setDoc(

    doc(
      db,
      "game",
      "status"
    ),

    {

      raceStarted:
        false,

      raceId:
        0,

      eventType:
        "none",

      eventId:
        0,

      eventExpiresAt:
        0,

    },

    {
      merge: true,
    }

  );


  const snapshot =
    await getDocs(
      collection(
        db,
        "players"
      )
    );


  await Promise.all(

    snapshot.docs.map(
      document =>
        deleteDoc(
          doc(
            db,
            "players",
            document.id
          )
        )
    )

  );

}