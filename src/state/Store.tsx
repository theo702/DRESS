import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppData, Garment, GarmentRemovalPlan, Outfit, Tag } from '../domain/types'
import { sampleWardrobe } from '../data/sample'
import { uid } from '../lib/ids'
import { todayIso } from '../lib/dates'
import { evaluateOutfit } from '../engine/evaluateOutfit'
import {
  downloadText,
  exportJson,
  loadState,
  parseImport,
  saveState,
} from '../storage/store'

type OutfitInput = {
  id?: string
  name?: string
  garmentIds: string[]
  score: number
  warnings: string[]
  tagIds?: string[]
}

type StoreValue = {
  garments: Garment[]
  outfits: Outfit[]
  wearLogs: AppData['wearLogs']
  tags: Tag[]
  editingOutfitId: string | null
  upsertGarment: (garment: Garment) => void
  setArchived: (id: string, archived: boolean) => void
  removeGarment: (id: string, plan: GarmentRemovalPlan[]) => void
  saveOutfit: (input: OutfitInput) => Outfit
  updateOutfit: (outfit: Outfit) => void
  deleteOutfit: (id: string) => void
  logWear: (outfitId: string, date?: string) => void
  setOutfitTags: (outfitId: string, tagIds: string[]) => void
  addTag: (label: string) => Tag
  renameTag: (id: string, label: string) => void
  deleteTag: (id: string) => void
  startEditOutfit: (id: string) => void
  clearEditOutfit: () => void
  exportData: () => void
  importData: (raw: string) => void
  loadSample: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function rescore(outfit: Outfit, garments: Garment[]): Outfit {
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadState())
  const [editingOutfitId, setEditingOutfitId] = useState<string | null>(null)

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

  const removeGarment = useCallback((id: string, plan: GarmentRemovalPlan[]) => {
    setData((prev) => {
      let outfits = [...prev.outfits]
      let wearLogs = [...prev.wearLogs]
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
            .filter((gid): gid is string => Boolean(gid))
          return { ...o, garmentIds: nextIds }
        })
      }
      const garments = prev.garments.filter((g) => g.id !== id)
      outfits = outfits.map((o) => rescore(o, garments))
      return { ...prev, garments, outfits, wearLogs }
    })
  }, [])

  const saveOutfit = useCallback((input: OutfitInput) => {
    if (input.id) {
      const outfit: Outfit = {
        id: input.id,
        name: input.name,
        garmentIds: input.garmentIds,
        tagIds: input.tagIds ?? [],
        score: input.score,
        warnings: input.warnings,
        createdAt: Date.now(),
      }
      setData((prev) => {
        const existing = prev.outfits.find((o) => o.id === input.id)
        const merged: Outfit = {
          ...outfit,
          createdAt: existing?.createdAt ?? outfit.createdAt,
          tagIds: input.tagIds ?? existing?.tagIds ?? [],
        }
        return {
          ...prev,
          outfits: prev.outfits.map((o) => (o.id === merged.id ? merged : o)),
        }
      })
      return { ...outfit, tagIds: input.tagIds ?? [] }
    }
    const outfit: Outfit = {
      id: uid(),
      name: input.name,
      garmentIds: input.garmentIds,
      tagIds: input.tagIds ?? [],
      score: input.score,
      warnings: input.warnings,
      createdAt: Date.now(),
    }
    setData((prev) => ({ ...prev, outfits: [...prev.outfits, outfit] }))
    return outfit
  }, [])

  const updateOutfit = useCallback((outfit: Outfit) => {
    setData((prev) => ({
      ...prev,
      outfits: prev.outfits.map((o) => (o.id === outfit.id ? outfit : o)),
    }))
  }, [])

  const deleteOutfit = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      outfits: prev.outfits.filter((o) => o.id !== id),
      wearLogs: prev.wearLogs.filter((l) => l.outfitId !== id),
    }))
  }, [])

  const logWear = useCallback((outfitId: string, date = todayIso()) => {
    setData((prev) => ({
      ...prev,
      wearLogs: [...prev.wearLogs, { id: uid(), outfitId, date }],
    }))
  }, [])

  const setOutfitTags = useCallback((outfitId: string, tagIds: string[]) => {
    setData((prev) => ({
      ...prev,
      outfits: prev.outfits.map((o) => (o.id === outfitId ? { ...o, tagIds } : o)),
    }))
  }, [])

  const addTag = useCallback((label: string) => {
    const tag: Tag = { id: uid(), label: label.trim() }
    setData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    return tag
  }, [])

  const renameTag = useCallback((id: string, label: string) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === id ? { ...t, label: label.trim() } : t)),
    }))
  }, [])

  const deleteTag = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== id),
      outfits: prev.outfits.map((o) => ({
        ...o,
        tagIds: o.tagIds.filter((tid) => tid !== id),
      })),
    }))
  }, [])

  const exportData = useCallback(() => {
    downloadText(`dress-${todayIso()}.json`, exportJson(data))
  }, [data])

  const importData = useCallback((raw: string) => {
    setData(parseImport(raw))
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
      tags: data.tags,
      editingOutfitId,
      upsertGarment,
      setArchived,
      removeGarment,
      saveOutfit,
      updateOutfit,
      deleteOutfit,
      logWear,
      setOutfitTags,
      addTag,
      renameTag,
      deleteTag,
      startEditOutfit: setEditingOutfitId,
      clearEditOutfit: () => setEditingOutfitId(null),
      exportData,
      importData,
      loadSample,
    }),
    [
      data,
      editingOutfitId,
      upsertGarment,
      setArchived,
      removeGarment,
      saveOutfit,
      updateOutfit,
      deleteOutfit,
      logWear,
      setOutfitTags,
      addTag,
      renameTag,
      deleteTag,
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
