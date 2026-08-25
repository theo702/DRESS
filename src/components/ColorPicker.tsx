import { PALETTE } from '../config/dress'
import { cx } from '../lib/cx'

type Props = {
  value: string
  onChange: (id: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  return (
    <div role="listbox" aria-label="Couleur" className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
      {PALETTE.map((color) => {
        const selected = value === color.id
        const forbidden = !color.allowed
        const hint = forbidden
          ? (color.pickerHint ?? 'Couleur interdite près du visage.')
          : color.label
        return (
          <button
            key={color.id}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={`${color.label}${forbidden ? ` — ${hint}` : ''}`}
            title={hint}
            onClick={() => onChange(color.id)}
            className={cx(
              'relative min-h-11 w-full overflow-hidden rounded-md border border-line focus-ring',
              selected && 'is-selected',
            )}
            style={{ backgroundColor: color.hex }}
          >
            {forbidden && (
              <span aria-hidden className="pointer-events-none absolute inset-0">
                <svg viewBox="0 0 32 32" className="h-full w-full">
                  <line x1="2" y1="30" x2="30" y2="2" stroke="#1F2D45" strokeWidth="1.5" />
                </svg>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function ColorDot({ colorId, size = 14 }: { colorId: string; size?: number }) {
  const color = PALETTE.find((c) => c.id === colorId)
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-line"
      style={{
        width: size,
        height: size,
        backgroundColor: color?.hex ?? '#ccc',
      }}
      title={color?.label}
      aria-hidden
    />
  )
}
