# TP 1 — Lire les mesures sans bloquer

Mesure de ce que subit un autre utilisateur (`GET /ping`) pendant l'import d'un fichier de mesures NDJSON : d'abord en lecture bloquante (`readFileSync`), puis en flux (`createReadStream` + `readline`).

## Résultats

| Fichier  | Lecture   | Durée de l'import (ms) | Pire temps de /ping (ms) |
|----------|-----------|------------------------|--------------------------|
| 1 jour   | bloquante | 21                     | 14                       |
| 1 jour   | en flux   | 49                     | 11                       |
| 30 jours | bloquante | 562                    | 558                      |
| 30 jours | en flux   | 413                    | 6                        |

Contrôle : les deux routes renvoient les mêmes valeurs, soit 144 000 mesures et un poids moyen de 38,74 kg avec le fichier de 30 jours, et 4 800 mesures et 37,87 kg avec celui d'une journée.

## Questions

**1. Pourquoi `/ping` attend-il pendant l'import bloquant ?**
Node exécute le JavaScript dans un seul thread. Pendant l'import bloquant, `readFileSync` puis les 144 000 `JSON.parse` occupent ce thread sans interruption : la boucle d'événements ne peut pas traiter le `/ping` avant la fin de l'import, qui doit donc attendre (558 ms avec le fichier de 30 jours, pour un import de 562 ms).

**2. La lecture en flux est-elle plus rapide ? Sinon, qu'apporte-t-elle ?**
Pas de façon significative : les durées sont du même ordre (413 ms en flux contre 562 ms en bloquant avec 30 jours, mais le bloquant a donné 376 ms lors d'un autre essai, et le flux est même plus lent avec 1 jour : 49 ms contre 21 ms). Le flux apporte de la réactivité : entre deux morceaux lus, la boucle d'événements reprend la main et sert les autres requêtes, d'où un pire temps de `/ping` de 6 ms au lieu de 558 ms. Il évite aussi de charger tout le fichier en mémoire.

**3. Pourquoi l'effet est-il presque invisible avec le fichier d'une journée ?**
Avec 4 800 lignes, l'import ne dure que quelques millisecondes : le blocage est si court que le `/ping` de la sonde (envoyé toutes les 10 ms) le remarque à peine : 14 ms en bloquant et 11 ms en flux, contre 558 ms avec 30 jours.

# TP 5 — Brancher PostgreSQL

## Insertion en masse (étape 6)

Commande : `node --env-file=.env scripts/import-measures.js ligne --vider` puis `... lot --vider`.

| Mode  | Durée de l'import (ms) |
|-------|------------------------|
| ligne | 39036            |
| lot   | 1167           |

**1. Quel temps obtenez-vous dans chaque mode ? D'où vient l'écart ?**
Le mode lot est nettement plus rapide (à chiffrer avec le tableau ci-dessus). Le mode ligne envoie 4 800 requêtes : chacune fait un aller-retour réseau avec la base et sa propre transaction implicite, validée (COMMIT) une par une. Le mode lot envoie 5 requêtes de 1 000 lignes dans une seule transaction : cinq allers-retours de données et un seul COMMIT.

**2. Si la 2 001e mesure provoquait une erreur, que resterait-il en base dans chaque mode ?**
En mode ligne, les 2 000 premières mesures resteraient : chaque INSERT est déjà validé quand le suivant part. En mode lot, la 2 001e mesure est dans le 3e lot, et l'erreur déclenche un ROLLBACK de toute la transaction : il ne resterait aucune mesure de la journée (tout ou rien).

**3. Pourquoi la transaction emprunte-t-elle une connexion avec `pool.connect()` au lieu d'appeler `pool.query()` ?**
Une transaction appartient à une connexion. `pool.query()` prête une connexion au hasard pour chaque appel, donc `BEGIN`, les `INSERT` et `COMMIT` pourraient partir sur des connexions différentes et ne feraient pas partie de la même transaction. `pool.connect()` réserve un même client pour toutes les instructions.

**4. Que se passerait-il si `client.release()` n'était pas dans le `finally`, et qu'une erreur survenait dix fois de suite ?**
Chaque erreur laisserait une connexion empruntée et jamais rendue. Avec `DB_POOL_MAX=10`, après dix erreurs le pool serait vide : toute nouvelle requête de l'API attendrait une connexion, puis échouerait au bout de `connectionTimeoutMillis` (5 s). L'API cesserait de répondre, alors que la base fonctionne.

# TP 7 — Authentification JWT et contrôle d'accès

## Vérification des refus d'accès

Les quatre cas suivants ont été vérifiés pendant les tests d'intégration :

| Requête | Résultat | Explication |
|---|---:|---|
| `GET /api/hives` sans token | 401 | Authentification requise |
| `GET /api/hives?site_id=CI-AGBO` avec un coordinateur SN-CASA | 403 | Accès limité à son propre site |
| `GET /api/hives/SN-CASA-011` avec un apiculteur propriétaire d'une autre ruche | 403 | Accès réservé au propriétaire |
| `POST /api/hives/SN-CASA-001/measures` avec un apiculteur | 403 | Ajout de mesures réservé à l'administrateur |

## Journalisation des refus

Chaque réponse HTTP 401 ou 403 est journalisée côté serveur avec le format suivant :

`[accès refusé] STATUS METHOD URL ip=IP utilisateur=USER_ID`

- Le statut HTTP permet de distinguer une authentification manquante ou invalide (401) d'une permission insuffisante (403).
- L'adresse IP et l'identifiant de l'utilisateur sont ajoutés lorsqu'ils sont disponibles.
- Une requête sans utilisateur authentifié est journalisée avec `utilisateur=-`.

