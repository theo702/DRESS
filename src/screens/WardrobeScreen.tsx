import { useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  PALETTE,
  SEASON_LABELS,
} from '../config/dress'
import type { Category, Formality, Garment, Season } from '../domain/types'
import { GarmentCard } from '../components/GarmentCard'
import { GarmentForm } from '../components/GarmentForm'
import { useStore } from '../state/Store'

const CATEGORIES: Array<Category | 'all'> = ['all', 'top', 'bottom', 'layer', 'shoes', 'accessory']

export function WardrobeScreen() {
  const { garments, upsertGarment, setArchived, loadSample } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Garment | null>(null)
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [type, setType] = useState('all')
  const [color, setColor] = useState<string>('all')
  const [season, setSeason] = useState<Season | 'all'>('all')
  const [formality, setFormality] = useState<Formality | 'all'>('all')
  const [size, setSize] = useState('all')
  const [brand, setBrand] = useState('all')
  const [showArchived, setShowArchived] = useState(false)

  const filtered = useMemo(() => {
    return garments.filter((g) => {
      if (!showArchived && g.archived) return false
      if (category !== 'all' && g.category !== category) return false
      if (type !== 'all' && g.subcategory !== type) return false
      if (color !== 'all' && g.color !== color) return false
      if (season !== 'all' && !g.season.includes(season)) return false
      if (formality !== 'all' && g.formality !== formality) return false
      if (size !== 'all' && g.size !== size) return false
      if (brand !== 'all' && g.brand !== brand) return false
      return true
    })
  }, [garments, showArchived, category, type, color, season, formality, size, brand])

  const activeCount = garments.filter((g) => !g.archived).length

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Garde-robe</h1>
          <p className="text-xs text-muted">
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
          className="border border-ink bg-ink px-3 py-1.5 text-sm text-paper focus-ring"
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

      <div className="flex flex-wrap items-center gap-2 text-xs">
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
        <div className="border border-line px-4 py-8 text-sm">
          <p>Aucune pièce. Ajoute tes vêtements — 5 suffisent pour commencer.</p>
          <button
            type="button"
            onClick={loadSample}
            className="mt-3 border border-line px-3 py-1.5 text-xs focus-ring"
          >
            Charger 12 pièces d’exemple
          </button>
        </div>
      )}

      {garments.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted">Aucune pièce ne correspond aux filtres.</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((g) => (
          <GarmentCard
            key={g.id}
            garment={g}
            onEdit={() => {
              setEditing(g)
              setShowForm(true)
            }}
            onArchive={() => setArchived(g.id, !g.archived)}
          />
        ))}
      </div>
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
        className="border border-line bg-paper px-1.5 py-1 text-xs text-ink focus-ring"
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
