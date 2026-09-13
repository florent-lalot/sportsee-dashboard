# Tests manuels Postman — API Mistral

Ce dossier conserve une preuve des tests manuels effectues avec Postman avant l'integration de Mistral dans Next.js.

## Capture de test du Coach IA

La capture presente dans ce dossier montre :

- une requete `POST` vers `https://api.mistral.ai/v1/chat/completions` ;
- un prompt simple de Coach IA ;
- les parametres `temperature`, `top_p` et `max_tokens` ;
- une reponse Mistral avec le statut `200 OK` ;
- les informations d'usage en tokens renvoyees par l'API.

Le test confirme que la cle API et le format de requete sont valides.

> La capture a ete realisee avec `max_tokens: 300`. Le champ `finish_reason: "length"` indique donc que la reponse a ete coupee par cette limite. Dans l'application, le nombre maximal de tokens est adapte au besoin : 300 pour le chat et 3500 pour un plan structure.

## Securite

- La cle API n'apparait ni dans la capture, ni dans la collection versionnee.
- La collection utilise la variable Postman `{{MISTRAL_API_KEY}}`.
- La valeur reelle de cette variable doit etre renseignee uniquement dans un environnement Postman local non versionne.
- Dans l'application, la cle est stockee dans `.env.local` sous `MISTRAL_API_KEY` et n'est utilisee que dans les routes serveur Next.js.

## Reproduire le test

1. Importer `sportsee-mistral.postman_collection.json` dans Postman.
2. Creer ou selectionner un environnement local.
3. Ajouter la variable `MISTRAL_API_KEY` avec la cle Mistral comme valeur locale.
4. Envoyer la requete **Mistral - chat completions**.
5. Verifier le statut `200 OK` et la presence de `choices[0].message.content`.

Ne jamais exporter ou envoyer un environnement Postman contenant la valeur reelle de la cle API.
