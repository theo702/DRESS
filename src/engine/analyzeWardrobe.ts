import { CATEGORY_LABELS, PALETTE, getColor, isNeutralFamily } from '../config/dress'
import type { Garment, Outfit, WearLog } from '../domain/types'

export type ColorShare = { id: string; label: string; hex: string; count: number }
export type CategoryShare = { id: string; label: string; count: number }
export type WardrobeGap = { id: string; message: string }

export function colorDistribution(garments: Garment[]): ColorShare[] {
  const active = garments.filter((g) => !g.archived)
  const counts = new Map<string, number>()
  for (const g of active) {
    counts.set(g.color, (counts.get(g.color) ?? 0) + 1)
  }
  return PALETTE.map((c) => ({
    id: c.id,
    label: c.label,
    hex: c.hex,
    count: counts.get(c.id) ?? 0,
  })).filter((c) => c.count > 0)
}

export function categoryDistribution(garments: Garment[]): CategoryShare[] {
  const active = garments.filter((g) => !g.archived)
  const ids = ['top', 'bottom', 'layer', 'shoes', 'accessory', 'fragrance']
  return ids.map((id) => ({
    id,
    label: CATEGORY_LABELS[id] ?? id,
    count: active.filter((g) => g.category === id).length,
  }))
}

export function neverWornGarments(
  garments: Garment[],
  outfits: Outfit[],
  wearLogs: WearLog[],
): Garment[] {
  const wornOutfitIds = new Set(wearLogs.map((l) => l.outfitId))
  const wornGarmentIds = new Set<string>()
  for (const o of outfits) {
    if (!wornOutfitIds.has(o.id)) continue
    for (const id of o.garmentIds) wornGarmentIds.add(id)
  }
  return garments.filter((g) => !g.archived && !wornGarmentIds.has(g.id))
}

export function wardrobeGaps(garments: Garment[]): WardrobeGap[] {
  const active = garments.filter((g) => !g.archived)
  const gaps: WardrobeGap[] = []
  const bottoms = active.filter((g) => g.category === 'bottom')
  const tops = active.filter((g) => g.category === 'top')
  const layers = active.filter((g) => g.category === 'layer')
  const shoes = active.filter((g) => g.category === 'shoes')

  const lightBottoms = bottoms.filter((g) => (getColor(g.color)?.lightness ?? 5) <= 2)
  if (active.length > 0 && bottoms.length > 0 && lightBottoms.length === 0) {
    gaps.push({
      id: 'no-light-bottoms',
      message: 'Aucun bas en L1–L2 → limite les tenues d’été (contraste trop violent avec un haut sombre).',
    })
  }

  const lightTops = tops.filter((g) => (getColor(g.color)?.lightness ?? 5) <= 2)
  if (tops.length > 0 && lightTops.length === 0) {
    gaps.push({
      id: 'no-light-tops',
      message: 'Aucun haut clair. Sans pièce L1–L2 près du visage, les tenues restent lourdes.',
    })
  }

  const safeTops = tops.filter((g) => getColor(g.color)?.isNearFaceSafe)
  if (tops.length > 0 && safeTops.length === 0) {
    gaps.push({
      id: 'no-safe-tops',
      message: 'Aucun haut « near-face safe ». Les combinaisons partent avec −30 avant même le bas.',
    })
  }

  const summerBottoms = bottoms.filter((g) => g.season.includes('été'))
  if (bottoms.length > 0 && summerBottoms.length === 0) {
    gaps.push({
      id: 'no-summer-bottoms',
      message: 'Aucun bas tagué été. Aujourd’hui ne pourra rien proposer en juin–août.',
    })
  }

  const winterLayers = layers.filter((g) => g.season.includes('hiver'))
  if (layers.length === 0) {
    gaps.push({
      id: 'no-layers',
      message: 'Aucune couche. Tu perds le bonus superposition et les tenues mi-saison/hiver.',
    })
  } else if (winterLayers.length === 0) {
    gaps.push({
      id: 'no-winter-layers',
      message: 'Aucune couche d’hiver (pull, manteau, veste laine).',
    })
  }

  if (active.length > 0 && shoes.length === 0) {
    gaps.push({
      id: 'no-shoes',
      message: 'Aucune chaussure. Les tenues restent ouvertes et le score ne voit pas le pied.',
    })
  }

  const accents = active.filter((g) => {
    const family = getColor(g.color)?.family
    return family ? !isNeutralFamily(family) : false
  })
  if (active.length >= 4 && accents.length === 0) {
    gaps.push({
      id: 'no-accent',
      message: 'Que des neutres. Ajoute un accent (bleu ciel, sauge, bordeaux) pour ancrer les tenues.',
    })
  }

  if (tops.length === 0 && active.length > 0) {
    gaps.push({ id: 'no-tops', message: 'Aucun haut. Impossible d’assembler une tenue.' })
  }
  if (bottoms.length === 0 && active.length > 0) {
    gaps.push({ id: 'no-bottoms', message: 'Aucun bas. Impossible d’assembler une tenue.' })
  }

  return gaps
}
