export interface GradeComponent {
  name: string
  weight: number
  score: number
}

export interface ParsedSubjectGrade {
  subject: string
  teacherName: string
  components: GradeComponent[]
  weightedAverage: number | null
}

// Parse a grade cell like:
// " מבחן בכתב .: (משקל - 60) 50  בוחן בכתב: (משקל - 15) 64 ..."
export function parseGradeCell(raw: string): GradeComponent[] {
  if (!raw || !raw.trim()) return []

  const pattern = /([^:(]+):\s*\(משקל\s*-\s*(\d+)\)\s*(\d+)/g
  const components: GradeComponent[] = []
  let match: RegExpExecArray | null

  while ((match = pattern.exec(raw)) !== null) {
    const name = match[1].trim()
    const weight = parseInt(match[2], 10)
    const score = parseInt(match[3], 10)
    if (!isNaN(weight) && !isNaN(score)) {
      components.push({ name, weight, score })
    }
  }

  return components
}

export function calcWeightedAverage(components: GradeComponent[]): number | null {
  if (components.length === 0) return null
  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  if (totalWeight === 0) return null
  const weighted = components.reduce((s, c) => s + c.weight * c.score, 0)
  return Math.round((weighted / totalWeight) * 10) / 10
}

// Parse a column header like "אזרחות י2 גיל אליאב [4333]"
export function parseSubjectHeader(header: string): { subject: string; teacherName: string } {
  // Remove course code like [4333]
  const withoutCode = header.replace(/\[\d+\]/g, "").trim()

  // Try to extract teacher name — usually last 2 words after grade ref
  // Pattern: "subject gradeRef teacherFirstName teacherLastName"
  const parts = withoutCode.split(/\s+/)

  // Find the grade ref (like "י2-י6" or "י2")
  const gradeRefIdx = parts.findIndex((p) => /^[יאבגדהוזחטיכלמנסעפצקרשת]\d/.test(p))

  let subject: string
  let teacherName: string

  if (gradeRefIdx !== -1) {
    subject = parts.slice(0, gradeRefIdx).join(" ")
    teacherName = parts.slice(gradeRefIdx + 1).join(" ")
  } else {
    // fallback: first word is subject, rest is teacher
    subject = parts[0] || withoutCode
    teacherName = parts.slice(1).join(" ")
  }

  return { subject: subject.trim(), teacherName: teacherName.trim() }
}
