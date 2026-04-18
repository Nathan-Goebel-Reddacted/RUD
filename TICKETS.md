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

**✅ RUD037 — Widget Horloge**
Nouveau type natif `clock` : affiche l'heure en temps réel (format 24h / 12h configurable). Mise à jour chaque seconde via `setInterval`. Pas de connexion API.

**✅ RUD038 — Widget Dernière MAJ**
Nouveau type natif `last-update` : affiche le timestamp de la dernière réponse reçue par un endpoint sélectionné (ou le fetch global du dashboard). Format d'affichage configurable ("il y a Xs" / timestamp absolu).

---

## Widgets API — évolutions

**✅ RUD039 — Widget HealthCheck**
Nouveau type `health-check` : ping un endpoint, affiche OK (vert) / KO (rouge) selon le code HTTP reçu. Codes considérés "OK" configurables (défaut : 2xx). Refresh selon l'intervalle global. Pas de dataPath — juste le statut HTTP.

**✅ RUD040 — Seuils visuels**
Ajouter une config optionnelle `threshold` sur les widgets **NumberCard**, **HealthCheck** et **BarChart** :
- Définir des paliers (valeur + couleur : vert / orange / rouge)
- Le widget change de couleur selon la valeur courante
- Config dans le WidgetConfigPanel, section "Thresholds"

**✅ RUD041 — Historique runtime (NumberCard + LineChart)**
Sur les widgets **NumberCard** et **LineChart** uniquement : option "Keep history" + `maxPoints` (défaut 50). Stocker les N dernières valeurs en mémoire runtime (non persisté). NumberCard affiche une mini sparkline sous la valeur. LineChart utilise l'historique au lieu de la réponse courante.

---

## QR Code profil

✅ **RUD042 — QR Code profil (export URL)**
- Encoder le profil en JSON, compresser (LZ-string), encoder en base64.
- Générer l'URL : `${window.location.origin}/#/import?data=<base64>`. Le hash n'est jamais envoyé au serveur — les données du profil restent 100% côté client.
- Générer un QR code depuis cette URL (lib : `qrcode.react`).
- **Bouton navbar** : ouvre une modal avec le QR code. Warning si profil compressé > ~2KB (limite densité QR ~2.9KB).
- Sur `/no-profile` : détecter `/#/import?data=...` dans l'URL, décoder + importer automatiquement, rediriger vers `/display`.
- Profils légers (~10 widgets, 1-2 connexions) ≈ 400-800 bytes compressés → QR lisible. Profils lourds (>3KB) → warning explicite, pas de QR généré.

---

## PWA & Déploiement

✅ **RUD044 — PWA (Progressive Web App)**
`vite-plugin-pwa` + manifest + service worker. Objectifs :
- App installable sur mobile ("Ajouter à l'écran d'accueil") → bannière affichée sur `/display` après import de profil via QR code
- Offline : app fonctionnelle depuis le cache service worker après premier chargement
- Nécessaire pour `screen.orientation.lock()` sur iOS Safari (uniquement disponible en mode PWA fullscreen)
- Le build display-only (RUD043) est la cible prioritaire pour le mode PWA

✅ **RUD043 — Docker nginx:alpine + build display-only**
- `Dockerfile` : build React (`npm run build`) + `nginx:alpine` servant le `dist/`. Image < 20MB visée.
- `docker-compose.yml` : 2 services :
  - `rud-full` : build complet (Editor + Config + Display), port 8080
  - `rud-display` : build display-only via `VITE_MODE=display`, port 8081
- `vite.config.ts` : feature flag `VITE_MODE`. En mode `display` : exclure dnd-kit, les pages Editor/ApiConfig, tous les composants d'édition. Conserver uniquement : import JSON, Display, widgets read-only.
- `npm run build:display` dans `package.json`.

✅ **RUD045 — GitHub Pages deployment (display-only PWA)**
- Mode Vite `gh-pages` : `base: '/RUD/'`, manifest `start_url`/`scope` conditionnels, `navigateFallback`
- `BrowserRouter basename` dynamique via `import.meta.env.BASE_URL` (dans `main.tsx` et `main.display.tsx`)
- Script `build:gh-pages` dans `package.json`
- `.github/workflows/deploy-gh-pages.yml` : CI/CD auto sur push `main`, `404.html` trick, `.nojekyll`
- URL publique : `https://nathan-goebel-reddacted.github.io/RUD/`

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

---

# Tickets V3 — Phase 3

## Nouveaux widgets

**✅ RUD046 — Widget Gauge / Donut**
Nouveau type `gauge` : affiche une valeur numérique sous forme de jauge semi-circulaire ou donut (recharts `RadialBarChart` ou `PieChart` en mode semi-cercle). Config : valeur min/max, unité, couleur, seuils visuels (intégration RUD040). Idéal pour CPU, mémoire, taux d'occupation.

**✅ RUD047 — Widget Stat + tendance**
Nouveau type `stat` : valeur principale + delta vs valeur précédente (`+12%`, `-3 pts`). La valeur précédente est conservée en mémoire runtime (même mécanisme que RUD041). Config : format du delta (absolu ou pourcentage), couleur positive/négative. Très lisible sur écran mural pour les KPIs.

**✅ RUD048 — Widget Progress bar**
Nouveau type `progress` : barre de progression horizontale avec valeur texte optionnelle. Config : valeur min/max, label, couleur, affichage du pourcentage. Supporte les seuils RUD040 pour changer la couleur de la barre.

**✅ RUD049 — Widget Pie chart**
Nouveau type `pie` : camembert via `recharts PieChart`. Config : clé de label, clé de valeur, palette de couleurs personnalisable par slice. Agrégation `count` (comme RUD027) disponible pour distribution.

**~~RUD050 — Widget Status grid~~** ❌ Annulé — redondant avec health-check (1×1) + contradictions architecturales (N fetches par widget).

---

## Ergonomie éditeur

**✅ RUD051 — Resize widgets par drag**  Déjà implémenté — `ResizeHandle` (coin SE, drag pointer) dans `DashboardGrid.tsx`.

## Données & fetch

**✅ RUD052 — Transformations de données**
Dans `WidgetConfigPanel`, ajouter un champ optionnel "Transform" (expression JS sandboxée ou formule simple) appliqué après l'extraction JSONPath. Exemples : `value / 1024` (bytes → KB), `Math.round(value * 100) / 100`, `value + " °C"`. Évaluation via `new Function` avec timeout de sécurité ou un parseur d'expressions minimal. Prévisualisation live dans le panel.

**✅ RUD053 — Variables globales de profil**
Définir des variables nommées `{{nom}}` dans les settings du profil (onglet dédié). Utilisables dans les champs URL base, headers, path params, query params de tous les endpoints. Exemple : `{{env}}` = `prod` ou `staging`, `{{token}}` pour un token partagé entre plusieurs connexions. Substitution à la volée au moment du fetch, sans modifier le modèle stocké.

**✅ RUD054 — Support WebSocket**
Nouveau type de source `websocket` dans `ApiEndpoint` (en plus de GET/POST/…). Un endpoint WebSocket maintient une connexion persistante et pousse les messages reçus dans le cache du widget (même interface `WidgetDataState` que le polling). Config : URL `ws://` ou `wss://`, message d'abonnement JSON optionnel, JSONPath d'extraction. `useWidgetData` adapté pour gérer les deux modes (polling et ws).

**✅ RUD055 — Alertes visuelles sur seuil**
Quand un widget franchit un seuil configuré (RUD040) : déclencher une alerte visuelle — flash de bordure colorée, bannière temporaire en overlay sur la grille display, optionnellement une `Notification` browser (avec permission). Config par widget : activer/désactiver les alertes, délai de cooldown entre deux alertes (éviter le spam). Fonctionne uniquement en mode Display.

---

## Display

**✅ RUD056 — Animation sur changement de valeur**
Sur les widgets NumberCard, Stat et HealthCheck : déclencher une animation courte (fade, pulse ou highlight de couleur) quand la valeur change entre deux fetches. Implémenté via CSS transition + comparaison de la valeur précédente en ref. Désactivable globalement dans les Display settings (respect `prefers-reduced-motion`).

---

## Partage & collaboration

**✅ RUD057 — Marketplace de templates (GitHub)**
Repo ou dossier `templates/` dans le projet contenant des profils JSON de démonstration (Server monitoring, API publique, etc.). Page statique listant les templates avec preview (screenshot ou description). Import en un clic via le mécanisme QR/URL existant (RUD042). Contribution communautaire via PR.

---

## MCP

**✅ RUD058 — MCP server (configuration par agent IA)**
Companion Node.js MCP server (`packages/rud-mcp/`) exposant les outils de configuration de l'app. L'agent manipule le même format JSON que localStorage — aucun backend permanent requis. Output : URL d'import `/#/import?data=<lzstring>` que l'utilisateur ouvre dans le navigateur (même mécanisme que RUD042).

Outils MCP exposés :
- `get_config` — lire la config courante (depuis un fichier `rud-state.json` exporté)
- `add_connection(baseUrl, headers, auth)` — ajouter une connexion API
- `add_endpoint(connectionId, path, method, params)` — ajouter un endpoint
- `add_widget(type, connectionId, endpointId, dataPath, config, position)` — ajouter un widget
- `remove_widget(id)` / `update_widget(id, config)` — modifier/supprimer
- `create_dashboard(name)` / `set_active_dashboard(index)` — gérer les dashboards
- `generate_import_url()` — générer l'URL d'import finale

Usage : `npx rud-mcp` dans Claude Desktop → dire "crée un dashboard avec un widget température depuis mon API météo" → Claude appelle les outils → ouvre l'URL générée.

---

## Technique

**✅ RUD059 — OAuth2 PKCE (auth frontend-only)**
Support d'un nouveau type d'auth `oauth2-pkce` dans `ApiConnection`. Flow : redirect vers l'authorization server, callback avec code, échange PKCE pour access token (stocké en sessionStorage, jamais en localStorage). Rafraîchissement automatique via refresh token si disponible. Ouvre l'accès aux APIs OAuth2 standard (GitHub, Google, etc.) sans backend.

---

## Widget interactif

**✅ RUD060 — Widget Form (POST interactif)**
Nouveau type `form` : widget avec des champs texte configurables et un bouton "Envoyer" qui déclenche un appel à un endpoint (typiquement POST/PUT). Affiche la réponse inline après envoi.

Config dans `WidgetConfigPanel` :
- Endpoint cible (connexion + endpoint, comme les autres widgets)
- Liste de champs : `{ key, label, type: "text"|"number"|"textarea", defaultValue?, required? }`
- Label du bouton d'envoi (défaut : "Send")
- JSONPath optionnel pour extraire un message de la réponse à afficher

Comportement :
- Les valeurs des champs sont injectées dans le body JSON de la requête (clés = `key` de chaque champ)
- États : idle → loading → success (affiche la réponse) / error (affiche le message d'erreur)
- La réponse s'affiche dans un `<pre>` scrollable sous le formulaire
- Le widget fonctionne en mode Display (pas seulement en Editor) — c'est intentionnellement interactif
- Pas de polling automatique — le fetch est uniquement déclenché par le bouton

Note : premier widget "actif" de l'app. Ouvre des cas d'usage comme déclencher un build CI, soumettre une valeur de config, appeler un webhook, etc.

**✅ RUD061 — Widget Button**
Nouveau type `button` : un ou plusieurs boutons configurables dans un même widget, chacun associé à un endpoint distinct. Pas de champ de saisie — le clic déclenche directement l'appel. Affiche brièvement le statut de la réponse (✓ / ✗) après chaque appui.

Config :
- Liste de boutons : `{ label, connectionId, endpointId, variant: "primary"|"danger"|"ghost" }`
- Disposition : horizontal ou vertical
- JSONPath optionnel pour afficher un extrait de la réponse sous le bouton

Cas d'usage : déclencher un build, vider un cache, redémarrer un service, appeler un webhook.

**✅ RUD062 — Widget Toggle**
Nouveau type `toggle` : interrupteur ON/OFF qui lit l'état courant via un endpoint GET au montage (JSONPath pour extraire le booléen), puis envoie un PUT/PATCH à chaque changement d'état. Affiche l'état visuel en temps réel avec animation de transition.

Config :
- Endpoint GET (lecture de l'état) + JSONPath d'extraction
- Endpoint PUT/PATCH (écriture) + body template `{ "key": true/false }`
- Labels ON/OFF personnalisables

Cas d'usage : feature flags, activer/désactiver un mode, allumer/éteindre un service.

**✅ RUD063 — Widget Slider**
Nouveau type `slider` : curseur numérique qui lit la valeur courante via GET au montage et envoie la nouvelle valeur via PATCH avec debounce (300ms). Affiche la valeur courante en chiffre à côté du curseur.

Config :
- Endpoint GET (lecture) + JSONPath d'extraction
- Endpoint PATCH (écriture) + clé du body (`{ "brightness": 75 }`)
- min, max, step, unité (ex: `%`, `px/s`, `°C`)

Cas d'usage : ajuster une luminosité, une vitesse, un seuil, un volume.

**✅ RUD064 — Widget Select**
Nouveau type `select` : dropdown dont les options sont soit statiques (liste configurée dans le panel), soit dynamiques (chargées depuis un endpoint GET avec JSONPath). La sélection déclenche un POST/PUT avec la valeur choisie. Affiche l'option courante sélectionnée au montage via un GET optionnel.

Config :
- Source des options : `static` (liste `{ label, value }[]`) ou `dynamic` (endpoint GET + JSONPath)
- Endpoint POST/PUT de sélection + clé du body
- Endpoint GET optionnel pour lire la valeur courante au montage

Cas d'usage : choisir un environnement (prod/staging), un mode de fonctionnement, une région.

**RUD065 — Widget Search** ✅
Nouveau type `search` : champ texte qui envoie un GET à chaque frappe (debounce 300ms) avec le terme comme query param, et affiche les résultats dans un tableau ou liste compacte. Réutilise la logique de rendu de `Table.tsx`.

Config :
- Endpoint GET cible + nom du query param (ex: `q`, `search`, `query`)
- JSONPath pour extraire le tableau de résultats
- Colonnes à afficher (comme widget Table)
- Placeholder du champ de saisie

Cas d'usage : recherche dans un catalogue, lookup utilisateur, autocomplete.

---

## Ordre d'implémentation suggéré (Phase 3)

```
RUD051 (resize widgets)
→ RUD052 (transformations) → RUD053 (variables globales)
→ RUD046 (gauge) → RUD047 (stat+tendance) → RUD048 (progress) → RUD049 (pie) → RUD050 (status grid)
→ RUD060 (form) → RUD061 (button) → RUD062 (toggle) → RUD063 (slider) → RUD064 (select) → RUD065 (search)
→ RUD055 (alertes) → RUD056 (animations)
→ RUD057 (marketplace)
→ RUD058 (MCP)
→ RUD054 (WebSocket)
→ RUD059 (OAuth2 PKCE)
```

RUD052/053 débloquent la valeur des widgets existants avant d'en ajouter de nouveaux.
RUD060-065 (widgets interactifs) partagent une logique commune — les implémenter en séquence.
RUD058 (MCP) dépend d'un format de config stable — à faire après les ajouts de widgets.
RUD054 (WebSocket) et RUD059 (OAuth2) sont les plus lourds techniquement — en fin de phase.
