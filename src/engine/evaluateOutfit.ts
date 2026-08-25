import {
  BLUE_FAMILY,
  HIGH_POSITION_CATEGORIES,
  MARINE_COLOR_ID,
  OPTICAL_WHITE_ID,
  RULES,
  SCORE,
  SIGNATURE_COLOR_ID,
  getColor,
  isNeutralFamily,
} from '../config/dress'
import type { ColorDef } from '../config/dress'
import type {
  Category,
  Garment,
  OutfitEvaluation,
  RuleHit,
  Season,
} from '../domain/types'

type Colored = Garment & { colorDef: ColorDef }

function resolve(garments: Garment[]): Colored[] {
  return garments
    .filter((g) => !g.archived)
    .map((g) => {
      const colorDef = getColor(g.color)
      if (!colorDef) return null
      return { ...g, colorDef }
    })
    .filter((g): g is Colored => g !== null)
}

function byCategory(items: Colored[], category: Category): Colored | undefined {
  return items.find((g) => g.category === category)
}

function hit(
  rule: { id: string; severity: RuleHit['severity']; delta: number; message: string },
  message = rule.message,
): RuleHit {
  return { id: rule.id, severity: rule.severity, delta: rule.delta, message }
}

function materialKey(g: Colored): string {
  return (g.material ?? '').trim().toLowerCase()
}

export function ruleR1(items: Colored[]): RuleHit[] {
  const hits: RuleHit[] = []
  for (const g of items) {
    if (!HIGH_POSITION_CATEGORIES.includes(g.category as (typeof HIGH_POSITION_CATEGORIES)[number])) {
      continue
    }
    if (g.colorDef.isNearFaceSafe) continue
    hits.push(hit(RULES.R1, g.colorDef.nearFaceWarning ?? RULES.R1.message))
  }
  return hits
}

export function ruleR2(items: Colored[]): RuleHit[] {
  const top = byCategory(items, 'top')
  const bottom = byCategory(items, 'bottom')
  if (!top || !bottom) return []
  const gap = Math.abs(top.colorDef.lightness - bottom.colorDef.lightness)
  if (gap > RULES.R2.maxLightnessGap) {
    return [hit(RULES.R2)]
  }
  return []
}

export function ruleR3(items: Colored[]): RuleHit[] {
  if (items.some((g) => g.color === OPTICAL_WHITE_ID)) {
    return [hit(RULES.R3)]
  }
  return []
}

export function ruleR4(items: Colored[]): RuleHit[] {
  const top = byCategory(items, 'top')
  const layer = byCategory(items, 'layer')
  if (!top || !layer) return []
  if (layer.colorDef.lightness < top.colorDef.lightness) {
    return [hit(RULES.R4)]
  }
  return []
}

export function ruleR5(items: Colored[]): RuleHit[] {
  const families = new Set(
    items
      .map((g) => g.colorDef.family)
      .filter((family) => !isNeutralFamily(family)),
  )
  if (families.size > RULES.R5.maxNonNeutralFamilies) {
    return [hit(RULES.R5)]
  }
  return []
}

export function ruleR6(items: Colored[]): RuleHit[] {
  const top = byCategory(items, 'top')
  const bottom = byCategory(items, 'bottom')
  if (!top || !bottom) return []
  if (top.color !== bottom.color) return []
  if (materialKey(top) !== materialKey(bottom)) return []
  return [hit(RULES.R6)]
}

export function ruleR7(items: Colored[]): RuleHit[] {
  if (items.length < 2) return []
  const values = items.map((g) => g.formality)
  const gap = Math.max(...values) - Math.min(...values)
  if (gap > RULES.R7.maxFormalityGap) {
    return [hit(RULES.R7)]
  }
  return []
}

export function ruleR8(items: Colored[]): RuleHit[] {
  const blues = items.filter((g) => g.colorDef.family === BLUE_FAMILY)
  const nonMarine = new Set(blues.map((g) => g.color).filter((id) => id !== MARINE_COLOR_ID))
  if (nonMarine.size >= 2) {
    return [hit(RULES.R8)]
  }
  return []
}

export function ruleR9(items: Colored[]): RuleHit[] {
  if (items.length === 0) return []
  const allDark = items.every((g) => g.colorDef.lightness >= RULES.R9.darkFrom)
  return allDark ? [hit(RULES.R9)] : []
}

export function ruleR10(items: Colored[]): RuleHit[] {
  if (items.length < 2) return []
  const seasons: Season[] = ['été', 'mi-saison', 'hiver']
  const intersection = seasons.filter((s) => items.every((g) => g.season.includes(s)))
  if (intersection.length === 0) {
    return [hit(RULES.R10)]
  }
  return []
}

export function ruleB1(items: Colored[]): RuleHit[] {
  const hasSignatureHigh = items.some(
    (g) =>
      g.color === SIGNATURE_COLOR_ID &&
      HIGH_POSITION_CATEGORIES.includes(g.category as (typeof HIGH_POSITION_CATEGORIES)[number]),
  )
  return hasSignatureHigh ? [hit(RULES.B1)] : []
}

export function ruleB2(items: Colored[]): RuleHit[] {
  const hasTop = items.some((g) => g.category === 'top')
  const hasLayer = items.some((g) => g.category === 'layer')
  return hasTop && hasLayer ? [hit(RULES.B2)] : []
}

export function ruleB3(items: Colored[]): RuleHit[] {
  const top = byCategory(items, 'top')
  const bottom = byCategory(items, 'bottom')
  if (!top || !bottom) return []
  if (top.color !== bottom.color) return []
  if (materialKey(top) === materialKey(bottom)) return []
  return [hit(RULES.B3)]
}

export function ruleB4(items: Colored[]): RuleHit[] {
  const nonNeutral = new Set(
    items
      .map((g) => g.colorDef.family)
      .filter((family) => !isNeutralFamily(family)),
  )
  const neutralCount = items.filter((g) => isNeutralFamily(g.colorDef.family)).length
  if (nonNeutral.size === 1 && neutralCount >= RULES.B4.minNeutralPieces) {
    return [hit(RULES.B4)]
  }
  return []
}

const PENALTY_RULES = [
  ruleR1,
  ruleR2,
  ruleR3,
  ruleR4,
  ruleR5,
  ruleR6,
  ruleR7,
  ruleR8,
  ruleR9,
  ruleR10,
]

const BONUS_RULES = [ruleB1, ruleB2, ruleB3, ruleB4]

function pickReasons(hits: RuleHit[]): RuleHit[] {
  const rank: Record<RuleHit['severity'], number> = {
    blocking: 0,
    strong: 1,
    soft: 2,
    bonus: 3,
  }
  return [...hits]
    .sort((a, b) => {
      const sev = rank[a.severity] - rank[b.severity]
      if (sev !== 0) return sev
      return Math.abs(b.delta) - Math.abs(a.delta)
    })
    .slice(0, SCORE.reasonCount)
}

/**
 * Fonction pure : score + warnings d'une tenue.
 * Aucun I/O, aucun état React.
 */
export function evaluateOutfit(garments: Garment[]): OutfitEvaluation {
  const items = resolve(garments.filter((g) => g.category !== 'fragrance'))
  const hits = [...PENALTY_RULES, ...BONUS_RULES].flatMap((fn) => fn(items))

  const raw = hits.reduce((sum, h) => sum + h.delta, SCORE.start)
  const score = Math.min(SCORE.cap, Math.max(SCORE.floor, raw))
  const warnings = hits.filter((h) => h.delta < 0).map((h) => h.message)
  const isBlocking = hits.some((h) => h.severity === 'blocking')

  return {
    score,
    warnings,
    hits,
    reasons: pickReasons(hits),
    isBlocking,
  }
}

export function wouldKeepScore(
  current: Garment[],
  candidate: Garment,
  minScore: number,
): boolean {
  return evaluateOutfit(placeGarment(current, candidate)).score >= minScore
}

export function placeGarment(current: Garment[], candidate: Garment): Garment[] {
  if (current.some((g) => g.id === candidate.id)) {
    return current.filter((g) => g.id !== candidate.id)
  }
  if (candidate.category === 'accessory') {
    return [...current, candidate]
  }
  return [...current.filter((g) => g.category !== candidate.category), candidate]
}

export function fragranceMatches(
  perfume: Garment,
  clothes: Garment[],
  usageLabels: string[] = [],
): boolean {
  const worn = clothes.filter((g) => g.category !== 'fragrance')
  const moments = perfume.moments?.length ? perfume.moments : ['journée', 'soirée']
  if (worn.length > 0) {
    const overlap = perfume.season.some((s) => worn.some((c) => c.season.includes(s)))
    if (!overlap) return false
  }
  const evening = usageLabels.some((l) => /soirée/i.test(l))
  const daytime = usageLabels.some((l) => /journée|travail|soleil/i.test(l))
  if (evening && !daytime) return moments.includes('soirée')
  if (daytime && !evening) return moments.includes('journée')
  return true
}
