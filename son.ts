// Conception sonore centrale pour le haut-parleur du Calliope mini 3 et du GameKit. De courtes notes aiguës sont bien
// plus nettes sur le petit haut-parleur intégré que des clics graves.
const CLE_REGLAGE_SON = "ot.sound.level"
const CLE_DENSITE_EFFET = "ot.sound.fx"
const VOLUMES_CRAN_SON = hex`0060a8e6`
const NOMS_CRAN_SON = hex`c9007002eb007102`
const NOMS_DENSITE_EFFET = hex`2000eb007202`
// Nombre de niveaux de densité. NOMS_DENSITE_EFFET se compose d'entrées de 16 bits ; sa longueur est donc le double
// de cette valeur.
const NOMBRE_DENSITE_EFFET = 3
const CRAN_SON_DEFAUT = 2
const DENSITE_EFFET_DEFAUT = 1
const TEMPO_FILM_THEME_INTRO = 120
// Comme le lecteur de mélodies de MakeCode, jouerThemeIntro utilise des tics entiers : floor(15000 / tempo). 159 BPM
// donnent 94 ms par unité de durée, donc 48,128 s pour cette partition de 512 unités.
const TEMPO_NORMAL_THEME_INTRO = 159
// Lu nulle part dans le jeu ; le thème de l'intro, plus bas, dure 512 unités de durée.
const BATTEMENTS_THEME_INTRO = 128
const NOTES_SON_CONFIRMATION = [1319, 1760]
const NOTES_SON_RUPTURE_BOUCLIER = [2093, 1568, 1047, 740]
const NOTES_SON_ALARME = [2093, 0, 2093]
// Le thème de l'intro sous forme de paires d'octets (note, durée) : note = indice de music.lookupFrequency, 0 =
// silence ; la durée compte des unités du tempo. Les deux tempos (FILM et NORMAL) jouent les mêmes notes. Des octets au
// lieu d'objets Melody économisent de la mémoire.
const THEME_INTRO = hex`3a023d024104460841043d0438043a043a0841043d043a043d044108440441043f043d044604440441083f0441044404460841043f043d043a023a023d023a0241023a023d023a02380238023c0238023f0238023c0238023a023a023d023f0241023f023d023c023a0841043d043a0838043a043d04410846043a023a023d023f0241043f043d043a0438083a043d044108000441044404460449084604440441043f0441024402460441083a023a023d023a023f023d023a0238023a043d0441043f043d043c043a043804350238023c023f02410446083a023c023d023f02410242024402460248024902460448044910460841043d043a043d044104440446083a023d0241024604440441043d083a06`
let generationThemeIntro = 0
let sceneAmbianceSonore = -1
let phaseAmbianceSonore = -1
let mondeAmbianceSonore = -1
let sonAmbianceSuivantMs = 0
let generationSon = 0
let cranSon = CRAN_SON_DEFAUT
let densiteEffet = DENSITE_EFFET_DEFAUT
let motifsJeuActifs = 0
let sonConfirmationSuivantMs = 0
let sonRuptureBouclierSuivantMs = 0
let sonAlarmeSuivantMs = 0

// Arrête tous les sons du mélangeur en cours : c'est l'appel natif qui se trouve dans music.stopAllSounds(). Le jeu ne
// démarre jamais d'objets Melody, de morceaux ni de lectures en boucle ; le reste de stopAllSounds n'avait donc rien à
// arrêter. Le thème de l'intro s'arrête avec generationThemeIntro.
//% shim=music::stopPlaying
function arretMelangeur(): void { }

function arreterSonsJeu(): void {
    generationSon++
    motifsJeuActifs = 0
    generationThemeIntro++
    arretMelangeur()
}

function cranSonPourVolume(volume: number): number {
    for (let i = 0; i < VOLUMES_CRAN_SON.length; i++) {
        if (VOLUMES_CRAN_SON[i] == volume) return i
    }
    return CRAN_SON_DEFAUT
}

function preparerSon(): void {
    arreterSonsJeu()
    if (settings.exists(CLE_REGLAGE_SON))
        cranSon = cranSonPourVolume(settings.readNumber(CLE_REGLAGE_SON))
    else cranSon = CRAN_SON_DEFAUT
    if (settings.exists(CLE_DENSITE_EFFET)) {
        let densiteMemorisee = Math.round(settings.readNumber(CLE_DENSITE_EFFET))
        densiteEffet = densiteMemorisee >= 0 && densiteMemorisee <= 2 ? densiteMemorisee : DENSITE_EFFET_DEFAUT
    } else densiteEffet = DENSITE_EFFET_DEFAUT
    music.setVolume(VOLUMES_CRAN_SON[cranSon])
    sceneAmbianceSonore = -1
    phaseAmbianceSonore = -1
    mondeAmbianceSonore = -1
    sonAmbianceSuivantMs = 0
}

function parcourirCranSon(sens: number): void {
    let suivant = (cranSon + sens) % VOLUMES_CRAN_SON.length
    if (suivant < 0) suivant += VOLUMES_CRAN_SON.length
    if (suivant == cranSon) return
    arreterSonsJeu()
    cranSon = suivant
    let volume = VOLUMES_CRAN_SON[cranSon]
    music.setVolume(volume)
    settings.writeNumber(CLE_REGLAGE_SON, volume)
    sonAmbianceSuivantMs = game.runtime() + 250
}

function nomCranSon(): string {
    return Textes.t(tableI16(NOMS_CRAN_SON, cranSon))
}

function parcourirDensiteEffet(sens: number): void {
    let suivant = (densiteEffet + sens) % NOMBRE_DENSITE_EFFET
    if (suivant < 0) suivant += NOMBRE_DENSITE_EFFET
    if (suivant == densiteEffet) return
    densiteEffet = suivant
    settings.writeNumber(CLE_DENSITE_EFFET, densiteEffet)
    sonAmbianceSuivantMs = game.runtime() + 350
}

function nomDensiteEffet(): string {
    return Textes.t(tableI16(NOMS_DENSITE_EFFET, densiteEffet))
}

function limiteMotifsEffet(): number {
    // Un, deux ou trois motifs courts en même temps. Même DENSE reste en dessous de la charge des canaux, qui
    // provoquait des coupures sur le Calliope mini 3.
    return densiteEffet + 1
}

function attenteAmbiance(attenteBaseMs: number): number {
    if (densiteEffet == 0) return Math.idiv(attenteBaseMs * 16, 10)
    if (densiteEffet == 2) return Math.idiv(attenteBaseMs * 7, 10)
    return attenteBaseMs
}

function frequenceAudible(frequence: number): number {
    if (frequence <= 0) return 700
    while (frequence < 700) frequence *= 2
    return Math.clamp(700, 2200, frequence)
}

// Tourne dans un processus d'arrière-plan (fibre) et ne ralentit pas l'animation (exactement ce que faisait
// music.tonePlayable avec PlaybackMode.InBackground, sans lier les classes Playable).
function jouerNoteJeu(frequence: number, duree: number): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    let hauteurNote = frequenceAudible(frequence)
    let longueur = Math.max(70, duree)
    control.runInParallel(function () { music.playTone(hauteurNote, longueur) })
}

function jouerMotifJeu(notes: number[], duree: number, ecart: number): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0 || motifsJeuActifs >= limiteMotifsEffet()) return
    let generation = generationSon
    motifsJeuActifs++
    control.runInParallel(function () {
        for (let i = 0; i < notes.length; i++) {
            if (generation != generationSon) return
            if (notes[i] > 0) music.playTone(frequenceAudible(notes[i]), Math.max(70, duree))
            else pause(Math.max(70, duree))
            if (ecart > 0 && i < notes.length - 1) pause(ecart)
        }
        if (generation == generationSon) motifsJeuActifs = Math.max(0, motifsJeuActifs - 1)
    })
}

function jouerGlissandoJeu(onde: WaveShape, frequenceDepart: number, frequenceFin: number, duree: number,
    effet: SoundExpressionEffect): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    music.playInstructions(0,
        tamponGlissandoJeu(onde, frequenceDepart, frequenceFin, duree, effet, music.volume()))
}

// Construit le même tampon d'instructions que music.soundToInstructionBuffer(wave, start, end, 180, 0, duree, effet,
// InterpolationCurve.Curve, 20, 1, volumeGlobal) d'Arcade 4.2.1, sans les classes SoundEffect.
function tamponGlissandoJeu(onde: WaveShape, frequenceDepart: number, frequenceFin: number, duree: number,
    effet: SoundExpressionEffect, volumeGlobal: number): Buffer {
    const volumeDepart = 180
    const volumeFin = 0
    let pasEffet = Math.min(20, Math.floor(duree / 5))
    let trancheTemps = duree / pasEffet
    let frequences: number[] = []
    let volumes: number[] = []
    for (let i = 0; i < pasEffet; i++) {
        let t = i * trancheTemps
        let frequence = frequenceDepart + (frequenceFin - frequenceDepart) *
            Math.sin(t / duree * (Math.PI / 2))
        let volume =
            ((volumeDepart + t * (volumeFin - volumeDepart) / duree) / 255) * volumeGlobal
        if (effet === SoundExpressionEffect.Tremolo) {
            if (i % 2 === 0) volume = Math.max(volume - 500, 0)
            else volume = Math.min(volume + 500, 1023)
        } else if (effet === SoundExpressionEffect.Vibrato) {
            if (i % 2 === 0) frequence = Math.max(frequence - 100, 0)
            else frequence = frequence + 100
        } else if (effet === SoundExpressionEffect.Warble) {
            if (i % 2 === 0) frequence = Math.max(frequence - 1000, 0)
            else frequence = frequence + 1000
        }
        frequences.push(frequence)
        volumes.push(volume)
    }
    let sortie = control.createBuffer(12 * (pasEffet - 1))
    let dureePasMs = Math.floor(duree / (pasEffet - 1))
    // Forme d'onde en valeur : sinus 3, dent de scie 2, triangle 1, carré 15, bruit 18 (indice = WaveShape).
    let valeurOnde = hex`0302010f12`[onde]
    for (let i = 0; i < pasEffet - 1; i++) {
        let decalage = i * 12
        sortie.setNumber(NumberFormat.UInt8LE, decalage, valeurOnde)
        sortie.setNumber(NumberFormat.UInt16LE, decalage + 2, frequences[i])
        sortie.setNumber(NumberFormat.UInt16LE, decalage + 4, dureePasMs)
        sortie.setNumber(NumberFormat.UInt16LE, decalage + 6, volumes[i])
        sortie.setNumber(NumberFormat.UInt16LE, decalage + 8, volumes[i + 1])
        sortie.setNumber(NumberFormat.UInt16LE, decalage + 10, frequences[i + 1])
    }
    return sortie
}

function lancerMusiqueIntro(): void {
    arreterSonsJeu()
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    jouerThemeIntro(introUtiliseTempoFilm() ? TEMPO_FILM_THEME_INTRO : TEMPO_NORMAL_THEME_INTRO)
}

// Même planification et même volume que music.MelodyPlayer.play pour une simple liste de notes (onde
// triangulaire, sans enveloppe).
function jouerThemeIntro(tempo: number): void {
    let generation = generationThemeIntro
    let volume = Math.clamp(0, 255, (music.volume() * music.volume()) >> 8)
    control.runInParallel(function () {
        let battement = Math.idiv(15000, tempo)
        let tempsDepartMs = control.millis()
        let positionTemps = 0
        let instant = 0
        for (let i = 0; i < THEME_INTRO.length; i += 2) {
            if (generation != generationThemeIntro) return
            let ms = THEME_INTRO[i + 1] * battement
            let cle = THEME_INTRO[i]
            if (cle > 0) {
                let hz = music.lookupFrequency(cle)
                let note = control.createBuffer(13)
                music.addNote(note, 0, ms, 255, 255, 1, hz, volume, hz)
                music.playInstructions(positionTemps - instant, note.slice(0, 12))
            }
            positionTemps += ms
            let tempsRestant = positionTemps - instant
            if (tempsRestant > 200) {
                pause(tempsRestant - 100)
                instant = control.millis() - tempsDepartMs
            }
        }
    })
}

function sonReperePrologue(repere: number): void {
    if (repere == 0) jouerMotifJeu([880, 1047, 1319], 85, 30)
    else if (repere == 1) jouerGlissandoJeu(WaveShape.Noise, 1500, 480, 420, SoundExpressionEffect.Tremolo)
    else if (repere == 2) sonRencontre()
    else jouerMotifJeu([988, 1319, 1760], 105, 35)
}

function sonRepereIntro(repere: number): void {
    if (repere == 0) return
    else if (repere == 1) jouerMotifJeu([1568, 2093], 75, 20)
    else if (repere == 2) jouerGlissandoJeu(WaveShape.Sawtooth, 760, 520, 380, SoundExpressionEffect.Tremolo)
    else if (repere == 3) jouerGlissandoJeu(WaveShape.Sawtooth, 520, 1450, 480, SoundExpressionEffect.Vibrato)
    else if (repere == 4) jouerGlissandoJeu(WaveShape.Square, 740, 1950, 520, SoundExpressionEffect.Warble)
    else if (repere == 5) jouerMotifJeu([1319, 0, 1760], 85, 45)
    else if (repere == 6) sonRencontre()
    else if (repere == 7) sonVerrouillageEnnemi()
    else if (repere == 8) jouerGlissandoJeu(WaveShape.Square, 2200, 900, 160, SoundExpressionEffect.None)
    else if (repere == 9) jouerGlissandoJeu(WaveShape.Noise, 1150, 420, 260, SoundExpressionEffect.Tremolo)
    else if (repere == 10) jouerGlissandoJeu(WaveShape.Noise, 900, 180, 480, SoundExpressionEffect.Warble)
    else if (repere == 11) sonSignalSauvetage()
    else if (repere == 12) jouerGlissandoJeu(WaveShape.Sawtooth, 740, 1200, 420, SoundExpressionEffect.Vibrato)
    else if (repere == 13) jouerGlissandoJeu(WaveShape.Sawtooth, 920, 1720, 440, SoundExpressionEffect.Vibrato)
    else if (repere == 14) jouerGlissandoJeu(WaveShape.Square, 1250, 2200, 560, SoundExpressionEffect.Warble)
    else if (repere == 15) jouerMotifJeu([988, 1319], 100, 35)
    else if (repere == 16) jouerMotifJeu([1175, 1568], 90, 35)
    else if (repere == 17) jouerMotifJeu([1319, 1568], 85, 25)
    else if (repere == 18) jouerMotifJeu([1568, 1760], 85, 20)
    else jouerMotifJeu([1760, 2093], 95, 20)
}

function sonTitre(): void {
    arreterSonsJeu()
    jouerMotifJeu([880, 1047, 1319, 1760], 115, 25)
}

function sonNavigation(): void {
    jouerNoteJeu(1175, 70)
}

// Action positive du menu : les deux dernières notes du son de mission, plus courtes et avec une pause plus petite.
function sonConfirmation(): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    let instant = game.runtime()
    if (instant < sonConfirmationSuivantMs) return
    sonConfirmationSuivantMs = instant + 140
    jouerMotifJeu(NOTES_SON_CONFIRMATION, 70, 15)
}

// Effondrement du bouclier du joueur. La ligne descendante reste nette même sous le bruit du combat.
function sonRuptureBouclier(): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    let instant = game.runtime()
    if (instant < sonRuptureBouclierSuivantMs) return
    sonRuptureBouclierSuivantMs = instant + 600
    jouerMotifJeu(NOTES_SON_RUPTURE_BOUCLIER, 70, 8)
}

// Alerte critique. On peut l'appeler à chaque image ; au plus une impulsion toutes les 900 ms est acceptée.
function sonAlarme(): void {
    if (VOLUMES_CRAN_SON[cranSon] == 0) return
    let instant = game.runtime()
    if (instant < sonAlarmeSuivantMs) return
    sonAlarmeSuivantMs = instant + 900
    jouerMotifJeu(NOTES_SON_ALARME, 70, 35)
}

function sonAchat(): void {
    jouerMotifJeu([1319, 1760], 80, 20)
}

function sonVente(): void {
    jouerMotifJeu([1568, 1175], 80, 20)
}

function sonMission(): void {
    jouerMotifJeu([988, 1319, 1760], 95, 20)
}

function sonErreur(): void {
    jouerMotifJeu([784, 740], 120, 20)
}

function sonLancement(): void {
    jouerMotifJeu([740, 880, 1175, 1568], 95, 20)
}

function sonCroisiere(): void {
    jouerMotifJeu([880, 988], 80, 20)
}

function sonRencontre(): void {
    jouerMotifJeu([740, 988, 740], 110, 45)
}

function sonVerrouillageEnnemi(): void {
    jouerMotifJeu([1760, 1760], 70, 55)
}

function sonSignalSauvetage(): void {
    jouerMotifJeu([1319, 0, 1319], 100, 30)
}

function sonSauvetageReussi(): void {
    jouerMotifJeu([988, 1319, 1760], 100, 25)
}

function sonApproche(): void {
    jouerMotifJeu([1175, 1319], 90, 30)
}

function sonFuite(): void {
    jouerMotifJeu([880, 1175, 1568], 90, 20)
}

function sonLaser(impact: boolean): void {
    if (impact) jouerMotifJeu([2093, 1568], 70, 5)
    else jouerNoteJeu(1760, 75)
}

function sonExplosion(): void {
    jouerMotifJeu([1047, 880, 740], 110, 10)
}

function sonDegats(): void {
    jouerMotifJeu([784, 740], 115, 15)
}

function sonVaisseauDetruit(): void {
    arreterSonsJeu()
    jouerMotifJeu([1047, 880, 784, 740], 150, 25)
}

function hauteurNoteStation(frequenceBase: number, monde: number): number {
    let variation = Math.clamp(0, NOMBRE_MONDES - 1, monde) % 3
    if (variation == 1) return Math.idiv(frequenceBase * 9, 8)
    if (variation == 2) return Math.idiv(frequenceBase * 5, 4)
    return frequenceBase
}

function jouerMotifStation(monde: number): void {
    let mondeSur = Math.clamp(0, NOMBRE_MONDES - 1, monde)
    let famille = factionMonde(mondeSur)
    let battement = 82 + (mondeSur % 2) * 18
    if (famille == 0) {
        jouerMotifJeu([hauteurNoteStation(740, mondeSur), hauteurNoteStation(988, mondeSur),
            hauteurNoteStation(1175, mondeSur)], battement, 24)
    } else if (famille == 1) {
        jouerMotifJeu([hauteurNoteStation(784, mondeSur), hauteurNoteStation(1175, mondeSur), 0,
            hauteurNoteStation(988, mondeSur)], battement, 18)
    } else if (famille == 2) {
        jouerMotifJeu([hauteurNoteStation(880, mondeSur), hauteurNoteStation(1047, mondeSur),
            hauteurNoteStation(1319, mondeSur), hauteurNoteStation(1047, mondeSur)], battement, 14)
    } else {
        jouerMotifJeu([hauteurNoteStation(740, mondeSur), hauteurNoteStation(880, mondeSur),
            hauteurNoteStation(740, mondeSur), hauteurNoteStation(1319, mondeSur)], battement, 20)
    }
}

function sonQuai(): void {
    jouerMotifStation(mondeActuel)
}

function estAmbianceSonoreStation(): boolean {
    return sceneActive == Scene.Hangar || sceneActive == Scene.Marche ||
        sceneActive == Scene.Chantier ||
        sceneActive == Scene.Missions ||
            sceneActive == Scene.CarteStellaire || sceneActive == Scene.Etat
}

// Une ambiance sonore clairsemée garde les stations et le vol vivants sans couvrir les effets importants. Les menus
// d'une même station partagent une ambiance : changer vite de menu ne peut donc ni relancer les motifs ni créer des
// fibres en plus.
function actualiserAmbianceSonore(): void {
    let phase = sceneActive == Scene.Vol ? phaseVol : -1
    let instant = game.runtime()
    let sceneStation = estAmbianceSonoreStation()
    let groupeScene = sceneStation ? 100 : sceneActive
    let monde = sceneStation ? mondeActuel : -1
    if (sceneAmbianceSonore != groupeScene || phaseAmbianceSonore != phase || mondeAmbianceSonore != monde) {
        sceneAmbianceSonore = groupeScene
        phaseAmbianceSonore = phase
        mondeAmbianceSonore = monde
        sonAmbianceSuivantMs = instant + 900
    }
    if (instant < sonAmbianceSuivantMs) return
    if (sceneStation) {
        jouerMotifStation(mondeActuel)
        sonAmbianceSuivantMs = instant + attenteAmbiance(4200 + (mondeActuel % 5) * 320)
    } else if (sceneActive == Scene.Vol &&
        (phase == PhaseVol.Lancement || phase == PhaseVol.Croisiere)) {
        jouerMotifJeu([740, 784], 75, 10)
        sonAmbianceSuivantMs = instant + attenteAmbiance(1250)
    } else if (sceneActive == Scene.Vol && phase == PhaseVol.Rencontre) {
        jouerNoteJeu(988, 75)
        sonAmbianceSuivantMs = instant + attenteAmbiance(1450)
    } else if (sceneActive == Scene.Vol && phase == PhaseVol.Approche) {
        jouerNoteJeu(1319, 80)
        sonAmbianceSuivantMs = instant + attenteAmbiance(1650)
    } else sonAmbianceSuivantMs = instant + 60000
}
