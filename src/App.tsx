import { useRef } from 'react'
import { AnalysisScreen } from './screens/AnalysisScreen'
import { AtelierScreen } from './screens/AtelierScreen'
import { OutfitsScreen } from './screens/OutfitsScreen'
import { TodayScreen } from './screens/TodayScreen'
import { WardrobeScreen } from './screens/WardrobeScreen'
import { ROUTES, useRoute } from './lib/routes'
import { StoreProvider, useStore } from './state/Store'
import { cx } from './lib/cx'

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
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-between gap-2 px-3">
          <div className="flex items-center py-2 pr-3">
            <span className="text-sm font-semibold tracking-wide">DRESS</span>
            <span className="ml-2 hidden text-[11px] text-muted sm:inline">garde-robe</span>
          </div>
          <nav className="flex min-w-0 flex-1 overflow-x-auto" aria-label="Principal">
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
                  'shrink-0 border-b-2 px-3 py-3 text-sm focus-ring',
                  route === r.id
                    ? 'border-ink font-medium'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {r.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={exportData}
              className="border border-line px-2 py-1 text-xs focus-ring"
            >
              Export
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="border border-line px-2 py-1 text-xs focus-ring"
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
      <main id="contenu" className="mx-auto max-w-6xl px-3 py-4">
        {route === 'atelier' && <AtelierScreen />}
        {route === 'garde-robe' && <WardrobeScreen />}
        {route === 'tenues' && <OutfitsScreen />}
        {route === 'aujourdhui' && <TodayScreen />}
        {route === 'analyse' && <AnalysisScreen />}
      </main>
    </div>
  )
}
