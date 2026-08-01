# ARCHITECTURE

## Overview

Wedding Derbyは、スマートフォンブラウザから参加できるリアルタイムチーム競馬ゲームです。

シンプルで安定した構成を優先し、フロントエンド、バックエンド、データベース、ホスティングをFirebase中心に構築します。

---

# System Architecture

全体構成：

Guest Smartphone
        |
        |
        ↓
Web Application
(React + TypeScript)
        |
        |
        ↓
Firebase
        |
        ├── Firestore
        |
        ├── Authentication
        |
        └── Hosting

Administrator Console
        |
        |
        ↓
Firebase

---

# Frontend Architecture

## Technology

使用技術：

- React
- TypeScript
- Vite

目的：

- 高速な開発環境
- コンポーネント管理
- 保守性向上

---

# Guest Application

ゲスト向け画面。

主な機能：

- QRコードアクセス
- チーム参加
- レース状況表示
- 応援操作
- 結果確認

---

# Administrator Console

管理者向け画面。

主な機能：

- レース開始
- レース停止
- チーム管理
- イベント発生管理
- 結果確定

---

# Backend Architecture

## Firebase

Firebaseをバックエンド基盤として利用します。

理由：

- リアルタイム通信が容易
- サーバー管理不要
- 小規模イベントに適している
- 安定した運用が可能

---

# Firestore Design

Firestoreはゲーム状態管理に利用します。

保存データ例：

games

└── gameId

    ├── status

    ├── startTime

    ├── teams

    ├── horses

    └── events

---

# Real Time Communication

ゲーム中の情報更新はFirestoreリアルタイムリスナーを利用します。

流れ：

Guest Action

↓

Firestore Update

↓

All Connected Devices

↓

Race Display Update

---

# Data Flow

## Guest Action Flow

1. ゲストが応援ボタンを押す
2. アプリが操作情報を送信
3. Firestoreへ保存
4. ゲームロジックで速度計算
5. 全端末へ反映

---

## Race Control Flow

1. 管理者が開始ボタンを押す
2. ゲーム状態を変更
3. 全ゲスト画面へ通知
4. レース開始

---

# Game Logic Layer

ゲーム計算処理を独立させます。

管理対象：

- 馬速度計算
- イベント発生
- 順位計算
- ゴール判定

理由：

ゲームバランス調整を容易にするため。

---

# Network Design

対応通信環境：

- Wi-Fi
- 4G
- 5G

設計方針：

- 常時大量通信を避ける
- 必要な情報のみ送信する
- 通信切断時も復帰可能にする

---

# Security Design

考慮事項：

- 管理者権限分離
- Firestore Rules設定
- 不正操作制限
- 個人情報を保存しない

---

# Deployment Architecture

公開構成：

GitHub

↓

Firebase Hosting

↓

Guest Smartphone

---

# Scalability

想定利用規模：

- テーブル数：5〜20程度
- 参加人数：30〜100人程度

将来的には：

- 大規模イベント
- 複数ゲーム同時開催
- イベントプラットフォーム化

への拡張を想定します。