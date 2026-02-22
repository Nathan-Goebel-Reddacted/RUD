# Tickets V1 — API Dashboard Builder

## Socle

**RUD005 — Persistance du profil (localStorage)** ✅
Sauvegarder le profil dans `localStorage` à chaque `setProfile`, le recharger au démarrage. Aujourd'hui le profil est perdu à chaque rechargement.

**RUD006 — Guard de route** ✅
Rediriger vers `/no-profile` si aucun profil n'est chargé et que l'utilisateur accède à `/dashboard`, `/api-config` ou `/display` directement.

**RUD007 — Feedback d'erreur dans le formulaire de profil**
`IsProfileValid()` retourne des `ActionResult` avec des codes d'erreur mais rien n'est affiché dans l'UI. Afficher les messages sous les champs concernés.

**RUD007b — Édition et réinitialisation du profil**
Ajouter un bouton "Modifier le profil" accessible depuis le dashboard (navbar ou menu). Permet de modifier les champs du profil existant (nom, langue, couleurs) sans repartir de zéro. Ajouter également un bouton "Supprimer le profil" qui vide le localStorage et redirige vers `/no-profile`.

---

## Page API Config

**RUD008 — Modèle de données API**
Créer la classe `ApiConnection` (baseUrl, headers, auth type, endpoints[]) et l'intégrer dans `Profile`. Fondation de tout ce qui suit.

**RUD009 — Formulaire d'ajout d'une API**
UI pour saisir : base URL, headers custom, type d'auth (Bearer / API Key / aucune). Validation + `ActionResult`.

**RUD010 — Gestion des endpoints**
Ajouter/supprimer des endpoints manuellement (path, méthode GET/POST, label). Liste affichée sous la config API.

**RUD011 — Import Swagger/OpenAPI**
Upload d'un fichier JSON/YAML, parsing via `swagger-parser`, import automatique des endpoints dans la config. Installer `swagger-parser`.

**RUD012 — Test de connexion**
Bouton "Tester" par endpoint : fait un `fetch` réel et affiche le statut HTTP + un extrait de la réponse. Message d'erreur clair si CORS.

---

## Dashboard Editor

**RUD013 — Modèle Widget**
Créer l'interface `Widget` (id, type, endpointId, dataPath, position `{x,y,w,h}`, config chart). Intégrer dans `Profile`.

**RUD014 — Grille de layout**
Installer `dnd-kit`, implémenter une grille drag-and-drop où les widgets peuvent être déplacés et redimensionnés.

**RUD015 — Widget Number Card**
Premier type de widget : affiche une valeur numérique unique extraite via JSONPath. Le plus simple à implémenter, utile pour valider le pipeline fetch → affichage.

**RUD016 — Widget Table**
Affiche une liste d'objets API sous forme de tableau. Colonnes configurables.

**RUD017 — Widget Bar Chart / Line Chart**
Installer `recharts`. Implémenter bar chart et line chart avec mapping axes X/Y configurables.

**RUD018 — Panneau de configuration widget**
Panneau latéral ou modal pour configurer un widget sélectionné : choix de l'endpoint, du type de chart, du JSONPath pour les données.

---

## Page Display (fullscreen)

**RUD019 — Fetch live data**
Mécanisme central : pour chaque widget, appel `fetch` vers l'endpoint configuré, extraction via JSONPath, transmission au composant de rendu.

**RUD020 — Vue fullscreen**
Page `/display` en fullscreen réel (`requestFullscreen`), sans chrome, qui render les widgets en lecture seule avec les données live.

**RUD021 — Auto-refresh**
Intervalle de rafraîchissement configurable par dashboard (ex: 30s). Timer qui re-fetch tous les endpoints actifs.

---

## Export / Import

**RUD022 — Export/import config JSON**
Bouton pour exporter la config complète (APIs + dashboard) en fichier JSON, et l'importer depuis un fichier. Format défini dans `CLAUDE.md`.

---

## Ordre d'implémentation suggéré

```
RUD005 → RUD006 → RUD007 → RUD007b
→ RUD008 → RUD009 → RUD010
→ RUD013 → RUD015 → RUD019 → RUD020
→ RUD014 → RUD017 → RUD018
→ RUD011 → RUD012 → RUD016
→ RUD021 → RUD022
```

RUD005–007 débloquent tout le reste.
RUD008 et RUD013 (modèles de données) doivent précéder leurs UI respectives.
