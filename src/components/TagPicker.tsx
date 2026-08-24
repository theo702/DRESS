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
              'chip focus-ring',
              on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-2 text-ink hover:bg-fill',
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
    <div className="card p-4">
      <h2 className="kicker mb-2">Tags</h2>
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
                  className="field min-w-0 flex-1 focus-ring"
                />
                <button
                  type="button"
                  className="btn text-xs focus-ring"
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
                  className="text-xs text-muted hover:text-ink focus-ring"
                  onClick={() => {
                    setEditingId(t.id)
                    setEditLabel(t.label)
                  }}
                >
                  Renommer
                </button>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-ink focus-ring"
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
          className="field min-w-0 flex-1 focus-ring"
        />
        <button type="submit" className="btn focus-ring">
          Ajouter
        </button>
      </form>
    </div>
  )
}
