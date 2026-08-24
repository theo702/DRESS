import { describe, expect, it } from 'vitest'
import {
  draftFromHtml,
  draftFromImageUrl,
  draftFromJina,
  guessFields,
  isBlockedHost,
  looksLikeImageUrl,
  normalizeProductUrl,
} from './productLink'

const UNIQLO = `<!doctype html>
<html>
<head>
  <title>Polo Dry piqué vert kaki | Uniqlo</title>
  <meta property="og:title" content="Polo Dry piqué vert kaki" />
  <meta property="og:site_name" content="Uniqlo" />
  <meta property="og:image" content="/images/polo-kaki.jpg" />
  <meta property="og:description" content="Polo homme en coton, taille M. Idéal l’été." />
</head>
</html>`

const JSON_LD = `<!doctype html>
<html>
<head>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Chemise oxford bleu ciel",
    "brand": { "@type": "Brand", "name": "COS" },
    "color": "Bleu ciel",
    "material": "Oxford",
    "category": "Chemises",
    "image": ["https://cdn.example.com/oxford.jpg"],
    "description": "Chemise oxford coton, smart casual."
  }
  </script>
</head>
</html>`

describe('normalizeProductUrl', () => {
  it('adds https and rejects local hosts', () => {
    expect(normalizeProductUrl('uniqlo.com/fr/polo')).toBe('https://uniqlo.com/fr/polo')
    expect(() => normalizeProductUrl('http://127.0.0.1/x')).toThrow()
    expect(() => normalizeProductUrl('javascript:alert(1)')).toThrow()
    expect(isBlockedHost('192.168.0.12')).toBe(true)
    expect(isBlockedHost('uniqlo.com')).toBe(false)
  })
})

describe('draftFromHtml', () => {
  it('reads Open Graph and infers garment fields', () => {
    const draft = draftFromHtml(UNIQLO, 'https://www.uniqlo.com/fr/product/polo')
    expect(draft.name).toBe('Polo Dry piqué vert kaki')
    expect(draft.category).toBe('top')
    expect(draft.subcategory).toBe('polo')
    expect(draft.brand).toBe('Uniqlo')
    expect(draft.color).toBe('sauge')
    expect(draft.material).toBe('coton')
    expect(draft.size).toBe('M')
    expect(draft.season).toContain('été')
    expect(draft.formality).toBe(2)
    expect(draft.imageUrl).toBe('https://www.uniqlo.com/images/polo-kaki.jpg')
  })

  it('reads JSON-LD Product', () => {
    const draft = draftFromHtml(JSON_LD, 'https://www.cos.com/en/shirts/oxford')
    expect(draft.name).toBe('Chemise oxford bleu ciel')
    expect(draft.category).toBe('top')
    expect(draft.subcategory).toBe('chemise oxford')
    expect(draft.brand).toBe('COS')
    expect(draft.color).toBe('bleu-ciel')
    expect(draft.material).toBe('oxford')
    expect(draft.imageUrl).toBe('https://cdn.example.com/oxford.jpg')
  })
})

describe('guessFields', () => {
  it('maps a wool coat to layer / winter', () => {
    const g = guessFields('Manteau laine marine Arket')
    expect(g.category).toBe('layer')
    expect(g.subcategory).toBe('manteau')
    expect(g.color).toBe('marine')
    expect(g.material).toBe('laine')
    expect(g.brand).toBe('Arket')
    expect(g.season).toContain('hiver')
    expect(g.formality).toBeUndefined()
  })

  it('maps sneakers to shoes', () => {
    const g = guessFields('Baskets cuir blanc cassé')
    expect(g.category).toBe('shoes')
    expect(g.subcategory).toBe('baskets')
    expect(g.color).toBe('blanc-casse')
    expect(g.formality).toBe(1)
  })

  it('maps a summer daytime perfume', () => {
    const g = guessFields('Eau de toilette Hermès hespéridé citrus journée')
    expect(g.category).toBe('fragrance')
    expect(g.subcategory).toBe('eau de toilette')
    expect(g.brand).toBe('Hermès')
    expect(g.material).toBe('hespéridé')
    expect(g.moments).toEqual(['journée'])
    expect(g.season).toContain('été')
  })
})

describe('draftFromJina', () => {
  it('reads title, type and a product photo not a color chip', () => {
    const md = `Title: T-shirt 100% coton Supima® pour Unisexe | UNIQLO FR
URL Source: https://www.uniqlo.com/fr/fr/products/E455365-000
Markdown Content:
# T-shirt 100% coton Supima®
Coloris: 17 ROUGE
![Image 1: ROUGE](https://image.uniqlo.com/chip/goods_17_chip.jpg)
![Image 9: T-shirt 100% coton Supima®](https://image.uniqlo.com/UQ/ST3/eu/imagesgoods/455365/item/eugoods_17_455365_3x4.jpg?width=400)
`
    const draft = draftFromJina(md, 'https://www.uniqlo.com/fr/fr/products/E455365-000')
    expect(draft.name).toBe('T-shirt 100% coton Supima®')
    expect(draft.category).toBe('top')
    expect(draft.subcategory).toBe('tee')
    expect(draft.brand).toBe('Uniqlo')
    expect(draft.material).toBe('coton')
    expect(draft.formality).toBe(1)
    expect(draft.imageUrl).toContain('/item/')
    expect(draft.imageUrl).not.toContain('chip')
  })
})

describe('draftFromImageUrl', () => {
  it('keeps the photo URL', () => {
    expect(looksLikeImageUrl('https://cdn.shop/a/chino-taupe.jpg?w=800')).toBe(true)
    const draft = draftFromImageUrl('https://cdn.shop/a/chino-taupe.jpg?w=800')
    expect(draft.imageUrl).toContain('chino-taupe.jpg')
    expect(draft.category).toBe('bottom')
  })
})
