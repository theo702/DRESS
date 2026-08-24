import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, SCORE, getColor } from '../config/dress'
import type { Outfit } from '../domain/types'
import { ScorePanel } from '../components/OutfitPreview'
import { evaluateOutfit } from '../engine/evaluateOutfit'
import { isStale, lastWornLabel } from '../lib/dates'
import { useStore } from '../state/Store'

type WearFilter = 'all' | 'never' | 'stale'

export function OutfitsScreen() {
  const { outfits, garments, wearLogs, logWear } = useStore()
  const [filter, setFilter] = useState<WearFilter>('all')

  const lastWear = useMemo(() => {
    const map = new Map<string, string>()
    for (const log of wearLogs) {
      const prev = map.get(log.outfitId)
      if (!prev || log.date > prev) map.set(log.outfitId, log.date)
    }
    return map
  }, [wearLogs])

  const sorted = useMemo(() => {
    return [...outfits]
      .map((o) => {
        const pieces = o.garmentIds
          .map((id) => garments.find((g) => g.id === id))
          .filter((g): g is NonNullable<typeof g> => Boolean(g))
        const live = evaluateOutfit(pieces)
        return { outfit: o, pieces, live, last: lastWear.get(o.id) }
      })
      .filter((row) => {
        if (filter === 'never') return !row.last
        if (filter === 'stale') return isStale(row.last)
        return true
      })
      .sort((a, b) => b.live.score - a.live.score)
  }, [outfits, garments, lastWear, filter])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Tenues</h1>
          <p className="text-xs text-muted">Triées par score actuel. Le moteur est relancé à chaque affichage.</p>
        </div>
        <div className="flex gap-1 text-xs">
          {(
            [
              ['all', 'Toutes'],
              ['never', 'Jamais portées'],
              ['stale', `Pas portées depuis ${SCORE.staleDays} j`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`border px-2 py-1 focus-ring ${filter === id ? 'border-ink bg-ink text-paper' : 'border-line'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {outfits.length === 0 && (
        <p className="border border-line px-4 py-6 text-sm">
          Aucune tenue enregistrée. Assemble-en une dans l’Atelier.
        </p>
      )}

      <ul className="space-y-3">
        {sorted.map(({ outfit, pieces, live, last }) => (
          <OutfitRow
            key={outfit.id}
            outfit={outfit}
            liveScore={live.score}
            isBlocking={live.isBlocking}
            last={last}
            pieces={pieces}
            onWear={() => logWear(outfit.id)}
            evaluation={live}
          />
        ))}
      </ul>
    </div>
  )
}

function OutfitRow({
  outfit,
  liveScore,
  isBlocking,
  last,
  pieces,
  onWear,
  evaluation,
}: {
  outfit: Outfit
  liveScore: number
  isBlocking: boolean
  last: string | undefined
  pieces: ReturnType<typeof useStore>['garments']
  onWear: () => void
  evaluation: ReturnType<typeof evaluateOutfit>
}) {
  const [open, setOpen] = useState(false)
  const title =
    outfit.name?.trim() ||
    pieces.map((p) => p.name).join(' · ') ||
    'Tenue'

  return (
    <li className="border border-line">
      <div className="flex flex-wrap items-start gap-3 px-3 py-3">
        <p
          className={`font-num text-3xl tabular-nums leading-none ${isBlocking ? 'text-danger' : 'text-ink'}`}
        >
          {liveScore}
        </p>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted">{lastWornLabel(last)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {pieces.map((p) => {
              const color = getColor(p.color)
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 border border-line px-1.5 py-0.5 text-[11px]"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 border border-line"
                    style={{ backgroundColor: color?.hex }}
                  />
                  {p.name}
                  <span className="text-muted">{CATEGORY_LABELS[p.category]}</span>
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={onWear}
            className="border border-ink bg-ink px-2 py-1 text-xs text-paper focus-ring"
          >
            Porté le
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="border border-line px-2 py-1 text-xs focus-ring"
          >
            {open ? 'Masquer le détail' : 'Pourquoi ce score'}
          </button>
        </div>
      </div>
      {open && <ScorePanel evaluation={evaluation} />}
    </li>
  )
}
