'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChartData {
  date: string
  count: number
}

export default function CandidaturesChart({ data }: { data: ChartData[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: format(new Date(d.date), 'd MMM', { locale: fr }),
  }))

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
      <h3 className="text-base font-semibold text-[#1E293B] font-jakarta mb-4">
        Candidatures reçues — 30 derniers jours
      </h3>
      {formatted.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-[#94A3B8] text-sm">
          Aucune donnée disponible
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [value, 'Candidatures']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1F4E79"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#1F4E79' }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
