import { CATEGORY_LABELS, FORMALITY_LABELS, MOMENT_LABELS, getColor } from '../config/dress'
import type { Garment } from '../domain/types'
import { cx } from '../lib/cx'
import { ColorDot } from './ColorPicker'

type Props = {
  garment: Garment
  selected?: boolean
  selecting?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onArchive?: () => void
  onDelete?: () => void
  compact?: boolean
}

export function GarmentCard({
  garment,
  selected,
  selecting,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
  compact,
}: Props) {
  const color = getColor(garment.color)
  const interactive = Boolean(onSelect)
  const isFragrance = garment.category === 'fragrance'
  const momentLabel = (garment.moments ?? ['journée', 'soirée'])
    .map((m) => MOMENT_LABELS[m] ?? m)
    .join(', ')
  const usage = isFragrance
    ? `${garment.season.join(', ')} · ${momentLabel}`
    : `${garment.season.join(', ')} · ${FORMALITY_LABELS[garment.formality]}`
  const summary = `${garment.name}, ${CATEGORY_LABELS[garment.category]}, ${isFragrance ? usage : (color?.label ?? garment.color)}`

  const media = (
    <>
      <div
        className={cx('relative w-full overflow-hidden', compact ? 'h-20' : 'h-36')}
        style={{ backgroundColor: isFragrance ? undefined : (color?.hex ?? '#ddd') }}
      >
        {isFragrance && !garment.photoDataUrl && (
          <span className="flex h-full items-center justify-center bg-fill text-[11px] uppercase tracking-[0.14em] text-muted">
            Parfum
          </span>
        )}
        {garment.photoDataUrl && (
          <img src={garment.photoDataUrl} alt="" className="h-full w-full object-cover" />
        )}
        {!isFragrance && (
          <span className="absolute bottom-2 left-2">
            <ColorDot colorId={garment.color} size={14} />
          </span>
        )}
        {!isFragrance && !color?.allowed && (
          <span className="absolute right-2 top-2 rounded-full border border-line bg-paper-2 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink">
            interdite
          </span>
        )}
      </div>
      <div className="space-y-0.5 px-2.5 py-2">
        <p className="truncate text-[13px] font-medium leading-tight">{garment.name}</p>
        <p className="truncate text-[11px] text-muted">
          {garment.subcategory}
          {garment.brand ? ` · ${garment.brand}` : ''}
          {garment.size ? ` · ${garment.size}` : ''}
          {isFragrance ? ` · ${momentLabel}` : ''}
        </p>
        {!compact && <p className="truncate text-[11px] text-muted">{usage}</p>}
      </div>
    </>
  )

  return (
    <article
      className={cx(
        'card flex flex-col',
        selected && 'is-selected',
        garment.archived && 'opacity-50',
      )}
    >
      {selecting ? (
        <label className="relative block w-full cursor-pointer text-left">
          <span className="absolute left-2 top-2 z-10 flex items-center">
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={onSelect}
              className="h-4 w-4 accent-ink focus-ring"
              aria-label={`Sélectionner ${garment.name}`}
            />
          </span>
          <span className="sr-only">{summary}</span>
          {media}
        </label>
      ) : (
        <button
          type="button"
          disabled={!interactive}
          onClick={onSelect}
          className={cx(
            'relative block w-full text-left focus-ring',
            interactive ? 'cursor-pointer' : 'cursor-default',
          )}
          aria-pressed={interactive ? selected : undefined}
          aria-label={summary}
        >
          {media}
        </button>
      )}
      {(onEdit || onArchive || onDelete) && (
        <div className="flex border-t border-line bg-fill/40 text-[11px]">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-1 px-2.5 py-1.5 text-left text-muted hover:bg-fill hover:text-ink focus-ring"
            >
              Modifier
            </button>
          )}
          {onArchive && (
            <button
              type="button"
              onClick={onArchive}
              className="px-2.5 py-1.5 text-muted hover:bg-fill hover:text-ink focus-ring"
            >
              {garment.archived ? 'Désarchiver' : 'Archiver'}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-2.5 py-1.5 text-muted hover:bg-fill hover:text-ink focus-ring"
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </article>
  )
}
