import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, SCORE, getColor } from '../config/dress'
import type { Outfit } from '../domain/types'
import { ScorePanel } from '../components/OutfitPreview'
import { TagManager, TagPicker } from '../components/TagPicker'
import { evaluateOutfit } from '../engine/evaluateOutfit'
import { isStale, lastWornLabel } from '../lib/dates'
import { useRoute } from '../lib/routes'
import { useStore } from '../state/Store'

type WearFilter = 'all' | 'never' | 'stale' | 'no-tags'

export function OutfitsScreen() {
  const {
    outfits,
    garments,
    wearLogs,
    tags,
    logWear,
    deleteOutfit,
    setOutfitTags,
    addTag,
    renameTag,
    deleteTag,
    startEditOutfit,
  } = useStore()
  const [, navigate] = useRoute()
  const [filter, setFilter] = useState<WearFilter>('all')
  const [tagFilter, setTagFilter] = useState('all')
  const untaggedCount = outfits.filter((o) => (o.tagIds ?? []).length === 0).length

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
        const resolved = o.garmentIds
          .map((id) => garments.find((g) => g.id === id))
          .filter((g): g is NonNullable<typeof g> => g !== undefined)
        const pieces = resolved.filter((g) => !g.archived)
        const missing = o.garmentIds.length - pieces.length
        const live = evaluateOutfit(pieces)
        return { outfit: o, pieces, live, last: lastWear.get(o.id), missing }
      })
      .filter((row) => {
        if (filter === 'never') return !row.last
        if (filter === 'stale') return isStale(row.last)
        if (filter === 'no-tags') return (row.outfit.tagIds ?? []).length === 0
        if (tagFilter !== 'all' && !(row.outfit.tagIds ?? []).includes(tagFilter)) return false
        return true
      })
      .sort((a, b) => b.live.score - a.live.score)
  }, [outfits, garments, lastWear, filter, tagFilter])

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Mes tenues</h1>
          <p className="text-xs text-muted">
            Ajoute, modifie ou supprime une tenue. Si une pièce disparaît, on te demandera par
            quoi la remplacer.
            {untaggedCount > 0
              ? ` ${untaggedCount} tenue${untaggedCount > 1 ? 's' : ''} sans tag.`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('atelier')}
          className="btn btn-primary focus-ring"
        >
          Nouvelle tenue
        </button>
      </header>

      <TagManager tags={tags} onAdd={addTag} onRename={renameTag} onDelete={deleteTag} />

      <div className="card flex flex-wrap items-center gap-1.5 px-3 py-2.5 text-xs">
        {(
          [
            ['all', 'Toutes'],
            ['never', 'Jamais portées'],
            ['stale', `Pas portées depuis ${SCORE.staleDays} j`],
            ['no-tags', 'Sans tag'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`chip min-h-11 focus-ring ${filter === id ? 'border-ink bg-ink text-paper' : 'border-line hover:bg-fill'}`}
          >
            {label}
          </button>
        ))}
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="field-pill focus-ring"
          aria-label="Filtrer par tag"
        >
          <option value="all">Tous les tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {outfits.length === 0 && (
        <p className="card px-4 py-6 text-sm">
          Aucune tenue. Assemble-en une dans l’Atelier.
        </p>
      )}

      <ul className="space-y-3">
        {sorted.map(({ outfit, pieces, live, last, missing }) => (
          <OutfitRow
            key={outfit.id}
            outfit={outfit}
            liveScore={live.score}
            isBlocking={live.isBlocking}
            last={last}
            pieces={pieces}
            missing={missing}
            onWear={() => logWear(outfit.id)}
            onEdit={() => {
              startEditOutfit(outfit.id)
              navigate('atelier')
            }}
            onDelete={() => {
              if (window.confirm('Supprimer cette tenue ?')) deleteOutfit(outfit.id)
            }}
            evaluation={live}
            tags={tags}
            onTags={(ids) => setOutfitTags(outfit.id, ids)}
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
  missing,
  onWear,
  onEdit,
  onDelete,
  evaluation,
  tags,
  onTags,
}: {
  outfit: Outfit
  liveScore: number
  isBlocking: boolean
  last: string | undefined
  pieces: ReturnType<typeof useStore>['garments']
  missing: number
  onWear: () => void
  onEdit: () => void
  onDelete: () => void
  evaluation: ReturnType<typeof evaluateOutfit>
  tags: ReturnType<typeof useStore>['tags']
  onTags: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const title =
    outfit.name?.trim() ||
    pieces.map((p) => p.name).join(' · ') ||
    'Tenue'
  const noTags = (outfit.tagIds ?? []).length === 0

  return (
    <li className={`card ${noTags ? 'border-l-2 border-l-danger' : ''}`}>
      <div className="flex flex-wrap items-start gap-3 px-4 py-3.5">
        <p
          className={`font-num text-3xl tabular-nums leading-none tracking-tight ${isBlocking ? 'text-danger' : 'text-ink'}`}
        >
          {liveScore}
        </p>
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted">{lastWornLabel(last)}</p>
          {noTags && (
            <p className="mt-1 text-xs text-danger">
              Sans tag — ajoute au moins un usage (été, hiver, soleil, pluie, soirée, travail, sport…).
            </p>
          )}
          {missing > 0 && (
            <p className="mt-1 text-xs text-danger">
              {missing} pièce{missing > 1 ? 's' : ''} manquante{missing > 1 ? 's' : ''} — ouvre
              Modifier pour remplacer.
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {pieces.map((p) => {
              const color = getColor(p.color)
              return (
                <span key={p.id} className="chip">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full border border-line"
                    style={{ backgroundColor: color?.hex }}
                  />
                  {p.name}
                  <span className="text-muted">{CATEGORY_LABELS[p.category]}</span>
                </span>
              )
            })}
          </div>
          <div className="mt-2">
            <TagPicker tags={tags} selected={outfit.tagIds ?? []} onChange={onTags} />
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:flex-col">
          <button type="button" onClick={onWear} className="btn btn-primary min-h-11 flex-1 text-xs focus-ring sm:flex-none">
            Porté le
          </button>
          <button type="button" onClick={onEdit} className="btn min-h-11 flex-1 text-xs focus-ring sm:flex-none">
            Modifier
          </button>
          <button type="button" onClick={onDelete} className="btn min-h-11 flex-1 text-xs focus-ring sm:flex-none">
            Supprimer
          </button>
          <button type="button" onClick={() => setOpen((v) => !v)} className="btn min-h-11 w-full text-xs focus-ring sm:w-auto">
            {open ? 'Masquer le détail' : 'Pourquoi ce score'}
          </button>
        </div>
      </div>
      {open && <ScorePanel evaluation={evaluation} />}
    </li>
  )
}
