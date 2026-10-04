import Link from "next/link"

export default function GamesHubPage() {
  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white">משחקים</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        <Link href="/student/games/climb"
          className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
          <span className="text-3xl flex-shrink-0">🐸📚</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">טיפוס האילנות</p>
            <p className="text-white/40 text-xs">קפצו מספר לספר ככל שניתן — והיזהרו מעצמים נופלים</p>
          </div>
          <span className="text-white/30 flex-shrink-0">←</span>
        </Link>

        <Link href="/student/games/trivia"
          className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
          <span className="text-3xl flex-shrink-0">🧠</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">חידון ידע כללי</p>
            <p className="text-white/40 text-xs">100 שאלות, 3 חיים, 15 שניות לתשובה — כמה רחוק תגיעו?</p>
          </div>
          <span className="text-white/30 flex-shrink-0">←</span>
        </Link>

        <Link href="/student/games/mastermind"
          className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
          <span className="text-3xl flex-shrink-0">🧩</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">שובר קוד</p>
            <p className="text-white/40 text-xs">פצחו את הקוד הסודי לפי משוב הגיוני — כמה ניסיונות תצטרכו?</p>
          </div>
          <span className="text-white/30 flex-shrink-0">←</span>
        </Link>

        <Link href="/student/games/wordle"
          className="glass rounded-2xl p-4 flex items-center gap-3 interactive btn-press hover:bg-white/15 transition-colors">
          <span className="text-3xl flex-shrink-0">🔤</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm">מילה</p>
            <p className="text-white/40 text-xs">נחשו מילה בת 5 אותיות תוך 6 ניסיונות, לפי משוב הצבעים</p>
          </div>
          <span className="text-white/30 flex-shrink-0">←</span>
        </Link>
      </div>
    </div>
  )
}
