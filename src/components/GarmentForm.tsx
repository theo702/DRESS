import { useState, type FormEvent } from 'react'
import {
  BRANDS,
  CATEGORY_LABELS,
  FORMALITY_LABELS,
  MATERIALS,
  SIZES,
  SUBCATEGORIES,
  getColor,
} from '../config/dress'
import type { Category, Formality, Garment, Season } from '../domain/types'
import { uid } from '../lib/ids'
import { fileToDataUrl } from '../lib/photo'
import { ColorPicker } from './ColorPicker'

const CATEGORIES: Category[] = ['top', 'bottom', 'layer', 'shoes', 'accessory']
const SEASONS: Season[] = ['été', 'mi-saison', 'hiver']

type Props = {
  initial?: Garment | null
  onSave: (garment: Garment) => void
  onCancel?: () => void
}

export function GarmentForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'top')
  const [subcategory, setSubcategory] = useState(initial?.subcategory ?? SUBCATEGORIES.top[0] ?? '')
  const [color, setColor] = useState(initial?.color ?? 'bleu-ciel')
  const [material, setMaterial] = useState(initial?.material ?? '')
  const [brand, setBrand] = useState(initial?.brand ?? '')
  const [size, setSize] = useState(initial?.size ?? '')
  const [season, setSeason] = useState<Season[]>(
    initial?.season ?? ['été', 'mi-saison', 'hiver'],
  )
  const [formality, setFormality] = useState<Formality>(initial?.formality ?? 2)
  const [photoDataUrl, setPhotoDataUrl] = useState(initial?.photoDataUrl)
  const [error, setError] = useState<string | null>(null)

  const colorDef = getColor(color)
  const subs = SUBCATEGORIES[category] ?? []

  function toggleSeason(s: Season) {
    setSeason((prev) => {
      if (prev.includes(s)) {
        const next = prev.filter((x) => x !== s)
        return next.length === 0 ? prev : next
      }
      return [...prev, s]
    })
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return
    try {
      const url = await fileToDataUrl(file)
      setPhotoDataUrl(url)
    } catch {
      setError('Impossible de lire la photo.')
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    const type = subcategory.trim()
    if (!trimmed) {
      setError('Donne un nom à la pièce.')
      return
    }
    if (!type) {
      setError('Indique un type (tee, chino, baskets…).')
      return
    }
    onSave({
      id: initial?.id ?? uid(),
      name: trimmed,
      category,
      subcategory: type,
      color,
      material: material || undefined,
      brand: brand.trim() || undefined,
      size: size.trim() || undefined,
      season,
      formality,
      photoDataUrl,
      archived: initial?.archived ?? false,
      createdAt: initial?.createdAt ?? Date.now(),
    })
  }

  return (
    <form onSubmit={submit} className="border border-line bg-paper p-3">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">
          {initial ? 'Modifier la pièce' : 'Nouvelle pièce'}
        </h2>
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-muted hover:text-ink focus-ring">
            Annuler
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Nom</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chemise oxford bleu ciel"
            className="w-full border border-line bg-paper px-2 py-1.5 text-sm text-ink focus-ring"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            <span className="mb-1 block text-muted">Catégorie</span>
            <select
              value={category}
              onChange={(e) => {
                const next = e.target.value as Category
                setCategory(next)
                setSubcategory(SUBCATEGORIES[next]?.[0] ?? '')
              }}
              className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-1 block text-muted">Type</span>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              list={`dress-types-${category}`}
              placeholder="tee, chino, baskets…"
              className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
            />
            <datalist id={`dress-types-${category}`}>
              {subs.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs text-muted">
          Couleur
          {colorDef && (
            <span className="ml-2 text-ink">
              {colorDef.label}
              {!colorDef.allowed && ' — sélectionnable mais toujours signalée'}
            </span>
          )}
        </p>
        <ColorPicker value={color} onChange={setColor} />
        {colorDef && !colorDef.allowed && (
          <p className="mt-1.5 text-xs text-danger">{colorDef.pickerHint}</p>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Marque</span>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            list="dress-brands"
            placeholder="Uniqlo, COS…"
            className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Taille</span>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            list="dress-sizes"
            placeholder="M, 42…"
            className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
          />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block text-muted">Matière</span>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="w-full border border-line bg-paper px-2 py-1.5 text-sm focus-ring"
          >
            <option value="">—</option>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <fieldset className="text-xs">
          <legend className="mb-1 text-muted">Saison</legend>
          <div className="flex flex-wrap gap-1">
            {SEASONS.map((s) => {
              const on = season.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSeason(s)}
                  aria-pressed={on}
                  className={`border px-2 py-1 focus-ring ${on ? 'border-ink bg-ink text-paper' : 'border-line text-ink'}`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset className="text-xs">
          <legend className="mb-1 text-muted">Formalité</legend>
          <div className="flex gap-1">
            {([1, 2, 3] as Formality[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormality(f)}
                aria-pressed={formality === f}
                className={`border px-2 py-1 focus-ring ${formality === f ? 'border-ink bg-ink text-paper' : 'border-line'}`}
              >
                {f} {FORMALITY_LABELS[f]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs text-muted">Photo</p>
        <div className="flex items-center gap-3">
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden border border-dashed border-line text-[11px] text-muted focus-within:outline focus-within:outline-2">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>Ajouter</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void onPhoto(e.target.files?.[0])}
            />
          </label>
          {photoDataUrl && (
            <button
              type="button"
              onClick={() => setPhotoDataUrl(undefined)}
              className="text-xs text-muted hover:text-ink focus-ring"
            >
              Retirer la photo
            </button>
          )}
          <p className="text-[11px] text-muted">Une photo locale, stockée dans le navigateur.</p>
        </div>
      </div>
      <datalist id="dress-brands">
        {BRANDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <datalist id="dress-sizes">
        {SIZES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          className="border border-ink bg-ink px-3 py-1.5 text-sm text-paper focus-ring"
        >
          Enregistrer
        </button>
      </div>
    </form>
  )
}
