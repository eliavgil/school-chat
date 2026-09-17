import BehaveGradeHub from "@/app/components/BehaveGradeHub"

export default function GradeHubDisciplinePage() {
  return (
    <BehaveGradeHub
      achvaCode={101}
      title="הפרות משמעת"
      subtitle="הפרות משמעת — כלל כיתות השכבה"
      emptyMessage="עדיין אין נתוני הפרות משמעת — הסנכרון עם משוב רץ כל 15 דק׳"
      showJustifiedDot={false}
    />
  )
}
