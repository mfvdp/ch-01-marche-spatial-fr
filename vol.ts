// Le vol entre deux mondes : phases, rencontres, combats, sauvetage et amarrage.
let phaseVol = PhaseVol.Lancement
let debutPhaseMs = 0
let derniereActualisationVol = 0
let bouclierVol = 0
let xReticule = 80
let yReticule = 52
let armePreteMs = 0
let finFlashArmeMs = 0
let impactArme = false
let chaleurLaser = 0
let debutFuiteMs = 0
let ennemiActif = false
let typeEnnemi = 0
let xEnnemi = 80
let yEnnemi = 42
let vxEnnemi = 1
let vyEnnemi = 1
let tailleEnnemi = 10
let coqueEnnemi = 0
let ennemisRestants = 0
let deplacementEnnemiMs = 0
let prochaineAttaqueEnnemiMs = 0
let tirAttaqueMs = 0
let xAttaque = 0
let yAttaque = 0
let xCapsuleSauvetage = 80
let yCapsuleSauvetage = 43
let progressionTracteur = 0
let progressionAccostage = 0
let messageVol = ""
let retenueDeplacementReticule = 0
let retenueRefroidissementLaser = 0
let deriveSauvetageMs = 0
let pasDeriveSauvetage = 0
let sequenceAttaqueEnnemi = 0
let bouclierEnnemi = 0
let texteAstuce = ""
let finTexteAstuceMs = 0
let finFlashDegatsMs = 0
let sauvetageApresCombat = false
let pasSchemaEnnemi = 0
let rangVolAvant = 0

// Événements du vol. Leurs numéros ne servent que dans ce fichier. La sauvegarde ne retient que ce qu'un événement a
// changé, jamais une rencontre à moitié jouée.
const EVENEMENT_VOL_AUCUN = 0
const EVENEMENT_VOL_MARCHAND = 1
const EVENEMENT_VOL_DETRESSE = 2
const EVENEMENT_VOL_DOUANE = 3
const EVENEMENT_VOL_MINES = 4
const EVENEMENT_VOL_EPAVE = 5
const EVENEMENT_VOL_CONTREBANDIER = 6

let evenementVoyageVerifie = false
let typeEvenementVol = EVENEMENT_VOL_AUCUN
let evenementVolResolu = false
let resolutionEvenementVolMs = 0
let resultatEvenementVol = ""
let combatForceEvenement = false
let retenueEnergieArme = 0
let retenueEnergieBouclier = 0
let genreFormation = 0
let ailiersFormation = 0
let phaseBoss = 0
let coqueMaxBoss = 0
let coqueMemoriseeBoss = 0
let bouclierMemoriseBoss = 0
let renfortsBoss = 0
let attenteBoss = false
let xFaibleBoss = 80
let yFaibleBoss = 42
let finAstuceVolMs = 0

function lancerVoyage(): void {
    let cout = coutSaut(mondeActuel, mondeDestination)
    if (mondeDestination == mondeActuel || cout > coutSautMax() || cout > carburant) {
        sonErreur()
        afficherAvis(Textes.t(508), Textes.t(509), "", Scene.Hangar)
        return
    }
    if (sourceMission == 2 && etapeTutoriel == 2) {
        if (mondeDestination != 1) {
            sonErreur()
            afficherAvis(Textes.t(510), Textes.t(511), Textes.t(512), Scene.CarteStellaire)
            return
        }
        etapeTutoriel = 3
    }
    origineTransit = mondeActuel
    cibleTransit = mondeDestination
    graineTransit = hasardFixe(mondeActuel, mondeDestination, jourJeu + sequenceSauvegarde)
    carburant -= cout
    enTransit = 1
    enregistrerSauvegarde()
    preparerVol()
    reglerScene(Scene.Vol)
}

function reprendreVoyage(): void {
    preparerVol()
    reglerScene(Scene.Vol)
}

function preparerVol(): void {
    phaseVol = PhaseVol.Lancement
    debutPhaseMs = game.runtime()
    derniereActualisationVol = debutPhaseMs
    bouclierVol = bouclierMax()
    xReticule = 80
    yReticule = 52
    armePreteMs = debutPhaseMs
    finFlashArmeMs = 0
    chaleurLaser = 0
    debutFuiteMs = 0
    ennemiActif = false
    ennemisRestants = 0
    tirAttaqueMs = 0
    progressionTracteur = 0
    progressionAccostage = 0
    messageVol = Textes.t(254)
    retenueDeplacementReticule = 0
    retenueRefroidissementLaser = 0
    deriveSauvetageMs = debutPhaseMs + 96
    pasDeriveSauvetage = 0
    sequenceAttaqueEnnemi = 0
    bouclierEnnemi = 0
    texteAstuce = ""
    finTexteAstuceMs = 0
    finFlashDegatsMs = 0
    sauvetageApresCombat = false
    pasSchemaEnnemi = 0
    rangVolAvant = rangActuel()
    evenementVoyageVerifie = false
    typeEvenementVol = EVENEMENT_VOL_AUCUN
    evenementVolResolu = false
    resolutionEvenementVolMs = 0
    resultatEvenementVol = ""
    combatForceEvenement = false
    retenueEnergieArme = 0
    retenueEnergieBouclier = 0
    genreFormation = 0
    ailiersFormation = 0
    phaseBoss = 0
    coqueMaxBoss = 0
    coqueMemoriseeBoss = 0
    bouclierMemoriseBoss = 0
    renfortsBoss = 0
    attenteBoss = false
    finAstuceVolMs = 0
    sonLancement()
}

function commencerCroisiere(): void {
    phaseVol = PhaseVol.Croisiere
    debutPhaseMs = game.runtime()
    messageVol = Textes.t(513) + NOMS_MONDES[cibleTransit]
    sonCroisiere()
}

function choisirRencontre(): void {
    if (!evenementVoyageVerifie) {
        evenementVoyageVerifie = true
        if (doitLancerEvenementVol()) {
            commencerEvenementVol()
            return
        }
    }
    // Le premier vol d'entraînement LUMA -> VEXO apprend à naviguer sans combat surprise.
    if (sourceMission == 2 && cibleMission == cibleTransit) {
        commencerApproche(true)
        return
    }
    if (genreMission == GenreMission.Sauvetage && cibleMission == cibleTransit && progressionMission == 0) {
        if (varianteMission == VarianteMission.SousFeu) {
            ennemisRestants = 1 + (modeJeu > 0 ? 1 : 0)
            sauvetageApresCombat = true
            commencerRencontreCombat(false)
        } else commencerRencontreSauvetage()
        return
    }
    if (genreMission == GenreMission.Chasse && cibleMission == cibleTransit &&
        progressionMission < quantiteMission) {
        ennemisRestants = quantiteMission - progressionMission
        commencerRencontreCombat(true)
        return
    }
    let dangerRoute = dangerMondeEffectif(cibleTransit)
    let chance = 12 + dangerRoute * 16 + modeJeu * 10
    if (genreMission == GenreMission.Livraison && varianteMission == VarianteMission.Illegal) chance += 25
    if (genreEvenementMarche == GenreEvenementMarche.Blocus && mondeEvenementMarche == cibleTransit &&
        jourJeu <= finEvenementMarche) chance += 25
    chance = Math.min(92, chance)
    if (graineTransit % 100 < chance) {
        ennemisRestants = 1 + hasardFixe(graineTransit, jourJeu, 4) % Math.max(1, dangerRoute + 1)
        commencerRencontreCombat(false)
    } else commencerApproche(true)
}

function doitLancerEvenementVol(): boolean {
    if (sourceMission == 2 || etapeTutoriel > 0 && etapeTutoriel < 4) return false
    let chance = 38 + dangerMondeEffectif(cibleTransit) * 5
    if (degatsModule[ModuleVaisseau.Scanner] >= 2) chance += 8
    if (cibleTransit >= NOMBRE_MONDES_PUBLICS) chance = 100
    return hasardFixe(graineTransit, jourJeu, 211) % 100 < chance
}

function commencerEvenementVol(): void {
    phaseVol = PhaseVol.Evenement
    debutPhaseMs = game.runtime()
    evenementVolResolu = false
    resultatEvenementVol = ""
    combatForceEvenement = false
    typeEvenementVol = 1 + hasardFixe(graineTransit, jourJeu, graineGalaxie + 223) % 6
    messageVol = titreEvenementVol()
    if (typeEvenementVol == EVENEMENT_VOL_DETRESSE || typeEvenementVol == EVENEMENT_VOL_MINES) sonAlarme()
    else if (typeEvenementVol == EVENEMENT_VOL_EPAVE) sonSignalSauvetage()
    else sonRencontre()
}

function factionEvenementVol(): Faction {
    if (typeEvenementVol == EVENEMENT_VOL_CONTREBANDIER) return Faction.Corsaires
    return factionMonde(cibleTransit)
}

function titreEvenementVol(): string {
    if (typeEvenementVol == EVENEMENT_VOL_MARCHAND) return Textes.t(514)
    if (typeEvenementVol == EVENEMENT_VOL_DETRESSE) return Textes.t(515)
    if (typeEvenementVol == EVENEMENT_VOL_DOUANE) return Textes.t(516)
    if (typeEvenementVol == EVENEMENT_VOL_MINES) return Textes.t(517)
    if (typeEvenementVol == EVENEMENT_VOL_EPAVE) return Textes.t(518)
    if (typeEvenementVol == EVENEMENT_VOL_CONTREBANDIER) return Textes.t(519)
    return Textes.t(520)
}

function infoEvenementVol(): string {
    if (typeEvenementVol == EVENEMENT_VOL_MARCHAND) return Textes.t(521)
    if (typeEvenementVol == EVENEMENT_VOL_DETRESSE) return Textes.t(522)
    if (typeEvenementVol == EVENEMENT_VOL_DOUANE) return Textes.t(523)
    if (typeEvenementVol == EVENEMENT_VOL_MINES) return Textes.t(524)
    if (typeEvenementVol == EVENEMENT_VOL_EPAVE) return Textes.t(525)
    return Textes.t(526)
}

function etiquetteAcceptationEvenementVol(): string {
    if (typeEvenementVol == EVENEMENT_VOL_MARCHAND) return Textes.t(527)
    if (typeEvenementVol == EVENEMENT_VOL_DETRESSE) return Textes.t(528)
    if (typeEvenementVol == EVENEMENT_VOL_DOUANE) return Textes.t(529)
    if (typeEvenementVol == EVENEMENT_VOL_MINES) return Textes.t(530)
    if (typeEvenementVol == EVENEMENT_VOL_EPAVE) return Textes.t(531)
    return Textes.t(532)
}

function etiquetteRefusEvenementVol(): string {
    if (typeEvenementVol == EVENEMENT_VOL_DOUANE) return Textes.t(533)
    if (typeEvenementVol == EVENEMENT_VOL_MINES) return Textes.t(534)
    return Textes.t(535)
}

function finirEvenementVol(resultat: string): void {
    resultatEvenementVol = resultat
    evenementVolResolu = true
    resolutionEvenementVolMs = game.runtime()
    noterEvenement()
    actualiserSucces()
}

function resoudreEvenementVol(accepte: boolean): void {
    if (phaseVol != PhaseVol.Evenement || evenementVolResolu) return
    let tirage = hasardFixe(graineTransit, typeEvenementVol, jourJeu + 239) % 100
    if (typeEvenementVol == EVENEMENT_VOL_MARCHAND) {
        if (accepte && credits >= 45) {
            credits -= 45
            carburant = Math.min(carburantMax(), carburant + 2)
            coque = Math.min(coqueMax(), coque + 2)
            ajusterReputation(Faction.Guilde, 1)
            sonAchat()
            finirEvenementVol(Textes.t(536))
        } else finirEvenementVol(accepte ? Textes.t(440) : Textes.t(537))
    } else if (typeEvenementVol == EVENEMENT_VOL_DETRESSE) {
        if (accepte) {
            let recompense = 55 + dangerMondeEffectif(cibleTransit) * 15
            credits += recompense
            noterSauvetage()
            ajusterReputation(Faction.Union, 3)
            if (tirage < 18 && ajouterArtefact(hasardFixe(graineTransit, jourJeu, 241) % NOMBRE_ARTEFACTS))
                finirEvenementVol(Textes.t(538))
            else finirEvenementVol(Textes.t(539) + recompense + Textes.t(319))
            sonSauvetageReussi()
        } else {
            ajusterReputation(Faction.Union, -2)
            finirEvenementVol(Textes.t(540))
        }
    } else if (typeEvenementVol == EVENEMENT_VOL_DOUANE) {
        if (accepte) {
            if (genreMission == GenreMission.Livraison && varianteMission == VarianteMission.Illegal) {
                let amende = Math.min(credits, 80 + dangerMondeEffectif(cibleTransit) * 25)
                credits -= amende
                progressionMission = Math.max(1, progressionMission)
                ajusterReputation(Faction.Union, -3)
                sonErreur()
                finirEvenementVol(Textes.t(541) + amende + Textes.t(319))
            } else {
                ajusterReputation(Faction.Union, 1)
                sonConfirmation()
                finirEvenementVol(Textes.t(542))
            }
        } else {
            ajusterReputation(Faction.Union, -5)
            ajusterReputation(Faction.Corsaires, 2)
            combatForceEvenement = true
            sonAlarme()
            finirEvenementVol(Textes.t(543))
        }
    } else if (typeEvenementVol == EVENEMENT_VOL_MINES) {
        if (!accepte && utiliserMine()) {
            sonExplosion()
            finirEvenementVol(Textes.t(544))
        } else {
            let sansDegat = tirage < 58 + ameliorations[AMELIORATION_SCANNER] * 12 -
                degatsModule[ModuleVaisseau.Scanner] * 14
            if (!sansDegat) {
                sonAlarme()
                endommagerJoueur(1 + Math.idiv(dangerMondeEffectif(cibleTransit), 2))
                if (sceneActive != Scene.Vol) return
                endommagerModule(ModuleVaisseau.Moteur, 1)
                finirEvenementVol(Textes.t(545))
            } else finirEvenementVol(accepte ? Textes.t(546) : Textes.t(547))
        }
    } else if (typeEvenementVol == EVENEMENT_VOL_EPAVE) {
        if (accepte) {
            let artefact = hasardFixe(graineTransit, graineGalaxie, jourJeu + 251) % NOMBRE_ARTEFACTS
            if (tirage < 34 && ajouterArtefact(artefact)) {
                ajusterReputation(Faction.Conseil, 3)
                sonMission()
                finirEvenementVol(Textes.t(548))
            } else if (ajouterFretRare(hasardFixe(graineTransit, tirage, 257) % NOMBRE_FRETS_RARES, 1)) {
                finirEvenementVol(Textes.t(549))
            } else {
                credits += 35
                finirEvenementVol(Textes.t(550))
            }
        } else finirEvenementVol(Textes.t(551))
    } else if (typeEvenementVol == EVENEMENT_VOL_CONTREBANDIER) {
        if (accepte && credits >= 90 &&
            ajouterFretRare(hasardFixe(graineTransit, jourJeu, 263) % NOMBRE_FRETS_RARES, 1)) {
            credits -= 90
            ajusterReputation(Faction.Corsaires, 4)
            ajusterReputation(Faction.Guilde, -1)
            sonAchat()
            finirEvenementVol(Textes.t(552))
        } else {
            if (!accepte) ajusterReputation(Faction.Union, 1)
            finirEvenementVol(accepte ? Textes.t(553) : Textes.t(554))
        }
    }
}

function quitterEvenementVol(): void {
    typeEvenementVol = EVENEMENT_VOL_AUCUN
    if (combatForceEvenement) {
        ennemisRestants = 1 + modeJeu
        commencerRencontreCombat(false)
    } else choisirRencontre()
}

function commencerRencontreCombat(chasse: boolean): void {
    phaseVol = PhaseVol.Rencontre
    debutPhaseMs = game.runtime()
    messageVol = chasse ? Textes.t(555) : (sauvetageApresCombat ? Textes.t(556) : Textes.t(557))
    sonRencontre()
    creerEnnemi(chasse)
}

function creerEnnemi(chasse: boolean): void {
    let instant = game.runtime()
    ennemiActif = true
    if (chasse && sourceMission == 1 && etapeCampagne >= 5 && ennemisRestants == 1) typeEnnemi = 4
    else if (chasse && varianteMission == VarianteMission.As) typeEnnemi = 3
    else if (chasse && varianteMission == VarianteMission.SousFeu) typeEnnemi = 2
    else if (chasse) typeEnnemi = hasardFixe(graineMission, ennemisRestants, totalVictoires + 19) % 3
    else if (genreEvenementMarche == GenreEvenementMarche.Blocus && mondeEvenementMarche == cibleTransit &&
        jourJeu <= finEvenementMarche) typeEnnemi = 4
    else typeEnnemi = hasardFixe(graineTransit, ennemisRestants, totalVictoires) % 3
    xEnnemi = 35 + hasardFixe(graineTransit, ennemisRestants, 8) % 90
    yEnnemi = 24 + hasardFixe(graineTransit, ennemisRestants, 9) % 35
    vxEnnemi = hasardFixe(graineTransit, ennemisRestants, 10) % 2 == 0 ? -1 : 1
    vyEnnemi = hasardFixe(graineTransit, ennemisRestants, 11) % 2 == 0 ? -1 : 1
    let danger = dangerMondeEffectif(cibleTransit)
    tailleEnnemi = 8 + danger * 2 + Math.min(4, typeEnnemi)
    coqueEnnemi = 2 + danger + typeEnnemi + (chasse ? 2 : 0) + modeJeu
    if (typeEnnemi == 4) coqueEnnemi += 5 + modeJeu * 2
    bouclierEnnemi = typeEnnemi == 2 ? 2 + danger
        : (typeEnnemi == 3 ? 3 + danger : (typeEnnemi == 4 ? 5 + danger : 0))
    genreFormation = typeEnnemi >= 3 ? 0 : hasardFixe(graineTransit, ennemisRestants, 301) % 3
    ailiersFormation = genreFormation == 1 ? 2 : (genreFormation == 2 ? 1 : 0)
    if (typeEnnemi == 4) {
        phaseBoss = 1
        coqueMaxBoss = coqueEnnemi
        attenteBoss = false
        renfortsBoss = 0
    }
    pasSchemaEnnemi = 0
    deplacementEnnemiMs = instant + attenteDeplacementEnnemi()
    prochaineAttaqueEnnemiMs = instant + 1000 + hasardFixe(graineTransit, ennemisRestants, 12) % 600
    tirAttaqueMs = 0
    messageVol = nomTypeEnnemi(typeEnnemi)
}

function actualiserPointFaibleBoss(): void {
    if (phaseBoss == 1) {
        xFaibleBoss = xEnnemi - Math.idiv(tailleEnnemi, 2)
        yFaibleBoss = yEnnemi
    } else if (phaseBoss == 2) {
        xFaibleBoss = xEnnemi + Math.idiv(tailleEnnemi, 2)
        yFaibleBoss = yEnnemi - 2
    } else {
        xFaibleBoss = xEnnemi
        yFaibleBoss = yEnnemi + Math.idiv(tailleEnnemi, 3)
    }
}

function creerRenfortBoss(): void {
    let instant = game.runtime()
    ennemiActif = true
    typeEnnemi = renfortsBoss % 2 == 0 ? 2 : 0
    tailleEnnemi = typeEnnemi == 2 ? 10 : 8
    coqueEnnemi = 3 + dangerMondeEffectif(cibleTransit) + modeJeu
    bouclierEnnemi = typeEnnemi == 2 ? 2 : 0
    xEnnemi = renfortsBoss % 2 == 0 ? 38 : 122
    yEnnemi = 30 + renfortsBoss * 7
    vxEnnemi = xEnnemi < 80 ? 1 : -1
    vyEnnemi = 1
    pasSchemaEnnemi = 0
    deplacementEnnemiMs = instant + attenteDeplacementEnnemi()
    prochaineAttaqueEnnemiMs = instant + 850
    tirAttaqueMs = 0
    genreFormation = 1
    ailiersFormation = 0
    messageVol = Textes.t(558)
    sonAlarme()
}

function lancerRenfortsBoss(quantite: number): void {
    coqueMemoriseeBoss = coqueEnnemi
    bouclierMemoriseBoss = bouclierEnnemi
    renfortsBoss = quantite
    attenteBoss = true
    creerRenfortBoss()
}

function restaurerBossApresRenforts(): void {
    let instant = game.runtime()
    attenteBoss = false
    ennemiActif = true
    typeEnnemi = 4
    tailleEnnemi = 14 + dangerMondeEffectif(cibleTransit)
    coqueEnnemi = coqueMemoriseeBoss
    bouclierEnnemi = bouclierMemoriseBoss + phaseBoss
    xEnnemi = 80
    yEnnemi = 40
    vxEnnemi = phaseBoss >= 3 ? 2 : 1
    vyEnnemi = 1
    pasSchemaEnnemi = 0
    deplacementEnnemiMs = instant + attenteDeplacementEnnemi()
    prochaineAttaqueEnnemiMs = instant + 900
    tirAttaqueMs = 0
    genreFormation = 0
    ailiersFormation = 0
    messageVol = Textes.t(559) + phaseBoss
    sonRencontre()
}

function verifierPhaseBoss(): void {
    if (typeEnnemi != 4 || attenteBoss || coqueEnnemi <= 0) return
    if (phaseBoss == 1 && coqueEnnemi * 3 <= coqueMaxBoss * 2) {
        phaseBoss = 2
        lancerRenfortsBoss(2 + modeJeu)
    } else if (phaseBoss == 2 && coqueEnnemi * 3 <= coqueMaxBoss) {
        phaseBoss = 3
        lancerRenfortsBoss(1 + modeJeu)
    }
}

function nomTypeEnnemi(type: number): string {
    if (type == 0) return Textes.t(560)
    if (type == 1) return Textes.t(561)
    if (type == 2) return Textes.t(562)
    if (type == 3) return Textes.t(563)
    return Textes.t(564)
}

function attenteDeplacementEnnemi(): number {
    if (typeEnnemi == 0) return 34
    if (typeEnnemi == 1) return 42
    if (typeEnnemi == 2) return 72
    if (typeEnnemi == 3) return 30
    return 82
}

function commencerRencontreSauvetage(): void {
    phaseVol = PhaseVol.Rencontre
    debutPhaseMs = game.runtime()
    messageVol = Textes.t(500)
    ennemiActif = false
    xCapsuleSauvetage = 42 + hasardFixe(graineTransit, graineMission, 2) % 77
    yCapsuleSauvetage = 27 + hasardFixe(graineTransit, graineMission, 3) % 35
    progressionTracteur = 0
    sonSignalSauvetage()
}

function commencerApproche(avecRepere: boolean): void {
    phaseVol = PhaseVol.Approche
    debutPhaseMs = game.runtime()
    ennemiActif = false
    tirAttaqueMs = 0
    debutFuiteMs = 0
    progressionAccostage = 0
    messageVol = Textes.t(565)
    if (avecRepere) sonApproche()
}

function actualiserReticule(dt: number): void {
    let enMouvement = controller.left.isPressed() || controller.right.isPressed() || controller.up.isPressed() ||
        controller.down.isPressed()
    if (!enMouvement) {
        retenueDeplacementReticule = 0
        return
    }
    let vitesseParSeconde = controller.B.isPressed() ? 94 : 63
    if (modeEnergie == 3) vitesseParSeconde += 24
    vitesseParSeconde = Math.max(28, vitesseParSeconde - degatsModule[ModuleVaisseau.Moteur] * 11)
    retenueDeplacementReticule += dt * vitesseParSeconde
    let pas = Math.idiv(retenueDeplacementReticule, 1000)
    retenueDeplacementReticule %= 1000
    if (pas <= 0) return
    if (controller.left.isPressed()) xReticule -= pas
    if (controller.right.isPressed()) xReticule += pas
    if (controller.up.isPressed()) yReticule -= pas
    if (controller.down.isPressed()) yReticule += pas
    xReticule = Math.clamp(12, 148, xReticule)
    yReticule = Math.clamp(17, 82, yReticule)
}

function actualiserEnergieVol(dt: number): void {
    let tauxEnergie = modeEnergie == 2 ? 15 : (modeEnergie == 1 ? 6 : 9)
    tauxEnergie = Math.max(2, tauxEnergie - degatsModule[ModuleVaisseau.Armes] * 2)
    retenueEnergieArme += dt * tauxEnergie
    while (retenueEnergieArme >= 1000) {
        restaurerEnergieArme(1)
        retenueEnergieArme -= 1000
    }
    if (phaseVol == PhaseVol.Rencontre && bouclierVol < bouclierMax()) {
        let tauxBouclier = modeEnergie == 1 ? 3 : 1
        retenueEnergieBouclier += dt * tauxBouclier
        let pasBouclier = modeEnergie == 1 ? 1800 : 3600
        if (retenueEnergieBouclier >= pasBouclier) {
            bouclierVol++
            retenueEnergieBouclier = 0
        }
    } else retenueEnergieBouclier = 0
}

function actualiserVol(): void {
    if (sceneActive != Scene.Vol) return
    let instant = game.runtime()
    if (instant - derniereActualisationVol < 32) return
    let dt = Math.min(80, instant - derniereActualisationVol)
    derniereActualisationVol = instant
    actualiserReticule(dt)
    actualiserEnergieVol(dt)
    if (chaleurLaser > 0) {
        retenueRefroidissementLaser += dt
        let pasRefroidissement = modeEnergie == 2 ? 85 : 120
        while (retenueRefroidissementLaser >= pasRefroidissement && chaleurLaser > 0) {
            chaleurLaser--
            retenueRefroidissementLaser -= pasRefroidissement
        }
    } else retenueRefroidissementLaser = 0
    if (phaseVol == PhaseVol.Lancement) {
        if (instant - debutPhaseMs > 1700) commencerCroisiere()
    } else if (phaseVol == PhaseVol.Croisiere) {
        if (instant - debutPhaseMs > 2500) choisirRencontre()
    } else if (phaseVol == PhaseVol.Evenement) {
        if (evenementVolResolu && instant - resolutionEvenementVolMs > 1150) quitterEvenementVol()
    } else if (phaseVol == PhaseVol.Rencontre) {
        if (genreMission == GenreMission.Sauvetage && cibleMission == cibleTransit && progressionMission == 0 &&
            !ennemiActif && !sauvetageApresCombat) actualiserTracteur(instant, dt)
        else actualiserCombat(instant)
        if (sceneActive != Scene.Vol) return
        actualiserFuite(instant)
    } else if (phaseVol == PhaseVol.Approche) {
        actualiserAccostage(instant, dt)
    }
}

function actualiserCombat(instant: number): void {
    if (!ennemiActif) return
    let pasDeplacement = 0
    while (instant >= deplacementEnnemiMs && pasDeplacement < 4) {
        let vitesse = typeEnnemi == 0 || typeEnnemi == 3 ? 2 : 1
        if (typeEnnemi == 4 && phaseBoss >= 3) vitesse = 2
        xEnnemi += vxEnnemi * vitesse
        yEnnemi += vyEnnemi
        pasSchemaEnnemi++
        if (typeEnnemi == 1 && pasSchemaEnnemi % 9 == 0) vyEnnemi = 0 - vyEnnemi
        if (typeEnnemi == 3 && pasSchemaEnnemi % 13 == 0) vxEnnemi = 0 - vxEnnemi
        if (xEnnemi < 24 || xEnnemi > 136) vxEnnemi = 0 - vxEnnemi
        if (yEnnemi < 20 || yEnnemi > 70) vyEnnemi = 0 - vyEnnemi
        deplacementEnnemiMs += attenteDeplacementEnnemi()
        pasDeplacement++
    }
    if (typeEnnemi == 4) actualiserPointFaibleBoss()
    if (pasDeplacement >= 4 && instant >= deplacementEnnemiMs)
        deplacementEnnemiMs = instant + attenteDeplacementEnnemi()
    if (tirAttaqueMs == 0 && instant >= prochaineAttaqueEnnemiMs) {
        xAttaque = xReticule
        yAttaque = yReticule
        tirAttaqueMs = instant + (typeEnnemi == 3 ? 470 : (typeEnnemi == 2 || typeEnnemi == 4 ? 760 : 620))
        sequenceAttaqueEnnemi++
        sonVerrouillageEnnemi()
    } else if (tirAttaqueMs > 0 && instant >= tirAttaqueMs) {
        if (Math.abs(xReticule - xAttaque) < 13 && Math.abs(yReticule - yAttaque) < 13) {
            let degats = 1 + (typeEnnemi >= 2 ? 1 : 0) + (typeEnnemi == 4 ? 1 : 0) + (modeJeu == 2 ? 1 : 0)
            if (ailiersFormation > 0) degats++
            endommagerJoueur(degats)
            if (sceneActive != Scene.Vol) return
        }
        tirAttaqueMs = 0
        prochaineAttaqueEnnemiMs = instant + 820 +
            hasardFixe(graineTransit, sequenceAttaqueEnnemi, ennemisRestants + 31) % 720
    }
}

function actualiserTracteur(instant: number, dt: number): void {
    let pasDerive = 0
    while (instant >= deriveSauvetageMs && pasDerive < 3) {
        xCapsuleSauvetage += hasardFixe(graineTransit, pasDeriveSauvetage, 5) % 3 - 1
        yCapsuleSauvetage += hasardFixe(graineTransit, pasDeriveSauvetage, 6) % 3 - 1
        pasDeriveSauvetage++
        deriveSauvetageMs += 96
        pasDerive++
    }
    if (pasDerive >= 3 && instant >= deriveSauvetageMs) deriveSauvetageMs = instant + 96
    xCapsuleSauvetage = Math.clamp(24, 136, xCapsuleSauvetage)
    yCapsuleSauvetage = Math.clamp(22, 70, yCapsuleSauvetage)
    let estDansPortee = Math.abs(xReticule - xCapsuleSauvetage) <= 11 && Math.abs(yReticule - yCapsuleSauvetage) <= 11
    if (controller.A.isPressed() && estDansPortee) progressionTracteur += dt
    else progressionTracteur = Math.max(0, progressionTracteur - dt * 2)
    if (progressionTracteur >= 900) {
        progressionMission = 1
        sonSauvetageReussi()
        commencerApproche(false)
    }
}

function actualiserFuite(instant: number): void {
    if (phaseVol != PhaseVol.Rencontre) return
    if (controller.B.isPressed() && carburant > 0) {
        if (debutFuiteMs == 0) debutFuiteMs = instant
        if (instant - debutFuiteMs >= tempsChargeFuite()) {
            carburant--
            messageVol = Textes.t(566)
            sonFuite()
            commencerApproche(false)
        }
    } else debutFuiteMs = 0
}

function actualiserAccostage(instant: number, dt: number): void {
    let xPortail = 80 + Math.round(Math.sin((instant - debutPhaseMs) / 700) * 12)
    let yPortail = 46
    if (Math.abs(xReticule - xPortail) < 9 && Math.abs(yReticule - yPortail) < 9) progressionAccostage += dt
    else progressionAccostage = Math.max(0, progressionAccostage - dt * 2)
    if (progressionAccostage >= 900 && instant - debutPhaseMs > 1200) finirAccostage()
}

function tirerArmePrincipale(): void {
    if (sceneActive != Scene.Vol || entreeVerrouillee) return
    let instant = game.runtime()
    if (phaseVol == PhaseVol.Evenement) {
        resoudreEvenementVol(true)
        return
    }
    if (phaseVol != PhaseVol.Rencontre) return
    if (genreMission == GenreMission.Sauvetage && cibleMission == cibleTransit && progressionMission == 0 &&
        !ennemiActif) return
    if (instant < armePreteMs || !ennemiActif || degatsModule[ModuleVaisseau.Armes] >= 3) {
        if (degatsModule[ModuleVaisseau.Armes] >= 3) afficherAstuceVol(Textes.t(567))
        return
    }
    // Si le râtelier de missiles ou de mines est vide, l'arme repasse au laser, pour que A tire toujours quelque chose.
    if (armeActive == GenreArme.Missile && missiles <= 0 ||
        armeActive == GenreArme.Mine && mines <= 0) {
        armeActive = GenreArme.Laser
        afficherAstuceVol(Textes.t(580) + nomArme(armeActive))
    }
    if (armeActive == GenreArme.Missile) tirerMissile(instant)
    else if (armeActive == GenreArme.Mine) tirerMine(instant)
    else tirerLaser(instant)
}

function afficherAstuceVol(message: string): void {
    texteAstuce = message
    finTexteAstuceMs = game.runtime() + 900
    finAstuceVolMs = finTexteAstuceMs
}

function tirerLaser(instant: number): void {
    if (chaleurLaser >= 10 || energieArme < 7) {
        sonErreur()
        afficherAstuceVol(chaleurLaser >= 10 ? Textes.t(568) : Textes.t(569))
        return
    }
    armePreteMs = instant + refroidissementLaser()
    finFlashArmeMs = instant + 90
    chaleurLaser = Math.min(10, chaleurLaser + 3)
    energieArme -= 7
    impactArme = Math.abs(xReticule - xEnnemi) <= tailleEnnemi && Math.abs(yReticule - yEnnemi) <= tailleEnnemi
    sonLaser(impactArme)
    if (impactArme) {
        appliquerDegatsEnnemi(degatsLaser(), false)
    }
}

function tirerMissile(instant: number): void {
    if (!utiliserMissile()) {
        sonErreur()
        afficherAstuceVol(missiles <= 0 ? Textes.t(570) : Textes.t(571))
        return
    }
    armePreteMs = instant + 720
    finFlashArmeMs = instant + 180
    impactArme = Math.abs(xReticule - xEnnemi) <= tailleEnnemi + 18 &&
        Math.abs(yReticule - yEnnemi) <= tailleEnnemi + 18
    sonLaser(impactArme)
    if (impactArme) appliquerDegatsEnnemi(5 + ameliorations[AMELIORATION_LASER], true)
}

function tirerMine(instant: number): void {
    if (!utiliserMine()) {
        sonErreur()
        afficherAstuceVol(mines <= 0 ? Textes.t(572) : Textes.t(573))
        return
    }
    armePreteMs = instant + 900
    finFlashArmeMs = instant + 220
    impactArme = true
    tirAttaqueMs = 0
    prochaineAttaqueEnnemiMs = instant + 1500
    sonExplosion()
    if (ailiersFormation > 0) {
        totalVictoires += ailiersFormation
        ailiersFormation = 0
        afficherAstuceVol(Textes.t(574))
    }
    appliquerDegatsEnnemi(3 + ameliorations[AMELIORATION_LASER], false)
}

function appliquerDegatsEnnemi(quantite: number, armePrecision: boolean): void {
    let instant = game.runtime()
    if (ailiersFormation > 0) {
        ailiersFormation--
        totalVictoires++
        credits += 12
        sonExplosion()
        afficherAstuceVol(Textes.t(575))
        actualiserSucces()
        return
    }
    if (typeEnnemi == 4) {
        actualiserPointFaibleBoss()
        let impactPointFaible = armePrecision ||
            Math.abs(xReticule - xFaibleBoss) <= 8 && Math.abs(yReticule - yFaibleBoss) <= 8
        if (!impactPointFaible) {
            quantite = Math.max(1, Math.idiv(quantite, 3))
            afficherAstuceVol(Textes.t(576))
        } else afficherAstuceVol(Textes.t(577))
    }
    if (bouclierEnnemi > 0) {
        let absorbe = Math.min(bouclierEnnemi, quantite)
        bouclierEnnemi -= absorbe
        quantite -= absorbe
        texteAstuce = Textes.t(578) + absorbe
        finTexteAstuceMs = instant + 650
    }
    coqueEnnemi -= quantite
    if (coqueEnnemi <= 0) vaincreEnnemi()
    else verifierPhaseBoss()
}

function tirerArmeSecondaire(): void {
    if (sceneActive != Scene.Vol || entreeVerrouillee) return
    if (phaseVol == PhaseVol.Evenement) {
        resoudreEvenementVol(false)
        return
    }
    if (controller.left.isPressed()) {
        parcourirModeEnergie(-1)
        sonNavigation()
        afficherAstuceVol(Textes.t(579) + nomModeEnergie())
    } else if (controller.right.isPressed()) {
        parcourirModeEnergie(1)
        sonNavigation()
        afficherAstuceVol(Textes.t(579) + nomModeEnergie())
    } else {
        parcourirArme(1)
        sonNavigation()
        afficherAstuceVol(Textes.t(580) + nomArme(armeActive))
    }
}

function vaincreEnnemi(): void {
    ennemiActif = false
    tirAttaqueMs = 0
    totalVictoires++
    let prime = 18 + dangerMondeEffectif(cibleTransit) * 12 + typeEnnemi * 7
    if (modeJeu > 0) prime += Math.idiv(prime * modeJeu, 4)
    credits += prime
    if (attenteBoss) {
        renfortsBoss--
        sonExplosion()
        actualiserSucces()
        if (renfortsBoss > 0) creerRenfortBoss()
        else restaurerBossApresRenforts()
        return
    }
    ennemisRestants--
    if (genreMission == GenreMission.Chasse && cibleMission == cibleTransit) progressionMission++
    if (typeEnnemi == 4) {
        victoiresBoss++
        ajusterReputation(Faction.Union, 5)
        ajouterArtefact(hasardFixe(graineTransit, jourJeu, victoiresBoss + 313) % NOMBRE_ARTEFACTS)
    }
    accorderRecuperation()
    sonExplosion()
    ailiersFormation = 0
    actualiserSucces()
    if (ennemisRestants > 0) creerEnnemi(genreMission == GenreMission.Chasse && cibleMission == cibleTransit)
    else if (sauvetageApresCombat) {
        sauvetageApresCombat = false
        commencerRencontreSauvetage()
    } else commencerApproche(false)
}

function accorderRecuperation(): void {
    let tirage = hasardFixe(graineTransit, totalVictoires, typeEnnemi + ennemisRestants * 7) % 100
    let chance = 32 + (roleVaisseau == RoleVaisseau.Marchand ? 23 : 0) + ameliorations[AMELIORATION_SCANNER] * 8
    if (typeEnnemi >= 3 && tirage < 12 &&
        ajouterFretRare(hasardFixe(graineTransit, totalVictoires, 317) % NOMBRE_FRETS_RARES, 1)) {
        texteAstuce = Textes.t(581)
    } else if (unitesFret() < capaciteFret() && tirage < chance) {
        let marchandise = hasardFixe(graineTransit, totalVictoires, typeEnnemi + 73) % NOMBRE_MARCHANDISES
        fret[marchandise]++
        texteAstuce = Textes.t(582) + Textes.t(NOMS_MARCHANDISES[marchandise])
    } else {
        let ferraille = 6 + typeEnnemi * 3
        credits += ferraille
        texteAstuce = Textes.t(583) + ferraille + Textes.t(319)
    }
    finTexteAstuceMs = game.runtime() + 1200
}

function endommagerJoueur(quantite: number): boolean {
    let esquive = controller.B.isPressed() ? 50 : 0
    if (roleVaisseau == RoleVaisseau.Coursier) esquive += 15
    if (modeEnergie == 3) esquive += 18
    esquive -= degatsModule[ModuleVaisseau.Moteur] * 12
    if (hasardFixe(graineTransit, sequenceAttaqueEnnemi, xReticule) % 100 < esquive) {
        texteAstuce = Textes.t(584)
        finTexteAstuceMs = game.runtime() + 700
        return false
    }
    finFlashDegatsMs = game.runtime() + 180
    let coqueAvant = coque
    let bouclierAvant = bouclierVol
    if (modeEnergie == 1 && quantite > 1) quantite--
    while (quantite > 0 && bouclierVol > 0) {
        bouclierVol--
        quantite--
    }
    if (bouclierAvant > 0 && bouclierVol <= 0) sonRuptureBouclier()
    coque -= quantite
    if (coque < coqueAvant && genreMission == GenreMission.Livraison &&
        varianteMission == VarianteMission.Fragile)
        progressionMission = 1
    let fretCommerce = 0
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) fretCommerce += fret[i]
    if (coque < coqueAvant && typeEnnemi == 1 && fretCommerce > 0 &&
        hasardFixe(graineTransit, sequenceAttaqueEnnemi, 91) % 3 == 0) {
        retirerUnitesFret(1)
        texteAstuce = Textes.t(585)
        finTexteAstuceMs = game.runtime() + 900
    }
    if (coque < coqueAvant) {
        let tirageModule = hasardFixe(graineTransit, sequenceAttaqueEnnemi, coque + 331) % 100
        if (tirageModule < 24 + dangerMondeEffectif(cibleTransit) * 5) {
            let module = hasardFixe(graineTransit, sequenceAttaqueEnnemi, 337) % NOMBRE_MODULES_VAISSEAU
            endommagerModule(module, 1)
            texteAstuce = nomModuleCourt(module) + Textes.t(586)
            finTexteAstuceMs = game.runtime() + 1000
            if (module == ModuleVaisseau.Fret && unitesFret() > 0) retirerUnitesFret(1)
        }
    }
    sonDegats()
    if (coque <= 0) executerSauvetageAssure()
    return true
}

function nomModuleCourt(module: number): string {
    if (module == ModuleVaisseau.Moteur) return Textes.t(115)
    if (module == ModuleVaisseau.Scanner) return Textes.t(116)
    if (module == ModuleVaisseau.Armes) return Textes.t(117)
    return Textes.t(587)
}

function perteFretAssure(): number {
    let total = 0
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) total += fret[i]
    if (total <= 0) return 0
    let niveau = ameliorations[AMELIORATION_ASSURANCE]
    if (niveau >= 2) return 1
    if (niveau == 1) return Math.idiv(total + 5, 6)
    return Math.idiv(total + 2, 3)
}

function retirerUnitesFret(quantite: number): void {
    let curseur = graineTransit % NOMBRE_MARCHANDISES
    let retire = 0
    let controles = 0
    while (retire < quantite && controles < NOMBRE_MARCHANDISES * 20) {
        let marchandise = curseur % NOMBRE_MARCHANDISES
        if (fret[marchandise] > 0) {
            let anciennesUnites = fret[marchandise]
            let coutPar = Math.idiv(coutFret[marchandise], anciennesUnites)
            fret[marchandise]--
            coutFret[marchandise] = Math.max(0, coutFret[marchandise] - coutPar)
            if (fret[marchandise] == 0) coutFret[marchandise] = 0
            retire++
        }
        curseur += 5
        controles++
    }
}

function executerSauvetageAssure(): void {
    sonVaisseauDetruit()
    if (!chargerJeu()) {
        lancerNouvellePartie()
        afficherAvis(Textes.t(222), Textes.t(588), "", Scene.Hangar)
        return
    }
    let perdu = perteFretAssure()
    retirerUnitesFret(perdu)
    if (genreMission != GenreMission.Aucun) missionsEchouees++
    if (sourceMission == 2) etapeTutoriel = 1
    effacerMission()
    mondeActuel = origineTransit
    mondeDestination = mondeActuel
    enTransit = 0
    coque = coqueMax()
    carburant = Math.max(1, carburant)
    accorderCarburantUrgence()
    enregistrerSauvegarde()
    afficherAvis(Textes.t(589), Textes.t(590) + perdu, Textes.t(591), Scene.Hangar)
}

function finirAccostage(): void {
    let cibleFinaleRoute = nombreBondsRoute() > 0 ? mondeEtapeRoute(nombreBondsRoute()) : -1
    mondeActuel = cibleTransit
    mondeDestination = mondeActuel
    let routeContinue = false
    if (cibleFinaleRoute >= 0 && cibleFinaleRoute != mondeActuel && planifierRouteVers(cibleFinaleRoute) &&
        nombreBondsRoute() > 0) {
        mondeDestination = mondeEtapeRoute(1)
        routeContinue = true
    } else effacerRoutePrevue()
    enTransit = 0
    jourJeu++
    noterSaut()
    let recompensePayee = recompenseMission
    let resultat = resoudreMissionAuQuai()
    if (ameliorations[AMELIORATION_REPARATION] > 0) coque = Math.min(coqueMax(), coque + 1)
    if (ameliorations[AMELIORATION_REPARATION] > 0) reparerModules()
    else {
        for (let module = 0; module < NOMBRE_MODULES_VAISSEAU; module++) {
            if (degatsModule[module] > 0) degatsModule[module]--
        }
    }
    energieArme = 100
    let carburantUrgence = accorderCarburantUrgence()
    actualiserEvenementMarche()
    rafraichirMarche()
    retenirMarcheActuel()
    actualiserSucces()
    enregistrerSauvegarde()
    if (resultat == 2) {
        sonMission()
        afficherAvis(Textes.t(592), "+" + recompensePayee + Textes.t(593), Textes.t(594), Scene.Hangar)
    } else if (resultat == 4) {
        sonMission()
        afficherAvis(Textes.t(595), Textes.t(596), Textes.t(317) + nomRang(), Scene.Hangar)
    } else if (resultat == 3) {
        sonMission()
        afficherAvis(Textes.t(597), "+" + recompensePayee + Textes.t(593),
            Textes.t(389) + etapeCampagne + "/6", Scene.Hangar)
    } else if (resultat == 1) {
        sonMission()
        let ligneRang = rangActuel() > rangVolAvant ? Textes.t(598) + nomRang() : Textes.t(599)
        afficherAvis(Textes.t(600), "+" + recompensePayee + Textes.t(593), ligneRang, Scene.Hangar)
    } else if (resultat == -1) {
        sonErreur()
        afficherAvis(Textes.t(601), Textes.t(602), Textes.t(599), Scene.Hangar)
    } else if (resultat == -2) {
        sonErreur()
        afficherAvis(Textes.t(603), Textes.t(604), Textes.t(599), Scene.Hangar)
    } else {
        sonQuai()
        let ligneQuai = carburantUrgence ? Textes.t(605)
            : (routeContinue ? Textes.t(606) + NOMS_MONDES[cibleFinaleRoute] : Textes.t(607))
        afficherAvis(Textes.t(608) + NOMS_MONDES[mondeActuel], ligneQuai, Textes.t(599), Scene.Hangar)
    }
}

function accorderCarburantUrgence(): boolean {
    let minimum = Math.min(2, carburantMax())
    let necessaire = minimum - carburant
    if (necessaire > 0 && credits < necessaire * 8) {
        carburant = minimum
        return true
    }
    return false
}

function resoudreMissionAuQuai(): number {
    if (genreMission == GenreMission.Aucun) return 0
    if (jourJeu > echeanceMission) {
        missionsEchouees++
        if (sourceMission == 2) etapeTutoriel = 1
        effacerMission()
        return -1
    }
    let accomplie = false
    if (mondeActuel == cibleMission) {
        if (genreMission == GenreMission.Livraison) {
            if (varianteMission == VarianteMission.Fragile && progressionMission > 0) {
                missionsEchouees++
                effacerMission()
                return -2
            }
            accomplie = true
        }
        if (genreMission == GenreMission.Chasse && progressionMission >= quantiteMission) accomplie = true
        if (genreMission == GenreMission.Sauvetage && progressionMission > 0) accomplie = true
    }
    if (!accomplie) return 0
    let campagne = sourceMission
    let genreAccompli = genreMission
    let varianteAccomplie = varianteMission
    credits += recompenseMission
    missionsAccomplies++
    if (genreAccompli == GenreMission.Livraison) noterLivraison()
    if (genreAccompli == GenreMission.Sauvetage) noterSauvetage()
    let factionMission = factionEvenementVol()
    ajusterReputation(factionMission, campagne == 1 ? 5 : 2)
    if (varianteAccomplie == VarianteMission.Illegal) {
        ajusterReputation(Faction.Corsaires, 4)
        ajusterReputation(Faction.Union, -2)
    }
    if (campagne == 2) {
        etapeTutoriel = 4
        ameliorations[AMELIORATION_SCANNER] = Math.max(1, ameliorations[AMELIORATION_SCANNER])
    } else if (campagne == 1) avancerEtapeCampagne()
    else if (campagne == 3) accomplirContratDuJour()
    effacerMission()
    if (campagne == 2) return 2
    if (campagne == 1 && etapeCampagne >= 6) return 4
    if (campagne == 1) return 3
    return 1
}

function dessinerEtoilesVol(instant: number): void {
    let xSecousse = xSecousseVisuelleVol()
    let ySecousse = ySecousseVisuelleVol()
    for (let i = 0; i < 24; i++) {
        let x = (hasardFixe(graineTransit, i, 3) + xSecousse + 160) % 160
        let yBase = hasardFixe(graineTransit, i, 7) % 88
        let vitesse = 1 + i % 3
        let y = (yBase + Math.idiv(instant - debutPhaseMs, 35) * vitesse + ySecousse + 88) % 88
        screen.setPixel(x, y, i % 5 == 0 ? COULEUR_CYAN : COULEUR_TEXTE)
    }
}

function xSecousseVisuelleVol(): number {
    if (!secousseCamera || game.runtime() >= finFlashDegatsMs) return 0
    return Math.idiv(game.runtime(), 35) % 2 == 0 ? -2 : 2
}

function ySecousseVisuelleVol(): number {
    if (!secousseCamera || game.runtime() >= finFlashDegatsMs) return 0
    return Math.idiv(game.runtime(), 55) % 2 == 0 ? -1 : 1
}

function dessinerCockpit(): void {
    screen.fill(COULEUR_FOND)
    dessinerEtoilesVol(game.runtime())
    let xSecousse = xSecousseVisuelleVol()
    let ySecousse = ySecousseVisuelleVol()
    screen.drawLine(0, 88 + ySecousse, 31 + xSecousse, 70 + ySecousse, COULEUR_ATTENUEE)
    screen.drawLine(159, 88 + ySecousse, 129 + xSecousse, 70 + ySecousse, COULEUR_ATTENUEE)
    screen.drawLine(31 + xSecousse, 70 + ySecousse, 47 + xSecousse, 88 + ySecousse, COULEUR_ATTENUEE)
    screen.drawLine(129 + xSecousse, 70 + ySecousse, 113 + xSecousse, 88 + ySecousse, COULEUR_ATTENUEE)
    screen.fillRect(0, 89, 160, 31, COULEUR_BLEUE)
    screen.drawLine(0, 89, 160, 89, COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(260), 3, 94, COULEUR_CYAN)
    screen.fillRect(13, 95, bouclierVol * 22 / Math.max(1, bouclierMax()), 4, COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(609), 3, 104, COULEUR_VERTE)
    screen.fillRect(13, 105, coque * 22 / Math.max(1, coqueMax()), 4, coque <= 2 ? COULEUR_ROUGE : COULEUR_VERTE)
    ecrireTexteJeu(Textes.t(610), 45, 94, COULEUR_JAUNE)
    screen.fillRect(55, 95, chaleurLaser * 2, 4, chaleurLaser >= 8 ? COULEUR_ROUGE : COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(281) + carburant, 45, 104, COULEUR_VERTE)
    ecrireTexteJeu(messageVol, 3, 80, COULEUR_TEXTE)
    ecrireTexteJeu(nomArmeCockpit(), 78, 103, COULEUR_JAUNE)
    ecrireTexteJeu(Textes.t(611) + energieArme, 111, 103, modeEnergie == 2 ? COULEUR_JAUNE : COULEUR_CYAN)
    ecrireTexteJeu(Textes.t(612) + nomModeEnergie(), 78, 111, modeEnergie == 0 ? COULEUR_ATTENUEE : COULEUR_VERTE)
    let modulesEndommages = 0
    for (let module = 0; module < NOMBRE_MODULES_VAISSEAU; module++) if (degatsModule[module] > 0) modulesEndommages++
    if (modulesEndommages > 0) ecrireTexteJeu(Textes.t(613) + modulesEndommages, 139, 111, COULEUR_ROUGE)
    if (debutFuiteMs > 0) {
        let charge = Math.min(28, Math.idiv((game.runtime() - debutFuiteMs) * 28, tempsChargeFuite()))
        screen.drawRect(78, 107, 30, 6, COULEUR_JAUNE)
        screen.fillRect(79, 108, charge, 4, COULEUR_JAUNE)
    }
    if (game.runtime() < finTexteAstuceMs) {
        // Pendant l'approche de la station et tant que la capsule de sauvetage est montrée, l'indication est en haut :
        // la ligne 80 porte le message de vol, les lignes 66 à 72 la consigne d'accostage ou de rayon tracteur avec sa
        // barre. Avec la capsule, le radar (y 9 à 26) est à l'écran ; l'indication se place donc juste en dessous. La
        // capsule est dessinée plus tard et n'est jamais cachée par l'indication.
        let yAstuce = phaseVol == PhaseVol.Approche ? 18 : (estCapsuleSauvetageVisible() ? 29 : 78)
        screen.fillRect(45, yAstuce - 2, 112, 10, COULEUR_FOND)
        ecrireDroite(texteAstuce, 156, yAstuce, COULEUR_JAUNE)
    }
    if (game.runtime() < finFlashDegatsMs) {
        screen.drawRect(0, 8, 159, 80, COULEUR_ROUGE)
        screen.drawRect(2, 10, 155, 76, COULEUR_ORANGE)
    }
    dessinerRadarCockpit()
}

function nomArmeCockpit(): string {
    if (armeActive == GenreArme.Missile) return Textes.t(614) + missiles
    if (armeActive == GenreArme.Mine) return Textes.t(615) + mines
    return Textes.t(616)
}

function dessinerRadarCockpit(): void {
    if (phaseVol != PhaseVol.Rencontre) return
    let degatsScanner = degatsModule[ModuleVaisseau.Scanner]
    screen.drawRect(132, 9, 25, 18, degatsScanner >= 2 ? COULEUR_ROUGE : COULEUR_CYAN)
    screen.setPixel(144, 18, COULEUR_VERTE)
    if (degatsScanner >= 3 && Math.idiv(game.runtime(), 180) % 2 == 0) {
        ecrireTexteJeu(Textes.t(201), 136, 14, COULEUR_ROUGE)
        return
    }
    if (ennemiActif) {
        let rx = 144 + Math.clamp(-10, 10, Math.idiv(xEnnemi - xReticule, 7))
        let ry = 18 + Math.clamp(-7, 7, Math.idiv(yEnnemi - yReticule, 7))
        screen.fillRect(rx - 1, ry - 1, 3, 3, typeEnnemi == 4 ? COULEUR_ROUGE : COULEUR_ORANGE)
    }
    if (ailiersFormation > 0 && degatsScanner < 2) {
        screen.setPixel(136, 13, COULEUR_JAUNE)
        if (ailiersFormation > 1) screen.setPixel(153, 23, COULEUR_JAUNE)
    }
}

function dessinerReticule(): void {
    screen.drawLine(xReticule - 6, yReticule, xReticule - 2, yReticule, COULEUR_VERTE)
    screen.drawLine(xReticule + 2, yReticule, xReticule + 6, yReticule, COULEUR_VERTE)
    screen.drawLine(xReticule, yReticule - 6, xReticule, yReticule - 2, COULEUR_VERTE)
    screen.drawLine(xReticule, yReticule + 2, xReticule, yReticule + 6, COULEUR_VERTE)
}

function dessinerEnnemi(): void {
    if (!ennemiActif) return
    let x = xEnnemi + xSecousseVisuelleVol()
    let y = yEnnemi + ySecousseVisuelleVol()
    let s = tailleEnnemi
    let couleur = typeEnnemi >= 3 ? COULEUR_ROUGE
        : (typeEnnemi == 2 ? COULEUR_VIOLETTE : (typeEnnemi == 1 ? COULEUR_JAUNE : COULEUR_ORANGE))
    dessinerFormationEnnemi(x, y, s, couleur)
    if (typeEnnemi == 0 || typeEnnemi == 3) {
        screen.drawLine(x - s, y, x, y - Math.idiv(s, 2), couleur)
        screen.drawLine(x, y - Math.idiv(s, 2), x + s, y, couleur)
        screen.drawLine(x + s, y, x, y + Math.idiv(s, 2), couleur)
        screen.drawLine(x, y + Math.idiv(s, 2), x - s, y, couleur)
    } else if (typeEnnemi == 1) {
        screen.drawLine(x - s, y + Math.idiv(s, 2), x, y - s, couleur)
        screen.drawLine(x, y - s, x + s, y + Math.idiv(s, 2), couleur)
        screen.drawLine(x + s, y + Math.idiv(s, 2), x - s, y + Math.idiv(s, 2), couleur)
    } else {
        screen.drawRect(x - s, y - Math.idiv(s, 2), s * 2, s, couleur)
        screen.drawLine(x - s, y, x - s - 4, y - 5, couleur)
        screen.drawLine(x + s, y, x + s + 4, y - 5, couleur)
    }
    if (bouclierEnnemi > 0) {
        let impulsion = Math.idiv(game.runtime(), 90) % 3
        dessinerLosangeApercu(x, y, s + 5 + impulsion, Math.idiv(s, 2) + 5 + impulsion, COULEUR_CYAN)
    }
    if (typeEnnemi == 4) {
        actualiserPointFaibleBoss()
        screen.drawCircle(xFaibleBoss + xSecousseVisuelleVol(), yFaibleBoss + ySecousseVisuelleVol(),
            3 + Math.idiv(game.runtime(), 120) % 2, COULEUR_JAUNE)
        ecrireTexteJeu(Textes.t(617) + phaseBoss, x - 3, y - s - 8, COULEUR_ROUGE)
    }
    ecrireTexteJeu((bouclierEnnemi > 0 ? Textes.t(260) + bouclierEnnemi + " " : "") + Textes.t(609) + coqueEnnemi,
        x - 8, y + s + 2, COULEUR_ROUGE)
}

function dessinerFormationEnnemi(x: number, y: number, taille: number, couleur: number): void {
    if (genreFormation == 2) {
        screen.drawRect(x - taille - 9, y - 4, taille * 2 + 18, 8, COULEUR_ATTENUEE)
        screen.drawLine(x - taille - 12, y, x - taille - 5, y, COULEUR_JAUNE)
        screen.drawLine(x + taille + 5, y, x + taille + 12, y, COULEUR_JAUNE)
    }
    if (ailiersFormation > 0) {
        screen.drawLine(x - taille - 12, y + 7, x - taille - 6, y + 3, couleur)
        screen.drawLine(x - taille - 6, y + 3, x - taille - 4, y + 9, couleur)
    }
    if (ailiersFormation > 1) {
        screen.drawLine(x + taille + 12, y + 7, x + taille + 6, y + 3, couleur)
        screen.drawLine(x + taille + 6, y + 3, x + taille + 4, y + 9, couleur)
    }
}

function dessinerEvenementVol(): void {
    screen.fillRect(5, 16, 150, 76, COULEUR_BLEUE)
    screen.drawRect(5, 16, 150, 76, evenementVolResolu ? COULEUR_VERTE : COULEUR_CYAN)
    ecrireTexteJeu(titreEvenementVol(), 9, 21, COULEUR_JAUNE)
    if (evenementVolResolu) {
        ecrireParagraphe(resultatEvenementVol, 9, 36, 23, COULEUR_VERTE)
        ecrireTexteJeu(Textes.t(618), 9, 75, COULEUR_TEXTE)
    } else {
        ecrireParagraphe(infoEvenementVol(), 9, 36, 23, COULEUR_TEXTE)
        ecrireTexteJeu(etiquetteAcceptationEvenementVol(), 9, 67, COULEUR_VERTE)
        ecrireTexteJeu(etiquetteRefusEvenementVol(), 9, 80, COULEUR_ORANGE)
    }
}

function estCapsuleSauvetageVisible(): boolean {
    return phaseVol == PhaseVol.Rencontre && genreMission == GenreMission.Sauvetage &&
        cibleMission == cibleTransit && progressionMission == 0 && !ennemiActif && !sauvetageApresCombat
}

function dessinerVol(): void {
    dessinerCockpit()
    let instant = game.runtime()
    if (phaseVol == PhaseVol.Lancement) {
        let ouvert = Math.min(34, Math.idiv(instant - debutPhaseMs, 45))
        screen.drawRect(80 - ouvert, 18, ouvert * 2, 64, COULEUR_CYAN)
        ecrireTexteJeu(Textes.t(254), 65, 43, COULEUR_TEXTE)
    } else if (phaseVol == PhaseVol.Croisiere) {
        ecrireTexteJeu(Textes.t(619) + NOMS_MONDES[cibleTransit], 35, 18, COULEUR_CYAN)
    } else if (phaseVol == PhaseVol.Evenement) {
        dessinerEvenementVol()
    } else if (phaseVol == PhaseVol.Rencontre) {
        if (estCapsuleSauvetageVisible()) {
            // Comme la consigne d'accostage, l'indication du rayon tracteur est à gauche de sa barre (la ligne 80 reste
            // libre pour le message de vol). La capsule dérive dans toute l'image ; elle est donc dessinée en dernier
            // et n'est jamais cachée par l'indication ni par la barre.
            ecrireDroite(Textes.t(620), 111, 66, COULEUR_JAUNE)
            screen.drawRect(113, 67, 34, 5, COULEUR_CYAN)
            screen.fillRect(114, 68, Math.min(32, Math.idiv(progressionTracteur * 32, 900)), 3, COULEUR_CYAN)
            screen.drawRect(xCapsuleSauvetage - 5, yCapsuleSauvetage - 5, 10, 10, COULEUR_JAUNE)
            screen.drawLine(xCapsuleSauvetage - 7, yCapsuleSauvetage,
                xCapsuleSauvetage + 7, yCapsuleSauvetage, COULEUR_JAUNE)
        } else dessinerEnnemi()
        if (tirAttaqueMs > 0) {
            screen.drawRect(xAttaque - 9, yAttaque - 9, 18, 18, COULEUR_ROUGE)
            screen.drawLine(xAttaque - 12, yAttaque, xAttaque + 12, yAttaque, COULEUR_ROUGE)
        }
        if (instant < finFlashArmeMs) {
            screen.drawLine(50, 88, impactArme ? xEnnemi : xReticule, impactArme ?
                yEnnemi : yReticule, COULEUR_JAUNE)
            screen.drawLine(110, 88, impactArme ? xEnnemi : xReticule, impactArme ?
                yEnnemi : yReticule, COULEUR_JAUNE)
        }
    } else if (phaseVol == PhaseVol.Approche) {
        let tempsEcoule = instant - debutPhaseMs
        let xPortail = 80 + Math.round(Math.sin(tempsEcoule / 700) * 12)
        let taille = Math.min(34, 13 + Math.idiv(tempsEcoule, 180))
        screen.drawRect(xPortail - taille, 46 - Math.idiv(taille, 2), taille * 2, taille, COULEUR_CYAN)
        screen.drawRect(xPortail - Math.idiv(taille, 2), 46 - Math.idiv(taille, 4), taille, Math.idiv(taille, 2),
            COULEUR_VERTE)
        // La consigne d'accostage est à gauche de la barre d'accostage, sous le portail (bord bas à y 62 au plus) : la
        // ligne 80 reste libre pour le message de vol, afin que de longs titres comme APPROCHE DE STATION
        // n'y entrent pas.
        ecrireDroite(Textes.t(621), 111, 66, COULEUR_TEXTE)
        screen.drawRect(113, 67, 34, 5, COULEUR_VERTE)
        screen.fillRect(114, 68, Math.min(32, Math.idiv(progressionAccostage * 32, 900)), 3, COULEUR_VERTE)
    }
    if (phaseVol != PhaseVol.Evenement) dessinerReticule()
}
