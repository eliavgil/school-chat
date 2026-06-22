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
  title: "מערכת תקשורת הורים-מחנך",
  description: "פלטפורמת תקשורת חכמה לבית ספר",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
