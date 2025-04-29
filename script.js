/*
1. Le rôle de requestAnimationFrame() :

requestAnimationFrame() dans la fonction animate() : dessine et remet à jour le jeu à chaque frame. 
Cette méthode permet de créer une boucle de rendu fluide, 
et le mouvement du joueur est effectué dans chaque cycle de cette boucle.


2. La fonction game.render() :

Dans cette fonction, on appelle à la fois :
=> la méthode draw() pour dessiner le joueur et
=> la methode update() pour mettre à jour sa position.

*/

// const { last, timestamp } = require("rxjs");

class Player {
    constructor(game) {
        this.game = game; //Permet de lier l'instance du jeu à l'objet Player. Donne accès à des infos du jeu comme la taille du canvas.
        this.width = 140; // Largeur du joueur (100 pixels)
        this.height = 120; // Hauteur du joueur (100 pixels)
        this.x = this.game.width * 0.5 - this.width * 0.5; // Position initiale du joueur, centré horizontalement -  L'offset de this.width * 0.5 sert à ajuster la position en fonction de la largeur du joueur pour qu'il soit bien centré.
        this.y = this.game.height - this.height; // Position initiale du joueur, en bas de l'écran
        this.speed = 5; // Vitesse du joueur, combien il se déplace à chaque frame
        this.lives = 3
        this.maxLives = 10
        this.image = document.getElementById('player')
        this.jets_image = document.getElementById('player_jets')
        this.frameX = 0 // c'est ceci qu'on va passer en 2ème param de drawImage, c'est iansi qu'on rend aléatoire l'affichage du player, 
        this.jetsFrame = 1 // idem, ici on commence a 1 car c'est le middle state, vs gauche et droite 
    }
    draw(context) {
        // hande sprite frames
        if(this.game.keys.indexOf('1') > -1) { // plus bas on dit que si on presse une key, on la met dans un tableau, on a besoin de verifier ce tableau ici!
            this.frameX = 1
        } else {
            this.frameX = 0
        }
        // context.fillRect(this.x, this.y, this.width, this.height);  Dessine un rectangle représentant le joueur
        // we want to crop out just one frame at a time, so we will need to use the long method, will all 9 arguments, so we add the sourceX sourceY source width and source height to do that 
        // so we can dertermine wich area of the spreasheet we need to crop out
        // le 2nd et 3eme arguments déterminent les "cases" des frames a choisir pour l'affichage 
        context.drawImage(this.jets_image, this.jetsFrame * this.width, 0, this.width, this.height,  this.x, this.y, this.width, this.height) // we can pass drawMethod optional width and height, and it will squeeze de spreadsheet to the area of one frame 
        context.drawImage(this.image, this.frameX * this.width, 0, this.width, this.height,  this.x, this.y, this.width, this.height) // we can pass drawMethod optional width and height, and it will squeeze de spreadsheet to the area of one frame 
    }
    update() {
        // horizontal movements
        if (this.game.keys.indexOf('ArrowLeft') > -1) {
            this.x -= this.speed
            this.jetsFrame = 0 // fusée bouge sous le pied gauche
        } else if (this.game.keys.indexOf('ArrowRight') > -1) {
            this.x += this.speed
            this.jetsFrame = 2 // fusée bouge sous le pied droit
        } else {
            this.jetsFrame = 1
        }
        // horizontal boundaries
        if (this.x < - this.width * 0.5) this.x = - this.width * 0.5  // le joueur peut sortir jusqu'a 0.5 * sa taille de l'écran, enemies can no more hide
        else if (this.x > this.game.width - this.width * 0.5) this.x = this.game.width - this.width * 0.5 // iden , le bord droit est a 600px, donc la largeur totale de l'écran moins la taille du joueur 
    }
    shoot() {
        const projectile = this.game.getProjectiles()
        if(projectile) projectile.start(this.x + this.width * 0.5, this.y)
    }
    restart () {
        // on veut remettre le joueur au milieu de l'écran, et remettre son score a 3.
        this.x = this.game.width * 0.5 - this.width * 0.5
        this.y = this.game.height  - this.height
        this.lives = 3
    }

}

class Projectile {
    constructor() {
        // we will reuse the 10 objects that we create over and over again // design object pool pattern
        this.width = 3
        this.height = 40
        this.x = 0
        this.y = 0
        this.speed = 20
        //  the use of big amount of projectiles, will result in performance issues / has to do with "pool" stuff
        this.free = true // when true: projectile is sitting in the pool, we are not using them. = We can play if false : means that we pulled the projectiles from the pool 
    }
    draw(context) {
        if(!this.free){ // actif :  free = false, on lui donne une position (x, y)
            context.save() // styles appliqué seulement dans ce scope
            context.fillStyle = 'gold'
            context.fillRect(this.x, this.y, this.width, this.height)
            context.restore()
        }
    }
    update() {
        if (!this.free) { // Si le projectile est actif (en train de voler)
            this.y -= this.speed; // On fait monter le projectile vers le haut
            if (this.y < -this.height) this.reset(); // S'il est sorti de l'écran, on le remet dans le pool
        }
    }
    start(x, y) {
        this.x = x - this.width * 0.5
        this.y = y
        this.free = false // start() : Quand tu tires une balle, l'effet est que : on active le projectile (free = false)
    }
    reset(){
        this.free = true // reset() : Quand la balle sort de l'écran = l'effet est que : ça remet la balle dans le pool (free = true)  
    }
}



// ici : la référence à game , et ailleurs dans le code: 
// "constructor(game)" crée un chemin d'acces à Game. stocke la référence de game ;  
// Si dans Game il y a "this.width = 800", alors dans Enemy, tu peux accéder à this.game.width pour obtenir 800. 
// Si dans Game tu as this.keys = [], tu peux accéder à this.game.keys dans ton Enemy.
class Enemy {
    constructor(game, positionX, positionY) { //positionX et positionY sont des coordonnées relatives dans la grille des ennemis.
        this.game = game
        this.width = this.game.enemySize
        this.height = this.game.enemySize
        this.x = 0
        this.y = 0
        this.positionX = positionX // position of the enemy within the wave, it has to know exactly where it sits inside the grid
        this.positionY = positionY // where it sits (relative to the left top corner of the)
        this.markedForDeletion = false // voir resultat dans la methode render() de Wave
    }
    draw(context) { // this section will determine what each enemy looks like 
        // context.strokeRect(this.x, this.y, this.width, this.height)
        context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)

    }
    update(x, y) { //x et y sont des coordonnées absolues /positions "globales" sur le canvas (l'écran), utilisées pour dessiner l'ennemi à l'écran.
        this.x = x + this.positionX //x et y  sont les déplacements relatifs dans la grille.et les positionX et positionY relatifs a l'enemy lui meme
        this.y = y + this.positionY // La méthode update(x, y) permet de calculer la position réelle de l'ennemi sur le canvas en prenant en compte sa position dans la grille.
        // c'est ici qu'on passe la fonction checkCollision, c'est le plus logique
        // everytime update runs on enemy, we will compare x, y, width & height of that particular enemy with all 10 projectile object 
        // we only check the "active projectiles" (explains the "projectilePool" that we select here)
        this.game.projectilesPool.forEach(projectile => {
            if (!projectile.free 
                && this.game.checkCollision(this, projectile) 
                && this.lives >0) {// check enemy vs tous les 10 projectiles (*) // aussi, le "if" sert à retourner un "true" , vu que c'est ce que demande la fonction checkCollision
                this.hit(1) 
                projectile.reset()// (voir reset de projectile) on veut aussi que dès qu'un projectile touche un enemi, il ne peux pas en toucher d'autres, et retourne direct dans le pool-free
            } // (*) -- on a ajouté "projectile.free" car IL FAUT vérifier que la detection de collision se passe avec des projectiles "en l'air / false / unavailable". sinon en descendant la premiere fois, la wave se compare aussi avec l'état "inactif" des projectiles, qui se trouvent au coordonnées x = 0 et y = 0 du constructeur  
        })
        if (this.lives < 1){
            if(this.game.spriteUpdate) // ici, si on veut changer de frame on doit dabord regarder donc attendre si spriteUpdate vaut true !
            this.frameX++ // c'est ici qu'on parcours la spreadsheet pour annimer les morts, on y ajoute la condition du timer(sprite) pour ralentir les images
            if(this.frameX > this.maxFrame){
                this.markedForDeletion = true //voir resultat dans la methode render() de Wave
                if(!this.game.gameOver)this.game.score += this.maxLives // On donne les points uniquement si ya pas GameOver. Rappel : fin du jeu, quand la wave nous touchait, on pouvait encore shooter. Là, on shoot, mais ça ne score plus.

            }
        }
        // check collision enemies - player
        if (this.game.checkCollision(this, this.game.player) && this.lives > 0){
            this.lives = 0
            this.game.player.lives--
        }

        // loose Conditions
        if(this.y + this.height > this.game.height || this.game.player.lives < 1){ // see if this enemy vertical y position + its height(bottom boundary of enemy rectangle is more than player y position )
            this.game.gameOver = true
        }
        }
        hit(damage) {
            this.lives -= damage // maybe we will  have weapons that hit harder or maybe we get the lives of the dead enemies
        }
}
// Enemi is the parent (super) class, Beetlemorph will be sub (child) Class. Methods and properties specific only to that class
class Beetlemorph extends Enemy{
    constructor(game, positionX, positionY) { // has to be like parent !! 
        super(game, positionX, positionY) // même raison qu'au dessus !
        this.image =document.getElementById('beetlemorph')
        this.frameX = 0
        this.maxFrame = 2 // on ne sort pas de la frame pour sélectionner les 3 stade de mort
        this.frameY = Math.floor(Math.random() *4)
        this.lives = 1 // can be 3 = then we'll need to hit them 3X before dead
        this.maxLives = this.lives // this is for the enemy object to remember its initial value of lives, so it will pass it to the player if it dies.

    }
}

class Wave {
    constructor(game){
        this.game = game
        this.width = this.game.columns * this.game.enemySize
        this.height = this.game.rows * this.game.enemySize
        this.x = this.game.width * 0.5 - this.width * 0.5
        this.y = - this.height // positions the wave almost outside the canvas, that's where it should start!
        this.speedX = Math.random() < 0.5 ? -1 : 1 // the entire wave of enemies will move as one unit, so the speed is on the wave object.
        this.speedY = 0 //au départ, pas de mouvement vertical (speedY = 0) // mouvement seulement horizontal (speedX = 3)
        this.enemies = [] // this.enemies contient TOUS les ennemis visibles à l'écran pour cette vague. Quand un ennemi meurt, il est marqué : markedForDeletion = true. Puis à la prochaine frame, la ligne suivante dans render() nettoie le tableau :
        this.nextWaveTrigger = false //Si = false :  Sert de "drapeau" pour dire "cette vague n'est pas finie, on ne passe pas a la suivante "

        this.create()
    }
    render(context) { // Gérer et afficher les objets
        if(this.y < 0) this.y += 5 // we want the wave to quickly float down untils its entirely visible (creates an arrival "effect"..!) and "then" it starts its left&right movement
        this.speedY = 0 //au départ, pas de mouvement vertical (speedY = 0) ---  mouvement seulement horizontal (speedX = 3)
        if (this.x < 0 || this.x > this.game.width - this.width) {
            this.speedX *= -1 // on inverse le sens.. quand il touche un bord!
            this.speedY = this.game.enemySize //Si touche un bord	speedY = enemySize (par ex. 60), donc on descend de 60 pixels.
        }
         // ci-dessous : for every animation frame, we increase horizontal position by speed
        // en gros : chaque fois que le render() est appelé, la position x avance de 3 pixels.
        this.x += this.speedX // ici on est sur un else 
        this.y += this.speedY // ici on est sur un else 
        this.enemies.forEach(enemy => {
            enemy.update(this.x, this.y)
            enemy.draw(context)
        })
        this.enemies = this.enemies.filter(object => !object.markedForDeletion) // i say : create a copy of this enemies array, and only allow inside elements that have "markedForDeletion set to false" => result overriding of the object, reset!
    }
    create() { // here, to create a new wave, we "look" into our constructor here, and see the current value of rows and columns, and based on that we create a grid of enemies
        for (let y = 0; y < this.game.rows; y++) { // this outter forLoop will handle rows, as we goes down, row by row, vertical Y coordinate will be increasing 
            for (let x = 0 ; x < this.game.columns; x++) { // this inner forLoop handles columns, as we go left to right inside each row, x coordinate will be increasing 
                let enemyX = x * this.game.enemySize
                let enemyY = y * this.game.enemySize
                this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY))
            }
        }
    }

}

/**
1 grille avec 3 colonnes et 2 lignes d'ennemis, chaque ennemi fait 60x60 pixels :
=> remier ennemi (position dans la grille) : positionX = 0, positionY = 0
=> Deuxième ennemi (position dans la grille) : positionX = 1, positionY = 0
=>Troisième ennemi (position dans la grille) : positionX = 2, positionY = 0
Si on fait bouger la vague, x et y vont être calculés pour chaque ennemi. 
Mais positionX et positionY ne changent pas, 
car elles définissent juste où l'ennemi est dans la grille par rapport aux autres ennemis.
 */
class Game {
    constructor(canvas) {
        this.canvas = canvas; // Le canvas sur lequel le jeu sera dessiné
        this.width = this.canvas.width; // La largeur du canvas
        this.height = this.canvas.height; // La hauteur du canvas
        this.keys = []; // Liste des touches actuellement pressées
        this.player = new Player(this); // Création de l'instance du joueur et passage de l'instance du jeu

        this.projectilesPool = []
        this.numberOfProjectiles = 15
        this.createProjectiles()
        this.fired = false// here we will make it impossible to hold the key to do force attacks. We want to prevent that.

        this.columns = 1 // size of wave will ajust to the anemies it contains ! same for rows
        this.rows = 1 // 40 enemis in total (?!)
        this.enemySize = 80 // for now, each enemy will be a square og 60 x 60 pixels 

        this.waves = []
        this.waves.push(new Wave(this)) // we pass it the "this" key word that represents the main game object we are inside of right now
        this.waveCount = 1 // afficher au joeur cmb de waves il a deja vaincu !
        
        this.spriteUpdate = false // variable qui indique si l'animation doit être mise à jour,  définie à true lorsque le temps écoulé dépasse un certain seuil (spriteInterval)
        this.spriteTimer = 0 // al these 3 will help to give time to execute the animation on the destruction of the enemy that happened too quickly
        this.spriteInterval = 150 // intervalle de temps (en millisecondes) qui doit s'écouler avant que l'animation du sprite ne soit mise à jour.
        
        this.score = 0 // start score
        this.gameOver = false

        // event listeners
        window.addEventListener('keydown', e => {
            if (e.key === '1' && !this.fired) this.player.shoot() // comprend juste que ça marche si la condition est fausse, ce qui est le cas (voir plus haut en dur), comme directement apèrs c'est false: ne peut plus tirer. 
                this.fired = true
            if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key)// returns -1 if the given element is not present
                if (e.key === 'r' && this.gameOver) this.restart()
        })
        window.addEventListener('keyup', e => {
            this.fired = false
            const index = this.keys.indexOf(e.key)
            if (index > -1) this.keys.splice(index, 1)
         // (if : index = >1) is always the case , because we juste pushed a key down ! 
        })
    }
  // La méthode `render` est appelée à chaque frame du jeu
    render(context, deltaTime) {
        // Sprite Timing
        // Cette condition vérifie si le temps écoulé depuis la dernière mise à jour du sprite a dépassé l'intervalle spécifié.
        if (this.spriteTimer > this.spriteInterval){ // Quand spriteTimer dépasse 500, alors on passe dans le if (ici)
            this.spriteUpdate = true; // L'animation du sprite peut maintenant être mise à jour
            this.spriteTimer = 0; // On réinitialise le timer à 0 pour le prochain cycle
        } else {
            this.spriteUpdate = false; // L'animation ne doit pas être mise à jour cette frame
            this.spriteTimer += deltaTime; //Le temps s'accumule ici, trnaquillement, jusqu'a atteindre les 500, qui déclencherons enfin l'animation suivante .
        }
        this.drawStatusText(context) //(context) est l'objet qui permet d'interagir avec le canvas, et il doit être transmis à toutes les fonctions qui vont effectuer des dessins sur ce canvas. 
        this.projectilesPool.forEach(projectile => {
            projectile.update()
            projectile.draw(context)
        })
        this.player.draw(context)
        this.player.update()
        this.waves.forEach(wave => {
            wave.render(context)
            if (wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver){ // pb de compréhension sur !wave.nextWavetrigger = cela sert juste a se dire : a t-on deja crée une nouvelle vague ? non! alors on peut la créer. Important pour que le systemen foncionn
                this.newWave()
                this.waveCount++ // On a une wave plus grade a chaques fois
                wave.nextWaveTrigger = true
                if (this.player.lives < this.player.maxLives) this.player.lives++
            }
        })
    }
    // create projectiles object pool
    createProjectiles() {
        for( let i = 0 ; i < this.numberOfProjectiles; i++) {
            this.projectilesPool.push(new Projectile())
        }
    }
    getProjectiles() {
        for (let i = 0 ; i < this.projectilesPool.length; i++){
            if(this.projectilesPool[i].free) return this.projectilesPool[i]
        }
    }
    // lets create a reusable collision detection method (betw 2 rectangles), 
    // there will have to be axis-aligned rectangles
    // if we wanted to detect also rotated rectangles, we would have to treat them as polygones, and collision dectection would have to be a more complex technik, 
    // such as separating axes theorem formula/ today all rectangles : axis aligned.

    checkCollision(a, b) { // for this call to work, each element we pass as agruments, needs to have x, y positions
        return (
            a.x < b.x + b.width && // on check si les coins upLeft de a(enemy) : sont à droite du upLeft de b(projectile) + sa laergeur ET si:
            a.x + a.width > b.x && // le coin upLeft de enemy + sa largeur est à droite du coin upLeft encore de projectile
            //mais jusqu'ici, ils pourraient encore entre loins l'un de l'autre verticalement, meme si deja leurs axex horizontaux se croisent ! donc check y aussi: 
            a.y < b.y + b.height && // ici et ci-dessous: chek si verticalement a (enemy) est plus bas que y (pas de collition, d'ailleurs, plutot danger :))
            a.y + a.height > b.y
        ) // similaire à if/ else (ici, return "true" si collision, sinon , false. n'agit pas)
    }
    drawStatusText(context){
        context.save() // cela enregistre l'état complet du canvas en plaçant l'état courant dans une stack. Cela nous permet de creer un nouveau "context" qui n'affectera que nous. Sinon, tous ces nouveaus styles s'appliquaient à l'affichage du score en haut, des projectiles, bref de tout ce qui a context! 
        context.shadowOffsetX = 2  // to display canvas shadows, we need to udefine at least 3 out of 4 shadow properties!
        context.shadowOffsetY = 2
        context.shadowColor = 'black' 
        context.fillText('Score: ' + this.score, 20, 40) // cette methode a BESOIN  de 3 arguments, le nom, et les coordonnées x puis y
        context.fillText('Wave: ' + this.waveCount, 20, 80)
        for(let i = 0; i < this.player.maxLives ; i++) {
            context.strokeRect(20 + 20 *i,100,10,15) //déjà, on ajoute de la marge à gauche de nos 3 petits carrés.(pour chaque vie, au début, ( x i)), les espaces sont crées grace au fait qu'on aligne des rectangles et non des carrés pleins
        
        }
        for(let i = 0; i < this.player.lives ; i++) {
            context.fillRect(20 + 20 *i,100,10,15) //déjà, on ajoute de la marge à gauche de nos 3 petits carrés.(pour chaque vie, au début, ( x i)), les espaces sont crées grace au fait qu'on aligne des rectangles et non des carrés pleins
        
        }
        if (this.gameOver){
            context.textAlign = 'center'
            context.font = '100px Impact'
            context.fillText('GAME OVER!', this.width * 0.5, this.height * 0.5) // Pour aparaître bien au mileu
            context.font = '20px Impact'
            context.fillText('Press R to restart!', this.width * 0.5, this.height * 0.5 + 30) 
        }
        context.restore() // à utiliser avec le save // endlessloop!
    }
    newWave() { // on sait que la new Wave sera calculée correctement (voir constructeur de wave qui dis toujours "this.... this. ... cela  assure la mise a jour de la création conforme des nouvelles waves")
        if (Math.random() < 0.5 && this.columns * this.enemySize < this.width * 0.8) { // vérifier la taille de la wave, verifier pour que la vague devienne pas plus large que l'écran et casserait l'affichage. 
            this.columns++
        } else if (this.rows * this.enemySize < this.height * 0.6) {
            this.rows++
        }
        this.waves.push(new Wave(this)) // ici, on crée a chaque fois une wave plus grande 
    }
    restart() {
        this.player.restart()
        this.columns = 2 
        this.rows = 2 
        this.waves = [] // we keep this for the restart, to erase all enemy waves, in case there are still some
        this.waves.push(new Wave(this)) // this way, we imediately show a new wave
        this.waveCount = 1 // afficher au joeur cmb de waves il a deja vaincu !

        this.score = 0 // start score
        this.gameOver = false
    }

}

window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1')
    const ctx = canvas.getContext('2d')
    canvas.width = 600;
    canvas.height = 800;
    ctx.fillStyle = 'white' // applies to everything that was drawn on the canvas
    ctx.strokeStyle = 'white'
    // ctx.lineWidth = 1 => unecessary : default value !
    ctx.font = '30px Impact'

    const game = new Game(canvas)

    let lastTime = 0 // permet de calculer le temps passé entre 2 images,
    function animate(timeStamp) { // Ce timestamp est généré automatiquement. On ne le calcules pas : il nous est donné.
     // Calcul du temps écoulé depuis la dernière frame
        const deltaTime = timeStamp - lastTime //représente combien de temps s'est écoulé depuis que la page a commencé à se charger
        lastTime = timeStamp
        ctx.clearRect(0, 0, canvas.width, canvas.height) // Efface tout ce qui a été dessiné sur le canvas (nettoyage avant de redessiner)
        game.render(ctx, deltaTime) // Redessine les éléments du jeu, puis on a ajouté la props "deltatime" ici en argument pour pouvoir s'en servir
        requestAnimationFrame(animate) //  fait tourner animate en boucle, au rythme idéal pour l'ordinateur.

    }
     // Démarrage de la boucle d'animation
    // On passe 0 pour éviter une erreur sur la toute première frame
    animate(0) // le déplacement est créé par la modification de la position à chaque frame.
    // ici, on met 0, depuis qu'on calcule les timestamps, cela nous créait une erreur ici, car le premier tour de calcul de TS etait undefined. on le regle en mettant 0 ici

})

// timestamp
/*
we can time things seperatly in our codebase. 
the speed a witch de spritesheet itself swaps frames will operate its own seperate speed

*/