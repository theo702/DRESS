import { describe, expect, it } from 'vitest'
import type { AppData, Category, Formality, Garment, Outfit, Season, WearLog } from '../domain/types'
import { applyGarmentRemoval, applyGarmentRemovals } from './store'

function garment(
  partial: Partial<Garment> & { id: string; category: Category; color: string },
): Garment {
  return {
    name: partial.name ?? partial.id,
    subcategory: partial.subcategory ?? 'tee',
    season: partial.season ?? (['été', 'mi-saison', 'hiver'] as Season[]),
    formality: (partial.formality ?? 2) as Formality,
    archived: partial.archived ?? false,
    createdAt: partial.createdAt ?? 0,
    moments: partial.moments ?? ['journée', 'soirée'],
    ...partial,
  }
}

function outfit(partial: Partial<Outfit> & { id: string; garmentIds: string[] }): Outfit {
  return {
    tagIds: [],
    score: 70,
    warnings: [],
    createdAt: 1,
    ...partial,
  }
}

function data(over: Partial<AppData> = {}): AppData {
  return {
    version: 3,
    garments: [],
    outfits: [],
    wearLogs: [],
    tags: [],
    ...over,
  }
}

const tee = garment({ id: 'tee', category: 'top', color: 'ecru', name: 'Tee écru' })
const tee2 = garment({ id: 'tee-2', category: 'top', color: 'blanc-casse', name: 'Tee blanc' })
const chino = garment({ id: 'chino', category: 'bottom', color: 'taupe', name: 'Chino' })
const baskets = garment({ id: 'baskets', category: 'shoes', color: 'blanc-casse', name: 'Baskets' })
const pull = garment({ id: 'pull', category: 'layer', color: 'marine', name: 'Pull' })

const look: Outfit = outfit({
  id: 'look-1',
  name: 'Bureau',
  garmentIds: [tee.id, chino.id, baskets.id],
})

const wear: WearLog = { id: 'w1', outfitId: look.id, date: '2026-08-01' }

describe('applyGarmentRemoval', () => {
  it('retire une pièce inutilisée sans toucher aux tenues', () => {
    const next = applyGarmentRemoval(
      data({ garments: [tee, chino, baskets, pull], outfits: [look] }),
      pull.id,
      [],
    )
    expect(next.garments.map((g) => g.id)).toEqual(['tee', 'chino', 'baskets'])
    expect(next.outfits[0]?.garmentIds).toEqual([tee.id, chino.id, baskets.id])
  })

  it('remplace la pièce dans la tenue et conserve le journal de port', () => {
    const next = applyGarmentRemoval(
      data({ garments: [tee, tee2, chino, baskets], outfits: [look], wearLogs: [wear] }),
      tee.id,
      [{ outfitId: look.id, replacementId: tee2.id, deleteOutfit: false }],
    )
    expect(next.garments.map((g) => g.id)).not.toContain('tee')
    expect(next.outfits).toHaveLength(1)
    expect(next.outfits[0]?.garmentIds).toContain(tee2.id)
    expect(next.outfits[0]?.garmentIds).not.toContain(tee.id)
    expect(next.wearLogs).toEqual([wear])
  })

  it('retire la pièce de la tenue sans la supprimer', () => {
    const next = applyGarmentRemoval(
      data({ garments: [tee, chino, baskets], outfits: [look], wearLogs: [wear] }),
      tee.id,
      [{ outfitId: look.id, replacementId: null, deleteOutfit: false }],
    )
    expect(next.outfits[0]?.garmentIds).toEqual([chino.id, baskets.id])
    expect(next.wearLogs).toEqual([wear])
  })

  it('supprime la tenue et ses ports si demandé', () => {
    const next = applyGarmentRemoval(
      data({ garments: [tee, chino, baskets], outfits: [look], wearLogs: [wear] }),
      tee.id,
      [{ outfitId: look.id, replacementId: null, deleteOutfit: true }],
    )
    expect(next.outfits).toEqual([])
    expect(next.wearLogs).toEqual([])
    expect(next.garments.map((g) => g.id)).toEqual(['chino', 'baskets'])
  })
})

describe('applyGarmentRemovals', () => {
  it('supprime plusieurs pièces hors tenues en une fois', () => {
    const extra = garment({ id: 'polo', category: 'top', color: 'sauge', name: 'Polo' })
    const next = applyGarmentRemovals(
      data({ garments: [tee, chino, extra], outfits: [] }),
      [
        { id: extra.id, plan: [] },
        { id: chino.id, plan: [] },
      ],
    )
    expect(next.garments.map((g) => g.id)).toEqual(['tee'])
  })

  it('nettoie les tenues qui référencent les pièces supprimées (gros tri)', () => {
    const look2 = outfit({
      id: 'look-2',
      name: 'Week-end',
      garmentIds: [tee.id, chino.id],
    })
    const next = applyGarmentRemovals(
      data({
        garments: [tee, chino, baskets, pull],
        outfits: [look, look2],
        wearLogs: [wear, { id: 'w2', outfitId: look2.id, date: '2026-08-02' }],
      }),
      [
        { id: tee.id, plan: [] },
        { id: chino.id, plan: [] },
      ],
    )
    expect(next.garments.map((g) => g.id).sort()).toEqual(['baskets', 'pull'])
    expect(next.outfits[0]?.garmentIds).toEqual([baskets.id])
    expect(next.outfits[1]?.garmentIds).toEqual([])
    expect(next.outfits.every((o) => o.garmentIds.every((id) => !['tee', 'chino'].includes(id)))).toBe(
      true,
    )
    expect(next.wearLogs).toHaveLength(2)
  })

  it('applique un plan mixte : remplacer une pièce, supprimer une tenue', () => {
    const look2 = outfit({
      id: 'look-2',
      garmentIds: [tee.id, pull.id],
    })
    const next = applyGarmentRemovals(
      data({
        garments: [tee, tee2, chino, baskets, pull],
        outfits: [look, look2],
        wearLogs: [wear, { id: 'w2', outfitId: look2.id, date: '2026-08-02' }],
      }),
      [
        {
          id: tee.id,
          plan: [{ outfitId: look.id, replacementId: tee2.id, deleteOutfit: false }],
        },
        {
          id: pull.id,
          plan: [{ outfitId: look2.id, replacementId: null, deleteOutfit: true }],
        },
      ],
    )
    expect(next.garments.map((g) => g.id)).not.toContain('tee')
    expect(next.garments.map((g) => g.id)).not.toContain('pull')
    expect(next.outfits.map((o) => o.id)).toEqual(['look-1'])
    expect(next.outfits[0]?.garmentIds).toContain(tee2.id)
    expect(next.outfits[0]?.garmentIds).not.toContain(tee.id)
    expect(next.wearLogs.map((l) => l.id)).toEqual(['w1'])
  })

  it('n’utilise pas comme remplaçant une pièce aussi marquée à supprimer', () => {
    const next = applyGarmentRemovals(
      data({ garments: [tee, tee2, chino, baskets], outfits: [look] }),
      [
        {
          id: tee.id,
          plan: [{ outfitId: look.id, replacementId: tee2.id, deleteOutfit: false }],
        },
        { id: tee2.id, plan: [] },
      ],
    )
    expect(next.outfits[0]?.garmentIds).not.toContain(tee.id)
    expect(next.outfits[0]?.garmentIds).not.toContain(tee2.id)
    expect(next.outfits[0]?.garmentIds).toEqual([chino.id, baskets.id])
  })
})
