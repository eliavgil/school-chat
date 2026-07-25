import type { ComponentType } from "react"
import {
  Crown, Scale, Landmark, Users, Map, Handshake, Globe, ShieldCheck,
  Vote, Gavel, BookOpen, FileText, Flag, Mountain, Waves, Plane, Layers,
  Building2, Newspaper, Megaphone, CalendarDays, Languages, Scroll,
  MessageSquareQuote, Gauge, Fingerprint, Lock, Siren,
} from "lucide-react"

// Icon vocabulary for concept-grid slides. Keep keys short & topic-agnostic
// so the same set works across civics units (statehood, government, rights…).
export const CONCEPT_ICONS: Record<string, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  crown: Crown,           // ריבונות / שלטון עליון
  scale: Scale,           // משפט / בית משפט / שוויון
  landmark: Landmark,     // מוסדות שלטון / ממשלה
  users: Users,           // אוכלוסייה / ציבור / עם
  map: Map,               // שטח / טריטוריה
  handshake: Handshake,   // הכרה בינ"ל / הסכמים
  globe: Globe,           // בינלאומי / האו"ם / עולם
  shield: ShieldCheck,    // ביטחון / הגנה
  vote: Vote,             // בחירות
  gavel: Gavel,           // חקיקה / פסיקה
  book: BookOpen,         // חינוך / לימוד
  document: FileText,     // חוק / מסמך רשמי
  flag: Flag,             // מדינה / לאום
  mountain: Mountain,     // תחום יבשתי
  waves: Waves,           // תחום ימי
  plane: Plane,           // תחום אווירי
  layers: Layers,         // תחום תת-קרקעי
  building: Building2,    // מוסד ציבורי
  newspaper: Newspaper,   // תקשורת / עיתונות
  megaphone: Megaphone,   // חופש ביטוי
  calendar: CalendarDays, // לוח שנה / מועדים
  language: Languages,    // שפה
  scroll: Scroll,         // הכרזה / מגילה
  quote: MessageSquareQuote, // ציטוט / עדות
  gauge: Gauge,           // מידה / היקף
  identity: Fingerprint,  // זהות / אזרחות
  lock: Lock,             // הגבלה / איסור
  alert: Siren,           // חירום / משבר
}

export function ConceptIcon({ name, size = 22 }: { name?: string; size?: number }) {
  const Cmp = (name && CONCEPT_ICONS[name]) || Landmark
  return <Cmp size={size} strokeWidth={2.2} />
}
