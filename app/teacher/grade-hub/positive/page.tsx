import BehaveGradeHub from "@/app/components/BehaveGradeHub"

export default function GradeHubPositivePage() {
  return (
    <BehaveGradeHub
      achvaCode={105}
      title="הערות חיוביות"
      subtitle="הערות חיוביות — כלל כיתות השכבה"
      emptyMessage="עדיין אין הערות חיוביות — הסנכרון עם משוב רץ כל 15 דק׳"
      showJustifiedDot={false}
    />
  )
}
