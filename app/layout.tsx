import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import GlobalBackground from "./components/GlobalBackground"

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "פַקפֵק",
  description: "אפליקציה כפר סילברית נסיונית",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "פַקפֵק",
  },
  // WhatsApp/Telegram/Facebook link previews read og:title/og:description
  // first, falling back to the plain title/description above only when
  // these are absent — set explicitly so the share-preview text is never
  // at the mercy of a platform's fallback behavior.
  openGraph: {
    title: "פַקפֵק",
    description: "אפליקציה כפר סילברית נסיונית",
    locale: "he_IL",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        <meta name="theme-color" content="#0B0B0E" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Versioned query string forces browsers to refetch instead of
            serving the old cached favicon/icon — bump it on the next
            icon change too, not just this one. */}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/icon-192.svg?v=2" />
        <link rel="apple-touch-icon" href="/icon-192.svg?v=2" />
      </head>
      <body className="min-h-screen bg-transparent">
        {/* Apply saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('app-theme');
            if (t && t !== 'stone') document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        <GlobalBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
