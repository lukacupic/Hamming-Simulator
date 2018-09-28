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
var boxsets = new Map();

/*
 The width of each of the component's border.
*/
var border = 1;

/*
 The background color of the canvas.
*/
var backgroundColor = "white";

/*
 The parity flag used for calculations of parity bits.
*/
var evenParity = true;

// ============================== GENERAL SECTION ==============================

function init() {
    canvas.addEventListener("click", mouseClicked, false);

    drawSchema();
    redraw();
}

function drawSchema() {
    var firstBoxset = new BinaryBoxset("firstBoxset", 1, 15, 4, BoxSize.LARGE, Orientation.VERTICAL, true);

    // encoder
    var pos1 = {x: 50, y: 100};
    var pipe1 = new ClosedPipe(pos1.x, pos1.y, 200, Orientation.HORIZONTAL);

    var boxsetLen = BoxSize.SMALL * 4;
    var boxsetPos = {x: pos1.x + pipe1.length - border, y: pos1.y + BoxSize.SMALL / 2 - boxsetLen / 2 + border * 2};
    var boxset1 = new BinaryBoxset("encoderCoder", boxsetPos.x, boxsetPos.y, 4, BoxSize.SMALL, Orientation.VERTICAL);

    var coderSize = boxsetLen - border * 3;
    var coderPos = {x: pos1.x + pipe1.length - border + BoxSize.SMALL - border, y: pos1.y + BoxSize.SMALL / 2 - coderSize / 2};
    var coder = new LargeTextBox(coderPos.x, coderPos.y, coderSize, coderSize, "Hammingov\nkoder");

    var pos2 = {x: pos1.x + 0.75 * pipe1.length, y: pos1.y + BoxSize.SMALL};
    var pipe2 = new HalfOpenPipe(pos2.x, pos2.y, 85, Orientation.VERTICAL, Direction.NORTH);

    var pos3 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length - BoxSize.SMALL};
    var pipe3 = new HalfOpenPipe(pos3.x, pos3.y, 250, Orientation.HORIZONTAL, Direction.WEST);
    pipe3.setBoxset(4, "encoderLower");
    pipe3.boxset.setInfo(["D3", "D5", "D6", "D7"], Direction.NORTH);

    var pos4 = {x: coderPos.x + coderSize - border, y: pos1.y};
    var pipe4 = new ClosedPipe(pos4.x, pos4.y, 105, Orientation.HORIZONTAL);
    pipe4.setBoxset(3, "encoderUpper");
    pipe4.boxset.setInfo(["C1", "C2", "C4"], Direction.NORTH);

    var genSize = {x: 75, y: 150};
    var genPos = {x: pos4.x + pipe4.length - border, y: (pos1.y * 2 + BoxSize.SMALL + pipe2.length) / 2 - genSize.y / 2};
    var gen = new LargeTextBox(genPos.x, genPos.y, genSize.x, genSize.y, "Generator\nkodne\nriječi");

    var pos5 = {x: genPos.x + genSize.x - border, y: genPos.y + genSize.y / 2 - BoxSize.SMALL / 2};
    var pipe5 = new ClosedPipe(pos5.x, pos5.y, 200, Orientation.HORIZONTAL);


    // error generator
    var pos6 = {x: pos5.x + pipe5.length - BoxSize.SMALL, y: pos5.y + BoxSize.SMALL};
    var pipe6 = new HalfOpenPipe(pos6.x, pos6.y, 115, Orientation.VERTICAL, Direction.NORTH);

    var pos7 = {x: (pos1.x * 2 + pos6.x + BoxSize.SMALL - border) / 2, y: pos5.y + pipe6.length};
    var pipe7 = new HalfOpenPipe(pos7.x, pos7.y, pos6.x - pos7.x + border, Orientation.HORIZONTAL, Direction.EAST);
    pipe7.setBoxset(7, "errGenUpper");
    pipe7.boxset.setInfo(["C1", "C2", "D3", "C4", "D5", "D6", "D7"], Direction.NORTH);

    var pos8 = {x: pos7.x, y: pos7.y + BoxSize.SMALL}
    var errGenVertPipeLength = 25;
    var pipe8 = new HalfOpenPipe(pos8.x, pos8.y, errGenVertPipeLength, Orientation.VERTICAL, Direction.NORTH);

    var genSize2 = {x: 375, y: 115};
    var genPos2 = {x: pos8.x - genSize2.x / 2 + BoxSize.SMALL / 2, y: pos8.y - border + pipe8.length};
    var gen2 = new LargeTextBox(genPos2.x, genPos2.y, genSize2.x, genSize2.y, "Generator pogreške");
    
    var boxsetLen = BoxSize.SMALL * 7;
    var genBoxsetPos2 = {
        x: (genPos2.x * 2 + genSize2.x) / 2 - boxsetLen / 2, 
        y: (genPos2.y * 2 + genSize2.y) / 2 - BoxSize.SMALL / 2 + genSize2.y * 0.3
    };
    var genBoxset2 = new BinaryBoxset("errGen", genBoxsetPos2.x, genBoxsetPos2.y, 7, BoxSize.SMALL, Orientation.HORIZONTAL, true);
    genBoxset2.setInfo(["C1", "C2", "D3", "C4", "D5", "D6", "D7"], Direction.NORTH);

    var pos9 = {x: pos7.x, y: genPos2.y + genSize2.y - border};
    var pipe9 = new ClosedPipe(pos9.x, pos9.y, errGenVertPipeLength + BoxSize.SMALL - border, Orientation.VERTICAL);

    var errGenLowerPipeLength = pos9.x - pos1.x;
    var pos10 = {x: pos9.x - errGenLowerPipeLength, y: pos9.y + errGenVertPipeLength - border};
    var pipe10 = new HalfOpenPipe(pos10.x, pos10.y, errGenLowerPipeLength + border, Orientation.HORIZONTAL, Direction.EAST);
    pipe10.setBoxset(7, "errGenLower");
    pipe10.boxset.setInfo(["C1", "C2", "D3", "C4", "D5", "D6", "D7"], Direction.NORTH);

    var pos11 = {x: pos10.x, y: pos10.y + BoxSize.SMALL}
    var pipe11 = new HalfOpenPipe(pos11.x, pos11.y, pipe6.length, Orientation.VERTICAL, Direction.NORTH);


    // decoder
    var pos1 = {x: pos11.x + BoxSize.SMALL - border, y: ~~pos10.y + pipe11.length};
    var pipe1 = new HalfOpenPipe(pos1.x, pos1.y, pipe1.length - BoxSize.SMALL, Orientation.HORIZONTAL, Direction.WEST);

    var boxsetLen = BoxSize.SMALL * 4;
    var boxsetPos = {x: pos1.x + pipe1.length - border, y: pos1.y + BoxSize.SMALL / 2 - boxsetLen / 2 + border * 2};
    var boxset1 = new BinaryBoxset("decoderCoder", boxsetPos.x, boxsetPos.y, 4, BoxSize.SMALL, Orientation.VERTICAL);

    var coderSize = boxsetLen - border * 3;
    var coderPos = {x: pos1.x + pipe1.length - border + BoxSize.SMALL - border, y: pos1.y + BoxSize.SMALL / 2 - coderSize / 2};
    var coder = new LargeTextBox(coderPos.x, coderPos.y, coderSize, coderSize, "Hammingov\nkoder");

    var pos2 = {x: pos1.x + 0.75 * pipe1.length, y: pos1.y + BoxSize.SMALL};
    var pipe2 = new HalfOpenPipe(pos2.x, pos2.y, 170, Orientation.VERTICAL, Direction.NORTH);

    var pos3 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length / 2 - BoxSize.SMALL};
    var pipe3 = new HalfOpenPipe(pos3.x, pos3.y, 250, Orientation.HORIZONTAL, Direction.WEST);
    pipe3.setBoxset(3, "decoderCentral");
    pipe3.boxset.setInfo(["C1", "C2", "C4"], Direction.NORTH);

    var pos4 = {x: coderPos.x + coderSize - border, y: pos1.y};
    var pipe4 = new ClosedPipe(pos4.x, pos4.y, 105, Orientation.HORIZONTAL);
    pipe4.setBoxset(3, "decoderUpper");
    pipe4.boxset.setInfo(["C1'", "C2'", "C4'"], Direction.NORTH);

    var genSize = {x: 75, y: 150};
    var genPos = {x: pos4.x + pipe4.length - border, y: (pos1.y * 2 + BoxSize.SMALL + pipe2.length / 2) / 2 - genSize.y / 2};
    var gen = new LargeTextBox(genPos.x, genPos.y, genSize.x, genSize.y, "Generator\nsindroma");

    var pos5 = {x: genPos.x + genSize.x - border, y: genPos.y + genSize.y / 2 - BoxSize.SMALL / 2};
    var pipe5 = new ClosedPipe(pos5.x, pos5.y, 105, Orientation.HORIZONTAL);
    pipe5.setBoxset(3, "sinGen");
    pipe5.boxset.setInfo(["S4", "S2", "S1"], Direction.NORTH);

    var pos6 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length - BoxSize.SMALL};
    var pipe6 = new HalfOpenPipe(pos6.x, pos6.y, pos5.x + pipe5.length - pos6.x, Orientation.HORIZONTAL, Direction.WEST);
    pipe6.setBoxset(4, "decoderLower");
    pipe6.boxset.setInfo(["D3", "D5", "D6", "D7"], Direction.NORTH);

    var corrSize = {x: 85, y: 200};
    var corrPos = {x: pos6.x + pipe6.length - border, y: (pos5.y + pos6.y) / 2 - corrSize.y / 2 + BoxSize.SMALL / 2};
    var corr = new LargeTextBox(corrPos.x, corrPos.y, corrSize.x, corrSize.y, "Ispravljanje");
}

function redraw() {
    c.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0, len = objects.length; i < len; i++) {
        objects[i].draw();
    }
}

// ----------------------------------- Mouse -----------------------------------

function mouseClicked(e) {
    var m = getMouse(e);

    for (var [key, value] of boxsets) {
        var box = value.getBinaryBoxIndexForPoint(m.x, m.y);
        if (box == -1) continue;

        // value is clicked boxset
        if (value.isClickable) {
            value.boxes[box].invert();
            simulate();
        }
    }
    redraw();
}

function getMouse(e) {
    var rect = e.target.getBoundingClientRect();
    var pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
    return {x: parseInt(pos.x), y: parseInt(pos.y)};
}


// =============================== MODEL SECTION ===============================

// ---------------------------------- TextBox ----------------------------------

// A rectangular box with the specified text in the center.
function TextBox(x, y, width, height, text, font) {
    objects.push(this);

    this.x = ~~x;
    this.y = ~~y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.font = font;
    this.isText = isText(this.text);
}

// Draws the textbox onto the canvas.
TextBox.prototype.draw = function () {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);

    c.fillStyle = "white";
    c.fillRect(this.x + border, this.y + border, this.width - 2 * border, this.height - 2 * border);

    c.fillStyle = "black";
    c.textAlign ="center";
    c.textBaseline = "middle";
    c.font = this.font != undefined ? this.font : Font.SMALL;

    if (!this.isText) {
        c.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
        return;
    }

    // else, split the words and draw each in it's own line
    var height = parseInt(c.font) * 1.2;
    var lines = this.text.split("\n");

    for (var i = 0 ; i < lines.length; i++) {
        c.fillText(lines[i], this.x + (this.width / 2), this.y + (this.height / 2) + height * i - height / 2);
    }
};

// Checks whether a given set of coordinates is inside the box.
TextBox.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

// Gets the central coordinate of this text box
TextBox.prototype.getCenter = function() {
    return {x: ~~(this.x + this.width / 2), y: ~~(this.y + this.height / 2)};
}

// -------------------------------- LargeTextBox --------------------------------

// Creates a new BinaryBox at the given coordinates and of the given size.
function LargeTextBox(x, y, width, height, text) {
    TextBox.call(this, x, y, width, height, text);

    this.font = Font.LARGE;
}

// Inherits properties from TextBox.
LargeTextBox.prototype = Object.create(TextBox.prototype);
LargeTextBox.prototype.constructor = LargeTextBox;

// --------------------------------- BinaryBox ---------------------------------

// Creates a new BinaryBox at the given coordinates and of the given size.
function BinaryBox(x, y, size) {
    this.size = size;
    TextBox.call(this, x, y, size, size, "0");
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
function BinaryBoxset(name, x, y, n, size, orientation, isClickable) {
    objects.push(this);
    boxsets.set(name, this);

    this.x = ~~x;
    this.y = ~~y;
    this.name = name;
    this.size = size;
    this.orientation = orientation;
    this.boxes = [];
    this.isClickable = isClickable === undefined ? false : isClickable;

    var xOffset = orientation == Orientation.HORIZONTAL ? size - border: 0;
    var yOffset = orientation == Orientation.VERTICAL ? size - border: 0;

    for(var i = 0; i < n; i++) {
         // After the loop, xMax and yMax will hold the "size" of the whole BinaryBoxset
        this.xMax = this.x + xOffset * i;
        this.yMax = this.y + yOffset * i;
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

// Returns the (binary) value of this boxset.
BinaryBoxset.prototype.getBits = function() {
    var binary = "";
    for (var i = 0; i < this.boxes.length; i++) {
        binary += this.boxes[i].text;
    }
    return binary;
}

// Sets the bits of this boxset.
BinaryBoxset.prototype.setBits = function(bits) {
    for (var i = 0; i < bits.length; i++) {
        this.boxes[i].text = bits[i];
    }
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

    for (var i = 0; i < this.boxes.length; i++) {
        var currentBox = this.boxes[i];

        var x = currentBox.getCenter().x;
        var y = currentBox.getCenter().y;

        if (this.orientation == Orientation.HORIZONTAL) {
            y += this.location * 0.80 * this.size;

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

function OpenPipe(x, y, length, orientation) {
    this.x = ~~x
    this.y = ~~y;
    this.length = length;
    this.orientation = orientation;
    this.topLeft = {x: this.x, y: this.y};

    if (this.orientation == Orientation.HORIZONTAL) {
        new TextBox(this.topLeft.x, this.topLeft.y, this.length, BoxSize.SMALL, "");

        // "cover-up" rect values
        this.coverupX = this.topLeft.x - pipeExtra;
        this.coverupY = this.topLeft.y + border;
        this.coverupW = this.length + 2 * pipeExtra;
        this.coverupH = BoxSize.SMALL - 2 * border;

    } else if (this.orientation == Orientation.VERTICAL) {
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

OpenPipe.prototype.setBoxset = function(size, name) {
    var x = this.x;
    var y = this.y;

    var offset = this.length / 2 - BoxSize.SMALL * size / 2;
    if(this.orientation == Orientation.HORIZONTAL) x += offset;
    else if(this.orientation == Orientation.VERTICAL) y += offset;

    this.boxset = new BinaryBoxset(name, x, y, size, BoxSize.SMALL, this.orientation);
}

OpenPipe.prototype.getBoxset = function() {
    return this.boxset;
}

// ------------------------------- HalfOpenPipe --------------------------------

function HalfOpenPipe(x, y, length, orientation, direction) {
    OpenPipe.call(this, x, y, length, orientation, direction);

    if (orientation == Orientation.HORIZONTAL) {
        this.coverupW /= 2;
        
        if (direction == Direction.EAST) {
            this.coverupX += this.coverupW;
        }

    } else if(orientation == Orientation.VERTICAL) {
        this.coverupH /= 2;

        if (direction == Direction.SOUTH) {
            this.coverupY += this.coverupH;
        }
    }
}

HalfOpenPipe.prototype = Object.create(OpenPipe.prototype);
HalfOpenPipe.prototype.constructor = HalfOpenPipe;

// -------------------------------- ClosedPipe ---------------------------------

function ClosedPipe(x, y, length, orientation) {
    OpenPipe.call(this, x, y, length, orientation);
}

ClosedPipe.prototype = Object.create(OpenPipe.prototype);
ClosedPipe.prototype.constructor = ClosedPipe;

ClosedPipe.prototype.draw = function() {
    // do nothing
}

// =============================== LOGIC SECTION ===============================

function simulate() {
    // encoder
    var firstBoxset = boxsets.get('firstBoxset');
    var dataBits = firstBoxset.getBits();
    
    var encoderLower = boxsets.get('encoderLower');
    encoderLower.setBits(dataBits);

    var encoderCoder = boxsets.get('encoderCoder');
    encoderCoder.setBits(dataBits);

    var parityBits = calculateParityBitsFrom(dataBits);

    var encoderUpper = boxsets.get('encoderUpper');
    encoderUpper.setBits(parityBits);

    var allBits = combineBits(dataBits, parityBits);

    // error generator
    var errGenUpper = boxsets.get('errGenUpper');
    errGenUpper.setBits(allBits);

    var errGen = boxsets.get('errGen');
    var errorBits = errGen.getBits();

    var propagatedBits = binaryOr(allBits, errorBits);

    var errGenLower = boxsets.get('errGenLower');
    errGenLower.setBits(propagatedBits);

    // decoder
    var separatedBits = separateBits(propagatedBits);
    var newDataBits = separatedBits.dataBits;
    var newParityBits = separatedBits.parityBits;

    var decoderCoder = boxsets.get('decoderCoder');
    decoderCoder.setBits(newDataBits);

    var decoderUpper = boxsets.get('decoderUpper');
    decoderUpper.setBits(calculateParityBitsFrom(newDataBits));

    var decoderCentral = boxsets.get('decoderCentral');
    decoderCentral.setBits(newParityBits);

    var sinGen = boxsets.get('sinGen');
    sinGen.setBits(binaryXor(decoderUpper.getBits(), decoderCentral.getBits()));

    var decoderLower = boxsets.get('decoderLower');
    decoderLower.setBits(newParityBits);
}

// ------------------------------- Boolean logic -------------------------------

function calculateParityBitsFrom(dataBits) {
    var parityBits = "";
    parityBits += (Number(dataBits[0]) + Number(dataBits[1]) + Number(dataBits[3])) % 2;
    parityBits += (Number(dataBits[0]) + Number(dataBits[2]) + Number(dataBits[3])) % 2;
    parityBits += (Number(dataBits[1]) + Number(dataBits[2]) + Number(dataBits[3])) % 2;
    return parityBits;
}

function combineBits(dataBits, parityBits) {
    var allBits = parityBits.substring(0, 2);
    allBits += dataBits.charAt(0);
    allBits += parityBits.charAt(2);
    allBits += dataBits.substring(1);
    return allBits;
}

function separateBits(allBits) {
    var dataBits = "";
    var parityBits = "";

    for (var i = 0; i < allBits.length; i++) {
        var bit = allBits[i];
        if (i == 2 || i > 3) dataBits += bit;
        else parityBits += bit;
    }
    return {dataBits: dataBits, parityBits: parityBits};
}

// Check what the hell is going on with these two methods
function binaryOr(bits1, bits2) {
    var result = "";
    for (var i = 0; i < bits1.length; i++) {
        result += (Number(bits1[i]) + Number(bits2[i])) % 2;
    }
    return result;
}

function binaryXor(bits1, bits2) {
    var result = "";
    for (var i = 0; i < bits1.length; i++) {
        result += (Number(bits1[i]) + Number(bits2[i])) % 2;
    }
    return result;
}

// ============================== UTILITY SECTION ==============================

var Font = {
    SMALL: "10px Arial",
    LARGE: "14px Arial"
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
    return {x: scaleX(x), y: scaleY(y)};
}

function scaleX(x) {
    return x / 1000 * canvas.width;
}

function scaleY(y) {
    return y / 1000 * canvas.height;
}

/**
 * Checks if the given string is a text (i.e. made only of letters and
 * empty characters).
 */
function isText(str) {
    return /^[a-zčćđšžA-ZČĆĐŠŽ \n]+$/.test(str);
}

/**
 * Start everything.
 */
init();
