import { useState } from 'react'
import type { Tag } from '../domain/types'
import { cx } from '../lib/cx'

type PickerProps = {
  tags: Tag[]
  selected: string[]
  onChange: (ids: string[]) => void
}

export function TagPicker({ tags, selected, onChange }: PickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => {
        const on = selected.includes(t.id)
        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? selected.filter((id) => id !== t.id) : [...selected, t.id])
            }
            className={cx(
              'border px-2 py-0.5 text-xs focus-ring',
              on ? 'border-ink bg-ink text-paper' : 'border-line text-ink',
            )}
          >
            {t.label}
          </button>
        )
      })}
      {tags.length === 0 && <span className="text-xs text-muted">Aucun tag. Crée-en dans Mes tenues.</span>}
    </div>
  )
}

type ManagerProps = {
  tags: Tag[]
  onAdd: (label: string) => void
  onRename: (id: string, label: string) => void
  onDelete: (id: string) => void
}

export function TagManager({ tags, onAdd, onRename, onDelete }: ManagerProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  return (
    <div className="border border-line p-3">
      <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">Tags</h2>
      <p className="mb-2 text-xs text-muted">
        Été, hiver, pluie, soirée, bureau… Ajoute, renomme ou supprime. Une tenue sans tag est
        signalée.
      </p>
      <ul className="space-y-1">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            {editingId === t.id ? (
              <>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="flex-1 border border-line bg-paper px-2 py-1 text-sm focus-ring"
                />
                <button
                  type="button"
                  className="text-xs focus-ring"
                  onClick={() => {
                    if (editLabel.trim()) onRename(t.id, editLabel.trim())
                    setEditingId(null)
                  }}
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <span className="flex-1">{t.label}</span>
                <button
                  type="button"
                  className="text-xs text-muted focus-ring"
                  onClick={() => {
                    setEditingId(t.id)
                    setEditLabel(t.label)
                  }}
                >
                  Renommer
                </button>
                <button
                  type="button"
                  className="text-xs text-muted focus-ring"
                  onClick={() => {
                    if (window.confirm(`Supprimer le tag « ${t.label} » ?`)) onDelete(t.id)
                  }}
                >
                  Supprimer
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          onAdd(draft.trim())
          setDraft('')
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nouveau tag"
          className="flex-1 border border-line bg-paper px-2 py-1 text-sm focus-ring"
        />
        <button type="submit" className="border border-line px-2 py-1 text-xs focus-ring">
          Ajouter
        </button>
      </form>
    </div>
  )
}
