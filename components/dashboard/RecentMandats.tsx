import Link from 'next/link'
import { getScoreColor } from '@/lib/utils'

const statutLabels: Record<string, string> = {
  actif: 'Actif',
  cloture: 'Clôturé',
  archive: 'Archivé',
}

const statutColors: Record<string, string> = {
  actif: 'bg-green-100 text-green-800',
  cloture: 'bg-gray-100 text-gray-800',
  archive: 'bg-orange-100 text-orange-800',
}

interface Mandat {
  id: number
  ref: string
  poste: string
  client: { nom: string }
  _count: { candidatures: number }
  scoreMoyen: number | null
  statut: string
  datefinCollecte: string | null
}

export default function RecentMandats({ mandats }: { mandats: Mandat[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0]">
      <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1E293B] font-jakarta">Mandats récents</h3>
        <Link href="/mandats" className="text-sm text-[#1F4E79] hover:underline font-medium">
          Voir tout →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
              {['Réf', 'Client', 'Poste', 'CVs', 'Score moyen', 'Statut'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#64748B] uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {mandats.map(m => {
              const score = m.scoreMoyen ? Math.round(m.scoreMoyen) : null
              const scoreStyle = score ? getScoreColor(score) : null
              return (
                <tr key={m.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/mandats/${m.id}`} className="text-sm font-medium text-[#1F4E79] hover:underline">
                      {m.ref}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#1E293B]">{m.client.nom}</td>
                  <td className="px-4 py-3 text-sm text-[#1E293B] max-w-[180px] truncate">{m.poste}</td>
                  <td className="px-4 py-3 text-sm text-[#64748B] text-center">{m._count.candidatures}</td>
                  <td className="px-4 py-3">
                    {score && scoreStyle ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold ${scoreStyle.bg} ${scoreStyle.text}`}>
                        {score}/100
                      </span>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${statutColors[m.statut] || ''}`}>
                      {statutLabels[m.statut] || m.statut}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {mandats.length === 0 && (
          <div className="py-12 text-center text-sm text-[#94A3B8]">Aucun mandat pour le moment</div>
        )}
      </div>
    </div>
  )
}
