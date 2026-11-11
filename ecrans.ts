// Tous les écrans et menus, et ce que font les boutons sur chacun d'eux.
const COULEUR_FOND = 15
const COULEUR_TEXTE = 1
const COULEUR_ROUGE = 2
const COULEUR_ORANGE = 4
const COULEUR_JAUNE = 5
const COULEUR_VERTE = 7
const COULEUR_BLEUE = 8
const COULEUR_CYAN = 9
const COULEUR_VIOLETTE = 10
const COULEUR_METAL = 11
const COULEUR_OMBRE = 12
const COULEUR_ATTENUEE = 13
const COULEUR_ROUILLE = 14

const ELEMENTS_HANGAR = hex`f630f7f8f9fafbfcfdfe`
const NOMBRE_ELEMENTS_TITRE = 10
const INDICE_VAISSEAU_CHANTIER = NOMBRE_AMELIORATIONS + 2
const INDICE_NOM_CHANTIER = INDICE_VAISSEAU_CHANTIER + 1
const INDICE_PEINTURE_CHANTIER = INDICE_NOM_CHANTIER + 1
const INDICE_MISSILE_CHANTIER = INDICE_PEINTURE_CHANTIER + 1
const INDICE_MINE_CHANTIER = INDICE_MISSILE_CHANTIER + 1
const NOMBRE_ELEMENTS_CHANTIER = INDICE_MINE_CHANTIER + 1
const NOMBRE_PAGES_ETAT = 7
const PAGE_VAISSEAU = 0
const PAGE_FACTIONS = 1
const PAGE_JOURNAL = 2
const PAGE_SUCCES = 3
const PAGE_OPTIONS = 4
const PAGE_MATERIEL = 5
const PAGE_DEVELOPPEUR = 6
let mondeCurseurCarte = 0
let idInstalleChantier = -1
let apercuRoleChantier = RoleVaisseau.Marchand
let texteMessageMarche = ""
let couleurMessageMarche = COULEUR_ATTENUEE
let finMessageMarcheMs = 0
let estMarcheNoir = false
let marchandageMission = 0
let pageEtat = PAGE_VAISSEAU
let curseurEtat = 0
let curseurSucces = 0
let derniereCibleRoute = -1
let imagesAffichage = 0
let ipsAffichage = 0
let fenetreImagesAffichageMs = 0
let derniersOctetsLibres = 0
let octetsLibresMin = 0
let sceneRetourEtat = Scene.Hangar
let confirmationPartiePlus = false
let cibleRouteCartePrecedente = 0
let toucheBTestee = false
let cleRenduAvis = ""
let revelationAvisCommencee = 0

function noterImageAffichage(): void {
    imagesAffichage++
}

function actualiserDiagnosticAffichage(): void {
    let instant = game.runtime()
    if (fenetreImagesAffichageMs == 0) fenetreImagesAffichageMs = instant
    if (instant - fenetreImagesAffichageMs < 1000) return
    ipsAffichage = Math.idiv(imagesAffichage * 1000, Math.max(1, instant - fenetreImagesAffichageMs))
    imagesAffichage = 0
    fenetreImagesAffichageMs = instant
    if (modeDeveloppeur) {
        // gcStats() renvoie null dans le simulateur ; la page garde alors les dernières valeurs.
        let stats = control.gcStats()
        if (stats) {
            derniersOctetsLibres = stats.lastFreeBytes
            octetsLibresMin = stats.minFreeBytes
        }
    }
}

function texteOuiNon(valeur: number): string {
    return valeur != 0 ? Textes.t(255) : Textes.t(201)
}

function couleurAccentStation(): number {
    let couleurs = [COULEUR_VERTE, COULEUR_ORANGE, COULEUR_CYAN, COULEUR_VIOLETTE, COULEUR_JAUNE, COULEUR_METAL]
    return couleurs[MONDE_ECONOMIE[mondeActuel] % couleurs.length]
}

function couleurSombreStation(): number {
    let couleurs = [COULEUR_OMBRE, COULEUR_ROUILLE, COULEUR_BLEUE, COULEUR_OMBRE, COULEUR_ROUILLE, COULEUR_BLEUE]
    return couleurs[MONDE_ECONOMIE[mondeActuel] % couleurs.length]
}

function couleurPeintureVaisseau(): number {
    let couleurs = [COULEUR_BLEUE, COULEUR_ROUGE, COULEUR_VERTE, COULEUR_JAUNE, COULEUR_VIOLETTE, COULEUR_METAL]
    return couleurs[peintureVaisseau[roleVaisseau] % couleurs.length]
}

function texteNombreMondesVisites(): number {
    let nombre = 0
    for (let i = 0; i < NOMBRE_MONDES; i++) if (mondeVisite(i)) nombre++
    return nombre
}

function nombreCaracteresVisiblesAvis(): number {
    let attente = vitesseTexte == 0 ? 85 : (vitesseTexte == 2 ? 20 : 45)
    return Math.idiv(Math.max(0, game.runtime() - revelationAvisCommencee), attente)
}

function morceauLigneAvis(texte: string, decalage: number): string {
    let nombre = Math.clamp(0, texte.length, nombreCaracteresVisiblesAvis() - decalage)
    return texte.substr(0, nombre)
}

function ecrireDroite(texte: string, droite: number, y: number, couleur: number): void {
    ecrireTexteJeu(texte, droite - texte.length * 6, y, couleur)
}

function dessinerEntete(titre: string): void {
    screen.fill(COULEUR_FOND)
    screen.fillRect(0, 0, 160, 13, contrasteEleve ? COULEUR_FOND : COULEUR_BLEUE)
    if (contrasteEleve) screen.drawRect(0, 0, 160, 13, COULEUR_TEXTE)
    ecrireTexteJeu(titre, 3, 3, contrasteEleve ? COULEUR_JAUNE : COULEUR_TEXTE)
    ecrireDroite(Textes.t(256) + credits, 157, 3, COULEUR_JAUNE)
}

function dessinerPied(gauche: string, droite: string): void {
    screen.fillRect(0, 108, 160, 12, contrasteEleve ? COULEUR_FOND : COULEUR_BLEUE)
    if (contrasteEleve) screen.drawRect(0, 108, 160, 12, COULEUR_TEXTE)
    ecrireTexteJeu(gauche, 3, 111, contrasteEleve ? COULEUR_JAUNE : COULEUR_TEXTE)
    ecrireDroite(droite, 157, 111, contrasteEleve ? COULEUR_JAUNE : COULEUR_TEXTE)
}

function dessinerSelection(y: number, hauteur: number): void {
    screen.fillRect(2, y - 1, 156, hauteur, contrasteEleve ? COULEUR_BLEUE : COULEUR_VIOLETTE)
}

function texteDefilant(texte: string, caracteresMax: number): string {
    if (texte.length <= caracteresMax) return texte
    // Les longues étiquettes restent lisibles en entier : une courte pause à chaque bout, et entre les deux
    // le texte défile.
    let distance = texte.length - caracteresMax
    let phase = Math.idiv(game.runtime(), 220) % (distance * 2 + 12)
    let decalage = phase < 6 ? 0
        : (phase < distance + 6 ? phase - 6 : (phase < distance + 12 ? distance : distance * 2 + 12 - phase))
    return texte.substr(decalage, caracteresMax)
}

function estModeTitreChangeable(): boolean {
    return !aSauvegarde || etapeCampagne >= NOMBRE_MISSIONS_CAMPAGNE
}

function modeJeuSelonIndice(indice: number): ModeJeu {
    if (indice == 1) return ModeJeu.Veteran
    if (indice == 2) return ModeJeu.Fer
    return ModeJeu.Standard
}

function parcourirModeTitre(sens: number): void {
    let suivant = (modeJeu + sens) % 3
    if (suivant < 0) suivant += 3
    modeJeu = modeJeuSelonIndice(suivant)
    if (aSauvegarde) enregistrerSauvegarde()
}

function texteElementTitre(indice: number): string {
    if (indice == 0) return aSauvegarde ? Textes.t(257) : Textes.t(254)
    if (indice == 1) return Textes.t(258) + nomModeIntro()
    if (indice == 2) return dureeIntroSecondes() > 0
        ? Textes.t(259) + dureeIntroSecondes() + Textes.t(260) : Textes.t(261)
    if (indice == 3) return Textes.t(262) + nomCranSon()
    if (indice == 4) return Textes.t(263) + nomDensiteEffet()
    if (indice == 5) return Textes.t(264) + nomModeJeu(modeJeu)
    if (indice == 6) return Textes.t(265)
    if (indice == 7) return Textes.t(266)
    if (indice == 8) return Textes.t(267)
    return Textes.t(268)
}

// Nom du jeu sur l'écran titre et dans l'intro : ligne 1 et ligne 2, séparées par « | ».
const TITRE_JEU = "MARCHÉ|SPATIAL"    // Nom en deux lignes

// Dessine le nom du jeu au milieu : la ligne 1 à la hauteur y, la ligne 2 décalée de ecart pixels vers le bas.
function dessinerTitreJeu(y: number, ecart: number): void {
    let coupure = TITRE_JEU.indexOf("|")
    let premier = coupure < 0 ? TITRE_JEU : TITRE_JEU.substr(0, coupure)
    ecrireTexteJeu(premier, 80 - 3 * premier.length, y, COULEUR_JAUNE)
    if (coupure < 0) return
    let deuxieme = TITRE_JEU.substr(coupure + 1)
    ecrireTexteJeu(deuxieme, 80 - 3 * deuxieme.length, y + ecart, COULEUR_JAUNE)
}

function dessinerTitre(): void {
    screen.fill(COULEUR_FOND)
    for (let i = 0; i < 22; i++) {
        let x = hasardFixe(i, 3, 9) % 160
        let y = hasardFixe(i, 7, 2) % 105
        screen.setPixel(x, y, i % 4 == 0 ? COULEUR_CYAN : COULEUR_ATTENUEE)
    }
    ecrireTexteJeu("CALLIOPE HACKER", 35, 2, COULEUR_VERTE)
    screen.drawLine(25, 13, 135, 13, COULEUR_CYAN)
    screen.drawLine(25, 43, 135, 43, COULEUR_CYAN)
    dessinerTitreJeu(16, 13)
    screen.drawLine(73, 49, 80, 45, COULEUR_VERTE)
    screen.drawLine(80, 45, 87, 49, COULEUR_VERTE)
    screen.drawLine(87, 49, 80, 53, COULEUR_VERTE)
    screen.drawLine(80, 53, 73, 49, COULEUR_VERTE)

    if (indiceMenu < sommetListe) sommetListe = indiceMenu
    if (indiceMenu >= sommetListe + 6) sommetListe = indiceMenu - 5
    for (let rangee = 0; rangee < 6; rangee++) {
        let i = sommetListe + rangee
        if (i >= NOMBRE_ELEMENTS_TITRE) break
        let y = 55 + rangee * 9
        if (i == indiceMenu) {
            screen.fillRect(17, y - 1, 126, 8, COULEUR_VIOLETTE)
            screen.fillRect(17, y - 1, 2, 8, COULEUR_JAUNE)
        }
        let couleur = COULEUR_TEXTE
        if (i == 5 && !estModeTitreChangeable()) couleur = COULEUR_ATTENUEE
        if (i == 8 && !peutLancerPartiePlus()) couleur = COULEUR_ATTENUEE
        if (i == 9 && !aSauvegarde) couleur = COULEUR_ATTENUEE
        ecrireTexteJeu((i == indiceMenu ? ">" : " ") +
            texteDefilant(texteElementTitre(i), 19), 21, y, couleur)
    }
    screen.fillRect(146, 55 + Math.idiv(indiceMenu * 45, NOMBRE_ELEMENTS_TITRE), 2, 7, COULEUR_JAUNE)
    if (sauvegardeEtaitCorrompue) ecrireTexteJeu(Textes.t(272), 3, 109, COULEUR_ROUGE)
    ecrireDroite(Textes.t(273), 157, 109, COULEUR_ATTENUEE)
}

function niveauPieceVaisseau(id: number, idSurbrillance: number, apercuSuivant: boolean): number {
    let niveau = ameliorations[id]
    if (apercuSuivant && id == idSurbrillance && niveau < MAX_AMELIORATION[id]) niveau++
    return niveau
}

function couleurPieceVaisseau(id: number, niveauPiece: number, idSurbrillance: number, apercuSuivant: boolean,
    couleurNormale: number): number {
    if (apercuSuivant && id == idSurbrillance && niveauPiece > ameliorations[id]) return COULEUR_JAUNE
    return couleurNormale
}

function dessinerLosangeApercu(cx: number, cy: number, demiLargeur: number, demiHauteur: number,
    couleur: number): void {
    screen.drawLine(cx, cy - demiHauteur, cx + demiLargeur, cy, couleur)
    screen.drawLine(cx + demiLargeur, cy, cx, cy + demiHauteur, couleur)
    screen.drawLine(cx, cy + demiHauteur, cx - demiLargeur, cy, couleur)
    screen.drawLine(cx - demiLargeur, cy, cx, cy - demiHauteur, couleur)
}

// Modèle en fil de fer vu du dessus. Chaque amélioration ajoute une pièce visible à la même silhouette de vaisseau.
function dessinerApercuVaisseau(cx: number, cy: number, idSurbrillance: number, apercuSuivant: boolean): void {
    let niveauBouclier = niveauPieceVaisseau(AMELIORATION_BOUCLIER, idSurbrillance, apercuSuivant)
    for (let i = 0; i < niveauBouclier; i++) {
        let couleurBouclier =
            couleurPieceVaisseau(AMELIORATION_BOUCLIER, i + 1, idSurbrillance, apercuSuivant, COULEUR_BLEUE)
        dessinerLosangeApercu(cx, cy, 21 + i * 2, 23 + i * 2, couleurBouclier)
    }

    let couleurCoque = idSurbrillance == -3 ? COULEUR_JAUNE : COULEUR_TEXTE
    screen.drawLine(cx, cy - 20, cx - 5, cy - 7, couleurCoque)
    screen.drawLine(cx - 5, cy - 7, cx - 20, cy + 8, couleurCoque)
    screen.drawLine(cx - 20, cy + 8, cx - 7, cy + 6, couleurCoque)
    screen.drawLine(cx - 7, cy + 6, cx - 6, cy + 17, couleurCoque)
    screen.drawLine(cx - 6, cy + 17, cx, cy + 13, couleurCoque)
    screen.drawLine(cx, cy + 13, cx + 6, cy + 17, couleurCoque)
    screen.drawLine(cx + 6, cy + 17, cx + 7, cy + 6, couleurCoque)
    screen.drawLine(cx + 7, cy + 6, cx + 20, cy + 8, couleurCoque)
    screen.drawLine(cx + 20, cy + 8, cx + 5, cy - 7, couleurCoque)
    screen.drawLine(cx + 5, cy - 7, cx, cy - 20, couleurCoque)
    screen.drawLine(cx, cy - 16, cx, cy + 12, COULEUR_ATTENUEE)

    let niveauBlindage = niveauPieceVaisseau(AMELIORATION_BLINDAGE, idSurbrillance, apercuSuivant)
    for (let i = 0; i < niveauBlindage; i++) {
        let couleurBlindage =
            couleurPieceVaisseau(AMELIORATION_BLINDAGE, i + 1, idSurbrillance, apercuSuivant, COULEUR_VERTE)
        screen.drawLine(cx - 2 - i, cy - 11, cx - 5 - i, cy + 7, couleurBlindage)
        screen.drawLine(cx + 2 + i, cy - 11, cx + 5 + i, cy + 7, couleurBlindage)
    }

    let niveauFret = niveauPieceVaisseau(AMELIORATION_FRET, idSurbrillance, apercuSuivant)
    if (niveauFret >= 1) {
        let couleurFret = couleurPieceVaisseau(AMELIORATION_FRET, 1, idSurbrillance, apercuSuivant, COULEUR_ORANGE)
        screen.drawRect(cx - 19, cy + 2, 5, 8, couleurFret)
        screen.drawRect(cx + 15, cy + 2, 5, 8, couleurFret)
    }
    if (niveauFret >= 2) {
        let couleurFret = couleurPieceVaisseau(AMELIORATION_FRET, 2, idSurbrillance, apercuSuivant, COULEUR_ORANGE)
        screen.drawRect(cx - 13, cy + 9, 5, 7, couleurFret)
        screen.drawRect(cx + 9, cy + 9, 5, 7, couleurFret)
    }
    if (niveauFret >= 3) {
        let couleurFret = couleurPieceVaisseau(AMELIORATION_FRET, 3, idSurbrillance, apercuSuivant, COULEUR_ORANGE)
        screen.drawRect(cx - 22, cy - 4, 4, 7, couleurFret)
        screen.drawRect(cx + 19, cy - 4, 4, 7, couleurFret)
    }

    let niveauLaser = niveauPieceVaisseau(AMELIORATION_LASER, idSurbrillance, apercuSuivant)
    if (niveauLaser >= 1) {
        let couleurLaser = couleurPieceVaisseau(AMELIORATION_LASER, 1, idSurbrillance, apercuSuivant, COULEUR_ROUGE)
        screen.drawLine(cx - 2, cy - 17, cx - 2, cy - 24, couleurLaser)
        screen.drawLine(cx + 2, cy - 17, cx + 2, cy - 24, couleurLaser)
    }
    if (niveauLaser >= 2) {
        let couleurLaser = couleurPieceVaisseau(AMELIORATION_LASER, 2, idSurbrillance, apercuSuivant, COULEUR_ROUGE)
        screen.setPixel(cx - 3, cy - 25, couleurLaser)
        screen.setPixel(cx + 3, cy - 25, couleurLaser)
    }
    if (niveauLaser >= 3) {
        let couleurLaser = couleurPieceVaisseau(AMELIORATION_LASER, 3, idSurbrillance, apercuSuivant, COULEUR_ROUGE)
        screen.drawLine(cx - 2, cy - 25, cx - 2, cy - 28, couleurLaser)
        screen.drawLine(cx + 2, cy - 25, cx + 2, cy - 28, couleurLaser)
    }

    let niveauRefroidisseur = niveauPieceVaisseau(AMELIORATION_REFROIDISSEUR, idSurbrillance, apercuSuivant)
    for (let i = 0; i < niveauRefroidisseur; i++) {
        let couleurRefroidisseur =
            couleurPieceVaisseau(AMELIORATION_REFROIDISSEUR, i + 1, idSurbrillance, apercuSuivant, COULEUR_CYAN)
        let yAilette = cy - 1 + i * 5
        screen.drawLine(cx - 8, yAilette, cx - 13, yAilette - 2, couleurRefroidisseur)
        screen.drawLine(cx + 8, yAilette, cx + 13, yAilette - 2, couleurRefroidisseur)
    }

    let niveauSaut = niveauPieceVaisseau(AMELIORATION_SAUT, idSurbrillance, apercuSuivant)
    for (let i = 0; i < niveauSaut; i++) {
        let couleurSaut =
            couleurPieceVaisseau(AMELIORATION_SAUT, i + 1, idSurbrillance, apercuSuivant, COULEUR_VIOLETTE)
        let yBobine = cy + 8 + i * 3
        screen.drawLine(cx - 4, yBobine, cx + 4, yBobine, couleurSaut)
    }

    let niveauPropulseur = niveauPieceVaisseau(AMELIORATION_PROPULSEUR, idSurbrillance, apercuSuivant)
    let longueurFlammeInstallee = 3 + ameliorations[AMELIORATION_PROPULSEUR] * 2
    let couleurPropulseur = idSurbrillance == -2 ? COULEUR_JAUNE : COULEUR_ORANGE
    screen.drawLine(cx - 4, cy + 17, cx - 4, cy + 17 + longueurFlammeInstallee, couleurPropulseur)
    screen.drawLine(cx + 4, cy + 17, cx + 4, cy + 17 + longueurFlammeInstallee, couleurPropulseur)
    if (apercuSuivant && idSurbrillance == AMELIORATION_PROPULSEUR &&
        niveauPropulseur > ameliorations[AMELIORATION_PROPULSEUR]) {
        let longueurFlammeApercu = 3 + niveauPropulseur * 2
        screen.drawLine(cx - 4, cy + 17 + longueurFlammeInstallee, cx - 4, cy + 17 + longueurFlammeApercu,
            COULEUR_JAUNE)
        screen.drawLine(cx + 4, cy + 17 + longueurFlammeInstallee, cx + 4, cy + 17 + longueurFlammeApercu,
            COULEUR_JAUNE)
    }

    let niveauScanner = niveauPieceVaisseau(AMELIORATION_SCANNER, idSurbrillance, apercuSuivant)
    if (niveauScanner >= 1) {
        let couleurScanner = couleurPieceVaisseau(AMELIORATION_SCANNER, 1, idSurbrillance, apercuSuivant, COULEUR_CYAN)
        dessinerLosangeApercu(cx, cy - 3, 4, 3, couleurScanner)
    }
    if (niveauScanner >= 2) {
        let couleurScanner = couleurPieceVaisseau(AMELIORATION_SCANNER, 2, idSurbrillance, apercuSuivant, COULEUR_CYAN)
        screen.drawRect(cx - 5, cy - 7, 11, 9, couleurScanner)
    }

    let niveauReparation = niveauPieceVaisseau(AMELIORATION_REPARATION, idSurbrillance, apercuSuivant)
    if (niveauReparation > 0) {
        let couleurReparation =
            couleurPieceVaisseau(AMELIORATION_REPARATION, 1, idSurbrillance, apercuSuivant, COULEUR_VERTE)
        screen.drawRect(cx + 21, cy - 9, 5, 5, couleurReparation)
        screen.drawLine(cx + 23, cy - 11, cx + 23, cy - 2, couleurReparation)
        screen.drawLine(cx + 19, cy - 7, cx + 27, cy - 7, couleurReparation)
    }

    let niveauAssurance = niveauPieceVaisseau(AMELIORATION_ASSURANCE, idSurbrillance, apercuSuivant)
    if (niveauAssurance > 0) {
        let couleurAssurance =
            couleurPieceVaisseau(AMELIORATION_ASSURANCE, 1, idSurbrillance, apercuSuivant, COULEUR_VERTE)
        screen.drawLine(cx - 24, cy - 15, cx - 24, cy - 10, couleurAssurance)
        screen.drawLine(cx - 24, cy - 15, cx - 19, cy - 15, couleurAssurance)
        screen.drawLine(cx + 24, cy - 15, cx + 24, cy - 10, couleurAssurance)
        screen.drawLine(cx + 24, cy - 15, cx + 19, cy - 15, couleurAssurance)
        if (niveauAssurance >= 2) {
            couleurAssurance =
                couleurPieceVaisseau(AMELIORATION_ASSURANCE, 2, idSurbrillance, apercuSuivant, COULEUR_VERTE)
            screen.drawLine(cx - 24, cy + 15, cx - 24, cy + 10, couleurAssurance)
            screen.drawLine(cx - 24, cy + 15, cx - 19, cy + 15, couleurAssurance)
            screen.drawLine(cx + 24, cy + 15, cx + 24, cy + 10, couleurAssurance)
            screen.drawLine(cx + 24, cy + 15, cx + 19, cy + 15, couleurAssurance)
        }
    }
}

function dessinerApercuRoleVaisseau(cx: number, cy: number, role: RoleVaisseau): void {
    if (role == RoleVaisseau.Marchand) {
        screen.drawRect(cx - 27, cy + 4, 5, 10, COULEUR_ORANGE)
        screen.drawRect(cx + 23, cy + 4, 5, 10, COULEUR_ORANGE)
        screen.drawLine(cx - 25, cy + 14, cx + 25, cy + 14, COULEUR_ORANGE)
    } else if (role == RoleVaisseau.Coursier) {
        screen.drawLine(cx - 8, cy + 20, cx - 8, cy + 27, COULEUR_CYAN)
        screen.drawLine(cx, cy + 17, cx, cy + 29, COULEUR_JAUNE)
        screen.drawLine(cx + 8, cy + 20, cx + 8, cy + 27, COULEUR_CYAN)
    } else {
        screen.drawLine(cx - 7, cy - 20, cx - 7, cy - 28, COULEUR_ROUGE)
        screen.drawLine(cx + 7, cy - 20, cx + 7, cy - 28, COULEUR_ROUGE)
        dessinerLosangeApercu(cx, cy - 4, 7, 5, COULEUR_ROUGE)
    }
}

function resumeNiveauAmelioration(id: number, niveau: number): string {
    if (id == AMELIORATION_FRET) return Textes.t(274) + (8 + niveau * 4)
    if (id == AMELIORATION_BOUCLIER) return Textes.t(275) + (4 + niveau * 3)
    if (id == AMELIORATION_BLINDAGE) return Textes.t(276) + (8 + niveau * 3)
    if (id == AMELIORATION_LASER) return Textes.t(195) + (1 + niveau)
    if (id == AMELIORATION_REFROIDISSEUR) return Textes.t(196) + Math.max(180, 440 - niveau * 100)
    if (id == AMELIORATION_PROPULSEUR) return Textes.t(197) + Math.max(1200, 2600 - niveau * 500)
    if (id == AMELIORATION_SCANNER) return Textes.t(198) + niveau
    if (id == AMELIORATION_SAUT) return Textes.t(199) + (2 + niveau)
    if (id == AMELIORATION_REPARATION) return niveau > 0 ? Textes.t(277) : Textes.t(278)
    if (id == AMELIORATION_ASSURANCE)
        return niveau == 0 ? Textes.t(202) : (niveau == 1 ? Textes.t(203) : Textes.t(279))
    return ""
}

function remplirQuadrilatereHangar(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number,
    y3: number, couleur: number): void {
    screen.fillTriangle(x0, y0, x1, y1, x2, y2, couleur)
    screen.fillTriangle(x0, y0, x2, y2, x3, y3, couleur)
}

function dessinerFondHangar3D(): void {
    let couleurAccent = couleurAccentStation()
    let couleurSombre = couleurSombreStation()
    screen.fillRect(0, 13, 160, 95, COULEUR_FOND)

    // Un toit profond et des poutres convergent vers l'atelier arrière.
    remplirQuadrilatereHangar(0, 13, 159, 13, 149, 39, 64, 39, COULEUR_BLEUE)
    screen.drawLine(0, 18, 159, 18, COULEUR_METAL)
    screen.drawLine(13, 26, 155, 26, COULEUR_METAL)
    screen.drawLine(35, 34, 151, 34, COULEUR_METAL)
    screen.drawLine(0, 13, 76, 39, COULEUR_ATTENUEE)
    screen.drawLine(29, 13, 88, 39, COULEUR_ATTENUEE)
    screen.drawLine(58, 13, 98, 39, COULEUR_ATTENUEE)
    screen.drawLine(87, 13, 108, 39, COULEUR_ATTENUEE)
    screen.drawLine(116, 13, 121, 39, COULEUR_ATTENUEE)
    screen.drawLine(145, 13, 137, 39, COULEUR_ATTENUEE)
    screen.drawLine(4, 18, 29, 26, COULEUR_OMBRE)
    screen.drawLine(29, 18, 13, 26, COULEUR_OMBRE)
    screen.drawLine(58, 18, 88, 26, COULEUR_OMBRE)
    screen.drawLine(88, 18, 58, 26, COULEUR_OMBRE)
    screen.drawLine(116, 18, 145, 26, COULEUR_OMBRE)
    screen.drawLine(145, 18, 116, 26, COULEUR_OMBRE)

    // Mur arrière en pente et porte étanche faite de segments.
    remplirQuadrilatereHangar(62, 38, 159, 31, 159, 72, 62, 67, couleurSombre)
    remplirQuadrilatereHangar(72, 42, 155, 37, 155, 68, 72, 63, COULEUR_OMBRE)
    screen.drawLine(72, 42, 155, 37, COULEUR_ATTENUEE)
    screen.drawLine(72, 63, 155, 68, COULEUR_ATTENUEE)
    screen.drawLine(91, 41, 91, 64, COULEUR_METAL)
    screen.drawLine(112, 40, 112, 65, COULEUR_METAL)
    screen.drawLine(133, 38, 133, 67, COULEUR_METAL)
    screen.drawLine(72, 52, 155, 52, couleurAccent)
    screen.fillRect(146, 41, 5, 4, COULEUR_ROUGE)
    screen.setPixel(148, 42, COULEUR_JAUNE)

    // Sol en perspective, aire de lancement, rails et quadrillage du sol qui s'élargit.
    screen.fillRect(0, 64, 160, 44, COULEUR_OMBRE)
    remplirQuadrilatereHangar(104, 61, 119, 61, 153, 108, 54, 108, COULEUR_METAL)
    remplirQuadrilatereHangar(108, 63, 116, 63, 135, 108, 81, 108, COULEUR_BLEUE)
    screen.drawLine(111, 61, 42, 108, COULEUR_ATTENUEE)
    screen.drawLine(111, 61, 75, 108, COULEUR_ATTENUEE)
    screen.drawLine(113, 61, 112, 108, COULEUR_ATTENUEE)
    screen.drawLine(114, 61, 148, 108, COULEUR_ATTENUEE)
    screen.drawLine(115, 61, 159, 91, COULEUR_ATTENUEE)
    screen.drawLine(94, 72, 131, 72, COULEUR_ATTENUEE)
    screen.drawLine(80, 81, 142, 81, COULEUR_ATTENUEE)
    screen.drawLine(63, 94, 154, 94, COULEUR_ATTENUEE)
    screen.drawLine(39, 106, 159, 106, COULEUR_ATTENUEE)
    screen.drawLine(101, 65, 72, 108, couleurAccent)
    screen.drawLine(121, 65, 143, 108, couleurAccent)
    screen.fillRect(96, 72, 2, 2, COULEUR_JAUNE)
    screen.fillRect(89, 82, 2, 2, COULEUR_CYAN)
    screen.fillRect(80, 96, 3, 2, COULEUR_JAUNE)
    screen.fillRect(128, 72, 2, 2, COULEUR_JAUNE)
    screen.fillRect(134, 83, 2, 2, COULEUR_CYAN)
    screen.fillRect(140, 97, 3, 2, COULEUR_JAUNE)

    // Le seuil de la porte et les supports sont au premier plan ; le sol ne doit pas les effacer.
    screen.drawLine(72, 63, 155, 68, COULEUR_METAL)
    screen.drawLine(72, 64, 155, 69, COULEUR_ROUILLE)
    screen.fillRect(59, 34, 10, 48, couleurSombre)
    screen.fillRect(62, 37, 3, 42, COULEUR_METAL)
    screen.fillRect(153, 28, 7, 57, couleurSombre)
    screen.fillRect(153, 33, 2, 47, COULEUR_METAL)
    screen.drawLine(59, 44, 69, 54, COULEUR_OMBRE)
    screen.drawLine(69, 44, 59, 54, COULEUR_OMBRE)
    screen.fillRect(57, 80, 14, 3, COULEUR_METAL)
    screen.fillRect(151, 83, 9, 3, COULEUR_METAL)
}

const X_MINI_HACKER = 136
const Y_MINI_HACKER = 46
// Capuche sur la tête, sweat à capuche et pantalon noirs, baskets turquoise ; à droite, le bureau avec un écran.
const MINI_HACKER = img`
    . . . . . . . . b b b b b b b .
    . . . b b b . . b 9 9 9 9 9 b .
    . . b f f f b . b 9 7 9 7 9 b .
    . . b f f f b . b 9 9 9 9 9 b .
    . . b f f f b . b b b b b b b .
    . b f f f f f b . . . b . . . .
    b f f f f f f f f d d d d d d d
    b f f f f f f b b b b b b b b b
    b f f f f f f b . b . . . . . b
    . b f f f f b . . b . . . . . b
    . b f f . f f b . b . . . . . b
    . b f f . f f b . . . . . . . .
    . 6 6 6 . 6 6 6 . . . . . . . .
`

function dessinerVaisseauHangar3D(): void {
    let peintureCoque = couleurPeintureVaisseau()
    // L'ombre et l'enveloppe du bouclier se trouvent derrière le vaisseau plein.
    remplirQuadrilatereHangar(73, 95, 91, 88, 155, 89, 142, 102, COULEUR_FOND)
    for (let i = 0; i < ameliorations[AMELIORATION_BOUCLIER]; i++) {
        dessinerLosangeApercu(116, 70, 39 + i * 2, 27 + i * 2,
            i == ameliorations[AMELIORATION_BOUCLIER] - 1 ? COULEUR_CYAN : COULEUR_BLEUE)
    }

    // L'aile éloignée et l'aile proche, avec leurs faces inférieures plus sombres.
    screen.fillTriangle(106, 66, 122, 43, 150, 83, peintureCoque)
    screen.drawLine(106, 66, 122, 43, COULEUR_CYAN)
    screen.drawLine(122, 43, 150, 83, COULEUR_ATTENUEE)
    screen.fillTriangle(106, 70, 73, 96, 152, 87, COULEUR_ATTENUEE)
    screen.fillTriangle(73, 96, 152, 87, 144, 93, COULEUR_OMBRE)
    screen.drawLine(73, 96, 106, 70, COULEUR_TEXTE)
    screen.drawLine(73, 96, 152, 87, COULEUR_CYAN)

    // Long fuselage asymétrique : dessus clair, côté sombre et nez pointu.
    remplirQuadrilatereHangar(80, 51, 111, 62, 154, 84, 106, 72, COULEUR_ATTENUEE)
    remplirQuadrilatereHangar(80, 58, 106, 72, 154, 84, 105, 79, peintureCoque)
    screen.drawLine(80, 51, 111, 62, COULEUR_TEXTE)
    screen.drawLine(111, 62, 154, 84, COULEUR_TEXTE)
    screen.drawLine(80, 58, 105, 79, COULEUR_CYAN)
    screen.drawLine(105, 79, 154, 84, COULEUR_CYAN)

    // Dérives arrière, vitre du cockpit et carters des moteurs.
    screen.fillTriangle(81, 53, 92, 43, 106, 64, COULEUR_METAL)
    screen.fillTriangle(81, 59, 75, 70, 106, 70, COULEUR_OMBRE)
    screen.drawLine(92, 43, 106, 64, COULEUR_TEXTE)
    remplirQuadrilatereHangar(108, 60, 126, 67, 133, 76, 115, 70, COULEUR_FOND)
    screen.drawLine(108, 60, 126, 67, COULEUR_CYAN)
    screen.drawLine(126, 67, 133, 76, COULEUR_CYAN)
    screen.drawLine(133, 76, 115, 70, COULEUR_BLEUE)
    screen.fillRect(77, 52, 6, 4, COULEUR_FOND)
    screen.fillRect(76, 59, 6, 4, COULEUR_FOND)
    screen.drawRect(77, 52, 6, 4, COULEUR_ORANGE)
    screen.drawRect(76, 59, 6, 4, COULEUR_ORANGE)

    // Le train d'atterrissage pose le vaisseau sur l'aire éclairée.
    screen.drawLine(96, 81, 94, 98, COULEUR_TEXTE)
    screen.drawLine(91, 98, 99, 98, COULEUR_ATTENUEE)
    screen.drawLine(137, 84, 139, 98, COULEUR_TEXTE)
    screen.drawLine(135, 98, 143, 98, COULEUR_ATTENUEE)

    // L'équipement installé reste visible sur le modèle 3D du hangar.
    for (let i = 0; i < ameliorations[AMELIORATION_BLINDAGE]; i++) {
        screen.drawLine(92 + i * 4, 58 + i, 116 + i * 4, 69 + i * 2, COULEUR_VERTE)
    }
    for (let i = 0; i < ameliorations[AMELIORATION_REFROIDISSEUR]; i++) {
        screen.drawLine(91 - i * 5, 83 + i * 3, 102 - i * 3, 76 + i * 2, COULEUR_CYAN)
    }
    for (let i = 0; i < ameliorations[AMELIORATION_FRET]; i++) {
        screen.drawRect(84 + i * 7, 76 + i * 2, 6, 5, COULEUR_ORANGE)
    }
    for (let i = 0; i < ameliorations[AMELIORATION_SAUT]; i++) {
        screen.drawLine(78 - i, 51 + i * 5, 84 + i, 54 + i * 5, COULEUR_VIOLETTE)
    }
    if (ameliorations[AMELIORATION_LASER] > 0) {
        screen.drawLine(149, 80, 159, 82, COULEUR_ROUGE)
        screen.drawLine(148, 84, 159, 87, COULEUR_ROUGE)
    }
    if (ameliorations[AMELIORATION_PROPULSEUR] > 0) {
        screen.drawLine(76, 54, 70 - ameliorations[AMELIORATION_PROPULSEUR] * 2, 52, COULEUR_JAUNE)
        screen.drawLine(75, 61, 69 - ameliorations[AMELIORATION_PROPULSEUR] * 2, 61, COULEUR_ORANGE)
    }
    if (ameliorations[AMELIORATION_SCANNER] > 0) {
        dessinerLosangeApercu(114, 57, 4 + ameliorations[AMELIORATION_SCANNER], 3, COULEUR_CYAN)
        screen.drawLine(114, 57, 111, 51, COULEUR_CYAN)
    }
    if (ameliorations[AMELIORATION_REPARATION] > 0) {
        screen.drawRect(143, 49, 5, 5, COULEUR_VERTE)
        screen.drawLine(145, 47, 145, 56, COULEUR_VERTE)
        screen.drawLine(141, 51, 150, 51, COULEUR_VERTE)
    }
    if (ameliorations[AMELIORATION_ASSURANCE] > 0) {
        screen.drawLine(76, 46, 83, 46, COULEUR_VERTE)
        screen.drawLine(76, 46, 76, 52, COULEUR_VERTE)
        screen.drawLine(156, 76, 156, 82, COULEUR_VERTE)
        screen.drawLine(156, 76, 149, 76, COULEUR_VERTE)
        if (ameliorations[AMELIORATION_ASSURANCE] > 1) {
            screen.drawLine(72, 99, 79, 99, COULEUR_VERTE)
            screen.drawLine(72, 99, 72, 93, COULEUR_VERTE)
            screen.drawLine(156, 94, 156, 100, COULEUR_VERTE)
            screen.drawLine(156, 100, 149, 100, COULEUR_VERTE)
        }
    }

    // La forme du rôle se voit sur le vaisseau garé, comme dans l'aperçu.
    if (roleVaisseau == RoleVaisseau.Marchand) {
        screen.drawRect(82, 82, 7, 5, COULEUR_ORANGE)
        screen.drawRect(91, 84, 7, 5, COULEUR_ORANGE)
    } else if (roleVaisseau == RoleVaisseau.Coursier) {
        screen.drawLine(76, 54, 67, 51, COULEUR_CYAN)
        screen.drawLine(75, 61, 66, 61, COULEUR_JAUNE)
    } else {
        screen.drawLine(148, 79, 159, 80, COULEUR_ROUGE)
        screen.drawLine(147, 86, 159, 89, COULEUR_ROUGE)
    }

    // Une bande de peinture dans la couleur de la station et un insigne jaune qui s'allonge avec le rang.
    screen.drawLine(91, 63, 141, 80, couleurAccentStation())
    screen.fillRect(119, 71, 3 + Math.min(5, rangActuel()), 2, COULEUR_JAUNE)
}

function dessinerHangar(): void {
    dessinerEntete(Textes.t(280) + NOMS_MONDES[mondeActuel])
    dessinerFondHangar3D()
    dessinerVaisseauHangar3D()
    screen.fillRect(156, 28, 4, 58, COULEUR_ROUILLE)
    screen.drawLine(156, 34, 159, 38, COULEUR_METAL)
    screen.drawLine(159, 38, 156, 42, COULEUR_METAL)

    // Un petit drone d'entretien relié au vaisseau par un câble et deux lumières clignotantes donnent vie à la station,
    // sans utiliser de sprites (des petites images toutes faites).
    let phaseDrone = Math.idiv(game.runtime(), 90) % 76
    let xDrone = 78 + phaseDrone
    let yDrone = 42 + Math.idiv(Math.abs(38 - phaseDrone), 8)
    screen.fillRect(xDrone, yDrone, 4, 2, COULEUR_VERTE)
    screen.setPixel(xDrone - 1, yDrone + 1, COULEUR_CYAN)
    screen.drawLine(xDrone + 2, yDrone + 2, 116, 70, COULEUR_ATTENUEE)
    if (Math.idiv(game.runtime(), 280) % 2 == 0) {
        screen.fillRect(147, 41, 3, 2, COULEUR_JAUNE)
        screen.setPixel(96, 73, couleurAccentStation())
    }
    // Apparition spéciale : le Calliope Hacker est au pupitre de commande, sur la passerelle du fond, devant le
    // câble du drone.
    screen.drawTransparentImage(MINI_HACKER, X_MINI_HACKER, Y_MINI_HACKER)

    // Console de commande : la scène reste grande, le menu défile sans à-coups.
    screen.fillRect(1, 17, 70, 83, COULEUR_FOND)
    screen.drawRect(1, 17, 70, 83, COULEUR_METAL)
    if (indiceMenu < sommetListe) sommetListe = indiceMenu
    if (indiceMenu >= sommetListe + 6) sommetListe = indiceMenu - 5
    for (let rangee = 0; rangee < 6; rangee++) {
        let i = sommetListe + rangee
        if (i >= ELEMENTS_HANGAR.length) break
        let y = 21 + rangee * 13
        if (i == indiceMenu) {
            screen.fillRect(3, y - 1, 65, 10, COULEUR_VIOLETTE)
            screen.fillRect(3, y - 1, 2, 10, COULEUR_JAUNE)
        }
        let couleur = COULEUR_TEXTE
        if (i == 1 && !marcheNoirDisponible()) couleur = COULEUR_ATTENUEE
        if (i == 9 && mondeDestination == mondeActuel) couleur = COULEUR_ATTENUEE
        // Seule la ligne choisie défile ; les autres montrent le début du mot.
        let etiquette = Textes.t(ELEMENTS_HANGAR[i])
        ecrireTexteJeu(i == indiceMenu ? texteDefilant(etiquette, 10) : etiquette.substr(0, 10), 7, y, couleur)
        let cibleTutoriel = etapeTutoriel == 1 ? 3
            : (etapeTutoriel == 2 ? (mondeDestination == mondeActuel ? 4 : 9) : -1)
        // Le « ! » est dans la colonne 2 de sa case : à x 65, il est dessiné à x 67, un pixel après une dixième lettre
        // et avant la barre de défilement (x 68).
        if (i == cibleTutoriel && Math.idiv(game.runtime(), 250) % 2 == 0)
            ecrireTexteJeu("!", 65, y, COULEUR_JAUNE)
    }
    screen.fillRect(68, 20 + Math.idiv(indiceMenu * 73, ELEMENTS_HANGAR.length), 2, 8, couleurAccentStation())

    screen.fillRect(101, 15, 58, 11, COULEUR_FOND)
    screen.drawRect(101, 15, 58, 11, COULEUR_CYAN)
    let etiquetteRoute = nombreBondsRoute() > 1 ? Textes.t(281) + carburant +
        Textes.t(282) + nombreBondsRoute() + ">" +
        NOMS_MONDES[mondeEtapeRoute(nombreBondsRoute())] : Textes.t(281) + carburant + " >" +
        NOMS_MONDES[mondeDestination]
    ecrireDroite(texteDefilant(etiquetteRoute, 9), 156, 18,
        mondeDestination == mondeActuel ? COULEUR_ATTENUEE : COULEUR_JAUNE)
    screen.fillRect(96, 27, 63, 9, COULEUR_FOND)
    ecrireDroite(texteDefilant(nomTraitMonde(mondeActuel), 10), 157, 29, couleurAccentStation())
    screen.fillRect(73, 99, 85, 9, COULEUR_FOND)
    if (indiceMenu == 9) {
        let assure = ameliorations[AMELIORATION_ASSURANCE] == 0 ? Textes.t(283)
            : (ameliorations[AMELIORATION_ASSURANCE] == 1 ? Textes.t(284) : Textes.t(285))
        ecrireDroite(texteDefilant(assure, 14), 157, 101, COULEUR_JAUNE)
    } else ecrireDroite(texteDefilant(nomAffichageVaisseau(roleVaisseau) + " / " + nomPeintureVaisseau(roleVaisseau),
        14), 157, 101, COULEUR_ATTENUEE)
    if (enCoursLivraisonGuide()) {
        screen.fillRect(0, 98, 160, 10, COULEUR_BLEUE)
        screen.fillRect(0, 98, 6, 10, COULEUR_JAUNE)
        ecrireTexteJeu(Textes.t(286), 1, 101, COULEUR_FOND)
        ecrireTexteJeu(texteDefilant(nomEtapeTutoriel(), 25), 8, 101, COULEUR_JAUNE)
    }
    if (confirmationOuverte) {
        dessinerBoiteConfirmation(Textes.t(630), 0)
        screen.fillRect(0, 108, 160, 12, COULEUR_FOND)
    } else dessinerPied(Textes.t(273), enCoursLivraisonGuide() ? Textes.t(629) : Textes.t(287))
}

function enCoursLivraisonGuide(): boolean {
    return etapeTutoriel >= 1 && etapeTutoriel <= 3
}

// Saute le premier transport guidé : l'état final est le même que s'il était terminé (étape 4, scanner), seulement
// sans la récompense.
function passerLivraisonGuide(): void {
    if (sourceMission == 2) effacerMission()
    etapeTutoriel = 4
    ameliorations[AMELIORATION_SCANNER] = Math.max(1, ameliorations[AMELIORATION_SCANNER])
    enregistrerSauvegarde()
    sonConfirmation()
    // La troisième ligne indique la prochaine étape du guidage sauté : accepter une mission.
    afficherAvis(Textes.t(631), Textes.t(632), Textes.t(236), Scene.Hangar)
}

function texteNomMarche(nom: string, rangee: number): string {
    return rangee == indiceMenu ? texteDefilant(nom, 9) : nom.substr(0, 9)
}

function dessinerMarche(): void {
    dessinerEntete((estMarcheNoir ? Textes.t(288) : Textes.t(289)) + NOMS_MONDES[mondeActuel])
    ecrireTexteJeu(Textes.t(290), 5, 16, COULEUR_ATTENUEE)
    ecrireTexteJeu(estMarcheNoir ? Textes.t(291) : Textes.t(291), 66, 16, COULEUR_ATTENUEE)
    ecrireTexteJeu(Textes.t(292), 126, 16, COULEUR_ATTENUEE)
    let nombreElements = estMarcheNoir ? NOMBRE_MARCHANDISES + NOMBRE_FRETS_RARES : NOMBRE_MARCHANDISES
    if (indiceMenu < sommetListe) sommetListe = indiceMenu
    if (indiceMenu >= sommetListe + 6) sommetListe = indiceMenu - 5
    for (let rangee = 0; rangee < 6; rangee++) {
        let marchandise = sommetListe + rangee
        if (marchandise >= nombreElements) break
        let y = 28 + rangee * 12
        if (marchandise == indiceMenu && !transactionOuverte) dessinerSelection(y, 10)
        if (marchandise < NOMBRE_MARCHANDISES) {
            // Les noms restent dans leur colonne (9 caractères, puis un espace jusqu'aux prix à x 66) ; comme dans le
            // menu du hangar, seul un long nom de la ligne choisie défile, les autres montrent le début du mot.
            ecrireTexteJeu(
                texteNomMarche(Textes.t(NOMS_MARCHANDISES[marchandise]), marchandise), 5, y, COULEUR_TEXTE)
            let prixAchat = estMarcheNoir ? prixAchatMarcheNoir(marchandise) : prixAchatMarche(marchandise)
            let prixVente = estMarcheNoir ? prixVenteMarcheNoir(marchandise) : prixVenteMarche(marchandise)
            // Sur la sélection violette, les prix rouges du marché noir s'écrivent dans la même couleur que le nom,
            // celle du texte.
            ecrireTexteJeu(prixAchat + "/" + prixVente, 66, y,
                estMarcheNoir ?
                    (marchandise == indiceMenu && !transactionOuverte ? COULEUR_TEXTE : COULEUR_ROUGE) : COULEUR_JAUNE)
            ecrireTexteJeu((estMarcheNoir ? "--" : stockMarche[marchandise]) + "/" +
                fret[marchandise], 126, y, COULEUR_VERTE)
        } else {
            let rare = marchandise - NOMBRE_MARCHANDISES
            // La barre de sélection est violette aussi : le fret rare choisi est écrit dans la couleur du texte.
            ecrireTexteJeu(texteNomMarche(nomFretRare(rare), marchandise), 5, y,
                marchandise == indiceMenu && !transactionOuverte ? COULEUR_TEXTE : COULEUR_VIOLETTE)
            ecrireTexteJeu("--/" + valeurFretRare(rare), 66, y, COULEUR_JAUNE)
            ecrireTexteJeu("--/" + fretsRares[rare], 126, y,
                fretsRares[rare] > 0 ? COULEUR_VERTE : COULEUR_ATTENUEE)
        }
    }
    screen.fillRect(0, 97, 160, 11, COULEUR_FOND)
    if (texteMessageMarche != "" && game.runtime() < finMessageMarcheMs) {
        ecrireTexteJeu(texteDefilant(texteMessageMarche, 26), 3, 100, couleurMessageMarche)
    } else {
        texteMessageMarche = ""
        if (estMarcheNoir) {
            ecrireTexteJeu(texteDefilant(Textes.t(293), 26), 3, 100, COULEUR_ROUGE)
        } else if (marcheConnu(mondeActuel)) {
            let marchandiseRetenue = marchandiseMarcheConnu(mondeActuel)
            let tendance = tendanceMarcheConnu(mondeActuel)
            let texteTendance = tendance > 0 ? "+" : (tendance < 0 ? "-" : "=")
            ecrireTexteJeu(
                texteDefilant(Textes.t(294) + Textes.t(NOMS_MARCHANDISES[marchandiseRetenue]) + " " +
                achatMarcheConnu(mondeActuel) + "/" + venteMarcheConnu(mondeActuel) + " " + texteTendance +
                Textes.t(295) + ageMarcheConnu(mondeActuel), 26), 3, 100, COULEUR_CYAN)
        } else {
            ecrireTexteJeu(texteDefilant(Textes.t(296) + infoEvenementMarche(), 26), 3, 100,
                evenementMarcheActifAuMonde(mondeActuel) ? COULEUR_JAUNE : COULEUR_ATTENUEE)
        }
    }
    if (transactionOuverte) dessinerBoiteCommerce()
    else dessinerPied(Textes.t(297), Textes.t(298))
}

function dessinerBoiteCommerce(): void {
    screen.fillRect(15, 34, 130, 58, COULEUR_FOND)
    screen.drawRect(15, 34, 130, 58, COULEUR_CYAN)
    let fretRareChoisi = estMarcheNoir && indiceMenu >= NOMBRE_MARCHANDISES
    let nomCommerce = fretRareChoisi ? nomFretRare(indiceMenu - NOMBRE_MARCHANDISES) :
        Textes.t(NOMS_MARCHANDISES[indiceMenu])
    ecrireTexteJeu(nomCommerce, 22, 40, fretRareChoisi ? COULEUR_VIOLETTE : COULEUR_JAUNE)
    if (quantiteTransaction > 0) {
        ecrireTexteJeu(Textes.t(299) + quantiteTransaction, 22, 53, COULEUR_VERTE)
        ecrireTexteJeu(Textes.t(300) + quantiteTransaction *
            (estMarcheNoir ? prixAchatMarcheNoir(indiceMenu) : prixAchatMarche(indiceMenu)), 22, 65, COULEUR_TEXTE)
    } else if (quantiteTransaction < 0) {
        ecrireTexteJeu(Textes.t(301) + (0 - quantiteTransaction), 22, 53, COULEUR_ORANGE)
        let prixUnitaire = fretRareChoisi ? valeurFretRare(indiceMenu - NOMBRE_MARCHANDISES)
            : (estMarcheNoir ? prixVenteMarcheNoir(indiceMenu) : prixVenteMarche(indiceMenu))
        ecrireTexteJeu(Textes.t(300) + (0 - quantiteTransaction) * prixUnitaire, 22, 65, COULEUR_TEXTE)
    } else {
        ecrireTexteJeu(Textes.t(302), 22, 53, COULEUR_ATTENUEE)
        ecrireTexteJeu(Textes.t(303), 22, 65, COULEUR_TEXTE)
    }
    ecrireTexteJeu(Textes.t(304), 22, 79, COULEUR_ATTENUEE)
}

function nomArticleChantier(indice: number): string {
    if (indice == 0) return Textes.t(305)
    if (indice == 1) return Textes.t(306)
    if (indice == INDICE_VAISSEAU_CHANTIER) return Textes.t(307)
    if (indice == INDICE_NOM_CHANTIER) return Textes.t(308)
    if (indice == INDICE_PEINTURE_CHANTIER) return Textes.t(309)
    if (indice == INDICE_MISSILE_CHANTIER) return Textes.t(114)
    if (indice == INDICE_MINE_CHANTIER) return Textes.t(27)
    return Textes.t(NOMS_AMELIORATIONS[indice - 2])
}

function coutChantier(indice: number): number {
    if (indice == 0) return carburant < carburantMax() ? 8 : 0
    if (indice == 1) {
        let endommage = coque < coqueMax()
        for (let i = 0; i < degatsModule.length; i++) if (degatsModule[i] > 0) endommage = true
        return endommage ? 28 : 0
    }
    if (indice == INDICE_VAISSEAU_CHANTIER)
        return vaisseauPossede(apercuRoleChantier) ? 0 : coutAchatVaisseau(apercuRoleChantier)
    if (indice == INDICE_NOM_CHANTIER || indice == INDICE_PEINTURE_CHANTIER) return 0
    if (indice == INDICE_MISSILE_CHANTIER) return missiles < 9 ? prixChantierMonde(120) : 0
    if (indice == INDICE_MINE_CHANTIER) return mines < 6 ? prixChantierMonde(80) : 0
    let id = indice - 2
    return prixAmelioration(id, ameliorations[id] + 1)
}

function roleSelonIndice(indice: number): RoleVaisseau {
    if (indice == 1) return RoleVaisseau.Coursier
    if (indice == 2) return RoleVaisseau.Chasseur
    return RoleVaisseau.Marchand
}

function parcourirRoleChantier(sens: number): void {
    let suivant = (apercuRoleChantier + sens) % NOMBRE_ROLES_VAISSEAU
    if (suivant < 0) suivant += NOMBRE_ROLES_VAISSEAU
    apercuRoleChantier = roleSelonIndice(suivant)
    idInstalleChantier = -1
}

function dessinerChantier(): void {
    dessinerEntete(Textes.t(247))
    if (indiceMenu < sommetListe) sommetListe = indiceMenu
    if (indiceMenu >= sommetListe + 6) sommetListe = indiceMenu - 5
    for (let rangee = 0; rangee < 6; rangee++) {
        let indice = sommetListe + rangee
        if (indice >= NOMBRE_ELEMENTS_CHANTIER) break
        let y = 18 + rangee * 12
        if (indice == indiceMenu)
            screen.fillRect(2, y - 1, 90, 10, confirmationOuverte ? COULEUR_BLEUE : COULEUR_VIOLETTE)
        ecrireTexteJeu(nomArticleChantier(indice), 5, y, COULEUR_TEXTE)
        if (indice == INDICE_VAISSEAU_CHANTIER) {
            screen.fillRect(87, y + 2, 2, 2, vaisseauPossede(apercuRoleChantier) ? COULEUR_VERTE
                : (roleVaisseauDebloque(apercuRoleChantier) ? COULEUR_CYAN : COULEUR_ROUGE))
        } else if (indice == INDICE_NOM_CHANTIER || indice == INDICE_PEINTURE_CHANTIER) {
            ecrireDroite("<>", 90, y, COULEUR_CYAN)
        } else if (indice == INDICE_MISSILE_CHANTIER || indice == INDICE_MINE_CHANTIER) {
            ecrireDroite(coutChantier(indice) > 0 ? "" + coutChantier(indice) : Textes.t(310), 90, y,
                coutChantier(indice) > 0 && coutChantier(indice) > credits ? COULEUR_ROUGE : COULEUR_JAUNE)
        } else if (indice >= 2 && ameliorations[indice - 2] >= MAX_AMELIORATION[indice - 2]) {
            ecrireDroite(Textes.t(310), 90, y, COULEUR_VERTE)
        } else {
            ecrireDroite("" + coutChantier(indice), 90, y,
                coutChantier(indice) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
        }
    }

    let vaisseauChoisi = indiceMenu == INDICE_VAISSEAU_CHANTIER
    let identiteChoisie = indiceMenu == INDICE_NOM_CHANTIER || indiceMenu == INDICE_PEINTURE_CHANTIER
    let ameliorationChoisie = indiceMenu >= 2 && indiceMenu < INDICE_VAISSEAU_CHANTIER
    let idSurbrillance = ameliorationChoisie ? indiceMenu - 2 : -1
    let installeMaintenant = vaisseauChoisi ? apercuRoleChantier == roleVaisseau
        : (ameliorationChoisie && idInstalleChantier == idSurbrillance)
    let apercuSuivant = vaisseauChoisi ? apercuRoleChantier != roleVaisseau
        : (ameliorationChoisie && !installeMaintenant &&
            ameliorations[idSurbrillance] < MAX_AMELIORATION[idSurbrillance])
    screen.drawRect(94, 15, 65, 72, COULEUR_CYAN)
    let etiquetteApercu = installeMaintenant ? Textes.t(311) : (apercuSuivant ? Textes.t(312) : Textes.t(313))
    if (vaisseauChoisi && !roleVaisseauDebloque(apercuRoleChantier)) etiquetteApercu = Textes.t(314)
    ecrireTexteJeu(etiquetteApercu,
        etiquetteApercu == Textes.t(311) ? 99
            : (etiquetteApercu == Textes.t(314) ? 102 : (etiquetteApercu == Textes.t(312) ? 102 : 109)),
        18,
        etiquetteApercu == Textes.t(311) ? COULEUR_VERTE
            : (etiquetteApercu == Textes.t(314) ? COULEUR_ROUGE
                : (etiquetteApercu == Textes.t(312) ? COULEUR_JAUNE : COULEUR_CYAN)))
    dessinerApercuVaisseau(126, 57, indiceMenu == 0 ? -2 : (indiceMenu == 1 ? -3 : idSurbrillance),
        vaisseauChoisi ? false : apercuSuivant)
    dessinerApercuRoleVaisseau(126, 57, vaisseauChoisi ? apercuRoleChantier : roleVaisseau)

    if (vaisseauChoisi) {
        ecrireTexteJeu((vaisseauPossede(apercuRoleChantier) ? Textes.t(315) : Textes.t(316)) +
            nomRoleVaisseau(apercuRoleChantier), 4, 90, installeMaintenant ? COULEUR_VERTE : COULEUR_JAUNE)
        ecrireDroite(Textes.t(317) + rangRequisRoleVaisseau(apercuRoleChantier), 157, 90,
            roleVaisseauDebloque(apercuRoleChantier) ? COULEUR_TEXTE : COULEUR_ROUGE)
        // La description du vaisseau s'arrête un caractère avant le prix ou l'indication de changement (les
        // descriptions plus longues défilent).
        let prixVaisseau = installeMaintenant ? ""
            : (vaisseauPossede(apercuRoleChantier) ? Textes.t(318) : coutChantier(indiceMenu) + Textes.t(319))
        ecrireTexteJeu(texteDefilant(infoRoleVaisseau(apercuRoleChantier),
            Math.idiv(147 - prixVaisseau.length * 6, 6)), 4, 99, COULEUR_ATTENUEE)
        if (!installeMaintenant)
            ecrireDroite(prixVaisseau, 157, 99, coutChantier(indiceMenu) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
    } else if (indiceMenu == INDICE_NOM_CHANTIER) {
        ecrireTexteJeu(Textes.t(320), 4, 90, COULEUR_JAUNE)
        ecrireDroite(nomAffichageVaisseau(roleVaisseau), 157, 90, COULEUR_VERTE)
        ecrireTexteJeu(Textes.t(321), 4, 99, COULEUR_ATTENUEE)
    } else if (indiceMenu == INDICE_PEINTURE_CHANTIER) {
        ecrireTexteJeu(Textes.t(309), 4, 90, COULEUR_JAUNE)
        ecrireDroite(nomPeintureVaisseau(roleVaisseau), 157, 90, couleurPeintureVaisseau())
        ecrireTexteJeu(Textes.t(322), 4, 99, COULEUR_ATTENUEE)
    } else if (indiceMenu == INDICE_MISSILE_CHANTIER || indiceMenu == INDICE_MINE_CHANTIER) {
        let nombre = indiceMenu == INDICE_MISSILE_CHANTIER ? missiles : mines
        let maximum = indiceMenu == INDICE_MISSILE_CHANTIER ? 9 : 6
        ecrireTexteJeu(nomArticleChantier(indiceMenu) + " " + nombre + "/" + maximum, 4, 90, COULEUR_JAUNE)
        ecrireTexteJeu(indiceMenu == INDICE_MISSILE_CHANTIER ? Textes.t(323) : Textes.t(324), 4, 99, COULEUR_ATTENUEE)
        ecrireDroite(coutChantier(indiceMenu) + Textes.t(319), 157, 99,
            coutChantier(indiceMenu) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
    } else if (ameliorationChoisie) {
        let niveauActuel = ameliorations[idSurbrillance]
        let niveauAffiche = apercuSuivant ? niveauActuel + 1 : niveauActuel
        ecrireTexteJeu(nomArticleChantier(indiceMenu), 4, 90, COULEUR_JAUNE)
        ecrireDroite(Textes.t(325) + niveauActuel + (installeMaintenant ? Textes.t(326)
            : (apercuSuivant ? ">" + niveauAffiche : Textes.t(327))), 157, 90, COULEUR_TEXTE)
        let comparaison = resumeNiveauAmelioration(idSurbrillance, niveauActuel)
        if (apercuSuivant) comparaison += " > " + resumeNiveauAmelioration(idSurbrillance, niveauAffiche)
        ecrireTexteJeu(texteDefilant(comparaison, 18), 4, 99, COULEUR_ATTENUEE)
        if (apercuSuivant) ecrireDroite(coutChantier(indiceMenu) + Textes.t(319), 157, 99,
            coutChantier(indiceMenu) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
    } else if (indiceMenu == 0) {
        ecrireTexteJeu(Textes.t(328) + carburant + "/" + carburantMax(), 4, 90, COULEUR_JAUNE)
        ecrireTexteJeu(Textes.t(329), 4, 99, COULEUR_ATTENUEE)
        ecrireDroite(coutChantier(indiceMenu) + Textes.t(319), 157, 99,
            coutChantier(indiceMenu) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
    } else {
        ecrireTexteJeu(Textes.t(330) + coque + "/" + coqueMax(), 4, 90, COULEUR_JAUNE)
        ecrireTexteJeu(Textes.t(331), 4, 99, COULEUR_ATTENUEE)
        ecrireDroite(coutChantier(indiceMenu) + Textes.t(319), 157, 99,
            coutChantier(indiceMenu) <= credits ? COULEUR_JAUNE : COULEUR_ROUGE)
    }
    if (confirmationOuverte) dessinerBoiteConfirmation(vaisseauChoisi
        ? (vaisseauPossede(apercuRoleChantier) ? Textes.t(332) : Textes.t(333))
        : Textes.t(334), coutChantier(indiceMenu))
    else if (vaisseauChoisi) dessinerPied(Textes.t(335), Textes.t(298))
    else if (identiteChoisie) dessinerPied(Textes.t(336), Textes.t(298))
    else dessinerPied(Textes.t(337), Textes.t(298))
}

function dessinerBoiteConfirmation(action: string, cout: number): void {
    screen.fillRect(0, 87, 160, 21, COULEUR_FOND)
    screen.drawRect(0, 87, 160, 21, COULEUR_JAUNE)
    ecrireTexteJeu(action + Textes.t(338), 5, 90, COULEUR_TEXTE)
    if (cout > 0) ecrireDroite(cout + Textes.t(319), 155, 90, COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(339), 5, 99, COULEUR_VERTE)
    ecrireDroite(Textes.t(340), 155, 99, COULEUR_ATTENUEE)
}

function dessinerMissions(): void {
    dessinerEntete(Textes.t(248))
    if (genreMission != GenreMission.Aucun) {
        let source = sourceMission == 2 ? Textes.t(341) : (sourceMission == 1 ? Textes.t(342)
            : (sourceMission == 3 ? Textes.t(343) : Textes.t(200)))
        // Une mission de campagne montre le titre de son étape et, sur la ligne de description de la variante, son
        // briefing (les lignes plus longues défilent).
        ecrireTexteJeu(source + ": " + (sourceMission == 1 ? titreCampagne(etapeCampagne)
            : etiquetteMission(genreMission)), 6, 18, sourceMission > 0 ? COULEUR_JAUNE : COULEUR_TEXTE)
        ecrireTexteJeu(Textes.t(344) + nomVarianteMission(genreMission, varianteMission), 6, 29, COULEUR_CYAN)
        ecrireTexteJeu(Textes.t(345) + NOMS_MONDES[cibleMission] + Textes.t(346) + echeanceMission, 6, 40,
            echeanceMission < jourJeu ? COULEUR_ROUGE : COULEUR_VERTE)
        ecrireTexteJeu(Textes.t(347) + recompenseMission + Textes.t(319), 6, 51, COULEUR_JAUNE)
        if (genreMission == GenreMission.Livraison) ecrireTexteJeu(Textes.t(274) +
            Textes.t(NOMS_MARCHANDISES[marchandiseMission]) + Textes.t(348) + quantiteMission, 6, 62, COULEUR_ORANGE)
        if (genreMission == GenreMission.Chasse)
            ecrireTexteJeu(Textes.t(349) + progressionMission + "/" + quantiteMission, 6, 62, COULEUR_ROUGE)
        if (genreMission == GenreMission.Sauvetage)
            ecrireTexteJeu(progressionMission > 0 ? Textes.t(350) : Textes.t(351), 6, 62, COULEUR_VERTE)
        ecrireTexteJeu(texteDefilant(sourceMission == 1 ? briefingCampagne(etapeCampagne)
            : infoVarianteMission(genreMission, varianteMission), 25), 6, 75, COULEUR_ATTENUEE)
        if (confirmationOuverte) dessinerBoiteConfirmation(Textes.t(352), 0)
        else dessinerPied(Textes.t(353), Textes.t(298))
        return
    }
    if (indiceMenu < sommetListe) sommetListe = indiceMenu
    if (indiceMenu >= sommetListe + 3) sommetListe = indiceMenu - 2
    for (let rangee = 0; rangee < 3; rangee++) {
        let emplacement = sommetListe + rangee
        if (emplacement >= NOMBRE_OFFRES_MISSION) break
        let y = 17 + rangee * 30
        let source = campagneOffreMission(emplacement)
        if (emplacement == indiceMenu) screen.fillRect(2, y - 1, 156, 28, COULEUR_VIOLETTE)
        if (source > 0)
            screen.fillRect(2, y - 1, 3, 28, source == 2 ? COULEUR_JAUNE :
                (source == 3 ? COULEUR_VIOLETTE : COULEUR_CYAN))
        let genre = genreOffreMission(emplacement)
        let cible = cibleOffreMission(emplacement)
        let prefixe = source == 2 ? Textes.t(354)
            : (source == 1 ? Textes.t(355) : (source == 3 ? Textes.t(356) : ""))
        // L'offre de campagne indique son étape ; comme dans le menu du hangar, seule la ligne choisie défile quand
        // elle est longue.
        let titreLigne = prefixe +
            (source == 1 ? titreCampagne(etapeCampagne) : etiquetteMission(genre)) + " > " +
            NOMS_MONDES[cible]
        ecrireTexteJeu(emplacement == indiceMenu ? titreLigne : titreLigne.substr(0, 25), 7, y,
            source > 0 ? COULEUR_JAUNE : COULEUR_TEXTE)
        let info = ""
        if (genre == GenreMission.Livraison) info = Textes.t(NOMS_MARCHANDISES[marchandiseOffreMission(emplacement)]) +
            Textes.t(348) + quantiteOffreMission(emplacement)
        else if (genre == GenreMission.Chasse) info = Textes.t(357) + quantiteOffreMission(emplacement)
        else info = Textes.t(358) + quantiteOffreMission(emplacement)
        info += " " + nomVarianteMission(genre, varianteOffreMission(emplacement))
        // Sur la sélection violette, la ligne d'info est écrite dans la couleur du texte (le rouge se lisait mal).
        ecrireTexteJeu(texteDefilant(info, 24), 7, y + 9,
            emplacement == indiceMenu ? COULEUR_TEXTE : (genre == GenreMission.Chasse ? COULEUR_ROUGE : COULEUR_CYAN))
        let recompenseAffichee = emplacement == indiceMenu
            ? recompenseMissionConvenue(recompenseOffreMission(emplacement), marchandageMission)
            : recompenseOffreMission(emplacement)
        let texteMarchandage = emplacement == indiceMenu && marchandageMission > 0 ?
            Textes.t(359) + marchandageMission : ""
        ecrireTexteJeu(recompenseAffichee + Textes.t(319) + texteMarchandage +
            Textes.t(360) + echeanceOffreMission(emplacement),
            7, y + 18, COULEUR_VERTE)
    }
    screen.fillRect(158, 17 + Math.idiv(indiceMenu * 78, NOMBRE_OFFRES_MISSION), 2, 12, COULEUR_JAUNE)
    dessinerPied(Textes.t(361), Textes.t(298))
}

function xCarte(monde: number): number {
    return 5 + Math.idiv(MONDE_X[monde] * 148, 160)
}

function yCarte(monde: number): number {
    return 16 + Math.idiv(MONDE_Y[monde] * 49, 110)
}

function dessinerCarteStellaire(): void {
    dessinerEntete(Textes.t(249))
    // Les routes commerciales fixes permettent de voir d'un coup d'œil les groupes de mondes et les longs trajets.
    for (let i = 0; i < NOMBRE_MONDES_PUBLICS; i++) {
        if (i % 6 > 0 && mondeVisible(i - 1) && mondeVisible(i))
            screen.drawLine(xCarte(i - 1), yCarte(i - 1), xCarte(i), yCarte(i), COULEUR_OMBRE)
        if (i >= 6 && mondeVisible(i - 6) && mondeVisible(i))
            screen.drawLine(xCarte(i - 6), yCarte(i - 6), xCarte(i), yCarte(i), COULEUR_OMBRE)
    }
    if (genreMission != GenreMission.Aucun) {
        screen.drawLine(xCarte(mondeActuel), yCarte(mondeActuel), xCarte(cibleMission), yCarte(cibleMission),
            COULEUR_ROUGE)
    }
    if (derniereCibleRoute != mondeCurseurCarte) {
        planifierRouteVers(mondeCurseurCarte)
        derniereCibleRoute = mondeCurseurCarte
    }
    let routeDepart = mondeEtapeRoute(0)
    for (let bond = 0; bond < nombreBondsRoute(); bond++) {
        let routeArrivee = mondeEtapeRoute(bond + 1)
        screen.drawLine(xCarte(routeDepart), yCarte(routeDepart),
            xCarte(routeArrivee), yCarte(routeArrivee), COULEUR_CYAN)
        routeDepart = routeArrivee
    }
    for (let i = 0; i < NOMBRE_MONDES; i++) {
        if (!mondeVisible(i)) continue
        let x = xCarte(i)
        let y = yCarte(i)
        let couleur = peutAtteindreMonde(i) ? COULEUR_CYAN : COULEUR_ATTENUEE
        if (i == mondeActuel) couleur = COULEUR_VERTE
        screen.fillRect(x - 1, y - 1, 3, 3, couleur)
        if (i == mondeCurseurCarte) screen.drawRect(x - 3, y - 3, 7, 7, COULEUR_JAUNE)
        if (genreMission != GenreMission.Aucun && i == cibleMission) {
            screen.drawLine(x - 4, y, x, y - 4, COULEUR_ROUGE)
            screen.drawLine(x, y - 4, x + 4, y, COULEUR_ROUGE)
            screen.drawLine(x + 4, y, x, y + 4, COULEUR_ROUGE)
            screen.drawLine(x, y + 4, x - 4, y, COULEUR_ROUGE)
        }
    }
    screen.fillRect(0, 69, 160, 39, COULEUR_FOND)
    screen.drawLine(0, 69, 159, 69, COULEUR_CYAN)
    let cout = coutSaut(mondeActuel, mondeCurseurCarte)
    let texteBond = nombreBondsRoute() > 0 ? Textes.t(282) + nombreBondsRoute() +
        Textes.t(362) + coutCarburantRoute()
        : Textes.t(363) + cout
    ecrireTexteJeu(texteDefilant(NOMS_MONDES[mondeCurseurCarte] + texteBond + " " +
        Textes.t(NOMS_ECONOMIE[MONDE_ECONOMIE[mondeCurseurCarte]]), 22),
        3, 72, mondeCurseurCarte == mondeActuel ? COULEUR_ATTENUEE : COULEUR_TEXTE)
    ecrireDroite(Textes.t(NOMS_DANGER[dangerMondeEffectif(mondeCurseurCarte)]), 157, 72,
        dangerMondeEffectif(mondeCurseurCarte) >= 2 ? COULEUR_ROUGE : COULEUR_JAUNE)
    if (ameliorations[AMELIORATION_SCANNER] > 0) {
        ecrireTexteJeu(
            texteDefilant(nomTraitMonde(mondeCurseurCarte) + ": " + infoTraitMonde(mondeCurseurCarte),
            26), 3, 81, COULEUR_VERTE)
        let ligneEvenement = evenementMarcheActifAuMonde(mondeCurseurCarte)
            ? nomEvenementMarche() + " " + Textes.t(NOMS_MARCHANDISES[marchandiseEvenementMarche]) : Textes.t(364)
        ecrireTexteJeu(texteDefilant(Textes.t(365) + ligneEvenement, 26), 3, 90,
            evenementMarcheActifAuMonde(mondeCurseurCarte) ? COULEUR_JAUNE : COULEUR_ATTENUEE)
        if (marcheConnu(mondeCurseurCarte)) {
            let marchandiseConnue = marchandiseMarcheConnu(mondeCurseurCarte)
            let tendanceConnue = tendanceMarcheConnu(mondeCurseurCarte)
            let flecheConnue = tendanceConnue > 0 ? "+" : (tendanceConnue < 0 ? "-" : "=")
            ecrireTexteJeu(texteDefilant(Textes.t(366) + ageMarcheConnu(mondeCurseurCarte) + " " +
                Textes.t(NOMS_MARCHANDISES[marchandiseConnue]) + " " + achatMarcheConnu(mondeCurseurCarte) + "/" +
                venteMarcheConnu(mondeCurseurCarte) + flecheConnue, 26), 3, 99, COULEUR_CYAN)
        } else if (ameliorations[AMELIORATION_SCANNER] > 1) {
            let meilleureMarchandise = meilleureMarchandiseCommerce(mondeCurseurCarte)
            let marge =
                prixAuMonde(mondeCurseurCarte, meilleureMarchandise, false) - prixAchatMarche(meilleureMarchandise)
            ecrireTexteJeu(Textes.t(367) + Textes.t(NOMS_MARCHANDISES[meilleureMarchandise]) + " " +
                (marge >= 0 ? "+" : "") + marge + Textes.t(319), 3, 99, marge > 0 ? COULEUR_CYAN : COULEUR_ROUGE)
        } else {
            ecrireTexteJeu(Textes.t(368), 3, 99, COULEUR_ATTENUEE)
        }
    } else {
        ecrireTexteJeu(texteDefilant(Textes.t(369), 26), 3, 83, COULEUR_ATTENUEE)
    }
    dessinerPied(Textes.t(370), Textes.t(298))
}

function nomPageEtat(): string {
    if (pageEtat == PAGE_FACTIONS) return Textes.t(251)
    if (pageEtat == PAGE_JOURNAL) return Textes.t(252)
    if (pageEtat == PAGE_SUCCES) return Textes.t(371)
    if (pageEtat == PAGE_OPTIONS) return Textes.t(265)
    if (pageEtat == PAGE_MATERIEL) return Textes.t(266)
    if (pageEtat == PAGE_DEVELOPPEUR) return Textes.t(372)
    return Textes.t(373)
}

function texteNomModule(module: number): string {
    if (module == ModuleVaisseau.Moteur) return Textes.t(115)
    if (module == ModuleVaisseau.Scanner) return Textes.t(116)
    if (module == ModuleVaisseau.Armes) return Textes.t(117)
    return Textes.t(118)
}

function texteFinPourFaction(faction: number): GenreFin {
    if (faction == Faction.Guilde) return GenreFin.CouronneMarchande
    if (faction == Faction.Conseil) return GenreFin.Explorateur
    if (faction == Faction.Corsaires) return GenreFin.Corsaire
    return GenreFin.Union
}

function texteFactionMission(genre: GenreMission, variante: VarianteMission): Faction {
    if (variante == VarianteMission.Illegal) return Faction.Corsaires
    if (genre == GenreMission.Livraison) return Faction.Guilde
    if (genre == GenreMission.Sauvetage) return Faction.Conseil
    return Faction.Union
}

function dessinerPageEtatVaisseau(): void {
    ecrireTexteJeu(nomAffichageVaisseau(roleVaisseau) + " / " +
        nomPeintureVaisseau(roleVaisseau), 6, 17, couleurPeintureVaisseau())
    ecrireTexteJeu(Textes.t(317) + nomRang() + Textes.t(374) + pointsJeu(), 6, 28, COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(276) + coque + "/" + coqueMax() + Textes.t(375) + bouclierMax(), 6, 39, COULEUR_VERTE)
    ecrireTexteJeu(Textes.t(376) + carburant + "/" + carburantMax() + Textes.t(377) + unitesFret() + "/" +
        capaciteFret(), 6, 50, COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(378) + nomArme(armeActive) + Textes.t(379) + energieArme, 6, 61,
        COULEUR_ORANGE)
    ecrireTexteJeu(Textes.t(380) + missiles + Textes.t(381) + mines, 6, 72, COULEUR_TEXTE)
    let texteDegats = Textes.t(382)
    for (let i = 0; i < degatsModule.length; i++) {
        if (degatsModule[i] > 0) texteDegats = texteNomModule(i) + " " + nomDegatsModule(i)
    }
    ecrireTexteJeu(texteDefilant(texteDegats, 25), 6, 83, texteDegats == Textes.t(382) ? COULEUR_VERTE : COULEUR_ROUGE)
    let perte = ameliorations[AMELIORATION_ASSURANCE] == 0 ? Textes.t(383)
        : (ameliorations[AMELIORATION_ASSURANCE] == 1 ? Textes.t(384) : Textes.t(385))
    ecrireTexteJeu(texteDefilant(Textes.t(386) + perte, 25), 6, 94, COULEUR_JAUNE)
}

function dessinerPageFaction(): void {
    for (let i = 0; i < NOMBRE_FACTIONS; i++) {
        let y = 19 + i * 17
        if (i == curseurEtat) dessinerSelection(y, 11)
        let reputation = reputationFaction(i)
        ecrireTexteJeu(nomFaction(i), 7, y, i == factionDominante() ? COULEUR_JAUNE : COULEUR_TEXTE)
        ecrireDroite((reputation >= 0 ? "+" : "") + reputation, 153, y, reputation >= 0 ? COULEUR_VERTE : COULEUR_ROUGE)
        let largeur = Math.min(50, Math.abs(reputation))
        screen.fillRect(84, y + 7, largeur, 2, reputation >= 0 ? COULEUR_VERTE : COULEUR_ROUGE)
    }
    if (campagneTerminee()) {
        let finChoisie = texteFinPourFaction(curseurEtat)
        let texteFin = choixFin == GenreFin.Aucun ? Textes.t(387) + nomFin(finChoisie)
            : Textes.t(388) + nomFin(choixFin)
        let couleurFin = choixFin != GenreFin.Aucun ? COULEUR_VERTE
            : (finDisponible(finChoisie) ? COULEUR_JAUNE : COULEUR_ROUGE)
        ecrireTexteJeu(texteDefilant(texteFin, 25), 6, 91, couleurFin)
    } else ecrireTexteJeu(Textes.t(389) + etapeCampagne + "/" + NOMBRE_MISSIONS_CAMPAGNE, 6, 91, COULEUR_ATTENUEE)
}

function dessinerPageJournal(): void {
    ecrireTexteJeu(Textes.t(390) + totalSauts, 6, 17, COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(391) + totalLivraisons + Textes.t(392) + totalSauvetages, 6, 28, COULEUR_VERTE)
    ecrireTexteJeu(Textes.t(393) + totalVictoires + Textes.t(394) + victoiresBoss, 6, 39, COULEUR_ROUGE)
    ecrireTexteJeu(Textes.t(395) + missionsAccomplies + Textes.t(396) + missionsEchouees, 6, 50, COULEUR_TEXTE)
    ecrireTexteJeu(Textes.t(397) + totalCreditsGagnes + Textes.t(319), 6, 61, COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(398) + plusGrandGainCommerce, 6, 72, COULEUR_VERTE)
    ecrireTexteJeu(Textes.t(399) + texteNombreMondesVisites() + "/" + NOMBRE_MONDES + Textes.t(400) +
        echangesMarcheNoir + Textes.t(401) + niveauPartiePlus, 6, 83, COULEUR_VIOLETTE)
    let texteArtefact = aArtefact(curseurEtat) ? nomArtefact(curseurEtat) : Textes.t(402)
    ecrireTexteJeu(Textes.t(403) + (curseurEtat + 1) + "/" + NOMBRE_ARTEFACTS + " " +
        texteDefilant(texteArtefact, 13), 6, 94, aArtefact(curseurEtat) ? COULEUR_JAUNE : COULEUR_ATTENUEE)
}

function dessinerPageSucces(): void {
    if (curseurSucces < sommetListe) sommetListe = curseurSucces
    if (curseurSucces >= sommetListe + 5) sommetListe = curseurSucces - 4
    for (let rangee = 0; rangee < 5; rangee++) {
        let id = sommetListe + rangee
        if (id >= NOMBRE_SUCCES) break
        let y = 17 + rangee * 17
        if (id == curseurSucces) dessinerSelection(y, 14)
        let debloque = succesDebloque(id)
        ecrireTexteJeu((debloque ? "* " : Textes.t(404)) + nomSucces(id), 6, y,
            debloque ? COULEUR_JAUNE : COULEUR_ATTENUEE)
        ecrireTexteJeu(texteDefilant(debloque ? infoSucces(id) : Textes.t(405), 25), 12, y + 8,
            debloque ? COULEUR_TEXTE : COULEUR_ATTENUEE)
    }
    screen.fillRect(157, 17 + Math.idiv(curseurSucces * 78, NOMBRE_SUCCES), 2, 10, COULEUR_JAUNE)
}

function texteOption(indice: number): string {
    if (indice == 0) return Textes.t(406) + nomVitesseTexte()
    if (indice == 1) return Textes.t(407) + texteOuiNon(contrasteEleve)
    if (indice == 2) return Textes.t(408) + texteOuiNon(secousseCamera)
    if (indice == 3) return Textes.t(258) + nomModeIntro()
    if (indice == 4) return Textes.t(262) + nomCranSon()
    if (indice == 5) return Textes.t(263) + nomDensiteEffet()
    if (indice == 6) return Textes.t(409)
    return Textes.t(410)
}

function dessinerPageOptions(): void {
    if (curseurEtat < sommetListe) sommetListe = curseurEtat
    if (curseurEtat >= sommetListe + 7) sommetListe = curseurEtat - 6
    for (let rangee = 0; rangee < 7; rangee++) {
        let id = sommetListe + rangee
        if (id >= 8) break
        let y = 17 + rangee * 12
        if (id == curseurEtat) dessinerSelection(y, 10)
        let active = id != 7 || sauvegardeManuelleExiste()
        ecrireTexteJeu(texteDefilant(texteOption(id), 25), 6, y, active ? COULEUR_TEXTE : COULEUR_ATTENUEE)
    }
    ecrireTexteJeu(Textes.t(411), 6, 99, COULEUR_ATTENUEE)
}

function dessinerPageMateriel(): void {
    ecrireTexteJeu(Textes.t(412), 6, 17, COULEUR_JAUNE)
    screen.drawRect(62, 30, 37, 43, COULEUR_METAL)
    screen.fillRect(76, 34, 9, 9, controller.up.isPressed() ? COULEUR_VERTE : COULEUR_ATTENUEE)
    screen.fillRect(76, 60, 9, 9, controller.down.isPressed() ? COULEUR_VERTE : COULEUR_ATTENUEE)
    screen.fillRect(65, 47, 9, 9, controller.left.isPressed() ? COULEUR_VERTE : COULEUR_ATTENUEE)
    screen.fillRect(87, 47, 9, 9, controller.right.isPressed() ? COULEUR_VERTE : COULEUR_ATTENUEE)
    screen.fillCircle(119, 43, 7, controller.A.isPressed() ? COULEUR_JAUNE : COULEUR_ROUGE)
    screen.fillCircle(137, 61, 7, controller.B.isPressed() ? COULEUR_JAUNE : COULEUR_BLEUE)
    for (let i = 0; i < 16; i++) screen.fillRect(4 + i * 9, 78, 8, 8, i)
    ecrireTexteJeu(toucheBTestee ? Textes.t(413) : Textes.t(414), toucheBTestee ? 10 : 27, 92,
        COULEUR_TEXTE)
    ecrireTexteJeu(Textes.t(415) + (aSauvegarde ? Textes.t(232) : Textes.t(416)) + Textes.t(417) +
        (sauvegardeManuelleExiste() ? Textes.t(232) : Textes.t(416)), 9, 102, COULEUR_VERTE)
}

function dessinerPageDeveloppeur(): void {
    let stats = control.gcStats()
    ecrireTexteJeu(Textes.t(418) + ipsAffichage, 6, 18, ipsAffichage >= 25 ? COULEUR_VERTE : COULEUR_ROUGE)
    ecrireTexteJeu(Textes.t(419) + control.ramSize(), 6, 31, COULEUR_TEXTE)
    ecrireTexteJeu(Textes.t(420) + derniersOctetsLibres, 6, 44, COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(421) + octetsLibresMin, 6, 57, COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(422) + (stats ? stats.numGC : 0), 6, 70, COULEUR_ATTENUEE)
    ecrireTexteJeu(Textes.t(423) + jourJeu + "/" + mondeActuel, 6, 83, COULEUR_TEXTE)
    ecrireTexteJeu(Textes.t(424) + texteOuiNon(modeDeveloppeur), 6, 96,
        modeDeveloppeur ? COULEUR_VERTE : COULEUR_ATTENUEE)
}

function dessinerEtat(): void {
    dessinerEntete(nomPageEtat())
    if (pageEtat == PAGE_VAISSEAU) dessinerPageEtatVaisseau()
    else if (pageEtat == PAGE_FACTIONS) dessinerPageFaction()
    else if (pageEtat == PAGE_JOURNAL) dessinerPageJournal()
    else if (pageEtat == PAGE_SUCCES) dessinerPageSucces()
    else if (pageEtat == PAGE_OPTIONS) dessinerPageOptions()
    else if (pageEtat == PAGE_MATERIEL) dessinerPageMateriel()
    else dessinerPageDeveloppeur()
    if (pageEtat == PAGE_DEVELOPPEUR) dessinerPied(Textes.t(425), Textes.t(298))
    else if (pageEtat == PAGE_JOURNAL) dessinerPied(Textes.t(426), Textes.t(298))
    else if (pageEtat == PAGE_SUCCES) dessinerPied(Textes.t(427), Textes.t(298))
    else if (pageEtat != PAGE_MATERIEL) dessinerPied(Textes.t(428), Textes.t(298))
}

function dessinerAvis(): void {
    let cle = ligneAvis1 + "|" + ligneAvis2 + "|" + ligneAvis3
    if (cle != cleRenduAvis) {
        cleRenduAvis = cle
        revelationAvisCommencee = game.runtime()
    }
    let decalage2 = ligneAvis1.length
    let decalage3 = decalage2 + ligneAvis2.length
    screen.fill(COULEUR_FOND)
    screen.drawRect(3, 15, 154, 90, COULEUR_CYAN)
    let y = ecrireParagraphe(morceauLigneAvis(ligneAvis1, 0), 8, 21, 24, COULEUR_JAUNE) + 3
    y = ecrireParagraphe(morceauLigneAvis(ligneAvis2, decalage2), 8, y, 24, COULEUR_TEXTE) + 3
    ecrireParagraphe(morceauLigneAvis(ligneAvis3, decalage3), 8, y, 24, COULEUR_VERTE)
    ecrireTexteJeu(Textes.t(429), 55, 109, COULEUR_ATTENUEE)
}

function dessinerSuppressionSauvegarde(): void {
    screen.fill(COULEUR_FOND)
    screen.drawRect(12, 27, 136, 65, COULEUR_ROUGE)
    // La boîte mesure 136 pixels de large. La question NOUVELLE PARTIE + est centrée (x = 81 - 3 × longueur, au
    // plus 23), ainsi une longue question reste à l'intérieur. L'autre question commence à x = 20.
    let question = confirmationPartiePlus ? Textes.t(430) : Textes.t(431)
    ecrireTexteJeu(question, confirmationPartiePlus ?
        Math.min(23, 81 - question.length * 3) : 20, 39, COULEUR_JAUNE)
    ecrireTexteJeu(confirmationPartiePlus ? Textes.t(432) : Textes.t(433),
        confirmationPartiePlus ? 29 : 26, 55,
        confirmationPartiePlus ? COULEUR_VERTE : COULEUR_ROUGE)
    ecrireTexteJeu(Textes.t(434), 31, 75, COULEUR_TEXTE)
}

function dessinerSceneActuelle(): void {
    if (sceneActive == Scene.Intro) dessinerIntro()
    else if (sceneActive == Scene.Titre) dessinerTitre()
    else if (sceneActive == Scene.Hangar) dessinerHangar()
    else if (sceneActive == Scene.Marche) dessinerMarche()
    else if (sceneActive == Scene.Chantier) dessinerChantier()
    else if (sceneActive == Scene.Missions) dessinerMissions()
    else if (sceneActive == Scene.CarteStellaire) dessinerCarteStellaire()
    else if (sceneActive == Scene.Etat) dessinerEtat()
    else if (sceneActive == Scene.Vol) dessinerVol()
    else if (sceneActive == Scene.Avis) dessinerAvis()
    else if (sceneActive == Scene.SuppressionSauvegarde) dessinerSuppressionSauvegarde()
}

function ajusterQuantiteCommerce(sens: number): void {
    if (estMarcheNoir && indiceMenu >= NOMBRE_MARCHANDISES) {
        let rare = indiceMenu - NOMBRE_MARCHANDISES
        quantiteTransaction = Math.clamp(0 - fretsRares[rare], 0, quantiteTransaction + sens)
        return
    }
    let prixAchatUnite = estMarcheNoir ? prixAchatMarcheNoir(indiceMenu) : prixAchatMarche(indiceMenu)
    let disponible = estMarcheNoir ? 6 : stockMarche[indiceMenu]
    let achatMax = Math.min(disponible, capaciteFret() - unitesFret())
    achatMax = Math.min(achatMax, Math.idiv(credits, prixAchatUnite))
    let venteMin = 0 - fret[indiceMenu]
    quantiteTransaction = Math.clamp(venteMin, achatMax, quantiteTransaction + sens)
}

function appliquerCommerce(): void {
    let marchandise = indiceMenu
    if (estMarcheNoir && marchandise >= NOMBRE_MARCHANDISES) {
        let rare = marchandise - NOMBRE_MARCHANDISES
        let quantite = Math.min(fretsRares[rare], 0 - quantiteTransaction)
        if (quantite > 0) {
            let recette = vendreFretRare(rare, quantite)
            noterCommerceMarcheNoir(0)
            texteMessageMarche = Textes.t(435)
            couleurMessageMarche = COULEUR_VIOLETTE
            finMessageMarcheMs = game.runtime() + 3000
            sonVente()
        }
        transactionOuverte = false
        quantiteTransaction = 0
        actualiserSucces()
        enregistrerSauvegarde()
        return
    }
    if (quantiteTransaction > 0) {
        let quantite = quantiteTransaction
        let prixUnitaire = estMarcheNoir ? prixAchatMarcheNoir(marchandise) : prixAchatMarche(marchandise)
        let cout = quantite * prixUnitaire
        if (cout > credits || (!estMarcheNoir && quantite > stockMarche[marchandise]) ||
            unitesFret() + quantite > capaciteFret()) return
        credits -= cout
        fret[marchandise] += quantite
        coutFret[marchandise] += cout
        if (!estMarcheNoir) stockMarche[marchandise] -= quantite
        if (estMarcheNoir) noterCommerceMarcheNoir(0)
        else appliquerInfluenceCommerce(marchandise, quantite)
        texteMessageMarche = Textes.t(436) + Textes.t(NOMS_MARCHANDISES[marchandise]) + Textes.t(348) + quantite +
            " -" + cout
        couleurMessageMarche = COULEUR_VERTE
        finMessageMarcheMs = game.runtime() + 2600
        sonAchat()
    } else if (quantiteTransaction < 0) {
        let quantite = 0 - quantiteTransaction
        if (quantite > fret[marchandise]) return
        let anciennesUnites = fret[marchandise]
        let coutRetire = anciennesUnites > 0 ? Math.idiv(coutFret[marchandise] * quantite, anciennesUnites) : 0
        let recette = quantite * (estMarcheNoir ? prixVenteMarcheNoir(marchandise) : prixVenteMarche(marchandise))
        credits += recette
        fret[marchandise] -= quantite
        coutFret[marchandise] -= coutRetire
        if (fret[marchandise] == 0) coutFret[marchandise] = 0
        if (!estMarcheNoir) stockMarche[marchandise] = Math.min(99, stockMarche[marchandise] + quantite)
        let gain = recette - coutRetire
        if (gain > 0) gainCommerce += gain
        if (estMarcheNoir) noterCommerceMarcheNoir(gain)
        else {
            appliquerInfluenceCommerce(marchandise, 0 - quantite)
            noterGainCommerce(gain)
        }
        texteMessageMarche = gain >= 0 ? Textes.t(437) + gain + Textes.t(319)
            : Textes.t(438) + gain + Textes.t(319)
        couleurMessageMarche = gain >= 0 ? COULEUR_VERTE : COULEUR_ROUGE
        finMessageMarcheMs = game.runtime() + 3000
        sonVente()
    }
    transactionOuverte = false
    quantiteTransaction = 0
    if (!estMarcheNoir) retenirMarcheActuel()
    actualiserSucces()
    enregistrerSauvegarde()
}

function acheterElementChantier(): void {
    let cout = coutChantier(indiceMenu)
    if (indiceMenu == INDICE_VAISSEAU_CHANTIER) {
        if (!roleVaisseauDebloque(apercuRoleChantier)) {
            confirmationOuverte = false
            afficherAvis(Textes.t(439), Textes.t(317) + rangRequisRoleVaisseau(apercuRoleChantier),
                nomRoleVaisseau(apercuRoleChantier), Scene.Chantier)
            sonErreur()
            return
        }
        if (!vaisseauPossede(apercuRoleChantier) && credits < cout) {
            confirmationOuverte = false
            afficherAvis(Textes.t(440), Textes.t(441) + (cout - credits) + Textes.t(319),
                Textes.t(315) + nomRoleVaisseau(apercuRoleChantier), Scene.Chantier)
            sonErreur()
            return
        }
        if (!acheterOuChoisirVaisseau(apercuRoleChantier)) {
            confirmationOuverte = false
            afficherAvis(Textes.t(442), Textes.t(443), nomRoleVaisseau(apercuRoleChantier),
                Scene.Chantier)
            sonErreur()
            return
        }
        confirmationOuverte = false
        idInstalleChantier = -1
        sonAchat()
        enregistrerSauvegarde()
        return
    }
    if (indiceMenu == INDICE_NOM_CHANTIER || indiceMenu == INDICE_PEINTURE_CHANTIER) return
    if (cout <= 0) return
    if (credits < cout) {
        confirmationOuverte = false
        afficherAvis(Textes.t(440), Textes.t(441) + (cout - credits) + Textes.t(319), "",
            Scene.Chantier)
        return
    }
    credits -= cout
    if (indiceMenu == 0) carburant++
    else if (indiceMenu == 1) {
        coque = Math.min(coqueMax(), coque + 1)
        reparerModules()
    } else if (indiceMenu == INDICE_MISSILE_CHANTIER) missiles++
    else if (indiceMenu == INDICE_MINE_CHANTIER) mines++
    else {
        let id = indiceMenu - 2
        ameliorations[id]++
        if (id == AMELIORATION_BLINDAGE) coque = Math.min(coqueMax(), coque + 3)
        if (id == AMELIORATION_SAUT) carburant = Math.min(carburantMax(), carburant + 1)
        idInstalleChantier = id
    }
    confirmationOuverte = false
    sonAchat()
    enregistrerSauvegarde()
}

function accepterMission(emplacement: number): void {
    let genre = genreOffreMission(emplacement)
    let quantite = quantiteOffreMission(emplacement)
    let necessaire = genre == GenreMission.Chasse ? 0 : quantite
    if (unitesFret() + necessaire > capaciteFret()) {
        afficherAvis(Textes.t(444), Textes.t(445), "", Scene.Missions)
        return
    }
    let graineOffre = graineOffreMission(emplacement)
    if (marchandageMission > 0 && !reussiteMarchandage(graineOffre, marchandageMission)) {
        marchandageMission = 0
        changerReputationFaction(Faction.Guilde, -1)
        afficherAvis(Textes.t(446), Textes.t(447), Textes.t(448), Scene.Missions)
        sonErreur()
        return
    }
    // On lit d'abord toute l'offre : les offres de campagne et du jour n'existent que tant qu'aucune
    // mission n'est active.
    let campagneOffre = campagneOffreMission(emplacement)
    let cibleOffre = cibleOffreMission(emplacement)
    let echeanceOffre = echeanceOffreMission(emplacement)
    let recompenseOffre = recompenseMissionConvenue(recompenseOffreMission(emplacement), marchandageMission)
    let marchandiseOffre = marchandiseOffreMission(emplacement)
    let varianteOffre = varianteOffreMission(emplacement)
    genreMission = genre
    origineMission = mondeActuel
    cibleMission = cibleOffre
    echeanceMission = echeanceOffre
    recompenseMission = recompenseOffre
    marchandiseMission = marchandiseOffre
    quantiteMission = quantite
    progressionMission = 0
    graineMission = graineOffre
    varianteMission = varianteOffre
    sourceMission = campagneOffre
    if (sourceMission == 3) marquerContratDuJourAccepte()
    if (sourceMission == 2 && etapeTutoriel < 2) etapeTutoriel = 2
    let titreAccepte = sourceMission == 2 ? Textes.t(449) : (sourceMission == 1 ? Textes.t(450)
        : (sourceMission == 3 ? Textes.t(451) : Textes.t(452)))
    marchandageMission = 0
    afficherAvis(titreAccepte,
        sourceMission == 1 ? titreCampagne(etapeCampagne) : nomVarianteMission(genre, varianteMission),
        Textes.t(345) + NOMS_MONDES[cibleMission], Scene.Hangar)
    sonMission()
    enregistrerSauvegarde()
}

function deplacerCurseurCarte(dx: number, dy: number): void {
    let meilleurMonde = mondeCurseurCarte
    let meilleurScore = 99999
    for (let i = 0; i < NOMBRE_MONDES; i++) {
        if (i == mondeCurseurCarte || !mondeVisible(i)) continue
        let vx = MONDE_X[i] - MONDE_X[mondeCurseurCarte]
        let vy = MONDE_Y[i] - MONDE_Y[mondeCurseurCarte]
        if (dx > 0 && vx <= 0) continue
        if (dx < 0 && vx >= 0) continue
        if (dy > 0 && vy <= 0) continue
        if (dy < 0 && vy >= 0) continue
        let axePrincipal = dx != 0 ? Math.abs(vx) : Math.abs(vy)
        let axeSecondaire = dx != 0 ? Math.abs(vy) : Math.abs(vx)
        let points = axePrincipal + axeSecondaire * 3
        if (points < meilleurScore) {
            meilleurScore = points
            meilleurMonde = i
        }
    }
    mondeCurseurCarte = meilleurMonde
}

function traiterDirection(dx: number, dy: number): void {
    if (entreeVerrouillee) return
    let ancienIndiceMenu = indiceMenu
    let ancienneQuantiteTransaction = quantiteTransaction
    let ancienMondeCurseurCarte = mondeCurseurCarte
    let ancienRoleChantier = apercuRoleChantier
    let ancienModeJeu = modeJeu
    let ancienMarchandageMission = marchandageMission
    let anciennePageEtat = pageEtat
    let ancienCurseurEtat = curseurEtat
    let ancienCurseurSucces = curseurSucces
    let sonDirect = false
    if (sceneActive == Scene.Titre) {
        if (dy < 0) indiceMenu = Math.max(0, indiceMenu - 1)
        if (dy > 0) indiceMenu = Math.min(NOMBRE_ELEMENTS_TITRE - 1, indiceMenu + 1)
        if (indiceMenu == 1 && dx != 0) {
            parcourirModeIntro(dx < 0 ? -1 : 1)
        } else if (indiceMenu == 3 && dx != 0) {
            parcourirCranSon(dx < 0 ? -1 : 1)
            sonNavigation()
            sonDirect = true
        } else if (indiceMenu == 4 && dx != 0) {
            parcourirDensiteEffet(dx < 0 ? -1 : 1)
        } else if (indiceMenu == 5 && dx != 0) {
            if (estModeTitreChangeable()) parcourirModeTitre(dx < 0 ? -1 : 1)
            else {
                sonErreur()
                sonDirect = true
            }
        }
    } else if (sceneActive == Scene.Hangar && !confirmationOuverte) {
        if (dy < 0) indiceMenu = Math.max(0, indiceMenu - 1)
        if (dy > 0) indiceMenu = Math.min(ELEMENTS_HANGAR.length - 1, indiceMenu + 1)
    } else if (sceneActive == Scene.Marche) {
        if (transactionOuverte) {
            if (dx < 0) ajusterQuantiteCommerce(-1)
            if (dx > 0) ajusterQuantiteCommerce(1)
            if (dy < 0) ajusterQuantiteCommerce(5)
            if (dy > 0) ajusterQuantiteCommerce(-5)
        } else {
            if (dy < 0) indiceMenu = Math.max(0, indiceMenu - 1)
            if (dy > 0)
                indiceMenu =
                Math.min((estMarcheNoir ? NOMBRE_MARCHANDISES + NOMBRE_FRETS_RARES : NOMBRE_MARCHANDISES) - 1,
                indiceMenu + 1)
        }
    } else if (sceneActive == Scene.Chantier && !confirmationOuverte) {
        let indicePrecedent = indiceMenu
        if (dy < 0) indiceMenu = Math.max(0, indiceMenu - 1)
        if (dy > 0) indiceMenu = Math.min(NOMBRE_ELEMENTS_CHANTIER - 1, indiceMenu + 1)
        if (indiceMenu != indicePrecedent) idInstalleChantier = -1
        if (indiceMenu == INDICE_VAISSEAU_CHANTIER && dx != 0) parcourirRoleChantier(dx < 0 ? -1 : 1)
        else if (indiceMenu == INDICE_NOM_CHANTIER && dx != 0) {
            parcourirNomVaisseau(roleVaisseau, dx < 0 ? -1 : 1)
            enregistrerSauvegarde()
        } else if (indiceMenu == INDICE_PEINTURE_CHANTIER && dx != 0) {
            parcourirPeintureVaisseau(roleVaisseau, dx < 0 ? -1 : 1)
            enregistrerSauvegarde()
        }
    } else if (sceneActive == Scene.Missions && genreMission == GenreMission.Aucun) {
        if (dy < 0) indiceMenu = Math.max(0, indiceMenu - 1)
        if (dy > 0) indiceMenu = Math.min(NOMBRE_OFFRES_MISSION - 1, indiceMenu + 1)
        if (dx < 0) marchandageMission = Math.max(0, marchandageMission - 1)
        if (dx > 0) marchandageMission = Math.min(2, marchandageMission + 1)
    } else if (sceneActive == Scene.CarteStellaire) {
        deplacerCurseurCarte(dx, dy)
        derniereCibleRoute = -1
    } else if (sceneActive == Scene.Etat) {
        if (pageEtat == PAGE_MATERIEL) {
            // Rien à faire ici : toutes les directions restent au testeur, pour que l'affichage en direct montre chaque
            // direction pressée sur le GameKit.
        } else if (dy != 0) {
            if (pageEtat == PAGE_FACTIONS)
                curseurEtat = Math.clamp(0, NOMBRE_FACTIONS - 1, curseurEtat + dy)
            else if (pageEtat == PAGE_JOURNAL)
                curseurEtat = Math.clamp(0, NOMBRE_ARTEFACTS - 1, curseurEtat + dy)
            else if (pageEtat == PAGE_SUCCES)
                curseurSucces = Math.clamp(0, NOMBRE_SUCCES - 1, curseurSucces + dy)
            else if (pageEtat == PAGE_OPTIONS) curseurEtat = Math.clamp(0, 7, curseurEtat + dy)
        } else if (dx != 0) {
            pageEtat = (pageEtat + dx + NOMBRE_PAGES_ETAT) % NOMBRE_PAGES_ETAT
            curseurEtat = 0
            sommetListe = 0
            if (pageEtat == PAGE_MATERIEL) toucheBTestee = false
        }
    }
    if (!sonDirect && (indiceMenu != ancienIndiceMenu || quantiteTransaction != ancienneQuantiteTransaction ||
        mondeCurseurCarte != ancienMondeCurseurCarte || apercuRoleChantier != ancienRoleChantier ||
        modeJeu != ancienModeJeu || marchandageMission != ancienMarchandageMission ||
        pageEtat != anciennePageEtat || curseurEtat != ancienCurseurEtat ||
        curseurSucces != ancienCurseurSucces)) sonNavigation()
}

function traiterA(): void {
    if (entreeVerrouillee) return
    if (sceneActive == Scene.Intro) finirIntro()
    else if (sceneActive == Scene.Titre) {
        if (indiceMenu == 0) {
            if (!aSauvegarde) {
                let modeChoisi = modeJeu
                lancerNouvellePartie()
                modeJeu = modeChoisi
                enregistrerSauvegarde()
            }
            if (enTransit != 0) reprendreVoyage()
            else reglerScene(Scene.Hangar)
        } else if (indiceMenu == 1) {
            parcourirModeIntro(1)
        } else if (indiceMenu == 2) {
            lancerIntro()
        } else if (indiceMenu == 3) {
            parcourirCranSon(1)
            sonNavigation()
        } else if (indiceMenu == 4) {
            parcourirDensiteEffet(1)
            sonNavigation()
        } else if (indiceMenu == 5) {
            if (estModeTitreChangeable()) {
                parcourirModeTitre(1)
                sonNavigation()
            } else {
                afficherAvis(Textes.t(453), Textes.t(143), nomModeJeu(modeJeu), Scene.Titre)
                sonErreur()
            }
        } else if (indiceMenu == 6) {
            pageEtat = PAGE_OPTIONS
            curseurEtat = 0
            sceneRetourEtat = Scene.Titre
            reglerScene(Scene.Etat)
        } else if (indiceMenu == 7) {
            pageEtat = PAGE_MATERIEL
            curseurEtat = 0
            toucheBTestee = false
            sceneRetourEtat = Scene.Titre
            reglerScene(Scene.Etat)
        } else if (indiceMenu == 8 && peutLancerPartiePlus()) {
            confirmationPartiePlus = true
            reglerScene(Scene.SuppressionSauvegarde)
        } else if (indiceMenu == 9 && aSauvegarde) {
            confirmationPartiePlus = false
            reglerScene(Scene.SuppressionSauvegarde)
        } else sonErreur()
    } else if (sceneActive == Scene.Hangar) {
        if (confirmationOuverte) passerLivraisonGuide()
        else if (indiceMenu == 0) {
            estMarcheNoir = false
            retenirMarcheActuel()
            reglerScene(Scene.Marche)
        } else if (indiceMenu == 1) {
            if (!marcheNoirDisponible()) {
                afficherAvis(Textes.t(454), Textes.t(455), Textes.t(456), Scene.Hangar)
                sonErreur()
            } else {
                estMarcheNoir = true
                reglerScene(Scene.Marche)
            }
        } else if (indiceMenu == 2) {
            idInstalleChantier = -1
            apercuRoleChantier = roleVaisseau
            reglerScene(Scene.Chantier)
        } else if (indiceMenu == 3) {
            marchandageMission = 0
            reglerScene(Scene.Missions)
        } else if (indiceMenu == 4) {
            cibleRouteCartePrecedente = nombreBondsRoute() > 0 ? mondeEtapeRoute(nombreBondsRoute()) : mondeDestination
            mondeCurseurCarte = cibleRouteCartePrecedente
            derniereCibleRoute = -1
            reglerScene(Scene.CarteStellaire)
        } else if (indiceMenu == 5) {
            pageEtat = PAGE_VAISSEAU
            curseurEtat = 0
            sceneRetourEtat = Scene.Hangar
            reglerScene(Scene.Etat)
        } else if (indiceMenu == 6) {
            pageEtat = PAGE_FACTIONS
            curseurEtat = factionDominante()
            sceneRetourEtat = Scene.Hangar
            reglerScene(Scene.Etat)
        } else if (indiceMenu == 7) {
            pageEtat = PAGE_JOURNAL
            sceneRetourEtat = Scene.Hangar
            reglerScene(Scene.Etat)
        } else if (indiceMenu == 8) {
            pageEtat = PAGE_OPTIONS
            curseurEtat = 0
            sceneRetourEtat = Scene.Hangar
            reglerScene(Scene.Etat)
        }
        else if (mondeDestination != mondeActuel) lancerVoyage()
        else sonErreur()
    } else if (sceneActive == Scene.Marche) {
        if (transactionOuverte) appliquerCommerce()
        else {
            transactionOuverte = true
            quantiteTransaction = 0
            if (estMarcheNoir && indiceMenu >= NOMBRE_MARCHANDISES) {
                if (fretsRares[indiceMenu - NOMBRE_MARCHANDISES] > 0) quantiteTransaction = -1
            } else {
                let disponible = estMarcheNoir ? 6 : stockMarche[indiceMenu]
                let prixAchatUnite = estMarcheNoir ? prixAchatMarcheNoir(indiceMenu) : prixAchatMarche(indiceMenu)
                if (disponible > 0 && credits >= prixAchatUnite && unitesFret() < capaciteFret())
                    quantiteTransaction = 1
                else if (fret[indiceMenu] > 0) quantiteTransaction = -1
            }
        }
    } else if (sceneActive == Scene.Chantier) {
        if (confirmationOuverte) acheterElementChantier()
        else if (indiceMenu == INDICE_VAISSEAU_CHANTIER) {
            if (apercuRoleChantier == roleVaisseau) sonErreur()
            else if (!roleVaisseauDebloque(apercuRoleChantier)) {
                afficherAvis(Textes.t(457), Textes.t(458) + rangRequisRoleVaisseau(apercuRoleChantier),
                    nomRoleVaisseau(apercuRoleChantier), Scene.Chantier)
                sonErreur()
            } else if (coutChantier(indiceMenu) > credits) {
                afficherAvis(Textes.t(440),
                    Textes.t(441) + (coutChantier(indiceMenu) - credits) + Textes.t(319),
                    nomRoleVaisseau(apercuRoleChantier), Scene.Chantier)
                sonErreur()
            } else confirmationOuverte = true
        }
        else if (indiceMenu == INDICE_NOM_CHANTIER) {
            parcourirNomVaisseau(roleVaisseau, 1)
            enregistrerSauvegarde()
        } else if (indiceMenu == INDICE_PEINTURE_CHANTIER) {
            parcourirPeintureVaisseau(roleVaisseau, 1)
            enregistrerSauvegarde()
        }
        else if (indiceMenu >= 2 && indiceMenu < INDICE_VAISSEAU_CHANTIER &&
            ameliorations[indiceMenu - 2] >= MAX_AMELIORATION[indiceMenu - 2]) sonErreur()
        else if (coutChantier(indiceMenu) <= 0) sonErreur()
        else {
            idInstalleChantier = -1
            confirmationOuverte = true
        }
    } else if (sceneActive == Scene.Missions) {
        if (genreMission == GenreMission.Aucun) accepterMission(indiceMenu)
        else if (confirmationOuverte) {
            let genreAbandonne = genreMission
            let varianteAbandonnee = varianteMission
            let entrainement = sourceMission == 2
            if (entrainement && etapeTutoriel < 4) etapeTutoriel = 1
            if (!entrainement) {
                missionsEchouees++
                changerReputationFaction(texteFactionMission(genreAbandonne, varianteAbandonnee), -2)
            }
            effacerMission()
            confirmationOuverte = false
            enregistrerSauvegarde()
            afficherAvis(entrainement ? Textes.t(459) : Textes.t(460),
                entrainement ? Textes.t(461) : Textes.t(462), "", Scene.Hangar)
        } else confirmationOuverte = true
    } else if (sceneActive == Scene.CarteStellaire) {
        if (mondeCurseurCarte == mondeActuel) {
            effacerRoutePrevue()
            mondeDestination = mondeActuel
            reglerScene(Scene.Hangar)
        } else if (planifierRouteVers(mondeCurseurCarte) && nombreBondsRoute() > 0) {
            mondeDestination = mondeEtapeRoute(1)
            reglerScene(Scene.Hangar)
        } else {
            afficherAvis(Textes.t(463), Textes.t(464), Textes.t(465), Scene.CarteStellaire)
        }
    } else if (sceneActive == Scene.Etat) {
        if (pageEtat == PAGE_FACTIONS && campagneTerminee() && choixFin == GenreFin.Aucun) {
            let fin = texteFinPourFaction(curseurEtat)
            if (finDisponible(fin) && choisirFin(fin)) {
                enregistrerSauvegarde()
                afficherAvis(Textes.t(466), nomFin(fin), Textes.t(467), Scene.Etat)
            } else {
                afficherAvis(Textes.t(468), Textes.t(469), nomFin(fin), Scene.Etat)
                sonErreur()
            }
        } else if (pageEtat == PAGE_OPTIONS) {
            if (curseurEtat == 0) parcourirVitesseTexte(1)
            else if (curseurEtat == 1) basculerContrasteEleve()
            else if (curseurEtat == 2) basculerSecousseCamera()
            else if (curseurEtat == 3) parcourirModeIntro(1)
            else if (curseurEtat == 4) parcourirCranSon(1)
            else if (curseurEtat == 5) parcourirDensiteEffet(1)
            else if (curseurEtat == 6) {
                enregistrerSauvegardeManuelle()
                afficherAvis(Textes.t(470), NOMS_MONDES[mondeActuel] + Textes.t(471) + jourJeu,
                    Textes.t(472), Scene.Etat)
            } else if (sauvegardeManuelleExiste()) {
                chargerSauvegardeManuelle()
                afficherAvis(Textes.t(473), NOMS_MONDES[mondeActuel] + Textes.t(471) + jourJeu,
                    Textes.t(474), Scene.Etat)
            } else sonErreur()
            if (curseurEtat <= 2 && aSauvegarde) enregistrerSauvegarde()
        } else if (pageEtat == PAGE_MATERIEL) {
            sonMission()
        } else if (pageEtat == PAGE_DEVELOPPEUR) {
            basculerModeDeveloppeur()
        }
    }
    else if (sceneActive == Scene.Avis) {
        cleRenduAvis = ""
        reglerScene(sceneRetour)
    }
    else if (sceneActive == Scene.SuppressionSauvegarde) {
        if (confirmationPartiePlus) lancerPartiePlus()
        else effacerSauvegarde()
        confirmationPartiePlus = false
        reglerScene(Scene.Titre)
    }
}

function traiterB(): void {
    if (entreeVerrouillee) return
    if (sceneActive == Scene.Intro) finirIntro()
    else if (sceneActive == Scene.Titre) {
        // B ne fait rien sur l'écran titre : les actions qui effacent quelque chose ont leurs propres entrées de
        // menu, bien visibles.
    } else if (sceneActive == Scene.Hangar) {
        // Pendant le premier transport guidé, B demande si l'on veut le sauter ; un second B garde le guidage.
        if (confirmationOuverte) confirmationOuverte = false
        else if (enCoursLivraisonGuide()) confirmationOuverte = true
        else reglerScene(Scene.Titre)
    }
    else if (sceneActive == Scene.Marche) {
        if (transactionOuverte) {
            transactionOuverte = false
            quantiteTransaction = 0
        } else reglerScene(Scene.Hangar)
    } else if (sceneActive == Scene.Chantier) {
        if (confirmationOuverte) confirmationOuverte = false
        else {
            enregistrerSauvegarde()
            reglerScene(Scene.Hangar)
        }
    } else if (sceneActive == Scene.Missions) {
        if (confirmationOuverte) confirmationOuverte = false
        else reglerScene(Scene.Hangar)
    } else if (sceneActive == Scene.CarteStellaire) {
        if (cibleRouteCartePrecedente != mondeActuel) planifierRouteVers(cibleRouteCartePrecedente)
        else effacerRoutePrevue()
        reglerScene(Scene.Hangar)
    } else if (sceneActive == Scene.Etat) {
        if (pageEtat == PAGE_MATERIEL && !toucheBTestee) {
            toucheBTestee = true
            sonNavigation()
        } else reglerScene(sceneRetourEtat)
    }
    else if (sceneActive == Scene.Avis) {
        cleRenduAvis = ""
        reglerScene(sceneRetour)
    }
    else if (sceneActive == Scene.SuppressionSauvegarde) {
        confirmationPartiePlus = false
        reglerScene(Scene.Titre)
    }
}

// font8 dessine les lettres accentuées, qui manquent à la petite police font5. La largeur est toujours de six pixels ;
// les étiquettes trop longues défilent pour qu'aucun mot ne se perde.
function ecrireTexteJeu(texte: string, x: number, y: number, couleur: number): void {
    x = Math.max(0, x)
    let colonnes = Math.max(1, Math.idiv(160 - x, 6))
    screen.print(texteDefilant(texte, colonnes), x, y, couleur, image.font8)
}

function ecrireParagraphe(texte: string, x: number, y: number, colonnes: number, couleur: number): number {
    let decalage = 0
    while (decalage < texte.length) {
        let nombre = Math.min(colonnes, texte.length - decalage)
        if (decalage + nombre < texte.length) {
            let coupure = nombre
            while (coupure > 0 && texte.charAt(decalage + coupure) != " ") coupure--
            if (coupure > 0) nombre = coupure
        }
        ecrireTexteJeu(texte.substr(decalage, nombre), x, y, couleur)
        decalage += nombre
        while (texte.charAt(decalage) == " ") decalage++
        y += 10
    }
    return y
}
