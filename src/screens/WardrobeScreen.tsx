import { useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  MOMENT_LABELS,
  PALETTE,
  SEASON_LABELS,
  getColor,
} from '../config/dress'
import type { Category, Formality, Garment, Moment, Season } from '../domain/types'
import { GarmentCard } from '../components/GarmentCard'
import { GarmentForm } from '../components/GarmentForm'
import { ReplaceGarmentDialog } from '../components/ReplaceGarmentDialog'
import { useStore } from '../state/Store'

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

export function WardrobeScreen() {
  const { garments, outfits, upsertGarment, setArchived, removeGarment, loadSample } = useStore()
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
      </header>

      {(showForm || editing) && (
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

      {garments.length === 0 && (
        <div className="card px-4 py-8 text-sm">
          <p>Aucune pièce. Ajoute tes vêtements — 5 suffisent pour commencer.</p>
          <button
            type="button"
            onClick={loadSample}
            className="btn mt-3 focus-ring"
          >
            Charger 12 pièces d’exemple
          </button>
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
                onEdit={() => {
                  setEditing(g)
                  setShowForm(true)
                }}
                onArchive={() => setArchived(g.id, !g.archived)}
                onDelete={() => {
                  const affected = outfits.filter((o) => o.garmentIds.includes(g.id))
                  if (affected.length === 0) {
                    if (window.confirm(`Supprimer définitivement « ${g.name} » ?`)) {
                      removeGarment(g.id, [])
                    }
                    return
                  }
                  setPendingDelete(g)
                }}
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
