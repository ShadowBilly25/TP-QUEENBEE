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
