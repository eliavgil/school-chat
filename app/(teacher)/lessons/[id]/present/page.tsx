"use client"
import React, { useEffect, useLayoutEffect, useState, useCallback, use, useRef } from "react"
import QRCode from "react-qr-code"
import { browserClient } from "@/lib/lessons/supabase"
import type { Lesson, Slide, LiveSession, SlideAnimation } from "@/lib/lessons/types"
import { ConceptIcon } from "@/lib/lessons/icons"
import { NotebookPen } from "lucide-react"

interface Props { params: Promise<{ id: string }> }

const SLIDE_W = 1280
const SLIDE_H = 720
const MIN_FIT_SCALE = 0.62 // below this, dense slides (e.g. 5-question assessments) fall back to scrolling instead of illegible text

interface AggResult { [questionId: string]: { [answer: string]: number } }

const SLIDE_FONT = `@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Heebo:wght@300;400;500;700;900&display=swap');`

const CSS = `
  :root{--ink:#1B2A4A;--paper:#F5F1E6;--paper2:#ECE5D3;--seal:#A23B2E;--gold:#B08D3F;--ok:#3F6B4F;--line:rgba(27,42,74,0.14);}
  body{margin:0;}
  .topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 24px;background:var(--ink);border-bottom:1px solid rgba(176,141,63,0.3);flex-shrink:0;}
  .stage{flex:1;position:relative;overflow:hidden;}
  .slide-inner{position:absolute;inset:0;padding:40px 64px 90px 64px;overflow-y:auto;}
  .eyebrow{font-size:12px;letter-spacing:2.5px;color:var(--seal);font-weight:700;margin-bottom:6px;text-transform:uppercase;}
  h1.stitle{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:38px;color:var(--ink);margin:0 0 18px;line-height:1.2;border-bottom:2px solid var(--line);padding-bottom:14px;}
  .lead{font-size:16px;line-height:1.85;color:var(--ink);}
  .seal-stamp{position:absolute;left:28px;bottom:28px;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#7E2E24,var(--seal) 70%);color:var(--paper);display:flex;align-items:center;justify-content:center;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:22px;box-shadow:0 4px 14px rgba(0,0,0,0.25),inset 0 0 0 2px rgba(245,241,230,0.35);z-index:5;}
  .navbtns{position:absolute;bottom:24px;right:28px;display:flex;gap:10px;z-index:6;}
  .navbtn{width:46px;height:46px;border-radius:50%;border:1.5px solid var(--ink);background:var(--paper);color:var(--ink);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;}
  .navbtn:hover{background:var(--ink);color:var(--paper);}
  .navbtn:disabled{opacity:0.2;cursor:default;}
  .navbtn:disabled:hover{background:var(--paper);color:var(--ink);}
  .doodle{width:48px;height:48px;border:2px dashed var(--seal);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:10px;background:#fff;}
  .doodle svg{width:24px;height:24px;stroke:var(--seal);fill:none;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
  .card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;}
  .card h3{font-family:'Frank Ruhl Libre',serif;color:var(--ink);margin:0 0 6px;font-size:16px;}
  .card p{margin:0;font-size:14px;line-height:1.6;color:#4a4a45;}
  .qbox{margin-top:20px;background:var(--ink);color:var(--paper);border-radius:12px;padding:18px 22px;font-family:'Frank Ruhl Libre',serif;font-size:17px;}
  .bar-row{margin-bottom:10px;}
  .bar-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;color:var(--ink);font-weight:600;}
  .bar-bg{height:12px;background:var(--paper2);border-radius:6px;overflow:hidden;}
  .bar-fill{height:100%;background:linear-gradient(90deg,var(--gold),var(--seal));border-radius:6px;transition:width .5s ease;}
  .slide-inner.nb-page{background:#FFFCF2;padding:0;}
  .nb-head{padding:26px 34px 14px;}
  .nb-tab{display:inline-block;background:var(--seal);color:#fff;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:5px 14px;border-radius:0 0 8px 8px;margin-bottom:16px;}
  .nb-title{display:inline;font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:34px;color:var(--ink);margin:0;line-height:1.3;background:linear-gradient(transparent 62%,rgba(176,141,63,0.4) 62%);}
  .nb-rules{padding:42px 34px 26px;background-image:repeating-linear-gradient(transparent 0px,transparent 41px,rgba(70,110,190,0.32) 41px,rgba(70,110,190,0.32) 42px);}
  .nb-entry{margin-bottom:42px;}
  .nb-entry:last-child{margin-bottom:0;}
  .nb-line{margin:0;font-size:22px;line-height:42px;}
  .nb-term{font-family:'Frank Ruhl Libre',serif;font-weight:900;color:var(--seal);}
  .nb-def{font-family:'Heebo',sans-serif;font-weight:500;color:var(--ink);}
  .nb-freetext .lead{font-size:22px!important;line-height:42px!important;margin:0 0 42px 0!important;color:var(--ink);}
  .nb-freetext strong{color:var(--seal);font-weight:900;}
  .qz{margin-bottom:12px;padding:14px 16px;background:#fff;border:1px solid var(--line);border-radius:10px;}
  .qz .qtext{font-weight:700;color:var(--ink);margin-bottom:8px;font-size:14px;}
  .qz .opts{display:flex;flex-direction:column;gap:7px;}
  .qz .opt{padding:8px 12px;border:1.5px solid var(--line);border-radius:7px;font-size:13px;}
  .qz .opt.correct{background:rgba(63,107,79,.15);border-color:var(--ok);color:var(--ok);font-weight:700;}
  .task-item{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line);}
  .task-num{width:26px;height:26px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;}
  .enrich-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-top:16px;}
  .rtag{display:inline-block;font-size:10px;font-weight:700;color:#fff;background:var(--seal);border-radius:5px;padding:2px 7px;margin-bottom:6px;}
  .concept-icon-circle{width:46px;height:46px;border-radius:50%;background:var(--paper2);border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--seal);}
  .concept-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-top:18px;}
  .concept-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 16px;text-align:center;}
  .concept-card .concept-icon-circle{margin:0 auto 12px;}
  .concept-card h3{font-family:'Frank Ruhl Libre',serif;color:var(--ink);margin:0 0 5px;font-size:16px;}
  .concept-card p{margin:0;font-size:13px;line-height:1.5;color:#4a4a45;}
  .concept-list{display:flex;flex-direction:column;gap:16px;margin-top:20px;max-width:640px;}
  .concept-list-item{display:flex;align-items:flex-start;gap:14px;}
  .concept-list-item h3{font-family:'Frank Ruhl Libre',serif;color:var(--ink);margin:0 0 3px;font-size:16px;}
  .concept-list-item p{margin:0;font-size:14px;line-height:1.55;color:#4a4a45;}
  .timeline-wrap{position:relative;margin-top:40px;overflow-x:auto;padding-bottom:4px;}
  .timeline-track{position:relative;display:flex;min-height:360px;min-width:min-content;}
  .timeline-line{position:absolute;top:50%;left:0;right:0;height:2px;background:var(--ink);opacity:.28;transform:translateY(-50%);}
  .timeline-item{position:relative;flex:1 0 128px;min-width:128px;height:360px;}
  .timeline-dot{position:absolute;top:50%;left:50%;width:13px;height:13px;border-radius:50%;background:var(--seal);border:3px solid var(--paper);box-shadow:0 0 0 2px var(--ink);transform:translate(-50%,-50%);z-index:2;}
  .timeline-connector{position:absolute;left:50%;width:2px;background:var(--ink);opacity:.28;transform:translateX(-50%);}
  .timeline-connector.above{bottom:50%;height:24px;}
  .timeline-connector.below{top:50%;height:24px;}
  .timeline-card{position:absolute;left:50%;transform:translateX(-50%);width:132px;text-align:center;background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px 10px;}
  .timeline-card.above{bottom:calc(50% + 24px);}
  .timeline-card.below{top:calc(50% + 24px);}
  .timeline-year{font-family:'Frank Ruhl Libre',serif;font-weight:800;color:var(--seal);font-size:14px;margin:0 0 3px;direction:ltr;unicode-bidi:isolate;}
  .timeline-event{margin:0;font-size:11.5px;line-height:1.4;color:#4a4a45;}
  .brain-break-wrap{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:64px;}
  .brain-break-title{font-family:'Frank Ruhl Libre',serif;font-weight:900;font-size:72px;color:var(--ink);text-align:center;}
  .practice-item{margin-bottom:26px;padding-bottom:26px;border-bottom:1px solid var(--line);}
  .practice-item:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none;}
  .practice-tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.5px;color:#fff;background:var(--seal);border-radius:6px;padding:3px 10px;margin-bottom:10px;}
  .practice-text{font-size:15px;line-height:1.8;color:var(--ink);white-space:pre-line;}
  .sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:40;backdrop-filter:blur(2px);}
  .sidebar{position:fixed;top:0;right:0;bottom:0;width:280px;background:var(--ink);border-left:1px solid rgba(176,141,63,0.25);z-index:41;display:flex;flex-direction:column;box-shadow:-8px 0 32px rgba(0,0,0,0.4);}
  .sidebar-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(176,141,63,0.2);flex-shrink:0;}
  .sidebar-title{color:var(--paper);font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:15px;}
  .sidebar-close{background:none;border:none;color:rgba(245,241,230,0.5);font-size:20px;cursor:pointer;padding:2px 6px;border-radius:6px;}
  .sidebar-close:hover{color:var(--paper);}
  .sidebar-list{flex:1;overflow-y:auto;padding:8px;}
  .sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:.15s;}
  .sidebar-item:hover{background:rgba(245,241,230,0.08);}
  .sidebar-item.active{background:rgba(176,141,63,0.18);border:1px solid rgba(176,141,63,0.35);}
  .sidebar-num{width:24px;height:24px;border-radius:50%;background:var(--seal);color:var(--paper);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
  .sidebar-item.active .sidebar-num{background:var(--gold);}
  .sidebar-label{font-size:13px;color:rgba(245,241,230,0.8);font-weight:600;line-height:1.3;flex:1;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
  .sidebar-type{font-size:10px;color:rgba(245,241,230,0.35);letter-spacing:1px;text-transform:uppercase;margin-top:1px;}
  .icon-btn{background:rgba(245,241,230,0.1);border:1px solid rgba(245,241,230,0.15);border-radius:7px;color:rgba(245,241,230,0.7);width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;flex-shrink:0;}
  .icon-btn:hover{background:rgba(245,241,230,0.18);color:var(--paper);}
  @keyframes run-across{from{left:1320px}to{left:-240px}}
  @keyframes run-across-loop{from{left:1320px}to{left:-240px}}
  .anim-across{position:absolute;bottom:70px;width:220px;height:220px;z-index:20;pointer-events:none;}
  .anim-across.once{animation:run-across 5s linear forwards;}
  .anim-across.loop{animation:run-across 6s linear infinite;}
  .anim-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:280px;height:280px;z-index:20;pointer-events:none;}
  .anim-big-center{position:absolute;top:68%;left:50%;transform:translate(-50%,-50%);width:400px;height:400px;z-index:20;pointer-events:none;}
  .anim-corner-right{position:absolute;bottom:80px;right:80px;width:200px;height:200px;z-index:20;pointer-events:none;}
  .anim-corner-left{position:absolute;bottom:80px;left:80px;width:200px;height:200px;z-index:20;pointer-events:none;}
  .anim-top{position:absolute;top:20px;left:50%;transform:translateX(-50%);width:200px;height:200px;z-index:20;pointer-events:none;}
  @media (max-width: 767px) {
    .slide-inner{padding:24px 20px 100px 20px;}
    h1.stitle{font-size:26px;}
    .enrich-grid{grid-template-columns:1fr;}
    .concept-grid{grid-template-columns:1fr 1fr;}
    .timeline-track{min-height:300px;}
    .timeline-item{flex:1 0 104px;min-width:104px;height:300px;}
    .timeline-card{width:104px;padding:7px 8px;}
    .timeline-year{font-size:12px;}
    .timeline-event{font-size:10.5px;}
    .slide-inner.nb-page{padding:0;}
    .nb-head{padding:20px 20px 10px;}
    .nb-title{font-size:24px;}
    .nb-rules{padding:34px 20px 20px;background-image:repeating-linear-gradient(transparent 0px,transparent 33px,rgba(70,110,190,0.32) 33px,rgba(70,110,190,0.32) 34px);}
    .nb-entry{margin-bottom:34px;}
    .nb-line{font-size:17px;line-height:34px;}
    .nb-freetext .lead{font-size:17px!important;line-height:34px!important;margin:0 0 34px 0!important;}
    .topbar{padding:10px 12px;}
    @keyframes run-across{from{left:110%}to{left:-60%}}
    .anim-across{width:150px;height:150px;bottom:50px;}
    .anim-center{width:180px;height:180px;}
    .anim-big-center{width:260px;height:260px;}
    .brain-break-title{font-size:36px;}
    .anim-corner-right,.anim-corner-left{width:130px;height:130px;}
    .anim-top{width:130px;height:130px;}
  }
  @keyframes winner-pop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
`

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function SlideMedia({ slide, onMediaLoad }: { slide: Slide, onMediaLoad?: () => void }) {
  const ytUrl = slide.youtube_url || slide.link_url || ""
  const ytId = ytUrl ? extractYouTubeId(ytUrl) : null
  const gallery = slide.image_position !== "background" ? slide.images?.filter(Boolean) : null
  const showImg = !gallery?.length && slide.image_url && slide.image_position !== "background"

  return (
    <>
      {gallery && gallery.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, height: 320 }}>
          {gallery.map((url, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" onLoad={onMediaLoad} onError={onMediaLoad} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ))}
        </div>
      )}
      {showImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={slide.image_url!} alt="" onLoad={onMediaLoad} onError={onMediaLoad} style={{
          width: slide.image_size === "small" ? "40%" : slide.image_size === "medium" ? "65%" : slide.image_size === "large" ? "85%" : "100%",
          // Fixed px, not "%" — the parent (contentRef) has an auto height, and CSS
          // resolves a percentage max-height against an auto-height container to
          // "none" (no constraint at all), so the image would render at its full
          // natural height instead of being capped.
          // media-only has no title/body competing for space, so it gets almost
          // the whole slide; other types (topic, study...) leave room below it.
          maxHeight: Math.round(SLIDE_H * (slide.type === "media-only" ? 0.78 : 0.42)),
          borderRadius: 10, marginBottom: 16, display: "block", objectFit: "contain", margin: "0 auto 16px",
        }} />
      )}
      {ytId && (
        <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "#000" }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {slide.link_url && !ytId && (
        <a href={slide.link_url} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--seal)", fontWeight: 700, fontSize: 13, textDecoration: "none", border: "1.5px solid var(--seal)", borderRadius: 8, padding: "7px 14px", marginBottom: 14 }}>
          🔗 פתח קישור
        </a>
      )}
    </>
  )
}

function DoodleIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactElement> = {
    "lesson-topic": <svg viewBox="0 0 24 24"><path d="M12 2l2.5 6.5L21 9l-5 4.5 1.5 7L12 17l-5.5 3.5 1.5-7L3 9l6.5-.5z"/></svg>,
    objectives: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>,
    "media-only": <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 15l-5.5-5.5L4 21"/></svg>,
    opinion: <svg viewBox="0 0 24 24"><path d="M12 3v10M8 8l4-4 4 4"/><path d="M5 15c0 3 3 6 7 6s7-3 7-6"/></svg>,
    "alertness-check": <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>,
    definitions: <svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>,
    "concept-grid": <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    study: <svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v16H6.5A2.5 2.5 0 004 21.5z"/><path d="M4 5.5v13A2.5 2.5 0 006.5 21H20"/></svg>,
    practice: <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>,
    enrichment: <svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3 11c1 .7 1 1.5 1 2h4c0-.5 0-1.3 1-2a6 6 0 00-3-11z"/></svg>,
    homework: <svg viewBox="0 0 24 24"><path d="M7 8V6a5 5 0 0110 0v2"/><rect x="4" y="8" width="16" height="12" rx="2"/></svg>,
    feedback: <svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/><path d="M9 10h6M9 13h4"/></svg>,
    _answerKey: <svg viewBox="0 0 24 24"><path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 7l3 3"/></svg>,
  }
  icons.assessment = icons["alertness-check"]
  icons.assessment_answers = icons._answerKey
  return <div className="doodle">{icons[type] ?? icons["lesson-topic"]}</div>
}

function renderInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function renderTable(lines: string[], key: number) {
  const rows = lines
    .filter(l => l.trim().startsWith("|") && !/^\|[\s\-|]+\|$/.test(l.trim()))
    .map(l => l.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim()))
  if (rows.length < 1) return null
  const [header, ...body] = rows
  return (
    <div key={key} style={{ overflowX: "auto", marginBottom: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, direction: "rtl" }}>
        <thead>
          <tr>{header.map((h, i) => <th key={i} style={{ textAlign: "right", padding: "7px 10px", background: "var(--ink)", color: "var(--paper)", fontWeight: 700, borderBottom: "2px solid var(--gold)" }}>{renderInline(h)}</th>)}</tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--paper2)" : "#fff" }}>
              {row.map((cell, ci) => <td key={ci} style={{ padding: "7px 10px", borderBottom: "1px solid var(--line)" }}>{renderInline(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderBody(text: string) {
  return text.split(/\n\n+/).map((para, pi) => {
    const trimmed = para.trim()

    if (trimmed === "---") {
      return <hr key={pi} style={{ border: "none", borderTop: "1px solid var(--line)", margin: "12px 0" }} />
    }

    if (trimmed.startsWith("> ")) {
      return <blockquote key={pi} style={{ borderRight: "3px solid var(--seal)", paddingRight: 14, margin: "10px 0", color: "var(--seal)", fontWeight: 600, fontSize: 15 }}>{renderInline(trimmed.slice(2))}</blockquote>
    }

    const lines = para.split("\n")
    const isTable = lines.filter(l => l.trim().startsWith("|")).length >= 2
    if (isTable) return renderTable(lines, pi)

    return (
      <p key={pi} className="lead" style={{ marginBottom: 10, marginTop: 0 }}>
        {lines.map((line, li) => (
          <span key={li}>{renderInline(line)}{li < lines.length - 1 && <br />}</span>
        ))}
      </p>
    )
  })
}

function AudioButton({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  useEffect(() => () => { audioRef.current?.pause() }, [])

  return (
    <button onClick={toggle} style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: playing ? "#A23B2E" : "#1B2A4A",
      color: "#F5F1E6", border: "none", borderRadius: 10,
      padding: "9px 18px", fontFamily: "'Heebo',sans-serif",
      fontWeight: 700, fontSize: 14, cursor: "pointer",
      marginBottom: 16, transition: ".2s",
    }}>
      {playing ? "⏹ עצור" : "🔊 נגן"}
    </button>
  )
}

function NotebookSlide({ slide }: { slide: Slide }) {
  const { eyebrow, body, questions } = slide
  const pageRef = useRef<HTMLDivElement>(null)
  const rulesRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)

  useLayoutEffect(() => {
    const page = pageRef.current
    const rules = rulesRef.current
    if (!page || !rules) return
    const headEl = page.querySelector<HTMLDivElement>(".nb-head")
    const available = page.clientHeight - (headEl?.offsetHeight ?? 0)
    const natural = rules.scrollHeight
    const factor = natural > available ? Math.max(available / natural, MIN_FIT_SCALE) : 1
    setFit(Math.round(factor * 1000) / 1000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id])

  const fitStyle: React.CSSProperties = fit < 1
    ? { transform: `scale(${fit})`, transformOrigin: "top right", width: `${100 / fit}%` }
    : {}

  return (
    <div className="slide-inner nb-page" ref={pageRef}>
      <div className="nb-head">
        <div className="nb-tab">{eyebrow || "מושגים למבחן"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <NotebookPen size={30} strokeWidth={2.2} color="var(--seal)" />
          <h1 className="nb-title">להעתיק למחברת!</h1>
        </div>
      </div>
      <div className="nb-rules" ref={rulesRef} style={fitStyle}>
        {questions
          ? questions.map(q => (
              <div key={q.id} className="nb-entry">
                <div className="nb-line nb-term">{q.text}</div>
                <div className="nb-line nb-def">{q.feedback ?? q.options[0]}</div>
              </div>
            ))
          : body && <div className="nb-freetext">{renderBody(body)}</div>}
      </div>
    </div>
  )
}

function BrainBreakSlide() {
  return (
    <div className="slide-inner">
      <div className="brain-break-wrap">
        <h1 className="brain-break-title">מנוחמוח</h1>
      </div>
    </div>
  )
}

function SlideView({ slide, agg, revealOpen, setRevealOpen }: {
  slide: Slide
  agg: AggResult
  revealOpen: boolean
  setRevealOpen: (v: boolean) => void
}) {
  const { type, eyebrow, title, body, questions } = slide

  // Auto-shrink dense slides so they fit without scrolling; slides that still
  // don't fit at MIN_FIT_SCALE (e.g. long assessments) just fall back to the
  // container's own overflow-y:auto scroll. Hooks must run unconditionally
  // (before the definitions/brain-break early returns below) — they simply
  // no-op there since slideInnerRef/contentRef never get attached.
  const slideInnerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)

  const recomputeFit = useCallback(() => {
    // Assessment slides are fine to scroll — never shrink their text.
    if (type === "assessment" || type === "assessment_answers") return
    const inner = slideInnerRef.current
    const content = contentRef.current
    if (!inner || !content) return
    const cs = getComputedStyle(inner)
    const available = inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
    const natural = content.scrollHeight
    const factor = natural > available ? Math.max(available / natural, MIN_FIT_SCALE) : 1
    setFit(Math.round(factor * 1000) / 1000)
  }, [type])

  useLayoutEffect(() => {
    recomputeFit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id])

  if (type === "definitions") return <NotebookSlide slide={slide} />
  if (type === "brain-break") return <BrainBreakSlide />

  const isBackground = slide.image_position === "background"
  const hideHeader = type === "media-only" || type === "answer"

  const bgStyle: React.CSSProperties = isBackground && slide.image_url ? {
    backgroundImage: `url(${slide.image_url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : {}

  const fitStyle: React.CSSProperties = fit < 1
    ? { transform: `scale(${fit})`, transformOrigin: "top right", width: `${100 / fit}%` }
    : {}

  return (
    <div className="slide-inner" ref={slideInnerRef} style={bgStyle}>
      {isBackground && slide.image_url && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(245,241,230,0.88)", borderRadius: 16 }} />
      )}
      <div ref={contentRef} style={{ position: "relative", zIndex: 1, ...fitStyle, ...(type === "media-only" ? { display: "flex", flexDirection: "column", justifyContent: "center", minHeight: fit < 1 ? undefined : "100%" } : {}) }}>
      {!hideHeader && <DoodleIcon type={type} />}
      {!hideHeader && <div className="eyebrow">{eyebrow || type}</div>}
      {!hideHeader && <h1 className="stitle">{title}</h1>}

      {/* Media: image (non-background) + YouTube + link */}
      <SlideMedia slide={slide} onMediaLoad={recomputeFit} />

      {/* Audio player */}
      {slide.audio_url && <AudioButton url={slide.audio_url} key={slide.id} />}

      {body && <div>{renderBody(body)}</div>}

      {/* OPINION / ALERTNESS-CHECK / ASSESSMENT — bar chart results */}
      {(type === "opinion" || type === "alertness-check" || type === "assessment" || type === "assessment_answers") && questions && questions.map((q, qi) => {
        const qAgg = agg[q.id] ?? {}
        const total = Object.values(qAgg).reduce((s, v) => s + v, 0)
        const letters = ["א", "ב", "ג", "ד", "ה"]
        const showCorrect = type === "assessment_answers" || revealOpen
        return (
          <div key={q.id} style={{ marginBottom: 28, paddingTop: qi > 0 ? 16 : 0, borderTop: qi > 0 ? "1px solid rgba(27,42,74,0.14)" : "none" }}>
            {/* Question number + text */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
              <span style={{ background: "#A23B2E", color: "#F5F1E6", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0, fontFamily: "'Frank Ruhl Libre',serif", lineHeight: 1 }}>{qi + 1}</span>
              <div style={{ fontWeight: 700, color: "#1B2A4A", fontSize: 15, lineHeight: 1.4 }}>{q.text}</div>
            </div>
            {/* Options with letter labels */}
            <div style={{ maxWidth: 580, paddingRight: 38 }}>
              {q.options.map((opt, oi) => {
                const cnt = qAgg[String(oi)] ?? 0
                const pct = total ? Math.round((cnt / total) * 100) : 0
                const isCorrect = showCorrect && q.correct_index !== null && oi === q.correct_index
                const badgeBg = isCorrect ? "#3F6B4F" : "#1B2A4A"
                return (
                  <div key={oi} className="bar-row">
                    <div className="bar-label">
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: isCorrect ? "#3F6B4F" : "#1B2A4A" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: badgeBg, color: "#F5F1E6", borderRadius: 4, minWidth: 22, height: 22, fontSize: 12, fontWeight: 900, flexShrink: 0, padding: "0 4px" }}>{letters[oi] ?? oi + 1}</span>
                        {opt}{isCorrect ? " ✓" : ""}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>{cnt > 0 ? `${cnt} (${pct}%)` : "—"}</span>
                    </div>
                    <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                )
              })}
              {total > 0 && <div style={{ fontSize: 12, color: "rgba(27,42,74,0.45)", marginTop: 6 }}>{total} תגובות</div>}
            </div>
          </div>
        )
      })}

      {/* Reveal-answer toggle — alertness-check / assessment only (never auto-shown while projected) */}
      {(type === "alertness-check" || type === "assessment") && questions?.some(q => q.correct_index !== null) && (
        <button
          onClick={() => setRevealOpen(!revealOpen)}
          style={{ background: "var(--ink)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "10px 20px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
          {revealOpen ? "הסתר תשובות נכונות" : "חשיפת תשובה"}
        </button>
      )}

      {/* PRACTICE — full bagrut-style questions, tagged by question type */}
      {type === "practice" && questions && (
        <div style={{ marginTop: 16, maxWidth: 760 }}>
          {questions.map(q => (
            <div key={q.id} className="practice-item">
              {q.tag && <span className="practice-tag">{q.tag}</span>}
              <div className="practice-text">{q.text}</div>
              {q.options.filter(Boolean).length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {q.options.filter(Boolean).map((opt, oi) => (
                    <div key={oi} style={{ fontSize: 14, color: "var(--ink)" }}>
                      <strong>{["א", "ב", "ג", "ד", "ה"][oi] ?? oi + 1}.</strong> {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HOMEWORK — task list */}
      {type === "homework" && questions && (
        <div style={{ marginTop: 16, maxWidth: 640 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="task-item">
              <div className="task-num">{i + 1}</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)" }}>{q.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* ENRICHMENT — 3-col grid */}
      {type === "enrichment" && questions && (
        <div className="enrich-grid">
          {questions.map(q => (
            <div key={q.id} className="card">
              <span className="rtag">{q.feedback ?? "העשרה"}</span>
              <h3 style={{ fontFamily: "'Frank Ruhl Libre',serif", color: "var(--ink)", margin: "0 0 6px", fontSize: 15 }}>{q.text}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#4a4a45" }}>{q.options[0] ?? ""}</p>
            </div>
          ))}
        </div>
      )}

      {/* STUDY (timeline layout) — horizontal line with events alternating above/below */}
      {type === "study" && slide.layout === "timeline" && questions && (
        <div className="timeline-wrap">
          <div className="timeline-track">
            <div className="timeline-line" />
            {questions.map((q, qi) => (
              <div key={q.id} className="timeline-item">
                <div className="timeline-dot" />
                <div className={`timeline-connector ${qi % 2 === 0 ? "above" : "below"}`} />
                <div className={`timeline-card ${qi % 2 === 0 ? "above" : "below"}`}>
                  <p className="timeline-year">{q.text}</p>
                  <p className="timeline-event">{q.options[0] ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONCEPT-GRID / STUDY / OBJECTIVES — icon cards (grid) or icon list (list) */}
      {(type === "concept-grid" || type === "study" || type === "objectives") && slide.layout !== "timeline" && questions && (
        slide.layout === "list" ? (
          <div className="concept-list">
            {questions.map(q => (
              <div key={q.id} className="concept-list-item">
                <div className="concept-icon-circle"><ConceptIcon name={q.icon} /></div>
                <div>
                  <h3>{q.text}</h3>
                  <p>{q.options[0] ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="concept-grid">
            {questions.map(q => (
              <div key={q.id} className="concept-card">
                <div className="concept-icon-circle"><ConceptIcon name={q.icon} /></div>
                <h3>{q.text}</h3>
                <p>{q.options[0] ?? ""}</p>
              </div>
            ))}
          </div>
        )
      )}

      {/* FEEDBACK — show question text */}
      {type === "feedback" && questions && questions.map((q, qi) => (
        <div key={q.id} style={{ marginBottom: 20, paddingTop: qi > 0 ? 14 : 0, borderTop: qi > 0 ? "1px solid var(--line)" : "none" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <span style={{ background: "#A23B2E", color: "#F5F1E6", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0, fontFamily: "'Frank Ruhl Libre',serif", lineHeight: 1 }}>{qi + 1}</span>
            <div className="qbox" style={{ flex: 1 }}>{q.text}</div>
          </div>
          <div style={{ marginTop: 10, maxWidth: 480 }}>
            {Array.from({ length: q.options.length || 5 }, (_, oi) => {
              const opt = q.options[oi]
              const cnt = (agg[q.id] ?? {})[String(oi)] ?? 0
              const total = Object.values(agg[q.id] ?? {}).reduce((s, v) => s + v, 0)
              const pct = total ? Math.round((cnt / total) * 100) : 0
              return (
                <div key={oi} className="bar-row">
                  <div className="bar-label">
                    <span>{"★".repeat(oi + 1)}{opt ? ` ${opt}` : ""}</span>
                    <span>{cnt}</span>
                  </div>
                  <div className="bar-bg"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
      </div>{/* /relative z-1 */}
    </div>
  )
}

function NameSpinner({ students, onClose }: { students: { id: string; name: string }[], onClose: () => void }) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle")
  const [current, setCurrent] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function spin() {
    if (students.length === 0 || phase === "spinning") return
    const winner = students[Math.floor(Math.random() * students.length)].name
    setPhase("spinning")
    const startTime = Date.now()
    const duration = 3200
    const tick = () => {
      const elapsed = Date.now() - startTime
      if (elapsed >= duration) { setCurrent(winner); setPhase("done"); return }
      const delay = 55 + Math.pow(elapsed / duration, 1.8) * 320
      setCurrent(students[Math.floor(Math.random() * students.length)].name)
      timerRef.current = setTimeout(tick, delay)
    }
    timerRef.current = setTimeout(tick, 55)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--ink)", border: "2px solid rgba(176,141,63,0.4)", borderRadius: 20, padding: "40px 56px", textAlign: "center", minWidth: 360, direction: "rtl", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: "rgba(245,241,230,0.35)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
        <div style={{ color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: 2.5, marginBottom: 28, textTransform: "uppercase" }}>גלגל שמות</div>
        <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,241,230,0.06)", borderRadius: 14, marginBottom: 28, overflow: "hidden", border: phase === "done" ? "1.5px solid rgba(176,141,63,0.4)" : "1.5px solid rgba(245,241,230,0.06)" }}>
          {phase === "idle" && <span style={{ color: "rgba(245,241,230,0.2)", fontSize: 40, fontFamily: "'Frank Ruhl Libre',serif" }}>?</span>}
          {phase === "spinning" && <span style={{ color: "var(--paper)", fontSize: 34, fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, filter: "blur(1.5px)", userSelect: "none" }}>{current}</span>}
          {phase === "done" && <span style={{ color: "var(--gold)", fontSize: 42, fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, animation: "winner-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards", userSelect: "none" }}>{current}</span>}
        </div>
        <button onClick={spin} disabled={phase === "spinning"} style={{ background: phase === "done" ? "rgba(176,141,63,0.15)" : "var(--seal)", color: "var(--paper)", border: phase === "done" ? "1.5px solid var(--gold)" : "none", borderRadius: 10, padding: "12px 36px", fontFamily: "'Heebo',sans-serif", fontWeight: 700, fontSize: 16, cursor: phase === "spinning" ? "default" : "pointer", opacity: phase === "spinning" ? 0.55 : 1, transition: ".2s" }}>
          {phase === "idle" ? "🎲 סובב" : phase === "spinning" ? "מסתובב..." : "🎲 שוב"}
        </button>
        {phase === "done" && <div style={{ color: "rgba(245,241,230,0.45)", fontSize: 12, marginTop: 16 }}>{students.length} תלמידים בכיתה</div>}
      </div>
    </div>
  )
}

function AnimOverlay({ anim, lottieDivRef }: {
  anim: SlideAnimation
  lottieDivRef: React.RefObject<HTMLDivElement | null>
}) {
  const pos = anim.position ?? "across"
  const loop = anim.loop ?? false
  const cls = pos === "across"
    ? `anim-across ${loop ? "loop" : "once"}`
    : `anim-${pos}`
  const flip = pos === "across"
  return (
    <div className={cls}>
      <div ref={lottieDivRef} style={{ width: "100%", height: "100%", ...(flip ? { transform: "scaleX(-1)" } : {}) }} />
    </div>
  )
}

export default function PresentPage({ params }: Props) {
  const { id } = use(params)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [idx, setIdx] = useState(0)
  const [session, setSession] = useState<LiveSession | null>(null)
  const [agg, setAgg] = useState<AggResult>({})
  const [revealOpen, setRevealOpen] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") return 1
    return Math.min(window.innerWidth / SLIDE_W, (window.innerHeight - 60) / SLIDE_H)
  })
  const [animActive, setAnimActive] = useState(false)
  const lottieDivRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [spinnerOpen, setSpinnerOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [classPickerOpen, setClassPickerOpen] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  useEffect(() => {
    fetch("/api/class/students").then(r => r.ok ? r.json() : []).then(d => {
      if (Array.isArray(d)) setStudents(d)
    })
  }, [])

  useEffect(() => {
    fetch(`/api/lessons/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); return }
      setLesson(d)
    })
  }, [id])

  const slide = lesson?.slides[idx]

  // Never let a reveal carry over to the next slide — reset regardless of live-session state
  useEffect(() => {
    setRevealOpen(false)
  }, [slide?.id])

  // Fetch aggregated responses when slide changes
  useEffect(() => {
    if (!session || !slide) return
    setAgg({})
    fetchAgg(session.id, slide.id)
  }, [session?.id, slide?.id])

  // Poll for new responses every 3 seconds while a session is active
  useEffect(() => {
    if (!session || !slide) return
    const interval = setInterval(() => fetchAgg(session.id, slide.id), 3000)
    return () => clearInterval(interval)
  }, [session?.id, slide?.id])

  async function fetchAgg(sessionId: string, slideId: string) {
    const r = await fetch(`/api/responses?session_id=${sessionId}&slide_id=${slideId}`)
    if (!r.ok) return
    const rows: { question_id: string; answer: string }[] = await r.json()
    const result: AggResult = {}
    for (const row of rows) {
      if (!result[row.question_id]) result[row.question_id] = {}
      result[row.question_id][row.answer] = (result[row.question_id][row.answer] ?? 0) + 1
    }
    setAgg(result)
  }

  async function openClassPicker() {
    if (!lesson) return
    try {
      const res = await fetch("/api/supabase-classes")
      const data = res.ok ? await res.json() : []
      setAvailableClasses(data)
    } catch {
      setAvailableClasses([])
    }
    setClassPickerOpen(true)
  }

  async function startSession(class_id: string) {
    if (!lesson) return
    setClassPickerOpen(false)
    setStarting(true)
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lesson.id, class_id }),
      })
      const data = await res.json()
      if (res.ok) setSession(data)
      else setError(data.error ?? `שגיאה ${res.status}`)
    } catch (e: any) {
      setError(e.message ?? "שגיאת רשת")
    }
    setStarting(false)
  }

  async function endSession() {
    if (!session) return
    await fetch(`/api/sessions/${session.room_code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    })
    setSession(null)
  }

  const go = useCallback(async (newIdx: number) => {
    if (!lesson || newIdx < 0 || newIdx >= lesson.slides.length) return
    setIdx(newIdx)
    if (session) {
      await fetch(`/api/sessions/${session.room_code}/slide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: newIdx }),
      })
    }
  }, [lesson, session])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "PageDown" || e.key === " ") go(idx + 1)
      if (e.key === "ArrowRight" || e.key === "PageUp") go(idx - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, idx])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const update = () => {
      const s = Math.min(el.clientWidth / SLIDE_W, el.clientHeight / SLIDE_H)
      setScale(Math.round(s * 1000) / 1000)
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Start animation timer when slide changes
  useEffect(() => {
    setAnimActive(false)
    const anim = slide?.animation
    if (!anim) return
    const t = setTimeout(() => setAnimActive(true), anim.delay * 1000)
    return () => { clearTimeout(t); setAnimActive(false) }
  }, [slide?.id])

  // Load and play Lottie when animActive becomes true
  useEffect(() => {
    if (!animActive || !slide?.animation?.name) return
    const { name, position = "across", loop = false } = slide.animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let inst: any
    let cancelled = false
    let t: ReturnType<typeof setTimeout> | undefined
    ;(async () => {
      const { default: lottie } = await import("lottie-web")
      if (cancelled || !lottieDivRef.current) return
      const data = await fetch(`/animations/${name}.json`).then(r => r.json())
      if (cancelled || !lottieDivRef.current) return
      inst = lottie.loadAnimation({
        container: lottieDivRef.current,
        animationData: data,
        loop,
        autoplay: true,
        renderer: "svg",
      })
      if (!loop) {
        if (position === "across") {
          // CSS animation handles timing; dismiss after it completes
          t = setTimeout(() => setAnimActive(false), 5500)
        } else {
          inst.addEventListener("complete", () => { if (!cancelled) setAnimActive(false) })
        }
      }
    })()
    return () => { cancelled = true; clearTimeout(t); inst?.destroy() }
  }, [animActive, slide?.animation?.name, slide?.animation?.position, slide?.animation?.loop])

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#A23B2E" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>{error}</p>
      </div>
    </div>
  )

  if (!lesson) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "'Heebo',sans-serif", color: "#1B2A4A", opacity: 0.5 }}>
      טוען שיעור...
    </div>
  )

  const total = lesson.slides.length

  const TYPE_LABELS: Record<string, string> = {
    "lesson-topic": "נושא השיעור", objectives: "מטרות", "media-only": "מדיה בלבד", opinion: "מה דעתכם?",
    "alertness-check": "בדיקת עירנות", definitions: "הגדרות מושגים", "concept-grid": "רשת מושגים",
    study: "הקניה", practice: "תרגול", answer: "תשובה", "brain-break": "מנוחמוח",
    enrichment: "העשרה", homework: "שיעורי בית", feedback: "משוב",
    assessment: "מבדק סוף שיעור", assessment_answers: "תשובות למבדק",
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--ink)", direction: "rtl", overflow: "hidden" }}>
      <style>{SLIDE_FONT + CSS}</style>

      {/* Topbar */}
      <div className="topbar">
        {/* Back to lessons list */}
        <a href="/lessons" className="icon-btn" title="חזרה לשיעורים" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>

        {/* Sidebar toggle */}
        <button className="icon-btn" onClick={() => setSidebarOpen(true)} title="רשימת שקפים" style={{ marginRight: 6 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div style={{ color: "var(--paper)", fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700, fontSize: 16, flex: 1, padding: "0 14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {lesson.title}
        </div>

        {/* Progress — desktop only */}
        {!isMobile && (
          <div style={{ width: 200, height: 3, background: "rgba(245,241,230,0.15)", margin: "0 16px", borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ height: "100%", width: `${((idx + 1) / total) * 100}%`, background: "linear-gradient(90deg,var(--gold),var(--seal))", transition: "width .3s ease" }} />
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
          <span style={{ color: "rgba(245,241,230,0.65)", fontSize: 13, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>

          {/* PDF export — desktop only */}
          {!isMobile && (
            <button onClick={() => window.open(`/lessons/${id}/print`, "_blank")}
              style={{ background: "rgba(245,241,230,0.1)", border: "1px solid rgba(245,241,230,0.3)", borderRadius: 7, color: "rgba(245,241,230,0.85)", padding: "0 12px", height: 34, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontFamily: "'Heebo',sans-serif", fontWeight: 700, flexShrink: 0, transition: ".15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,241,230,0.18)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--paper)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,241,230,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,241,230,0.85)" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm1-4h.01"/>
              </svg>
              PDF
            </button>
          )}

          {/* Edit button — desktop only */}
          {!isMobile && (
            <button className="icon-btn" onClick={() => window.open(`/lessons/${id}/edit`, "_blank")} title="ערוך שיעור">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
          )}

          {/* Name spinner — always visible */}
          <button className="icon-btn" onClick={() => setSpinnerOpen(true)} title="גלגל שמות" style={{ fontSize: 16 }}>🎲</button>

          {session ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setQrOpen(true)}
                style={{ background: "rgba(176,141,63,0.2)", border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: 6, padding: "4px 10px", fontSize: 13, fontFamily: "'Heebo'", fontWeight: 700, letterSpacing: 2, cursor: "pointer" }}
                title="הצג QR">
                🔴 {session.room_code} ⊞
              </button>
              <button onClick={endSession}
                style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 6, padding: "5px 10px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                סיים
              </button>
            </div>
          ) : (
            <button onClick={openClassPicker} disabled={starting}
              style={{ background: "var(--seal)", color: "var(--paper)", border: "none", borderRadius: 8, padding: "7px 16px", fontFamily: "'Heebo'", fontWeight: 700, fontSize: 13, cursor: starting ? "default" : "pointer", opacity: starting ? 0.7 : 1 }}>
              {starting ? "מתחיל..." : "▶ התחל שיעור"}
            </button>
          )}
        </div>
      </div>

      {/* Slide stage */}
      <div className="stage" ref={stageRef}>
        {isMobile ? (
          // Mobile: native width, no scale transform
          <div style={{ position: "absolute", inset: 0, background: "var(--paper)", overflow: "hidden" }}>
            {slide && (
              <SlideView key={slide.id} slide={slide} agg={agg} revealOpen={revealOpen} setRevealOpen={setRevealOpen} />
            )}
            {animActive && slide?.animation && (
              <AnimOverlay anim={slide.animation} lottieDivRef={lottieDivRef} />
            )}
            <div className="seal-stamp">{idx + 1}</div>
            <div className="navbtns">
              <button className="navbtn" disabled={idx === 0} onClick={() => go(idx - 1)}>›</button>
              <button className="navbtn" disabled={idx === total - 1} onClick={() => go(idx + 1)}>‹</button>
            </div>
          </div>
        ) : (
          // Desktop: 1280×720 fixed canvas, scaled to fit
          <div style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: SLIDE_W,
            height: SLIDE_H,
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
            background: "var(--paper)",
            borderRadius: 12,
            overflow: "hidden",
          }}>
            {slide && (
              <SlideView key={slide.id} slide={slide} agg={agg} revealOpen={revealOpen} setRevealOpen={setRevealOpen} />
            )}

            {animActive && slide?.animation && (
              <AnimOverlay anim={slide.animation} lottieDivRef={lottieDivRef} />
            )}

            <div className="seal-stamp">{idx + 1}</div>
            <div className="navbtns">
              <button className="navbtn" disabled={idx === 0} onClick={() => go(idx - 1)}>›</button>
              <button className="navbtn" disabled={idx === total - 1} onClick={() => go(idx + 1)}>‹</button>
            </div>
          </div>
        )}
      </div>

      {/* Slides sidebar */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <div className="sidebar">
            <div className="sidebar-head">
              <span className="sidebar-title">שקפים</span>
              <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
            </div>
            <div className="sidebar-list">
              {lesson.slides.map((s, i) => (
                <div
                  key={s.id}
                  className={`sidebar-item${i === idx ? " active" : ""}`}
                  onClick={() => { go(i); setSidebarOpen(false) }}
                >
                  <div className="sidebar-num">{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sidebar-label">{s.title || s.eyebrow || "—"}</div>
                    <div className="sidebar-type">{TYPE_LABELS[s.type] ?? s.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {spinnerOpen && (
        <NameSpinner students={students} onClose={() => setSpinnerOpen(false)} />
      )}

      {classPickerOpen && (
        <div onClick={() => setClassPickerOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--paper)", borderRadius: 20, padding: "32px 28px",
            display: "flex", flexDirection: "column", gap: 16,
            maxWidth: 340, width: "90%",
          }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, color: "var(--ink)", fontSize: 20, textAlign: "center" }}>
              בחר כיתה
            </div>
            {availableClasses.length === 0 ? (
              <div style={{ color: "rgba(27,42,74,0.5)", fontSize: 14, textAlign: "center" }}>אין כיתות במערכת</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {availableClasses.map(cls => (
                  <button key={cls.id} onClick={() => startSession(cls.id)} style={{
                    background: "var(--ink)", color: "var(--paper)", border: "none",
                    borderRadius: 12, padding: "14px 20px", fontFamily: "'Frank Ruhl Libre',serif",
                    fontWeight: 700, fontSize: 18, cursor: "pointer", textAlign: "center",
                    transition: "opacity .15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
                    {cls.name}
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setClassPickerOpen(false)} style={{
              background: "none", color: "rgba(27,42,74,0.45)", border: "none",
              fontFamily: "'Heebo'", fontSize: 13, cursor: "pointer", marginTop: 4,
            }}>ביטול</button>
          </div>
        </div>
      )}

      {qrOpen && session && (
        <div onClick={() => setQrOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "var(--paper)", borderRadius: 20, padding: "32px 28px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
            maxWidth: 340, width: "90%",
          }}>
            <div style={{ fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, color: "var(--ink)", fontSize: 20 }}>
              הצטרפות לשיעור
            </div>
            <QRCode
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/live/${session.room_code}`}
              size={220}
              fgColor="#1B2A4A"
              bgColor="#F5F1E6"
              style={{ borderRadius: 8 }}
            />
            <div style={{ color: "var(--gold)", fontFamily: "'Heebo',sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: 4 }}>
              {session.room_code}
            </div>
            <div style={{ color: "rgba(27,42,74,0.5)", fontSize: 13, textAlign: "center" }}>
              סרוק את הקוד או גש לאתר והזן את הקוד
            </div>
            <button onClick={() => setQrOpen(false)} style={{
              background: "var(--ink)", color: "var(--paper)", border: "none",
              borderRadius: 10, padding: "10px 28px", fontFamily: "'Heebo'",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>סגור</button>
          </div>
        </div>
      )}
    </div>
  )
}
