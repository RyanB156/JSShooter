
var tag = 0;
var running = true;
var entities = [];
var enemycount = document.getElementById('enemycount').value;
var firerate = document.getElementById('firerate').value;
var viewdistance = document.getElementById('viewdistance').value;
var walls = {top: 'top', bottom: 'bottom', right: 'right', left: 'left'};
var wallBuffer = 2;
var boxSize = 50;

var entityCap = 40; // Important for performance. Enemies stop firing at this point.

const entityType = { PLAYER: 'player', ENEMY: 'enemy', BULLET: 'bullet' }
const sizes = { player: 25, enemy: 25, bullet: 7 };
const speeds = { player: 5, enemy: 5, bullet: 7 };
const enemyMoveChance = 0.045;

class Entity {
    constructor(x, y, vx, vy, entityType, size) {
        this.pos = {x: x, y: y};
        this.entityType = entityType;
        this.size = size;
        this.vel = {x: vx, y: vy};
        this.target = {x: 0, y: 0};
        this.hasTarget = false;
        this.movePoint = {x: 0, y: 0};
        this.tag = tag++;
        this.team = entityType;
        this.alive = true;
        switch (this.entityType) {
            case entityType.BULLET: this.speed = speeds.bullet; break;
            case entityType.ENEMY: this.speed = speeds.enemy; break;
            default: this.speed = speeds.player; break;
        }
    }
    setTag(tag) {
        this.tag = tag;
    }
    setTeam(team) {
        this.team = team;
    }
    stop() {
        this.vel = {x: 0, y: 0};
    }
    move() {
        if (this.entityType === entityType.BULLET) {
            // Bullets will despawn when they collide with a wall.
            if (this.checkCollideWithWall().hitWall) {
                this.alive = false;
                return;
            }
        }

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }
    goto(x, y) {
        // Use trigonometry to set the velocity so each Entity moves towards its target.
        var dx = x - this.pos.x;
        var dy = y - this.pos.y;
        var angle = Math.atan2(dy, dx);
        this.vel.x = this.speed * Math.cos(angle);
        this.vel.y = this.speed * Math.sin(angle);
        this.movePoint = {x: x, y: y};
    }
    checkCollideWithWall() {
        var walls = [];
        if (this.pos.x < 0 + wallBuffer) // Hit left wall.
            walls.push(walls.left);
        if (this.pos.x > width - wallBuffer) // Hit right wall.
            walls.push(walls.right);
        if (this.pos.y < 0 + wallBuffer) // Hit top wall.
            walls.push(walls.top);
        if (this.pos.y > height - wallBuffer) // Hit bottom wall.
            walls.push(walls.bottom);

        var b = walls.length > 0 ? true : false;
        return {hitWall: b, wallsHit: walls};
    }
    // Add bullets in the game that move towards the target location.
    spawnBullet(tx, ty) {
        if (this.alive) {
            // Create a new bullet and set the tag so the the firing entity does not kill itself.
            var bullet = new Entity(this.pos.x, this.pos.y, 0, 0, entityType.BULLET, sizes.bullet);
            bullet.goto(tx, ty);
            bullet.setTag(this.tag);
            bullet.setTeam(this.entityType);

            entities.push(bullet);
        }
    }
}