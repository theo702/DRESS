export function fetchPublic(raw: string): Promise<{
  ok: true
  kind: 'html' | 'image' | string
  finalUrl: string
  contentType: string
  text?: string
  dataUrl?: string
}>

export function handler(event: {
  queryStringParameters?: Record<string, string | undefined>
}): Promise<{
  statusCode: number
  headers: Record<string, string>
  body: string
}>
