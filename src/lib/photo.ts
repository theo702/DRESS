export async function dataUrlFromBlob(blob: Blob, max = 480): Promise<string> {
  const type = blob.type || 'image/jpeg'
  const file = new File([blob], 'photo.jpg', { type })
  return fileToDataUrl(file, max)
}

export async function dataUrlFromDataUrl(dataUrl: string, max = 480): Promise<string> {
  const res = await fetch(dataUrl)
  return dataUrlFromBlob(await res.blob(), max)
}

export async function fileToDataUrl(file: File, max = 480): Promise<string> {
  const source = await readImage(file)
  const scale = Math.min(1, max / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponible')
  ctx.drawImage(source.image, 0, 0, canvas.width, canvas.height)
  source.close()
  return canvas.toDataURL('image/jpeg', 0.72)
}

type Source = { image: CanvasImageSource; width: number; height: number; close: () => void }

async function readImage(file: File): Promise<Source> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  }
  const url = URL.createObjectURL(file)
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image illisible'))
    img.src = url
  })
  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  }
}
