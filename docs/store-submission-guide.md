# App Store / Google Play 提出ガイド

## 先に確認する重要事項

このリポジトリのWebアプリは Next.js の動的サーバーレンダリング（SSR）を使用しています。トップ・検索・地図・神様/人物ページは実行時にSupabaseからデータを取得し、管理画面では認証、Next.js Server Actions、`revalidatePath` を使用します。したがって、`output: "export"` による静的書き出しは現状の機能を保ったままでは使用できません。`next.config.ts` は既存のWeb公開用 `output: "standalone"` のままとし、Webのビルド・デプロイ経路を変更していません。

CapacitorのiOS/Androidプロジェクトと `webDir: "out"` の設定は用意しましたが、この構成では `out/` はまだ生成されず、`npm run build` もCapacitor向けWeb資産を作りません。`npx cap sync` 後にそのまま署名・提出できる完成アプリではありません。実機ビルドの前に、ローカルWeb資産に収まるネイティブ向けクライアント構成と、認証・データ取得・管理機能の扱い（既存SSRを使う場合はAPI/サーバー側構成を含む）を決め、Webとネイティブの両方を検証してください。`server.url` を使った公開Webサイトへの単純な転送にはしていません。

また、アプリ内でアカウントを作成できる場合、Apple/Googleの現行ポリシーに沿ったアカウント削除の導線・処理を提出前に確認してください。現在のプライバシーページはアカウント削除について問い合わせを案内しており、アプリ内削除機能の提供状況は別途確認が必要です。位置情報、認証、参拝記録、第三者サービス（地図タイルを含む）のデータ利用申告も実際の挙動に合わせて記入してください。

## Apple Developer 登録

1. [Apple Developer Program](https://developer.apple.com/programs/) を開き、Apple AccountでサインインしてEnrollします。
2. **個人（Individual）**は個人名義で公開し、法的な組織確認書類がない個人開発者向けです。販売元には個人の法的氏名が表示されます。
3. **組織（Organization）**は法人・団体として公開する場合に選びます。原則として法人格、D‑U‑N‑S Number、組織を代表して契約する権限などの確認が求められます。販売元には組織名が表示されます。個人事業主の扱いを含め、申し込み時のAppleの資格要件を確認してください。
4. 年会費は通常 **US$99/年**（地域・税により異なる場合があります）。本人確認、規約同意、支払いを完了します。
5. App Store Connectにアクセスできることを確認します。

## iOS ビルド・提出

**前提:** macOS、対応バージョンのXcode、Apple Developer Program登録、アプリのネイティブ向けWeb資産と実機動作確認が必要です。

1. プロジェクトの `ios/App/App.xcworkspace` をXcodeで開きます（macOS上で `npx cap open ios` を実行して開くこともできます）。
2. Xcodeの **Signing & Capabilities** でTeamを選び、Bundle Identifierが `jp.jinja.goen` であること、署名設定、必要な権限説明文を確認します。位置情報を使用する場合は、実際の利用目的を説明する文言と許可フローを確認します。
3. 実機でログイン、検索、地図、位置情報の拒否/許可、通信エラー、アカウント操作を確認します。必要なアプリアイコン、起動画面、バージョン、ビルド番号を設定します。
4. XcodeでGeneric iOS Deviceを選択し、**Product → Archive** を実行します。
5. Organizerの **Distribute App → App Store Connect → Upload** を選び、署名とアップロードを完了します。
6. App Store Connectでアプリレコードを作り、説明・キーワード・カテゴリ・年齢レーティング・プライバシー情報・サポートURL・スクリーンショットを入力します。輸出コンプライアンスなど該当する質問にも回答します。
7. ビルドを選択し、審査情報とデモアカウント（審査にログインが必要な場合）を登録して審査に提出します。

## Google Play 登録

1. [Google Play Console](https://play.google.com/console) からデベロッパーアカウントを作成します。
2. 登録料は通常 **US$25の一回払い**です。本人・組織確認、連絡先情報、支払いを完了します。
3. 新規の個人アカウントでは、公開前にクローズドテストなど追加要件が適用される場合があります。Consoleに表示される現行の確認・テスト要件を満たしてください。

## Android ビルド・提出

**前提:** Android Studio、対応するAndroid SDK/JDK、Google Play Console登録、アプリのネイティブ向けWeb資産と実機動作確認が必要です。

1. Android Studioで `android/` を開きます（環境が整った端末で `npx cap open android` を実行して開くこともできます）。
2. Gradle Sync後、アプリIDが `jp.jinja.goen` であること、バージョン、権限、アイコン、起動画面を確認します。
3. **Build → Generate Signed Bundle / APK → Android App Bundle** を選びます。
4. 初回はアップロード用キーストアを作成し、安全にバックアップします。秘密鍵やパスワードをリポジトリに入れず、紛失しないよう保管してください。
5. Play Consoleでアプリを作成し、署名済みAABを内部テストへアップロードします。実機確認後、本番トラックへ進めます。
6. ストア掲載情報、短い/詳しい説明、カテゴリ、コンテンツレーティング質問票、データセーフティ、プライバシーポリシー、スクリーンショット、必要なテスト情報を入力します。
7. 対象国、価格/配布、広告・アプリ内購入の有無などを確認し、審査に提出します。

## スクリーンショット

- **iOS:** 6.7インチ向け **1290×2796 px**、5.5インチ向け **1242×2208 px**。各端末サイズで3〜10枚。
- **Android:** 最低2枚、推奨8枚。縦横いずれも可（16:9または9:16）。Google Play Consoleが受け付ける最新寸法・形式をアップロード時に確認します。
- **撮影候補:** トップページと検索条件、検索結果、神社詳細、地図、神様一覧、人物一覧、ログイン後の参拝記録。
- 実際のアプリ画面を対応する端末/シミュレーターで撮影します。未実装機能や実在しない内容を画像に含めないでください。

## 準備済みアセット・掲載情報

- ストア文面: [`store-metadata.md`](./store-metadata.md)
- iOS用アイコン: [`../resources/icon-ios-1024.png`](../resources/icon-ios-1024.png)
- Google Play用アイコン: [`../resources/icon-android-512.png`](../resources/icon-android-512.png)
- Android adaptive icon: [`../resources/android-adaptive-foreground-432.png`](../resources/android-adaptive-foreground-432.png) / [`../resources/android-adaptive-background-432.png`](../resources/android-adaptive-background-432.png)
- スプラッシュ: [`../resources/splash-2732.png`](../resources/splash-2732.png)

アイコンやスプラッシュの取り込み先は、ネイティブプラットフォームの設定に応じてXcode/Android Studioで確認してください。提出直前にAppleとGoogleの公式要件・料金・審査ガイドラインを再確認してください。
