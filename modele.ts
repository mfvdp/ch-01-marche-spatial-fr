// Les règles et l'état du jeu : marché, missions, campagne et succès.
enum Scene {
    Titre,
    Hangar,
    Marche,
    Chantier,
    Missions,
    CarteStellaire,
    Etat,
    Vol,
    Avis,
    SuppressionSauvegarde,
    Intro
}

enum GenreMission {
    Aucun,
    Livraison,
    Chasse,
    Sauvetage
}

enum VarianteMission {
    Standard,
    Fragile,
    Express,
    Illegal,
    As,
    SousFeu
}

enum GenreEvenementMarche {
    Aucun,
    Penurie,
    Surplus,
    Blocus,
    Essor
}

enum RoleVaisseau {
    Marchand,
    Coursier,
    Chasseur
}

enum ModeJeu {
    Standard,
    Veteran,
    Fer
}

enum PhaseVol {
    Lancement,
    Croisiere,
    Rencontre,
    Evenement,
    Approche,
    Accostage,
    Sauvetage
}

enum Faction {
    Union,
    Guilde,
    Conseil,
    Corsaires
}

enum FretRare {
    Relique,
    NoyauReseau,
    GraineAlien
}

enum GenreArme {
    Laser,
    Missile,
    Mine
}

enum ModuleVaisseau {
    Moteur,
    Scanner,
    Armes,
    Fret
}

enum GenreFin {
    Aucun,
    Union,
    CouronneMarchande,
    Explorateur,
    Corsaire
}

// État durable du joueur. Les contenus fixes sont dans donnees.ts et se retrouvent grâce à leur numéro.
let credits = 0
let mondeActuel = 0
let mondeDestination = 0
let jourJeu = 1
let carburant = 0
let coque = 0
let gainCommerce = 0
let totalVictoires = 0
let missionsAccomplies = 0
let missionsEchouees = 0
let fret: number[] = []
let coutFret: number[] = []
let ameliorations: number[] = []
let stockMarche: number[] = []

// Progression et état de la galaxie. sauvegarde.ts range ces valeurs dans la sauvegarde.
let etapeTutoriel = 0
let etapeCampagne = 0
let graineGalaxie = 1
let genreEvenementMarche = GenreEvenementMarche.Aucun
let mondeEvenementMarche = 0
let marchandiseEvenementMarche = 0
let finEvenementMarche = 0
let roleVaisseau = RoleVaisseau.Marchand
let modeJeu = ModeJeu.Standard

// Cet état tient volontairement dans de petites listes de nombres et dans des masques de bits. Ainsi, la mémoire
// pendant le jeu et les trois sauvegardes de l'appareil restent petites.
let reputationsFactions: number[] = []
let choixFin = GenreFin.Aucun
let influenceMarche: number[] = []
let jourMemoireMarche: number[] = []
let marchandiseMemoireMarche: number[] = []
let achatMemoireMarche: number[] = []
let venteMemoireMarche: number[] = []
let tendanceMemoireMarche: number[] = []
let fretsRares: number[] = []
let masqueArtefact = 0
let masqueMondeSecret = 0
let masqueVaisseauxPossedes = 1 << RoleVaisseau.Marchand
let idNomVaisseau: number[] = []
let peintureVaisseau: number[] = []
let masqueSucces = 0
let masqueMondesVisitesBas = 0
let masqueMondesVisitesHaut = 0
let totalSauts = 0
let totalSauvetages = 0
let totalLivraisons = 0
let totalCreditsGagnes = 0
let plusGrandGainCommerce = 0
let victoiresBoss = 0
let echangesMarcheNoir = 0
let evenementsAccomplis = 0
let jourContratDuJour = 0
let contratDuJourFait = 0
let niveauPartiePlus = 0
let armeActive = GenreArme.Laser
let missiles = 3
let mines = 2
let energieArme = 100
// 0 équilibré, 1 bouclier, 2 armes, 3 moteurs.
let modeEnergie = 0
let degatsModule: number[] = []
let vitesseTexte = 1
let contrasteEleve = 0
let secousseCamera = 1
let modeDeveloppeur = 0

// Il n'y a qu'une seule mission active. Ainsi, l'affichage et la sauvegarde restent petits.
let genreMission = GenreMission.Aucun
let origineMission = 0
let cibleMission = 0
let echeanceMission = 0
let recompenseMission = 0
let marchandiseMission = 0
let quantiteMission = 0
let progressionMission = 0
let graineMission = 0
let varianteMission = VarianteMission.Standard
// 0 = normale, 1 = campagne, 2 = entraînement, 3 = contrat du jour.
let sourceMission = 0

// Le point de départ d'un vol est enregistré, pour qu'un redémarrage (reset) puisse recommencer exactement le même vol.
let enTransit = 0
let origineTransit = 0
let cibleTransit = 0
let graineTransit = 0

// L'état de l'affichage ne vaut que pour l'instant et n'est jamais sauvegardé.
let sceneActive = Scene.Titre
let sceneRetour = Scene.Hangar
let indiceMenu = 0
let sommetListe = 0
let entreeVerrouillee = false
let quantiteTransaction = 0
let transactionOuverte = false
let confirmationOuverte = false
let sequenceSauvegarde = 0
let aSauvegarde = false
let sauvegardeEtaitCorrompue = false
let ligneAvis1 = ""
let ligneAvis2 = ""
let ligneAvis3 = ""

// La route prévue ne vaut que pour l'instant : on peut toujours la recalculer à partir de la carte.
let routePrevue: number[] = []
let carburantRoutePrevue = 0
let reporterSauvegardeNouvellePartie = false

function remplirListeNombres(longueur: number, valeur: number): number[] {
    let resultat: number[] = []
    for (let i = 0; i < longueur; i++) resultat.push(valeur)
    return resultat
}

function unitesFret(): number {
    let utilise =
        (genreMission == GenreMission.Livraison || genreMission == GenreMission.Sauvetage) ? quantiteMission : 0
    for (let i = 0; i < NOMBRE_MARCHANDISES; i++) utilise += fret[i]
    for (let i = 0; i < NOMBRE_FRETS_RARES; i++) utilise += fretsRares[i]
    return utilise
}

function capaciteFret(): number {
    return capaciteFretPourRole(roleVaisseau)
}

function capaciteFretPourRole(role: RoleVaisseau): number {
    let penaliteDegats = degatsModule &&
        degatsModule.length > ModuleVaisseau.Fret ? degatsModule[ModuleVaisseau.Fret] : 0
    return Math.max(4, 8 + ameliorations[AMELIORATION_FRET] * 4 +
        (role == RoleVaisseau.Marchand ? 4 : 0) - penaliteDegats * 2)
}

function coqueMax(): number {
    return 8 + ameliorations[AMELIORATION_BLINDAGE] * 3
}

function bouclierMax(): number {
    return 4 + ameliorations[AMELIORATION_BOUCLIER] * 3 + (roleVaisseau == RoleVaisseau.Chasseur ? 3 : 0)
}

function carburantMax(): number {
    let penaliteDegats = degatsModule &&
        degatsModule.length > ModuleVaisseau.Moteur ? degatsModule[ModuleVaisseau.Moteur] : 0
    return Math.max(3, 5 + ameliorations[AMELIORATION_SAUT] +
        (roleVaisseau == RoleVaisseau.Coursier ? 2 : 0) - penaliteDegats)
}

function coutSautMax(): number {
    let penaliteDegats = degatsModule &&
        degatsModule.length > ModuleVaisseau.Moteur ? degatsModule[ModuleVaisseau.Moteur] : 0
    return Math.max(1, 2 + ameliorations[AMELIORATION_SAUT] - Math.idiv(penaliteDegats + 1, 2))
}

function degatsLaser(): number {
    let penaliteDegats = degatsModule &&
        degatsModule.length > ModuleVaisseau.Armes ? degatsModule[ModuleVaisseau.Armes] : 0
    let bonusMode = modeEnergie == 2 ? 1 : 0
    return Math.max(1,
        1 + ameliorations[AMELIORATION_LASER] +
            (roleVaisseau == RoleVaisseau.Chasseur ? 1 : 0) + bonusMode - penaliteDegats)
}

function refroidissementLaser(): number {
    let mode = modeEnergie == 2 ? -60 : (modeEnergie == 1 || modeEnergie == 3 ? 60 : 0)
    return Math.max(160, 440 - ameliorations[AMELIORATION_REFROIDISSEUR] * 100 + mode)
}

function tempsChargeFuite(): number {
    let bonusRole = roleVaisseau == RoleVaisseau.Coursier ? 400 : 0
    let bonusMode = modeEnergie == 3 ? 450 : 0
    let penaliteMoteur = degatsModule &&
        degatsModule.length > ModuleVaisseau.Moteur ? degatsModule[ModuleVaisseau.Moteur] * 220 : 0
    return Math.max(800, 2600 - ameliorations[AMELIORATION_PROPULSEUR] * 500 - bonusRole - bonusMode + penaliteMoteur)
}

function rangRequisRoleVaisseau(role: RoleVaisseau): number {
    if (role == RoleVaisseau.Coursier) return 1
    if (role == RoleVaisseau.Chasseur) return 2
    return 0
}

function roleVaisseauDebloque(role: RoleVaisseau): boolean {
    return vaisseauPossede(role) || rangActuel() >= rangRequisRoleVaisseau(role)
}

function nomRoleVaisseau(role: RoleVaisseau): string {
    if (role == RoleVaisseau.Coursier) return Textes.t(168)
    if (role == RoleVaisseau.Chasseur) return Textes.t(224)
    return Textes.t(170)
}

function infoRoleVaisseau(role: RoleVaisseau): string {
    if (role == RoleVaisseau.Coursier) return Textes.t(225)
    if (role == RoleVaisseau.Chasseur) return Textes.t(226)
    return Textes.t(227)
}

function vaisseauPossede(role: RoleVaisseau): boolean {
    return role >= RoleVaisseau.Marchand && role <= RoleVaisseau.Chasseur &&
        (masqueVaisseauxPossedes & (1 << role)) != 0
}

function coutAchatVaisseau(role: RoleVaisseau): number {
    if (vaisseauPossede(role)) return 0
    if (role == RoleVaisseau.Coursier) return prixChantierMonde(1800)
    if (role == RoleVaisseau.Chasseur) return prixChantierMonde(2600)
    return prixChantierMonde(1200)
}

function choisirVaisseau(role: RoleVaisseau): boolean {
    if (!vaisseauPossede(role) || unitesFret() > capaciteFretPourRole(role)) return false
    roleVaisseau = role
    carburant = Math.min(carburant, carburantMax())
    coque = Math.min(coque, coqueMax())
    effacerRoutePrevue()
    return true
}

function acheterOuChoisirVaisseau(role: RoleVaisseau): boolean {
    if (!vaisseauPossede(role) && !roleVaisseauDebloque(role)) return false
    if (unitesFret() > capaciteFretPourRole(role)) return false
    if (!vaisseauPossede(role)) {
        let cout = coutAchatVaisseau(role)
        if (credits < cout) return false
        credits -= cout
        masqueVaisseauxPossedes |= 1 << role
    }
    return choisirVaisseau(role)
}

function nomAffichageVaisseau(role: RoleVaisseau): string {
    let id = idNomVaisseau && idNomVaisseau.length > role ? idNomVaisseau[role] : role
    return NOMS_VAISSEAUX[Math.clamp(0, NOMBRE_NOMS_VAISSEAU - 1, id)]
}

function parcourirNomVaisseau(role: RoleVaisseau, sens: number): void {
    if (!idNomVaisseau || idNomVaisseau.length != NOMBRE_ROLES_VAISSEAU)
        idNomVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    idNomVaisseau[role] = (idNomVaisseau[role] + sens + NOMBRE_NOMS_VAISSEAU) % NOMBRE_NOMS_VAISSEAU
}

function parcourirPeintureVaisseau(role: RoleVaisseau, sens: number): void {
    if (!peintureVaisseau || peintureVaisseau.length != NOMBRE_ROLES_VAISSEAU)
        peintureVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    peintureVaisseau[role] = (peintureVaisseau[role] + sens + NOMBRE_PEINTURES) % NOMBRE_PEINTURES
}

function nomPeintureVaisseau(role: RoleVaisseau): string {
    let id = peintureVaisseau && peintureVaisseau.length > role ? peintureVaisseau[role] : 0
    return Textes.t(NOMS_PEINTURES[Math.clamp(0, NOMBRE_PEINTURES - 1, id)])
}

function reputationFaction(faction: Faction): number {
    if (!reputationsFactions || reputationsFactions.length != NOMBRE_FACTIONS) return 0
    return reputationsFactions[faction]
}

function ajusterReputation(faction: Faction, sens: number): void {
    if (!reputationsFactions || reputationsFactions.length != NOMBRE_FACTIONS)
        reputationsFactions = remplirListeNombres(NOMBRE_FACTIONS, 0)
    reputationsFactions[faction] = Math.clamp(-100, 100, reputationsFactions[faction] + sens)
}

function changerReputationFaction(faction: Faction, sens: number): void {
    ajusterReputation(faction, sens)
}

function factionDominante(): Faction {
    let meilleureFaction = Faction.Union
    for (let i = 1; i < NOMBRE_FACTIONS; i++)
        if (reputationFaction(i) > reputationFaction(meilleureFaction)) meilleureFaction = i
    return meilleureFaction
}

function choisirFin(fin: GenreFin): boolean {
    if (!finDisponible(fin)) return false
    choixFin = fin
    actualiserSucces()
    return true
}

function finDisponible(fin: GenreFin): boolean {
    if (!campagneTerminee()) return false
    if (fin == GenreFin.Union) return reputationFaction(Faction.Union) >= 20 ||
        factionDominante() == Faction.Union
    if (fin == GenreFin.CouronneMarchande) return reputationFaction(Faction.Guilde) >= 20 ||
        factionDominante() == Faction.Guilde
    if (fin == GenreFin.Explorateur) return reputationFaction(Faction.Conseil) >= 20 ||
        nombreArtefacts() >= 2
    if (fin == GenreFin.Corsaire) return reputationFaction(Faction.Corsaires) >= 20 ||
        factionDominante() == Faction.Corsaires
    return false
}

function mondeVisite(monde: number): boolean {
    if (monde < 0 || monde >= NOMBRE_MONDES) return false
    if (monde < 16) return (masqueMondesVisitesBas & (1 << monde)) != 0
    return (masqueMondesVisitesHaut & (1 << (monde - 16))) != 0
}

function marquerMondeVisite(monde: number): void {
    if (monde < 0 || monde >= NOMBRE_MONDES) return
    if (monde < 16) masqueMondesVisitesBas |= 1 << monde
    else masqueMondesVisitesHaut |= 1 << (monde - 16)
    if (monde >= NOMBRE_MONDES_PUBLICS) masqueMondeSecret |= 1 << (monde - NOMBRE_MONDES_PUBLICS)
    actualiserSucces()
}

function decouvrirMondeSecret(monde: number): boolean {
    if (monde < NOMBRE_MONDES_PUBLICS || monde >= NOMBRE_MONDES) return false
    let avant = masqueMondeSecret
    masqueMondeSecret |= 1 << (monde - NOMBRE_MONDES_PUBLICS)
    return avant != masqueMondeSecret
}

function mondeVisible(monde: number): boolean {
    if (monde < 0 || monde >= NOMBRE_MONDES) return false
    if (monde < NOMBRE_MONDES_PUBLICS) return true
    return (masqueMondeSecret & (1 << (monde - NOMBRE_MONDES_PUBLICS))) != 0
}

function nombreArtefacts(): number {
    let nombre = 0
    for (let i = 0; i < NOMBRE_ARTEFACTS; i++) if ((masqueArtefact & (1 << i)) != 0) nombre++
    return nombre
}

function aArtefact(id: number): boolean {
    return id >= 0 && id < NOMBRE_ARTEFACTS && (masqueArtefact & (1 << id)) != 0
}

function ajouterArtefact(id: number): boolean {
    if (id < 0 || id >= NOMBRE_ARTEFACTS || aArtefact(id)) return false
    masqueArtefact |= 1 << id
    if (nombreArtefacts() >= 2) decouvrirMondeSecret(NOMBRE_MONDES_PUBLICS)
    if (nombreArtefacts() >= NOMBRE_ARTEFACTS) decouvrirMondeSecret(NOMBRE_MONDES_PUBLICS + 1)
    actualiserSucces()
    return true
}

function ajouterFretRare(id: FretRare, quantite: number): boolean {
    if (id < 0 || id >= NOMBRE_FRETS_RARES || quantite <= 0 || unitesFret() + quantite > capaciteFret())
        return false
    fretsRares[id] += quantite
    return true
}

function vendreFretRare(id: FretRare, quantite: number): number {
    if (id < 0 || id >= NOMBRE_FRETS_RARES || quantite <= 0) return 0
    quantite = Math.min(quantite, fretsRares[id])
    let revenu = valeurFretRare(id) * quantite
    fretsRares[id] -= quantite
    credits += revenu
    gainCommerce = Math.min(POINTS_MAX_SAUVEGARDE, gainCommerce + revenu)
    noterGainCommerce(revenu)
    return revenu
}

function appliquerInfluenceCommerceAuMonde(monde: number, marchandise: number, quantiteSignee: number): void {
    if (monde < 0 || monde >= NOMBRE_MONDES || marchandise < 0 ||
        marchandise >= NOMBRE_MARCHANDISES || quantiteSignee == 0) return
    let direction = quantiteSignee > 0 ? 1 : -1
    influenceMarche[monde] = Math.clamp(-20, 20,
        influenceMarche[monde] + direction * Math.min(4, Math.abs(quantiteSignee)))
}

function appliquerInfluenceCommerce(marchandise: number, quantiteSignee: number): void {
    appliquerInfluenceCommerceAuMonde(mondeActuel, marchandise, quantiteSignee)
}

function retenirMarcheActuel(): void {
    let meilleureMarchandise = meilleureMarchandiseCommerce((mondeActuel + 1) % NOMBRE_MONDES_PUBLICS)
    let ancienneVente = venteMemoireMarche[mondeActuel]
    jourMemoireMarche[mondeActuel] = jourJeu
    marchandiseMemoireMarche[mondeActuel] = meilleureMarchandise
    achatMemoireMarche[mondeActuel] = prixAchatMarche(meilleureMarchandise)
    venteMemoireMarche[mondeActuel] = prixVenteMarche(meilleureMarchandise)
    tendanceMemoireMarche[mondeActuel] = ancienneVente == 0 ? 0
        : Math.clamp(-2, 2, venteMemoireMarche[mondeActuel] - ancienneVente)
    marquerMondeVisite(mondeActuel)
}

function marcheConnu(monde: number): boolean {
    return monde >= 0 && monde < NOMBRE_MONDES && jourMemoireMarche[monde] > 0
}

function ageMarcheConnu(monde: number): number { return marcheConnu(monde)
    ? Math.max(0, jourJeu - jourMemoireMarche[monde]) : -1 }
function marchandiseMarcheConnu(monde: number):
    number { return marcheConnu(monde) ? marchandiseMemoireMarche[monde] : -1 }
function achatMarcheConnu(monde: number):
    number { return marcheConnu(monde) ? achatMemoireMarche[monde] : 0 }
function venteMarcheConnu(monde: number): number { return marcheConnu(monde) ? venteMemoireMarche[monde] : 0 }
function tendanceMarcheConnu(monde: number):
    number { return marcheConnu(monde) ? tendanceMemoireMarche[monde] : 0 }

function noterSauvetage(): void {
    totalSauvetages = Math.min(COMPTEUR_MAX_SAUVEGARDE, totalSauvetages + 1)
    actualiserSucces()
}

function noterLivraison(): void {
    totalLivraisons = Math.min(COMPTEUR_MAX_SAUVEGARDE, totalLivraisons + 1)
    actualiserSucces()
}

function noterSaut(): void {
    totalSauts = Math.min(COMPTEUR_MAX_SAUVEGARDE, totalSauts + 1)
    marquerMondeVisite(mondeActuel)
}

function noterEvenement(): void {
    evenementsAccomplis = Math.min(COMPTEUR_MAX_SAUVEGARDE, evenementsAccomplis + 1)
    actualiserSucces()
}

function noterGainCommerce(quantite: number): void {
    if (quantite <= 0) return
    plusGrandGainCommerce = Math.max(plusGrandGainCommerce, quantite)
    totalCreditsGagnes = Math.min(POINTS_MAX_SAUVEGARDE, totalCreditsGagnes + quantite)
    actualiserSucces()
}

function succesDebloque(id: number): boolean {
    return id >= 0 && id < NOMBRE_SUCCES && (masqueSucces & (1 << id)) != 0
}

function debloquerSucces(id: number): boolean {
    if (id < 0 || id >= NOMBRE_SUCCES || succesDebloque(id)) return false
    masqueSucces |= 1 << id
    return true
}

function nombreMondesVisites(): number {
    let resultat = 0
    for (let i = 0; i < NOMBRE_MONDES; i++) if (mondeVisite(i)) resultat++
    return resultat
}

function actualiserSucces(): void {
    if (totalSauts >= 1) debloquerSucces(0)
    if (gainCommerce >= 1000) debloquerSucces(1)
    if (totalVictoires >= 10) debloquerSucces(2)
    if (totalSauvetages >= 5) debloquerSucces(3)
    if (nombreMondesVisites() >= NOMBRE_MONDES_PUBLICS) debloquerSucces(4)
    if (masqueVaisseauxPossedes == 7) debloquerSucces(5)
    if (nombreArtefacts() >= NOMBRE_ARTEFACTS) debloquerSucces(6)
    if (echangesMarcheNoir >= 5) debloquerSucces(7)
    if (campagneTerminee()) debloquerSucces(8)
    if (choixFin != GenreFin.Aucun) debloquerSucces(9)
    if (niveauPartiePlus > 0) debloquerSucces(10)
    if (pointsJeu() >= 50000) debloquerSucces(11)
}

function parcourirArme(sens: number): void {
    armeActive = (armeActive + sens + NOMBRE_ARMES) % NOMBRE_ARMES
}

function utiliserMissile(): boolean {
    if (missiles <= 0 || energieArme < 20 || degatsModule[ModuleVaisseau.Armes] >= 3) return false
    missiles--
    energieArme -= 20
    return true
}

function utiliserMine(): boolean {
    if (mines <= 0 || energieArme < 12 || degatsModule[ModuleVaisseau.Armes] >= 3) return false
    mines--
    energieArme -= 12
    return true
}

function restaurerEnergieArme(quantite: number): void {
    if (quantite > 0) energieArme = Math.min(100, energieArme + quantite)
}

function nomModeEnergie(): string {
    if (modeEnergie == 1) return Textes.t(160)
    if (modeEnergie == 2) return Textes.t(117)
    if (modeEnergie == 3) return Textes.t(115)
    return Textes.t(228)
}

function parcourirModeEnergie(sens: number): void {
    modeEnergie = (modeEnergie + sens + 4) % 4
}

function endommagerModule(module: ModuleVaisseau, quantite: number): void {
    if (module < 0 || module >= NOMBRE_MODULES_VAISSEAU || quantite <= 0) return
    degatsModule[module] = Math.clamp(0, 3, degatsModule[module] + quantite)
    carburant = Math.min(carburant, carburantMax())
}

function reparerModules(): void {
    for (let i = 0; i < NOMBRE_MODULES_VAISSEAU; i++) degatsModule[i] = 0
}

function nomDegatsModule(module: ModuleVaisseau): string {
    let niveau = degatsModule[module]
    if (niveau >= 3) return Textes.t(229)
    if (niveau == 2) return Textes.t(230)
    if (niveau == 1) return Textes.t(231)
    return Textes.t(232)
}

function effacerRoutePrevue(): void {
    routePrevue = []
    carburantRoutePrevue = 0
}

function planifierRouteVers(cible: number): boolean {
    effacerRoutePrevue()
    if (cible < 0 || cible >= NOMBRE_MONDES || !mondeVisible(cible)) return false
    if (cible == mondeActuel) {
        routePrevue.push(mondeActuel)
        return true
    }
    let precedent = remplirListeNombres(NOMBRE_MONDES, -2)
    let file: number[] = []
    file.push(mondeActuel)
    precedent[mondeActuel] = -1
    let tete = 0
    while (tete < file.length && precedent[cible] == -2) {
        let depuis = file[tete++]
        for (let vers = 0; vers < NOMBRE_MONDES; vers++) {
            if (!mondeVisible(vers) || precedent[vers] != -2 || vers == depuis) continue
            let cout = coutSaut(depuis, vers)
            if (cout > coutSautMax()) continue
            if (depuis == mondeActuel && cout > carburant) continue
            precedent[vers] = depuis
            file.push(vers)
            if (vers == cible) break
        }
    }
    if (precedent[cible] == -2) return false
    let inverse: number[] = []
    let curseur = cible
    while (curseur >= 0) {
        inverse.push(curseur)
        curseur = precedent[curseur]
    }
    for (let i = inverse.length - 1; i >= 0; i--) routePrevue.push(inverse[i])
    for (let i = 1; i < routePrevue.length; i++)
        carburantRoutePrevue += coutSaut(routePrevue[i - 1], routePrevue[i])
    return true
}

function nombreBondsRoute(): number { return Math.max(0, routePrevue.length - 1) }
function coutCarburantRoute(): number { return carburantRoutePrevue }
function mondeEtapeRoute(indice: number): number { return indice >= 0 &&
    indice < routePrevue.length ? routePrevue[indice] : -1 }

function parcourirVitesseTexte(sens: number): void { vitesseTexte = (vitesseTexte + sens + 3) % 3 }
function nomVitesseTexte(): string { return vitesseTexte == 0 ? Textes.t(233)
    : (vitesseTexte == 2 ? Textes.t(234) : Textes.t(235)) }
function basculerContrasteEleve(): void { contrasteEleve = contrasteEleve == 0 ? 1 : 0 }
function basculerSecousseCamera(): void { secousseCamera = secousseCamera == 0 ? 1 : 0 }
function basculerModeDeveloppeur(): void { modeDeveloppeur = modeDeveloppeur == 0 ? 1 : 0 }

function nomEtapeTutoriel(): string {
    if (etapeTutoriel == 1) return Textes.t(236)
    if (etapeTutoriel == 2) return Textes.t(237)
    if (etapeTutoriel == 3) return Textes.t(238)
    if (etapeTutoriel >= 4) return Textes.t(239)
    return Textes.t(240)
}

function nomModeJeu(mode: ModeJeu): string {
    if (mode == ModeJeu.Veteran) return Textes.t(241)
    if (mode == ModeJeu.Fer) return Textes.t(242)
    return Textes.t(212)
}

function rangActuel(): number {
    let points = gainCommerce + missionsAccomplies * 100 + totalVictoires * 25
    if (points >= 30000) return 5
    if (points >= 12000) return 4
    if (points >= 5000) return 3
    if (points >= 2000) return 2
    if (points >= 600) return 1
    return 0
}

function nomRang(): string {
    return Textes.t(NOMS_RANGS[rangActuel()])
}

function pointsJeu(): number {
    return gainCommerce + missionsAccomplies * 100 + totalVictoires * 25
}

function lancerNouvellePartie(): void {
    credits = 500
    mondeActuel = MONDE_DEPART
    mondeDestination = MONDE_DEPART
    jourJeu = 1
    gainCommerce = 0
    totalVictoires = 0
    missionsAccomplies = 0
    missionsEchouees = 0
    etapeTutoriel = 1
    etapeCampagne = 0
    graineGalaxie = 1 + hasardFixe(game.runtime(), sequenceSauvegarde + 1, 2026) % 32748
    genreEvenementMarche = GenreEvenementMarche.Aucun
    mondeEvenementMarche = MONDE_DEPART
    marchandiseEvenementMarche = 0
    finEvenementMarche = 0
    roleVaisseau = RoleVaisseau.Marchand
    modeJeu = ModeJeu.Standard
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
    masqueVaisseauxPossedes = 1 << RoleVaisseau.Marchand
    idNomVaisseau = [0, 1, 2]
    peintureVaisseau = remplirListeNombres(NOMBRE_ROLES_VAISSEAU, 0)
    masqueSucces = 0
    masqueMondesVisitesBas = 1 << MONDE_DEPART
    masqueMondesVisitesHaut = 0
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
    fret = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    coutFret = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    ameliorations = remplirListeNombres(NOMBRE_AMELIORATIONS, 0)
    stockMarche = remplirListeNombres(NOMBRE_MARCHANDISES, 0)
    carburant = carburantMax()
    coque = coqueMax()
    effacerMission()
    enTransit = 0
    origineTransit = MONDE_DEPART
    cibleTransit = MONDE_DEPART
    graineTransit = 0
    rafraichirMarche()
    retenirMarcheActuel()
    effacerRoutePrevue()
    if (!reporterSauvegardeNouvellePartie) {
        enregistrerSauvegarde()
        aSauvegarde = true
    }
}

function peutLancerPartiePlus(): boolean {
    return campagneTerminee() && choixFin != GenreFin.Aucun && niveauPartiePlus < 9
}

function lancerPartiePlus(): boolean {
    if (!peutLancerPartiePlus()) return false
    let ancienNiveau = niveauPartiePlus
    let ancienPossede = masqueVaisseauxPossedes
    let anciensNoms = idNomVaisseau
    let anciennePeinture = peintureVaisseau
    let anciensSucces = masqueSucces
    let anciensArtefacts = masqueArtefact
    let anciensSecrets = masqueMondeSecret
    let anciennesStats =
        [totalSauts, totalSauvetages, totalLivraisons, totalCreditsGagnes, plusGrandGainCommerce,
        victoiresBoss, echangesMarcheNoir, evenementsAccomplis]
    let ancienMode = modeJeu
    reporterSauvegardeNouvellePartie = true
    lancerNouvellePartie()
    reporterSauvegardeNouvellePartie = false
    niveauPartiePlus = Math.min(9, ancienNiveau + 1)
    masqueVaisseauxPossedes = ancienPossede
    idNomVaisseau = anciensNoms
    peintureVaisseau = anciennePeinture
    masqueSucces = anciensSucces
    masqueArtefact = anciensArtefacts
    masqueMondeSecret = anciensSecrets
    totalSauts = anciennesStats[0]
    totalSauvetages = anciennesStats[1]
    totalLivraisons = anciennesStats[2]
    totalCreditsGagnes = anciennesStats[3]
    plusGrandGainCommerce = anciennesStats[4]
    victoiresBoss = anciennesStats[5]
    echangesMarcheNoir = anciennesStats[6]
    evenementsAccomplis = anciennesStats[7]
    modeJeu = ancienMode
    etapeTutoriel = 4
    credits = 1000 + niveauPartiePlus * 500
    for (let i = 0; i < NOMBRE_AMELIORATIONS; i++) if (MAX_AMELIORATION[i] > 0) ameliorations[i] = 1
    carburant = carburantMax()
    coque = coqueMax()
    actualiserSucces()
    enregistrerSauvegarde()
    return true
}

function effacerMission(): void {
    genreMission = GenreMission.Aucun
    origineMission = 0
    cibleMission = 0
    echeanceMission = 0
    recompenseMission = 0
    marchandiseMission = 0
    quantiteMission = 0
    progressionMission = 0
    graineMission = 0
    varianteMission = VarianteMission.Standard
    sourceMission = 0
}

function reglerScene(suivant: Scene): void {
    sceneActive = suivant
    indiceMenu = 0
    sommetListe = 0
    transactionOuverte = false
    quantiteTransaction = 0
    confirmationOuverte = false
    entreeVerrouillee = true
}

function afficherAvis(ligne1: string, ligne2: string, ligne3: string, versScene: Scene): void {
    ligneAvis1 = ligne1
    ligneAvis2 = ligne2
    ligneAvis3 = ligne3
    sceneRetour = versScene
    reglerScene(Scene.Avis)
}

function toutesTouchesRelachees(): boolean {
    return !controller.up.isPressed()
        && !controller.down.isPressed()
        && !controller.left.isPressed()
        && !controller.right.isPressed()
        && !controller.A.isPressed()
        && !controller.B.isPressed()
}
