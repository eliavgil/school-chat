import BehaveGradeHub from "@/app/components/BehaveGradeHub"

export default function GradeHubAbsencesPage() {
  return (
    <BehaveGradeHub
      achvaCode={1}
      title="חיסורים"
      subtitle="חיסורים — כלל כיתות השכבה"
      emptyMessage="עדיין אין נתוני חיסורים — הסנכרון עם משוב רץ כל 15 דק׳"
      showJustifiedDot
    />
  )
}
