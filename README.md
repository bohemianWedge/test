# 2D Puzzle Battle Game - ft_transcendence

Un jeu multijoueur 2D en temps réel où deux joueurs s'affrontent dans des puzzles de type Fireboy & Watergirl tout en pouvant se gêner mutuellement avec des projectiles.

## 🎮 Caractéristiques

- **Multijoueur en temps réel** via WebSocket
- **Puzzles de plateforme** avec boutons, portes et obstacles
- **Système de projectiles** pour perturber l'adversaire
- **Physique 2D** avec gravité et collisions
- **Architecture Transcendance** conforme aux exigences de 42

## 🎯 Règles du jeu

- Deux joueurs s'affrontent sur une carte de puzzle
- Le but : atteindre votre zone d'objectif (GOAL) avant l'adversaire
- Activez les boutons pour ouvrir les portes
- Tirez des projectiles pour renvoyer votre adversaire à son point de départ
- Premier joueur à atteindre son objectif gagne!

## 🕹️ Contrôles

### Joueur 1 (Rouge)
- **W/A/S/D** : Déplacement (haut/gauche/bas/droite)
- **E** : Tirer un projectile
- **W + E** : Tirer vers le haut
- **S + E** : Tirer vers le bas

### Joueur 2 (Bleu)
- **Flèches** : Déplacement
- **Entrée** : Tirer un projectile
- **Flèche Haut + Entrée** : Tirer vers le haut
- **Flèche Bas + Entrée** : Tirer vers le bas

## 🚀 Installation et lancement

### Prérequis
- Docker
- Docker Compose

### Lancement avec Docker

```bash
# Construire et lancer tous les services
docker-compose up --build

# Ou en arrière-plan
docker-compose up -d --build
```

### Accès au jeu

- **Frontend** : http://localhost:8080
- **Backend WebSocket** : http://localhost:3000

### Arrêter le jeu

```bash
docker-compose down
```

## 🏗️ Architecture

```
transcendence/
├── backend/                 # Backend NestJS
│   ├── src/
│   │   ├── game/           # Logique du jeu
│   │   │   ├── game.gateway.ts      # WebSocket gateway
│   │   │   ├── game.service.ts      # Moteur de jeu
│   │   │   ├── game.types.ts        # Types TypeScript
│   │   │   └── levels.ts            # Définition des niveaux
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Frontend (Canvas + WebSocket)
│   ├── public/
│   │   ├── index.html
│   │   └── game.js
│   └── Dockerfile
└── docker-compose.yml
```

## 🎨 Technologies

### Backend
- **NestJS** : Framework Node.js
- **Socket.IO** : WebSocket pour temps réel
- **TypeScript** : Typage statique

### Frontend
- **Canvas API** : Rendu 2D
- **Socket.IO Client** : Connexion WebSocket
- **Vanilla JavaScript** : Logique client

### Infrastructure
- **Docker** : Containerisation
- **PostgreSQL** : Base de données (prête pour extension)
- **Nginx** : Serveur web pour le frontend

## 🎲 Gameplay

### Éléments du niveau

- **Plateformes neutres (grises)** : Plateformes normales
- **Plateformes d'eau (cyan)** : Plateformes spéciales
- **Plateformes de feu (rouges)** : Plateformes spéciales
- **Boutons (vert/rouge)** : Appuyez pour ouvrir les portes
- **Portes (marron)** : S'ouvrent quand les boutons sont activés
- **Zones GOAL** : Atteignez votre objectif coloré pour gagner

### Mécaniques

- **Gravité** : Les joueurs tombent et peuvent sauter
- **Collisions** : Avec les plateformes, portes et projectiles
- **Projectiles** : Limite de 3 projectiles actifs par joueur
- **Respawn** : Retour au point de départ si touché par un projectile

## 🔧 Développement

### Lancer en mode dev

```bash
# Backend
cd backend
npm install
npm run start:dev

# Frontend (ouvrir index.html directement ou utiliser un serveur local)
cd frontend/public
python3 -m http.server 8080
```

## 📝 Conformité ft_transcendence

Ce projet respecte les exigences de ft_transcendence :

- ✅ Application web
- ✅ Backend moderne (NestJS)
- ✅ WebSocket pour le jeu en temps réel
- ✅ Architecture modulaire
- ✅ Containerisation Docker
- ✅ Support multijoueur
- ✅ Sécurité de base (CORS, validation)

## 🎯 Améliorations futures

- Système d'authentification
- Base de données pour scores/stats
- Multiples niveaux
- Système de matchmaking
- Mode spectateur
- Chat en jeu
- Effets sonores et musique
- Animations améliorées

## 📄 Licence

Projet éducatif pour 42 School - ft_transcendence

---

**Bon jeu ! 🎮**
