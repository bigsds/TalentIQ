import { getRecommendationColor } from '@/lib/utils'

const labels: Record<string, string> = {
  A_RETENIR: 'A retenir',
  A_ETUDIER: 'A etudier',
  NON_RETENU: 'Non retenu',
}

export default function RecommendationBadge({ recommendation }: { recommendation: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRecommendationColor(recommendation)}`}>
      {labels[recommendation] || recommendation}
    </span>
  )
}
