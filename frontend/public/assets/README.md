# 🎨 Assets - Sprites et Textures personnalisés

Ce dossier contient tous les assets visuels personnalisables du jeu.

## 📂 Structure des dossiers

```
assets/
├── sprites/              # Sprites des joueurs
├── textures/            # Textures des plateformes
└── backgrounds/         # Images de fond
```

## 🖼️ Guide de création des sprites

### Sprites des Joueurs

**Emplacement** : `sprites/`

| Fichier | Description | Dimensions | Format |
|---------|-------------|------------|--------|
| `player1.png` | Sprite du Joueur 1 (Rouge) | 30x40 px | PNG avec transparence |
| `player2.png` | Sprite du Joueur 2 (Bleu) | 30x40 px | PNG avec transparence |

**Conseils de design** :
- Utilisez la transparence pour les bords arrondis
- Les sprites seront redimensionnés automatiquement
- Pensez à ajouter des détails qui permettent de voir la direction
- Vous pouvez utiliser des couleurs distinctes pour chaque joueur

### Textures des Plateformes

**Emplacement** : `textures/`

| Fichier | Type | Dimensions | Notes |
|---------|------|------------|-------|
| `platform_neutral.png` | Plateforme normale | 32x32 ou 64x64 px | Gris, pierre, métal |
| `platform_fire.png` | Plateforme de feu | 32x32 ou 64x64 px | Rouge, orange, lave |
| `platform_water.png` | Plateforme d'eau | 32x32 ou 64x64 px | Bleu, cyan, liquide |
| `platform_ice.png` | Plateforme de glace | 32x32 ou 64x64 px | Blanc, bleu clair |

**Conseils de design** :
- Les textures doivent être **tileable** (se répéter sans couture visible)
- Format PNG recommandé
- Utilisez des motifs qui se répètent bien horizontalement et verticalement
- Les textures seront répétées pour remplir les plateformes

### Fond d'écran

**Emplacement** : `backgrounds/`

| Fichier | Description | Dimensions | Format |
|---------|-------------|------------|--------|
| `background.png` | Fond du jeu | 800x600 px | PNG ou JPG |

**Conseils de design** :
- Le fond doit être visible mais pas trop chargé pour ne pas gêner le gameplay
- Utilisez des couleurs sombres pour que les joueurs et plateformes ressortent
- Un fond avec de la profondeur (parallaxe visuel) fonctionne bien
- Évitez les couleurs trop vives qui pourraient distraire

## 🎨 Outils recommandés

- **Pixel Art** : Aseprite, Piskel, GIMP
- **Design** : Photoshop, GIMP, Krita
- **Gratuit en ligne** : Piskel.app, Pixilart

## 📝 Workflow rapide

1. Créez vos sprites avec votre outil préféré
2. Exportez en PNG (avec transparence si nécessaire)
3. Respectez les dimensions recommandées
4. Placez les fichiers dans les bons dossiers
5. Rechargez le jeu (F5) pour voir vos sprites

## ⚠️ Important

- **Nommage** : Les noms de fichiers doivent correspondre exactement (sensible à la casse)
- **Format** : PNG recommandé pour la transparence
- **Fallback** : Si un sprite manque, le jeu utilisera le rendu par défaut
- **Git** : N'oubliez pas de commit vos assets si vous les partagez !

## 🎯 Exemples d'idées

### Thèmes possibles
- **Médiéval** : Chevaliers, châteaux, pierre
- **Spatial** : Astronautes, planètes, étoiles
- **Rétro** : Style 8-bit, arcade
- **Nature** : Animaux, forêts, plantes
- **Cyberpunk** : Néons, robots, futuriste

### Packs de sprites gratuits
- OpenGameArt.org
- Itch.io (assets gratuits)
- Kenney.nl
- CraftPix.net (certains gratuits)

## 🔗 Ressources utiles

- [Tutorial Pixel Art](https://www.piskelapp.com/p/agxzfnBpc2tlbC1hcHByEwsSBlBpc2tlbBiAgKDaxvTlCgw/edit)
- [Guide sur les textures tileable](https://design.tutsplus.com/tutorials/how-to-create-seamless-textures-in-gimp--cms-28048)
- [Palette de couleurs](https://lospec.com/palette-list)

---

**Bon design ! 🎨**
