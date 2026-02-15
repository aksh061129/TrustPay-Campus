import React from 'react'

interface FeatureCardProps {
  title: string
  description: string
  category: string
  actionLabel: string
  disabled?: boolean
  testId?: string
  onOpen: () => void
}

const categoryTone: Record<string, string> = {
  Payments: 'from-cyan-500/25 to-blue-500/25 border-cyan-300/25',
  Assets: 'from-fuchsia-500/25 to-pink-500/25 border-fuchsia-300/25',
  Contracts: 'from-indigo-500/25 to-violet-500/25 border-indigo-300/25',
  Finance: 'from-emerald-500/25 to-teal-500/25 border-emerald-300/25',
  Clubs: 'from-amber-500/25 to-orange-500/25 border-amber-300/25',
  Admin: 'from-rose-500/25 to-red-500/25 border-rose-300/25',
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  category,
  actionLabel,
  disabled = false,
  testId,
  onOpen,
}) => {
  const tone = categoryTone[category] ?? 'from-slate-700/60 to-slate-800/60 border-white/15'

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur ${tone}`}>
      <p className="text-xs uppercase tracking-wide text-slate-100/80">{category}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-100/90">{description}</p>

      <div className="mt-5">
        <button
          data-test-id={testId}
          className="btn btn-sm border-0 bg-white/20 text-white hover:bg-white/30"
          disabled={disabled}
          onClick={onOpen}
        >
          {actionLabel}
        </button>
      </div>
    </article>
  )
}

export default FeatureCard
