import { CATEGORY_LABELS, FORMALITY_LABELS, getColor } from '../config/dress'
import type { Garment } from '../domain/types'
import { cx } from '../lib/cx'
import { ColorDot } from './ColorPicker'

type Props = {
  garment: Garment
  selected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function GarmentCard({
  garment,
  selected,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
  compact,
}: Props) {
  const color = getColor(garment.color)
  const interactive = Boolean(onSelect)

  return (
    <article
      className={cx(
        'flex flex-col border border-line bg-paper',
        selected && 'ring-2 ring-ink ring-offset-1 ring-offset-paper',
        garment.archived && 'opacity-50',
      )}
    >
      <button
        type="button"
        disabled={!interactive}
        onClick={onSelect}
        className={cx(
          'relative block w-full text-left focus-ring',
          interactive ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-pressed={interactive ? selected : undefined}
        aria-label={`${garment.name}, ${CATEGORY_LABELS[garment.category]}, ${color?.label ?? garment.color}`}
      >
        <div
          className={cx('relative w-full overflow-hidden', compact ? 'h-16' : 'h-28')}
          style={{ backgroundColor: color?.hex ?? '#ddd' }}
        >
          {garment.photoDataUrl && (
            <img
              src={garment.photoDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          <span className="absolute bottom-1 left-1">
            <ColorDot colorId={garment.color} size={12} />
          </span>
          {!color?.allowed && (
            <span className="absolute right-1 top-1 border border-line bg-paper px-1 text-[10px] uppercase tracking-wide text-ink">
              interdite
            </span>
          )}
        </div>
        <div className="space-y-0.5 px-2 py-1.5">
          <p className="truncate text-[13px] font-medium leading-tight">{garment.name}</p>
          <p className="truncate text-[11px] text-muted">
            {garment.subcategory}
            {garment.brand ? ` · ${garment.brand}` : ''}
            {garment.size ? ` · ${garment.size}` : ''}
          </p>
          {!compact && (
            <p className="truncate text-[11px] text-muted">
              {garment.season.join(', ')}
              {` · ${FORMALITY_LABELS[garment.formality]}`}
            </p>
          )}
        </div>
      </button>
      {(onEdit || onArchive || onDelete) && (
        <div className="flex border-t border-line text-[11px]">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 px-2 py-1 text-left text-muted hover:text-ink focus-ring"
            >
              Modifier
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="px-2 py-1 text-muted hover:text-ink focus-ring"
            >
              {garment.archived ? 'Désarchiver' : 'Archiver'}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-2 py-1 text-muted hover:text-ink focus-ring"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </article>
  )
}
