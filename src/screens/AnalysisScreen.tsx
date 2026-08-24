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
        <h1 className="text-lg font-semibold">Analyse</h1>
        <p className="text-xs text-muted">
          {active.length} pièce{active.length === 1 ? '' : 's'} · {outfits.length} tenue
          {outfits.length === 1 ? '' : 's'} · {wearLogs.length} portage
          {wearLogs.length === 1 ? '' : 's'}
        </p>
      </header>

      {active.length === 0 && (
        <p className="border border-line px-4 py-6 text-sm">Rien à analyser tant que la garde-robe est vide.</p>
      )}

      {active.length > 0 && (
        <>
          <section>
            <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">Répartition par couleur</h2>
            <ul className="space-y-1">
              {colors.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-3 w-3 shrink-0 border border-line"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="w-28 shrink-0 truncate">{c.label}</span>
                  <span className="h-3 flex-1 border border-line">
                    <span
                      className="block h-full"
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
            <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">Répartition par catégorie</h2>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0">{c.label}</span>
                  <span className="h-3 flex-1 border border-line bg-paper">
                    <span
                      className="block h-full bg-ink"
                      style={{ width: `${(c.count / maxCat) * 100}%`, opacity: 0.85 }}
                    />
                  </span>
                  <span className="w-6 text-right font-num text-xs tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">
              Pièces jamais portées
            </h2>
            {unused.length === 0 ? (
              <p className="text-sm text-muted">
                {outfits.length === 0
                  ? 'Aucune tenue portée pour l’instant — enregistre un portage pour alimenter ce tri.'
                  : 'Toutes les pièces actives sont passées dans au moins une tenue portée.'}
              </p>
            ) : (
              <ul className="divide-y divide-line border border-line">
                {unused.map((g) => (
                  <li key={g.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{g.name}</span>
                    <span className="text-xs text-muted">candidate au tri</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-[11px] uppercase tracking-wide text-muted">Trous de garde-robe</h2>
            {gaps.length === 0 ? (
              <p className="text-sm text-muted">Pas de trou structurel évident.</p>
            ) : (
              <ul className="space-y-2">
                {gaps.map((g) => (
                  <li key={g.id} className="border border-line px-3 py-2 text-sm leading-snug">
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
