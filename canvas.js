var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');

var tileBoxes = []; // This should eventually become a map

/**
 * Holds all graphical objects which are to be drawn onto the canvas.
 * Every object must have a draw() method which will be called upon
 * drawing.
 */
var objects = [];

// General

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener("click", mouseClicked, false);

    var hammingCoder = new BoxWithText(50, 35, 200, 50, "Hammingov koder");
    var tileBox = new TileBox("test", 100, 300, 4, "vertical");

    var tileBox2 = new TileBox("test2", 120, 500, 6, "horizontal");

    redraw();
}

function redraw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0, len = objects.length; i < len; i++) {
        objects[i].draw();
    }
}

// Mouse

function mouseClicked(e) {
    let m = getMouse(e);

    for (var i = 0, len = tileBoxes.length; i < len; i++) {
        var tile = tileBoxes[i].getTileForPoint(m.x, m.y);
        if(tile == -1) continue;
        else console.log("Tile " + tile + " of " + tileBoxes[i].name + " clicked!");
    }
}

function getMouse(e) {
    let rect = e.target.getBoundingClientRect();
    let pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    return {x: parseInt(pos.x), y: parseInt(pos.y)};
}

// BoxWithText

// A rectangular box with the specified text in the center.
function BoxWithText(x, y, width, height, text, fontSize) {
    objects.push(this);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;

    this.font = (fontSize !== undefined) ? fontSize + "px Arial" : "20px Arial";
}

BoxWithText.prototype.BORDER = 1;

BoxWithText.prototype.draw = function () {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);

    c.fillStyle = "white";
    var border = BoxWithText.prototype.BORDER;
    c.fillRect(this.x + border, this.y + border, this.width - 2 * border, this.height - 2 * border);

    c.font = this.font;
    c.fillStyle = "black";
    c.textAlign ="center";
    c.textBaseline = "middle";
    c.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
};

// Function to check whether a given set of coordinates is inside the box.
BoxWithText.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

// Tile

function Tile(x, y) {
    return new BoxWithText(x, y, Tile.prototype.WIDTH, Tile.prototype.HEIGHT, "0", 10);
}

Tile.prototype.WIDTH = 20;
Tile.prototype.HEIGHT = 20;

// Tesselation

function TileBox(name, x, y, n, orient) {
    tileBoxes.push(this);

    this.name = name;
    this.tiles = [];

    var xOffset = orient == "horizontal" ? Tile.prototype.WIDTH - BoxWithText.prototype.BORDER: 0;
    var yOffset = orient == "vertical" ? Tile.prototype.HEIGHT - BoxWithText.prototype.BORDER: 0;

    for(var i = 0; i < n; i++) {
        this.tiles.push(new Tile(x + xOffset * (i + 1), y + yOffset * (i + 1)));
    }
}

TileBox.prototype.getTileForPoint = function (x, y) {
    for (var i = 0, len = this.tiles.length; i < len; i++) {
        var tile = this.tiles[i];
        if(tile.contains(x, y)) return i;
    }
    return -1;
}

init();
