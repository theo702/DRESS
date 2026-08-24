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

1. **Garde-robe** — ajoute tes pièces (type, couleur, marque, taille, saison,
   photo). La couleur se choisit par pastilles. Les teintes interdites (noir,
   blanc optique, camel…) sont barrées mais sélectionnables : le moteur les
   signalera toujours.
2. **Atelier** — clique un haut, un bas, une couche, des chaussures. Le score
   se recalcule en direct. Filtre « compatible seulement » : masque ce qui
   ferait tomber le score sous 70.
3. **Tenues** — historique trié par score, bouton « Porté le », filtre
   jamais portées / pas portées depuis 14 jours.
4. **Aujourd’hui** — 3 propositions (score ≥ 80, saison du mois, pas portées
   depuis 14 jours). Si moins de 3, le diagnostic dit ce qui manque.
5. **Analyse** — répartition couleur / catégorie, pièces jamais portées,
   trous de garde-robe.

Export / Import en haut à droite. Archivage des pièces : pas de suppression
dure.

## Moteur

Fonction pure `evaluateOutfit(garments)` dans `src/engine/evaluateOutfit.ts`.
Aucune règle n’est écrite dans les composants React.

Palette et barème (pénalités, messages, seuils) : **`src/config/dress.ts`** —
c’est le seul fichier à modifier pour ajuster les couleurs ou les règles.

Tests : `src/engine/evaluateOutfit.test.ts` (une assertion par règle R1–R10
et B1–B4).
