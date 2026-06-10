import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#D6E4F0] flex items-center justify-center mb-4">
          <Icon size={32} className="text-[#1F4E79]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[#1E293B] font-jakarta mb-2">{title}</h3>
      {description && <p className="text-sm text-[#64748B] max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
