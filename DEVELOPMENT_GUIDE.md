# DEVELOPMENT GUIDE

## Overview

Wedding Derbyの開発を進めるための環境構築、開発手順、運用ルールを定義します。

本プロジェクトでは、React + TypeScript + Firebaseを利用します。

---

# Development Environment

## Required Tools

必要なツール：

- macOS
- Visual Studio Code
- Git
- Node.js
- npm
- Homebrew

---

# Technology Stack

Frontend:

- React
- TypeScript
- Vite

Backend:

- Firebase

Database:

- Cloud Firestore

Hosting:

- Firebase Hosting

Version Control:

- GitHub

---

# Initial Setup

## 1. Repository Clone

GitHubからプロジェクトを取得します。

例：

git clone リポジトリURL

---

## 2. Install Dependencies

プロジェクトフォルダへ移動後：

npm install

を実行します。

---

## 3. Start Development Server

開発サーバー起動：

npm run dev

ブラウザで表示を確認します。

---

# Project Structure

予定構成：

src

├── components

├── pages

├── hooks

├── services

├── firebase

├── game

└── utils

---

# Development Workflow

基本的な流れ：

1. Issue確認
2. ブランチ作成
3. 実装
4. 動作確認
5. Commit
6. Pull Request
7. Merge

---

# Git Rules

## Branch

命名例：

feature/

bugfix/

hotfix/

---

## Commit Message

分かりやすいメッセージを使用します。

例：

feat: add race screen

fix: correct horse movement

docs: update README

---

# Coding Rules

## TypeScript

方針：

- 型定義を明確にする
- anyの利用を避ける
- 再利用可能なコンポーネントを作成する

---

## React

方針：

- コンポーネント単位で管理
- 状態管理を整理する
- ロジックと表示を分離する

---

# Firebase Development

## Firestore

注意事項：

- データ構造を事前設計する
- 不要な書き込みを避ける
- Security Rulesを設定する

---

## Testing

確認項目：

- 複数端末接続
- リアルタイム更新
- 通信切断後の復帰
- 管理画面操作

---

# Environment Management

環境：

## Development

開発用環境。

## Production

結婚式本番利用環境。

本番前に十分なテストを実施します。

---

# Debugging

確認項目：

- Browser Console
- Firebase Console
- Network状態
- Firestoreデータ

---

# Deployment Flow

基本手順：

Development

↓

Testing

↓

Production

↓

Firebase Hosting Deploy

---

# Development Principles

優先事項：

- 安定性
- シンプルな構成
- 保守性
- 誰でも理解できるコード

Wedding Derbyはイベント利用を前提としているため、最新技術よりも安定稼働を優先します。