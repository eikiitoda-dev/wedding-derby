# UI DESIGN

## Overview

Wedding Derbyは、結婚式会場で多数のゲストが同時利用することを想定したスマートフォン向けWebアプリです。

操作に迷わないこと、短時間で参加できること、会場全体が盛り上がることを重視してUIを設計します。

# Design Principles

## Simple

ゲストは初めて利用する人が大半になるため、説明なしでも理解できるUIを目指します。

方針：

- ボタン数を最小化
- 文字を大きく表示
- 状況を視覚的に表示
- 操作手順を少なくする

## Mobile First

対応端末：

- iPhone
- Androidスマートフォン

対応環境：

- Wi-Fi
- 4G
- 5G

スマートフォン縦画面を基本設計とします。

# Screen Flow

画面遷移：

QR Code

↓

Entry Screen

↓

Team Join

↓

Race Screen

↓

Result Screen

# Guest Screens

## Entry Screen

目的：

ゲーム参加入口。

表示項目：

- Wedding Derbyタイトル
- 参加ボタン
- 注意事項

操作：

「参加する」ボタンを押す。

## Team Join Screen

目的：

所属チームを登録する。

表示項目：

- テーブル一覧
- チーム名
- 馬カラー

操作：

自分のテーブルを選択。

## Race Screen

メイン画面。

表示項目：

- 自分のチーム名
- 馬の表示
- 現在順位
- レース進行状況
- 残り時間
- 応援ボタン
- イベント通知

## Race Display

馬の表示：

例：

1位 🐎━━━━━━

2位 🐎━━━━

3位 🐎━━

視覚的に順位が分かる表示にします。

## Cheer Button

応援操作ボタン。

仕様：

- 大きく表示
- 片手操作可能
- 連続操作制御
- 押した反応を表示

例：

「応援しました！」

## Event Notification

イベント発生時：

画面上に通知表示。

例：

追い風イベント発生！

あなたのチームが加速しました！

# Result Screen

レース終了後の画面。

表示項目：

- 優勝チーム
- 全順位
- 選択順
- お祝い演出

# Administrator UI

## Admin Login

管理者専用入口。

機能：

- 認証
- 管理画面アクセス

## Admin Dashboard

表示項目：

- 現在ゲーム状態
- 参加チーム数
- 接続人数
- レース状態

## Race Control Screen

操作：

- レース開始
- 一時停止
- 再開
- 終了
- リセット

## Team Management Screen

設定：

- チーム名
- 馬番号
- カラー
- 表示順

# Visual Design

## Color

方針：

- 結婚式らしい華やかさ
- 視認性
- 明るい印象

候補：

- ゴールド
- ホワイト
- パステルカラー

## Typography

方針：

- 大きな文字
- 高いコントラスト
- 短い文章

# Animation Design

利用予定：

- 馬の移動アニメーション
- 順位変動演出
- イベント表示
- ゴール演出

目的：

会場全体で楽しめる視覚効果を作る。

# Accessibility

考慮事項：

- 色だけで判断しない
- ボタンサイズを確保
- 通信状況を表示
- 高齢ゲストでも操作可能にする

# Future Expansion

追加可能なUI：

- 写真表示
- 新郎新婦コメント表示
- 特別演出画面
- ランキング表示
- 景品選択画面