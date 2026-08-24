const MAX_HTML = 512_000
const MAX_IMAGE = 1_500_000
const TIMEOUT_MS = 8000

export function isBlockedHost(hostname) {
  const h = String(hostname ?? '')
    .replace(/^\[|\]$/g, '')
    .toLowerCase()
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

export function assertPublicHttpUrl(raw) {
  const parsed = new URL(raw)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Le lien doit commencer par http ou https.')
  }
  if (isBlockedHost(parsed.hostname)) {
    throw new Error('Ce lien n’est pas public.')
  }
  return parsed
}

export async function fetchPublic(raw) {
  const parsed = assertPublicHttpUrl(raw)
  const res = await fetch(parsed.toString(), {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/json,image/avif,image/webp,image/*,*/*;q=0.8',
      'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  })
  const finalUrl = res.url || parsed.toString()
  let finalHost = parsed.hostname
  try {
    finalHost = new URL(finalUrl).hostname
  } catch {
    /* keep */
  }
  if (isBlockedHost(finalHost)) {
    throw new Error('Redirection vers une adresse non publique.')
  }
  if (!res.ok) {
    throw new Error(`La page a répondu ${res.status}.`)
  }
  const contentType = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0].trim()
  const image = contentType.startsWith('image/')
  const buf = await readLimited(res, image ? MAX_IMAGE : MAX_HTML)
  if (image) {
    if (buf.byteLength > MAX_IMAGE) {
      throw new Error('Photo trop lourde.')
    }
    const mime = contentType === 'image/svg+xml' ? 'image/png' : contentType
    return {
      ok: true,
      kind: 'image',
      finalUrl,
      contentType,
      dataUrl: `data:${mime};base64,${buf.toString('base64')}`,
    }
  }
  return {
    ok: true,
    kind: 'html',
    finalUrl,
    contentType,
    text: buf.toString('utf8'),
  }
}

async function readLimited(res, max) {
  if (!res.body || typeof res.body.getReader !== 'function') {
    const buf = Buffer.from(await res.arrayBuffer())
    return buf.subarray(0, Math.min(buf.byteLength, max))
  }
  const reader = res.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(Buffer.from(value))
    size += value.byteLength
    if (size >= max) {
      try {
        await reader.cancel()
      } catch {
        /* ignore */
      }
      break
    }
  }
  return Buffer.concat(chunks).subarray(0, max)
}

export async function handler(event) {
  try {
    const url = event.queryStringParameters?.url
    if (!url) {
      return json(400, { ok: false, error: 'Paramètre url manquant.' })
    }
    const result = await fetchPublic(url)
    return json(200, result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import impossible.'
    return json(400, { ok: false, error: message })
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}
