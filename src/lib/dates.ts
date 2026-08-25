import { SCORE } from '../config/dress'

export function todayIso(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function daysBetween(isoDate: string, now = new Date()): number {
  const then = new Date(`${isoDate}T00:00:00`)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((start.getTime() - then.getTime()) / 86_400_000)
}

export function lastWornLabel(isoDate: string | undefined, now = new Date()): string {
  if (!isoDate) return 'jamais portée'
  const days = daysBetween(isoDate, now)
  if (days <= 0) return 'portée aujourd’hui'
  if (days === 1) return 'portée hier'
  return `portée il y a ${days} jours`
}

export function isStale(isoDate: string | undefined, now = new Date()): boolean {
  if (!isoDate) return true
  return daysBetween(isoDate, now) >= SCORE.staleDays
}

export function canonicalGarmentKey(ids: string[]): string {
  return [...ids].sort().join('|')
}
