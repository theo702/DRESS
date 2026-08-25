import { ATELIER_COLUMNS, CATEGORY_LABELS, getColor } from '../config/dress'
import type { Garment } from '../domain/types'
import type { OutfitEvaluation } from '../domain/types'
import { cx } from '../lib/cx'

type Props = {
  garments: Garment[]
  evaluation: OutfitEvaluation
}

const STACK = [...ATELIER_COLUMNS]

export function OutfitPreview({ garments, evaluation }: Props) {
  const stacked = STACK.map((cat) => garments.find((g) => g.category === cat)).filter(
    (g): g is Garment => Boolean(g),
  )
  const accessories = garments.filter((g) => g.category === 'accessory')
  const fragrances = garments.filter((g) => g.category === 'fragrance')
  const extras = [...accessories, ...fragrances]

  return (
    <div className="card">
      <div className="border-b border-line px-3 py-2.5">
        <p className="kicker">Aperçu</p>
      </div>
      {stacked.length === 0 && extras.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted">Clique une pièce pour la placer.</p>
      ) : (
        <div>
          {stacked.map((g) => {
            const color = getColor(g.color)
            return (
              <div
                key={g.id}
                className="flex items-stretch border-b border-line last:border-b-0"
              >
                <div
                  className="w-10 shrink-0"
                  style={{ backgroundColor: color?.hex ?? '#ddd', minHeight: 44 }}
                  title={color?.label}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{g.name}</p>
                    <p className="text-[11px] text-muted">{CATEGORY_LABELS[g.category]}</p>
                  </div>
                </div>
              </div>
            )
          })}
          {extras.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-line px-2 py-2">
              {extras.map((g) => {
                const color = getColor(g.color)
                return (
                  <span
                    key={g.id}
                    className="chip"
                  >
                    {g.category !== 'fragrance' && (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border border-line"
                      style={{ backgroundColor: color?.hex }}
                    />
                    )}
                    {g.name}
                    {g.category === 'fragrance' && (
                      <span className="text-muted">
                        {(g.moments ?? []).join(' · ') || 'parfum'}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
      <ScorePanel evaluation={evaluation} />
    </div>
  )
}

export function ScorePanel({ evaluation }: { evaluation: OutfitEvaluation }) {
  return (
    <div
      className={cx(
        'border-t border-line px-3 py-3',
        evaluation.isBlocking && 'border-l-2 border-l-danger',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p
          className={cx(
            'font-num text-[2.75rem] tabular-nums leading-none tracking-tight',
            evaluation.isBlocking ? 'text-danger' : 'text-ink',
          )}
        >
          {evaluation.score}
        </p>
        {evaluation.isBlocking && (
          <span className="text-[11px] uppercase tracking-wide text-danger">Bloquant</span>
        )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {evaluation.reasons.length === 0 ? (
          <li className="text-xs text-muted">Ajoute un haut et un bas pour lancer le moteur.</li>
        ) : (
          evaluation.reasons.map((r) => (
            <li key={r.id} className="text-[13px] leading-snug">
              <span className="mr-1.5 font-num text-[11px] tabular-nums text-muted">
                {r.delta > 0 ? `+${r.delta}` : r.delta}
              </span>
              {r.message}
            </li>
          ))
        )}
      </ul>
      {evaluation.warnings.length > evaluation.reasons.filter((r) => r.delta < 0).length && (
        <ul className="mt-2 space-y-1 border-t border-line pt-2">
          {evaluation.warnings
            .filter((w) => !evaluation.reasons.some((r) => r.message === w))
            .map((w) => (
              <li key={w} className="text-xs leading-snug text-muted">
                {w}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
