import { BRANDS, FRAGRANCE_BRANDS, MATERIALS, PALETTE, SCENT_FAMILIES, SUBCATEGORIES } from '../config/dress'
import type { Category, Formality, Moment, Season } from '../domain/types'

export type ProductDraft = {
  name?: string
  category?: Category
  subcategory?: string
  color?: string
  material?: string
  brand?: string
  size?: string
  season?: Season[]
  moments?: Moment[]
  formality?: Formality
  imageUrl?: string
  sourceUrl: string
}

const TYPE_HINTS: Array<{ re: RegExp; category: Category; type: string }> = [
  { re: wordRe('chemise oxford'), category: 'top', type: 'chemise oxford' },
  { re: wordRe('oxford shirt'), category: 'top', type: 'chemise oxford' },
  { re: wordRe('t-?shirts?'), category: 'top', type: 'tee' },
  { re: wordRe('polos?'), category: 'top', type: 'polo' },
  { re: wordRe('chemises?'), category: 'top', type: 'chemise' },
  { re: wordRe('shirts?'), category: 'top', type: 'chemise' },
  { re: wordRe('marcels?|tank tops?'), category: 'top', type: 'marcel' },
  { re: wordRe('chinos?'), category: 'bottom', type: 'chino' },
  { re: wordRe('jeans?'), category: 'bottom', type: 'jean' },
  { re: wordRe('shorts?'), category: 'bottom', type: 'short' },
  { re: wordRe('pantalons?\\s+laine'), category: 'bottom', type: 'pantalon laine' },
  { re: wordRe('pantalons?'), category: 'bottom', type: 'pantalon' },
  { re: wordRe('(?:pants|trousers)'), category: 'bottom', type: 'pantalon' },
  { re: wordRe('surchemises?|overshirts?'), category: 'layer', type: 'surchemise' },
  { re: wordRe('cardigans?'), category: 'layer', type: 'cardigan' },
  { re: wordRe('blazers?'), category: 'layer', type: 'blazer' },
  { re: wordRe('manteaux?|coats?|parkas?|trench(?:es)?'), category: 'layer', type: 'manteau' },
  { re: wordRe('vestes?|jackets?'), category: 'layer', type: 'veste' },
  { re: wordRe('pulls?|sweaters?|hoodies?|sweat-?shirts?|sweats?'), category: 'layer', type: 'pull' },
  { re: wordRe('baskets?|sneakers?'), category: 'shoes', type: 'baskets' },
  { re: wordRe('boots?'), category: 'shoes', type: 'boots' },
  { re: wordRe('espadrilles?'), category: 'shoes', type: 'espadrilles' },
  { re: wordRe('derbies?'), category: 'shoes', type: 'derbies' },
  { re: wordRe('mocassins?|loafers?'), category: 'shoes', type: 'mocassins' },
  { re: wordRe('sandales?|sandals?'), category: 'shoes', type: 'sandales' },
  { re: wordRe('eau de parfum'), category: 'fragrance', type: 'eau de parfum' },
  { re: wordRe('eau de toilette'), category: 'fragrance', type: 'eau de toilette' },
  { re: wordRe('colognes?'), category: 'fragrance', type: 'cologne' },
  { re: wordRe('parfums?|perfumes?|fragrances?'), category: 'fragrance', type: 'eau de parfum' },
  { re: wordRe('ceintures?|belts?'), category: 'accessory', type: 'ceinture' },
  { re: wordRe('montres?|watches?'), category: 'accessory', type: 'montre' },
  { re: wordRe('écharpes?|echarpes?|scar(?:f|ves)'), category: 'accessory', type: 'écharpe' },
  { re: wordRe('lunettes?|glasses|sunglasses'), category: 'accessory', type: 'lunettes' },
  { re: wordRe('bonnets?|beanies?'), category: 'accessory', type: 'bonnet' },
]

const COLOR_ALIASES: Array<{ re: RegExp; id: string }> = [
  { re: /\bbleu[\s-]?ciel\b|\bsky\s*blue\b|\blight\s*blue\b/i, id: 'bleu-ciel' },
  { re: /\bdenim[\s-]?clair\b|\blight\s*denim\b/i, id: 'denim-clair' },
  { re: /\bdenim[\s-]?brut\b|\bdark\s*denim\b|\braw\s*denim\b/i, id: 'denim-brut' },
  { re: /\bblanc[\s-]?cass[eé]\b|\boff[\s-]?white\b|\bivory\b/i, id: 'blanc-casse' },
  { re: /\bblanc[\s-]?optique\b|\boptic(?:al)?\s*white\b/i, id: 'blanc-optique' },
  { re: /\bgris[\s-]?perle\b|\bpearl\s*gr[ae]y\b/i, id: 'gris-perle' },
  { re: /\bgris[\s-]?chin[eé]\b|\bheather\b/i, id: 'gris-chine' },
  { re: /\bbleu[\s-]?ardoise\b|\bslate\b/i, id: 'bleu-ardoise' },
  { re: /\bmarine\b|\bnavy\b/i, id: 'marine' },
  { re: /\banthracite\b|\bcharcoal\b/i, id: 'anthracite' },
  { re: /\b[ée]cru\b|\bcream\b/i, id: 'ecru' },
  { re: /\bsauge\b|\bsage\b|\bolive\b|\bkaki\b|\bkhaki\b/i, id: 'sauge' },
  { re: /\btaupe\b|\bbeige\b/i, id: 'taupe' },
  { re: /\bbordeaux\b|\bburgundy\b|\bwine\b/i, id: 'bordeaux' },
  { re: /\bprune\b/i, id: 'prune' },
  { re: /\bcamel\b/i, id: 'camel' },
  { re: /\bmoutarde\b|\bmustard\b/i, id: 'moutarde' },
  { re: /\borange\b/i, id: 'orange' },
  { re: /\bdor[eé]\b|\bgold\b/i, id: 'dore' },
  { re: /\bnoirs?\b|\bblack\b/i, id: 'noir' },
  { re: /\bblancs?\b|\bwhite\b/i, id: 'blanc-casse' },
  { re: /\bgris\b|\bgr[ae]y\b/i, id: 'gris-chine' },
  { re: /\bdenim\b/i, id: 'denim-brut' },
  { re: /\bbleus?\b|\bblue\b/i, id: 'bleu-ardoise' },
]

const MATERIAL_ALIASES: Array<{ re: RegExp; id: string }> = [
  { re: /\bcotton\b|\bcoton\b/i, id: 'coton' },
  { re: /\blinen\b|\blin\b/i, id: 'lin' },
  { re: /\boxford\b/i, id: 'oxford' },
  { re: /\bdenim\b/i, id: 'denim' },
  { re: /\bknit\b|\bmaille\b/i, id: 'maille' },
  { re: /\bwool\b|\blaine\b/i, id: 'laine' },
  { re: /\bleather\b|\bcuir\b/i, id: 'cuir' },
  { re: /\bsuede\b|\bdaim\b/i, id: 'daim' },
  { re: /\bviscose\b/i, id: 'viscose' },
  { re: /\bnylon\b/i, id: 'nylon' },
  { re: /\bcitrus\b|\bhespérid|\bhesperid/i, id: 'hespéridé' },
  { re: /\baquatic|\baquatique\b/i, id: 'aquatique' },
  { re: /\bfloral\b/i, id: 'floral' },
  { re: /\baromatique\b|\baromatic\b/i, id: 'aromatique' },
  { re: /\bwoody\b|\bboisé\b|\bboise\b/i, id: 'boisé' },
  { re: /\boriental\b/i, id: 'oriental' },
  { re: /\bspicy\b|\bépicé\b|\bepice\b/i, id: 'épicé' },
  { re: /\bfougère\b|\bfougere\b/i, id: 'fougère' },
]

const HOST_BRANDS: Array<{ re: RegExp; brand: string }> = [
  { re: /(^|\.)uniqlo\./i, brand: 'Uniqlo' },
  { re: /(^|\.)zara\./i, brand: 'Zara' },
  { re: /(^|\.)cos\./i, brand: 'COS' },
  { re: /(^|\.)arket\./i, brand: 'Arket' },
  { re: /(^|\.)apc(store)?\./i, brand: 'A.P.C.' },
  { re: /(^|\.)sezane\./i, brand: 'Sézane' },
  { re: /(^|\.)sandro-paris\./i, brand: 'Sandro' },
  { re: /(^|\.)mango\./i, brand: 'Mango' },
  { re: /(^|\.)massimodutti\./i, brand: 'Massimo Dutti' },
  { re: /(^|\.)levi'?s?\./i, brand: 'Levi’s' },
  { re: /(^|\.)chanel\./i, brand: 'Chanel' },
  { re: /(^|\.)dior\./i, brand: 'Dior' },
  { re: /(^|\.)hermes\./i, brand: 'Hermès' },
  { re: /(^|\.)guerlain\./i, brand: 'Guerlain' },
  { re: /(^|\.)diptyque\./i, brand: 'Diptyque' },
]

const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i

export function looksLikeImageUrl(url: string): boolean {
  return IMAGE_EXT.test(url)
}

export function normalizeProductUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('Colle un lien.')
  const withScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(withScheme)
  } catch {
    throw new Error('Lien invalide.')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Le lien doit commencer par http ou https.')
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error('Ce lien n’est pas public.')
  }
  return parsed.toString()
}

export function isBlockedHost(hostname: string): boolean {
  const h = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (h === 'localhost' || h === '::1' || h === '0.0.0.0') return true
  if (h.endsWith('.localhost') || h.endsWith('.local')) return true
  const parts = h.split('.').map(Number)
  if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
    const [a, b] = parts
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
  }
  if (h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80')) return true
  return false
}

export function draftFromHtml(html: string, pageUrl: string): ProductDraft {
  const meta = metaContents(html)
  const ld = collectProducts(jsonLdBlocks(html))
  const titleTag = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(
    /<[^>]+>/g,
    '',
  )
  const siteName = first(meta['og:site_name'], asText(ld.brand), hostnameBrand(pageUrl))
  const rawName = first(asText(ld.name), meta['og:title'], meta['twitter:title'], titleTag)
  const description = first(asText(ld.description), meta['og:description'], meta['description']) ?? ''
  const blob = [rawName, description, asText(ld.category), asText(ld.color), asText(ld.material)]
    .filter(Boolean)
    .join(' · ')

  const imageUrl = resolveUrl(
    first(
      asImage(ld.image),
      meta['og:image:secure_url'],
      meta['og:image'],
      meta['twitter:image'],
      meta['twitter:image:src'],
    ),
    pageUrl,
  )

  const guessed = guessFields(blob, pageUrl)
  const color = matchColor(asText(ld.color) ?? '') ?? guessed.color
  const material = matchMaterial(asText(ld.material) ?? '') ?? guessed.material
  const brand = asText(ld.brand) ?? meta['product:brand'] ?? guessed.brand
  const size = asText(ld.size) ?? guessed.size
  const typeFromLd = guessFields([asText(ld.category), asText(ld.name)].filter(Boolean).join(' '), pageUrl)

  return {
    sourceUrl: pageUrl,
    name: cleanName(rawName ?? '', siteName),
    category: typeFromLd.category ?? guessed.category,
    subcategory: typeFromLd.subcategory ?? guessed.subcategory,
    color,
    material,
    brand,
    size,
    season: guessed.season,
    formality: guessed.formality,
    imageUrl,
  }
}

export function draftFromImageUrl(url: string): ProductDraft {
  const file = decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')
  const base = file.replace(IMAGE_EXT, '').replace(/[-_]+/g, ' ').trim()
  return {
    sourceUrl: url,
    imageUrl: url,
    name: base || undefined,
    ...guessFields(base, url),
  }
}

export function draftFromMeta(input: {
  url: string
  title?: string
  description?: string
  imageUrl?: string
  publisher?: string
}): ProductDraft {
  const blob = [input.title, input.description, input.publisher].filter(Boolean).join(' · ')
  const guessed = guessFields(blob, input.url)
  return {
    sourceUrl: input.url,
    ...guessed,
    name: cleanName(input.title ?? '', input.publisher),
    imageUrl: input.imageUrl,
    brand: guessed.brand ?? input.publisher,
  }
}

export function draftFromJina(markdown: string, pageUrl: string): ProductDraft {
  const title = markdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim()
  const source = markdown.match(/^URL Source:\s*(.+)$/m)?.[1]?.trim() ?? pageUrl
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  const colorLine =
    markdown.match(/Coloris:\s*[^\n]+/i)?.[0] ??
    markdown.match(/Couleur:\s*[^\n]+/i)?.[0] ??
    markdown.match(/Colou?r:\s*[^\n]+/i)?.[0]
  const images = [...markdown.matchAll(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g)].map((m) => ({
    alt: m[1],
    url: m[2],
  }))
  const blob = [heading, title, colorLine].filter(Boolean).join(' · ')
  const guessed = guessFields(blob, source)
  return {
    sourceUrl: source,
    ...guessed,
    name: cleanName(heading || title || '', hostnameBrand(source)),
    imageUrl: pickProductImage(images),
  }
}

export function pickProductImage(images: Array<{ alt: string; url: string }>): string | undefined {
  if (images.length === 0) return undefined
  const ranked = images.map((img) => {
    const u = img.url.toLowerCase()
    let score = 0
    if (/chip|logo|icon|favicon|sprite|pixel|1x1|tracking|badge|stylehint\.png/.test(u)) score -= 80
    if (/\.svg(\?|$)/.test(u)) score -= 25
    if (/\/item\/|_3x4|product|imagesgoods/.test(u)) score += 25
    const width = Number(u.match(/[?&]width=(\d+)/)?.[1] ?? 0)
    if (width >= 300) score += 12
    if (img.alt && TYPE_HINTS.some((h) => h.re.test(img.alt))) score += 8
    return { url: img.url, score }
  })
  ranked.sort((a, b) => b.score - a.score)
  return (ranked.find((r) => r.score >= 0) ?? ranked[0])?.url
}

export function htmlLooksThin(html: string): boolean {
  const lower = html.slice(0, 8000).toLowerCase()
  if (/access denied|just a moment|attention required|captcha/.test(lower)) return true
  if (/"@type"\s*:\s*"Product"/i.test(html)) return false
  if (/property=["']og:image/i.test(html) || /name=["']og:image/i.test(html)) return false
  return true
}

export function mergeProductDrafts(base: ProductDraft, extra: ProductDraft): ProductDraft {
  return {
    sourceUrl: extra.sourceUrl || base.sourceUrl,
    name: preferName(base.name, extra.name),
    category: extra.category ?? base.category,
    subcategory: extra.subcategory ?? base.subcategory,
    color: extra.color ?? base.color,
    material: extra.material ?? base.material,
    brand: extra.brand ?? base.brand,
    size: extra.size ?? base.size,
    season: extra.season ?? base.season,
    formality: extra.formality ?? base.formality,
    imageUrl: extra.imageUrl ?? base.imageUrl,
  }
}

function preferName(a?: string, b?: string): string | undefined {
  if (!b) return a
  if (!a) return b
  if (isGenericName(a) && !isGenericName(b)) return b
  return a.length >= b.length ? a : b
}

export function isGenericName(name: string): boolean {
  return /lifewear|accueil|\bhome\b|clothing|vêtements|access denied/i.test(name)
}

export function guessFields(text: string, pageUrl?: string): Omit<ProductDraft, 'sourceUrl'> {
  const typeHit = TYPE_HINTS.find((h) => h.re.test(text))
  const category = typeHit?.category
  const subcategory =
    typeHit?.type ??
    (category ? SUBCATEGORIES[category]?.[0] : undefined)

  let formality: Formality | undefined
  if (wordRe('blazer|costume|suit|derby|habill(?:é|e)?').test(text)) formality = 3
  else if (wordRe('t-?shirt|tee|baskets?|sneakers?|hoodie|shorts?').test(text)) formality = 1
  else if (wordRe('polo').test(text)) formality = 2

  const seasons = new Set<Season>()
  if (wordRe('lin|linen|shorts?|sandales?|sandals?|étés?|etes?|summer').test(text)) {
    seasons.add('été')
  }
  if (wordRe('mi-saison|spring|autumn|fall|tweed').test(text)) seasons.add('mi-saison')
  if (wordRe('laine|wool|manteau|manteaux|coat|parka|hiver|winter').test(text)) {
    seasons.add('hiver')
  }

  let moments: Moment[] | undefined
  if (category === 'fragrance') {
    formality = undefined
    const m = new Set<Moment>()
    if (wordRe('soirée|evening|night').test(text)) m.add('soirée')
    if (wordRe('journée|daytime|fresh|citrus|hespérid').test(text)) m.add('journée')
    moments = m.size > 0 ? [...m] : ['journée', 'soirée']
    if (seasons.size === 0 && wordRe('citrus|hespérid|aquatique|fresh|frais').test(text)) {
      seasons.add('été')
    }
  }

  return {
    category,
    subcategory,
    color: matchColor(text),
    material: matchMaterial(text),
    brand: matchBrand(text) ?? (pageUrl ? hostnameBrand(pageUrl) : undefined),
    size: category === 'fragrance' ? undefined : matchSize(text),
    season: seasons.size > 0 ? [...seasons] : undefined,
    moments,
    formality,
  }
}

function matchColor(text: string): string | undefined {
  if (!text.trim()) return undefined
  const alias = COLOR_ALIASES.find((c) => c.re.test(text))
  if (alias) return alias.id
  const labeled = PALETTE.find((c) => text.toLowerCase().includes(c.label.toLowerCase()))
  return labeled?.id
}

function matchMaterial(text: string): string | undefined {
  const alias = MATERIAL_ALIASES.find((m) => m.re.test(text))
  if (alias) return alias.id
  const scent = SCENT_FAMILIES.find((m) => wordRe(escapeReg(m)).test(text))
  if (scent) return scent
  return MATERIALS.find((m) => wordRe(escapeReg(m)).test(text))
}

function matchBrand(text: string): string | undefined {
  return (
    FRAGRANCE_BRANDS.find((b) => wordRe(escapeReg(b)).test(text)) ??
    BRANDS.find((b) => wordRe(escapeReg(b)).test(text))
  )
}

function matchSize(text: string): string | undefined {
  const named = text.match(wordRe('XXXL|XXL|XL|XS'))?.[0]
  if (named) return named.toUpperCase()
  const letter = text.match(/(?:taille|size)\s*(S|M|L)(?!\p{L})/iu)
  if (letter) return letter[1].toUpperCase()
  const eu = text.match(/(?:taille|pointure|size)\s*(3[6-9]|4[0-6])(?!\p{L})/iu)
  return eu?.[1]
}

function hostnameBrand(pageUrl: string): string | undefined {
  try {
    const host = new URL(pageUrl).hostname
    return HOST_BRANDS.find((h) => h.re.test(host))?.brand
  } catch {
    return undefined
  }
}

function cleanName(title: string, siteName?: string): string | undefined {
  let t = title.replace(/\s+/g, ' ').trim()
  if (!t) return undefined
  if (siteName) {
    t = t.replace(new RegExp(`\\s*[|–—-]\\s*${escapeReg(siteName)}\\s*$`, 'i'), '').trim()
  }
  t = t.replace(/\s*[|–—]\s*[^|–—]{2,40}$/, '').trim()
  return t || title.trim()
}

function metaContents(html: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /<meta\b[^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const tag = m[0]
    const key = attr(tag, 'property') || attr(tag, 'name')
    const content = attr(tag, 'content')
    if (key && content && out[key.toLowerCase()] === undefined) {
      out[key.toLowerCase()] = decodeHtml(content)
    }
  }
  return out
}

function attr(tag: string, name: string): string | undefined {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  const m = tag.match(re)
  const value = m?.[1] ?? m?.[2] ?? m?.[3]
  return value
}

function jsonLdBlocks(html: string): unknown[] {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const blocks: unknown[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) {
    const raw = m[1].replace(/^\s*<!--/, '').replace(/-->\s*$/, '').trim()
    try {
      blocks.push(JSON.parse(raw))
    } catch {
      /* ignore broken json-ld */
    }
  }
  return blocks
}

function collectProducts(blocks: unknown[]): Record<string, unknown> {
  const acc: Record<string, unknown>[] = []
  const walk = (node: unknown) => {
    if (!node) return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }
    if (typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if (obj['@graph']) walk(obj['@graph'])
    const types = ([] as unknown[]).concat(obj['@type'] ?? []).map(String)
    if (types.some((t) => /product/i.test(t))) acc.push(obj)
  }
  blocks.forEach(walk)
  const product = acc[0] ?? {}
  const extra: Record<string, unknown> = { ...product }
  if (product.offers) {
    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers
    if (offer && typeof offer === 'object') Object.assign(extra, offer)
  }
  return extra
}

function asText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return asText(value[0])
  if (value && typeof value === 'object') {
    const obj = value as { name?: unknown; value?: unknown }
    return asText(obj.name) ?? asText(obj.value)
  }
  return undefined
}

function asImage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (Array.isArray(value)) return asImage(value[0])
  if (value && typeof value === 'object') {
    const obj = value as { url?: unknown; contentUrl?: unknown }
    return asImage(obj.url) ?? asImage(obj.contentUrl)
  }
  return undefined
}

function resolveUrl(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined
  try {
    return new URL(src, base).toString()
  } catch {
    return undefined
  }
}

function first(...values: Array<string | undefined>): string | undefined {
  return values.find((v) => v && v.trim())
}

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
}

function wordRe(inner: string): RegExp {
  return new RegExp(`(?<!\\p{L})(?:${inner})(?!\\p{L})`, 'iu')
}

function escapeReg(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
