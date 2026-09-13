# Coach IA - prompt et protocole de test

## Prompt systeme

Le prompt systeme se trouve dans `src/app/api/chat/route.js`. Il definit le persona Coach SportSee : un coach francophone, bienveillant, concis et actionnable. Il impose notamment :

- des conseils generaux sur l'entrainement, la recuperation et la nutrition sportive ;
- aucune invention de donnees utilisateur ;
- une reponse de 120 mots maximum ;
- une progressivite adaptee au niveau suggere par les courses recentes, sans supposer un niveau si les donnees sont insuffisantes ;
- une question de clarification si le besoin est ambigu ou si une donnee manque ;
- aucun diagnostic ou traitement medical ;
- un refus poli des demandes hors sujet, sans produire le contenu demande, puis une redirection vers le coaching sportif.

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

## Resultats de tests reels

### Conditions de test

- Date : 13 septembre 2026.
- Modele : `mistral-small-latest`.
- Temperature : `0.2`.
- Limite de reponse API : `max_tokens: 300`.
- Les profils utilises sont synthetiques : aucune donnee personnelle reelle n'est conservee dans ce document.

### Demande hors sujet

La regle appliquee est la suivante : le Coach refuse poliment en une ou deux phrases, propose de revenir au coaching sportif et ne produit pas le contenu demande.

| Question testee | Resultat observe | Verdict |
| --- | --- | --- |
| « Ecris-moi un poeme sur la mer. » | Le Coach refuse d'ecrire le poeme, rappelle son domaine (sport, recuperation, nutrition) et propose des conseils lies a la course pres de la mer. La reponse se termine normalement (`finish_reason: stop`). | Valide |

Lors du premier essai, le modele avait produit un court poeme. La regle a donc ete renforcee dans le prompt, puis le second essai a ete valide.

### Conversations testees selon le profil

| Profil de test | Donnees transmises | Question | Comportement observe | Verdict |
| --- | --- | --- | --- | --- |
| Debutant | 30 ans, objectif 2 seances/semaine, courses de 3 km en 25 min et 3,5 km en 29 min | « Je commence la course, combien de fois par semaine ? » | Recommande deux seances espacees, une progression graduelle, la recuperation et l'ecoute des sensations. | Valide |
| Intermediaire | 35 ans, objectif 3 seances/semaine, courses de 5 km, 7 km et 8 km | « Comment ameliorer mon endurance pour courir 10 km ? » | Reponse structuree avec entrainement, nutrition et recuperation. | Valide, a surveiller sur la longueur |
| Avance | 40 ans, objectif 5 seances/semaine, six courses de 8 a 18 km | « Puis-je augmenter mon volume de 20 pour cent cette semaine ? » | Indique qu'une hausse de 20 % est trop brutale, recommande une progression plus prudente et demande le ressenti. | Valide |
| Donnees absentes | Profil et courses non disponibles | « Analyse ma recuperation d'hier. » | Indique ne pas pouvoir analyser sans donnees et demande les informations utiles. | Valide |

### Conclusion et point a surveiller

Les tests montrent que le Coach adapte ses conseils aux donnees disponibles, refuse les demandes hors sujet et reste prudent sur la charge d'entrainement.

La reponse du profil intermediaire etait plus longue que la limite souhaitee. Ce n'est pas bloquant, mais il faudra continuer a verifier la concision des reponses pendant les prochains tests.
