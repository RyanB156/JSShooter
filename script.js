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



function spawnEnemy(x, y) {
    entities.push(new Entity(x, y, 0, 0, entityType.ENEMY, sizes.enemy));
}

function randomEnemy() {
    var x = Math.random() * width;
    var y = Math.random() * height;
    spawnEnemy(x, y);
}


var player = new Entity(width / 2, height / 2, 0, 0, entityType.PLAYER, sizes.player);
for (var i = 0; i < 20; i++)
    randomEnemy();
var mesh = new ObjectMesh(width, height, 50, [player]);


function reset() {
    player = new Entity(width / 2, height / 2, 0, 0, entityType.PLAYER, sizes.player);
    entities = [];
    enemycount = document.getElementById('enemycount').value;

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