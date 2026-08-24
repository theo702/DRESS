import { dataUrlFromBlob, dataUrlFromDataUrl } from './photo'
import {
  draftFromHtml,
  draftFromImageUrl,
  draftFromJina,
  draftFromMeta,
  htmlLooksThin,
  isGenericName,
  looksLikeImageUrl,
  mergeProductDrafts,
  normalizeProductUrl,
  type ProductDraft,
} from './productLink'

export type ImportedGarment = ProductDraft & { photoDataUrl?: string }

type ProxyPayload = {
  ok?: boolean
  kind?: string
  finalUrl?: string
  contentType?: string
  text?: string
  dataUrl?: string
  error?: string
}

export async function importProductLink(raw: string): Promise<ImportedGarment> {
  const url = normalizeProductUrl(raw)
  if (looksLikeImageUrl(url)) {
    const photoDataUrl = await loadImageDataUrl(url)
    return { ...draftFromImageUrl(url), photoDataUrl }
  }

  const resource = await loadResource(url)
  if (resource.kind === 'image' && resource.dataUrl) {
    const photoDataUrl = await resizeMaybe(resource.dataUrl)
    return {
      ...draftFromImageUrl(resource.finalUrl || url),
      imageUrl: resource.finalUrl,
      photoDataUrl,
    }
  }

  const html = resource.text ?? ''
  let draft: ProductDraft = html.trim()
    ? draftFromHtml(html, resource.finalUrl || url)
    : { sourceUrl: url }

  if (!html.trim() || htmlLooksThin(html) || !draft.imageUrl || isGenericName(draft.name ?? '')) {
    const markdown = await tryJina(url)
    if (markdown) {
      const fromJina = draftFromJina(markdown, url)
      draft = html.trim() && !htmlLooksThin(html) ? mergeProductDrafts(draft, fromJina) : fromJina
    }
  }

  if (!draft.name && !draft.imageUrl) {
    const meta = await tryMicrolink(url)
    if (meta) draft = draftFromMeta(meta)
  }

  if (!draft.name && !draft.imageUrl) {
    throw new Error('Impossible de lire ce lien (boutique bloquée ou hors-ligne).')
  }
  return attachPhoto(draft)
}

async function attachPhoto(draft: ProductDraft): Promise<ImportedGarment> {
  if (!draft.imageUrl) return draft
  try {
    const photoDataUrl = await loadImageDataUrl(draft.imageUrl)
    return { ...draft, photoDataUrl }
  } catch {
    return draft
  }
}

async function loadResource(url: string): Promise<ProxyPayload> {
  const fromApi = await trySameOriginProxy(url)
  if (fromApi) return fromApi

  const html = await tryAllOrigins(url)
  if (html) return { ok: true, kind: 'html', finalUrl: url, text: html }
  return { ok: false, kind: 'html', finalUrl: url, text: '' }
}

async function trySameOriginProxy(url: string): Promise<ProxyPayload | null> {
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`)
    const type = res.headers.get('content-type') ?? ''
    if (!type.includes('application/json')) return null
    const data = (await res.json()) as ProxyPayload
    if (data?.ok) return data
    if (data?.error && /pas public|invalide|http ou https/i.test(data.error)) {
      throw new Error(data.error)
    }
    return null
  } catch (err) {
    if (err instanceof Error && /pas public|invalide|http ou https/i.test(err.message)) {
      throw err
    }
    return null
  }
}

async function tryJina(url: string): Promise<string | null> {
  const jinaUrl = `https://r.jina.ai/${url}`
  try {
    const res = await fetch(jinaUrl, { headers: { accept: 'text/plain' } })
    if (res.ok) {
      const text = await res.text()
      if (/^Title:/m.test(text) || /Markdown Content:/i.test(text)) return text
    }
  } catch {
    /* CORS or timeout */
  }
  const proxied = await trySameOriginProxy(jinaUrl)
  if (
    proxied?.text &&
    (/^Title:/m.test(proxied.text) || /Markdown Content:/i.test(proxied.text))
  ) {
    return proxied.text
  }
  return null
}

async function tryAllOrigins(url: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = (await res.json()) as { contents?: string }
    return data.contents?.trim() ? data.contents : null
  } catch {
    return null
  }
}

async function tryMicrolink(url: string): Promise<{
  url: string
  title?: string
  description?: string
  imageUrl?: string
  publisher?: string
} | null> {
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const data = (await res.json()) as {
      status?: string
      data?: {
        title?: string
        description?: string
        publisher?: string
        image?: { url?: string }
      }
    }
    if (data.status !== 'success' || !data.data) return null
    return {
      url,
      title: data.data.title,
      description: data.data.description,
      publisher: data.data.publisher,
      imageUrl: data.data.image?.url,
    }
  } catch {
    return null
  }
}

async function loadImageDataUrl(imageUrl: string): Promise<string> {
  const proxied = await trySameOriginProxy(imageUrl)
  if (proxied?.kind === 'image' && proxied.dataUrl) {
    return resizeMaybe(proxied.dataUrl)
  }

  try {
    const res = await fetch(imageUrl)
    if (res.ok) {
      const blob = await res.blob()
      if (blob.type.startsWith('image/')) return dataUrlFromBlob(blob)
    }
  } catch {
    /* CORS */
  }

  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`)
    if (res.ok) {
      const blob = await res.blob()
      return dataUrlFromBlob(blob)
    }
  } catch {
    /* ignore */
  }

  throw new Error('Photo inaccessible')
}

async function resizeMaybe(dataUrl: string): Promise<string> {
  try {
    return await dataUrlFromDataUrl(dataUrl)
  } catch {
    return dataUrl
  }
}
