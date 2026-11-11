# Côté technique : Marché spatial

Ici, tu trouves en bref comment le code est organisé et comment le construire. Le mot de bienvenue et les premières
idées pour changer le jeu sont dans `README.md`.

## Organisation

C'est un projet pour MakeCode Arcade, écrit en TypeScript. `pxt.json` donne le nom du projet `marche-spatial` et la
liste de tous les fichiers, dans l'ordre où MakeCode les lit. `mkc.json` dit pour quel appareil on construit : le
Calliope mini 3 avec GameKit (variante « n3 »).

Les fichiers du jeu :

- `textes.ts` : ce fichier va chercher les textes du jeu dans un catalogue, grâce à des numéros fixes (t(numéro)).
- `donnees.ts` : les données fixes du jeu : mondes, marchandises, vaisseaux, missions et campagne.
- `modele.ts` : les règles et l'état du jeu : marché, missions, campagne et succès.
- `sauvegarde.ts` : enregistrer et charger la partie : deux emplacements automatiques et un pour sauvegarder à la main.
- `ecrans.ts` : tous les écrans et menus, et ce que font les boutons sur chacun d'eux.
- `intro.ts` : séquence de démarrage digne d'un film.
- `vol.ts` : le vol entre deux mondes : phases, rencontres, combats, sauvetage et amarrage.
- `son.ts` : conception sonore centrale pour le haut-parleur du Calliope mini 3 et du GameKit.
- `main.ts` : programme principal : démarrage, boucle de jeu et touches.

## Comment le jeu tourne

1. Au démarrage, `textes.ts` dépaquette le catalogue des textes. Puis `main.ts` prépare le son (`preparerSon`) et charge
   avec `chargerJeu` la sauvegarde valide la plus récente.
2. `lancerIntroReglee` joue l'intro : l'histoire, la carte du studio du Calliope Hacker et le titre. A ou B la saute.
   Ensuite, `reglerScene` ouvre l'écran titre.
3. À chaque image, `dessinerSceneActuelle` dessine l'écran actif (`Scene`) : titre, hangar, marché, chantier, missions,
   carte stellaire, état ou vol.
4. À chaque tour du jeu, `game.onUpdate` appelle `actualiserIntro`, `actualiserVol`, `actualiserAmbianceSonore` et
   `actualiserRepetitionMenu`.
5. Les boutons arrivent dans `traiterDirection`, `traiterA` et `traiterB`. Ce qu'ils font dépend de l'écran actif ; en
   vol, A tire avec l'arme choisie et B en change.

Il y a 24 mondes où tu peux voler (plus deux cachés) et 12 sortes de marchandises. La campagne compte 6 missions. Les
données fixes (mondes, marchandises, vaisseaux, missions) sont dans `donnees.ts` ; les règles et l'état du jeu sont dans
`modele.ts`.

## Textes et son

Tous les textes sont rangés, compressés, dans un catalogue dans `textes.ts`. Le jeu demande un texte par son numéro, par
exemple `Textes.t(247)` pour le mot CHANTIER. Pour savoir quel mot va avec un numéro, le plus rapide est le simulateur.
La musique et les sons viennent de `son.ts`, sans la grosse bibliothèque de musique, pour économiser la mémoire flash.

## Sauvegarde

`sauvegarde.ts` écrit la partie dans les réglages du Calliope : deux emplacements automatiques et un emplacement pour
sauvegarder à la main, chacun avec une somme de contrôle. Les réglages appartiennent à ce nom de projet, donc un autre
jeu ne les lit jamais. Si tu mets un autre programme sur l'appareil, MakeCode efface la sauvegarde au démarrage suivant.

## Construire le jeu

- **Dans le navigateur :** ouvre arcade.makecode.com, choisis « Importer » et ouvre le fichier du jeu
  `marche-spatial.hex`. Tout le code est dans le fichier du jeu. Le simulateur montre le jeu tout de suite.
- **Sur l'ordinateur :** avec l'outil en ligne de commande de MakeCode (paquet npm `makecode`), lance `makecode build`
  dans ce dossier. Le fichier du jeu pour l'appareil se trouve ensuite dans `built/n3/binary.hex`.

## Sur l'appareil

Branche le Calliope mini 3 à l'ordinateur avec le câble USB. Il apparaît comme un lecteur. Fais glisser le fichier du
jeu (`.hex`) sur ce lecteur ; le jeu démarre ensuite tout seul. L'écran du GameKit a 160 × 120 pixels et 16 couleurs. Le
jeu est gros et utilise presque toute la mémoire flash du Calliope ; des changements avec beaucoup de code nouveau
peuvent rendre le fichier du jeu trop grand.

Ce jeu existe aussi en allemand, en anglais et en espagnol. Les quatre versions viennent du même projet de départ.