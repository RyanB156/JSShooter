var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
ctx.font = "70px Arial";
var canvasRect = canvas.getBoundingClientRect();
var width = canvas.width;
var height = canvas.height;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    canvasRect = canvas.getBoundingClientRect();
}
resize();

const entityType = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    BULLET: 'bullet'
}
var speed = 5;
var tag = 0;

var entities = [];
var playerTarget = {x: 0, y: 0};
var walls = {top: 'top', bottom: 'bottom', right: 'right', left: 'left'};
var wallBuffer = 2;
var boxSize = 50;

var sizes = { player: 25, enemy: 25, bullet: 7 };
class Entity {
    constructor(x, y, vx, vy, entityType, size) {
        this.x = x;
        this.y = y;
        this.entityType = entityType;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.tag = tag++;
        this.alive = true;
    }
    setTag(tag) {
        this.tag = tag;
    }
    move() {

        if (this.entityType == entityType.BULLET) {
            // Bullets will despawn when they collide with a wall.
            if (this.checkCollideWithWall().hitWall) {
                this.alive = false;
                return;
            }
        }

        this.x += this.vx;
        this.y += this.vy;
    }
    checkCollideWithWall() {
        var walls = [];
        if (this.x < 0 + wallBuffer) // Hit left wall.
            walls.push(walls.left);
        if (this.x > width - wallBuffer) // Hit right wall.
            walls.push(walls.right);
        if (this.y < 0 + wallBuffer) // Hit top wall.
            walls.push(walls.top);
        if (this.y > height - wallBuffer) // Hit bottom wall.
            walls.push(walls.bottom);

        var b = walls.length > 0 ? true : false;
        return {hitWall: b, wallsHit: walls};
    }
    // Add bullets in the game that move towards the target location.
    spawnBullet(tx, ty) {
        // Use trigonometry to set the velocity so each bullet moves towards its target.
        var dx = tx - this.x;
        var dy = ty - this.y;
        var angle = Math.atan2(dy, dx);
        var vbx = speed * Math.cos(angle);
        var vby = speed * Math.sin(angle);

        //console.log('bullet moving at (' + vbx + ', ' + vby + ') towards target (' + tx + ', ' + ty + ')');
        //console.log('(' + this.x + ', ' + this.y + ')');

        // Create a new bullet and set the tag so the the firing entity does not kill itself.
        var bullet = new Entity(this.x, this.y, vbx, vby, entityType.BULLET, sizes.bullet);
        bullet.setTag(this.tag);

        entities.push(bullet);
    }
}

function spawnEnemy(x, y) {
    entities.push(new Entity(x, y, 0, 0, entityType.ENEMY, sizes.enemy));
}

function randomEnemy() {
    var x = Math.random() * width;
    var y = Math.random() * height;
    spawnEnemy(x, y);
}

// A collision mesh system using an axially aligned bounding box.
// Entities are stored in a 3D array based on their position in the game.
// To check for collisions between entities, the system checks only the squares in the mesh near the entity.
// This will be used to check for collisions between bullets and 
class ObjectMesh {
    constructor(width, height, boxSize, entities) {
        this.width = width;
        this.height = height;
        this.boxSize = boxSize;
        this.searchRadius = 20;

        this.boxWidth = Math.ceil(width / boxSize) + 1;
        this.boxHeight = Math.ceil(height / boxSize) + 1;

        this.mesh = new Array(this.boxWidth);
        for (var i = 0; i < this.boxWidth; i++) {
            this.mesh[i] = new Array(this.boxHeight);
            for (var j = 0; j < this.boxHeight; j++) {
                this.mesh[i][j] = [];
            }
        }

        for (var i = 0; i < entities.length; i++){
            var e = entities[i];
            if (e.alive) {
                var bx = e.x / boxSize;
                var by = e.y / boxSize;
                bx = Math.max(0, bx);
                by = Math.max(0, by);
                this.mesh[Math.floor(bx)][Math.floor(by)].push(e);
            }
        }
    }
    // Return a list entities that are within a certain distance.
    checkCollisions(e) {
        var nearbyObjects = [];
        var xPos = e.x;
        var yPos = e.y;
        var boxRadius = Math.floor(this.searchRadius / this.boxSize); // Flatten boxes into boxes with zero width to simplify finding the correct indices to fill.
        boxRadius = boxRadius > 0 ? boxRadius : 1; // Make sure that some area is checked even if the searchRadius was smaller than the boxSize.
        var boxRSquared = boxRadius * boxRadius;
        var xBox = Math.round(xPos / boxSize);
        var yBox = Math.round(yPos / boxSize);

        for (var x = xBox - boxRadius; x < xBox; x++) // Check 2nd quadrant first then use symmetry to find the other 3.
        {
            for (var y = yBox - boxRadius; y < yBox; y++)
            {
                var xDist = x - xBox + 1;
                var yDist = y - yBox + 1;
                if (xDist * xDist + yDist * yDist + boxRadius <= boxRSquared)
                {
                    var xSym = xBox + xBox - x - 1;
                    var ySym = yBox + yBox - y - 1;

                    // 1st Quadrant.
                    if (xSym >= 0 && y >= 0 && xSym < this.boxWidth && y < this.boxHeight)
                    {
                        nearbyObjects = nearbyObjects.concat(this.mesh[xSym][y]);
                    }
                    // 2nd Quadrant.
                    if (x >= 0 && y >= 0 && x < this.boxWidth && y < this.boxHeight)
                    {
                        nearbyObjects = nearbyObjects.concat(this.mesh[x][y]);
                    }
                    // 3rd Quadrant.
                    if (x >= 0 && ySym >= 0 && x < this.boxWidth && ySym < this.boxHeight)
                    {
                        nearbyObjects = nearbyObjects.concat(this.mesh[x][ySym]);
                    }
                    // 4th Quadrant.
                    if (xSym >= 0 && ySym >= 0 && xSym < this.boxWidth && ySym < this.boxHeight)
                    {
                        nearbyObjects = nearbyObjects.concat(this.mesh[xSym][ySym]);
                    }
                }
            }
        }
        return nearbyObjects;
    }
}

var player = new Entity(width / 2, height / 2, 0, 0, entityType.PLAYER, sizes.player);

// *** Don't forget to remove this...
for (var i = 0; i < 20; i++)
    randomEnemy();

var mesh = new ObjectMesh(width, height, 50, [player]);
//console.log(mesh.mesh);

var keys = {a: 65, w: 87, d: 68, s: 83, space: 32};

// *** Keyup broken now after switching from arrow keys to wasd...

// Need smoother movement. E.g. Holding left then pressing and releasing right stops the player and the player must press left again.
var vel = {
    _pressed: {},
    left: keys.a,
    up: keys.w,
    right: keys.d,
    down: keys.s,
    isDown: function(keyCode) {
        return this._pressed[keyCode];
    },
    keydown: function(event) {
        //console.log(event.keyCode);
        switch (event.keyCode) {
            case keys.a: player.vx = -speed; break;
            case keys.w: player.vy = -speed; break;
            case keys.d: player.vx = speed; break;
            case keys.s: player.vy = speed; break;
        }
        this._pressed[event.keyCode] = true;
    },
    keyup: function(event) {
        switch (event.keyCode) {
            case keys.a: player.vx = this.isDown(this.right) ? speed : 0; break;
            case keys.d: player.vx = this.isDown(this.left) ? -speed : 0; break;
            case keys.s: player.vy = this.isDown(this.up) ? -speed : 0; break;
            case keys.w: player.vy = this.isDown(this.down) ? speed : 0; break;
        }
        delete this._pressed[event.keyCode];
    }
}

function playerAim(mousePos) {
    playerTarget = mousePos;
}

function checkKeyUp(event) {

    if (event.keyCode == keys.space)
        player.spawnBullet(playerTarget.x, playerTarget.y);
    else
        vel.keyup(event);
}

function sqrDist(a, b) {
    return Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2);
}

// Apply updates to entities including moving the player, enemies, and bullets.
function update(progress) {
    player.move();

    // Check for collisions between bullets and other entities.
    var allEntities = entities.concat([player]);
    var mesh = new ObjectMesh(width, height, boxSize, allEntities);

    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        if (e.entityType == entityType.BULLET) {
            var nearbyEntities = mesh.checkCollisions(e);

            for (var j = 0; j < nearbyEntities.length; j++) {
                var n = nearbyEntities[j];
                if (nearbyEntities.length > 0)
                    console.log(nearbyEntities);

                // The other entity does not have a matching tag, is not a bullet, and the bullet is inside it.
                if (e.tag !== n.tag && n.entityType !== entityType.BULLET && sqrDist(e, n) < n.size * n.size) {
                    console.log('killing ' + n.tag);
                    e.alive = false;
                    // *** May want to despawn the bullet after it kills one entity...
                    n.alive = false;
                }
            }
        }
        
    }

    var len = entities.length;
    for (var i = 0; i < len; i++) {
        var e = entities[i];
        if (!e.alive) {
            entities.splice(i, 1);
            len--;
            continue;
        }
        entities[i].move();
    }
}

function checkNearPlayer() {
    
}

/*
    TODO:
        Add entity collisions with walls.
        Move method in the Entity class. This will check for collisions and stop Entities (player and enemies) or remove them (bullets)
            when they hit a wall.
        Allow player to shoot bullets. Will need mouse event for left click and adding new entities with a set initial velocity.
        Test collision mesh between bullets and other Entities. Check the tag to ensure Entities do not kill themselves.
        Stop game when player dies (Loss).
        Stop game when player wins (Win). All enemies must be defeated (keep track of the number with a simple counter).
        Enemies that move and attack other. Check for next enemy using the ObjectMesh.
        ...
*/
function draw() {
    ctx.clearRect(0, 0, width, height);
    //console.log('Drawing' + ' with size = ' + player.size + ' ' + player.vx);

    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.ellipse(player.x, player.y, player.size, player.size, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'red';
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        ctx.beginPath();
        ctx.ellipse(e.x, e.y, e.size, e.size, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function strPair(a, b) {
    return '(' + a + ', ' + b + ')';
}

var time = 0;
var updateRate = 1000 / 18;
var lastRender = 0

// Gameloop.
function loop(timestamp) {
    var progress = timestamp - lastRender;
    update(progress);

    time += progress;
    if (time >= updateRate) {
        update(progress);
        time = 0;
    }

    draw();
    lastRender = timestamp;
    window.requestAnimationFrame(loop);
}

// Get mouse position relative to the canvas.
function getMousePos(canvas, evt) {
    var rect = canvasRect;
    return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
  }

window.requestAnimationFrame(loop);
window.addEventListener('keydown', function(event) { vel.keydown(event); });
window.addEventListener('keyup', function(event) { checkKeyUp(event); });
canvas.addEventListener('mousemove', function(event) { playerAim(getMousePos(canvas, event)); })