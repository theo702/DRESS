import { useEffect, useMemo, useState } from 'react'
import { ATELIER_COLUMNS, CATEGORY_LABELS, SCORE } from '../config/dress'
import type { Category, Garment } from '../domain/types'
import { GarmentCard } from '../components/GarmentCard'
import { OutfitPreview } from '../components/OutfitPreview'
import { TagPicker } from '../components/TagPicker'
import { evaluateOutfit, fragranceMatches, placeGarment, wouldKeepScore } from '../engine/evaluateOutfit'
import { cx } from '../lib/cx'
import { useStore } from '../state/Store'

export function AtelierScreen() {
  const {
    garments,
    outfits,
    tags,
    saveOutfit,
    editingOutfitId,
    clearEditOutfit,
  } = useStore()
  const [selected, setSelected] = useState<Garment[]>([])
  const [compatibleOnly, setCompatibleOnly] = useState(false)
  const [mobileCol, setMobileCol] = useState<(typeof ATELIER_COLUMNS)[number]>('top')
  const [savedFlash, setSavedFlash] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tagIds, setTagIds] = useState<string[]>([])

  const editing = outfits.find((o) => o.id === editingOutfitId) ?? null

  useEffect(() => {
    if (!editing) return
    const pieces = editing.garmentIds
      .map((id) => garments.find((g) => g.id === id))
      .filter((g): g is Garment => Boolean(g))
    setSelected(pieces)
    setName(editing.name ?? '')
    setTagIds(editing.tagIds ?? [])
    setSavedFlash(null)
  }, [editing, garments])

  const evaluation = useMemo(() => evaluateOutfit(selected), [selected])
  const active = garments.filter((g) => !g.archived)

  function toggle(g: Garment) {
    setSelected((prev) => placeGarment(prev, g))
    setSavedFlash(null)
  }

  function visibleInColumn(col: Category): Garment[] {
    return active.filter((g) => {
      if (g.category !== col) return false
      if (!compatibleOnly) return true
      if (selected.some((s) => s.id === g.id)) return true
      return wouldKeepScore(selected, g, SCORE.compatibleMin)
    })
  }

  const accessories = visibleInColumn('accessory')
  const usageLabels = tagIds
    .map((id) => tags.find((t) => t.id === id)?.label ?? '')
    .filter(Boolean)
  const fragrances = active.filter((g) => {
    if (g.category !== 'fragrance') return false
    if (!compatibleOnly) return true
    if (selected.some((s) => s.id === g.id)) return true
    return fragranceMatches(g, selected, usageLabels)
  })

  function onSave() {
    if (!selected.some((g) => g.category === 'top') || !selected.some((g) => g.category === 'bottom')) {
      setSavedFlash('Il faut au moins un haut et un bas.')
      return
    }
    saveOutfit({
      id: editing?.id,
      name: name.trim() || undefined,
      garmentIds: selected.map((g) => g.id),
      score: evaluation.score,
      warnings: evaluation.warnings,
      tagIds,
    })
    setSavedFlash(editing ? 'Tenue mise à jour.' : 'Tenue enregistrée.')
    if (!editing) {
      setName('')
      setTagIds([])
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Atelier</h1>
          <p className="text-xs text-muted">
            {editing
              ? `Modification de « ${editing.name?.trim() || 'tenue'} ».`
              : 'Clique une pièce pour l’assembler. Le score se recalcule à chaque geste.'}
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={compatibleOnly}
            onChange={(e) => setCompatibleOnly(e.target.checked)}
            className="h-5 w-5 accent-ink focus-ring"
          />
          Compatible seulement (score ≥ {SCORE.compatibleMin})
        </label>
      </header>

      {active.length === 0 && (
        <p className="card px-4 py-6 text-sm">
          La garde-robe est vide. Ajoute des pièces avant d’assembler.
        </p>
      )}

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_min(42%,17.5rem)]">
        <div>
          <div
            className="mb-3 sticky top-[calc(var(--app-header)+env(safe-area-inset-top,0px))] z-10 flex items-center justify-between gap-3 rounded-ui border border-line bg-paper-2 px-3 py-2 md:hidden"
            aria-live="polite"
          >
            <p
              className={`font-num text-2xl tabular-nums leading-none tracking-tight ${evaluation.isBlocking ? 'text-danger' : 'text-ink'}`}
            >
              {evaluation.score}
            </p>
            <p className="min-w-0 flex-1 text-xs text-muted">
              {selected.length} pièce{selected.length === 1 ? '' : 's'}
              {evaluation.isBlocking ? ' · bloquant' : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
                document.getElementById('atelier-apercu')?.scrollIntoView({
                  behavior: reduce ? 'auto' : 'smooth',
                  block: 'start',
                })
              }}
              className="text-xs text-ink underline-offset-2 hover:underline focus-ring"
            >
              Aperçu
            </button>
          </div>

          <div className="mb-3 flex gap-1 rounded-full bg-fill p-1 md:hidden" role="tablist" aria-label="Catégorie">
            {ATELIER_COLUMNS.map((col) => (
              <button
                key={col}
                type="button"
                role="tab"
                aria-selected={mobileCol === col}
                onClick={() => setMobileCol(col)}
                className={cx(
                  'flex min-h-11 flex-1 items-center justify-center rounded-full px-2 text-xs focus-ring',
                  mobileCol === col ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-2',
                )}
              >
                {CATEGORY_LABELS[col]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {ATELIER_COLUMNS.map((col) => {
              const items = visibleInColumn(col)
              return (
                <section
                  key={col}
                  className={cx(mobileCol === col ? 'block' : 'hidden md:block')}
                  aria-label={CATEGORY_LABELS[col]}
                >
                  <h2 className="kicker mb-2 hidden md:block">
                    {CATEGORY_LABELS[col]}
                    <span className="ml-1 font-num tabular-nums">({items.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-1">
                    {items.map((g) => (
                      <GarmentCard
                        key={g.id}
                        garment={g}
                        compact
                        selected={selected.some((s) => s.id === g.id)}
                        onSelect={() => toggle(g)}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="text-xs text-muted">
                        {compatibleOnly ? 'Rien sous le seuil 70.' : 'Aucune pièce.'}
                      </p>
                    )}
                  </div>
                </section>
              )
            })}
          </div>

          {fragrances.length > 0 && (
            <section className="mt-4">
              <h2 className="kicker mb-2">Parfums</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {fragrances.map((g) => (
                  <GarmentCard
                    key={g.id}
                    garment={g}
                    compact
                    selected={selected.some((s) => s.id === g.id)}
                    onSelect={() => toggle(g)}
                  />
                ))}
              </div>
            </section>
          )}

          {accessories.length > 0 && (
            <section className="mt-4">
              <h2 className="kicker mb-2">Accessoires</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {accessories.map((g) => (
                  <GarmentCard
                    key={g.id}
                    garment={g}
                    compact
                    selected={selected.some((s) => s.id === g.id)}
                    onSelect={() => toggle(g)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside
          id="atelier-apercu"
          className="scroll-mt-[calc(var(--app-header)+env(safe-area-inset-top,0px)+0.5rem)] md:sticky md:top-[calc(var(--app-header)+env(safe-area-inset-top,0px)+0.5rem)]"
        >
          <OutfitPreview garments={selected} evaluation={evaluation} />
          <div className="card mt-2 space-y-2 p-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la tenue (optionnel)"
              className="field focus-ring"
            />
            <div>
              <p className="kicker mb-1">Tags</p>
              <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
              {tagIds.length === 0 && (
                <p className="mt-1 text-xs text-danger">Tenue sans tag — ajoute au moins un usage (été, bureau, pluie…).</p>
              )}
            </div>
            <button
              type="button"
              onClick={onSave}
              className="btn btn-primary min-h-11 w-full focus-ring"
            >
              {editing ? 'Mettre à jour la tenue' : 'Enregistrer la tenue'}
            </button>
            {savedFlash && <p className="text-xs text-muted">{savedFlash}</p>}
            {(selected.length > 0 || editing) && (
              <button
                type="button"
                onClick={() => {
                  setSelected([])
                  setName('')
                  setTagIds([])
                  clearEditOutfit()
                }}
                className="btn min-h-11 w-full text-xs text-muted focus-ring"
              >
                {editing ? 'Annuler la modification' : 'Vider l’atelier'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
