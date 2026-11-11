# Marché spatial

Salut ! Voici **Marché spatial**, un jeu de **Calliope Hacker** pour le **Calliope mini 3 avec le GameKit**.

Tu commences avec un petit vaisseau et 500 crédits sur la station LUMA. Vole de monde en monde, achète des marchandises
à bas prix et revends-les plus cher ailleurs. Accepte des missions : transports, sauvetages et chasse aux pirates. Avec
tes gains, tu améliores ton vaisseau au chantier. Et l'histoire de l'Union stellaire te guide à travers six chapitres.
Il y a 24 mondes à découvrir. Au fait, dans le hangar, le Calliope Hacker se tient au pupitre de commande.

## Comment jouer

- **Dans les menus :** croix directionnelle = choisir, A = OK, B = retour
- **Pendant l'intro :** A ou B la saute
- **Au premier transport :** B dans le hangar demande si tu veux sauter l'entraînement
- **Dans le cockpit :** croix directionnelle = déplacer le viseur, A = tirer avec l'arme choisie (laser, missile, mine)
- **Dans le cockpit, près d'une capsule de sauvetage :** maintenir A l'attire avec le rayon tracteur
- **Dans le cockpit, appui court sur B :** changer d'arme
- **Dans le cockpit, B maintenu :** esquiver ; maintenu longtemps = s'enfuir (coûte 1 carburant)

## À toi de construire

Tout le code source est dans ce fichier de jeu. Ouvre-le dans MakeCode Arcade (arcade.makecode.com, « Importer »). Si
l'éditeur te demande le matériel au téléchargement, choisis « Calliope GameKit Shield ». Change un nombre, lance le
simulateur et regarde ce qui se passe :

- **Plus d'argent au début :** dans `modele.ts`, fonction `lancerNouvellePartie`, il y a `credits = 500`. Avec `5000`,
  tu peux acheter plusieurs améliorations au chantier tout de suite.
- **Tes propres noms de mondes :** dans `donnees.ts`, `NOMS_MONDES` contient les noms des mondes, par exemple `"LUMA"`.
  Donne-leur des noms à toi, mais courts (presque tous ceux du jeu ont quatre lettres) ; un nom long risque de ne pas
  tenir dans la ligne.
- **Un laser plus fort :** dans `modele.ts`, fonction `degatsLaser`, il y a `1 + ameliorations[AMELIORATION_LASER]`.
  Avec `3 + ...`, ton laser frappe trois fois plus fort dès le début.

L'explication du code source pour les enfants, les parents et les enseignants se trouve sur calliope-hacker.de.