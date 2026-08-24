import type { AppData } from '../domain/types'
import { DATA_VERSION, STORAGE_KEY } from '../config/dress'

const empty = (): AppData => ({
  version: DATA_VERSION,
  garments: [],
  outfits: [],
  wearLogs: [],
})

export function loadState(): AppData {
  if (typeof localStorage === 'undefined') return empty()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed || parsed.version !== DATA_VERSION) return empty()
    return {
      version: DATA_VERSION,
      garments: Array.isArray(parsed.garments) ? parsed.garments : [],
      outfits: Array.isArray(parsed.outfits) ? parsed.outfits : [],
      wearLogs: Array.isArray(parsed.wearLogs) ? parsed.wearLogs : [],
    }
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
  const parsed = JSON.parse(raw) as AppData
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Fichier invalide')
  }
  if (!Array.isArray(parsed.garments) || !Array.isArray(parsed.outfits) || !Array.isArray(parsed.wearLogs)) {
    throw new Error('JSON incomplet : garments, outfits et wearLogs sont requis.')
  }
  return {
    version: DATA_VERSION,
    garments: parsed.garments,
    outfits: parsed.outfits,
    wearLogs: parsed.wearLogs,
  }
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

