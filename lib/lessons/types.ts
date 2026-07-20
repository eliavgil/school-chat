export type SlideType =
  | "intro" | "poll" | "definitions" | "quiz" | "matching"
  | "reveal" | "enrichment" | "homework" | "feedback"

export interface SlideQuestion {
  id: string
  text: string
  options: string[]
  correct_index: number | null
  feedback?: string
}

export interface Slide {
  id: string
  order: number
  type: SlideType
  eyebrow: string
  title: string
  body?: string
  image_url?: string | null
  link_url?: string | null
  display?: { show_names: boolean }
  questions?: SlideQuestion[]
}

export interface Lesson {
  id: string
  class_id: string
  title: string
  slides: Slide[]
  created_at: string
}

export interface LiveSession {
  id: string
  lesson_id: string
  class_id: string
  room_code: string
  current_slide_index: number
  is_active: boolean
  created_at: string
}

export interface Response {
  id: string
  session_id: string
  student_id: string
  slide_id: string
  question_id: string
  answer: string
  created_at: string
}
