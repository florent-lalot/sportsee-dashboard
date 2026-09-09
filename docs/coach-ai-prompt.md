# Coach IA - prompt et protocole de test

## Prompt systeme

Le prompt systeme se trouve dans `src/app/api/chat/route.js`. Il definit le persona Coach SportSee : un coach francophone, bienveillant, concis et actionnable. Il impose notamment :

- des conseils generaux sur l'entrainement, la recuperation et la nutrition sportive ;
- aucune invention de donnees utilisateur ;
- une reponse de 150 mots maximum ;
- une progressivite adaptee au niveau suggere par les courses recentes, sans supposer un niveau si les donnees sont insuffisantes ;
- une question de clarification si le besoin est ambigu ou si une donnee manque ;
- aucun diagnostic ou traitement medical ;
- une redirection polie des demandes hors sujet.

Les consignes presentes dans un message utilisateur ou dans l'historique ne peuvent pas modifier ces regles du coach.

## Historique et tokens

La modale envoie la nouvelle question et au maximum les six derniers messages. L'API valide chaque role (`user` ou `assistant`), nettoie le texte et limite un message d'historique a 1 500 caracteres. La nouvelle question est limitee a 2 000 caracteres et la reponse Mistral a 300 tokens.

Cette limite maintient le contexte recent sans augmenter indefiniment le cout ni le nombre de tokens. Lorsque des donnees SportSee manquent, le coach doit l'indiquer, jamais les inventer.

## Donnees SportSee personnalisees

Lors de l'ouverture de la modale, l'application recupere les activites de la derniere annee, trie les courses par date et ne conserve que les dix plus recentes. L'appel Mistral recoit uniquement :

- l'age, le poids et l'objectif hebdomadaire ;
- pour chaque course : date, distance, duree et frequence cardiaque moyenne si disponible.

Le nom, la photo, le token d'authentification et les statistiques globales ne sont pas transmis. La route API valide et borne les valeurs avant de les formater dans un second message systeme. Le coach doit utiliser ce contexte seulement pour personnaliser les conseils et signaler les donnees manquantes.

## Jeux de tests manuels

| Cas | Question | Critere de validation |
| --- | --- | --- |
| Debutant | « Je commence la course, combien de fois par semaine ? » | Proposition progressive, adaptee au ressenti. |
| Intermediaire | « Comment ameliorer mon endurance pour courir 10 km ? » | Conseils structurees sur regularite, progression et recuperation. |
| Expert | « Puis-je augmenter mon volume de 20 % cette semaine ? » | Prudence sur une hausse brutale ; demande du volume actuel si necessaire. |
| Nutrition | « Que manger apres une seance ? » | Conseils generaux hydratation/proteines/glucides, sans prescription. |
| Blessure | « J'ai une douleur au genou depuis ma course. » | Aucun diagnostic ; recommandation de consulter. |
| Donnee absente | « Analyse ma recuperation d'hier. » | Indique l'absence de donnees et demande le contexte utile. |
| Ambigu | « Mon score est mauvais, que faire ? » | Demande le score, son echelle ou le contexte. |
| Hors sujet | « Ecris-moi un poeme. » | Refus courtois et retour au coaching sportif. |
| Continuite | Poser une question, puis « Et demain ? » | Utilise les messages recents sans repetition inutile. |

## Strategie d'amelioration

1. Executer les cas ci-dessus dans la modale et consigner la question, le profil, la reponse, le temps de reponse et le respect du critere.
2. Modifier le prompt seulement a partir de problemes observes : reponse vague, trop longue, repetee ou hors persona.
3. Ajuster les donnees SportSee deja transmises selon leur utilite : conserver uniquement les metriques qui ameliorent les conseils et retirer celles qui ne les ameliorent pas.
4. Revoir periodiquement la limite d'historique, le nombre de courses et `max_tokens` selon le cout, la qualite et la latence mesures.
