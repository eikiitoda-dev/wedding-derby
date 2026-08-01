# Wedding Derby

結婚式の引き出物マルシェの順番決定を盛り上げるための、ゲスト参加型リアルタイムチーム競馬ゲームです。

## Overview

Wedding Derbyは、各テーブルを1つのチームとして扱い、ゲストがスマートフォンから参加できる競馬形式のゲームです。

QRコードを読み取ることで専用ページへアクセスし、アプリのインストールなしで参加できます。

各テーブルには1頭の馬が割り当てられ、ゲストの操作・運・イベント要素によって順位が決定します。

## Purpose

本プロジェクトの目的は以下です。

- 引き出物マルシェの選択順を楽しいイベント化する
- ゲスト全員が参加できる仕組みを作る
- テーブル間の交流を促進する
- テーブル人数差による有利不利を抑える

## Features

- QRコードによる簡単参加
- スマートフォンのみで利用可能
- Wi-Fiだけでなく4G / 5G環境でも利用可能
- テーブル単位のチーム戦
- リアルタイムレース演出
- ゲスト操作による馬への影響
- ランダムイベントによる逆転要素
- 管理者によるゲーム開始・制御

## Game Concept

各テーブルには1頭の馬が割り当てられます。

ゲストは自分のスマートフォンから操作を行い、自分のチームの馬を応援します。

馬の順位は以下の要素で決定されます。

- ゲスト操作
- チーム協力度
- ランダムイベント
- ボーナスイベント
- 障害イベント

人数が多いテーブルだけが勝ちやすくならないよう、個人操作の影響値は調整します。

## Technology Stack

使用予定技術：

Frontend:
- React
- TypeScript

Backend:
- Firebase

Database:
- Firebase Firestore

Hosting:
- Firebase Hosting

Version Control:
- GitHub

## Development Goal

本プロジェクトは以下を目標とします。

- GitHub公開可能な品質
- 再利用可能な設計
- 結婚式当日に安定稼働する構成
- 開発者以外でも理解できるドキュメント整備

## Project Structure

Wedding Derby

├── README.md
├── PROJECT_OVERVIEW.md
├── REQUIREMENTS.md
├── GAME_DESIGN.md
├── ARCHITECTURE.md
├── FIREBASE_DESIGN.md
├── UI_DESIGN.md
├── DEVELOPMENT_GUIDE.md
├── DEPLOYMENT_GUIDE.md
├── OPERATION_MANUAL.md
└── AI_PROMPT_BACKUP.md

## Future Expansion

今後の拡張案：

- 複数レース対応
- 写真イベント連携
- 新郎新婦コメント演出
- 景品抽選機能
- 他イベントへの転用

---

Created for wedding entertainment.