# Flask ECS CDK プロジェクト

このプロジェクトは、FlaskアプリケーションをAmazon ECS（Fargate）にデプロイするためのAWS CDK TypeScriptプロジェクトです。GitHubをソースとするCI/CDパイプラインを含んでいます。

## アーキテクチャ

- **VPC**: 2つのアベイラビリティゾーンにパブリック/プライベートサブネット
- **ECS Fargate**: Flaskアプリケーションのコンテナ実行環境（パブリックサブネット）
- **ECR**: Dockerイメージのプライベートリポジトリ
- **CodePipeline**: GitHubからのCI/CDパイプライン
- **CodeBuild**: Dockerイメージのビルドとプッシュ

## 前提条件

1. **AWS CLI**がインストールされ、適切な権限で設定されていること
2. **Node.js**と**npm**がインストールされていること
3. **AWS CDK**がインストールされていること
   ```bash
   npm install -g aws-cdk
   ```
4. **Docker**がインストールされていること（ローカルでのテスト用）

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. GitHub Connection の設定（推奨方式）

CDKデプロイ後、AWS コンソールで以下の手順を実行：

1. AWS コンソール → CodePipeline → Settings → Connections
2. 作成された `github-connection` を選択
3. "Update pending connection" をクリック
4. GitHub Apps の認証フローに従って承認
5. 必要なリポジトリへのアクセス権限を付与

**注意**: この方式では GitHub Personal Access Token は不要です。

### 3. GitHubリポジトリ情報の設定

`lib/flask-ecs-cdk-stack.ts` ファイルの以下の部分を実際の値に更新してください：

```typescript
// GitHub repository configuration
const githubOwner = 'YOUR_GITHUB_USERNAME'; // あなたのGitHubユーザー名
const githubRepo = 'YOUR_REPOSITORY_NAME';  // リポジトリ名
const githubBranch = 'main';                // ブランチ名（必要に応じて変更）
```

### 5. CDKのブートストラップ（初回のみ）

```bash
npx cdk bootstrap
```

### 6. 設定の確認

```bash
npx cdk synth
```

エラーが出ないことを確認してください。

### 7. デプロイ

```bash
npx cdk deploy
```

デプロイが完了すると、以下の出力が表示されます：
- ECRリポジトリのURI
- GitHubリポジトリのURL
- ECSクラスター名
- サービスアクセス情報

## アプリケーションへのアクセス

ECSサービスはパブリックサブネットに配置され、パブリックIPが割り当てられます。
アプリケーションにアクセスするには：

1. AWS コンソールでECSサービスのタスクを確認
2. タスクのパブリックIPアドレスを取得
3. `http://[パブリックIP]:5000` でアクセス

**注意**: セキュリティグループでポート5000がインターネットからのアクセスを許可するように設定されています。

## Flaskアプリケーションの準備

`flask-app/` ディレクトリにFlaskアプリケーションとDockerfileを配置してください。

### サンプル構成

```
flask-app/
├── app.py
├── requirements.txt
└── Dockerfile
```

### buildspec.yml

プロジェクトルートの `buildspec.yml` がCodeBuildで使用されます。このファイルは以下の処理を行います：
1. Dockerイメージのビルド
2. ECRへのプッシュ
3. ECSタスク定義の更新

## 有用なコマンド

* `npm run build`   TypeScriptをJavaScriptにコンパイル
* `npm run watch`   変更を監視してコンパイル
* `npm run test`    Jestユニットテストを実行
* `npx cdk deploy`  スタックをデフォルトのAWSアカウント/リージョンにデプロイ
* `npx cdk diff`    デプロイされたスタックと現在の状態を比較
* `npx cdk synth`   合成されたCloudFormationテンプレートを出力
* `npx cdk destroy` スタックを削除

## トラブルシューティング

### GitHub Connection の問題

AWS コンソールで以下を確認してください：
1. CodePipeline → Settings → Connections で Connection の状態が "Available" になっているか
2. GitHub Apps の権限設定が正しいか
3. 対象リポジトリへのアクセス権限が付与されているか

### パイプラインの確認

AWS コンソールで以下を確認してください：
1. CodePipeline の実行状況
2. CodeBuild のログ
3. ECS サービスの状態

## セキュリティ注意事項

- GitHub Connections v2 を使用することで、Personal Access Token の管理が不要になります
- 最小権限の原則に従ってIAMロールを設定してください
- GitHub Apps の権限は必要最小限に設定してください

## リソースの削除

プロジェクトが不要になった場合：

```bash
npx cdk destroy
```

注意: ECRリポジトリは手動で削除する必要がある場合があります。
