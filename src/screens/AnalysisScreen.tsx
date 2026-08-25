import {
  categoryDistribution,
  colorDistribution,
  neverWornGarments,
  wardrobeGaps,
} from '../engine/analyzeWardrobe'
import { useStore } from '../state/Store'

export function AnalysisScreen() {
  const { garments, outfits, wearLogs } = useStore()
  const colors = colorDistribution(garments)
  const categories = categoryDistribution(garments)
  const unused = neverWornGarments(garments, outfits, wearLogs)
  const gaps = wardrobeGaps(garments)
  const active = garments.filter((g) => !g.archived)
  const maxColor = Math.max(1, ...colors.map((c) => c.count))
  const maxCat = Math.max(1, ...categories.map((c) => c.count))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="page-title">Analyse</h1>
        <p className="text-xs text-muted">
          {active.length} pièce{active.length === 1 ? '' : 's'} · {outfits.length} tenue
          {outfits.length === 1 ? '' : 's'} · {wearLogs.length} portage
          {wearLogs.length === 1 ? '' : 's'}
        </p>
      </header>

      {active.length === 0 && (
        <p className="card px-4 py-6 text-sm">Rien à analyser tant que la garde-robe est vide.</p>
      )}

      {active.length > 0 && (
        <>
          <section>
            <h2 className="kicker mb-3">Répartition par couleur</h2>
            <ul className="card space-y-2 p-4">
              {colors.map((c) => (
                <li key={c.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full border border-line"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="w-20 shrink-0 truncate sm:w-28">{c.label}</span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-fill">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${(c.count / maxColor) * 100}%`,
                        backgroundColor: c.hex,
                      }}
                    />
                  </span>
                  <span className="w-6 text-right font-num text-xs tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="kicker mb-3">Répartition par catégorie</h2>
            <ul className="card space-y-2 p-4">
              {categories.map((c) => (
                <li key={c.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <span className="w-20 shrink-0 sm:w-28">{c.label}</span>
                  <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-fill">
                    <span
                      className="block h-full rounded-full bg-ink"
                      style={{ width: `${(c.count / maxCat) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-num text-xs tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="kicker mb-3">
              Pièces jamais portées
            </h2>
            {unused.length === 0 ? (
              <p className="text-sm text-muted">
                {outfits.length === 0
                  ? 'Aucune tenue portée pour l’instant — enregistre un portage pour alimenter ce tri.'
                  : 'Toutes les pièces actives sont passées dans au moins une tenue portée.'}
              </p>
            ) : (
              <ul className="card divide-y divide-line">
                {unused.map((g) => (
                  <li key={g.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-3 text-sm">
                    <span className="min-w-0 truncate">{g.name}</span>
                    <span className="shrink-0 text-xs text-muted">candidate au tri</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="kicker mb-3">Trous de garde-robe</h2>
            {gaps.length === 0 ? (
              <p className="text-sm text-muted">Pas de trou structurel évident.</p>
            ) : (
              <ul className="space-y-2">
                {gaps.map((g) => (
                  <li key={g.id} className="card px-4 py-2.5 text-sm leading-snug">
                    {g.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
