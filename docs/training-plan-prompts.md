# Plans d'entrainement - prompts et JSON

## Objectif

La generation de plan utilisera un prompt commun et une variante par course cible : `5k`, `10k`, `half_marathon` et `marathon`. Le code est dans `src/prompts/trainingPlanPrompts.js`.

Le prompt commun impose :

- une sortie JSON stricte, sans Markdown ;
- le respect exclusif des jours disponibles ;
- une charge adaptee au niveau et aux courses recentes ;
- une progression prudente et des jours de recuperation ;
- aucun diagnostic medical.

Chaque objectif ajoute une priorite specifique : vitesse et regularite pour 5 km, endurance/allure pour 10 km, sorties longues pour semi-marathon et marathon.

## Schema de sortie

Chaque reponse doit respecter `TRAINING_PLAN_SCHEMA` :

```json
{
  "title": "Plan 10 km progressif",
  "goal": "10k",
  "durationWeeks": 6,
  "weeks": [
    {
      "weekNumber": 1,
      "sessions": [
        {
          "day": "Mardi",
          "type": "easy_run",
          "durationMin": 35,
          "distanceKm": 5,
          "intensity": "easy",
          "instructions": "Course facile, conversation possible."
        }
      ]
    }
  ],
  "safetyNote": "Adaptez ou arretez en cas de douleur."
}
```

L'endpoint utilise `response_format: { type: "json_object" }`, mode valide avec le modele Mistral utilise. Le prompt decrit explicitement les champs attendus et le backend applique ensuite `TRAINING_PLAN_SCHEMA` et ses validations metier : structure, types et disponibilites.

## Test Postman

Dans Postman :

1. Methode : `POST` ; URL : `https://api.mistral.ai/v1/chat/completions`.
2. Onglet **Authorization** : choisir `Bearer Token`, puis coller la cle Mistral. Ne pas mettre la cle dans le body.
3. Onglet **Headers** : ajouter `Content-Type` avec la valeur `application/json`.
4. Onglet **Body** : choisir `raw`, puis `JSON`. Coller le JSON suivant et envoyer la requete.

```json
{
  "model": "mistral-small-latest",
  "temperature": 0.2,
  "max_tokens": 2000,
  "response_format": {
    "type": "json_object"
  },
  "messages": [
    {
      "role": "system",
      "content": "Tu es Coach SportSee. Genere uniquement un objet JSON valide, sans Markdown ni texte avant ou apres. Le JSON doit contenir exactement : title (string), goal (string), durationWeeks (number), weeks (array) et safetyNote (string). Chaque element de weeks contient weekNumber (number) et sessions (array). Chaque session contient day, type, durationMin, distanceKm, intensity et instructions. Utilise exclusivement les jours de disponibilite fournis. Cree un plan progressif, adapte au niveau et sans diagnostic medical."
    },
    {
      "role": "user",
      "content": "Genere un plan de 6 semaines pour une course de 5 km. Profil : debutant, 30 ans, objectif de 3 seances par semaine. Courses recentes : 3 km en 22 min, puis 3,5 km en 25 min. Jours disponibles : Mardi, Jeudi, Samedi. Contrainte : aucune."
    }
  ]
}
```

`response_format: { "type": "json_object" }` garantit un JSON valide. Le backend controle ensuite les champs, les types et les contraintes avec `TRAINING_PLAN_SCHEMA` et la validation metier.

Jeux de test a executer et valider :

| Profil / objectif | Disponibilites | Verification principale |
| --- | --- | --- |
| Debutant, 5 km, 6 semaines | Mardi, Jeudi, Samedi | Aucun autre jour ; progression douce. |
| Intermediaire, 10 km, 6 semaines | Lundi, Mercredi, Dimanche | Sortie longue le dimanche et charge coherente. |
| Expert, semi-marathon, 6 semaines | Mardi, Jeudi, Samedi, Dimanche | Endurance et recuperation entre seances intenses. |
| Utilisateur avec douleur declaree | Mardi, Samedi | Charge reduite, conseil de consulter ; aucun diagnostic. |
| Donnees de courses absentes | Mercredi, Samedi | Plan prudent sans invention d'allure ou de volume. |

Pour chaque test, conserver le JSON brut, verifier sa validite, puis verifier que chaque champ `day` appartient aux disponibilites fournies. Ne pas noter un test comme valide avant cette verification.

## Endpoint de generation

L'endpoint `POST /api/training-plan/generate` est dans `src/app/api/training-plan/generate/route.js`.

Exemple de requete future depuis le frontend :

```json
{
  "goal": "10k",
  "startDate": "2026-11-15",
  "availableDays": ["Mardi", "Jeudi", "Dimanche"],
  "constraints": "Pas de course le lendemain d'une seance intense.",
  "athlete": {
    "age": 30,
    "weightKg": 68,
    "weeklyGoal": 3,
    "recentRuns": [
      { "date": "2026-09-01", "distanceKm": 5, "durationMin": 31 },
      { "date": "2026-09-04", "distanceKm": 6, "durationMin": 38 }
    ]
  }
}
```

Tous les plans couvrent 6 semaines. `startDate` est obligatoire pour tous les objectifs et correspond au premier jour du programme. Cette date est aussi utilisee pour dater les evenements ICS exportes.

L'endpoint demande une sortie Mistral en `json_object`, parse la reponse, puis verifie : structure, semaines, types de seances, durees, absence de doublon et respect strict des jours disponibles.

En cas de timeout, erreur Mistral, JSON invalide ou plan incoherent, il retourne un plan de secours structure (`source: "fallback"`) et un message `warning`. Un plan Mistral valide retourne `source: "mistral"`.

## Export calendrier ICS

L'endpoint `POST /api/training-plan/calendar` recoit un plan valide et une date de debut (`YYYY-MM-DD`). Il retourne directement un fichier `.ics` telechargeable, sans ecrire de fichier sur le serveur.

Chaque seance devient un evenement a 18 h, fuseau `Europe/Paris`, avec :

- un titre SportSee ;
- type, intensite, duree, distance et consignes dans la description ;
- un rappel automatique 30 minutes avant (`VALARM`) ;
- un identifiant et un nom de fichier uniques.

Le backend valide le plan, limite les descriptions a 500 caracteres et echappe les caracteres ICS sensibles. Le bouton **Telecharger le calendrier** de l'affichage du plan declenche cet endpoint.

## Adaptation au contexte utilisateur

Avant de construire le prompt, `analyzeRunningProfile` exploite au maximum les dix dernieres courses valides. Il calcule une synthese compacte : nombre de courses, distance totale, distance hebdomadaire estimee et allure moyenne observee.

Le niveau est detecte ainsi :

- `debutant` : moins de 4 courses analysees ou moins de 15 km par semaine ;
- `intermediaire` : niveau par defaut entre ces seuils ;
- `avance` : au moins 6 courses et 40 km par semaine ou plus ;
- `debutant_par_defaut` : moins de deux courses utilisables.

Des plages d'allure faciles, tempo, fractionne et sortie longue sont ensuite calculees a partir de l'allure moyenne. Elles sont bornees entre 3:00/km et 15:00/km pour eviter des valeurs irrealisables. Le prompt demande au modele de les integrer dans les consignes, sans depasser ces plages et en privilegiant le ressenti.

Seules les cinq dernieres courses sont affichees dans le prompt, en plus de la synthese calculee sur dix courses maximum. Cela conserve un contexte court tout en calibrant le plan sur les performances recentes.

## Garde-fou marathon

Avant tout appel a Mistral, le backend bloque une demande de marathon venant d'un profil `debutant` ou `debutant_par_defaut`. Un marathon sur 6 semaines serait une progression trop brutale.

Le systeme retourne alors un plan 5 km progressif et une recommandation explicite : construire l'endurance sur 6 semaines, viser ensuite 10 km, puis augmenter le volume sur plusieurs mois avant un projet marathon. Cette regle fonctionne meme si Mistral est indisponible.
