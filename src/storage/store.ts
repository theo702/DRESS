import type { AppData, Garment, GarmentRemovalPlan, Moment, Outfit, Tag } from '../domain/types'
import { ALL_MOMENTS, DATA_VERSION, DEFAULT_TAGS, STORAGE_KEY } from '../config/dress'
import { evaluateOutfit } from '../engine/evaluateOutfit'

const empty = (): AppData => ({
  version: DATA_VERSION,
  garments: [],
  outfits: [],
  wearLogs: [],
  tags: DEFAULT_TAGS.map((t) => ({ ...t })),
})

export function migrate(raw: unknown): AppData {
  const parsed = raw as Partial<AppData> & { version?: number }
  const garments = (Array.isArray(parsed.garments) ? parsed.garments : []).map((raw) => {
    const moments: Moment[] =
      Array.isArray(raw.moments) && raw.moments.length > 0
        ? raw.moments.filter((m: string): m is Moment => m === 'journée' || m === 'soirée')
        : [...ALL_MOMENTS]
    return { ...raw, moments: moments.length > 0 ? moments : [...ALL_MOMENTS] }
  })
  const wearLogs = Array.isArray(parsed.wearLogs) ? parsed.wearLogs : []
  const tags: Tag[] =
    Array.isArray(parsed.tags) && parsed.tags.length > 0
      ? parsed.tags
      : DEFAULT_TAGS.map((t) => ({ ...t }))
  const outfits: Outfit[] = Array.isArray(parsed.outfits)
    ? parsed.outfits.map((o) => ({
        ...o,
        tagIds: Array.isArray(o.tagIds) ? o.tagIds : [],
        garmentIds: Array.isArray(o.garmentIds) ? o.garmentIds : [],
        warnings: Array.isArray(o.warnings) ? o.warnings : [],
        score: typeof o.score === 'number' ? o.score : 0,
        createdAt: typeof o.createdAt === 'number' ? o.createdAt : Date.now(),
        id: o.id,
      }))
    : []
  return {
    version: DATA_VERSION,
    garments,
    outfits,
    wearLogs,
    tags,
  }
}

export function loadState(): AppData {
  if (typeof localStorage === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    return migrate(JSON.parse(raw))
  } catch {
    return empty()
  }
}

export function saveState(data: AppData): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportJson(data: AppData): string {
  const payload: AppData = {
    ...data,
    version: DATA_VERSION,
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(payload, null, 2)
}

export function parseImport(raw: string): AppData {
  const parsed = JSON.parse(raw) as unknown
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Fichier invalide')
  }
  const obj = parsed as { garments?: unknown; outfits?: unknown; wearLogs?: unknown }
  if (!Array.isArray(obj.garments) || !Array.isArray(obj.outfits) || !Array.isArray(obj.wearLogs)) {
    throw new Error('JSON incomplet : garments, outfits et wearLogs sont requis.')
  }
  return migrate(parsed)
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function outfitPieces(outfit: Outfit, garments: Garment[]): Garment[] {
  return outfit.garmentIds
    .map((id) => garments.find((g) => g.id === id))
    .filter((g): g is Garment => Boolean(g))
}

export function rescoreOutfit(outfit: Outfit, garments: Garment[]): Outfit {
  const pieces = outfit.garmentIds
    .map((id) => garments.find((g) => g.id === id && !g.archived))
    .filter((g): g is Garment => Boolean(g))
  const ev = evaluateOutfit(pieces)
  return {
    ...outfit,
    garmentIds: pieces.map((g) => g.id),
    score: ev.score,
    warnings: ev.warnings,
  }
}

export type GarmentRemoval = {
  id: string
  plan: GarmentRemovalPlan[]
}

/** Retire une ou plusieurs pièces et applique le plan de remplacement des tenues. */
export function applyGarmentRemovals(data: AppData, removals: GarmentRemoval[]): AppData {
  if (removals.length === 0) return data
  const ids = new Set(removals.map((r) => r.id))
  let outfits = data.outfits.map((o) => ({ ...o, garmentIds: [...o.garmentIds] }))
  let wearLogs = [...data.wearLogs]

  for (const { id, plan } of removals) {
    for (const step of plan) {
      if (step.deleteOutfit) {
        outfits = outfits.filter((o) => o.id !== step.outfitId)
        wearLogs = wearLogs.filter((l) => l.outfitId !== step.outfitId)
        continue
      }
      outfits = outfits.map((o) => {
        if (o.id !== step.outfitId) return o
        const nextIds = o.garmentIds
          .map((gid) => (gid === id ? step.replacementId : gid))
          .filter((gid): gid is string => typeof gid === 'string' && !ids.has(gid))
        return { ...o, garmentIds: nextIds }
      })
    }
  }

  const garments = data.garments.filter((g) => !ids.has(g.id))
  outfits = outfits.map((o) =>
    rescoreOutfit(
      {
        ...o,
        garmentIds: o.garmentIds.filter((gid) => !ids.has(gid)),
      },
      garments,
    ),
  )
  return { ...data, garments, outfits, wearLogs }
}

export function applyGarmentRemoval(
  data: AppData,
  id: string,
  plan: GarmentRemovalPlan[],
): AppData {
  return applyGarmentRemovals(data, [{ id, plan }])
}
