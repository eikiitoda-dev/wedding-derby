# TEST PLAN

## Overview

Wedding Derbyが開発環境、本番環境、結婚式当日に正常動作することを確認するためのテスト計画を定義します。

安定したイベント運営を最優先とし、事前に複数端末で十分な確認を行います。

---

# Test Environment

## Development Environment

確認環境：

- macOS
- Visual Studio Code
- Node.js
- Firebase Emulatorまたは開発用Firebase環境

---

## Device Environment

対象端末：

- iPhone
- Androidスマートフォン
- タブレット

確認ブラウザ：

- Safari
- Chrome

---

# Basic Function Test

## Entry Test

確認項目：

- QRコードからアクセスできる
- 初回画面が正常表示される
- 参加ボタンが動作する

---

## Team Join Test

確認項目：

- チーム選択ができる
- 選択内容が保存される
- 重複登録が防止される

---

## Race Screen Test

確認項目：

- レース画面が表示される
- 馬が表示される
- 順位が表示される
- 残り時間が表示される

---

# Interaction Test

## Cheer Button Test

確認項目：

- ボタン操作が反映される
- 連続操作制御が動作する
- チームへの影響が反映される

---

## Event Test

確認項目：

- イベントが発生する
- 表示通知が出る
- 効果がゲームへ反映される

---

# Real Time Test

確認項目：

- 複数端末で同時接続できる
- 端末間で状態が一致する
- 更新遅延が許容範囲内である

---

# Administrator Test

## Login Test

確認項目：

- 管理者ログイン可能
- 権限が正しく設定されている

---

## Control Test

確認項目：

- レース開始できる
- 一時停止できる
- 再開できる
- 終了処理できる

---

# Firebase Test

## Firestore Test

確認項目：

- データ保存される
- データ取得できる
- 不正アクセスが防止される

---

## Security Rules Test

確認項目：

- ゲスト権限確認
- 管理者権限確認
- 不正変更防止確認

---

# Performance Test

確認項目：

- 複数端末接続
- 大量操作時の動作
- 通信遅延確認
- Firebase負荷確認

---

# Network Test

確認項目：

- Wi-Fi環境
- モバイル通信環境
- 一時切断後の復帰
- 再読み込み後の状態保持

---

# Pre Event Final Check

結婚式前の最終確認：

チェック：

□ 管理画面ログイン確認

□ QRコード確認

□ 全画面表示確認

□ 複数端末接続確認

□ レース動作確認

□ 結果表示確認

□ 通信環境確認

---

# Bug Management

問題発生時：

記録項目：

- 発生日時
- 発生画面
- 操作内容
- エラー内容
- 対応内容

---

# Release Criteria

本番利用条件：

- 全主要機能が正常動作
- 複数端末テスト完了
- 管理操作確認済み
- Firebase設定確認済み
- 運営担当者が操作可能

---

# Final Goal

Wedding Derbyは結婚式という一度きりのイベントで利用されるため、機能追加よりも安定稼働を優先します。

十分なテストを実施し、ゲスト全員が安心して楽しめる状態で本番運用します。