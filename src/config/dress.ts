/**
 * Palette + barème des règles.
 * Fichier unique : modifier ici sans toucher au moteur ni à l'UI.
 */

export const NEUTRAL_FAMILY_PREFIX = 'neutre'

export const PALETTE = [
  {
    id: 'blanc-casse',
    label: 'Blanc cassé',
    hex: '#F2EDE4',
    family: 'neutre-clair',
    lightness: 1,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'ecru',
    label: 'Écru',
    hex: '#E8DCC8',
    family: 'neutre-clair',
    lightness: 1,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'gris-perle',
    label: 'Gris perle',
    hex: '#D4D4D2',
    family: 'neutre',
    lightness: 2,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'gris-chine',
    label: 'Gris chiné',
    hex: '#9A9A98',
    family: 'neutre',
    lightness: 3,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'bleu-ciel',
    label: 'Bleu ciel',
    hex: '#A8C4D9',
    family: 'bleu',
    lightness: 2,
    isNearFaceSafe: true,
    allowed: true,
    signature: true,
  },
  {
    id: 'sauge',
    label: 'Sauge',
    hex: '#9CAB95',
    family: 'vert',
    lightness: 3,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'taupe',
    label: 'Taupe',
    hex: '#8B8178',
    family: 'neutre-chaud-froid',
    lightness: 3,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'bordeaux',
    label: 'Bordeaux',
    hex: '#6B2E3A',
    family: 'rouge',
    lightness: 4,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'prune',
    label: 'Prune',
    hex: '#5C4059',
    family: 'violet',
    lightness: 4,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'denim-clair',
    label: 'Denim clair',
    hex: '#7B96B0',
    family: 'bleu',
    lightness: 3,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'bleu-ardoise',
    label: 'Bleu ardoise',
    hex: '#4A6076',
    family: 'bleu',
    lightness: 4,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'denim-brut',
    label: 'Denim brut',
    hex: '#35495E',
    family: 'bleu',
    lightness: 4,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'marine',
    label: 'Marine',
    hex: '#1F2D45',
    family: 'bleu',
    lightness: 5,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'anthracite',
    label: 'Anthracite',
    hex: '#2E3033',
    family: 'neutre',
    lightness: 5,
    isNearFaceSafe: true,
    allowed: true,
  },
  {
    id: 'noir',
    label: 'Noir',
    hex: '#0A0A0A',
    family: 'neutre',
    lightness: 5,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'Le noir près du visage te blanchit. Passe au marine.',
    pickerHint: 'Interdit près du visage : te blanchit. Préfère le marine.',
  },
  {
    id: 'blanc-optique',
    label: 'Blanc optique',
    hex: '#FFFFFF',
    family: 'neutre-clair',
    lightness: 1,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'Blanc optique trop dur près du visage. Prends du blanc cassé.',
    pickerHint: 'Trop dur, trop froid. Remplace par blanc cassé ou écru.',
  },
  {
    id: 'camel',
    label: 'Camel',
    hex: '#B8874D',
    family: 'chaud',
    lightness: 3,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'Le camel près du visage réchauffe trop le teint. Passe au taupe.',
    pickerHint: 'Sous-ton chaud : tire le teint vers le jaune. Préfère le taupe.',
  },
  {
    id: 'moutarde',
    label: 'Moutarde',
    hex: '#C9A227',
    family: 'chaud',
    lightness: 3,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'La moutarde près du visage jaunit le teint. Passe à la sauge.',
    pickerHint: 'Sous-ton chaud. Préfère la sauge ou le taupe.',
  },
  {
    id: 'orange',
    label: 'Orange',
    hex: '#D96A3B',
    family: 'chaud',
    lightness: 3,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'L’orange près du visage compete avec le teint. Passe au bordeaux.',
    pickerHint: 'Trop saturé près du visage. Préfère le bordeaux.',
  },
  {
    id: 'dore',
    label: 'Doré',
    hex: '#C9A961',
    family: 'chaud',
    lightness: 3,
    isNearFaceSafe: false,
    allowed: false,
    nearFaceWarning: 'Le doré près du visage jaunit. Passe à l’écru ou au taupe.',
    pickerHint: 'Sous-ton chaud. Préfère l’écru ou le taupe.',
  },
] as const

export type ColorId = (typeof PALETTE)[number]['id']

export type ColorDef = {
  id: string
  label: string
  hex: string
  family: string
  lightness: 1 | 2 | 3 | 4 | 5
  isNearFaceSafe: boolean
  allowed: boolean
  signature?: boolean
  nearFaceWarning?: string
  pickerHint?: string
}

export const SIGNATURE_COLOR_ID: ColorId = 'bleu-ciel'
export const MARINE_COLOR_ID: ColorId = 'marine'
export const OPTICAL_WHITE_ID: ColorId = 'blanc-optique'
export const BLUE_FAMILY = 'bleu'

export const HIGH_POSITION_CATEGORIES = ['top', 'layer'] as const

export const RULES = {
  R1: {
    id: 'R1',
    severity: 'blocking' as const,
    delta: -30,
    message:
      'Cette couleur n’est pas sûre près du visage. Remplace-la par une teinte validée (marine, écru, bleu ciel).',
  },
  R2: {
    id: 'R2',
    severity: 'blocking' as const,
    delta: -30,
    maxLightnessGap: 3,
    message:
      'Contraste trop violent. Ton contraste naturel est bas — reste à 3 crans d’écart maximum.',
  },
  R3: {
    id: 'R3',
    severity: 'blocking' as const,
    delta: -30,
    message: 'Blanc optique : trop dur. Prends du blanc cassé.',
  },
  R4: {
    id: 'R4',
    severity: 'strong' as const,
    delta: -15,
    message:
      'La couche du dessus doit être plus foncée ou d’intensité égale. Là ça élargit les épaules vers l’extérieur.',
  },
  R5: {
    id: 'R5',
    severity: 'strong' as const,
    delta: -15,
    maxNonNeutralFamilies: 2,
    message: 'Trois couleurs qui se disputent. Garde-en une et neutralise le reste.',
  },
  R6: {
    id: 'R6',
    severity: 'strong' as const,
    delta: -15,
    message:
      'Ton sur ton sans contraste de matière = effet pyjama. Change la matière d’une des deux pièces.',
  },
  R7: {
    id: 'R7',
    severity: 'soft' as const,
    delta: -8,
    maxFormalityGap: 1,
    message:
      'Écart de formalité trop grand. Reste à un cran : casual avec smart-casual, pas baskets avec costume.',
  },
  R8: {
    id: 'R8',
    severity: 'soft' as const,
    delta: -8,
    message: 'Deux bleus qui se ressemblent trop sans se répondre.',
  },
  R9: {
    id: 'R9',
    severity: 'soft' as const,
    delta: -8,
    darkFrom: 4,
    message: 'Tenue trop uniformément sombre, ça écrase.',
  },
  R10: {
    id: 'R10',
    severity: 'soft' as const,
    delta: -8,
    message:
      'Saisons incohérentes : aucune saison commune entre les pièces. Sors le manteau ou change le short.',
  },
  B1: {
    id: 'B1',
    severity: 'bonus' as const,
    delta: 10,
    message: 'Le bleu près du visage allume tes yeux. Ta meilleure carte.',
  },
  B2: {
    id: 'B2',
    severity: 'bonus' as const,
    delta: 8,
    message: 'La superposition allonge ton buste. Garde ce réflexe.',
  },
  B3: {
    id: 'B3',
    severity: 'bonus' as const,
    delta: 5,
    message: 'Monochrome texturé : même couleur, matières différentes. Ça tient.',
  },
  B4: {
    id: 'B4',
    severity: 'bonus' as const,
    delta: 5,
    minNeutralPieces: 2,
    message: 'Formule neutre + neutre + un seul accent. C’est la structure la plus lisible.',
  },
} as const

export const SCORE = {
  start: 100,
  cap: 100,
  floor: 0,
  compatibleMin: 70,
  todayMin: 80,
  reasonCount: 3,
  staleDays: 14,
}

export const CATEGORY_LABELS: Record<string, string> = {
  top: 'Haut',
  bottom: 'Bas',
  layer: 'Couche',
  shoes: 'Chaussures',
  accessory: 'Accessoire',
}

export const ATELIER_COLUMNS = ['top', 'bottom', 'layer', 'shoes'] as const

export const SUBCATEGORIES: Record<string, string[]> = {
  top: ['tee', 'polo', 'chemise', 'chemise oxford', 't-shirt', 'marcel'],
  bottom: ['chino', 'jean', 'short', 'pantalon', 'pantalon laine'],
  layer: ['pull', 'surchemise', 'veste', 'cardigan', 'blazer', 'manteau'],
  shoes: ['baskets', 'boots', 'espadrilles', 'derbies', 'mocassins', 'sandales'],
  accessory: ['ceinture', 'montre', 'écharpe', 'lunettes', 'bonnet'],
}

export const MATERIALS = [
  'coton',
  'lin',
  'oxford',
  'denim',
  'maille',
  'laine',
  'cuir',
  'daim',
  'viscose',
  'nylon',
]

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44', 'unique']

export const BRANDS = [
  'Uniqlo',
  'COS',
  'Arket',
  'A.P.C.',
  'Sandro',
  'Sézane',
  'Zara',
  'Mango',
  'Massimo Dutti',
  'Levi’s',
]

export const SEASON_LABELS: Record<string, string> = {
  été: 'Été',
  'mi-saison': 'Mi-saison',
  hiver: 'Hiver',
}

export const FORMALITY_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Casual',
  2: 'Smart casual',
  3: 'Habillé',
}

export const MONTH_TO_SEASON: Record<number, 'été' | 'mi-saison' | 'hiver'> = {
  1: 'hiver',
  2: 'hiver',
  3: 'mi-saison',
  4: 'mi-saison',
  5: 'mi-saison',
  6: 'été',
  7: 'été',
  8: 'été',
  9: 'mi-saison',
  10: 'mi-saison',
  11: 'mi-saison',
  12: 'hiver',
}

export const STORAGE_KEY = 'dress.v1'
export const DATA_VERSION = 2 as const

export const DEFAULT_TAGS: { id: string; label: string }[] = [
  { id: 'ete', label: 'été' },
  { id: 'hiver', label: 'hiver' },
  { id: 'soleil', label: 'soleil' },
  { id: 'pluie', label: 'pluie' },
  { id: 'soiree', label: 'soirée' },
  { id: 'travail', label: 'journée au travail' },
  { id: 'sport', label: 'sport' },
]

export function isNeutralFamily(family: string): boolean {
  return family.startsWith(NEUTRAL_FAMILY_PREFIX)
}

export function getColor(id: string): ColorDef | undefined {
  return PALETTE.find((c) => c.id === id) as ColorDef | undefined
}

export function currentSeason(date = new Date()): 'été' | 'mi-saison' | 'hiver' {
  return MONTH_TO_SEASON[date.getMonth() + 1] ?? 'mi-saison'
}
