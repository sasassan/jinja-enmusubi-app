"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "'Hiragino Mincho ProN', 'Yu Mincho', 'Hiragino Sans', 'Yu Gothic', serif",
            background: "#FFF8F0",
            color: "#26201a",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", margin: 0 }}>
            問題が発生しました
          </h1>
          <p style={{ margin: 0, color: "#7a7263" }}>
            予期しないエラーが発生しました。しばらくしてから再度お試しください。
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "0.5rem",
              padding: "0.7rem 1.6rem",
              borderRadius: "999px",
              border: "none",
              background: "#C03A30",
              color: "#FFF8F0",
              cursor: "pointer",
              font: "inherit",
              minHeight: "44px",
            }}
          >
            再読み込みする
          </button>
        </main>
      </body>
    </html>
  );
}
