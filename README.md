# DRESS

App locale de garde-robe et d’assemblage de tenues. Un utilisateur, pas de
backend, pas de compte. Les données vivent dans `localStorage`. Export / import
JSON pour ne jamais les perdre.

## Lancer

```bash
npm install
npm test
npm run dev
```

Build de production : `npm run build` puis `npm run preview`.

Fonctionne hors-ligne une fois chargée (Vite + assets locaux, aucune police
réseau).

## Usage

1. **Mes vêtements** — chaque pièce a un type, une couleur, une marque, une
   taille, une saison et une photo. Filtres + regroupement par ces champs.
2. **Atelier** — clique un haut, un bas, une couche, des chaussures. Score en
   direct. Filtre « compatible seulement » (score ≥ 70). Tags d’usage.
3. **Mes tenues** — tri par score, « Porté le », modifier / supprimer, tags.
   Warning si une tenue n’a aucun tag.
4. **Aujourd’hui** — 3 propositions (score ≥ 80, saison du mois, pas portées
   depuis 14 jours). Si moins de 3, le diagnostic dit ce qui manque.
5. **Analyse** — répartition couleur / catégorie, pièces jamais portées,
   trous de garde-robe.

Supprimer un vêtement (jeté, vendu) : si la pièce est dans des tenues, l’app
demande par quoi la remplacer — les tenues ne restent pas cassées.

Export / Import en haut à droite.

## Moteur

Fonction pure `evaluateOutfit(garments)` dans `src/engine/evaluateOutfit.ts`.
Aucune règle n’est écrite dans les composants React.

Palette et barème (pénalités, messages, seuils) : **`src/config/dress.ts`** —
c’est le seul fichier à modifier pour ajuster les couleurs ou les règles.

Tests : `src/engine/evaluateOutfit.test.ts` (une assertion par règle R1–R10
et B1–B4).
