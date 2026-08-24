import { useRef } from 'react'
import { AnalysisScreen } from './screens/AnalysisScreen'
import { AtelierScreen } from './screens/AtelierScreen'
import { OutfitsScreen } from './screens/OutfitsScreen'
import { TodayScreen } from './screens/TodayScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'
import { getColor } from './config/dress'
import { ROUTES, useRoute } from './lib/routes'
import { StoreProvider, useStore } from './state/Store'
import { cx } from './lib/cx'

const LOGO = [
  getColor('bleu-ciel')?.hex ?? '#A8C4D9',
  getColor('marine')?.hex ?? '#1F2D45',
  getColor('taupe')?.hex ?? '#8B8178',
] as const

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const [route, navigate] = useRoute()
  const { exportData, importData } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)

  async function onImport(file: File | undefined) {
    if (!file) return
    if (!window.confirm('Remplacer toutes les données locales par ce fichier ?')) return
    const text = await file.text()
    try {
      importData(text)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import impossible')
    }
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2.5 py-1 pr-2">
            <span className="flex h-7 w-5 flex-col overflow-hidden rounded-sm border border-line" aria-hidden>
              {LOGO.map((hex) => (
                <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
              ))}
            </span>
            <span className="text-[15px] font-semibold tracking-[0.18em]">DRESS</span>
          </div>
          <nav className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto py-1" aria-label="Principal">
            {ROUTES.map((r) => (
              <a
                key={r.id}
                href={r.hash}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(r.id)
                }}
                aria-current={route === r.id ? 'page' : undefined}
                className={cx(
                  'shrink-0 rounded-full px-3 py-1.5 text-sm focus-ring',
                  route === r.id
                    ? 'bg-ink text-paper'
                    : 'text-muted hover:bg-fill hover:text-ink',
                )}
              >
                {r.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={exportData} className="btn focus-ring">
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn focus-ring"
            >
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                void onImport(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-7">
        {route === 'atelier' && <AtelierScreen />}
        {route === 'garde-robe' && <WardrobeScreen />}
        {route === 'tenues' && <OutfitsScreen />}
        {route === 'aujourdhui' && <TodayScreen />}
        {route === 'analyse' && <AnalysisScreen />}
      </main>
    </div>
  )
}
