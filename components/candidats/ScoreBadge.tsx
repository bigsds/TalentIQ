import { getScoreColor } from '@/lib/utils'

export default function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-[#94A3B8]">—</span>
  const s = Math.round(score)
  const { bg, text } = getScoreColor(s)
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${bg} ${text}`}>
      {s}/100
    </span>
  )
}
