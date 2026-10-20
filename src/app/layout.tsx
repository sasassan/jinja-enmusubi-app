import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPwaButton } from "@/components/pwa/InstallPwaButton";
import { SupabaseProvider } from "@/components/auth/SupabaseProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { SeasonProvider } from "@/components/SeasonProvider";

export const metadata: Metadata = {
  title: "神社御縁",
  description: "神様・御利益・由緒から、参拝先を探す。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "神社御縁",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#D4483A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `try{var h=new Date().getHours();if(h>=6&&h<18){document.documentElement.dataset.theme='light';}else{var saved=localStorage.getItem('jinja-goen:theme');document.documentElement.dataset.theme=saved||'dark';}}catch(e){}` }} />
      </head>
      <body>
        <SeasonProvider>
          <SupabaseProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
            <SiteChrome>
              <Suspense fallback={<p className="auth-note">読み込み中…</p>}>{children}</Suspense>
            </SiteChrome>
            <InstallPwaButton />
            <ServiceWorkerRegister />
          </SupabaseProvider>
        </SeasonProvider>
      </body>
    </html>
  );
}
