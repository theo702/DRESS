import { SCORE, currentSeason, getColor } from '../config/dress'
import type { Garment, Outfit, OutfitEvaluation, Season, WearLog } from '../domain/types'
import { canonicalGarmentKey, isStale } from '../lib/dates'
import { evaluateOutfit } from './evaluateOutfit'

export type SuggestedOutfit = {
  garments: Garment[]
  evaluation: OutfitEvaluation
  key: string
}

function inSeason(g: Garment, season: Season): boolean {
  return g.season.includes(season)
}

/**
 * Génère des tenues score ≥ seuil, saison du mois, pas portées depuis staleDays.
 * Combinatoire top × bottom × (layer|∅) × (shoes|∅).
 */
export function suggestOutfits(
  garments: Garment[],
  outfits: Outfit[],
  wearLogs: WearLog[],
  options?: { minScore?: number; season?: Season; now?: Date; limit?: number },
): SuggestedOutfit[] {
  const minScore = options?.minScore ?? SCORE.todayMin
  const season = options?.season ?? currentSeason(options?.now)
  const limit = options?.limit ?? 3
  const now = options?.now ?? new Date()

  const active = garments.filter((g) => !g.archived && inSeason(g, season))
  const tops = active.filter((g) => g.category === 'top')
  const bottoms = active.filter((g) => g.category === 'bottom')
  const layers = active.filter((g) => g.category === 'layer')
  const shoes = active.filter((g) => g.category === 'shoes')

  const recentlyWorn = new Set<string>()
  for (const log of wearLogs) {
    if (!isStale(log.date, now)) {
      const outfit = outfits.find((o) => o.id === log.outfitId)
      if (outfit) recentlyWorn.add(canonicalGarmentKey(outfit.garmentIds))
    }
  }

  const scored: SuggestedOutfit[] = []
  const layersOrNone: Array<Garment | undefined> = [undefined, ...layers]
  const shoesOrNone: Array<Garment | undefined> = [undefined, ...shoes]

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const layer of layersOrNone) {
        for (const shoe of shoesOrNone) {
          const combo = [top, bottom, layer, shoe].filter((g): g is Garment => Boolean(g))
          const key = canonicalGarmentKey(combo.map((g) => g.id))
          if (recentlyWorn.has(key)) continue
          const evaluation = evaluateOutfit(combo)
          if (evaluation.score < minScore) continue
          if (evaluation.isBlocking) continue
          scored.push({ garments: combo, evaluation, key })
        }
      }
    }
  }

  scored.sort((a, b) => b.evaluation.score - a.evaluation.score)

  const picked: SuggestedOutfit[] = []
  const usedPairs = new Set<string>()
  for (const item of scored) {
    const topId = item.garments.find((g) => g.category === 'top')?.id
    const bottomId = item.garments.find((g) => g.category === 'bottom')?.id
    const pair = `${topId}|${bottomId}`
    if (usedPairs.has(pair)) continue
    usedPairs.add(pair)
    picked.push(item)
    if (picked.length >= limit) break
  }

  return picked
}

export function diagnoseMissing(garments: Garment[], season: Season): string[] {
  const active = garments.filter((g) => !g.archived)
  const seasonal = active.filter((g) => g.season.includes(season))
  const messages: string[] = []

  const tops = seasonal.filter((g) => g.category === 'top')
  const bottoms = seasonal.filter((g) => g.category === 'bottom')
  const layers = seasonal.filter((g) => g.category === 'layer')
  const shoes = seasonal.filter((g) => g.category === 'shoes')

  if (tops.length === 0) {
    messages.push(`Il te manque un haut pour la saison « ${season} ».`)
  }
  if (bottoms.length === 0) {
    messages.push(`Il te manque un bas pour la saison « ${season} ».`)
  }

  const lightBottoms = bottoms.filter((g) => {
    const L = getColor(g.color)?.lightness
    return L !== undefined && L <= 2
  })
  if (bottoms.length > 0 && lightBottoms.length === 0 && season !== 'hiver') {
    messages.push(
      season === 'été'
        ? 'Il te manque un bas clair pour l’été.'
        : 'Il te manque un bas clair (L1–L2) pour la mi-saison.',
    )
  }

  const safeTops = tops.filter((g) => getColor(g.color)?.isNearFaceSafe)
  if (tops.length > 0 && safeTops.length === 0) {
    messages.push(
      'Il te manque un haut dans une couleur sûre près du visage (bleu ciel, écru, sauge…).',
    )
  }

  if (layers.length === 0 && season !== 'été') {
    messages.push(`Il te manque une couche (pull, veste, surchemise) pour la saison « ${season} ».`)
  }

  if (shoes.length === 0) {
    messages.push('Il te manque une paire de chaussures de saison pour fermer les tenues.')
  }

  if (active.length > 0 && seasonal.length < 3) {
    messages.push(`Trop peu de pièces taguées « ${season} » — élargis les saisons de tes basiques.`)
  }

  return messages
}
