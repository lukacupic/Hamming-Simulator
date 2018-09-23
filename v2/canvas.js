/*
 The canvas object.
 */
var canvas = document.querySelector('canvas');

/*
 The graphical representation of the canvas used for drawing.
 */
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
    canvas.addEventListener("click", mouseClicked, false);

    layoutThePipes();
    redraw();
}

function layoutThePipes() {
	/*
    var hammingCoder = new TextBox(50, 35, 200, 50, "Hammingov koder");
    var hammingDecoder = new TextBox(50, 170, 200, 50, "Hammingov dekoder");

    var boxset2 = new BinaryBoxset("testBoxset2", 300, 125, 5, BoxSize.SMALL, Orientation.VERTICAL);
    boxset2.setInfo(["A", "A", "A", "A", "A"], Direction.EAST);

    var boxset = new BinaryBoxset("testBoxset", 50, 125, 5, BoxSize.SMALL, Orientation.HORIZONTAL);

    var openPipe = new OpenPipe(400, 150, 40, Orientation.HORIZONTAL, Direction.EAST);
    var closedPipe = new ClosedPipe(400, 255, 40, Orientation.HORIZONTAL, Direction.EAST);

    var openPipe = new OpenPipe(600, 150, 40, Orientation.VERTICAL, Direction.EAST);
    var closedPipe = new ClosedPipe(600, 300, 40, Orientation.VERTICAL, Direction.EAST);
    */
	
    var openPipe = new HalfOpenPipe({x: 100, y: 100}, 40, Orientation.HORIZONTAL, Direction.WEST);
    //var openPipe = new OpenPipe({x: 100, y: 100}, 40, Orientation.VERTICAL, Direction.EAST);
    
    //var boxset2 = new BinaryBoxset("testBoxset2", 300, 125, 5, BoxSize.SMALL, Orientation.VERTICAL);
    //boxset2.setInfo(["A", "A", "A", "A", "A"], Direction.WEST);

    //var closedPipe = new ClosedPipe(600, 300, 40, Orientation.VERTICAL, Direction.EAST);
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

// Draws the textbox onto the canvas.
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

// Checks whether a given set of coordinates is inside the box.
TextBox.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

// Gets the central coordinate of this text box
TextBox.prototype.getCenter = function() {
    return {x: (this.x + this.width / 2), y: (this.y + this.height / 2)};
}

// --------------------------------- BinaryBox ---------------------------------

// Creates a new BinaryBox at the given coordinates and of the given size.
function BinaryBox(x, y, size) {
    this.size = size;
    TextBox.call(this, x, y, size, size, "0", 10);
}

// Inherits properties from TextBox.
BinaryBox.prototype = Object.create(TextBox.prototype);
BinaryBox.prototype.constructor = BinaryBox;

// Inverts the current value.
BinaryBox.prototype.invert = function () {
    this.text = this.text == "0" ? "1" : "0";
}

// ------------------------------- BinaryBoxset --------------------------------

// Creates a new BinaryBoxset with the given parameters.
function BinaryBoxset(name, x, y, n, size, orientation) {
    objects.push(this);
    binaryBoxsets.set(name, this);

    this.x = x;
    this.y = y;
    this.name = name;
    this.size = size;
    this.orientation = orientation;
    this.boxes = [];

    var xOffset = orientation == Orientation.HORIZONTAL ? size - border: 0;
    var yOffset = orientation == Orientation.VERTICAL ? size - border: 0;

    for(var i = 0; i < n; i++) {
         // After the loop, xMax and yMax will hold the "size" of the whole BinaryBoxset
        this.xMax = x + xOffset * i;
        this.yMax = y + yOffset * i;
        this.boxes.push(new BinaryBox(this.xMax, this.yMax, size));
    }
}

// Draws this boxset.
BinaryBoxset.prototype.draw = function () {
    if(this.info !== undefined) {
        this.drawInfo();
    }
}

// Returns the box (of this Boxset) at the specified position.
BinaryBoxset.prototype.getBinaryBoxIndexForPoint = function (x, y) {
    for (var i = 0, len = this.boxes.length; i < len; i++) {
        var box = this.boxes[i];
        if(box.contains(x, y)) return i;
    }
    return -1;
}

// Returns the binary value of this boxset.
BinaryBoxset.prototype.getBinaryValue = function() {
    var binary = "";
    for (var i = 0; i < this.boxes.length; i++) {
        binary += this.boxes[i].text;
    }
    return binary;
}

// Sets the information for this binary boxset (i.e. the information about
// the bits of the boxset) at the given location (specified by Direction).
BinaryBoxset.prototype.setInfo = function(info, location) {
    this.info = info;
    this.location = location;
}

// Draws the informataion of this binary boxset.
BinaryBoxset.prototype.drawInfo = function() {
    c.fillStyle = "black";
    c.font = Font.SMALL;

    for (var i = 0; i < this.info.length; i++) {
        var currentBox = this.boxes[i];

        var x = currentBox.getCenter().x;
        var y = currentBox.getCenter().y;
		
		if(this.orientation == Orientation.HORIZONTAL) {
			y += this.location * 0.85 * this.size;
		
		} else {
			x += this.location * 0.90 * this.size;
		}
		
        c.fillText(this.info[i], x, y);
    }
}

BinaryBoxset.prototype.getLength = function() {
    return this.orientation == Orientation.HORIZONTAL ? this.xMax - this.x : this.yMax - this.y;
}


// ================================= Pipeline ==================================

// --------------------------------- OpenPipe ----------------------------------

/*
 Specifies the 'extra width' of the open side of the pipe. This is used to
 "cover up" the previously placed pipe.
*/
var pipeExtra = 3;

function OpenPipe(pipe, length, orientation, direction) {
    var realCoord = getRealCoordinate(pipe.x, pipe.y);
    this.x = realCoord.x
    this.y = realCoord.y;

    this.length = length;
    this.orientation = orientation;
    this.direction = direction;

    if (this.orientation == Orientation.HORIZONTAL) {
        this.topLeft = {x: this.x, y: this.y};
        new TextBox(this.topLeft.x, this.topLeft.y, this.length, BoxSize.SMALL, "");

        // "cover-up" rect values
        this.coverupX = this.topLeft.x - pipeExtra;
        this.coverupY = this.topLeft.y + border;
        this.coverupW = this.length + 2 * pipeExtra;
        this.coverupH = BoxSize.SMALL - 2 * border;

    } else if (this.orientation == Orientation.VERTICAL) {
        this.topLeft = {x: this.x, y: this.y};
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
    c.fillStyle = "white";
    c.fillRect(this.coverupX, this.coverupY, this.coverupW, this.coverupH);
}

OpenPipe.prototype.setBoxset = function(size) {
    var x = this.x;
    var y = this.y;

    var offset = this.length / 2 - BoxSize.SMALL * size / 2;
    if(this.orientation == Orientation.HORIZONTAL) x += offset;
    else if(this.orientation == Orientation.VERTICAL) y += offset;

    this.boxset = new BinaryBoxset("testBoxset", x, y, size, BoxSize.SMALL, this.orientation);
}

OpenPipe.prototype.getBoxset = function() {
    return this.boxset;
}

// ------------------------------- HalfOpenPipe --------------------------------

function HalfOpenPipe(pipe, length, orientation, direction) {
    OpenPipe.call(this, pipe, length, orientation, direction);

    if (orientation == Orientation.HORIZONTAL) {
        this.coverupW /= 2;
        
        if (direction == Direction.WEST) {
            this.coverupX += this.coverupW;
        }

    } else if(orientation == Orientation.VERTICAL) {
        this.coverupH /= 2;

        if (direction == Direction.WEST) {
            this.coverupY += this.coverupH;
        }
    }
}

HalfOpenPipe.prototype = Object.create(OpenPipe.prototype);
HalfOpenPipe.prototype.constructor = HalfOpenPipe;

// -------------------------------- ClosedPipe ---------------------------------

function ClosedPipe(pipe, length, orientation, direction) {
    OpenPipe.call(this, pipe, length, orientation, direction);
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
    SMALL: 25,
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

// Converts the given coordinate (with respect to the upper-left corner)
// to the absolute coordinate defined by the size of the canvas.
function getRealCoordinate(x, y) {
    return {x: x * 0.001 * canvas.width, y: y * 0.001 * canvas.height};
}

init();
