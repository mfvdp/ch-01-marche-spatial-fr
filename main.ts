// Programme principal : démarrage, boucle de jeu et touches.
//
// Programmé par le CALLIOPE HACKER pour le Calliope mini 3 avec le GameKit.

let directionRepetitionMenu = 0
let repetitionMenuMs = 0

function actualiserRepetitionMenu(): void {
    if (sceneActive == Scene.Vol || sceneActive == Scene.Intro || entreeVerrouillee) {
        directionRepetitionMenu = 0
        return
    }
    let direction = 0
    if (controller.up.isPressed()) direction = 1
    else if (controller.down.isPressed()) direction = 2
    else if (controller.left.isPressed()) direction = 3
    else if (controller.right.isPressed()) direction = 4
    if (direction == 0) {
        directionRepetitionMenu = 0
        return
    }
    let instant = game.runtime()
    if (direction != directionRepetitionMenu) {
        directionRepetitionMenu = direction
        repetitionMenuMs = instant + 350
        return
    }
    if (instant < repetitionMenuMs) return
    if (direction == 1) traiterDirection(0, -1)
    else if (direction == 2) traiterDirection(0, 1)
    else if (direction == 3) traiterDirection(-1, 0)
    else traiterDirection(1, 0)
    repetitionMenuMs = instant + 120
}

scene.setBackgroundColor(COULEUR_FOND)
preparerSon()
chargerJeu()
if (introSeLanceSeule()) lancerIntroReglee()
else reglerScene(Scene.Titre)

game.onPaint(function () {
    noterImageAffichage()
    dessinerSceneActuelle()
})

game.onUpdate(function () {
    if (entreeVerrouillee && toutesTouchesRelachees()) entreeVerrouillee = false
    actualiserIntro()
    actualiserVol()
    actualiserAmbianceSonore()
    actualiserRepetitionMenu()
    actualiserDiagnosticAffichage()
})

controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    traiterDirection(0, -1)
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    traiterDirection(0, 1)
})

controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    traiterDirection(-1, 0)
})

controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    traiterDirection(1, 0)
})

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (sceneActive == Scene.Vol) tirerArmePrincipale()
    else traiterA()
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (sceneActive == Scene.Vol) tirerArmeSecondaire()
    else traiterB()
})
