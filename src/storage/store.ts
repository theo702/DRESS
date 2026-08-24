import type { AppData, Garment, Moment, Outfit, Tag } from '../domain/types'
import { ALL_MOMENTS, DATA_VERSION, DEFAULT_TAGS, STORAGE_KEY } from '../config/dress'

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
