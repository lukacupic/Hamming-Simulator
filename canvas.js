var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');

/**
 * Holds all graphical objects which are to be drawn onto the canvas.
 * Every object must have a draw() method which will be called upon
 * drawing.
 */
var objects = [];

var binaryBoxsets = []; // This should eventually become a map


// ============================== GENERAL SECTION ==============================

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener("click", mouseClicked, false);

    var hammingCoder = new TextBox(50, 35, 200, 50, "Hammingov koder");
    var hammingCoder = new TextBox(50, 135, 200, 50, "Hammingov dekoder");
    var boxset = new BinaryBoxset("", 42, 105, 5, BoxSize.SMALL, Orientation.HORIZONTAL);

    redraw();
}

function redraw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0, len = objects.length; i < len; i++) {
        objects[i].draw();
    }
}

// ----------------------------------- Mouse -----------------------------------

function mouseClicked(e) {
    let m = getMouse(e);

    for (var i = 0, len = binaryBoxsets.length; i < len; i++) {
        var tile = binaryBoxsets[i].getBinaryBoxIndexForPoint(m.x, m.y);
        if(tile == -1) continue;
        else binaryBoxsets[i].boxes[tile].invert();
    }
    redraw();
}

function getMouse(e) {
    let rect = e.target.getBoundingClientRect();
    let pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    return {x: parseInt(pos.x), y: parseInt(pos.y)};
}

// =============================== MODEL SECTION ===============================

// ---------------------------------- TextBox ----------------------------------

// A rectangular box with the specified text in the center.
function TextBox(x, y, width, height, text, fontSize) {
    objects.push(this);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;

    this.font = (fontSize !== undefined) ? fontSize + "px Arial" : "18px Arial";
}

TextBox.prototype.BORDER = 1;

TextBox.prototype.draw = function () {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);

    c.fillStyle = "white";
    var border = TextBox.prototype.BORDER;
    c.fillRect(this.x + border, this.y + border, this.width - 2  * border, this.height - 2 * border);

    c.font = this.font;
    c.fillStyle = "black";
    c.textAlign ="center";
    c.textBaseline = "middle";

    var lineheight = 40;
    var lines = this.text.split('\n');
    // for (var i = 0; i < lines.length; i++) {
        c.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
        // c.fillText(lines[i], this.x + (this.width / 2), this.y + (this.height / 2) + (i * lineheight));
    // }
};

// Function to check whether a given set of coordinates is inside the box.
TextBox.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

// --------------------------------- BinaryBox ---------------------------------

function BinaryBox(x, y, size) {
    this.value = "0";
    TextBox.call(this, x, y, size, size, this.value, 10);
}

BinaryBox.prototype = Object.create(TextBox.prototype);

BinaryBox.prototype.invert = function () {
    this.text = this.text == "0" ? "1" : "0";
}

var BoxSize = {
    SMALL: 20,
    LARGE: 50
};

// ------------------------------- BinaryBoxset --------------------------------

function BinaryBoxset(name, x, y, n, size, orient) {
    binaryBoxsets.push(this);

    this.name = name;
    this.boxes = [];

    var xOffset = orient == Orientation.HORIZONTAL ? size - TextBox.prototype.BORDER: 0;
    var yOffset = orient == Orientation.VERTICAL ? size - TextBox.prototype.BORDER: 0;

    for(var i = 0; i < n; i++) {
        this.boxes.push(new BinaryBox(x + xOffset * (i + 1), y + yOffset * (i + 1), size));
    }
}

BinaryBoxset.prototype.getBinaryBoxIndexForPoint = function (x, y) {
    for (var i = 0, len = this.boxes.length; i < len; i++) {
        var tile = this.boxes[i];
        if(tile.contains(x, y)) return i;
    }
    return -1;
}

BinaryBoxset.prototype.getBinaryValue = function() {

}

var Orientation = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

init();
