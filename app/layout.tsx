import type { Metadata } from "next"
import { Heebo } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "כפר סילבר",
  description: "מערכת תקשורת בית ספרית — כיתה י2 סילבר",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "כפר סילבר",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        <meta name="theme-color" content="#1c1917" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="min-h-screen bg-white">
        {/* Apply saved theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('app-theme');
            if (t && t !== 'stone') document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        `}} />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
