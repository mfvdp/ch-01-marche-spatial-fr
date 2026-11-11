// Séquence de démarrage digne d'un film. Tout est dessiné par le code, ce qui économise de la mémoire vive et de
// la mémoire flash.
const INTRO_CARTON_FIN_MS = 1800
const INTRO_PROLOGUE_FIN_MS = 13800
const INTRO_PROLOGUE_DUREE_MS = 12000
const INTRO_HANGAR_FIN_MS = 17100
const INTRO_ORBITE_FIN_MS = 20300
const INTRO_COMBAT_FIN_MS = 24500
const INTRO_DISTORSION_FIN_MS = 27300
const INTRO_ARRIVEE_FIN_MS = 29800
const INTRO_DUREE_MS = 32100
const INTRO_CARTON_MS = INTRO_ARRIVEE_FIN_MS - INTRO_CARTON_FIN_MS
const CLE_MODE_INTRO = "ot.intro.mode"
const MODE_INTRO_FILM = 0
const MODE_INTRO_NORMAL = 1
const MODE_INTRO_SANS = 2
// L'intro se lance à chaque démarrage, donc l'option du titre ne propose que FILM et NORMAL. Avec la valeur 3,
// MODE_INTRO_SANS (texte NON) redevient un choix du menu titre ; tous les chemins du mode NON plus bas
// restent en place.
const NOMBRE_MODES_INTRO = 2

// FILM joue la ligne de temps logique de 32,1 s volontairement à moitié vitesse (64,2 s), NORMAL aux deux tiers de la
// vitesse (48,15 s). Dessins, textes et sons suivent tous la ligne de temps logique : les deux modes ne s'écartent donc
// jamais d'une scène à l'autre.
const NUMERATEUR_VITESSE_FILM_INTRO = 1
const DENOMINATEUR_VITESSE_FILM_INTRO = 2
const NUMERATEUR_VITESSE_NORMALE_INTRO = 2
const DENOMINATEUR_VITESSE_NORMALE_INTRO = 3
let introCommenceMs = 0
let repereIntro = 0
let repereHistoireIntro = 0
let repereCartonIntro = false
let modeIntro = -1

function lireModeIntro(): number {
    if (modeIntro >= MODE_INTRO_FILM && modeIntro < NOMBRE_MODES_INTRO) return modeIntro
    if (settings.exists(CLE_MODE_INTRO)) {
        let memorise = Math.round(settings.readNumber(CLE_MODE_INTRO))
        modeIntro = memorise >= MODE_INTRO_FILM && memorise < NOMBRE_MODES_INTRO ? memorise : MODE_INTRO_FILM
    } else modeIntro = MODE_INTRO_FILM
    return modeIntro
}

function nomModeIntro(): string {
    let mode = lireModeIntro()
    if (mode == MODE_INTRO_NORMAL) return Textes.t(235)
    if (mode == MODE_INTRO_SANS) return Textes.t(201)
    return Textes.t(477)
}

function parcourirModeIntro(sens: number): void {
    let suivant = (lireModeIntro() + sens) % NOMBRE_MODES_INTRO
    if (suivant < 0) suivant += NOMBRE_MODES_INTRO
    if (suivant == modeIntro) return
    modeIntro = suivant
    settings.writeNumber(CLE_MODE_INTRO, modeIntro)
}

function dureeIntroSecondes(): number {
    let mode = lireModeIntro()
    if (mode == MODE_INTRO_SANS) return 0
    if (mode == MODE_INTRO_NORMAL) return 48
    return 64
}

// L'intro se lance à chaque démarrage, même si elle a déjà été vue une fois.
function introSeLanceSeule(): boolean {
    return lireModeIntro() != MODE_INTRO_SANS
}

function lancerIntroReglee(): void {
    if (lireModeIntro() == MODE_INTRO_SANS) {
        reglerScene(Scene.Titre)
        return
    }
    lancerIntro()
}

function introUtiliseTempoFilm(): boolean {
    // Chaque mode d'intro sauf NORMAL se joue au tempo du film, même un rejeu que le joueur lance quand l'intro
    // est sur NON.
    return lireModeIntro() != MODE_INTRO_NORMAL
}

function lancerIntro(): void {
    introCommenceMs = game.runtime()
    // Les repères 0 (silence) et 1 appartiennent au carton-titre, qui vient après l'arrivée (repereCartonIntro).
    repereIntro = 2
    repereCartonIntro = false
    repereHistoireIntro = 0
    sceneActive = Scene.Intro
    entreeVerrouillee = false
    lancerMusiqueIntro()
}

function finirIntro(): void {
    if (sceneActive == Scene.Intro) {
        sonTitre()
        reglerScene(Scene.Titre)
    }
}

// Temps logique depuis le début de l'intro, dans l'ordre où elle est montrée.
function tempsLectureIntro(): number {
    let tempsReelEcoule = Math.max(0, game.runtime() - introCommenceMs)
    if (introUtiliseTempoFilm())
        return Math.idiv(tempsReelEcoule * NUMERATEUR_VITESSE_FILM_INTRO, DENOMINATEUR_VITESSE_FILM_INTRO)
    return Math.idiv(tempsReelEcoule * NUMERATEUR_VITESSE_NORMALE_INTRO, DENOMINATEUR_VITESSE_NORMALE_INTRO)
}

// D'abord l'histoire (du prologue à l'arrivée), puis le carton « CALLIOPE HACKER PRÉSENTE », puis l'apparition du
// titre. Renvoie la position sur la ligne de temps d'origine des scènes ; la durée totale reste 32,1 s.
function tempsIntroEcoule(): number {
    let joue = tempsLectureIntro()
    if (joue < INTRO_CARTON_MS) return joue + INTRO_CARTON_FIN_MS
    if (joue < INTRO_ARRIVEE_FIN_MS) return joue - INTRO_CARTON_MS
    return joue
}

function actualiserIntro(): void {
    if (sceneActive != Scene.Intro) return
    let tempsEcoule = tempsIntroEcoule()
    if (repereHistoireIntro == 0 && tempsEcoule >= INTRO_CARTON_FIN_MS + 80) {
        repereHistoireIntro = 1
        sonReperePrologue(0)
    } else if (repereHistoireIntro == 1 && tempsEcoule >= INTRO_CARTON_FIN_MS + 3080) {
        repereHistoireIntro = 2
        sonReperePrologue(1)
    } else if (repereHistoireIntro == 2 && tempsEcoule >= INTRO_CARTON_FIN_MS + 6080) {
        repereHistoireIntro = 3
        sonReperePrologue(2)
    } else if (repereHistoireIntro == 3 && tempsEcoule >= INTRO_CARTON_FIN_MS + 9080) {
        repereHistoireIntro = 4
        sonReperePrologue(3)
    }

    // La ligne de temps d'origine des scènes est en pause pendant que le prologue est montré.
    let tempsCineEcoule = tempsEcoule
    if (tempsEcoule >= INTRO_CARTON_FIN_MS && tempsEcoule < INTRO_PROLOGUE_FIN_MS)
        tempsCineEcoule = INTRO_CARTON_FIN_MS
    else if (tempsEcoule >= INTRO_PROLOGUE_FIN_MS) tempsCineEcoule = tempsEcoule - INTRO_PROLOGUE_DUREE_MS
    // Carillon du carton-titre 1,1 s après son début (repère 1).
    if (!repereCartonIntro && tempsEcoule < INTRO_CARTON_FIN_MS && tempsCineEcoule >= 1100) {
        repereCartonIntro = true
        sonRepereIntro(1)
    }

    if (repereIntro == 2 && tempsCineEcoule >= 1850) {
        repereIntro = 3
        sonRepereIntro(2)
    } else if (repereIntro == 3 && tempsCineEcoule >= 3600) {
        repereIntro = 4
        sonRepereIntro(3)
    } else if (repereIntro == 4 && tempsCineEcoule >= 5000) {
        repereIntro = 5
        sonRepereIntro(4)
    } else if (repereIntro == 5 && tempsCineEcoule >= 6500) {
        repereIntro = 6
        sonRepereIntro(5)
    } else if (repereIntro == 6 && tempsCineEcoule >= 8300) {
        repereIntro = 7
        sonRepereIntro(6)
    } else if (repereIntro == 7 && tempsCineEcoule >= 9300) {
        repereIntro = 8
        sonRepereIntro(7)
    } else if (repereIntro == 8 && tempsCineEcoule >= 10300) {
        repereIntro = 9
        sonRepereIntro(8)
    } else if (repereIntro == 9 && tempsCineEcoule >= 11100) {
        repereIntro = 10
        sonRepereIntro(9)
    } else if (repereIntro == 10 && tempsCineEcoule >= 11900) {
        repereIntro = 11
        sonRepereIntro(10)
    } else if (repereIntro == 11 && tempsCineEcoule >= 12500) {
        repereIntro = 12
        sonRepereIntro(11)
    } else if (repereIntro == 12 && tempsCineEcoule >= 13300) {
        repereIntro = 13
        sonRepereIntro(12)
    } else if (repereIntro == 13 && tempsCineEcoule >= 14100) {
        repereIntro = 14
        sonRepereIntro(13)
    } else if (repereIntro == 14 && tempsCineEcoule >= 14900) {
        repereIntro = 15
        sonRepereIntro(14)
    } else if (repereIntro == 15 && tempsCineEcoule >= 15300) {
        repereIntro = 16
        sonRepereIntro(15)
    } else if (repereIntro == 16 && tempsCineEcoule >= 16600) {
        repereIntro = 17
        sonRepereIntro(16)
    } else if (repereIntro == 17 && tempsCineEcoule >= 17800) {
        repereIntro = 18
        sonRepereIntro(17)
    } else if (repereIntro == 18 && tempsCineEcoule >= 18400) {
        repereIntro = 19
        sonRepereIntro(18)
    } else if (repereIntro == 19 && tempsCineEcoule >= 19100) {
        repereIntro = 20
        sonRepereIntro(19)
    }
    if (tempsEcoule >= INTRO_DUREE_MS) finirIntro()
}

function dessinerEtoilesIntro(tempsEcoule: number, vitesse: number): void {
    let glissement = Math.idiv(tempsEcoule * vitesse, 90)
    for (let i = 0; i < 34; i++) {
        let couche = 1 + i % 3
        let x = (hasardFixe(i, 31, 7) + glissement * couche) % 160
        let y = 8 + hasardFixe(i, 17, 19) % 99
        let couleur = couche == 3 ? COULEUR_TEXTE : (couche == 2 ? COULEUR_CYAN : COULEUR_ATTENUEE)
        if (vitesse >= 3 && i % 3 == 0) screen.drawLine(Math.max(0, x - couche * 3), y, x, y, couleur)
        else screen.setPixel(x, y, couleur)
    }
}

function dessinerBandesIntro(tempsEcoule: number): void {
    screen.fillRect(0, 0, 160, 7, COULEUR_FOND)
    screen.fillRect(0, 108, 160, 12, COULEUR_FOND)
    screen.drawLine(0, 7, 159, 7, COULEUR_BLEUE)
    screen.drawLine(0, 107, 159, 107, COULEUR_BLEUE)
    if (tempsEcoule > 350) ecrireDroite(Textes.t(478), 157, 111, COULEUR_ATTENUEE)
}

function dessinerVaisseauSurvolIntro(cx: number, cy: number, echelle: number): void {
    let xNez = cx + 10 * echelle
    let xArriere = cx - 8 * echelle
    screen.fillTriangle(xNez, cy, xArriere, cy - 5 * echelle, xArriere, cy + 5 * echelle, COULEUR_ATTENUEE)
    screen.fillTriangle(cx + 2 * echelle, cy, cx - 4 * echelle, cy - 10 * echelle, cx - 1 * echelle, cy - 2 * echelle,
        COULEUR_BLEUE)
    screen.fillTriangle(cx + 2 * echelle, cy, cx - 4 * echelle, cy + 10 * echelle, cx - 1 * echelle, cy + 2 * echelle,
        COULEUR_OMBRE)
    screen.fillTriangle(xNez, cy, cx - 1 * echelle, cy, xArriere, cy + 5 * echelle, COULEUR_BLEUE)
    screen.drawLine(xArriere, cy - 5 * echelle, xNez, cy, COULEUR_TEXTE)
    screen.drawLine(xArriere, cy + 5 * echelle, xNez, cy, COULEUR_CYAN)
    screen.fillRect(cx + 2 * echelle, cy - echelle, 3 * echelle, 2 * echelle, COULEUR_FOND)
    screen.drawLine(xArriere, cy - 2 * echelle, xArriere - 6 * echelle, cy - 2 * echelle, COULEUR_ORANGE)
    screen.drawLine(xArriere, cy + 2 * echelle, xArriere - 6 * echelle, cy + 2 * echelle, COULEUR_JAUNE)
}

function dessinerVaisseauCombatIntro(cx: number, cy: number, echelle: number): void {
    screen.fillTriangle(cx, cy - 9 * echelle, cx - 8 * echelle, cy + 7 * echelle, cx + 8 * echelle, cy + 7 * echelle,
        COULEUR_ATTENUEE)
    screen.fillTriangle(cx, cy - 5 * echelle, cx, cy + 8 * echelle, cx + 8 * echelle, cy + 7 * echelle, COULEUR_BLEUE)
    screen.fillTriangle(cx - 2 * echelle, cy, cx - 11 * echelle, cy + 5 * echelle, cx - 4 * echelle, cy + 5 * echelle,
        COULEUR_METAL)
    screen.fillTriangle(cx + 2 * echelle, cy, cx + 11 * echelle, cy + 5 * echelle, cx + 4 * echelle, cy + 5 * echelle,
        COULEUR_METAL)
    screen.drawLine(cx, cy - 9 * echelle, cx, cy + 7 * echelle, COULEUR_CYAN)
    screen.fillRect(cx - echelle, cy - 3 * echelle, 3 * echelle, 3 * echelle, COULEUR_FOND)
    screen.drawLine(cx - 4 * echelle, cy + 7 * echelle, cx - 4 * echelle, cy + 12 * echelle, COULEUR_ORANGE)
    screen.drawLine(cx + 4 * echelle, cy + 7 * echelle, cx + 4 * echelle, cy + 12 * echelle, COULEUR_JAUNE)
}

function dessinerEnnemiIntro(cx: number, cy: number, echelle: number): void {
    screen.fillTriangle(cx, cy + 6 * echelle, cx - 7 * echelle, cy - 5 * echelle, cx + 7 * echelle, cy - 5 * echelle,
        COULEUR_ROUGE)
    screen.fillTriangle(cx, cy + 2 * echelle, cx - 10 * echelle, cy - 2 * echelle, cx - 3 * echelle, cy - 4 * echelle,
        COULEUR_VIOLETTE)
    screen.fillTriangle(cx, cy + 2 * echelle, cx + 10 * echelle, cy - 2 * echelle, cx + 3 * echelle, cy - 4 * echelle,
        COULEUR_VIOLETTE)
    screen.setPixel(cx, cy, COULEUR_JAUNE)
}

function dessinerVaisseauLancementIntro(cx: number, cy: number, demiLargeur: number, longueur: number,
    poussee: number): void {
    let yNez = cy - longueur
    let yArriere = cy + Math.idiv(longueur, 2)
    screen.fillTriangle(cx, yNez, cx - demiLargeur, yArriere, cx + demiLargeur, yArriere, COULEUR_ATTENUEE)
    screen.fillTriangle(cx, yNez + 3, cx, yArriere, cx + demiLargeur, yArriere, COULEUR_BLEUE)
    screen.fillTriangle(cx - 3, cy, cx - demiLargeur - 5, yArriere - 3, cx -
        demiLargeur + 3, yArriere - 4, COULEUR_METAL)
    screen.fillTriangle(cx + 3, cy, cx + demiLargeur + 5, yArriere - 3, cx +
        demiLargeur - 3, yArriere - 4, COULEUR_METAL)
    screen.drawLine(cx, yNez, cx, yArriere, COULEUR_CYAN)
    screen.fillRect(cx - 2, yNez + Math.idiv(longueur, 3), 5, 5, COULEUR_FOND)
    screen.drawLine(cx - Math.idiv(demiLargeur, 3), yArriere, cx - Math.idiv(demiLargeur, 3), yArriere + poussee,
        COULEUR_ORANGE)
    screen.drawLine(cx + Math.idiv(demiLargeur, 3), yArriere, cx + Math.idiv(demiLargeur, 3), yArriere + poussee,
        COULEUR_JAUNE)
}

function dessinerStationIntro(cx: number, cy: number, impulsion: number): void {
    screen.drawCircle(cx, cy, 13, COULEUR_CYAN)
    screen.drawCircle(cx, cy, 10, COULEUR_BLEUE)
    screen.drawLine(cx - 20, cy, cx + 20, cy, COULEUR_ATTENUEE)
    screen.drawLine(cx, cy - 16, cx, cy + 16, COULEUR_METAL)
    screen.fillRect(cx - 4, cy - 4, 9, 9, COULEUR_OMBRE)
    screen.drawRect(cx - 4, cy - 4, 9, 9, COULEUR_TEXTE)
    screen.fillRect(cx - 25, cy - 3, 8, 7, COULEUR_BLEUE)
    screen.fillRect(cx + 18, cy - 3, 8, 7, COULEUR_BLEUE)
    screen.setPixel(cx - 13, cy, impulsion == 0 ? COULEUR_JAUNE : COULEUR_ROUGE)
    screen.setPixel(cx + 13, cy, impulsion == 0 ? COULEUR_ROUGE : COULEUR_JAUNE)
}

function dessinerCapsuleSauvetageIntro(cx: number, cy: number): void {
    screen.fillRect(cx - 3, cy - 4, 7, 9, COULEUR_ATTENUEE)
    screen.drawRect(cx - 3, cy - 4, 7, 9, COULEUR_CYAN)
    screen.setPixel(cx, cy - 1, COULEUR_VERTE)
    screen.drawLine(cx - 2, cy + 5, cx - 4, cy + 8, COULEUR_ORANGE)
    screen.drawLine(cx + 2, cy + 5, cx + 4, cy + 8, COULEUR_ORANGE)
}

function dessinerExplosionIntro(cx: number, cy: number, age: number, rayonMax: number): void {
    let rayon = Math.min(rayonMax, 2 + Math.idiv(age, 42))
    screen.fillCircle(cx, cy, rayon, COULEUR_ORANGE)
    screen.fillCircle(cx, cy, Math.max(1, rayon - 4), COULEUR_JAUNE)
    screen.setPixel(cx, cy, COULEUR_TEXTE)
    screen.drawLine(cx - rayon - 4, cy, cx + rayon + 4, cy, COULEUR_ROUGE)
    screen.drawLine(cx, cy - rayon - 4, cx, cy + rayon + 4, COULEUR_ORANGE)
    screen.drawLine(cx - rayon, cy - rayon, cx + rayon, cy + rayon, COULEUR_JAUNE)
    screen.drawLine(cx + rayon, cy - rayon, cx - rayon, cy + rayon, COULEUR_JAUNE)
}

function yMondeIntro(monde: number): number {
    return 13 + Math.idiv(MONDE_Y[monde] * 58, 110)
}

function dessinerHistoireMonteeIntro(local: number): void {
    if (local < 80) {
        screen.fill(COULEUR_CYAN)
        return
    }
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 1)
    let revele =
        Math.clamp(0, NOMBRE_MONDES_PUBLICS, Math.idiv((local - 120) * NOMBRE_MONDES_PUBLICS, 1550))
    for (let i = 0; i < revele; i++) {
        let x = MONDE_X[i]
        let y = yMondeIntro(i)
        if (i % 6 != 0 && i - 1 < revele)
            screen.drawLine(MONDE_X[i - 1], yMondeIntro(i - 1), x, y, COULEUR_BLEUE)
        if (i >= 6 && i % 2 == 0 && i - 6 < revele)
            screen.drawLine(MONDE_X[i - 6], yMondeIntro(i - 6), x, y, COULEUR_ATTENUEE)
        screen.fillCircle(x, y, i % 5 == 0 ? 2 : 1, i % 4 == 0 ? COULEUR_JAUNE : COULEUR_CYAN)
    }
    if (local < 1050) {
        legendeIntro(Textes.t(479), 84, COULEUR_VERTE)
        legendeIntro(Textes.t(480), 96, COULEUR_TEXTE)
    } else {
        legendeIntro(Textes.t(481), 90, COULEUR_JAUNE)
    }
}

function dessinerHistoireChuteIntro(local: number): void {
    if (local < 80) {
        screen.fill(COULEUR_ROUGE)
        return
    }
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 1)
    for (let i = 0; i < NOMBRE_MONDES_PUBLICS; i++) {
        let x = MONDE_X[i]
        let y = yMondeIntro(i)
        let echecMs = 350 + hasardFixe(i, 83, 17) % 1800
        let vivant = local < echecMs
        if (i % 6 != 0) {
            let px = MONDE_X[i - 1]
            let py = yMondeIntro(i - 1)
            if (vivant) screen.drawLine(px, py, x, y, COULEUR_BLEUE)
            else {
                screen.drawLine(px, py, Math.idiv(px + x, 2) - 2, Math.idiv(py + y, 2), COULEUR_ROUGE)
                screen.drawLine(Math.idiv(px + x, 2) + 3, Math.idiv(py + y, 2), x, y, COULEUR_ROUILLE)
            }
        }
        screen.fillCircle(x, y, i % 5 == 0 ? 2 : 1, vivant ? COULEUR_CYAN :
            (i % 3 == 0 ? COULEUR_ROUGE : COULEUR_ATTENUEE))
    }
    let xScan = Math.idiv(local * 180, 3000) - 10
    screen.drawLine(xScan, 8, xScan, 78, COULEUR_ROUGE)
    if (local >= 900 && local < 2050) dessinerExplosionIntro(80, 43, local - 900, 13)
    if (local < 1000) legendeIntro(Textes.t(482), 88, COULEUR_JAUNE)
    else if (local < 2050) legendeIntro(Textes.t(483), 91, COULEUR_ROUGE)
    else legendeIntro(Textes.t(484), 91, COULEUR_TEXTE)
}

function dessinerHistoirePiratesIntro(local: number): void {
    if (local < 80) {
        screen.fill(COULEUR_ROUGE)
        return
    }
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 2)
    for (let i = 0; i < 9; i++) {
        let xRoute = 8 + i * 18
        screen.drawLine(xRoute, 78 - i * 5, xRoute + 10, 75 - i * 5, i < 5 ? COULEUR_ATTENUEE : COULEUR_ROUGE)
    }
    let xVaisseau = 48 + Math.idiv(local * 45, 3000)
    dessinerVaisseauSurvolIntro(xVaisseau, 62, 2)
    let progressionEnnemi = Math.clamp(0, 1000, Math.idiv((local - 380) * 1000, 1050))
    let xEnnemi1 = 170 - Math.idiv(progressionEnnemi * 50, 1000)
    let xEnnemi2 = -12 + Math.idiv(progressionEnnemi * 47, 1000)
    dessinerEnnemiIntro(xEnnemi1, 30, 1)
    if (local >= 650) dessinerEnnemiIntro(xEnnemi2, 43, 1)
    if (local >= 1050 && local < 2100) {
        screen.drawLine(xEnnemi1 - 2, 35, xVaisseau + 8, 55, COULEUR_ROUGE)
        screen.drawLine(xEnnemi2 + 2, 48, xVaisseau - 7, 58, COULEUR_ORANGE)
        let bouclier = 19 + Math.idiv(local, 90) % 3
        dessinerLosangeApercu(xVaisseau, 62, bouclier, 13, COULEUR_CYAN)
    }
    if (local >= 2050 && local < 2750) dessinerExplosionIntro(xEnnemi2, 43, local - 2050, 11)
    if (local < 950) legendeIntro(Textes.t(485), 13, COULEUR_ATTENUEE)
    else if (local < 2050) legendeIntro(Textes.t(486), 13, COULEUR_ROUGE)
    else legendeIntro(Textes.t(487), 93, COULEUR_JAUNE)
}

function dessinerHistoireHeritageIntro(local: number): void {
    if (local < 80) {
        screen.fill(COULEUR_CYAN)
        return
    }
    if (local >= 2880) {
        screen.fill(COULEUR_FOND)
        return
    }
    screen.fill(COULEUR_FOND)
    remplirQuadrilatereHangar(0, 8, 159, 8, 124, 107, 36, 107, COULEUR_BLEUE)
    screen.fillTriangle(80, 12, 35, 107, 125, 107, COULEUR_OMBRE)
    screen.fillRect(0, 75, 160, 33, COULEUR_OMBRE)
    screen.drawLine(80, 50, 15, 107, COULEUR_ATTENUEE)
    screen.drawLine(80, 50, 145, 107, COULEUR_ATTENUEE)
    screen.drawLine(80, 50, 80, 107, COULEUR_METAL)
    screen.drawLine(50, 76, 110, 76, COULEUR_ATTENUEE)
    screen.drawLine(31, 92, 129, 92, COULEUR_ATTENUEE)
    let poussee = local >= 2150 ? 12 : (local >= 1500 ? 5 : 1)
    dessinerVaisseauLancementIntro(80, 67, 19, 25, poussee)
    let impulsion = Math.idiv(local, 180) % 2
    screen.fillRect(21, 93, 3, 3, impulsion == 0 ? COULEUR_JAUNE : COULEUR_CYAN)
    screen.fillRect(136, 93, 3, 3, impulsion == 0 ? COULEUR_CYAN : COULEUR_JAUNE)
    screen.fillRect(5, 29, 31, 18, COULEUR_FOND)
    screen.drawRect(5, 29, 31, 18, COULEUR_CYAN)
    ecrireTexteJeu("LUMA", 9, 32, COULEUR_VERTE)
    legendeIntro(Textes.t(488), 40, COULEUR_JAUNE)
    if (local < 950) legendeIntro(Textes.t(489), 13, COULEUR_TEXTE)
    else if (local < 1850) legendeIntro(Textes.t(490), 13, COULEUR_JAUNE)
    else {
        screen.fillRect(14, 86, 132, 20, COULEUR_FOND)
        if (local < 2450) legendeIntro(Textes.t(491), 91, COULEUR_TEXTE)
        else legendeIntro(Textes.t(492), 91, COULEUR_JAUNE)
    }
}

function dessinerPrologueIntro(local: number): void {
    if (local < 3000) dessinerHistoireMonteeIntro(local)
    else if (local < 6000) dessinerHistoireChuteIntro(local - 3000)
    else if (local < 9000) dessinerHistoirePiratesIntro(local - 6000)
    else dessinerHistoireHeritageIntro(local - 9000)
}

function dessinerHangarIntro(local: number): void {
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 1)

    // Immense baie de lancement avec une porte qui s'ouvre sur l'espace.
    remplirQuadrilatereHangar(0, 8, 159, 8, 119, 35, 40, 35, COULEUR_BLEUE)
    screen.drawLine(0, 15, 159, 15, COULEUR_METAL)
    screen.drawLine(15, 25, 145, 25, COULEUR_METAL)
    screen.drawLine(0, 8, 48, 35, COULEUR_ATTENUEE)
    screen.drawLine(40, 8, 64, 35, COULEUR_ATTENUEE)
    screen.drawLine(80, 8, 80, 35, COULEUR_ATTENUEE)
    screen.drawLine(120, 8, 96, 35, COULEUR_ATTENUEE)
    screen.drawLine(159, 8, 112, 35, COULEUR_ATTENUEE)
    screen.fillRect(40, 20, 80, 45, COULEUR_ROUILLE)
    screen.fillRect(46, 24, 68, 38, COULEUR_FOND)
    for (let i = 0; i < 8; i++) {
        screen.setPixel(51 + hasardFixe(i, 9, 4) % 58, 28 + hasardFixe(i, 4, 12) % 27,
            i % 3 == 0 ? COULEUR_CYAN : COULEUR_TEXTE)
    }

    let porteOuverte = Math.clamp(0, 27, Math.idiv((local - 220) * 27, 1400))
    let largeurPorte = 34 - porteOuverte
    screen.fillRect(46, 24, largeurPorte, 38, COULEUR_OMBRE)
    screen.fillRect(114 - largeurPorte, 24, largeurPorte, 38, COULEUR_OMBRE)
    screen.drawLine(46 + largeurPorte, 24, 46 + largeurPorte, 61, COULEUR_CYAN)
    screen.drawLine(113 - largeurPorte, 24, 113 - largeurPorte, 61, COULEUR_CYAN)
    screen.drawRect(40, 20, 80, 45, COULEUR_ATTENUEE)

    screen.fillRect(0, 62, 160, 46, COULEUR_OMBRE)
    remplirQuadrilatereHangar(68, 62, 92, 62, 136, 108, 24, 108, COULEUR_METAL)
    remplirQuadrilatereHangar(75, 62, 85, 62, 111, 108, 49, 108, COULEUR_BLEUE)
    screen.drawLine(80, 61, 0, 108, COULEUR_ATTENUEE)
    screen.drawLine(80, 61, 32, 108, COULEUR_ATTENUEE)
    screen.drawLine(80, 61, 80, 108, COULEUR_ATTENUEE)
    screen.drawLine(80, 61, 128, 108, COULEUR_ATTENUEE)
    screen.drawLine(80, 61, 159, 108, COULEUR_ATTENUEE)
    screen.drawLine(58, 74, 102, 74, COULEUR_ATTENUEE)
    screen.drawLine(40, 88, 120, 88, COULEUR_ATTENUEE)
    screen.drawLine(21, 103, 139, 103, COULEUR_ATTENUEE)

    let progressionLancement = Math.clamp(0, 1000, Math.idiv((local - 900) * 1000, 2200))
    let yVaisseau = 92 - Math.idiv(progressionLancement * 43, 1000)
    let largeurVaisseau = 18 - Math.idiv(progressionLancement * 10, 1000)
    let longueurVaisseau = 22 - Math.idiv(progressionLancement * 12, 1000)
    let poussee = 5 + Math.idiv(progressionLancement * 12, 1000)
    dessinerVaisseauLancementIntro(80, yVaisseau, largeurVaisseau, longueurVaisseau, poussee)

    let phaseLumiere = Math.idiv(local, 150) % 2
    screen.fillRect(44, 96, 3, 2, phaseLumiere == 0 ? COULEUR_JAUNE : COULEUR_ROUGE)
    screen.fillRect(113, 96, 3, 2, phaseLumiere == 0 ? COULEUR_ROUGE : COULEUR_JAUNE)
    screen.fillRect(59, 80, 2, 2, phaseLumiere == 0 ? COULEUR_CYAN : COULEUR_JAUNE)
    screen.fillRect(99, 80, 2, 2, phaseLumiere == 0 ? COULEUR_JAUNE : COULEUR_CYAN)
    if (local < 1050) legendeIntro(Textes.t(493), 12, COULEUR_VERTE)
    else if (local < 2300) legendeIntro(Textes.t(494), 12, COULEUR_JAUNE)
    else legendeIntro(Textes.t(495), 12, COULEUR_CYAN)

    // Deux poutres au premier plan se dressent devant le vaisseau et renforcent l'impression de profondeur.
    screen.fillRect(0, 31, 7, 77, COULEUR_ROUILLE)
    screen.fillRect(153, 31, 7, 77, COULEUR_ROUILLE)
    screen.drawLine(0, 42, 7, 49, COULEUR_METAL)
    screen.drawLine(153, 49, 159, 42, COULEUR_METAL)
    if (local >= 3180 && local < 3240) screen.fill(COULEUR_CYAN)
    else if (local >= 3240) screen.fill(COULEUR_TEXTE)
}

// Le Calliope Hacker à son bureau, vu de dos (capuche sur la tête, baskets turquoise, Calliope mini avec GameKit, chat
// endormi) : une copie en pixels de la figure, dans la palette de ce jeu.
const CARTON_HACKER = img`
    . . . . . . . . . . . . . . . . f f f f f . . . . . . . . . . . . . . . 8 . . . . . . . . . . . . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . f f f f f f f 9 . . . . . 8 . 8 . c c c c c c c c c c c c c c c c c c c c c c . . . . . . . . . . .
    . . . . . . . . . . . . . f c c f f f f f f 9 . 8 . 8 . 8 . 8 f f f f f f f f f f f f f f f f f f f f f f . . . . . . . . . . .
    . . . . . . . . . . . . f c f f f f f f f f f 9 . 8 . 8 8 8 8 f f f f f f f f f f f f f f f f f f f f f f . . . . . . . . . . .
    . . . . . . . . . . . . f c f f f f f f f f f 9 8 8 8 8 8 8 8 f f f 9 9 9 9 9 9 f f f f f f f f f f f f f . 8 . . . . . . . . .
    . . . . . . . . . . . f c f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f f f f f f f f f f f f f f f f f f 8 . 8 . . . . . . . .
    . . . . . . . . . . . f f f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f 5 5 5 5 5 5 5 5 5 f f f f f f f f . 8 . 8 . . . . . . .
    . . . . . . . . . . . f f f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f f f f f f f f f f f f f f f f f f 8 8 8 . 8 . . . . . .
    . . . . . . . . . . . f f f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f 6 6 6 6 6 f f f f f f f f f f f f 8 8 8 8 . 8 . . . . .
    . . . . . . . . . . . f f f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f f f f f f f f f f f f f f f f f f 8 8 5 5 8 . 8 5 5 . .
    . . . . . . . . . . . c f f f f f f f f f f f f 9 8 8 8 8 8 8 f f f f f f f 2 2 2 2 2 2 2 2 f f f f f f f 8 8 5 8 8 8 8 8 5 . .
    . . . . . . . . . . f f c f f f f f f f f f f f f 9 8 8 8 8 8 f f f f f f f f f f f f f f f f f f f f f f 8 8 8 8 8 8 8 8 8 8 .
    . . . . . . . . . f f f f c c f f f f f f f f f f f 9 8 8 8 8 f f f f f 9 9 9 9 9 9 9 9 9 9 9 f f f f f f 5 8 8 8 2 8 2 8 8 8 5
    . . . . . . f f f f f f f f f c c c c f f f f f f f f 9 8 8 8 f f f f f f f f f f f f f f f f f f f f f f 5 8 8 8 2 2 2 8 8 8 5
    . . . . . f 6 6 6 6 6 6 f f f f f f f f f f f f f f f f 9 8 8 f f f 8 8 8 8 f f f f f f f f f f f f f f f 8 8 8 8 8 2 8 8 8 8 .
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f f 9 8 f f f f f f f f f f f f f f f f f f f f f f 8 8 5 8 8 8 8 8 5 . 8
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f c f f f f 9 f f f f f f f f f f f f f f f f f f f f f f 8 8 5 5 8 f 8 5 5 8 .
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f c f f f f 9 8 8 8 8 8 8 8 8 8 c c c 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 . 8 . .
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f c f f f f f 4 4 8 8 8 c c c c c c c c c 8 8 8 8 8 8 8 8 8 8 8 8 . 8 . 8 .
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f c f f f f 4 4 f f f e e e e e e e e e e e e e e e e e e e e e e e e e e
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f f 8 c 9 c 6 c 2 c f e e e e e e e e e e f f f f f f f f f f f f e e e e
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f e e e e e e e e e e e e e e e e e e e f f 1 f f b c b f 2 f 2 f f e e e
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f e e e e e e e e e e e e e e e e e e e f 1 1 1 f f f f f 2 f 2 f f e e e
    . . . . f 6 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f f e e e e e e e e e e e e e e e e e e e f 1 f f f f f f f f f f e e e e
    . . . . . f 6 6 6 6 6 6 f f f f f f f f f f f f f f f f f f f f e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e
    . . . . . f 6 6 6 6 6 6 6 f f f f f f f f f f f f f f f f f f f f c e e e e e e e e e e e e e e e e e e e e e e e e e e e e e e
    . . . . . . f 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 f f f f f f f f f f f f 8 8 8 8 8 8 8 8 8 8 8 c c 8 8 . 8 . 8 . 8 . . c b b b b b b
    . . . . . . . f f f f f f f f f f f f f f f f f f f f f f f f f f f 8 8 8 8 8 8 8 8 8 8 8 c c 8 . 8 . 8 . . . . . c b b b b b b
    . . . . . . . . . . . . . . . . . f f . f f f f f . 8 f f f f f c . 8 . 8 . 8 . 8 . 8 . 8 c c . 8 . . . . . . . . c b b b b b b
    . . . . . . . . . . . . . . . . . f f . f f f f f . . 8 f f f f c 8 . 8 . 8 . 8 . 8 . 8 . c c . . 6 6 6 6 6 . . . c b c c c c b
    . . . . . . . . . . . . . . . . . f f . f f f f f . . . f f f f c . . . 8 . . . . . . . . c c . 6 6 6 6 6 6 6 . . c b b b b b b
    . . . . . . . . . . . . . . . . . f f 6 6 6 6 6 6 6 . . f f f f c . . . . . . . . . . . . c c . 6 6 f f f 6 6 . . c b b b b b b
    . . f . . . f . . . . . . . . . . f f 6 1 6 6 6 6 6 . . f f f f c . . . . . . . . . . . . c c . 6 6 6 6 6 6 6 . . c b b b b b b
    . . f f . f f . . . . . . . . . . f f 1 1 1 1 1 1 1 . . f f f f c . . . . . . . . . . . . c c . 6 6 6 6 6 6 6 . . c b c c c c b
    . f 1 1 1 1 1 f 1 1 . . . . . . . f f . . . . . . . . 6 6 6 6 6 6 6 6 . . . . . . . . . . c c . 6 6 c c c 6 6 . . c b b b b b b
    . 1 1 f 1 1 1 1 1 1 1 f f f f f f f f f f f f f f . 6 6 1 6 6 6 6 6 6 6 . . . . . . . . . c c . 6 6 6 6 6 6 6 . . c b b b b b b
    f 1 1 1 1 1 1 f f 1 1 . . . . f f . . . . . . f f . 1 1 1 1 1 1 1 1 1 1 . . . . . . . . . c c . 6 6 6 6 6 6 6 . . c b b b b b b
    6 6 6 6 6 6 6 6 6 6 6 . . . . c c . . . . . . c c . . . . . . . . . . . . . . . . . . . . c c . . 6 6 6 6 6 . . . c b c c c c b
    . 6 6 6 6 6 6 6 6 6 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . c b b b b b b
    . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . c b b b b b b
`

// Carton « CALLIOPE HACKER PRÉSENTE » ; il apparaît après l'arrivée, juste avant l'apparition du titre.
function dessinerCartonIntro(tempsEcoule: number): void {
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(tempsEcoule, 1)
    screen.fillRect(47, 9, 66, 42, COULEUR_BLEUE)
    screen.drawTransparentImage(CARTON_HACKER, 48, 10)
    let ligneMoitie = Math.clamp(0, 59, Math.idiv((tempsEcoule - 120) * 59, 500))
    screen.drawLine(80 - ligneMoitie, 53, 80 + ligneMoitie, 53, COULEUR_CYAN)
    screen.drawLine(80 - ligneMoitie, 80, 80 + ligneMoitie, 80, COULEUR_BLEUE)
    if (tempsEcoule >= 280) {
        ecrireTexteJeu("CALLIOPE HACKER", 35, 60, COULEUR_TEXTE)
        let visible = Math.clamp(0, 90, Math.idiv((tempsEcoule - 280) * 90, 620))
        if (visible < 90) screen.fillRect(35 + visible, 59, 90 - visible, 10, COULEUR_FOND)
    }
    if (tempsEcoule >= 930) legendeIntro(Textes.t(496), 72, COULEUR_VERTE)
    if (tempsEcoule >= 1600) {
        let balayage = Math.clamp(0, 80, Math.idiv((tempsEcoule - 1600) * 80, 200))
        screen.fillRect(0, 8, balayage, 99, COULEUR_FOND)
        screen.fillRect(160 - balayage, 8, balayage, 99, COULEUR_FOND)
    }
}

function dessinerOrbiteIntro(local: number): void {
    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 2)

    // Un monde bleu et sa station commerciale en orbite remplissent le panorama.
    screen.fillCircle(137, 109, 51, COULEUR_CYAN)
    screen.fillCircle(139, 110, 47, COULEUR_BLEUE)
    screen.fillTriangle(113, 88, 128, 84, 124, 99, COULEUR_OMBRE)
    screen.fillTriangle(139, 77, 158, 80, 150, 93, COULEUR_OMBRE)
    screen.fillTriangle(142, 104, 159, 98, 159, 119, COULEUR_OMBRE)
    screen.drawLine(100, 91, 158, 79, COULEUR_ATTENUEE)
    screen.drawLine(94, 99, 159, 87, COULEUR_METAL)
    screen.setPixel(116, 80, COULEUR_JAUNE)
    screen.setPixel(127, 73, COULEUR_JAUNE)
    screen.setPixel(151, 69, COULEUR_JAUNE)
    dessinerStationIntro(113, 34, Math.idiv(local, 180) % 2)
    screen.drawLine(113, 48, 117, 64, COULEUR_ATTENUEE)
    screen.drawLine(117, 64, 121, 75, COULEUR_CYAN)

    let progression = Math.clamp(0, 1000, Math.idiv(local * 1000, 3100))
    let xVaisseau = -18 + Math.idiv(progression * 202, 1000)
    let yVaisseau = 45 + Math.idiv(progression * 23, 1000)
    let echelleVaisseau = 1 + Math.min(2, Math.idiv(progression, 350))
    dessinerVaisseauSurvolIntro(xVaisseau, yVaisseau, echelleVaisseau)

    if (local >= 350 && local < 1850) {
        screen.fillRect(5, 91, 150, 10, COULEUR_FOND)
        screen.drawLine(5, 90, 154, 90, COULEUR_BLEUE)
        legendeIntro(Textes.t(497), 94, COULEUR_TEXTE)
    } else if (local >= 1850 && local < 2900) {
        screen.fillRect(5, 91, 150, 10, COULEUR_FOND)
        screen.drawLine(5, 90, 154, 90, COULEUR_BLEUE)
        legendeIntro(Textes.t(498), 94, COULEUR_JAUNE)
    }
    if (local >= 2650) {
        let alerte = Math.idiv(local, 110) % 2 == 0 ? COULEUR_ROUGE : COULEUR_JAUNE
        screen.fillRect(145, 18, 3, 3, alerte)
        screen.fillRect(151, 25, 3, 3, alerte)
        screen.fillRect(142, 32, 3, 3, alerte)
    }
}

function dessinerDistorsionIntro(local: number): void {
    for (let i = 0; i < 24; i++) {
        let xBord = hasardFixe(i, 71, 13) % 160
        let yBord = 8 + hasardFixe(i, 43, 29) % 99
        let phase = (Math.idiv(local, 42) + i * 3) % 12
        let depart = 2 + phase
        let fin = Math.min(14, depart + 3)
        let x0 = 80 + Math.idiv((xBord - 80) * depart, 14)
        let y0 = 58 + Math.idiv((yBord - 58) * depart, 14)
        let x1 = 80 + Math.idiv((xBord - 80) * fin, 14)
        let y1 = 58 + Math.idiv((yBord - 58) * fin, 14)
        screen.drawLine(x0, y0, x1, y1, i % 3 == 0 ? COULEUR_CYAN : COULEUR_ATTENUEE)
    }
}

function dessinerCombatIntro(local: number): void {
    if (local >= 3900) {
        if (local < 4010) screen.fill(COULEUR_TEXTE)
        else if (local < 4120) screen.fill(COULEUR_CYAN)
        else screen.fill(COULEUR_FOND)
        return
    }

    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 3)
    let xSecousse = 0
    let ySecousse = 0
    if (local >= 850 && local < 1750) {
        xSecousse = hasardFixe(Math.idiv(local, 35), 3, 7) % 3 - 1
        ySecousse = hasardFixe(Math.idiv(local, 41), 5, 9) % 3 - 1
    }

    let xHeros = 80
    if (local >= 2100 && local < 2750) xHeros += Math.idiv((local - 2100) * 16, 650)
    else if (local >= 2750 && local < 3400) xHeros += 16 - Math.idiv((local - 2750) * 16, 650)
    let yHeros = 80

    let progressionEnnemi1 = Math.clamp(0, 1000, Math.idiv(local * 1000, 700))
    let xEnnemi1 = 168 - Math.idiv(progressionEnnemi1 * 45, 1000)
    let yEnnemi1 = 22 + Math.idiv(progressionEnnemi1 * 14, 1000)
    let progressionEnnemi2 = Math.clamp(0, 1000, Math.idiv((local - 450) * 1000, 750))
    let xEnnemi2 = -15 + Math.idiv(progressionEnnemi2 * 52, 1000)
    let yEnnemi2 = 29 + Math.idiv(progressionEnnemi2 * 15, 1000)
    let progressionEnnemi3 = Math.clamp(0, 1000, Math.idiv((local - 2200) * 1000, 800))
    let xEnnemi3 = 132 - Math.idiv(progressionEnnemi3 * 27, 1000)
    let yEnnemi3 = -12 + Math.idiv(progressionEnnemi3 * 41, 1000)

    if (local < 1900) dessinerEnnemiIntro(xEnnemi1, yEnnemi1, 1)
    if (local >= 450 && local < 3200) dessinerEnnemiIntro(xEnnemi2, yEnnemi2, 1)
    if (local >= 2200) dessinerEnnemiIntro(xEnnemi3, yEnnemi3, local >= 3450 ? 2 : 1)
    dessinerVaisseauCombatIntro(xHeros + xSecousse, yHeros + ySecousse, 2)

    if (local >= 700 && local < 1450) {
        screen.drawLine(xEnnemi1, yEnnemi1 + 5, xHeros - 5 + xSecousse, yHeros - 14 + ySecousse, COULEUR_ROUGE)
        screen.drawLine(xEnnemi1 + 3, yEnnemi1 + 5, xHeros + 6 + xSecousse, yHeros - 13 + ySecousse, COULEUR_ORANGE)
        if (local >= 950)
            screen.drawLine(xEnnemi2, yEnnemi2 + 5, xHeros - 10 + xSecousse, yHeros - 9 + ySecousse, COULEUR_ROUGE)
    }
    if (local >= 850 && local < 1700) {
        let impulsionBouclier = Math.idiv(local, 65) % 3
        dessinerLosangeApercu(xHeros + xSecousse, yHeros - 2 + ySecousse, 24 +
            impulsionBouclier, 16 + impulsionBouclier, COULEUR_CYAN)
        dessinerLosangeApercu(xHeros + xSecousse, yHeros - 2 + ySecousse, 30 +
            impulsionBouclier, 20 + impulsionBouclier,
            impulsionBouclier == 0 ? COULEUR_TEXTE : COULEUR_BLEUE)
    }
    if (local >= 1450 && local < 2200) {
        screen.drawLine(xHeros - 7 + xSecousse, yHeros - 17 + ySecousse, xEnnemi1 - 2, yEnnemi1 + 6, COULEUR_CYAN)
        screen.drawLine(xHeros + 7 + xSecousse, yHeros - 17 + ySecousse, xEnnemi1 + 2, yEnnemi1 + 6, COULEUR_JAUNE)
    }
    if (local >= 1900 && local < 2600) dessinerExplosionIntro(123, 36, local - 1900, 15)

    if (local >= 2250 && local < 3500) {
        dessinerCapsuleSauvetageIntro(74, 39)
        if (local >= 2600) {
            screen.drawLine(xHeros - 4, yHeros - 14, 71, 47, COULEUR_VERTE)
            screen.drawLine(xHeros + 4, yHeros - 14, 77, 47, COULEUR_CYAN)
        }
    }
    if (local >= 2350 && local < 2900)
        screen.drawLine(xEnnemi2, yEnnemi2 + 5, xHeros - 7, yHeros - 13, COULEUR_ROUGE)
    if (local >= 2880 && local < 3380) {
        screen.drawLine(xHeros - 6, yHeros - 17, xEnnemi2 - 2, yEnnemi2 + 6, COULEUR_CYAN)
        screen.drawLine(xHeros + 6, yHeros - 17, xEnnemi2 + 2, yEnnemi2 + 6, COULEUR_JAUNE)
    }
    if (local >= 3200 && local < 3890) dessinerExplosionIntro(37, 44, local - 3200, 14)
    if (local >= 3450 && local < 3890) {
        screen.drawLine(xEnnemi3 - 4, yEnnemi3 + 8, xHeros, yHeros - 15, COULEUR_ROUGE)
        screen.drawLine(xEnnemi3 + 4, yEnnemi3 + 8, xHeros + 8, yHeros - 13, COULEUR_ORANGE)
    }

    if (local < 850) legendeIntro(Textes.t(499), 12, COULEUR_ROUGE)
    else if (local >= 2250 && local < 3500) legendeIntro(Textes.t(500), 12, COULEUR_CYAN)
    else if (local >= 3500) legendeIntro(Textes.t(501), 12, COULEUR_JAUNE)
}

function dessinerHypersautIntro(local: number): void {
    if (local < 80) {
        screen.fill(COULEUR_CYAN)
        return
    }
    if (local >= 2600) {
        if (local < 2700) screen.fill(COULEUR_TEXTE)
        else screen.fill(COULEUR_CYAN)
        return
    }

    screen.fill(COULEUR_FOND)
    let progression = Math.clamp(0, 1000, Math.idiv(local * 1000, 2600))
    dessinerDistorsionIntro(local * (2 + Math.idiv(progression, 330)))
    for (let i = 0; i < 3; i++) {
        let phaseAnneau = (progression + i * 330) % 1000
        let anneau = 8 + Math.idiv(phaseAnneau * 66, 1000)
        let hauteurAnneau = 5 + Math.idiv(anneau * 3, 5)
        dessinerLosangeApercu(80, 56, anneau, hauteurAnneau, i == 0 ? COULEUR_TEXTE :
            (i == 1 ? COULEUR_CYAN : COULEUR_BLEUE))
    }

    let yVaisseau = 82 - Math.idiv(progression * 25, 1000)
    let largeurVaisseau = 12 - Math.idiv(progression * 6, 1000)
    let longueurVaisseau = 16 - Math.idiv(progression * 8, 1000)
    dessinerVaisseauLancementIntro(80, yVaisseau, largeurVaisseau, longueurVaisseau, 8 +
        Math.idiv(progression * 8, 1000))
    if (local >= 250 && local < 1250) legendeIntro(Textes.t(502), 14, COULEUR_VERTE)
    else if (local >= 1250) legendeIntro(Textes.t(503), 14, COULEUR_JAUNE)
}

function dessinerArriveeIntro(local: number): void {
    if (local < 90) {
        screen.fill(COULEUR_TEXTE)
        return
    }
    if (local < 170) {
        screen.fill(COULEUR_CYAN)
        return
    }

    screen.fill(COULEUR_FOND)
    dessinerEtoilesIntro(local, 1)

    // Lever de soleil sur une planète, sous une gigantesque station spatiale.
    screen.fillCircle(80, 147, 74, COULEUR_ORANGE)
    screen.drawCircle(80, 147, 75, COULEUR_JAUNE)
    screen.drawCircle(80, 147, 72, COULEUR_ROUILLE)
    screen.drawLine(23, 94, 137, 94, COULEUR_ROUILLE)
    screen.drawLine(16, 103, 144, 103, COULEUR_JAUNE)

    screen.drawLine(10, 42, 35, 29, COULEUR_CYAN)
    screen.drawLine(35, 29, 80, 22, COULEUR_ATTENUEE)
    screen.drawLine(80, 22, 125, 29, COULEUR_ATTENUEE)
    screen.drawLine(125, 29, 150, 42, COULEUR_CYAN)
    screen.drawLine(150, 42, 125, 56, COULEUR_BLEUE)
    screen.drawLine(125, 56, 80, 62, COULEUR_ATTENUEE)
    screen.drawLine(80, 62, 35, 56, COULEUR_ATTENUEE)
    screen.drawLine(35, 56, 10, 42, COULEUR_BLEUE)
    screen.drawLine(24, 42, 45, 34, COULEUR_METAL)
    screen.drawLine(45, 34, 80, 29, COULEUR_METAL)
    screen.drawLine(80, 29, 115, 34, COULEUR_METAL)
    screen.drawLine(115, 34, 136, 42, COULEUR_METAL)
    screen.drawLine(136, 42, 115, 50, COULEUR_METAL)
    screen.drawLine(115, 50, 80, 55, COULEUR_METAL)
    screen.drawLine(80, 55, 45, 50, COULEUR_METAL)
    screen.drawLine(45, 50, 24, 42, COULEUR_METAL)
    screen.fillRect(77, 12, 7, 60, COULEUR_OMBRE)
    screen.drawRect(77, 12, 7, 60, COULEUR_TEXTE)
    screen.drawLine(18, 107, 70, 59, COULEUR_CYAN)
    screen.drawLine(142, 107, 90, 59, COULEUR_CYAN)
    screen.drawLine(48, 107, 75, 62, COULEUR_BLEUE)
    screen.drawLine(112, 107, 85, 62, COULEUR_BLEUE)

    let couleurLumiere = Math.idiv(local, 140) % 2 == 0 ? COULEUR_JAUNE : COULEUR_CYAN
    screen.setPixel(24, 42, couleurLumiere)
    screen.setPixel(45, 34, couleurLumiere)
    screen.setPixel(115, 34, couleurLumiere)
    screen.setPixel(136, 42, couleurLumiere)
    screen.setPixel(80, 22, COULEUR_ROUGE)
    screen.setPixel(80, 62, COULEUR_VERTE)

    let progressionArrivee = Math.clamp(0, 1000, Math.idiv((local - 250) * 1000, 1900))
    let yVaisseau = 101 - Math.idiv(progressionArrivee * 36, 1000)
    dessinerVaisseauLancementIntro(80, yVaisseau, 6, 8, 5)
    if (local >= 750 && local < 1500) {
        screen.fillRect(38, 79, 84, 12, COULEUR_FOND)
        legendeIntro(Textes.t(504), 81, COULEUR_JAUNE)
    } else if (local >= 1500) {
        screen.fillRect(20, 93, 120, 10, COULEUR_FOND)
        legendeIntro(Textes.t(505), 96, COULEUR_TEXTE)
    }
}

function dessinerRevelationTitreIntro(local: number): void {
    if (local < 90) {
        screen.fill(COULEUR_TEXTE)
        return
    }
    if (local < 170) {
        screen.fill(COULEUR_CYAN)
        return
    }

    if (local >= 2300) {
        dessinerTitre()
        return
    }

    // À partir d'ici, le champ d'étoiles et le logo utilisent exactement les coordonnées de l'écran titre.
    screen.fill(COULEUR_FOND)
    for (let i = 0; i < 22; i++) {
        let x = hasardFixe(i, 3, 9) % 160
        let y = hasardFixe(i, 7, 2) % 105
        screen.setPixel(x, y, i % 4 == 0 ? COULEUR_CYAN : COULEUR_ATTENUEE)
    }
    if (local < 500) {
        let anneauDistorsion = Math.max(2, 37 - Math.idiv((local - 170) * 35, 330))
        screen.drawCircle(80, 57, anneauDistorsion, COULEUR_CYAN)
        if (anneauDistorsion > 5) screen.drawCircle(80, 57, anneauDistorsion - 3, COULEUR_BLEUE)
    }
    let ligneMoitie = Math.clamp(0, 58, Math.idiv((local - 180) * 58, 520))
    screen.drawLine(80 - ligneMoitie, 35, 80 + ligneMoitie, 35, COULEUR_CYAN)
    screen.drawLine(80 - ligneMoitie, 70, 80 + ligneMoitie, 70, COULEUR_CYAN)

    if (local >= 330) ecrireTexteJeu("CALLIOPE HACKER", 35, 11, COULEUR_VERTE)
    if (local >= 500) {
        dessinerTitreJeu(41, 14)
        screen.drawLine(68, 78, 80, 72, COULEUR_VERTE)
        screen.drawLine(80, 72, 92, 78, COULEUR_VERTE)
        screen.drawLine(92, 78, 80, 84, COULEUR_VERTE)
        screen.drawLine(80, 84, 68, 78, COULEUR_VERTE)
    }
    if (local >= 1180 && local < 2100) legendeIntro(Textes.t(506), 89, COULEUR_TEXTE)
    if (local >= 1750 && local < 2100) legendeIntro(Textes.t(507), 99, COULEUR_JAUNE)
}

function dessinerIntro(): void {
    let tempsEcoule = tempsIntroEcoule()
    if (tempsEcoule < INTRO_CARTON_FIN_MS) dessinerCartonIntro(tempsEcoule)
    else if (tempsEcoule < INTRO_PROLOGUE_FIN_MS) dessinerPrologueIntro(tempsEcoule - INTRO_CARTON_FIN_MS)
    else if (tempsEcoule < INTRO_HANGAR_FIN_MS) dessinerHangarIntro(tempsEcoule - INTRO_PROLOGUE_FIN_MS)
    else if (tempsEcoule < INTRO_ORBITE_FIN_MS) dessinerOrbiteIntro(tempsEcoule - INTRO_HANGAR_FIN_MS)
    else if (tempsEcoule < INTRO_COMBAT_FIN_MS) dessinerCombatIntro(tempsEcoule - INTRO_ORBITE_FIN_MS)
    else if (tempsEcoule < INTRO_DISTORSION_FIN_MS) dessinerHypersautIntro(tempsEcoule - INTRO_COMBAT_FIN_MS)
    else if (tempsEcoule < INTRO_ARRIVEE_FIN_MS) dessinerArriveeIntro(tempsEcoule - INTRO_DISTORSION_FIN_MS)
    else dessinerRevelationTitreIntro(tempsEcoule - INTRO_ARRIVEE_FIN_MS)
    // L'indication pour passer suit le temps de lecture ; elle reste donc affichée quand le carton-titre commence.
    if (tempsEcoule < INTRO_ARRIVEE_FIN_MS + 2300) dessinerBandesIntro(tempsLectureIntro())
}

function legendeIntro(texte: string, y: number, couleur: number): void {
    ecrireTexteJeu(texte, Math.max(2, Math.idiv(160 - texte.length * 6, 2)), y, couleur)
}
