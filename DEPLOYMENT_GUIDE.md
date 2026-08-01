# DEPLOYMENT GUIDE

## Overview

Wedding Derbyを本番環境へ公開するための手順を定義します。

本番環境ではFirebase Hostingを利用し、結婚式会場のゲストがスマートフォンからアクセスできる状態にします。

---

# Deployment Environment

## Production Environment

利用サービス：

- Firebase Hosting
- Cloud Firestore
- Firebase Authentication

公開対象：

- ゲスト向けWebアプリ
- 管理者画面

---

# Deployment Preparation

本番公開前に以下を確認します。

確認項目：

- 開発環境で正常動作している
- Firebase設定が完了している
- Firestore Rulesが設定済み
- 管理者アカウント確認済み
- テスト端末で動作確認済み

---

# Firebase Project Setup

## Create Firebase Project

手順：

1. Firebaseプロジェクトを作成
2. Webアプリを登録
3. Firebase設定情報を取得
4. アプリへ設定を反映

---

# Firebase Hosting Setup

必要な設定：

- Hosting有効化
- 公開ディレクトリ設定
- SPA設定

基本構成：

React Application

↓

Firebase Hosting

↓

Guest Smartphone

---

# Build Process

本番用ビルド：

npm run build

実行後：

distフォルダが生成されます。

このファイルをFirebase Hostingへ公開します。

---

# Deploy Process

基本手順：

1. 最新コード確認
2. 依存関係確認
3. ビルド実行
4. Firebaseへログイン
5. Hostingへデプロイ

---

# Deployment Commands

Firebase CLI利用：

firebase login

↓

firebase init

↓

firebase deploy

---

# Deployment Verification

公開後に確認します。

確認項目：

- URLアクセス可能
- スマートフォン表示確認
- 画面遷移確認
- Firestore接続確認
- リアルタイム更新確認

---

# Pre Wedding Check

結婚式前に実施：

## One Day Before

確認：

- Firebase状態
- 管理者ログイン
- QRコード確認
- 通信環境確認

---

## Event Day

開始前：

- 管理者画面起動
- テスト接続
- ゲーム状態確認

---

# Rollback Strategy

問題発生時：

- 直前バージョンへ戻す
- Firebase状態確認
- 必要に応じて再デプロイ

---

# Security Checklist

確認：

- 管理者権限設定
- Firestore Rules確認
- 不要な公開設定削除
- APIキー管理

---

# Maintenance

イベント後：

- 利用ログ確認
- エラー確認
- データ整理
- バックアップ取得

---

# Future Deployment Improvements

将来的な改善：

- 自動デプロイ
- CI/CD導入
- 複数環境管理
- 監視システム追加

Wedding Derbyはイベント利用を前提としているため、公開作業は安全性と再現性を優先します。