"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface StudentLink { id: string; name: string; linked: boolean; email: string | null }
interface ClassLink { classId: string; className: string; total: number; linkedCount: number; students: StudentLink[] }

export default function LinkCheckPage() {
  const [classes, setClasses] = useState<ClassLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/unlinked-students")
      .then(r => r.json())
      .then(d => setClasses(d.classes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalStudents = classes.reduce((sum, c) => sum + c.total, 0)
  const totalLinked = classes.reduce((sum, c) => sum + c.linkedCount, 0)
  const totalUnlinked = totalStudents - totalLinked

  return (
    <div className="min-h-screen bg-black/50 backdrop-blur-sm" dir="rtl">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 px-5 header-pt pb-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/home" className="text-white/60 hover:text-white text-xl interactive">←</Link>
        <h1 className="font-semibold text-lg text-white flex-1">בדיקת קישור תלמידים</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <p className="text-white/40 text-sm text-center py-8">טוען...</p>
        ) : (
          <>
            <div className={`rounded-2xl p-4 border ${totalUnlinked === 0 ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
              {totalUnlinked === 0 ? (
                <p className="text-green-300 text-sm font-medium">✓ כל {totalStudents} התלמידים מקושרים — מוכנים לשיעור</p>
              ) : (
                <p className="text-amber-300 text-sm font-medium">
                  ⚠️ {totalUnlinked} מתוך {totalStudents} תלמידים עדיין לא מקושרים לחשבון
                </p>
              )}
              <Link href="/manage" className="text-white/50 hover:text-white text-xs interactive underline mt-1.5 inline-block">
                לקישור תלמידים — הגדרות ← ניהול משתמשים ←
              </Link>
            </div>

            {classes.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">אין תלמידים במערכת</p>
            ) : (
              <div className="space-y-3">
                {classes.map(c => {
                  const unlinked = c.students.filter(s => !s.linked)
                  return (
                    <div key={c.classId} className="bg-white/8 border border-white/10 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{c.className}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${unlinked.length === 0 ? "bg-green-500/15 text-green-300" : "bg-amber-500/15 text-amber-300"}`}>
                          {c.linkedCount}/{c.total} מקושרים
                        </span>
                      </div>
                      {unlinked.length === 0 ? (
                        <p className="text-white/25 text-xs">כולם מקושרים 🎉</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {unlinked.map(s => (
                            <span key={s.id} className="bg-amber-500/10 text-amber-300/90 text-[11px] px-2 py-1 rounded-lg">{s.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
