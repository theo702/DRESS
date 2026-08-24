import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Garment, Outfit, WearLog } from '../domain/types'
import { sampleWardrobe } from '../data/sample'
import { uid } from '../lib/ids'
import { todayIso } from '../lib/dates'
import {
  downloadText,
  exportJson,
  loadState,
  parseImport,
  saveState,
} from '../storage/store'

type StoreValue = {
  garments: Garment[]
  outfits: Outfit[]
  wearLogs: WearLog[]
  upsertGarment: (garment: Garment) => void
  setArchived: (id: string, archived: boolean) => void
  saveOutfit: (input: { name?: string; garmentIds: string[]; score: number; warnings: string[] }) => Outfit
  logWear: (outfitId: string, date?: string) => void
  exportData: () => void
  importData: (raw: string) => void
  loadSample: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadState())

  useEffect(() => {
    saveState(data)
  }, [data])

  const upsertGarment = useCallback((garment: Garment) => {
    setData((prev) => {
      const i = prev.garments.findIndex((g) => g.id === garment.id)
      const garments = [...prev.garments]
      if (i === -1) garments.push(garment)
      else garments[i] = garment
      return { ...prev, garments }
    })
  }, [])

  const setArchived = useCallback((id: string, archived: boolean) => {
    setData((prev) => ({
      ...prev,
      garments: prev.garments.map((g) => (g.id === id ? { ...g, archived } : g)),
    }))
  }, [])

  const saveOutfit = useCallback(
    (input: { name?: string; garmentIds: string[]; score: number; warnings: string[] }) => {
      const outfit: Outfit = {
        id: uid(),
        name: input.name,
        garmentIds: input.garmentIds,
        score: input.score,
        warnings: input.warnings,
        createdAt: Date.now(),
      }
      setData((prev) => ({ ...prev, outfits: [...prev.outfits, outfit] }))
      return outfit
    },
    [],
  )

  const logWear = useCallback((outfitId: string, date = todayIso()) => {
    const log: WearLog = { id: uid(), outfitId, date }
    setData((prev) => ({ ...prev, wearLogs: [...prev.wearLogs, log] }))
  }, [])

  const exportData = useCallback(() => {
    const stamp = todayIso()
    downloadText(`dress-${stamp}.json`, exportJson(data))
  }, [data])

  const importData = useCallback((raw: string) => {
    const next = parseImport(raw)
    setData(next)
  }, [])

  const loadSample = useCallback(() => {
    setData((prev) => ({
      ...prev,
      garments: prev.garments.length === 0 ? sampleWardrobe() : prev.garments,
    }))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      garments: data.garments,
      outfits: data.outfits,
      wearLogs: data.wearLogs,
      upsertGarment,
      setArchived,
      saveOutfit,
      logWear,
      exportData,
      importData,
      loadSample,
    }),
    [
      data.garments,
      data.outfits,
      data.wearLogs,
      upsertGarment,
      setArchived,
      saveOutfit,
      logWear,
      exportData,
      importData,
      loadSample,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore hors StoreProvider')
  return ctx
}
