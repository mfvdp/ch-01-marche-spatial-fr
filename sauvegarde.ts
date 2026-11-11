// Enregistrer et charger la partie : deux emplacements automatiques et un pour sauvegarder à la main.
const SAUVEGARDE_SIGNATURE = 731904
const SAUVEGARDE_VERSION = 3
const SAUVEGARDE_VERSION_V1 = 1
const SAUVEGARDE_VERSION_V2 = 2
const SAUVEGARDE_CLE_A = "ot.save.a"
const SAUVEGARDE_CLE_B = "ot.save.b"
const SAUVEGARDE_CLE_MANUELLE = "ot.save.manual"

const NOMBRE_CHAMPS_NOYAU_SAUVEGARDE = 26
const NOMBRE_CHAMPS_SUPPLEMENTAIRES_ANCIENS_V2 = 11
const NOMBRE_CHAMPS_NOUVEAUX_V3 = 200
const NOMBRE_CHAMPS_SUPPLEMENTAIRES_V3 = NOMBRE_CHAMPS_SUPPLEMENTAIRES_ANCIENS_V2 + NOMBRE_CHAMPS_NOUVEAUX_V3
// Ancien nom, qui n'est plus lu nulle part : dans une sauvegarde actuelle, les listes de fret commencent après tous les
// champs qui dépendent de la version.
const NOMBRE_CHAMPS_SUPPLEMENTAIRES_V2 = NOMBRE_CHAMPS_SUPPLEMENTAIRES_V3
const NOMBRE_CHAMPS_LISTES_SAUVEGARDE = NOMBRE_MARCHANDISES * 3 + NOMBRE_AMELIORATIONS
const COMPTEUR_MAX_SAUVEGARDE = 9999999
const POINTS_MAX_SAUVEGARDE = 999999999
const SEQUENCE_MAX_SAUVEGARDE = 2000000000
const GRAINE_MAX_SAUVEGARDE = 32748

function longueurSommeControleSauvegarde(valeurs: number[], longueur: number): number {
    let resultat = 19
    for (let i = 0; i < longueur; i++) {
        let terme = valeurs[i] % 1000003
        if (terme < 0) terme += 1000003
        resultat = (resultat + terme * (i + 7)) % 1000003
    }
    return resultat
}

function sommeControleSauvegarde(valeurs: number[]): number {
    return longueurSommeControleSauvegarde(valeurs, valeurs.length)
}

function longueurSauvegardeAttendueSelonVersion(version: number): number {
    let extra = 0
    if (version == SAUVEGARDE_VERSION_V2) extra = NOMBRE_CHAMPS_SUPPLEMENTAIRES_ANCIENS_V2
    else if (version == SAUVEGARDE_VERSION) extra = NOMBRE_CHAMPS_SUPPLEMENTAIRES_V3
    return NOMBRE_CHAMPS_NOYAU_SAUVEGARDE + extra + NOMBRE_CHAMPS_LISTES_SAUVEGARDE + 1
}

function longueurSauvegardeAttendue(): number {
    return longueurSauvegardeAttendueSelonVersion(SAUVEGARDE_VERSION)
}

function entierSauvegardeDansPlage(valeur: number, minimum: number, maximum: number): boolean {
    return valeur == (valeur | 0) && valeur >= minimum && valeur <= maximum
}

function assurerEtatV3(): void {
    if (!reputationsFactions || reputationsFactions.length != NOMBRE_FACTIONS)
        reputationsFactions = remplirListeNombres(NOMBRE_FACTIONS, 0)
    if (!influenceMarche || influenceMarche.length != NOMBRE_MONDES)
        influenceMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!jourMemoireMarche || jourMemoireMarche.length != NOMBRE_MONDES)
        jourMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!marchandiseMemoireMarche || marchandiseMemoireMarche.length != NOMBRE_MONDES)
        marchandiseMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!achatMemoireMarche || achatMemoireMarche.length != NOMBRE_MONDES)
        achatMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!venteMemoireMarche || venteMemoireMarche.length != NOMBRE_MONDES)
        venteMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!tendanceMemoireMarche || tendanceMemoireMarche.length != NOMBRE_MONDES)
        tendanceMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    if (!fretsRares || fretsRares.length != NOMBRE_FRETS_RARES) fretsRares = remplirListeNombres(NOMBRE_FRETS_RARES, 0)
    if (!idNomVaisseau || idNomVaisseau.length != NOMBRE_ROLES_VAISSEAU) idNomVaisseau = [0, 1, 2]
    if (!peintureVaisseau || peintureVaisseau.length != NOMBRE_ROLES_VAISSEAU)
        peintureVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    if (!degatsModule || degatsModule.length != NOMBRE_MODULES_VAISSEAU)
        degatsModule = remplirListeNombres(NOMBRE_MODULES_VAISSEAU, 0)
    masqueVaisseauxPossedes |= (1 << RoleVaisseau.Marchand) | (1 << roleVaisseau)
}

function joindreChampsV2Anciens(valeurs: number[]): void {
    valeurs.push(etapeTutoriel)
    valeurs.push(etapeCampagne)
    valeurs.push(varianteMission)
    valeurs.push(sourceMission)
    valeurs.push(graineGalaxie)
    valeurs.push(genreEvenementMarche)
    valeurs.push(mondeEvenementMarche)
    valeurs.push(marchandiseEvenementMarche)
    valeurs.push(finEvenementMarche)
    valeurs.push(roleVaisseau)
    valeurs.push(modeJeu)
}

function joindreChampsV3(valeurs: number[]): void {
    for (let i = 0; i < NOMBRE_FACTIONS; i++) valeurs.push(reputationsFactions[i])
    valeurs.push(choixFin)
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(influenceMarche[i])
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(jourMemoireMarche[i])
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(marchandiseMemoireMarche[i])
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(achatMemoireMarche[i])
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(venteMemoireMarche[i])
    for (let i = 0; i < NOMBRE_MONDES; i++) valeurs.push(tendanceMemoireMarche[i])
    for (let i = 0; i < NOMBRE_FRETS_RARES; i++) valeurs.push(fretsRares[i])
    valeurs.push(masqueArtefact)
    valeurs.push(masqueMondeSecret)
    valeurs.push(masqueVaisseauxPossedes)
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++) valeurs.push(idNomVaisseau[i])
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++) valeurs.push(peintureVaisseau[i])
    valeurs.push(masqueSucces)
    valeurs.push(masqueMondesVisitesBas)
    valeurs.push(masqueMondesVisitesHaut)
    valeurs.push(totalSauts)
    valeurs.push(totalSauvetages)
    valeurs.push(totalLivraisons)
    valeurs.push(totalCreditsGagnes)
    valeurs.push(plusGrandGainCommerce)
    valeurs.push(victoiresBoss)
    valeurs.push(echangesMarcheNoir)
    valeurs.push(evenementsAccomplis)
    valeurs.push(jourContratDuJour)
    valeurs.push(contratDuJourFait)
    valeurs.push(niveauPartiePlus)
    valeurs.push(armeActive)
    valeurs.push(missiles)
    valeurs.push(mines)
    valeurs.push(energieArme)
    valeurs.push(modeEnergie)
    for (let i = 0; i < NOMBRE_MODULES_VAISSEAU; i++) valeurs.push(degatsModule[i])
    valeurs.push(vitesseTexte)
    valeurs.push(contrasteEleve)
    valeurs.push(secousseCamera)
    valeurs.push(modeDeveloppeur)
}

function joindreListesSauvegarde(valeurs: number[]): void {
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) valeurs.push(fret[i])
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) valeurs.push(coutFret[i])
    for (let i = 0; i < NOMBRE_AMELIORATIONS; i++) valeurs.push(ameliorations[i])
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) valeurs.push(stockMarche[i])
}

function empaqueterSauvegarde(): number[] {
    assurerEtatV3()
    let valeurs: number[] = []
    valeurs.push(SAUVEGARDE_SIGNATURE)
    valeurs.push(SAUVEGARDE_VERSION)
    valeurs.push(sequenceSauvegarde)
    valeurs.push(mondeActuel)
    valeurs.push(mondeDestination)
    valeurs.push(jourJeu)
    valeurs.push(credits)
    valeurs.push(carburant)
    valeurs.push(coque)
    valeurs.push(gainCommerce)
    valeurs.push(totalVictoires)
    valeurs.push(missionsAccomplies)
    valeurs.push(missionsEchouees)
    valeurs.push(genreMission)
    valeurs.push(origineMission)
    valeurs.push(cibleMission)
    valeurs.push(echeanceMission)
    valeurs.push(recompenseMission)
    valeurs.push(marchandiseMission)
    valeurs.push(quantiteMission)
    valeurs.push(progressionMission)
    valeurs.push(graineMission)
    valeurs.push(enTransit)
    valeurs.push(origineTransit)
    valeurs.push(cibleTransit)
    valeurs.push(graineTransit)
    joindreChampsV2Anciens(valeurs)
    joindreChampsV3(valeurs)
    joindreListesSauvegarde(valeurs)
    valeurs.push(sommeControleSauvegarde(valeurs))
    return valeurs
}

function estSommeControleValide(valeurs: number[]): boolean {
    let indiceSommeControle = valeurs.length - 1
    if (!entierSauvegardeDansPlage(valeurs[indiceSommeControle], 0, 1000002)) return false
    return longueurSommeControleSauvegarde(valeurs, indiceSommeControle) == valeurs[indiceSommeControle]
}

function estNoyauValide(valeurs: number[], departListe: number, roleVaisseauEnregistre: number): boolean {
    if (!entierSauvegardeDansPlage(valeurs[2], 0, SEQUENCE_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[3], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[4], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[5], 1, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[6], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[9], 0, POINTS_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[10], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[11], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[12], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[13], GenreMission.Aucun, GenreMission.Sauvetage)) return false
    if (!entierSauvegardeDansPlage(valeurs[14], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[15], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[16], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[17], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[18], 0, NOMBRE_MARCHANDISES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[19], 0, 99)) return false
    if (!entierSauvegardeDansPlage(valeurs[20], 0, valeurs[19])) return false
    if (!entierSauvegardeDansPlage(valeurs[21], 0, GRAINE_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[22], 0, 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[23], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[24], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[25], 0, GRAINE_MAX_SAUVEGARDE)) return false
    if (valeurs[22] == 1 && valeurs[23] == valeurs[24]) return false
    if (valeurs[13] == GenreMission.Aucun) {
        if (valeurs[16] != 0 || valeurs[17] != 0 || valeurs[19] != 0 || valeurs[20] != 0) return false
    } else if (valeurs[16] < 1 || valeurs[17] < 1 || valeurs[19] < 1) return false

    let departAmelioration = departListe + NOMBRE_MARCHANDISES * 2
    for (let i = 0; i < NOMBRE_AMELIORATIONS; i++) {
        if (!entierSauvegardeDansPlage(valeurs[departAmelioration + i], 0, MAX_AMELIORATION[i])) return false
    }
    let capaciteFretEnregistree = 8 + valeurs[departAmelioration + AMELIORATION_FRET] * 4
    if (roleVaisseauEnregistre == RoleVaisseau.Marchand) capaciteFretEnregistree += 4
    let carburantMaxEnregistre = 5 + valeurs[departAmelioration + AMELIORATION_SAUT]
    if (roleVaisseauEnregistre == RoleVaisseau.Coursier) carburantMaxEnregistre += 2
    let coqueMaxEnregistree = 8 + valeurs[departAmelioration + AMELIORATION_BLINDAGE] * 3
    if (!entierSauvegardeDansPlage(valeurs[7], 0, carburantMaxEnregistre)) return false
    if (!entierSauvegardeDansPlage(valeurs[8], 1, coqueMaxEnregistree)) return false
    let fretUtilise = valeurs[13] == GenreMission.Livraison || valeurs[13] == GenreMission.Sauvetage ? valeurs[19] : 0
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) {
        let unites = valeurs[departListe + i]
        let cout = valeurs[departListe + NOMBRE_MARCHANDISES + i]
        if (!entierSauvegardeDansPlage(unites, 0, capaciteFretEnregistree)) return false
        if (!entierSauvegardeDansPlage(cout, 0, COMPTEUR_MAX_SAUVEGARDE)) return false
        if (unites == 0 && cout != 0) return false
        fretUtilise += unites
    }
    if (fretUtilise > capaciteFretEnregistree) return false
    let departStock = departAmelioration + NOMBRE_AMELIORATIONS
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++)
        if (!entierSauvegardeDansPlage(valeurs[departStock + i], 0, 99)) return false
    return true
}

function sontChampsV2AnciensValides(valeurs: number[], depart: number): boolean {
    let p = depart
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 4)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_MISSIONS_CAMPAGNE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], VarianteMission.Standard, VarianteMission.SousFeu)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 3)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 1, GRAINE_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], GenreEvenementMarche.Aucun, GenreEvenementMarche.Essor)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_MONDES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_MARCHANDISES - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], RoleVaisseau.Marchand, RoleVaisseau.Chasseur)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], ModeJeu.Standard, ModeJeu.Fer)) return false
    return true
}

function estSauvegardeV1Valide(valeurs: number[]): boolean {
    if (valeurs.length != longueurSauvegardeAttendueSelonVersion(SAUVEGARDE_VERSION_V1)) return false
    if (!estSommeControleValide(valeurs)) return false
    return estNoyauValide(valeurs, NOMBRE_CHAMPS_NOYAU_SAUVEGARDE, -1)
}

function estSauvegardeV2Valide(valeurs: number[]): boolean {
    if (valeurs.length != longueurSauvegardeAttendueSelonVersion(SAUVEGARDE_VERSION_V2)) return false
    if (!estSommeControleValide(valeurs) ||
        !sontChampsV2AnciensValides(valeurs, NOMBRE_CHAMPS_NOYAU_SAUVEGARDE)) return false
    return estNoyauValide(valeurs, NOMBRE_CHAMPS_NOYAU_SAUVEGARDE +
        NOMBRE_CHAMPS_SUPPLEMENTAIRES_ANCIENS_V2, valeurs[35])
}

function sontChampsV3Valides(valeurs: number[], depart: number, departListe: number): boolean {
    let p = depart
    for (let i = 0; i < NOMBRE_FACTIONS; i++) if (!entierSauvegardeDansPlage(valeurs[p++], -100, 100)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], GenreFin.Aucun, GenreFin.Corsaire)) return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], -20, 20)) return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE))
        return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_MARCHANDISES - 1))
        return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, 9999)) return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, 9999)) return false
    for (let i = 0; i < NOMBRE_MONDES; i++) if (!entierSauvegardeDansPlage(valeurs[p++], -2, 2)) return false
    let unitesRares = 0
    for (let i = 0; i < NOMBRE_FRETS_RARES; i++) {
        if (!entierSauvegardeDansPlage(valeurs[p], 0, 99)) return false
        unitesRares += valeurs[p++]
    }
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, (1 << NOMBRE_ARTEFACTS) - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0,
        (1 << (NOMBRE_MONDES - NOMBRE_MONDES_PUBLICS)) - 1)) return false
    let vaisseauxPossedesEnregistres = valeurs[p++]
    if (!entierSauvegardeDansPlage(vaisseauxPossedesEnregistres, 1, (1 << NOMBRE_ROLES_VAISSEAU) - 1)) return false
    if ((vaisseauxPossedesEnregistres & 1) == 0 ||
        (vaisseauxPossedesEnregistres & (1 << valeurs[35])) == 0) return false
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++)
        if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_NOMS_VAISSEAU - 1))
        return false
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++)
        if (!entierSauvegardeDansPlage(valeurs[p++], 0, NOMBRE_PEINTURES - 1))
        return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, (1 << NOMBRE_SUCCES) - 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 65535)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 1023)) return false
    for (let i = 0; i < 3; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, POINTS_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    for (let i = 0; i < 3; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, COMPTEUR_MAX_SAUVEGARDE)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 9)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], GenreArme.Laser, GenreArme.Mine)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 12)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 8)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 100)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 3)) return false
    for (let i = 0; i < NOMBRE_MODULES_VAISSEAU; i++) if (!entierSauvegardeDansPlage(valeurs[p++], 0, 3)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 2)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 1)) return false
    if (!entierSauvegardeDansPlage(valeurs[p++], 0, 1)) return false
    if (p != departListe) return false
    let departAmelioration = departListe + NOMBRE_MARCHANDISES * 2
    let capacite = 8 + valeurs[departAmelioration + AMELIORATION_FRET] * 4 +
        (valeurs[NOMBRE_CHAMPS_NOYAU_SAUVEGARDE + 9] == RoleVaisseau.Marchand ? 4 : 0)
    let baseUtilise = valeurs[13] == GenreMission.Livraison || valeurs[13] == GenreMission.Sauvetage ? valeurs[19] : 0
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) baseUtilise += valeurs[departListe + i]
    return baseUtilise + unitesRares <= capacite
}

function estSauvegardeV3Valide(valeurs: number[]): boolean {
    if (valeurs.length != longueurSauvegardeAttendue()) return false
    if (!estSommeControleValide(valeurs) ||
        !sontChampsV2AnciensValides(valeurs, NOMBRE_CHAMPS_NOYAU_SAUVEGARDE)) return false
    let departListes = NOMBRE_CHAMPS_NOYAU_SAUVEGARDE + NOMBRE_CHAMPS_SUPPLEMENTAIRES_V3
    if (!sontChampsV3Valides(valeurs, NOMBRE_CHAMPS_NOYAU_SAUVEGARDE +
        NOMBRE_CHAMPS_SUPPLEMENTAIRES_ANCIENS_V2, departListes))
        return false
    return estNoyauValide(valeurs, departListes, valeurs[35])
}

function estSauvegardeValide(valeurs: number[]): boolean {
    if (!valeurs || valeurs.length < 3 || valeurs[0] != SAUVEGARDE_SIGNATURE) return false
    if (valeurs[1] == SAUVEGARDE_VERSION_V1) return estSauvegardeV1Valide(valeurs)
    if (valeurs[1] == SAUVEGARDE_VERSION_V2) return estSauvegardeV2Valide(valeurs)
    if (valeurs[1] == SAUVEGARDE_VERSION) return estSauvegardeV3Valide(valeurs)
    return false
}

function emplacementSauvegarde(cle: string): number[] {
    if (!settings.exists(cle)) return null
    return settings.readNumberArray(cle)
}

function sauvegardeValideRecente(a: number[], b: number[]): number[] {
    let valideA = estSauvegardeValide(a)
    let valideB = estSauvegardeValide(b)
    if (!valideA) return valideB ? b : null
    if (!valideB) return a
    return a[2] >= b[2] ? a : b
}

function enregistrerSauvegarde(): void {
    sequenceSauvegarde++
    let valeurs = empaqueterSauvegarde()
    if (sequenceSauvegarde % 2 == 0) settings.writeNumberArray(SAUVEGARDE_CLE_A, valeurs)
    else settings.writeNumberArray(SAUVEGARDE_CLE_B, valeurs)
    aSauvegarde = true
}

function sauvegardeManuelleExiste(): boolean {
    return estSauvegardeValide(emplacementSauvegarde(SAUVEGARDE_CLE_MANUELLE))
}

function enregistrerSauvegardeManuelle(): void {
    sequenceSauvegarde++
    settings.writeNumberArray(SAUVEGARDE_CLE_MANUELLE, empaqueterSauvegarde())
    aSauvegarde = true
}

function chargerSauvegardeManuelle(): boolean {
    let valeurs = emplacementSauvegarde(SAUVEGARDE_CLE_MANUELLE)
    if (!estSauvegardeValide(valeurs)) return false
    let recent = sequenceSauvegarde
    depaqueterSauvegarde(valeurs)
    // On continue après la plus récente des sauvegardes automatiques, sinon le prochain démarrage chargerait
    // encore la même.
    sequenceSauvegarde = Math.max(sequenceSauvegarde, recent)
    enregistrerSauvegarde()
    return true
}

function effacerSauvegardeManuelle(): void {
    if (settings.exists(SAUVEGARDE_CLE_MANUELLE)) settings.remove(SAUVEGARDE_CLE_MANUELLE)
}

function graineGalaxieMigree(monde: number, jour: number): number {
    return 1 + hasardFixe(monde, jour, 17) % GRAINE_MAX_SAUVEGARDE
}

function preparerEtatV2Migre(): void {
    reputationsFactions = remplirListeNombres(NOMBRE_FACTIONS, 0)
    choixFin = GenreFin.Aucun
    influenceMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    jourMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    marchandiseMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    achatMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    venteMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    tendanceMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    fretsRares = remplirListeNombres(NOMBRE_FRETS_RARES, 0)
    masqueArtefact = 0
    masqueMondeSecret = 0
    masqueVaisseauxPossedes = (1 << RoleVaisseau.Marchand) | (1 << roleVaisseau)
    idNomVaisseau = [0, 1, 2]
    peintureVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    masqueSucces = 0
    masqueMondesVisitesBas = mondeActuel < 16 ? 1 << mondeActuel : 0
    masqueMondesVisitesHaut = mondeActuel >= 16 ? 1 << (mondeActuel - 16) : 0
    totalSauts = 0
    totalSauvetages = 0
    totalLivraisons = 0
    totalCreditsGagnes = 0
    plusGrandGainCommerce = 0
    victoiresBoss = 0
    echangesMarcheNoir = 0
    evenementsAccomplis = 0
    jourContratDuJour = 0
    contratDuJourFait = 0
    niveauPartiePlus = 0
    armeActive = GenreArme.Laser
    missiles = 3
    mines = 2
    energieArme = 100
    modeEnergie = 0
    degatsModule = remplirListeNombres(NOMBRE_MODULES_VAISSEAU, 0)
    vitesseTexte = 1
    contrasteEleve = 0
    secousseCamera = 1
    modeDeveloppeur = 0
}

function lireChampsV2Anciens(valeurs: number[], p: number): number {
    etapeTutoriel = valeurs[p++]
    etapeCampagne = valeurs[p++]
    varianteMission = valeurs[p++]
    sourceMission = valeurs[p++]
    graineGalaxie = valeurs[p++]
    genreEvenementMarche = valeurs[p++]
    mondeEvenementMarche = valeurs[p++]
    marchandiseEvenementMarche = valeurs[p++]
    finEvenementMarche = valeurs[p++]
    roleVaisseau = valeurs[p++]
    modeJeu = valeurs[p++]
    return p
}

function lireChampsV3(valeurs: number[], p: number): number {
    reputationsFactions = remplirListeNombres(NOMBRE_FACTIONS, 0)
    for (let i = 0; i < NOMBRE_FACTIONS; i++) reputationsFactions[i] = valeurs[p++]
    choixFin = valeurs[p++]
    influenceMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) influenceMarche[i] = valeurs[p++]
    jourMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) jourMemoireMarche[i] = valeurs[p++]
    marchandiseMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) marchandiseMemoireMarche[i] = valeurs[p++]
    achatMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) achatMemoireMarche[i] = valeurs[p++]
    venteMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) venteMemoireMarche[i] = valeurs[p++]
    tendanceMemoireMarche = remplirListeNombres(NOMBRE_MONDES, 0)
    for (let i = 0; i < NOMBRE_MONDES; i++) tendanceMemoireMarche[i] = valeurs[p++]
    fretsRares = remplirListeNombres(NOMBRE_FRETS_RARES, 0)
    for (let i = 0; i < NOMBRE_FRETS_RARES; i++) fretsRares[i] = valeurs[p++]
    masqueArtefact = valeurs[p++]
    masqueMondeSecret = valeurs[p++]
    masqueVaisseauxPossedes = valeurs[p++]
    idNomVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++) idNomVaisseau[i] = valeurs[p++]
    peintureVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    for (let i = 0; i < NOMBRE_ROLES_VAISSEAU; i++) peintureVaisseau[i] = valeurs[p++]
    masqueSucces = valeurs[p++]
    masqueMondesVisitesBas = valeurs[p++]
    masqueMondesVisitesHaut = valeurs[p++]
    totalSauts = valeurs[p++]
    totalSauvetages = valeurs[p++]
    totalLivraisons = valeurs[p++]
    totalCreditsGagnes = valeurs[p++]
    plusGrandGainCommerce = valeurs[p++]
    victoiresBoss = valeurs[p++]
    echangesMarcheNoir = valeurs[p++]
    evenementsAccomplis = valeurs[p++]
    jourContratDuJour = valeurs[p++]
    contratDuJourFait = valeurs[p++]
    niveauPartiePlus = valeurs[p++]
    armeActive = valeurs[p++]
    missiles = valeurs[p++]
    mines = valeurs[p++]
    energieArme = valeurs[p++]
    modeEnergie = valeurs[p++]
    degatsModule = remplirListeNombres(NOMBRE_MODULES_VAISSEAU, 0)
    for (let i = 0; i < NOMBRE_MODULES_VAISSEAU; i++) degatsModule[i] = valeurs[p++]
    vitesseTexte = valeurs[p++]
    contrasteEleve = valeurs[p++]
    secousseCamera = valeurs[p++]
    modeDeveloppeur = valeurs[p++]
    return p
}

function depaqueterSauvegarde(valeurs: number[]): void {
    let version = valeurs[1]
    let p = 2
    sequenceSauvegarde = valeurs[p++]
    mondeActuel = valeurs[p++]
    mondeDestination = valeurs[p++]
    jourJeu = valeurs[p++]
    credits = valeurs[p++]
    carburant = valeurs[p++]
    coque = valeurs[p++]
    gainCommerce = valeurs[p++]
    totalVictoires = valeurs[p++]
    missionsAccomplies = valeurs[p++]
    missionsEchouees = valeurs[p++]
    genreMission = valeurs[p++]
    origineMission = valeurs[p++]
    cibleMission = valeurs[p++]
    echeanceMission = valeurs[p++]
    recompenseMission = valeurs[p++]
    marchandiseMission = valeurs[p++]
    quantiteMission = valeurs[p++]
    progressionMission = valeurs[p++]
    graineMission = valeurs[p++]
    enTransit = valeurs[p++]
    origineTransit = valeurs[p++]
    cibleTransit = valeurs[p++]
    graineTransit = valeurs[p++]
    if (version >= SAUVEGARDE_VERSION_V2) p = lireChampsV2Anciens(valeurs, p)
    else {
        etapeTutoriel = 1
        etapeCampagne = 0
        varianteMission = VarianteMission.Standard
        sourceMission = 0
        graineGalaxie = graineGalaxieMigree(mondeActuel, jourJeu)
        genreEvenementMarche = GenreEvenementMarche.Aucun
        mondeEvenementMarche = 0
        marchandiseEvenementMarche = 0
        finEvenementMarche = 0
        roleVaisseau = RoleVaisseau.Marchand
        modeJeu = ModeJeu.Standard
    }
    if (version == SAUVEGARDE_VERSION) p = lireChampsV3(valeurs, p)
    else preparerEtatV2Migre()
    fret = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    coutFret = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    ameliorations = remplirListeNombres(NOMBRE_AMELIORATIONS, 0)
    stockMarche = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) fret[i] = valeurs[p++]
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) coutFret[i] = valeurs[p++]
    for (let i = 0; i < NOMBRE_AMELIORATIONS; i++) ameliorations[i] = valeurs[p++]
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) stockMarche[i] = valeurs[p++]
    carburant = Math.min(carburant, carburantMax())
    effacerRoutePrevue()
}

function chargerJeu(): boolean {
    let choisi =
        sauvegardeValideRecente(
        emplacementSauvegarde(SAUVEGARDE_CLE_A), emplacementSauvegarde(SAUVEGARDE_CLE_B))
    if (!choisi) {
        aSauvegarde = false
        sauvegardeEtaitCorrompue = settings.exists(SAUVEGARDE_CLE_A) || settings.exists(SAUVEGARDE_CLE_B)
        return false
    }
    let migration = choisi[1] != SAUVEGARDE_VERSION
    depaqueterSauvegarde(choisi)
    aSauvegarde = true
    sauvegardeEtaitCorrompue = false
    if (migration) enregistrerSauvegarde()
    return true
}

function effacerSauvegarde(): void {
    if (settings.exists(SAUVEGARDE_CLE_A)) settings.remove(SAUVEGARDE_CLE_A)
    if (settings.exists(SAUVEGARDE_CLE_B)) settings.remove(SAUVEGARDE_CLE_B)
    effacerSauvegardeManuelle()
    aSauvegarde = false
    sauvegardeEtaitCorrompue = false
    sequenceSauvegarde = 0
}
