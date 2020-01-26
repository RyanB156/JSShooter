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
                var bx = e.pos.x / boxSize;
                var by = e.pos.y / boxSize;
                bx = Math.max(0, bx);
                by = Math.max(0, by);
                console.log("boxWidth: " + this.boxWidth + ", boxHeight: " + this.boxHeight + ", bx: " + bx + ", by: " + by);
                this.mesh[Math.floor(bx)][Math.floor(by)].push(e);
            }
        }
    }
    // Return a list entities that are within a certain distance.
    // distance is an optional parameter. If it is not specified, then the mesh's default search radius will be used.
    checkCollisions(e, distance) {
        var nearbyObjects = [];
        var xPos = e.pos.x;
        var yPos = e.pos.y;
        var searchDist = distance == undefined ? this.searchRadius : distance;
        var boxRadius = Math.floor(searchDist / this.boxSize); // Flatten boxes into boxes with zero width to simplify finding the correct indices to fill.
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