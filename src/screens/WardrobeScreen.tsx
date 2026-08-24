import { useEffect, useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  MOMENT_LABELS,
  PALETTE,
  SEASON_LABELS,
  getColor,
} from '../config/dress'
import type { Category, Formality, Garment, Moment, Season } from '../domain/types'
import { BulkDeleteDialog } from '../components/BulkDeleteDialog'
import { GarmentCard } from '../components/GarmentCard'
import { GarmentForm } from '../components/GarmentForm'
import { ReplaceGarmentDialog } from '../components/ReplaceGarmentDialog'
import { useStore } from '../state/Store'
import type { GarmentRemoval } from '../storage/store'

const CATEGORIES: Array<Category | 'all'> = [
  'all',
  'top',
  'bottom',
  'layer',
  'shoes',
  'accessory',
  'fragrance',
]

type GroupBy = 'none' | 'type' | 'color' | 'brand' | 'season' | 'moment' | 'size'
type PhotoFilter = 'all' | 'with' | 'without'

const GROUP_LABELS: Record<GroupBy, string> = {
  none: 'Aucun regroupement',
  type: 'Type',
  color: 'Couleur',
  brand: 'Marque',
  season: 'Saison',
  moment: 'Journée / soirée',
  size: 'Taille',
}

function groupLabel(by: GroupBy, key: string): string {
  if (by === 'color') return getColor(key)?.label ?? key
  if (by === 'season') return SEASON_LABELS[key] ?? key
  if (by === 'moment') return MOMENT_LABELS[key] ?? key
  return key
}

function grouped(items: Garment[], by: GroupBy): { key: string; label: string; items: Garment[] }[] {
  if (by === 'none') return [{ key: 'all', label: '', items }]
  const map = new Map<string, Garment[]>()
  const push = (key: string, g: Garment) => {
    const list = map.get(key) ?? []
    list.push(g)
    map.set(key, list)
  }
  for (const g of items) {
    if (by === 'type') push(g.subcategory || 'Sans type', g)
    else if (by === 'color') push(g.color, g)
    else if (by === 'brand') push(g.brand || 'Sans marque', g)
    else if (by === 'size') push(g.size || 'Sans taille', g)
    else if (by === 'season') {
      if (g.season.length === 0) push('Sans saison', g)
      else for (const s of g.season) push(s, g)
    } else if (by === 'moment') {
      const moments = g.moments?.length ? g.moments : (['journée', 'soirée'] as Moment[])
      for (const m of moments) push(m, g)
    }
  }
  return [...map.entries()]
    .map(([key, groupItems]) => ({ key, label: groupLabel(by, key), items: groupItems }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}

type BulkReplace = {
  excludeIds: string[]
  unused: GarmentRemoval[]
  queue: Garment[]
  plans: GarmentRemoval[]
}

export function WardrobeScreen() {
  const { garments, outfits, upsertGarment, setArchived, removeGarment, removeGarments } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Garment | null>(null)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [type, setType] = useState('all')
  const [color, setColor] = useState<string>('all')
  const [season, setSeason] = useState<Season | 'all'>('all')
  const [moment, setMoment] = useState<Moment | 'all'>('all')
  const [formality, setFormality] = useState<Formality | 'all'>('all')
  const [size, setSize] = useState('all')
  const [brand, setBrand] = useState('all')
  const [photo, setPhoto] = useState<PhotoFilter>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('type')
  const [showArchived, setShowArchived] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Garment | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [bulkReplace, setBulkReplace] = useState<BulkReplace | null>(null)

  const filtered = useMemo(() => {
    return garments.filter((g) => {
      if (!showArchived && g.archived) return false
      if (category !== 'all' && g.category !== category) return false
      if (type !== 'all' && g.subcategory !== type) return false
      if (color !== 'all' && g.color !== color) return false
      if (season !== 'all' && !g.season.includes(season)) return false
      if (moment !== 'all' && !(g.moments ?? ['journée', 'soirée']).includes(moment)) return false
      if (formality !== 'all' && g.formality !== formality) return false
      if (size !== 'all' && g.size !== size) return false
      if (brand !== 'all' && g.brand !== brand) return false
      if (photo === 'with' && !g.photoDataUrl) return false
      if (photo === 'without' && g.photoDataUrl) return false
      return true
    })
  }, [garments, showArchived, category, type, color, season, moment, formality, size, brand, photo])

  const sections = useMemo(() => grouped(filtered, groupBy), [filtered, groupBy])
  const activeCount = garments.filter((g) => !g.archived).length
  const selected = useMemo(
    () => garments.filter((g) => selectedIds.includes(g.id)),
    [garments, selectedIds],
  )
  const visibleIds = useMemo(() => filtered.map((g) => g.id), [filtered])
  const visibleSelectedCount = selectedIds.filter((id) => visibleIds.includes(id)).length
  const hiddenSelectedCount = selectedIds.length - visibleSelectedCount
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  function exitSelecting() {
    setSelecting(false)
    setSelectedIds([])
    setBulkConfirm(false)
    setBulkReplace(null)
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function toggleVisible() {
    setSelectedIds((prev) => {
      if (allVisibleSelected) return prev.filter((id) => !visibleIds.includes(id))
      const extra = visibleIds.filter((id) => !prev.includes(id))
      return [...prev, ...extra]
    })
  }

  function startReplaceQueue(items: Garment[], unused: GarmentRemoval[], plans: GarmentRemoval[]) {
    const deletedOutfits = new Set(
      plans.flatMap((r) => r.plan.filter((s) => s.deleteOutfit).map((s) => s.outfitId)),
    )
    const queue = items.filter((g) =>
      outfits.some((o) => o.garmentIds.includes(g.id) && !deletedOutfits.has(o.id)),
    )
    const skipped: GarmentRemoval[] = items
      .filter((g) => !queue.some((q) => q.id === g.id))
      .map((g) => ({ id: g.id, plan: [] }))
    if (queue.length === 0) {
      removeGarments([...unused, ...skipped, ...plans])
      exitSelecting()
      return
    }
    setBulkReplace({
      excludeIds: [
        ...unused.map((r) => r.id),
        ...skipped.map((r) => r.id),
        ...plans.map((r) => r.id),
        ...queue.map((g) => g.id),
      ],
      unused: [...unused, ...skipped],
      queue,
      plans,
    })
  }

  function confirmBulk() {
    const unused = selected.filter((g) => !outfits.some((o) => o.garmentIds.includes(g.id)))
    const used = selected.filter((g) => outfits.some((o) => o.garmentIds.includes(g.id)))
    const unusedRemovals: GarmentRemoval[] = unused.map((g) => ({ id: g.id, plan: [] }))
    setBulkConfirm(false)
    if (used.length === 0) {
      removeGarments(unusedRemovals)
      exitSelecting()
      return
    }
    startReplaceQueue(used, unusedRemovals, [])
  }

  useEffect(() => {
    if (!selecting || bulkConfirm || bulkReplace || pendingDelete) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') exitSelecting()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selecting, bulkConfirm, bulkReplace, pendingDelete])

  const replacing = bulkReplace?.queue[0] ?? null
  const replacingOutfits = replacing
    ? outfits.filter((o) => {
        const deleted = new Set(
          (bulkReplace?.plans ?? [])
            .flatMap((r) => r.plan.filter((s) => s.deleteOutfit).map((s) => s.outfitId)),
        )
        return o.garmentIds.includes(replacing.id) && !deleted.has(o.id)
      })
    : []

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Mes vêtements</h1>
          <p className="text-xs text-muted">
            Classées par type, couleur, marque, taille, saison, photo — les parfums aussi, avec
            journée / soirée.
            {' '}
            {activeCount} pièce{activeCount === 1 ? '' : 's'} active{activeCount === 1 ? '' : 's'}
            {garments.some((g) => g.archived) ? ` · ${garments.filter((g) => g.archived).length} archivée(s)` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {garments.length > 0 && (
            <button
              type="button"
              aria-pressed={selecting}
              onClick={() => {
                if (selecting) {
                  exitSelecting()
                  return
                }
                setShowForm(false)
                setEditing(null)
                setPendingDelete(null)
                setSelecting(true)
              }}
              className="btn focus-ring"
            >
              {selecting ? 'Annuler le tri' : 'Gros tri'}
            </button>
          )}
          {!selecting && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setShowForm((v) => !v)
              }}
              className="btn btn-primary focus-ring"
            >
              {showForm && !editing ? 'Fermer' : 'Ajouter'}
            </button>
          )}
        </div>
      </header>

      {(showForm || editing) && !selecting && (
        <GarmentForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onSave={(g) => {
            upsertGarment(g)
            setShowForm(false)
            setEditing(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
        />
      )}

      <div className="card flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs">
        <FilterSelect
          label="Catégorie"
          value={category}
          onChange={(v) => setCategory(v as Category | 'all')}
          options={CATEGORIES.map((c) => ({
            value: c,
            label: c === 'all' ? 'Toutes' : CATEGORY_LABELS[c],
          }))}
        />
        <FilterSelect
          label="Type"
          value={type}
          onChange={setType}
          options={[
            { value: 'all', label: 'Tous' },
            ...[...new Set(garments.map((g) => g.subcategory).filter(Boolean))]
              .sort((a, b) => a.localeCompare(b, 'fr'))
              .map((s) => ({ value: s, label: s })),
          ]}
        />
        <FilterSelect
          label="Couleur"
          value={color}
          onChange={setColor}
          options={[
            { value: 'all', label: 'Toutes' },
            ...PALETTE.map((c) => ({ value: c.id, label: c.label })),
          ]}
        />
        <FilterSelect
          label="Saison"
          value={season}
          onChange={(v) => setSeason(v as Season | 'all')}
          options={[
            { value: 'all', label: 'Toutes' },
            ...Object.entries(SEASON_LABELS).map(([k, label]) => ({ value: k, label })),
          ]}
        />
        <FilterSelect
          label="Moment"
          value={moment}
          onChange={(v) => setMoment(v as Moment | 'all')}
          options={[
            { value: 'all', label: 'Tous' },
            ...Object.entries(MOMENT_LABELS).map(([k, label]) => ({ value: k, label })),
          ]}
        />
        <FilterSelect
          label="Formalité"
          value={String(formality)}
          onChange={(v) => setFormality(v === 'all' ? 'all' : (Number(v) as Formality))}
          options={[
            { value: 'all', label: 'Toutes' },
            ...([1, 2, 3] as Formality[]).map((f) => ({
              value: String(f),
              label: FORMALITY_LABELS[f],
            })),
          ]}
        />
        <FilterSelect
          label="Taille"
          value={size}
          onChange={setSize}
          options={[
            { value: 'all', label: 'Toutes' },
            ...[...new Set(garments.map((g) => g.size).filter((s): s is string => Boolean(s)))].map(
              (s) => ({ value: s, label: s }),
            ),
          ]}
        />
        <FilterSelect
          label="Marque"
          value={brand}
          onChange={setBrand}
          options={[
            { value: 'all', label: 'Toutes' },
            ...[...new Set(garments.map((g) => g.brand).filter((s): s is string => Boolean(s)))]
              .sort((a, b) => a.localeCompare(b, 'fr'))
              .map((s) => ({ value: s, label: s })),
          ]}
        />
        <FilterSelect
          label="Photo"
          value={photo}
          onChange={(v) => setPhoto(v as PhotoFilter)}
          options={[
            { value: 'all', label: 'Toutes' },
            { value: 'with', label: 'Avec photo' },
            { value: 'without', label: 'Sans photo' },
          ]}
        />
        <FilterSelect
          label="Regrouper"
          value={groupBy}
          onChange={(v) => setGroupBy(v as GroupBy)}
          options={(Object.keys(GROUP_LABELS) as GroupBy[]).map((k) => ({
            value: k,
            label: GROUP_LABELS[k],
          }))}
        />
        <label className="ml-auto flex items-center gap-1.5 text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-ink focus-ring"
          />
          Archivées
        </label>
      </div>

      {selecting && (
        <div
          className="card sticky top-[3.35rem] z-20 flex flex-wrap items-center gap-2 px-3 py-2 text-xs"
          role="toolbar"
          aria-label="Gros tri"
        >
          <button
            type="button"
            onClick={toggleVisible}
            disabled={visibleIds.length === 0}
            className="btn focus-ring"
          >
            {allVisibleSelected ? 'Retirer le visible' : 'Tout visible'}
          </button>
          <p className="text-muted" aria-live="polite">
            <span className="font-num tabular-nums text-ink">{selectedIds.length}</span>{' '}
            sélectionnée{selectedIds.length === 1 ? '' : 's'}
            {visibleIds.length > 0 ? ` · ${visibleSelectedCount}/${visibleIds.length} visibles` : ''}
            {hiddenSelectedCount > 0 ? ` · ${hiddenSelectedCount} hors filtres` : ''}
          </p>
          <button
            type="button"
            onClick={() => setBulkConfirm(true)}
            disabled={selectedIds.length === 0}
            className="btn btn-primary ml-auto focus-ring"
          >
            {selectedIds.length === 0
              ? 'Supprimer'
              : `Supprimer ${selectedIds.length} ${selectedIds.length === 1 ? 'pièce' : 'pièces'}`}
          </button>
        </div>
      )}

      {garments.length === 0 && (
        <div className="card px-4 py-8 text-sm">
          <p>Aucune pièce. Ajoute tes vêtements — 5 suffisent pour commencer.</p>
        </div>
      )}

      {garments.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted">Aucune pièce ne correspond aux filtres.</p>
      )}

      {sections.map((section) => (
        <section key={section.key}>
          {section.label && (
            <h2 className="kicker mb-2 mt-2">
              {section.label}
              <span className="ml-1 font-num tabular-nums">({section.items.length})</span>
            </h2>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {section.items.map((g) => (
              <GarmentCard
                key={`${section.key}-${g.id}`}
                garment={g}
                selecting={selecting}
                selected={selecting && selectedIds.includes(g.id)}
                onSelect={selecting ? () => toggleSelected(g.id) : undefined}
                onEdit={
                  selecting
                    ? undefined
                    : () => {
                        setEditing(g)
                        setShowForm(true)
                      }
                }
                onArchive={selecting ? undefined : () => setArchived(g.id, !g.archived)}
                onDelete={
                  selecting
                    ? undefined
                    : () => {
                        const affected = outfits.filter((o) => o.garmentIds.includes(g.id))
                        if (affected.length === 0) {
                          if (window.confirm(`Supprimer définitivement « ${g.name} » ?`)) {
                            removeGarment(g.id, [])
                          }
                          return
                        }
                        setPendingDelete(g)
                      }
                }
              />
            ))}
          </div>
        </section>
      ))}
      {pendingDelete && (
        <ReplaceGarmentDialog
          garment={pendingDelete}
          outfits={outfits.filter((o) => o.garmentIds.includes(pendingDelete.id))}
          garments={garments}
          onCancel={() => setPendingDelete(null)}
          onConfirm={(plan) => {
            removeGarment(pendingDelete.id, plan)
            setPendingDelete(null)
          }}
        />
      )}
      {bulkConfirm && selected.length > 0 && (
        <BulkDeleteDialog
          garments={selected}
          outfits={outfits}
          onCancel={() => setBulkConfirm(false)}
          onConfirm={confirmBulk}
        />
      )}
      {replacing && bulkReplace && replacingOutfits.length > 0 && (
        <ReplaceGarmentDialog
          key={replacing.id}
          garment={replacing}
          outfits={replacingOutfits}
          garments={garments}
          excludeIds={bulkReplace.excludeIds}
          stepLabel={`Pièce ${bulkReplace.plans.length + 1} / ${bulkReplace.plans.length + bulkReplace.queue.length} encore dans une tenue`}
          onCancel={() => setBulkReplace(null)}
          onConfirm={(plan) => {
            startReplaceQueue(
              bulkReplace.queue.slice(1),
              bulkReplace.unused,
              [...bulkReplace.plans, { id: replacing.id, plan }],
            )
          }}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-pill focus-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
