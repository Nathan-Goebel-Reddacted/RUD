# Tickets V1 — API Dashboard Builder

## Socle

**RUD005 — Persistance du profil (localStorage)** ✅
Sauvegarder le profil dans `localStorage` à chaque `setProfile`, le recharger au démarrage. Aujourd'hui le profil est perdu à chaque rechargement.

**RUD006 — Guard de route** ✅
Rediriger vers `/no-profile` si aucun profil n'est chargé et que l'utilisateur accède à `/dashboard`, `/api-config` ou `/display` directement.

**RUD007 — Feedback d'erreur dans le formulaire de profil** ✅
`IsProfileValid()` retourne des `ActionResult` avec des codes d'erreur mais rien n'est affiché dans l'UI. Afficher les messages sous les champs concernés.

**RUD007b — Édition et réinitialisation du profil** ✅
Ajouter un bouton "Modifier le profil" accessible depuis le dashboard (navbar ou menu). Permet de modifier les champs du profil existant (nom, langue, couleurs) sans repartir de zéro. Ajouter également un bouton "Supprimer le profil" qui vide le localStorage et redirige vers `/no-profile`.

**RUD008 — Migration vers Zustand** ✅
Installer Zustand et migrer `ProfileContext` vers un store Zustand (`useProfileStore`). Le store gère la persistance localStorage (middleware `persist`) en remplacement du mécanisme manuel de RUD005. Supprimer `ProfileContext` et `ProfileProvider` une fois la migration faite. Tous les composants qui consomment `useProfile()` passent sur `useProfileStore()`.

---

## Page API Config

**RUD009 — Modèle de données API** ✅
Créer la classe `ApiConnection` (baseUrl, headers, auth type, endpoints[]) et l'intégrer dans le store Zustand. Fondation de tout ce qui suit.

**RUD010 — Formulaire d'ajout d'une API** ✅
UI pour saisir : base URL, headers custom, type d'auth (Bearer / API Key / aucune). Validation + `ActionResult`.

**RUD011 — Gestion des endpoints** ✅
Ajouter/supprimer des endpoints manuellement (path, méthode GET/POST, label). Liste affichée sous la config API.

**RUD011b — Formulaire endpoint style Swagger** ✅
Refonte visuelle du formulaire de création/édition d'endpoint : badge HTTP coloré par méthode (via CSS variables), barre route proéminente, paramètres en tableau structuré (Nom / Type / Requis / Défaut), Request Body style code editor.

**RUD012 — Import Swagger/OpenAPI** ✅
Upload d'un fichier JSON/YAML, parsing via `js-yaml`, import automatique des endpoints dans la config (base URL, auth, path params, query params, request body).

**RUD013 — Test de connexion** ✅
Bouton "Send" par endpoint : fetch réel, affichage du code HTTP + aperçu de la réponse inline. Détection CORS avec message explicite. Badges méthode colorés dans la liste.

---

## Dashboard Editor

**RUD014 — Modèle Widget** ✅
Créer l'interface `Widget` (id, type, endpointId, dataPath, position `{x,y,w,h}`, config chart). Intégrer dans le store Zustand.
- `src/types/widget.ts` : types Widget, Dashboard, WidgetConfig (discriminated union), WidgetDataState, FetchCacheEntry
- `src/stores/dashboardStore.ts` : store Zustand persisté (localStorage "rud-dashboard"), fetchCache runtime non-persisté

**RUD014b — Validation widget** ✅
Validation intégrée dans WidgetConfigPanel (label requis, connectionId + endpointId requis avant save).

**RUD015 — Grille de layout** ✅
CSS Grid absolue 12 colonnes, row height 80px. dnd-kit drag-and-drop via `DashboardGrid.tsx`.

**RUD015b — Toolbar éditeur** ✅
`DashboardToolbar.tsx` : titre éditable inline, sélecteur refresh interval, boutons "Add widget" et "▶ Display".

**RUD016 — Widget Number Card** ✅
`src/components/Widget/types/NumberCard.tsx` : valeur numérique + unité + décimales configurables.

**RUD017 — Widget Table** ✅
`src/components/Widget/types/Table.tsx` : tableau auto-colonnes ou colonnes configurées, maxRows.

**RUD018 — Widget Bar Chart / Line Chart** ✅
`src/components/Widget/types/BarChart.tsx` + `LineChart.tsx` via recharts. Multi-séries pour line chart.

**RUD019 — Panneau de configuration widget** ✅
`WidgetConfigPanel.tsx` (modal) + `EndpointSelector.tsx` (connexion → endpoint imbriqué) + `DataPathInput.tsx` (JSONPath + preview live) + `AxisKeySelector.tsx` (clés auto-détectées depuis réponse API).

**RUD019b — Sélecteur endpoint imbriqué** ✅
Intégré dans EndpointSelector : select connexion → select endpoint filtré.

---

## Page Display (fullscreen)

**RUD020 — Fetch live data** ✅
`src/services/widgetFetch.ts` (fetch + JSONPath via jsonpath-plus, states erreur) + `src/hooks/useWidgetData.ts` (polling, AbortController, cache déduplication par clé `connectionId::endpointId`).

**RUD021 — Vue fullscreen** ✅
`src/pages/displayDashboard.tsx` : grille read-only des widgets avec données live. `src/hooks/useFullscreen.ts` : requestFullscreen + fallback webkit + bouton toggle.

**RUD022 — Auto-refresh** ✅
Intégré dans `useWidgetData` : setInterval + AbortController, refresh global dashboard ou override par widget (`refreshOverride`). Déduplication fetch par cache (90% freshness threshold).

---

## Export / Import

**RUD023 — Export sauvegarde profil JSON** ✅
Bouton "Export" dans la navbar. Génère un fichier JSON contenant profile + connexions API + dashboard courant.
Format : `{ version, exportedAt, profile, connections, dashboard }`.
Service `src/services/profileBackup.ts` → `exportBackup()`. Déclenche un téléchargement via Blob + lien temporaire.

**RUD023b — Import sauvegarde profil JSON** ✅
Bouton "Import Profile" sur la page `/no-profile` (déjà stub). Ouvre un sélecteur de fichier `.json`, lit le contenu, appelle `importBackup()`, restaure les trois stores (profile, connexions, dashboard), redirige vers `/dashboard`.
Afficher un message d'erreur si le fichier est invalide.

---

## Nouveaux types de widgets

**RUD024 — Widget Text statique** ✅
Nouveau type `text` : affiche un texte libre configurable (textarea + taille de police optionnelle). Pas de connexion API requise — widget statique, ne déclenche pas de fetch.

**RUD025 — Widget Raw Response** ✅
Nouveau type `raw-response` : affiche la réponse JSON brute de l'endpoint dans un `<pre>` scrollable. Utile pour le debug.

**RUD026 — Sélecteur de colonnes visibles (Table)** ✅
Config widget Table : cases à cocher pour choisir les colonnes affichées + label éditable par colonne. Toggle "Show column headers" (sticky thead). Bouton "Clear — show all columns".

**RUD027 — Agrégation count (Bar Chart)** ✅
Option "Count rows by X key" sur le bar chart : groupe les données par la clé X et compte les occurrences. Permet d'afficher une distribution (ex: nombre de cartes par CMC depuis Scryfall).

**RUD028 — Display fullscreen fit** ✅
Page Display : suppression des marges, hauteur des lignes dynamique via ResizeObserver pour que les widgets remplissent exactement l'écran. Padding uniforme 6px autour de la grille.

---

## Phase 1 Cleanup

**RUD029 — Nettoyage Phase 1 : i18n, CSS, Navbar, corrections critiques** ✅
~50 textes UI branchés sur `t()`, zone hover navbar 4px→34px, `--danger-color` CSS var, typo "RRole" corrigée.

---

# Tickets V2 — Phase 2

## Fondation multi-dashboard

**RUD030 — Migration store : Profile → dashboards[]** ✅
Breaking change architectural. Remplacer le dashboard unique (`dashboardStore`) par un tableau `dashboards[]` dans le store profil (ou un store dédié). Chaque dashboard contient ses propres widgets. Migrer la persistance localStorage. Adapter toutes les lectures/écritures du dashboard courant vers un index actif `activeDashboardIndex`.

**RUD031 — Bulles de navigation (Editor)** ✅
Ajouter en bas de l'Editor une rangée de bulles représentant chaque dashboard. Clic = switch vers ce dashboard. Bouton `+` = créer un nouveau dashboard vide. Drag-and-drop (dnd-kit) pour réordonner. Suppression via bouton sur la bulle active — bloquée si un seul dashboard reste.

**RUD032 — Duplications (dashboard + widget)** ✅
- Dashboard : bouton "Dupliquer" dans la liste des dashboards (Edit Profile > onglet Dashboards). Clone le dashboard actif avec tous ses widgets (nouveaux IDs générés).
- Widget : bouton "Dupliquer" dans le menu d'un widget (WidgetCard header). Clone le widget avec décalage de position.

**RUD033 — Edit Profile : refonte en onglets** ✅
Restructurer la modal/page Edit Profile en 3 onglets :
- **Profil** : nom, langue (contenu existant)
- **Display** : mode switch (`timer` | `scroll-end`), intervalle en secondes, vitesse auto-scroll (px/s)
- **Dashboards** : liste des dashboards avec réordonner (drag) et supprimer (bloqué si unique)

---

## Display mode — évolutions

**✅ RUD034 — Auto-scroll display**
En mode Display : faire défiler verticalement la grille à vitesse constante (configurable dans Display settings, en px/s). Le scroll repart en haut à chaque changement de dashboard. Pause si la souris survole l'écran.
**Mobile :** la grille affiche 4 rows visibles en paysage (hauteur dynamique via ResizeObserver, même mécanisme que RUD028). L'auto-scroll donne accès aux rows suivantes sans redimensionner la grille.

**✅ RUD035 — Rotation automatique des dashboards (Display)**
Enchaîner les dashboards automatiquement en mode Display. Deux modes configurables (Display settings) :
- `timer` : passage au dashboard suivant après N secondes
- `scroll-end` : passage au dashboard suivant quand le scroll atteint le bas
Boucle infinie (dernier → premier).

**✅ RUD036 — Wake Lock + orientation mobile + bulles (Display)**
- Wake Lock API : activer `navigator.wakeLock.request('screen')` à l'entrée en Display, relâcher à la sortie. Fallback silencieux si non supporté.
- **Orientation mobile :** `screen.orientation.lock('landscape')` au chargement de `/display` sur mobile. Fallback : message "Please rotate your device" si non supporté (iOS Safari sans PWA installée).
- Bulles semi-transparentes en bas de l'écran Display : indiquent le dashboard actif, clic = switch manuel (interrompt la rotation automatique jusqu'au prochain cycle).

---

## Widgets natifs

**RUD037 — Widget Horloge**
Nouveau type natif `clock` : affiche l'heure en temps réel (format 24h / 12h configurable). Mise à jour chaque seconde via `setInterval`. Pas de connexion API.

**RUD038 — Widget Dernière MAJ**
Nouveau type natif `last-update` : affiche le timestamp de la dernière réponse reçue par un endpoint sélectionné (ou le fetch global du dashboard). Format d'affichage configurable ("il y a Xs" / timestamp absolu).

---

## Widgets API — évolutions

**RUD039 — Widget HealthCheck**
Nouveau type `health-check` : ping un endpoint, affiche OK (vert) / KO (rouge) selon le code HTTP reçu. Codes considérés "OK" configurables (défaut : 2xx). Refresh selon l'intervalle global. Pas de dataPath — juste le statut HTTP.

**RUD040 — Seuils visuels**
Ajouter une config optionnelle `threshold` sur les widgets **NumberCard**, **HealthCheck** et **BarChart** :
- Définir des paliers (valeur + couleur : vert / orange / rouge)
- Le widget change de couleur selon la valeur courante
- Config dans le WidgetConfigPanel, section "Thresholds"

**RUD041 — Historique runtime (NumberCard + LineChart)**
Sur les widgets **NumberCard** et **LineChart** uniquement : option "Keep history" + `maxPoints` (défaut 50). Stocker les N dernières valeurs en mémoire runtime (non persisté). NumberCard affiche une mini sparkline sous la valeur. LineChart utilise l'historique au lieu de la réponse courante.

---

## QR Code profil

**RUD042 — QR Code profil (export URL)**
- Encoder le profil en JSON, compresser (LZ-string), encoder en base64.
- Générer l'URL : `${window.location.origin}/#/import?data=<base64>`. Le hash n'est jamais envoyé au serveur — les données du profil restent 100% côté client.
- Générer un QR code depuis cette URL (lib : `qrcode.react`).
- **Bouton navbar** : ouvre une modal avec le QR code. Warning si profil compressé > ~2KB (limite densité QR ~2.9KB).
- Sur `/no-profile` : détecter `/#/import?data=...` dans l'URL, décoder + importer automatiquement, rediriger vers `/display`.
- Profils légers (~10 widgets, 1-2 connexions) ≈ 400-800 bytes compressés → QR lisible. Profils lourds (>3KB) → warning explicite, pas de QR généré.

---

## PWA & Déploiement

**RUD044 — PWA (Progressive Web App)**
`vite-plugin-pwa` + manifest + service worker. Objectifs :
- App installable sur mobile ("Ajouter à l'écran d'accueil") → bannière affichée sur `/display` après import de profil via QR code
- Offline : app fonctionnelle depuis le cache service worker après premier chargement
- Nécessaire pour `screen.orientation.lock()` sur iOS Safari (uniquement disponible en mode PWA fullscreen)
- Le build display-only (RUD043) est la cible prioritaire pour le mode PWA

**RUD043 — Docker nginx:alpine + build display-only**
- `Dockerfile` : build React (`npm run build`) + `nginx:alpine` servant le `dist/`. Image < 20MB visée.
- `docker-compose.yml` : 2 services :
  - `rud-full` : build complet (Editor + Config + Display), port 8080
  - `rud-display` : build display-only via `VITE_MODE=display`, port 8081
- `vite.config.ts` : feature flag `VITE_MODE`. En mode `display` : exclure dnd-kit, les pages Editor/ApiConfig, tous les composants d'édition. Conserver uniquement : import JSON, Display, widgets read-only.
- `npm run build:display` dans `package.json`.

---

## Ordre d'implémentation suggéré (Phase 2)

```
RUD030 (migration store) → RUD031 (bulles editor) → RUD033 (edit profile onglets)
→ RUD032 (duplications)
→ RUD034 (auto-scroll + mobile 4 rows) → RUD035 (rotation) → RUD036 (wake lock + orientation + bulles)
→ RUD037 (widget horloge) → RUD038 (widget dernière MAJ)
→ RUD039 (health check) → RUD040 (seuils) → RUD041 (historique runtime)
→ RUD042 (QR code)
→ RUD043 (docker) → RUD044 (PWA)
```

RUD030 est bloquant pour tout ce qui touche au multi-dashboard.
RUD033 peut être fait en parallèle de RUD031-032.
RUD044 (PWA) dépend de RUD043 (build display-only comme cible PWA prioritaire).
