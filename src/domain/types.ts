export type Category = 'top' | 'bottom' | 'layer' | 'shoes' | 'accessory'
export type Season = 'été' | 'mi-saison' | 'hiver'
export type Formality = 1 | 2 | 3
export type RuleSeverity = 'blocking' | 'strong' | 'soft' | 'bonus'

export type Garment = {
  id: string
  name: string
  category: Category
  subcategory: string
  color: string
  material?: string
  brand?: string
  size?: string
  season: Season[]
  formality: Formality
  photoDataUrl?: string
  archived: boolean
  createdAt: number
}

export type Outfit = {
  id: string
  name?: string
  garmentIds: string[]
  score: number
  warnings: string[]
  createdAt: number
}

export type WearLog = {
  id: string
  outfitId: string
  date: string
}

export type RuleHit = {
  id: string
  severity: RuleSeverity
  delta: number
  message: string
}

export type OutfitEvaluation = {
  score: number
  warnings: string[]
  hits: RuleHit[]
  reasons: RuleHit[]
  isBlocking: boolean
}

export type AppData = {
  version: 1
  garments: Garment[]
  outfits: Outfit[]
  wearLogs: WearLog[]
  exportedAt?: string
}
