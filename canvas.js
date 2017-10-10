var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');

/*
 Holds all graphical objects which are to be drawn onto the canvas.
 Every object must have a draw() method which will be called upon
 drawing.
*/
var objects = [];

/*
 A map of all the binary boxes so that they can be accessed by name
 when needed.
*/
var binaryBoxsets = new Map();

/*
 The width of each of the component's border.
*/
var border = 1;

/*
 The background color of the canvas.
*/
var backgroundColor = "white";


// ============================== GENERAL SECTION ==============================

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener("click", mouseClicked, false);

    var hammingCoder = new TextBox(50, 35, 200, 50, "Hammingov koder");
    var hammingDecoder = new TextBox(50, 170, 200, 50, "Hammingov dekoder");

    var boxset2 = new BinaryBoxset("testBoxset2", 300, 125, 5, BoxSize.SMALL, Orientation.VERTICAL);
    boxset2.setInfo(["A", "A", "A", "A", "A"], Direction.EAST);

    var boxset = new BinaryBoxset("testBoxset", 50, 125, 5, BoxSize.SMALL, Orientation.HORIZONTAL);

    var openPipe = new OpenPipe(400, 150, 40, Orientation.HORIZONTAL, Direction.EAST);
    var openEntrancePipe = new OpenEntrancePipe(400, 185, 40, Orientation.HORIZONTAL, Direction.EAST);
    var openExitPipe = new OpenExitPipe(400, 220, 40, Orientation.HORIZONTAL, Direction.EAST);
    var closedPipe = new ClosedPipe(400, 255, 40, Orientation.HORIZONTAL, Direction.EAST);

    var openPipe = new OpenPipe(600, 150, 40, Orientation.VERTICAL, Direction.EAST);
    var openEntrancePipe = new OpenEntrancePipe(600, 200, 40, Orientation.VERTICAL, Direction.EAST);
    var openExitPipe = new OpenExitPipe(600, 250, 40, Orientation.VERTICAL, Direction.EAST);
    var closedPipe = new ClosedPipe(600, 300, 40, Orientation.VERTICAL, Direction.EAST);

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

    for(var [key, value] of binaryBoxsets) {
        var box = value.getBinaryBoxIndexForPoint(m.x, m.y);
        if (box == -1) continue;
        else value.boxes[box].invert();

        // console.log(value.getBinaryValue());
    }
    redraw();
}

function getMouse(e) {
    let rect = e.target.getBoundingClientRect();
    let pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
    return {x: parseInt(pos.x), y: parseInt(pos.y)};
}


// =============================== MODEL SECTION ===============================

// ---------------------------------- TextBox ----------------------------------

// A rectangular box with the specified text in the center.
function TextBox(x, y, width, height, text) {
    objects.push(this);

    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.font = Font.SMALL;
}

TextBox.prototype.draw = function () {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);

    c.fillStyle = "white";
    c.fillRect(this.x + border, this.y + border, this.width - 2  * border, this.height - 2 * border);

    c.font = this.font;
    c.fillStyle = "black";
    c.textAlign ="center";
    c.textBaseline = "middle";

    var lineheight = 40;
    var lines = this.text.split('\n');
    c.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
};

// Function to check whether a given set of coordinates is inside the box.
TextBox.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

// Gets the central coordinate of this text box
TextBox.prototype.getCenter = function() {
    return {x: (this.x + this.width / 2), y: (this.y + this.height / 2)};
}

// --------------------------------- BinaryBox ---------------------------------

function BinaryBox(x, y, size) {
    this.size = size;
    TextBox.call(this, x, y, size, size, "0", 10);
}

BinaryBox.prototype = Object.create(TextBox.prototype);
BinaryBox.prototype.constructor = BinaryBox;

BinaryBox.prototype.invert = function () {
    this.text = this.text == "0" ? "1" : "0";
}

// ------------------------------- BinaryBoxset --------------------------------

function BinaryBoxset(name, x, y, n, size, orientation) {
    objects.push(this);
    binaryBoxsets.set(name, this);

    this.name = name;
    this.size = size;
    this.orientation = orientation;
    this.boxes = [];

    var xOffset = orientation == Orientation.HORIZONTAL ? size - border: 0;
    var yOffset = orientation == Orientation.VERTICAL ? size - border: 0;

    for(var i = 0; i < n; i++) {
        this.boxes.push(new BinaryBox(x + xOffset * (i + 1), y + yOffset * (i + 1), size));
    }
}

BinaryBoxset.prototype.draw = function () {
    if(this.info !== undefined) {
        this.drawInfo();
    }
}

BinaryBoxset.prototype.getBinaryBoxIndexForPoint = function (x, y) {
    for (var i = 0, len = this.boxes.length; i < len; i++) {
        var box = this.boxes[i];
        if(box.contains(x, y)) return i;
    }
    return -1;
}

BinaryBoxset.prototype.getBinaryValue = function() {
    var binary = "";
    for (var i = 0; i < this.boxes.length; i++) {
        binary += this.boxes[i].text;
    }
    return binary;
}

 BinaryBoxset.prototype.setInfo = function(info, location) {
     this.info = info;
     this.location = location;
 }

 BinaryBoxset.prototype.drawInfo = function() {
     c.fillStyle = "black";
     c.font = Font.SMALL;

     for (var i = 0; i < this.info.length; i++) {
         var currentBox = this.boxes[i];

         var boxCenter = currentBox.getCenter();
         var x = boxCenter.x;
         var y = boxCenter.y;

         switch (this.orientation) {
             case Orientation.HORIZONTAL:
                y += this.location * 0.85 * this.size;
                break;
            case Orientation.VERTICAL:
                x += this.location * 0.90 * this.size;
                break;
         }
         c.fillText(this.info[i], x, y);
     }
 }


// ================================= Pipeline ==================================

// --------------------------------- OpenPipe ----------------------------------

/*
 Specifies the 'extra width' of the open side of the pipe. This is used to "cover up"
 a previously placed pipe. The purpose of this is purely aesthetic.
*/
var pipeExtra = 3;

function OpenPipe(x, y, length, orientation, direction) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.orientation = orientation;
    this.direction = direction;

    if (this.orientation == Orientation.HORIZONTAL) {
        this.topLeft = {x: this.x, y: this.y - border};
        new TextBox(this.topLeft.x, this.topLeft.y, this.length, BoxSize.SMALL, "");

        // "cover-up" rect values
        this.coverupX = this.topLeft.x - pipeExtra;
        this.coverupY = this.topLeft.y + border;
        this.coverupW = this.length + 2 * pipeExtra;
        this.coverupH = BoxSize.SMALL - 2 * border;

    } else if (this.orientation == Orientation.VERTICAL) {
        this.topLeft = {x: this.x - border, y: this.y};
        new TextBox(this.topLeft.x, this.topLeft.y, BoxSize.SMALL, this.length, "");

        // "cover-up" rect values
        this.coverupX = this.topLeft.x + border;
        this.coverupY = this.topLeft.y - pipeExtra;
        this.coverupW = BoxSize.SMALL - 2 * border;
        this.coverupH = this.length + 2 * pipeExtra;
    }

    // push 'this' AFTER creating the TextBox; this way the "cover-up" rect
    // will go over the TexBox's borders
    objects.push(this);
}

OpenPipe.prototype.draw = function() {
    c.fillStyle = "red";
    c.fillRect(this.coverupX, this.coverupY, this.coverupW, this.coverupH);
}

// ----------------------------- OpenEntrancePipe ------------------------------

function OpenEntrancePipe(x, y, length, orientation, direction) {
    OpenPipe.call(this, x, y, length, orientation, direction);

    if (orientation == Orientation.HORIZONTAL) {
        this.coverupW /= 2;
    } else if(orientation == Orientation.VERTICAL) {
        this.coverupH /= 2;
    }
}

OpenEntrancePipe.prototype = Object.create(OpenPipe.prototype);
OpenEntrancePipe.prototype.constructor = OpenEntrancePipe;

// ------------------------------- OpenExitPipe --------------------------------

function OpenExitPipe(x, y, length, orientation, direction) {
    OpenPipe.call(this, x, y, length, orientation, direction);

    if (orientation == Orientation.HORIZONTAL) {
        this.coverupW /= 2;
        this.coverupX += this.coverupW;
    } else if(orientation == Orientation.VERTICAL) {
        this.coverupH /= 2;
        this.coverupY += this.coverupH;
    }
}

OpenExitPipe.prototype = Object.create(OpenPipe.prototype);
OpenExitPipe.prototype.constructor = OpenExitPipe;

// -------------------------------- ClosedPipe ---------------------------------

function ClosedPipe(x, y, length, orientation, direction) {
    OpenPipe.call(this, x, y, length, orientation, direction);
    this.coverupW /= 2;
}

ClosedPipe.prototype = Object.create(OpenPipe.prototype);
ClosedPipe.prototype.constructor = ClosedPipe;

ClosedPipe.prototype.draw = function() {
    // do nothing
}


// =============================== LOGIC SECTION ===============================

// ------------------------------- Boolean logic -------------------------------


// ============================== UTILITY SECTION ==============================

var Font = {
    SMALL: "10px Arial",
    LARGE: "18px Arial"
}

var BoxSize = {
    SMALL: 20,
    LARGE: 50
};

var Orientation = {
    HORIZONTAL: "horizontal",
    VERTICAL: "vertical"
};

var Direction = {
    NORTH: -1,
    EAST: 1,
    WEST: -1,
    SOUTH: 1
};

init();
