# Contrat de l'API des ruches

Ce document décrit ce que fait l'API, sans qu'il soit nécessaire de lire son code.

## Conventions générales

- **Adresse de base** : `http://localhost:3000`
- **Format** : JSON, en UTF-8. Les requêtes avec un corps portent l'en-tête `Content-Type: application/json`.
- **Dates** : ISO 8601 avec heure et fuseau, par exemple `2026-10-31T10:00:00Z`.
- **Identifiant de ruche** : texte de la forme `SN-CASA-001`.
- **Authentification** : aucune pour l'instant.
- **Stockage** : en mémoire. Les mesures et les inspections sont perdues à chaque redémarrage du serveur.

### Format des erreurs (RFC 9457)

Toutes les erreurs ont l'en-tête `Content-Type: application/problem+json` et ce corps :

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

`title` est l'intitulé du code, identique pour toutes les erreurs de ce code. `detail` explique ce qui s'est passé pour cette requête. Une réponse ne contient jamais de pile d'exécution.

| Code | `title` |
|---|---|
| 400 | Requête invalide |
| 404 | Introuvable |
| 409 | Conflit |
| 500 | Erreur interne |

### Erreurs valables pour toutes les routes

- **404** : aucune route ne correspond à la méthode et au chemin demandés (par exemple `GET /nimporte/quoi`).
- **400** : le corps de la requête n'est pas un JSON valide (`Le corps de la requête n'est pas un JSON valide.`).
- **500** : erreur interne imprévue (`Une erreur interne est survenue.`).

Exemple d'erreur 404 pour une route inconnue :

```json
{
  "type": "about:blank",
  "title": "Introuvable",
  "status": 404,
  "detail": "Aucune route ne correspond à GET /nimporte/quoi."
}
```

---

## Routes

### GET /health

Indique que le serveur répond.

Paramètres : aucun.

**200** : le serveur fonctionne.

```json
{ "status": "ok" }
```

---

### GET /api/hives

Liste des ruches, avec un filtre facultatif par site.

Paramètres de requête
- `site_id` : texte, facultatif. Ne garde que les ruches de ce site. Un `site_id` vide équivaut à son absence. Un site inconnu donne une liste vide.

**200** : tableau de ruches.

```json
[
  { "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" },
  { "id": "SN-CASA-002", "site_id": "SN-CASA", "status": "active" }
]
```

---

### GET /api/hives/:id

Une ruche.

Paramètres de chemin
- `id` : identifiant de la ruche, par exemple `SN-CASA-001`.

**200** : la ruche.

```json
{ "id": "SN-CASA-001", "site_id": "SN-CASA", "status": "active" }
```

**404** : aucune ruche ne porte cet identifiant.

```json
{
  "type": "about:blank",
  "title": "Introuvable",
  "status": 404,
  "detail": "Aucune ruche ne porte l'identifiant XX-NOPE-999."
}
```

---

### POST /api/hives/:id/measures

Enregistre une mesure envoyée par la passerelle d'un site. La mesure garde le `timestamp` de la trame : c'est l'instant où le capteur l'a prise, pas celui où le serveur l'a reçue.

Paramètres de chemin
- `id` : identifiant de la ruche.

Corps (JSON)
- `timestamp` : **obligatoire**, date ISO 8601 avec fuseau.
- `weight_kg` : **obligatoire**, nombre.
- `hive_id` : facultatif. S'il est présent, il doit être égal à `id`.
- Les autres champs de la trame (`site_id`, `position_lat`, `position_lon`, `temp_internal_c`, `temp_external_c`, `humidity_pct`, `acoustic_activity_score`, `battery_pct`) sont facultatifs et conservés tels quels. Leur valeur n'est pas contrôlée.
- La réponse contient toujours `hive_id` et `site_id`, pris sur la ruche du chemin.

**201** : mesure enregistrée, renvoyée telle qu'elle est stockée.

```json
{
  "hive_id": "SN-CASA-001",
  "site_id": "SN-CASA",
  "timestamp": "2026-10-31T10:00:00Z",
  "weight_kg": 36.84,
  "battery_pct": 88
}
```

**400** : le corps n'est pas un objet JSON, `timestamp` manque ou n'est pas une date ISO 8601, `weight_kg` manque ou n'est pas un nombre, ou `hive_id` diffère de l'identifiant du chemin.

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ timestamp est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T10:00:00Z."
}
```

**404** : aucune ruche ne porte cet identifiant.

---

### GET /api/hives/:id/measures

Historique des mesures d'une ruche, de la plus récente à la plus ancienne (d'après leur `timestamp`).

Paramètres de chemin
- `id` : identifiant de la ruche.

Paramètres de requête
- `limit` : entier de 1 à 500, 50 par défaut.
- `offset` : entier positif ou nul, 0 par défaut. Nombre de mesures sautées.

Un paramètre présent mais vide, décimal, négatif ou non numérique est invalide. Un `offset` au-delà du nombre de mesures donne une liste vide.

**200** : `{ items, limit, offset }`. Les pages successives (`offset=0`, `offset=50`, …) ne répètent aucune mesure.

```json
{
  "items": [
    { "hive_id": "SN-CASA-001", "site_id": "SN-CASA", "timestamp": "2026-10-31T10:00:00Z", "weight_kg": 36.84 }
  ],
  "limit": 50,
  "offset": 0
}
```

**400** : `limit` ou `offset` invalide.

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le paramètre limit doit être un entier compris entre 1 et 500."
}
```

**404** : aucune ruche ne porte cet identifiant.

---

### GET /api/hives/:id/inspections

Inspections d'une ruche, de la plus récente à la plus ancienne (d'après `inspected_at`).

Paramètres de chemin
- `id` : identifiant de la ruche.

Paramètres de requête : aucun.

**200** : tableau d'inspections, vide si la ruche n'en a pas.

```json
[
  {
    "id": "0b8f3c7e-4d3a-4f64-9a53-2f6a1d9a7c11",
    "hive_id": "SN-CASA-001",
    "inspected_at": "2026-10-31T09:30:00Z",
    "colony_status": "forte",
    "queen_present": true,
    "observations": "RAS"
  }
]
```

**404** : aucune ruche ne porte cet identifiant.

---

### POST /api/hives/:id/inspections

Enregistre une inspection saisie sur l'application mobile. L'identifiant de l'inspection est un UUID choisi par l'application, pas par le serveur.

Paramètres de chemin
- `id` : identifiant de la ruche.

Corps (JSON)
- `id` : **obligatoire**, UUID.
- `inspected_at` : **obligatoire**, date ISO 8601 avec fuseau.
- `colony_status` : **obligatoire**, l'une des valeurs `forte`, `normale`, `faible`, `morte`.
- `queen_present` : facultatif, booléen.
- `observations` : facultatif, texte.
- Tout autre champ est ignoré. `hive_id` est pris sur le chemin.

**201** : inspection créée, renvoyée telle qu'elle est stockée.

```json
{
  "id": "0b8f3c7e-4d3a-4f64-9a53-2f6a1d9a7c11",
  "hive_id": "SN-CASA-001",
  "inspected_at": "2026-10-31T09:30:00Z",
  "colony_status": "forte",
  "queen_present": true,
  "observations": "RAS"
}
```

**400** : le corps n'est pas un objet JSON, `id` manque ou n'est pas un UUID, `inspected_at` manque ou n'est pas une date ISO 8601, `colony_status` manque ou a une valeur inconnue, `queen_present` n'est pas un booléen, ou `observations` n'est pas un texte.

```json
{
  "type": "about:blank",
  "title": "Requête invalide",
  "status": 400,
  "detail": "Le champ colony_status est obligatoire et doit valoir : forte, normale, faible, morte."
}
```

**404** : aucune ruche ne porte cet identifiant.

**409** : une inspection porte déjà cet `id`.

```json
{
  "type": "about:blank",
  "title": "Conflit",
  "status": 409,
  "detail": "Une inspection porte déjà l'identifiant 0b8f3c7e-4d3a-4f64-9a53-2f6a1d9a7c11."
}
```

---

## Ordre des contrôles sur les routes `/api/hives/:id/...`

1. La ruche existe, sinon **404**.
2. Le corps et les paramètres sont valides, sinon **400**.
3. Pour une inspection, l'`id` n'existe pas déjà, sinon **409**.
