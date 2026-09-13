# Tests d'import du calendrier ICS

## Objectif

Verifier que le fichier ICS genere par SportSee est importe correctement dans les principaux calendriers.

Chaque seance du plan doit devenir un evenement avec :

- la bonne date, calculee depuis la date de debut du programme ;
- une heure de debut a 18 h, fuseau `Europe/Paris` ;
- la duree de la seance ;
- le titre SportSee ;
- le type, l'intensite, la distance et les consignes dans la description ;
- un rappel 30 minutes avant.

## Preparation commune

1. Generer un plan d'entrainement de six semaines dans le dashboard.
2. Cliquer sur **Telecharger le calendrier**.
3. Conserver le fichier `.ics` telecharge et noter le nombre total de seances du plan.
4. Utiliser le meme fichier pour tous les tests ci-dessous.

Plan teste : a renseigner.

Nombre de seances attendues : a renseigner.

Date de debut du programme : a renseigner.

## Google Calendar

1. Ouvrir Google Calendar dans un navigateur.
2. Cliquer sur l'icone d'engrenage, puis **Parametres**.
3. Ouvrir **Importer et exporter**.
4. Selectionner le fichier `.ics` SportSee et le calendrier de destination.
5. Importer le fichier.

Verifier :

- le nombre d'evenements importes ;
- les dates et heures ;
- la description d'une seance ;
- le rappel 30 minutes avant.

Resultat : a renseigner.

## Outlook

1. Ouvrir Outlook Calendar.
2. Utiliser l'action **Ajouter un calendrier** ou **Importer un calendrier**.
3. Choisir **A partir d'un fichier** puis selectionner le fichier `.ics` SportSee.
4. Importer dans le calendrier choisi.

Verifier :

- le nombre d'evenements importes ;
- les dates et heures ;
- la description d'une seance ;
- le rappel 30 minutes avant.

Resultat : a renseigner.

## Apple Calendar

1. Ouvrir l'application Calendrier sur macOS ou iOS.
2. Ouvrir ou partager le fichier `.ics` SportSee.
3. Choisir le calendrier de destination, puis importer les evenements.

Verifier :

- le nombre d'evenements importes ;
- les dates et heures ;
- la description d'une seance ;
- le rappel 30 minutes avant.

Resultat : a renseigner.

## Tableau de resultats

| Application     | Import du fichier | Nombre de seances correct | Date et heure correctes                           | Description correcte                       | Rappel 30 min | Verdict | Capture                 |
| --------------- | ----------------- | ------------------------- | ------------------------------------------------- | ------------------------------------------ | ------------- | ------- | ----------------------- |
| Google Calendar | Oui               | Oui                       | Oui                                               | Oui                                        | Oui           | Valide  | Test effectue           |
| Outlook         | Oui               | Oui (13 seances)          | Oui (18 h, y compris apres le changement d'heure) | Oui (sauts de ligne affiches correctement) | Oui (30 min)  | Valide  | Capture Outlook fournie |
| Apple Calendar  | Oui               | Oui                       | Oui                                               | Oui                                        | Oui           | Valide  | Test effectue           |
