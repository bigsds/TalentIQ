'use client'

import { getScoreColor } from '@/lib/utils'

export default function ScoreGauge({ score }: { score: number }) {
  const s = Math.round(score)
  const { bg, text } = getScoreColor(s)
  const pct = s / 100
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - pct * circumference

  const strokeColor = s >= 75 ? '#16A34A' : s >= 40 ? '#EA580C' : '#DC2626'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
          <circle cx="72" cy="72" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
          <circle
            cx="72" cy="72" r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#1E293B] font-jakarta">{s}</span>
          <span className="text-xs text-[#94A3B8]">/100</span>
        </div>
      </div>
    </div>
  )
}
