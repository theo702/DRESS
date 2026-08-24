import type { Garment, Outfit } from '../domain/types'
import { Modal } from './Modal'

const NAME_PREVIEW = 12

type Props = {
  garments: Garment[]
  outfits: Outfit[]
  onCancel: () => void
  onConfirm: () => void
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many
}

export function BulkDeleteDialog({ garments, outfits, onCancel, onConfirm }: Props) {
  const count = garments.length
  const preview = garments.slice(0, NAME_PREVIEW)
  const extra = count - preview.length
  const used = garments.filter((g) => outfits.some((o) => o.garmentIds.includes(g.id)))
  const affectedOutfits = outfits.filter((o) => garments.some((g) => o.garmentIds.includes(g.id)))

  return (
    <Modal
      title={`Supprimer ${count} ${plural(count, 'pièce', 'pièces')} ?`}
      onClose={onCancel}
    >
      <p className="mb-3 text-sm leading-snug">
        Gros tri définitif : {count} {plural(count, 'pièce sera retirée', 'pièces seront retirées')} de
        la garde-robe. Cette action ne se défait pas.
      </p>
      <ul className="mb-3 max-h-48 overflow-y-auto rounded-ui bg-fill px-3 py-2 text-xs">
        {preview.map((g) => (
          <li key={g.id} className="py-0.5">
            {g.name}
          </li>
        ))}
        {extra > 0 && (
          <li className="py-0.5 text-muted">
            … et {extra} {plural(extra, 'autre', 'autres')}
          </li>
        )}
      </ul>
      {used.length > 0 && (
        <p className="mb-3 text-sm leading-snug">
          {used.length} {plural(used.length, 'pièce est', 'pièces sont')} encore dans{' '}
          {affectedOutfits.length} {plural(affectedOutfits.length, 'tenue', 'tenues')}. Tu indiqueras
          ensuite un remplacement pour ne pas laisser de tenues cassées.
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn focus-ring">
          Annuler
        </button>
        <button type="button" onClick={onConfirm} className="btn btn-primary focus-ring">
          Supprimer {count} {plural(count, 'pièce', 'pièces')}
        </button>
      </div>
    </Modal>
  )
}
