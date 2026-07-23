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

export type AnimationPosition = "across" | "center" | "corner-right" | "corner-left" | "top"

export interface SlideAnimation {
  name: string                  // key in ANIMATION_REGISTRY
  delay: number                 // seconds after slide appears (0 = immediate)
  position?: AnimationPosition  // default: "across"
  loop?: boolean                // default: false (play once)
}

export interface Slide {
  id: string
  order: number
  type: SlideType
  eyebrow: string
  title: string
  body?: string
  image_url?: string | null
  image_position?: 'top' | 'right' | 'left' | 'background' | null
  image_size?: 'small' | 'medium' | 'large' | 'full' | null
  youtube_url?: string | null
  link_url?: string | null
  audio_url?: string | null
  display?: { show_names: boolean }
  questions?: SlideQuestion[]
  animation?: SlideAnimation | null
}

export interface Lesson {
  id: string
  slug: string
  title: string
  subject: string
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
