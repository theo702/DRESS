import { useEffect, useMemo, useState } from 'react'
import { ATELIER_COLUMNS, CATEGORY_LABELS, SCORE } from '../config/dress'
import type { Category, Garment } from '../domain/types'
import { GarmentCard } from '../components/GarmentCard'
import { OutfitPreview } from '../components/OutfitPreview'
import { TagPicker } from '../components/TagPicker'
import { evaluateOutfit, placeGarment, wouldKeepScore } from '../engine/evaluateOutfit'
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
          <h1 className="text-lg font-semibold">Atelier</h1>
          <p className="text-xs text-muted">
            {editing
              ? `Modification de « ${editing.name?.trim() || 'tenue'} ».`
              : 'Clique une pièce pour l’assembler. Le score se recalcule à chaque geste.'}
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={compatibleOnly}
            onChange={(e) => setCompatibleOnly(e.target.checked)}
            className="accent-ink focus-ring"
          />
          Compatible seulement (score ≥ {SCORE.compatibleMin})
        </label>
      </header>

      {active.length === 0 && (
        <p className="border border-line px-4 py-6 text-sm">
          La garde-robe est vide. Ajoute des pièces avant d’assembler.
        </p>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="mb-2 flex border border-line md:hidden" role="tablist" aria-label="Catégorie">
            {ATELIER_COLUMNS.map((col) => (
              <button
                key={col}
                type="button"
                role="tab"
                aria-selected={mobileCol === col}
                onClick={() => setMobileCol(col)}
                className={cx(
                  'flex-1 px-2 py-2 text-xs focus-ring',
                  mobileCol === col ? 'bg-ink text-paper' : 'bg-paper text-ink',
                )}
              >
                {CATEGORY_LABELS[col]}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {ATELIER_COLUMNS.map((col) => {
              const items = visibleInColumn(col)
              return (
                <section
                  key={col}
                  className={cx(mobileCol === col ? 'block' : 'hidden md:block')}
                  aria-label={CATEGORY_LABELS[col]}
                >
                  <h2 className="mb-2 hidden text-[11px] uppercase tracking-wide text-muted md:block">
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

          {accessories.length > 0 && (
            <section className="mt-4">
              <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">Accessoires</h2>
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

        <aside className="lg:sticky lg:top-3">
          <OutfitPreview garments={selected} evaluation={evaluation} />
          <div className="mt-2 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de la tenue (optionnel)"
              className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
            />
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">Tags</p>
              <TagPicker tags={tags} selected={tagIds} onChange={setTagIds} />
              {tagIds.length === 0 && (
                <p className="mt-1 text-xs text-danger">Tenue sans tag — ajoute au moins un usage (été, bureau, pluie…).</p>
              )}
            </div>
            <button
              type="button"
              onClick={onSave}
              className="w-full border border-ink bg-ink px-3 py-2 text-sm text-paper focus-ring"
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
                className="w-full border border-line px-3 py-1.5 text-xs text-muted focus-ring"
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
