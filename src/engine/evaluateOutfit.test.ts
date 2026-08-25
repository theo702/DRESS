import { describe, expect, it } from 'vitest'
import { RULES, SCORE, getColor } from '../config/dress'
import type { Category, Formality, Garment, Season } from '../domain/types'
import {
  evaluateOutfit,
  fragranceMatches,
  placeGarment,
  ruleB1,
  ruleB2,
  ruleB3,
  ruleB4,
  ruleR1,
  ruleR10,
  ruleR2,
  ruleR3,
  ruleR4,
  ruleR5,
  ruleR6,
  ruleR7,
  ruleR8,
  ruleR9,
} from './evaluateOutfit'
import { diagnoseMissing, suggestOutfits } from './suggestOutfits'
import { wardrobeGaps } from './analyzeWardrobe'

type Colored = Parameters<typeof ruleR1>[0][number]

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
    material: partial.material,
    photoDataUrl: partial.photoDataUrl,
    moments: partial.moments ?? (['journée', 'soirée'] as Garment['moments']),
    ...partial,
  }
}

function colored(g: Garment): Colored {
  const colorDef = getColor(g.color)
  if (!colorDef) throw new Error(`unknown color ${g.color}`)
  return { ...g, colorDef }
}

const taupeChino = garment({
  id: 'chino-taupe',
  category: 'bottom',
  color: 'taupe',
  material: 'coton',
  subcategory: 'chino',
})
const ecruTee = garment({
  id: 'tee-ecru',
  category: 'top',
  color: 'ecru',
  material: 'coton',
  subcategory: 'tee',
})
const marinePull = garment({
  id: 'pull-marine',
  category: 'layer',
  color: 'marine',
  material: 'maille',
  subcategory: 'pull',
})
const cielShirt = garment({
  id: 'chemise-ciel',
  category: 'top',
  color: 'bleu-ciel',
  material: 'oxford',
  subcategory: 'chemise',
})
const baskets = garment({
  id: 'baskets',
  category: 'shoes',
  color: 'blanc-casse',
  material: 'cuir',
  subcategory: 'baskets',
  formality: 1,
})

describe('evaluateOutfit — règles bloquantes', () => {
  it('R1 : couleur NOT safe en position haute (top)', () => {
    const blackTee = garment({ id: 'tee-noir', category: 'top', color: 'noir', material: 'coton' })
    const hits = ruleR1([blackTee, taupeChino].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R1')
    expect(hits[0]?.delta).toBe(RULES.R1.delta)
    expect(hits[0]?.message).toMatch(/noir/i)

    const eval_ = evaluateOutfit([blackTee, taupeChino])
    expect(eval_.isBlocking).toBe(true)
    expect(eval_.warnings.some((w) => w.includes('noir'))).toBe(true)
    expect(eval_.score).toBeLessThanOrEqual(SCORE.start + RULES.R1.delta)
  })

  it('R1 : layer camel près du visage', () => {
    const camelLayer = garment({
      id: 'veste-camel',
      category: 'layer',
      color: 'camel',
      material: 'laine',
    })
    const hits = ruleR1([ecruTee, camelLayer, taupeChino].map(colored))
    expect(hits.map((h) => h.id)).toContain('R1')
    expect(hits[0]?.message.toLowerCase()).toContain('camel')
  })

  it('R1 : chaussures noires ne déclenchent pas R1', () => {
    const blackShoes = garment({ id: 'boots-noir', category: 'shoes', color: 'noir', material: 'cuir' })
    expect(ruleR1([ecruTee, taupeChino, blackShoes].map(colored))).toHaveLength(0)
  })

  it('R2 : écart de lightness ≥ 4 entre haut et bas', () => {
    const marineTee = garment({ id: 'tee-marine', category: 'top', color: 'marine', material: 'coton' })
    const ecruChino = garment({
      id: 'chino-ecru',
      category: 'bottom',
      color: 'ecru',
      material: 'lin',
    })
    const hits = ruleR2([marineTee, ecruChino].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R2')
    expect(evaluateOutfit([marineTee, ecruChino]).isBlocking).toBe(true)
  })

  it('R2 : écart de 3 crans passe', () => {
    const marineTee = garment({ id: 'tee-marine', category: 'top', color: 'marine', material: 'coton' })
    const hits = ruleR2([marineTee, taupeChino].map(colored))
    expect(hits).toHaveLength(0)
  })

  it('R3 : blanc optique n’importe où', () => {
    const whiteShoes = garment({
      id: 'baskets-blanches',
      category: 'shoes',
      color: 'blanc-optique',
      material: 'cuir',
    })
    const hits = ruleR3([cielShirt, taupeChino, whiteShoes].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R3')
    expect(hits[0]?.message).toMatch(/blanc cassé/i)
    expect(evaluateOutfit([cielShirt, taupeChino, whiteShoes]).isBlocking).toBe(true)
  })
})

describe('evaluateOutfit — règles fortes', () => {
  it('R4 : layer plus claire que le top', () => {
    const anthraciteTee = garment({
      id: 'tee-anthra',
      category: 'top',
      color: 'anthracite',
      material: 'coton',
    })
    const perleCardigan = garment({
      id: 'cardigan-perle',
      category: 'layer',
      color: 'gris-perle',
      material: 'maille',
    })
    const hits = ruleR4([anthraciteTee, perleCardigan, taupeChino].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R4')
  })

  it('R4 : layer plus foncée ou égale passe', () => {
    expect(ruleR4([cielShirt, marinePull, taupeChino].map(colored))).toHaveLength(0)
  })

  it('R5 : plus de 2 familles non-neutres', () => {
    const saugePolo = garment({ id: 'polo-sauge', category: 'top', color: 'sauge', material: 'coton' })
    const bordeauxBelt = garment({
      id: 'ceinture-bord',
      category: 'accessory',
      color: 'bordeaux',
      material: 'cuir',
    })
    const denimJean = garment({
      id: 'jean-brut',
      category: 'bottom',
      color: 'denim-brut',
      material: 'denim',
    })
    const hits = ruleR5([saugePolo, denimJean, bordeauxBelt].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R5')
  })

  it('R5 : 2 familles non-neutres + neutres passe', () => {
    const saugePolo = garment({ id: 'polo-sauge', category: 'top', color: 'sauge', material: 'coton' })
    const denimJean = garment({
      id: 'jean',
      category: 'bottom',
      color: 'denim-clair',
      material: 'denim',
    })
    expect(ruleR5([saugePolo, denimJean, baskets].map(colored))).toHaveLength(0)
  })

  it('R6 : même couleur exacte ET même matière haut/bas', () => {
    const ecruShirt = garment({
      id: 'chemise-ecru',
      category: 'top',
      color: 'ecru',
      material: 'lin',
    })
    const ecruPants = garment({
      id: 'pantalon-ecru',
      category: 'bottom',
      color: 'ecru',
      material: 'lin',
    })
    const hits = ruleR6([ecruShirt, ecruPants].map(colored))
    expect(hits).toHaveLength(1)
    expect(hits[0]?.id).toBe('R6')
    expect(hits[0]?.message).toMatch(/pyjama/i)
  })
})

describe('evaluateOutfit — règles souples', () => {
  it('R7 : écart de formality > 1', () => {
    const tee = garment({
      id: 'tee',
      category: 'top',
      color: 'ecru',
      formality: 1,
      material: 'coton',
    })
    const wool = garment({
      id: 'pantalon',
      category: 'bottom',
      color: 'anthracite',
      formality: 3,
      material: 'laine',
    })
    expect(ruleR7([tee, wool].map(colored))).toHaveLength(1)
  })

  it('R7 : écart de 1 cran passe', () => {
    const tee = garment({
      id: 'tee',
      category: 'top',
      color: 'ecru',
      formality: 1,
      material: 'coton',
    })
    const chino = garment({
      id: 'chino',
      category: 'bottom',
      color: 'taupe',
      formality: 2,
      material: 'coton',
    })
    expect(ruleR7([tee, chino].map(colored))).toHaveLength(0)
  })

  it('R8 : deux bleus différents non-marine', () => {
    const jean = garment({
      id: 'jean-brut',
      category: 'bottom',
      color: 'denim-brut',
      material: 'denim',
    })
    expect(ruleR8([cielShirt, jean].map(colored))).toHaveLength(1)
  })

  it('R8 : marine + bleu ciel passe', () => {
    expect(ruleR8([cielShirt, marinePull, taupeChino].map(colored))).toHaveLength(0)
  })

  it('R9 : aucune pièce claire (tout L4–L5)', () => {
    const marineTee = garment({ id: 'tee-m', category: 'top', color: 'marine', material: 'coton' })
    const anthraPants = garment({
      id: 'panta',
      category: 'bottom',
      color: 'anthracite',
      material: 'laine',
    })
    expect(ruleR9([marineTee, anthraPants].map(colored))).toHaveLength(1)
  })

  it('R9 : une pièce L3 suffit', () => {
    const marineTee = garment({ id: 'tee-m', category: 'top', color: 'marine', material: 'coton' })
    expect(ruleR9([marineTee, taupeChino].map(colored))).toHaveLength(0)
  })

  it('R10 : saisons sans intersection', () => {
    const summer = garment({
      id: 'short',
      category: 'bottom',
      color: 'ecru',
      material: 'lin',
      season: ['été'],
    })
    const winter = garment({
      id: 'pull',
      category: 'layer',
      color: 'marine',
      material: 'maille',
      season: ['hiver'],
    })
    const tee = garment({
      id: 'tee',
      category: 'top',
      color: 'ecru',
      material: 'coton',
      season: ['été'],
    })
    expect(ruleR10([tee, summer, winter].map(colored))).toHaveLength(1)
  })
})

describe('evaluateOutfit — bonus', () => {
  it('B1 : bleu ciel en position haute', () => {
    expect(ruleB1([cielShirt, taupeChino].map(colored))).toHaveLength(1)
    expect(ruleB1([ecruTee, taupeChino].map(colored))).toHaveLength(0)
  })

  it('B2 : superposition top + layer', () => {
    expect(ruleB2([cielShirt, marinePull, taupeChino].map(colored))).toHaveLength(1)
    expect(ruleB2([cielShirt, taupeChino].map(colored))).toHaveLength(0)
  })

  it('B3 : ton-sur-ton matières différentes', () => {
    const ecruShirt = garment({
      id: 'chemise-ecru',
      category: 'top',
      color: 'ecru',
      material: 'oxford',
    })
    const ecruPants = garment({
      id: 'pantalon-ecru',
      category: 'bottom',
      color: 'ecru',
      material: 'lin',
    })
    expect(ruleB3([ecruShirt, ecruPants].map(colored))).toHaveLength(1)
    expect(ruleR6([ecruShirt, ecruPants].map(colored))).toHaveLength(0)
  })

  it('B4 : neutre + neutre + un seul accent', () => {
    expect(ruleB4([cielShirt, taupeChino, baskets].map(colored))).toHaveLength(1)
    expect(ruleB4([taupeChino, baskets, ecruTee].map(colored))).toHaveLength(0)
  })

  it('score plafonné à 100', () => {
    const result = evaluateOutfit([cielShirt, marinePull, taupeChino, baskets])
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.hits.some((h) => h.id === 'B1')).toBe(true)
    expect(result.hits.some((h) => h.id === 'B2')).toBe(true)
  })

  it('expose 2–3 raisons principales', () => {
    const blackTee = garment({ id: 'tee-noir', category: 'top', color: 'noir', material: 'coton' })
    const result = evaluateOutfit([blackTee, taupeChino])
    expect(result.reasons.length).toBeGreaterThan(0)
    expect(result.reasons.length).toBeLessThanOrEqual(SCORE.reasonCount)
    expect(result.reasons[0]?.severity).toBe('blocking')
  })
})

describe('suggestOutfits / diagnoseMissing', () => {
  it('propose des tenues score ≥ 80 hors saison incohérente', () => {
    const pieces = [cielShirt, taupeChino, marinePull, baskets, ecruTee]
    const suggestions = suggestOutfits(pieces, [], [], {
      season: 'été',
      now: new Date('2026-08-15'),
      limit: 3,
    })
    expect(suggestions.length).toBeGreaterThan(0)
    for (const s of suggestions) {
      expect(s.evaluation.score).toBeGreaterThanOrEqual(80)
      expect(s.evaluation.isBlocking).toBe(false)
    }
  })

  it('diagnostique un bas clair manquant pour l’été', () => {
    const darkBottom = garment({
      id: 'jean',
      category: 'bottom',
      color: 'denim-brut',
      material: 'denim',
      season: ['été'],
    })
    const msgs = diagnoseMissing([cielShirt, darkBottom], 'été')
    expect(msgs.some((m) => m.toLowerCase().includes('bas clair'))).toBe(true)
  })
})

describe('wardrobeGaps', () => {
  it('détecte l’absence de bas clairs', () => {
    const darkBottom = garment({
      id: 'jean',
      category: 'bottom',
      color: 'marine',
      material: 'denim',
    })
    const gaps = wardrobeGaps([cielShirt, darkBottom])
    expect(gaps.some((g) => g.id === 'no-light-bottoms')).toBe(true)
  })
})

describe('parfums', () => {
  const dayPerfume = garment({
    id: 'jardin',
    category: 'fragrance',
    color: 'blanc-optique',
    subcategory: 'eau de toilette',
    season: ['été'],
    moments: ['journée'],
  })
  const nightPerfume = garment({
    id: 'coco',
    category: 'fragrance',
    color: 'bordeaux',
    subcategory: 'eau de parfum',
    season: ['été'],
    moments: ['soirée'],
  })

  it('n’entre pas dans le score vêtement (R3 ignoré)', () => {
    const before = evaluateOutfit([cielShirt, taupeChino])
    const after = evaluateOutfit([cielShirt, taupeChino, dayPerfume])
    expect(after.score).toBe(before.score)
    expect(after.hits.some((h) => h.id === 'R3')).toBe(false)
  })

  it('un seul parfum à la fois dans l’atelier', () => {
    const next = placeGarment([cielShirt, dayPerfume], nightPerfume)
    expect(next.filter((g) => g.category === 'fragrance').map((g) => g.id)).toEqual(['coco'])
  })

  it('filtre été-journée vs été-soirée', () => {
    expect(fragranceMatches(dayPerfume, [cielShirt], ['journée'])).toBe(true)
    expect(fragranceMatches(dayPerfume, [cielShirt], ['soirée'])).toBe(false)
    expect(fragranceMatches(nightPerfume, [cielShirt], ['soirée'])).toBe(true)
    const winterLayer = garment({
      id: 'manteau',
      category: 'layer',
      color: 'marine',
      subcategory: 'manteau',
      season: ['hiver'],
    })
    expect(fragranceMatches(nightPerfume, [winterLayer], ['soirée'])).toBe(false)
  })
})
