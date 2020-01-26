var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var menu = document.getElementById('menu');
ctx.font = "70px Arial";
var canvasRect = canvas.getBoundingClientRect();
var width = canvas.width;
var height = canvas.height;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 25;
    width = canvas.width;
    height = canvas.height;
    canvasRect = canvas.getBoundingClientRect();
}
resize();

function randomPoint() {
    return { x: Math.random() * width, y: Math.random() * height };
}

function spawnEnemy(x, y) {
    var e = new Entity(x, y, 0, 0, entityType.ENEMY, sizes.enemy);
    var pt = randomPoint();
    e.goto(pt.x, pt.y);
    entities.push(e);
}

function randomEnemy() {
    var pt = randomPoint();
    spawnEnemy(pt.x, pt.y);
}

var player = new Entity(width / 2, height / 2, 0, 0, entityType.PLAYER, sizes.player);
for (var i = 0; i < enemycount; i++)
    randomEnemy();
var mesh = new ObjectMesh(width, height, 50, [player]);

var gamemodes = {team: 'team', ffa: 'ffa'};
var gamemode = gamemodes.team;

var keys = {a: 65, w: 87, d: 68, s: 83, r: 82, space: 32, escape: 27};

function sqrDist(a, b) {
    return Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2);
}

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
            case keys.a: player.vel.x = -player.speed; break;
            case keys.w: player.vel.y = -player.speed; break;
            case keys.d: player.vel.x = player.speed; break;
            case keys.s: player.vel.y = player.speed; break;
        }
        this._pressed[event.keyCode] = true;
    },
    keyup: function(event) {
        switch (event.keyCode) {
            case keys.a: player.vel.x = this.isDown(this.right) ? player.speed : 0; break;
            case keys.d: player.vel.x = this.isDown(this.left) ? -player.speed : 0; break;
            case keys.s: player.vel.y = this.isDown(this.up) ? -player.speed : 0; break;
            case keys.w: player.vel.y = this.isDown(this.down) ? player.speed : 0; break;
        }
        delete this._pressed[event.keyCode];
    }
}

function playerAim(mousePos) {
    player.target = mousePos;
}

function checkKeyUp(event) {

    if (event.keyCode == keys.space)
        player.spawnBullet(player.target.x, player.target.y);
    else if (event.keyCode == keys.r)
        reset();
    else if (event.keyCode == keys.escape) {
        running = !running;
        if (running)
            menu.style.display = "none";
        else
            menu.style.display = "block";
    }
    else
        vel.keyup(event);
}


function reset() {
    player = new Entity(width / 2, height / 2, 0, 0, entityType.PLAYER, sizes.player);
    entities = [];
    enemycount = document.getElementById('enemycount').value;
    firerate = document.getElementById('firerate').value;
    viewdistance = document.getElementById('viewdistance').value;

    // *** Don't forget to remove this...
    for (var i = 0; i < enemycount; i++)
        randomEnemy();
}

// Apply updates to entities including moving the player, enemies, and bullets.
function update(progress) {

    if (running) {
        if (player.alive) {
            player.move();
        } else {
            
        }
    
        // Check for collisions between bullets and other entities.
        var allEntities = entities.concat([player]);
        var mesh = new ObjectMesh(width, height, boxSize, allEntities);
    
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            if (e.alive) {
                e.move();
                if (e.entityType == entityType.BULLET) {
                    var nearbyEntities = mesh.checkCollisions(e);
        
                    for (var j = 0; j < nearbyEntities.length; j++) {
                        var n = nearbyEntities[j];
                        if (nearbyEntities.length > 0)
                            console.log(nearbyEntities);
        
                        // The other entity does not have a matching tag, is not a bullet, and the bullet is inside it.
                        if (n.tag !== e.tag && n.entityType !== entityType.BULLET && sqrDist(e.pos, n.pos) < n.size * n.size) {
                            if (gamemode === gamemodes.team && n.team !== e.team) {
                                console.log('killing ' + n.tag);
                                e.alive = false;
                                n.alive = false;
                            }
                            
                        }
                    }
                } else if (e.entityType === entityType.ENEMY) {
                    var nearbyEntities = mesh.checkCollisions(e, viewdistance); // Find other entities that are roughly within 100 units of this entity.

                    for (var j = 0; j < nearbyEntities.length; j++) {
                        var n = nearbyEntities[j];
                        if (gamemode === gamemodes.team && n.entityType !== e.entityType && n.entityType !== entityType.BULLET) {
                            e.target = n.pos; // May adjust for velocity later...
                            e.hasTarget = true;
                            break;
                        }
                        e.hasTarget = false; // Remove target if no enemies are in range.
                    }

                    if (Math.random() < firerate && e.hasTarget && entities.length < entityCap) {
                        e.spawnBullet(e.target.x, e.target.y);
                    }

                    if (sqrDist(e.pos, e.movePoint) < e.size) {
                        e.stop();
                        if (Math.random() < enemyMoveChance) {
                            var pt = randomPoint();
                            e.goto(pt.x, pt.y);
                        }
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
        }
    }
    
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

    ctx.fillStyle = player.alive ? 'blue' : 'black';
    ctx.beginPath();
    ctx.ellipse(player.pos.x, player.pos.y, player.size, player.size, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'red';
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        ctx.beginPath();
        ctx.ellipse(e.pos.x, e.pos.y, e.size, e.size, 0, 0, 2 * Math.PI);
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