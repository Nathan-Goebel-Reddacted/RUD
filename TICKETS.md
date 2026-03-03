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

## Ordre d'implémentation suggéré

```
RUD005 → RUD006 → RUD007 → RUD007b
→ RUD008 → RUD009 → RUD010 → RUD011
→ RUD014 → RUD016 → RUD020 → RUD021
→ RUD015 → RUD018 → RUD019
→ RUD012 → RUD013 → RUD017
→ RUD022 → RUD023
```

RUD005–007b débloquent tout le reste.
RUD008 (Zustand) doit précéder tous les tickets suivants.
RUD009 et RUD014 (modèles de données) doivent précéder leurs UI respectives.
