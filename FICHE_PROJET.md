# Coup de Pouce — fiche d'identité

1. **Pour qui** : les étudiants du campus, avec un seul compte pour proposer et pour chercher.
2. **Quel problème** : trouver vite quelqu'un du campus qui sait faire ce dont on a besoin (photo, vidéo, dev, coloc, covoiturage), sans montrer ses coordonnées à tout le monde.
3. **Trois écrans** : Annonces (liste + publier), Demandes reçues (accepter ou refuser), Mon profil (CV, compétences confirmées par des avis).
4. **Ce qu'on ne fait pas** : pas de paiement, pas d'appli mobile à installer (site qui marche sur téléphone), pas de connexion Google au départ. Les avis (note de 1 à 5, un mot, une compétence confirmée) ne sont possibles qu'après une mise en relation acceptée, un par demande (décision du 26 octobre 2026, lot 6).
5. **Règle centrale** : mes coordonnées ne sont visibles qu'après mon accord.

## Outils
Claude écrit le code, GitHub le sauvegarde, Vercel le met en ligne, Supabase stocke les comptes et les données. Framework : Next.js.

## Ce que l'IA ne touche jamais
- Aucune clé secrète dans le code ; la clé `service_role` n'est jamais utilisée côté navigateur.
- Les règles d'accès (RLS) existantes, sauf demande explicite.
- Les tests déjà écrits : on code jusqu'à ce qu'ils passent, sans les modifier.
- Aucun nouvel outil ni nouvelle librairie sans demander d'abord.
- Une seule demande par étape ; poser ses questions avant de coder.
