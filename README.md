# LLAStudio Launcher (LemonLimeAcid)

Launcher desktop officiel **LLAStudio** construit avec **Tauri v2 + React + TypeScript + Tailwind CSS + Lucide Icons**.

## Identité visuelle

- **Dark mode industriel ultra-net** (grille, bordures 1px, monospace technique)
- Palette :
  - Fond principal : `#0B0C0E`
  - Cartes / Sidebar : `#121418` (bordure `#22262E`, lumineuse au survol)
  - Lemon : `#E5FF00` (micro-utilities, badges `UPDATE AVAILABLE`, alertes)
  - Lime : `#39FF14` (Visual Studios & AI, actions principales, indicateurs actifs)
  - Acid : `linear-gradient(135deg, #E5FF00 0%, #39FF14 100%)` (logo, éléments mis en avant)
  - Texte : `#F3F4F6` / secondaire `#8B949E`

## Architecture des fichiers

```text
.
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ tsconfig.json
├─ vite.config.ts
├─ README.md
├─ src/
│  ├─ main.tsx                     # Entrée React
│  ├─ App.tsx                      # Orchestration état/UI, checks périodiques, actions install/update
│  ├─ index.css                    # Tailwind + styles globaux (grid, scrollbar, markdown)
│  ├─ types.ts                     # Types catalogue, releases, installs, UI, settings
│  ├─ data/
│  │  └─ catalog.ts                # Catalogue officiel LLAStudio (5 apps, repos & API GitHub)
│  ├─ services/
│  │  ├─ githubUpdater.ts          # Service auto-updater GitHub (release/tag/commit, SemVer, assets OS, cache)
│  │  └─ storage.ts                # Persistance locale (settings, cache updates), helpers formatage
│  ├─ lib/
│  │  └─ desktop.ts                # Pont Tauri (invoke/events) + fallbacks navigateur pour preview
│  └─ components/
│     ├─ Sidebar.tsx               # Navigation fixe 240px, sync GitHub, check updates, paramètres
│     ├─ Topbar.tsx                # UPDATE ALL, tri, recherche, switch grille/liste
│     ├─ AppCard.tsx               # Carte app (header version, GitHub, actions, progression install)
│     ├─ AppDetailsModal.tsx        # Modale détails (notes Markdown, versions installées, assets, actions)
│     └─ SettingsModal.tsx         # Paramètres (GitHub PAT, intervalle de vérification)
└─ src-tauri/
   ├─ Cargo.toml
   ├─ build.rs
   ├─ tauri.conf.json
   ├─ capabilities/
   │  └─ default.json              # Permissions Tauri v2
   └─ src/
      ├─ main.rs                   # Entrée desktop
      └─ lib.rs                    # Commandes natives: état installs, download+progress, launch, open, uninstall
```

## Fonctionnalités principales

### UI hybride Unity Hub + ArtCraft
- **Sidebar gauche fixe (240px)** : logo LLAStudio, navigation `Applications`, `Lemon`, `Lime`, `Installs`, `Releases`, état de sync GitHub, bouton `Check for Updates`, Paramètres.
- **Topbar** : `UPDATE ALL (X)` dynamique, tri (`Name A-Z`, `Recently Updated`, `Updates First`), recherche instantanée, vue **Grille/Liste**.
- **Cartes applications** :
  - Version locale / comparaison `vX.Y.Z → vA.B.C` en Lemon si mise à jour disponible
  - Lien `GITHUB ↗` vers le repo exact
  - Métadonnées (last updated, release size, langage)
  - États : à jour (`OPEN` + menu), mise à jour (`UPDATE AVAILABLE` + `OPEN` + `UPDATE TO`), non installée (`INSTALL` + barre de progression)
- **Modale de détails** : notes de version Markdown depuis GitHub, liste des assets, sélecteur de versions installées (active), actions ouvrir/dossier/désinstaller, lien repo.

### Catalogue officiel LLAStudio
1. **PipeCraft** (Lime, TypeScript) — `https://github.com/LLAStudio/PipeCraft`
2. **Lime AI** (Lime, JavaScript) — `https://github.com/LLAStudio/lime-ai`
3. **LemonPort** (Lemon, Rust) — `https://github.com/LLAStudio/LemonPort`
4. **LemonWatch** (Lemon, Rust) — `https://github.com/LLAStudio/LemonWatch`
5. **AcidMade** (Acid, Core) — `https://github.com/LLAStudio/AcidMade`

> Les URLs sont normalisées vers l'organisation `LLAStudio` pour un accès API/repos fonctionnel.

### Auto-updater GitHub (`src/services/githubUpdater.ts`)
- **Vérification au démarrage** + **périodique** (par défaut toutes les 30 min, configurable).
- **Stratégie de détection** :
  1. `GET /repos/{owner}/{repo}/releases/latest`
  2. Fallback `GET /repos/{owner}/{repo}/tags?per_page=1` si aucune release publiée
  3. Fallback dernier commit de la branche par défaut si aucun tag
- **Comparaison SemVer** : normalisation du préfixe `v` et comparaison via `semver` (`v0.12.0` vs `v0.13.0`).
- **Assets** : extraction des assets de release, sélection automatique selon l'OS (`.exe/.msi` Windows, `.dmg` macOS, `.AppImage/.deb` Linux), affichage de la taille.
- **Cache & sync** : cache local (`localStorage`) avec horodatage par app (`CHECKED ... USING GITHUB API`), réutilisé en cas d'erreur réseau/rate-limit.
- **Rate-limit GitHub** : champ `GitHub Personal Access Token` dans les Paramètres (envoyé en `Authorization: Bearer ...`).

### Backend Tauri (`src-tauri/src/lib.rs`)
Commandes natives exposées au frontend :
- `get_all_install_states` / `get_install_state` : lecture des installations locales
- `download_and_install` : téléchargement d'asset avec événements `download-progress` (pour barre temps réel), enregistrement de la version active
- `launch_app` : ouverture/lancement de la version active ou sélectionnée
- `open_external` / `open_path` : ouverture repo GitHub et dossiers locaux
- `set_active_version` / `uninstall_version` : gestion multi-versions (style Unity Hub)

Les installations sont stockées dans le dossier de données de l'application (`app_data_dir/apps/<appId>/<version>/...`) avec un index `installs.json`.

## Installation & développement

### Prérequis
- Node.js 18+
- Rust stable + toolchain système pour Tauri v2
- Dépendances système Tauri (WebView2 sur Windows, etc.)

### Lancer en développement
```bash
npm install
npm run tauri:dev
```

### Build desktop
```bash
npm install
npm run tauri:build
```

### Mode web (UI preview)
```bash
npm install
npm run dev
```
En mode navigateur, les actions natives (install/launch/open folder) utilisent des fallbacks/mocks pour permettre le développement UI ; la détection des mises à jour GitHub fonctionne côté frontend.

## Notes
- Ajoutez les icônes d'application dans `src-tauri/icons/` et référencez-les dans `tauri.conf.json` avant un build de production.
- Les URLs du catalogue pointent vers `github.com/LLAStudio/<repo>` (corrigées pour être fonctionnelles). Adaptez `src/data/catalog.ts` si les dépôts réels diffèrent.
- Pour les dépôts sans release publiée, l'updater bascule automatiquement sur les tags puis sur le dernier commit de la branche par défaut.
