import { useEffect, useState } from 'react'

export const ROUTES = [
  { id: 'atelier', label: 'Atelier', hash: '#/atelier' },
  { id: 'garde-robe', label: 'Mes vêtements', hash: '#/garde-robe' },
  { id: 'tenues', label: 'Mes tenues', hash: '#/tenues' },
  { id: 'aujourdhui', label: 'Aujourd’hui', hash: '#/aujourdhui' },
  { id: 'analyse', label: 'Analyse', hash: '#/analyse' },
] as const

export type RouteId = (typeof ROUTES)[number]['id']

function parseHash(): RouteId {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const match = ROUTES.find((r) => r.id === raw)
  return match?.id ?? 'atelier'
}

export function useRoute(): [RouteId, (id: RouteId) => void] {
  const [route, setRoute] = useState<RouteId>(parseHash)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) {
      window.location.hash = '#/atelier'
    }
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (id: RouteId) => {
    window.location.hash = `#/${id}`
  }

  return [route, navigate]
}
