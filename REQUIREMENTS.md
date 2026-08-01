# REQUIREMENTS

## Overview

Wedding Derbyは、結婚式などのイベント会場で利用するリアルタイムチーム競馬ゲームです。

ゲストはスマートフォンから参加し、テーブル単位で競争を行います。

本ドキュメントでは、本システムが満たすべき機能要件・非機能要件を定義します。

---

# Functional Requirements

## Guest Features

### QR Code Access

要件：

- QRコードからゲームページへアクセスできる
- アプリインストール不要
- スマートフォンブラウザで動作する

対応環境：

- iOS Safari
- Android Chrome

---

## Team Participation

要件：

- ゲストは所属テーブルを選択または入力できる
- 1テーブルにつき1頭の馬を割り当てる
- 同一チームの参加者は同じ馬を応援する

---

## Race Interaction

ゲストは以下の操作を行える。

- 応援ボタン操作
- イベント参加
- 状況確認
- レース結果確認

操作結果はリアルタイムにゲームへ反映する。

---

## Horse Racing System

各チームには以下の情報を持つ馬を設定する。

- 馬番号
- チーム名
- 現在位置
- 速度
- 状態

レース中はリアルタイムで順位を更新する。

---

# Administrator Features

## Race Control

管理者は以下を操作できる。

- レース開始
- レース停止
- レースリセット
- 結果確定

---

## Team Management

管理者は以下を設定できる。

- チーム数
- チーム名
- 馬番号
- 表示順

---

## Result Management

管理者は：

- 順位確認
- 勝利チーム確認
- 引き出物選択順決定

を行える。

---

# Game Balance Requirements

## Fairness

人数差による有利不利を抑える。

対策：

- 個人操作効果に上限を設定
- 人数補正を導入
- ランダムイベントを実装
- 逆転可能なゲーム設計にする

---

## Random Events

ゲーム中に以下のイベントを発生可能にする。

例：

- 加速イベント
- 減速イベント
- ボーナスイベント
- 追い上げイベント

---

# Non Functional Requirements

## Performance

目標：

- 参加者30〜100人程度で安定動作
- リアルタイム更新遅延を最小化
- ブラウザ操作レスポンスを高速化

---

## Network

対応環境：

- Wi-Fi
- 4G
- 5G

特定の会場Wi-Fi環境に依存しない設計とする。

---

## Reliability

結婚式当日の利用を想定し：

- 事前テスト可能
- 障害時復旧可能
- シンプルな構成

を優先する。

---

## Security

考慮事項：

- 不正操作防止
- 管理者権限分離
- Firebaseアクセス制御
- 個人情報を必要以上に取得しない

---

# Development Constraints

開発方針：

- React + TypeScriptを利用
- Firebaseをバックエンドとして利用
- GitHubで管理
- ドキュメントを整備する
- 再利用可能な設計を目指す