# FIREBASE DESIGN

## Overview

Wedding Derbyでは、リアルタイムゲーム状態の管理基盤としてFirebaseを利用します。

Firebaseを採用することで、サーバー管理を最小限にしながら、複数のスマートフォンへリアルタイムにゲーム情報を配信します。

---

# Firebase Services

利用予定サービス：

## Firebase Hosting

用途：

- Webアプリ公開
- ゲスト参加ページ配信
- 管理者画面配信

役割：

User Browser

↓

Firebase Hosting

↓

React Application

---

## Cloud Firestore

用途：

- ゲーム状態管理
- チーム情報管理
- 馬の状態管理
- イベント管理

Wedding Derbyの中心データベースとして利用します。

---

## Firebase Authentication

用途：

- 管理者認証
- 管理画面アクセス制御

ゲストは基本的に匿名参加とし、不要な個人情報取得を避けます。

---

# Firestore Data Structure

基本構造：

games

└── gameId

　　├── status

　　├── createdAt

　　├── startTime

　　├── teams

　　├── horses

　　└── events

---

# Game Collection

## games/{gameId}

ゲーム全体の状態を管理します。

例：

{
  status: "running",
  startTime: timestamp,
  raceDuration: 120,
  winner: null
}

---

# Team Data

チーム情報：

teams

└── teamId

　　├── name

　　├── tableNumber

　　├── color

　　├── memberCount

　　└── score

管理項目：

- チーム名
- テーブル番号
- 表示カラー
- 参加人数
- 現在ポイント

---

# Horse Data

馬情報：

horses

└── horseId

　　├── teamId

　　├── position

　　├── speed

　　├── status

　　└── rank

管理項目：

- 所属チーム
- 現在位置
- 現在速度
- 状態
- 順位

---

# Event Data

イベント情報：

events

└── eventId

　　├── type

　　├── targetHorse

　　├── effect

　　└── createdAt

例：

{
 type:"boost",
 targetHorse:"horse01",
 effect:10
}

---

# Guest Action Data

ゲスト操作を管理します。

例：

actions

└── actionId

　　├── teamId

　　├── userId

　　├── type

　　└── createdAt

操作例：

- 応援ボタン
- イベント参加
- ボーナス操作

---

# Real Time Update Flow

ゲーム中の流れ：

Guest

↓

Action Send

↓

Firestore

↓

Game Logic

↓

Horse Update

↓

All Users Receive Update

---

# Security Rules Design

基本方針：

## Guest

許可：

- 自分の参加情報登録
- 応援操作送信
- ゲーム状態閲覧

制限：

- ゲーム状態直接変更不可
- 他チーム情報変更不可

---

## Administrator

許可：

- レース開始
- レース停止
- データ管理
- 結果確定

---

# Performance Considerations

## Write Control

Firestore書き込み量を制御します。

対策：

- 連続操作の制限
- バッチ更新
- 必要情報のみ保存

---

## Real Time Optimization

リアルタイム更新対象：

- 馬位置
- 順位
- イベント状態

不要なデータ更新は避けます。

---

# Offline / Network Handling

対応環境：

- Wi-Fi
- 4G
- 5G

考慮事項：

- 一時的な通信切断
- 再接続
- 状態同期

---

# Backup Strategy

イベント前に：

- テストゲーム実施
- Firebase状態確認
- 設定バックアップ

を行います。

---

# Future Expansion

将来的な追加：

- 複数レース管理
- ユーザーランキング
- イベント履歴保存
- 分析ダッシュボード
- 他イベントへの転用