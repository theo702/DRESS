import { useMemo, useState } from 'react'
import { CATEGORY_LABELS } from '../config/dress'
import type { Garment, GarmentRemovalPlan, Outfit } from '../domain/types'
import { Modal } from './Modal'

type Props = {
  garment: Garment
  outfits: Outfit[]
  garments: Garment[]
  onCancel: () => void
  onConfirm: (plan: GarmentRemovalPlan[]) => void
}

type RowState = {
  mode: 'replace' | 'remove' | 'delete'
  replacementId: string
}

export function ReplaceGarmentDialog({ garment, outfits, garments, onCancel, onConfirm }: Props) {
  const alternatives = useMemo(
    () =>
      garments.filter(
        (g) => g.id !== garment.id && !g.archived && g.category === garment.category,
      ),
    [garments, garment],
  )

  const [rows, setRows] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {}
    for (const o of outfits) {
      init[o.id] = { mode: alternatives[0] ? 'replace' : 'remove', replacementId: alternatives[0]?.id ?? '' }
    }
    return init
  })

  const incomplete = outfits.some((o) => {
    const row = rows[o.id]
    return row?.mode === 'replace' && !row.replacementId
  })

  function submit() {
    if (incomplete) return
    const plan: GarmentRemovalPlan[] = outfits.map((o) => {
      const row = rows[o.id]
      if (row?.mode === 'delete') {
        return { outfitId: o.id, replacementId: null, deleteOutfit: true }
      }
      if (row?.mode === 'replace') {
        return { outfitId: o.id, replacementId: row.replacementId, deleteOutfit: false }
      }
      return { outfitId: o.id, replacementId: null, deleteOutfit: false }
    })
    onConfirm(plan)
  }

  return (
    <Modal title={`Remplacer « ${garment.name} » dans les tenues`} onClose={onCancel}>
      <p className="mb-3 text-sm leading-snug">
        Cette pièce est dans {outfits.length} tenue{outfits.length > 1 ? 's' : ''}. Choisis un
        remplaçant du même type ({CATEGORY_LABELS[garment.category]?.toLowerCase()}) pour ne pas
        laisser de tenues cassées.
      </p>
      {alternatives.length === 0 && (
        <p className="mb-3 border border-line px-2 py-2 text-xs">
          Aucune autre pièce {CATEGORY_LABELS[garment.category]?.toLowerCase()} en stock. Tu peux
          retirer la pièce de la tenue ou supprimer la tenue.
        </p>
      )}
      <ul className="space-y-3">
        {outfits.map((o) => {
          const row = rows[o.id]
          const title = o.name?.trim() || `Tenue du ${new Date(o.createdAt).toLocaleDateString('fr-FR')}`
          return (
            <li key={o.id} className="border border-line p-2 text-sm">
              <p className="mb-2 font-medium">{title}</p>
              <div className="space-y-1 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`mode-${o.id}`}
                    checked={row?.mode === 'replace'}
                    disabled={alternatives.length === 0}
                    onChange={() =>
                      setRows((prev) => ({
                        ...prev,
                        [o.id]: {
                          mode: 'replace',
                          replacementId: prev[o.id]?.replacementId || alternatives[0]?.id || '',
                        },
                      }))
                    }
                  />
                  Remplacer par
                  <select
                    disabled={row?.mode !== 'replace'}
                    value={row?.replacementId ?? ''}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [o.id]: { mode: 'replace', replacementId: e.target.value },
                      }))
                    }
                    className="flex-1 border border-line bg-paper px-1 py-0.5 focus-ring"
                  >
                    {alternatives.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`mode-${o.id}`}
                    checked={row?.mode === 'remove'}
                    onChange={() =>
                      setRows((prev) => ({
                        ...prev,
                        [o.id]: { mode: 'remove', replacementId: '' },
                      }))
                    }
                  />
                  Retirer la pièce de cette tenue
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`mode-${o.id}`}
                    checked={row?.mode === 'delete'}
                    onChange={() =>
                      setRows((prev) => ({
                        ...prev,
                        [o.id]: { mode: 'delete', replacementId: '' },
                      }))
                    }
                  />
                  Supprimer toute la tenue
                </label>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="border border-line px-3 py-1.5 text-sm focus-ring">
          Annuler
        </button>
        <button
          type="button"
          disabled={incomplete}
          onClick={submit}
          className="border border-ink bg-ink px-3 py-1.5 text-sm text-paper focus-ring disabled:opacity-40"
        >
          Confirmer la suppression
        </button>
      </div>
    </Modal>
  )
}
