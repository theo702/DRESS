import { SCORE, currentSeason } from '../config/dress'
import { OutfitPreview } from '../components/OutfitPreview'
import { diagnoseMissing, suggestOutfits } from '../engine/suggestOutfits'
import { canonicalGarmentKey } from '../lib/dates'
import { useMemo, useState } from 'react'
import { useStore } from '../state/Store'

export function TodayScreen() {
  const { garments, outfits, wearLogs, tags, saveOutfit, logWear } = useStore()
  const [flash, setFlash] = useState<string | null>(null)
  const season = currentSeason()
  const now = useMemo(() => new Date(), [])

  const suggestions = useMemo(
    () => suggestOutfits(garments, outfits, wearLogs, { season, now, limit: 3 }),
    [garments, outfits, wearLogs, season, now],
  )
  const gaps = useMemo(() => diagnoseMissing(garments, season), [garments, season])

  function wearThis(garmentIds: string[], score: number, warnings: string[]) {
    const key = canonicalGarmentKey(garmentIds)
    const existing = outfits.find((o) => canonicalGarmentKey(o.garmentIds) === key)
    const seasonTag = tags.find((t) => t.label === season)
    const outfit =
      existing ??
      saveOutfit({
        garmentIds,
        score,
        warnings,
        tagIds: seasonTag ? [seasonTag.id] : [],
      })
    logWear(outfit.id)
    setFlash('Noté. Cette tenue est loguée pour aujourd’hui.')
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="page-title">Aujourd’hui</h1>
        <p className="text-xs text-muted">
          Trois tenues, score ≥ {SCORE.todayMin}, saison « {season} », pas portées depuis {SCORE.staleDays} jours.
        </p>
      </header>

      {flash && <p className="card px-4 py-2.5 text-sm">{flash}</p>}

      {suggestions.length === 0 && (
        <div className="card px-4 py-6 text-sm">
          <p>Pas assez de candidates. Voici ce qui bloque :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {gaps.length > 0 ? (
              gaps.map((m) => <li key={m}>{m}</li>)
            ) : (
              <li>Les combinaisons valides ont déjà été portées récemment, ou le score reste sous 80.</li>
            )}
          </ul>
        </div>
      )}

      {suggestions.length > 0 && suggestions.length < 3 && (
        <div className="card px-4 py-3 text-sm">
          <p>
            Seulement {suggestions.length} tenue{suggestions.length > 1 ? 's' : ''} au-dessus du seuil.
            Pour en générer plus :
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {gaps.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {suggestions.map((s) => (
          <article key={s.key} className="space-y-2">
            <OutfitPreview garments={s.garments} evaluation={s.evaluation} />
            <button
              type="button"
              onClick={() =>
                wearThis(
                  s.garments.map((g) => g.id),
                  s.evaluation.score,
                  s.evaluation.warnings,
                )
              }
              className="btn btn-primary w-full focus-ring"
            >
              Je porte celle-ci
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
