// Les données fixes du jeu : mondes, marchandises, vaisseaux, missions et campagne.
const NOMBRE_MONDES_PUBLICS = 24
const NOMBRE_MONDES = 26
const NOMBRE_MARCHANDISES = 12
const NOMBRE_AMELIORATIONS = 10
const NOMBRE_FACTIONS = 4
const NOMBRE_FRETS_RARES = 3
const NOMBRE_ARTEFACTS = 4
const NOMBRE_ROLES_VAISSEAU = 3
const NOMBRE_MODULES_VAISSEAU = 4
const NOMBRE_ARMES = 3
const NOMBRE_SUCCES = 12
const NOMBRE_PEINTURES = 6
const NOMBRE_NOMS_VAISSEAU = 8
const MONDE_DEPART = 0
const NOMBRE_OFFRES_MISSION = 5
const NOMBRE_MISSIONS_CAMPAGNE = 6

const AMELIORATION_FRET = 0
const AMELIORATION_BOUCLIER = 1
const AMELIORATION_BLINDAGE = 2
const AMELIORATION_LASER = 3
const AMELIORATION_REFROIDISSEUR = 4
const AMELIORATION_PROPULSEUR = 5
const AMELIORATION_SCANNER = 6
const AMELIORATION_SAUT = 7
const AMELIORATION_REPARATION = 8
const AMELIORATION_ASSURANCE = 9

const NOMS_MONDES = [
    "LUMA", "VEXO", "NORI", "KAVO", "PIXA", "ZUNO",
    "MIRO", "TAVI", "REKO", "SOLA", "BIRI", "YUNO",
    "DOVA", "FENO", "RUNA", "KIRI", "JEXA", "WELA",
    "AURI", "MEKI", "ONDA", "QUBI", "ZERA", "TALO",
    "NEXUS-9", "EDEN-X"
]
const MONDE_X = hex`0c2743607d9614304b6784970925405e7995122f4c6884995391`
const MONDE_Y = hex`100b140d120a2b2531272f2648414d444f43655e695e675c3971`
const MONDE_ECONOMIE = hex`0001050203040400020501030104000305020502030004010300`
const MONDE_DANGER = hex`0001000201030100010002020102010203020001030102030301`
const MONDE_FACTION = hex`0001010002000001010201020301000203020101000103000202`
const NOMS_ECONOMIE = hex`1a1b1c1d1e1f`
const NOMS_DANGER = hex`20212223`

// Chaque monde a un petit trait distinctif. Les bonus et les malus sont volontairement faibles : le type d'économie et
// les choix du joueur doivent rester plus importants que le trait.
const NOMS_TRAITS_MONDE = hex`2425262728292a2b2c2d2e2f303132333435363738393a3b3c3d`
const INFOS_TRAITS_MONDE = hex`3e3f404142434445464748494a4b4c4d4e4f5051525354555657`
const POURCENT_PRIX_TRAIT_MONDE = hex`fefffdff00000400030005000200fcffffff0200fdff03000600fdfffcff0300070003000600feff07000100080005000a00faff`
const POURCENT_CHANTIER_TRAIT_MONDE = hex`f8ff0200f6ff08000000040003000000fcff02000500fbff0a00feff0100fdff0c0008000500faff0900feff0f0004001400f6ff`
const DANGER_TRAIT_MONDE = hex`0000000000000100000001000000ffff0000ffff0000010001000000ffff000001000100ffff000001000000010001000100ffff`

const NOMS_FACTIONS = hex`58595a5b`
const NOMS_FRET_RARE = hex`5c5d5e`
const VALEURS_FRET_RARE = hex`8a0284037805`
const NOMS_ARTEFACTS = hex`5f606162`
const NOMS_VAISSEAUX = ["NOMAD", "KESTREL", "RAPTOR", "AURORA", "MERCURY", "NOVA", "PHOENIX", "ORBITER"]
const NOMS_PEINTURES = hex`6b6c6d6e6f70`
const NOMS_ARMES = hex`71721b`
const NOMS_MODULES = hex`73747576`
const NOMS_FINS = hex`775878797a`
const NOMS_SUCCES = hex`7b7c7d7e7f80818283848586`
const INFOS_SUCCES = hex`8788898a8b8c8d8e8f909192`

const NOMS_MARCHANDISES = hex`939495969798999a9b9c9d9e`
const PRIX_BASE_MARCHANDISE = hex`0a0e08162d1e1a3040527396`
// Le bit n signifie : l'économie numéro n produit cette marchandise ou en a besoin.
const MASQUE_PRODUCTEUR_MARCHANDISE = hex`010111020210050408080c20`
const MASQUE_DEMANDE_MARCHANDISE = hex`2a2406142807221b23341309`

const NOMS_AMELIORATIONS = hex`9fa0a171a2a374a4a5a6`
const MAX_AMELIORATION = hex`03030303020202030102`
const PRIX_AMELIORATION_1 = hex`5e01f401c20126025e01c2012c015802dc058a02`
const PRIX_AMELIORATION_2 = hex`52031405b004aa05e80314058403dc050000a406`
const PRIX_AMELIORATION_3 = hex`0807540b8c0a800c000000000000800c00000000`

const NOMS_RANGS = hex`a7a8a9aaabac`

// La campagne reconstruit le réseau commercial dont parle le prologue.
const TITRES_CAMPAGNE = hex`adaeaf5db0b1`
const BRIEFINGS_CAMPAGNE = hex`b2b3b4b5b6b7`
const RANG_REQUIS_CAMPAGNE = hex`000102030405`
const CIBLE_CAMPAGNE = hex`010710141617`
const GENRE_CAMPAGNE = [GenreMission.Livraison, GenreMission.Sauvetage, GenreMission.Chasse, GenreMission.Livraison,
    GenreMission.Sauvetage, GenreMission.Chasse]
const MARCHANDISE_CAMPAGNE = hex`080800090800`
const VARIANTE_CAMPAGNE = [VarianteMission.Standard, VarianteMission.SousFeu, VarianteMission.As,
    VarianteMission.Fragile, VarianteMission.SousFeu, VarianteMission.As]
const QUANTITE_CAMPAGNE = hex`020102020104`
const RECOMPENSE_CAMPAGNE = hex`a401bc024c040807f00a8813`

function estProduiteParEconomie(marchandise: number, economie: number): boolean {
    return (MASQUE_PRODUCTEUR_MARCHANDISE[marchandise] & (1 << economie)) != 0
}

function estDemandeeParEconomie(marchandise: number, economie: number): boolean {
    return (MASQUE_DEMANDE_MARCHANDISE[marchandise] & (1 << economie)) != 0
}

function hasardFixe(a: number, b: number, c: number): number {
    let valeur = (a * 109 + b * 47 + c * 23 + 97) % 32749
    valeur = (valeur * 73 + 41) % 32749
    return valeur
}

function hasardGalaxie(a: number, b: number, c: number): number {
    return hasardFixe(a + graineGalaxie, b + graineGalaxie % 97, c + graineGalaxie % 31)
}

function nomFaction(faction: Faction): string {
    return Textes.t(NOMS_FACTIONS[Math.clamp(0, NOMBRE_FACTIONS - 1, faction)])
}

function factionMonde(monde: number): Faction {
    return MONDE_FACTION[Math.clamp(0, NOMBRE_MONDES - 1, monde)]
}

function nomFretRare(id: FretRare): string {
    return Textes.t(NOMS_FRET_RARE[Math.clamp(0, NOMBRE_FRETS_RARES - 1, id)])
}

function valeurFretRare(id: FretRare): number {
    let base = tableI16(VALEURS_FRET_RARE, Math.clamp(0, NOMBRE_FRETS_RARES - 1, id))
    return Math.max(1, Math.idiv(base * (100 + dangerMondeEffectif(mondeActuel) * 5) + 50, 100))
}

function nomArtefact(id: number): string {
    return Textes.t(NOMS_ARTEFACTS[Math.clamp(0, NOMBRE_ARTEFACTS - 1, id)])
}

function nomArme(genre: GenreArme): string {
    return Textes.t(NOMS_ARMES[Math.clamp(0, NOMBRE_ARMES - 1, genre)])
}

function nomFin(fin: GenreFin): string {
    return Textes.t(NOMS_FINS[Math.clamp(0, NOMS_FINS.length - 1, fin)])
}

function nomSucces(id: number): string {
    return Textes.t(NOMS_SUCCES[Math.clamp(0, NOMBRE_SUCCES - 1, id)])
}

function infoSucces(id: number): string {
    return Textes.t(INFOS_SUCCES[Math.clamp(0, NOMBRE_SUCCES - 1, id)])
}

function nomTraitMonde(monde: number): string {
    return Textes.t(NOMS_TRAITS_MONDE[Math.clamp(0, NOMBRE_MONDES - 1, monde)])
}

function infoTraitMonde(monde: number): string {
    return Textes.t(INFOS_TRAITS_MONDE[Math.clamp(0, NOMBRE_MONDES - 1, monde)])
}

function pourcentPrixTraitMonde(monde: number): number {
    return tableI16(POURCENT_PRIX_TRAIT_MONDE, Math.clamp(0, NOMBRE_MONDES - 1, monde))
}

function pourcentChantierTraitMonde(monde: number): number {
    return tableI16(POURCENT_CHANTIER_TRAIT_MONDE, Math.clamp(0, NOMBRE_MONDES - 1, monde))
}

function modificateurDangerTraitMonde(monde: number): number {
    return tableI16(DANGER_TRAIT_MONDE, Math.clamp(0, NOMBRE_MONDES - 1, monde))
}

function dangerMondeEffectif(monde: number): number {
    let danger = MONDE_DANGER[monde] + modificateurDangerTraitMonde(monde)
    if (evenementMarcheActifAuMonde(monde) && genreEvenementMarche == GenreEvenementMarche.Blocus) danger++
    return Math.clamp(0, 3, danger)
}

function prixChantierAuMonde(monde: number, prixBase: number): number {
    if (prixBase <= 0) return 0
    return Math.max(1, Math.idiv(prixBase * (100 + pourcentChantierTraitMonde(monde)) + 50, 100))
}

function prixChantierMonde(prixBase: number): number {
    return prixChantierAuMonde(mondeActuel, prixBase)
}

function actualiserEvenementMarche(): void {
    if (genreEvenementMarche != GenreEvenementMarche.Aucun && jourJeu <= finEvenementMarche) return
    let cycle = jourJeu + Math.idiv(graineGalaxie, 37)
    genreEvenementMarche = 1 + hasardGalaxie(cycle, sequenceSauvegarde + 17, 41) % 4
    mondeEvenementMarche = hasardGalaxie(cycle, genreEvenementMarche, 53) % NOMBRE_MONDES_PUBLICS
    marchandiseEvenementMarche = hasardGalaxie(cycle, mondeEvenementMarche, 67) % NOMBRE_MARCHANDISES
    finEvenementMarche = jourJeu + 2 + hasardGalaxie(cycle, marchandiseEvenementMarche, 71) % 3
}

function evenementMarcheActifAuMonde(monde: number): boolean {
    return genreEvenementMarche != GenreEvenementMarche.Aucun &&
        jourJeu <= finEvenementMarche && mondeEvenementMarche == monde
}

function pourcentPrixEvenementMarche(monde: number, marchandise: number): number {
    if (!evenementMarcheActifAuMonde(monde)) return 0
    if (genreEvenementMarche == GenreEvenementMarche.Penurie) return marchandise == marchandiseEvenementMarche ? 42 : 6
    if (genreEvenementMarche == GenreEvenementMarche.Surplus)
        return marchandise == marchandiseEvenementMarche ? -36 : -4
    if (genreEvenementMarche == GenreEvenementMarche.Blocus) return marchandise == marchandiseEvenementMarche ? 30 : 18
    if (genreEvenementMarche == GenreEvenementMarche.Essor) return marchandise == marchandiseEvenementMarche ? 24 : 10
    return 0
}

function nomEvenementMarche(): string {
    if (genreEvenementMarche == GenreEvenementMarche.Penurie) return Textes.t(184)
    if (genreEvenementMarche == GenreEvenementMarche.Surplus) return Textes.t(185)
    if (genreEvenementMarche == GenreEvenementMarche.Blocus) return Textes.t(186)
    if (genreEvenementMarche == GenreEvenementMarche.Essor) return Textes.t(187)
    return Textes.t(32)
}

function infoEvenementMarche(): string {
    if (genreEvenementMarche == GenreEvenementMarche.Aucun || jourJeu > finEvenementMarche) return Textes.t(188)
    let marchandise = Textes.t(NOMS_MARCHANDISES[marchandiseEvenementMarche])
    let monde = NOMS_MONDES[mondeEvenementMarche]
    if (genreEvenementMarche == GenreEvenementMarche.Penurie) return marchandise + Textes.t(189) + monde
    if (genreEvenementMarche == GenreEvenementMarche.Surplus) return marchandise + Textes.t(190) + monde
    if (genreEvenementMarche == GenreEvenementMarche.Blocus) return Textes.t(191) + monde
    return Textes.t(192) + monde
}

function pourcentRecompenseMissionEvenementMarche(monde: number, genre: GenreMission, marchandise: number): number {
    if (!evenementMarcheActifAuMonde(monde)) return 0
    if (genreEvenementMarche == GenreEvenementMarche.Blocus) return 35
    if (genreEvenementMarche == GenreEvenementMarche.Penurie && genre == GenreMission.Livraison &&
        marchandise == marchandiseEvenementMarche) return 45
    if (genreEvenementMarche == GenreEvenementMarche.Essor) return 20
    if (genreEvenementMarche == GenreEvenementMarche.Surplus && genre == GenreMission.Chasse) return 10
    return 5
}

function distanceMonde(depuis: number, vers: number): number {
    let dx = MONDE_X[depuis] - MONDE_X[vers]
    let dy = MONDE_Y[depuis] - MONDE_Y[vers]
    return Math.round(Math.sqrt(dx * dx + dy * dy))
}

function coutSaut(depuis: number, vers: number): number {
    if (depuis == vers) return 0
    return Math.max(1, Math.idiv(distanceMonde(depuis, vers) + 17, 18))
}

function peutAtteindreMonde(monde: number): boolean {
    if (!mondeVisible(monde)) return false
    let cout = coutSaut(mondeActuel, monde)
    return monde != mondeActuel && cout <= coutSautMax() && cout <= carburant
}

function prixLocal(monde: number, marchandise: number): number {
    let economie = MONDE_ECONOMIE[monde]
    let profil = 0
    if (estProduiteParEconomie(marchandise, economie)) profil = -28
    else if (estDemandeeParEconomie(marchandise, economie)) profil = 24
    let bruit = hasardGalaxie(monde, marchandise, jourJeu) % 17 - 8
    let pourcent = 100 + profil + bruit + dangerMondeEffectif(monde) * 3
    pourcent += pourcentPrixTraitMonde(monde) + pourcentPrixEvenementMarche(monde, marchandise)
    if (influenceMarche && influenceMarche.length == NOMBRE_MONDES) pourcent += influenceMarche[monde]
    return Math.max(2, Math.idiv(PRIX_BASE_MARCHANDISE[marchandise] * pourcent + 50, 100))
}

function prixAchatMarche(marchandise: number): number {
    let pourcent = 105 - Math.idiv(reputationFaction(factionMonde(mondeActuel)), 20)
    return Math.max(1, Math.idiv(prixLocal(mondeActuel, marchandise) * pourcent + 99, 100))
}

function prixVenteMarche(marchandise: number): number {
    let pourcent = 95 + Math.idiv(reputationFaction(factionMonde(mondeActuel)), 25)
    return Math.max(1, Math.idiv(prixLocal(mondeActuel, marchandise) * pourcent, 100))
}

function prixAuMonde(monde: number, marchandise: number, achat: boolean): number {
    let local = prixLocal(monde, marchandise)
    let reputation = reputationFaction(factionMonde(monde))
    if (achat) return Math.max(1, Math.idiv(local * (105 - Math.idiv(reputation, 20)) + 99, 100))
    return Math.max(1, Math.idiv(local * (95 + Math.idiv(reputation, 25)), 100))
}

function rafraichirMarche(): void {
    actualiserEvenementMarche()
    if (!stockMarche || stockMarche.length != NOMBRE_MARCHANDISES)
        stockMarche = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    let economie = MONDE_ECONOMIE[mondeActuel]
    for (let marchandise = 0; marchandise < NOMBRE_MARCHANDISES; marchandise++) {
        let graine = hasardGalaxie(mondeActuel, marchandise, jourJeu)
        if (estProduiteParEconomie(marchandise, economie)) stockMarche[marchandise] = 7 + graine % 7
        else if (estDemandeeParEconomie(marchandise, economie)) stockMarche[marchandise] = 1 + graine % 3
        else stockMarche[marchandise] = 4 + graine % 5
        if (influenceMarche && influenceMarche.length == NOMBRE_MONDES) {
            stockMarche[marchandise] = Math.clamp(0, 99,
                stockMarche[marchandise] - Math.idiv(influenceMarche[mondeActuel], 4))
        }
        if (evenementMarcheActifAuMonde(mondeActuel)) {
            if (genreEvenementMarche == GenreEvenementMarche.Penurie && marchandise == marchandiseEvenementMarche)
                stockMarche[marchandise] = Math.max(0, Math.idiv(stockMarche[marchandise], 3))
            else if (genreEvenementMarche == GenreEvenementMarche.Surplus && marchandise == marchandiseEvenementMarche)
                stockMarche[marchandise] = Math.min(99, stockMarche[marchandise] + 9)
            else if (genreEvenementMarche == GenreEvenementMarche.Blocus)
                stockMarche[marchandise] = Math.max(0, Math.idiv(stockMarche[marchandise] + 1, 2))
            else if (genreEvenementMarche == GenreEvenementMarche.Essor && marchandise == marchandiseEvenementMarche)
                stockMarche[marchandise] = Math.max(0, stockMarche[marchandise] - 2)
        }
    }
}

function meilleureMarchandiseCommerce(cible: number): number {
    let meilleureMarchandise = 0
    let meilleureMarge = -9999
    for (let marchandise = 0; marchandise < NOMBRE_MARCHANDISES; marchandise++) {
        let marge = prixAuMonde(cible, marchandise, false) - prixAchatMarche(marchandise)
        if (marge > meilleureMarge) {
            meilleureMarge = marge
            meilleureMarchandise = marchandise
        }
    }
    return meilleureMarchandise
}

function prixAmelioration(id: number, niveauSuivant: number): number {
    if (niveauSuivant == 1) return prixChantierMonde(tableI16(PRIX_AMELIORATION_1, id))
    if (niveauSuivant == 2) return prixChantierMonde(tableI16(PRIX_AMELIORATION_2, id))
    if (niveauSuivant == 3) return prixChantierMonde(tableI16(PRIX_AMELIORATION_3, id))
    return 0
}

function rangRequisCampagne(etape: number): number {
    if (etape < 0 || etape >= NOMBRE_MISSIONS_CAMPAGNE) return 5
    return RANG_REQUIS_CAMPAGNE[etape]
}

function titreCampagne(etape: number): string {
    if (etape < 0 || etape >= NOMBRE_MISSIONS_CAMPAGNE) return Textes.t(88)
    return Textes.t(TITRES_CAMPAGNE[etape])
}

function briefingCampagne(etape: number): string {
    if (etape < 0 || etape >= NOMBRE_MISSIONS_CAMPAGNE) return Textes.t(205)
    return Textes.t(BRIEFINGS_CAMPAGNE[etape])
}

function genreMissionCampagne(etape: number): GenreMission {
    return GENRE_CAMPAGNE[Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape)]
}

function cibleMissionCampagne(etape: number): number {
    return CIBLE_CAMPAGNE[Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape)]
}

function marchandiseMissionCampagne(etape: number): number {
    return MARCHANDISE_CAMPAGNE[Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape)]
}

function varianteMissionCampagne(etape: number): VarianteMission {
    return VARIANTE_CAMPAGNE[Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape)]
}

function quantiteMissionCampagne(etape: number): number {
    return QUANTITE_CAMPAGNE[Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape)]
}

function recompenseMissionCampagne(etape: number): number {
    return tableI16(RECOMPENSE_CAMPAGNE, Math.clamp(0, NOMBRE_MISSIONS_CAMPAGNE - 1, etape))
}

function missionCampagneDisponible(): boolean {
    if (etapeTutoriel < 4 || etapeCampagne < 0 || etapeCampagne >= NOMBRE_MISSIONS_CAMPAGNE) return false
    if (genreMission != GenreMission.Aucun || rangActuel() < rangRequisCampagne(etapeCampagne)) return false
    return mondeActuel != cibleMissionCampagne(etapeCampagne)
}

function campagneTerminee(): boolean {
    return etapeCampagne >= NOMBRE_MISSIONS_CAMPAGNE
}

function avancerEtapeCampagne(): void {
    etapeCampagne = Math.min(NOMBRE_MISSIONS_CAMPAGNE, etapeCampagne + 1)
}

function specialDuJourDisponible(): boolean {
    return aSauvegarde && etapeTutoriel >= 4 && genreMission == GenreMission.Aucun && jourContratDuJour != jourJeu
}

function graineContratDuJour(): number {
    return hasardGalaxie(jourJeu, niveauPartiePlus + 211, 907)
}

function genreContratDuJour(): GenreMission {
    return 1 + graineContratDuJour() % 3
}

function cibleContratDuJour(): number {
    let cible = graineContratDuJour() % NOMBRE_MONDES_PUBLICS
    if (cible == mondeActuel) cible = (cible + 7) % NOMBRE_MONDES_PUBLICS
    return cible
}

function marchandiseContratDuJour(): number {
    return marchandiseMissionPourCible(cibleContratDuJour(), graineContratDuJour())
}

function quantiteContratDuJour(): number {
    if (genreContratDuJour() == GenreMission.Sauvetage) return 1
    return 2 + graineContratDuJour() % 4
}

function recompenseContratDuJour(): number {
    let distance = distanceMonde(mondeActuel, cibleContratDuJour())
    return 400 + distance * 5 + quantiteContratDuJour() * 90 + niveauPartiePlus * 100
}

function echeanceContratDuJour(): number {
    return jourJeu + Math.max(2, Math.idiv(distanceMonde(mondeActuel, cibleContratDuJour()) + 25, 26) + 2)
}

function marquerContratDuJourAccepte(): void {
    jourContratDuJour = jourJeu
    contratDuJourFait = 0
}

function accomplirContratDuJour(): void {
    contratDuJourFait = 1
    ajusterReputation(factionMonde(cibleMission), 3)
}

function campagneOffreMission(emplacement: number): number {
    if (emplacement == NOMBRE_OFFRES_MISSION - 1 && specialDuJourDisponible()) return 3
    if (emplacement != 0) return 0
    if (etapeTutoriel == 1 && mondeActuel == MONDE_DEPART) return 2
    if (missionCampagneDisponible()) return 1
    return 0
}

function graineOffreMission(emplacement: number): number {
    return hasardGalaxie(mondeActuel + emplacement * 7, jourJeu + emplacement * 13, emplacement + 101)
}

function cibleOffreMission(emplacement: number): number {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return 1 // Parcours d'entraînement LUMA -> VEXO.
    if (source == 1) return cibleMissionCampagne(etapeCampagne)
    if (source == 3) return cibleContratDuJour()

    let cible = graineOffreMission(emplacement) % NOMBRE_MONDES_PUBLICS
    let dangerAutorise = Math.min(3, 1 + Math.idiv(rangActuel(), 2))
    for (let i = 0; i < NOMBRE_MONDES_PUBLICS; i++) {
        let candidat = (cible + i * 5 + 1) % NOMBRE_MONDES_PUBLICS
        if (candidat != mondeActuel && dangerMondeEffectif(candidat) <= dangerAutorise) return candidat
    }
    return (mondeActuel + 1) % NOMBRE_MONDES_PUBLICS
}

function genreOffreMission(emplacement: number): GenreMission {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return GenreMission.Livraison
    if (source == 1) return genreMissionCampagne(etapeCampagne)
    if (source == 3) return genreContratDuJour()
    return 1 + (graineOffreMission(emplacement) + emplacement * 2) % 3
}

function marchandiseMissionPourCible(cible: number, graine: number): number {
    let depart = graine % NOMBRE_MARCHANDISES
    let economie = MONDE_ECONOMIE[cible]
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) {
        let marchandise = (depart + i * 5) % NOMBRE_MARCHANDISES
        if (estDemandeeParEconomie(marchandise, economie) &&
            !estProduiteParEconomie(marchandise, MONDE_ECONOMIE[mondeActuel])) return marchandise
    }
    return meilleureMarchandiseCommerce(cible)
}

function marchandiseOffreMission(emplacement: number): number {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return 2
    if (source == 1) return marchandiseMissionCampagne(etapeCampagne)
    if (source == 3) return marchandiseContratDuJour()
    let genre = genreOffreMission(emplacement)
    if (genre == GenreMission.Livraison)
        return marchandiseMissionPourCible(cibleOffreMission(emplacement), graineOffreMission(emplacement))
    if (genre == GenreMission.Sauvetage) return 8
    return 0
}

function varianteOffreMission(emplacement: number): VarianteMission {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return VarianteMission.Standard
    if (source == 1) return varianteMissionCampagne(etapeCampagne)
    if (source == 3) return VarianteMission.Express
    let genre = genreOffreMission(emplacement)
    let tirage = hasardGalaxie(graineOffreMission(emplacement), rangActuel(), 149) % 4
    if (genre == GenreMission.Livraison) {
        if (tirage == 1) return VarianteMission.Fragile
        if (tirage == 2) return VarianteMission.Express
        if (tirage == 3 && rangActuel() >= 2) return VarianteMission.Illegal
    } else if (genre == GenreMission.Chasse) {
        if (tirage == 1 && rangActuel() >= 2) return VarianteMission.As
        if (tirage >= 2) return VarianteMission.SousFeu
    } else if (genre == GenreMission.Sauvetage) {
        if (tirage == 1) return VarianteMission.Express
        if (tirage >= 2) return VarianteMission.SousFeu
    }
    return VarianteMission.Standard
}

function nomVarianteMission(genre: GenreMission, variante: VarianteMission): string {
    if (variante == VarianteMission.Fragile) return Textes.t(207)
    if (variante == VarianteMission.Express) return Textes.t(208)
    if (variante == VarianteMission.Illegal) return Textes.t(209)
    if (variante == VarianteMission.As) return Textes.t(210)
    if (variante == VarianteMission.SousFeu) return Textes.t(211)
    return Textes.t(212)
}

function infoVarianteMission(genre: GenreMission, variante: VarianteMission): string {
    if (variante == VarianteMission.Fragile) return Textes.t(213)
    if (variante == VarianteMission.Express) return Textes.t(214)
    if (variante == VarianteMission.Illegal) return Textes.t(215)
    if (variante == VarianteMission.As) return Textes.t(216)
    if (variante == VarianteMission.SousFeu) return Textes.t(217)
    if (genre == GenreMission.Sauvetage) return Textes.t(218)
    return Textes.t(219)
}

function quantiteOffreMission(emplacement: number): number {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return 1
    if (source == 1) return quantiteMissionCampagne(etapeCampagne)
    if (source == 3) return quantiteContratDuJour()
    let genre = genreOffreMission(emplacement)
    let variante = varianteOffreMission(emplacement)
    if (genre == GenreMission.Sauvetage) return 1
    if (genre == GenreMission.Chasse) {
        if (variante == VarianteMission.As) return 1
        return Math.min(5, 1 + Math.idiv(rangActuel(), 2) + graineOffreMission(emplacement) % 2)
    }
    if (variante == VarianteMission.Fragile) return 1
    return Math.min(5, 1 + Math.idiv(rangActuel(), 2) + graineOffreMission(emplacement) % 3)
}

function recompenseOffreMission(emplacement: number): number {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return 150
    if (source == 3) return recompenseContratDuJour()
    let cible = cibleOffreMission(emplacement)
    let genre = genreOffreMission(emplacement)
    let marchandise = marchandiseOffreMission(emplacement)
    let variante = varianteOffreMission(emplacement)
    let distance = distanceMonde(mondeActuel, cible)
    let danger = dangerMondeEffectif(cible)
    let quantite = quantiteOffreMission(emplacement)
    let recompense = source == 1 ? recompenseMissionCampagne(etapeCampagne) : 0
    if (source == 0 && genre == GenreMission.Livraison) recompense = 70 + distance * 3 + quantite * 35 + danger * 35
    else if (source == 0 && genre == GenreMission.Chasse) recompense = 120 + quantite * 70 + distance * 2 + danger * 45
    else if (source == 0) recompense = 150 + distance * 3 + danger * 55
    let pourcentVariante = 0
    if (variante == VarianteMission.Fragile) pourcentVariante = 35
    else if (variante == VarianteMission.Express) pourcentVariante = 30
    else if (variante == VarianteMission.Illegal) pourcentVariante = 60
    else if (variante == VarianteMission.As) pourcentVariante = 50
    else if (variante == VarianteMission.SousFeu) pourcentVariante = 45
    let pourcentMode = modeJeu == ModeJeu.Veteran ? 15 : (modeJeu == ModeJeu.Fer ? 30 : 0)
    let pourcentEvenement = pourcentRecompenseMissionEvenementMarche(cible, genre, marchandise)
    return Math.idiv(recompense * (100 + pourcentVariante + pourcentMode + pourcentEvenement) + 50, 100)
}

function echeanceOffreMission(emplacement: number): number {
    let source = campagneOffreMission(emplacement)
    if (source == 2) return jourJeu + 5
    if (source == 3) return echeanceContratDuJour()
    let cible = cibleOffreMission(emplacement)
    let sautsEstimes = Math.max(1, Math.idiv(distanceMonde(mondeActuel, cible) + 21, 22))
    let reserve = source == 1 ? 5 : 4
    if (varianteOffreMission(emplacement) == VarianteMission.Express) reserve = 1
    return jourJeu + sautsEstimes + reserve
}

function etiquetteMission(genre: GenreMission): string {
    if (genre == GenreMission.Livraison) return Textes.t(220)
    if (genre == GenreMission.Chasse) return Textes.t(221)
    if (genre == GenreMission.Sauvetage) return Textes.t(222)
    return Textes.t(223)
}

function recompenseMissionConvenue(recompenseBase: number, degre: number): number {
    let pourcent = Math.clamp(-10, 25, degre * 5)
    return Math.max(1, Math.idiv(recompenseBase * (100 + pourcent) + 50, 100))
}

function reussiteMarchandage(graine: number, degre: number): boolean {
    if (degre <= 0) return true
    let habilete = reputationFaction(Faction.Guilde) + ameliorations[AMELIORATION_SCANNER] * 12
    let chance = Math.clamp(10, 90, 70 + habilete - degre * 18)
    return hasardGalaxie(graine, jourJeu, degre + 991) % 100 < chance
}

function marcheNoirDisponible(): boolean {
    return mondeActuel == 12 || mondeActuel == NOMBRE_MONDES_PUBLICS ||
        reputationFaction(Faction.Corsaires) >= 20
}

function prixAchatMarcheNoir(marchandise: number): number {
    if (marchandise < 0 || marchandise >= NOMBRE_MARCHANDISES) return 0
    return Math.max(1, Math.idiv(prixAchatMarche(marchandise) * 88, 100))
}

function prixVenteMarcheNoir(marchandise: number): number {
    if (marchandise < 0 || marchandise >= NOMBRE_MARCHANDISES) return 0
    return Math.max(1, Math.idiv(prixVenteMarche(marchandise) * 125, 100))
}

function noterCommerceMarcheNoir(gain: number): void {
    echangesMarcheNoir = Math.min(COMPTEUR_MAX_SAUVEGARDE, echangesMarcheNoir + 1)
    if (gain > 0) noterGainCommerce(gain)
    ajusterReputation(Faction.Corsaires, 2)
    ajusterReputation(Faction.Union, -1)
    actualiserSucces()
}

// Lit un nombre de 16 bits avec signe dans une table (les tables sont écrites en nombres hexadécimaux dans le code, ce
// qui économise de la mémoire flash).
function tableI16(table: Buffer, indice: number): number {
    return table.getNumber(NumberFormat.Int16LE, indice * 2)
}
