"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

interface NavTab {
  label: string
  href?: string
  comingSoon?: boolean
  icon: React.ReactNode
  badge?: number
}

interface BottomNavProps {
  tabs: NavTab[]
  activeColor: string
  activeBg: string
  activeTab?: string
  onTabChange?: (label: string) => void
  glassMode?: boolean  // for immersive dark backgrounds
}

export default function BottomNav({
  tabs, activeColor, activeBg, activeTab, onTabChange, glassMode,
}: BottomNavProps) {
  const pathname = usePathname()

  const navCls = glassMode
    ? "flex-shrink-0 glass-dark flex"
    : "flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-gray-100 flex shadow-[0_-1px_0_rgba(0,0,0,0.06)]"

  return (
    <nav className={navCls} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map((tab) => {
        const isActive = activeTab
          ? activeTab === tab.label
          : tab.href ? pathname.startsWith(tab.href) : false

        const inactiveText  = glassMode ? "text-white/40" : "text-gray-400"
        const inactiveHover = glassMode ? "hover:bg-white/10 active:bg-white/20" : "hover:bg-gray-50 active:bg-gray-100"

        const inner = (
          <div className={`
            flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl
            transition-all duration-150
            ${isActive ? `${activeBg} scale-105` : `${inactiveHover} active:scale-95`}
          `}>
            <div className={`relative transition-all duration-150 ${isActive ? `${activeColor} scale-110` : inactiveText}`}>
              {tab.icon}
              {tab.badge != null && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 animate-scale-in">
                  {tab.badge}
                </span>
              )}
              {tab.comingSoon && (
                <span className={`absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full ${glassMode ? "bg-white/30" : "bg-gray-300"}`} />
              )}
            </div>
            <span className={`text-[10px] font-semibold tracking-tight transition-all duration-150 ${isActive ? activeColor : inactiveText} ${tab.comingSoon ? "opacity-50" : ""}`}>
              {tab.label}
            </span>
          </div>
        )

        if (tab.href && !tab.comingSoon) {
          return (
            <Link key={tab.label} href={tab.href} className="flex-1 flex items-center justify-center py-1">
              {inner}
            </Link>
          )
        }
        return (
          <button key={tab.label} onClick={() => onTabChange?.(tab.label)} className="flex-1 flex items-center justify-center py-1">
            {inner}
          </button>
        )
      })}
    </nav>
  )
}
