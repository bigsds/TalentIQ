import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  variation?: number
  icon: LucideIcon
  iconColor?: string
}

export default function StatCard({ title, value, subtitle, variation, icon: Icon, iconColor = 'text-[#1F4E79]' }: StatCardProps) {
  const hasVariation = variation !== undefined && variation !== null

  return (
    <div className="bg-white rounded-xl p-6 border border-[#E2E8F0] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-[#64748B]">{title}</p>
        <div className={cn('p-2 rounded-lg bg-[#D6E4F0]', iconColor)}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1E293B] font-jakarta mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {hasVariation && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-medium',
            variation > 0 ? 'text-green-600' : variation < 0 ? 'text-red-500' : 'text-[#64748B]'
          )}>
            {variation > 0 ? <TrendingUp size={12} /> : variation < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {variation > 0 ? '+' : ''}{variation}
          </span>
        )}
        {subtitle && <span className="text-xs text-[#94A3B8]">{subtitle}</span>}
      </div>
    </div>
  )
}
