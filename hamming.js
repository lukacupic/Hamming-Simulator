function HammingCoderCanvas(canvasID) {
    /*
    The canvas object.
    */
    var canvas = document.getElementById(canvasID);

    /*
    The graphical representation of the canvas used for drawing.
    */
    var context = canvas.getContext('2d');

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

    /**
     * Fill color for the boxes.
     */
    var fillColor = "#ffffff";

    /**
     * Fill color for the clickable boxes.
     */
    var clickColor = "#dbe9ff"

    var Font = {
        SMALL: "10px serif",
        LARGE: "13.5px serif"
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

    var state = {
        evenParity: true,
        activeCircuit: null
    };
    this.state = state;


    // ============================== GENERAL SECTION ==============================

    // ------------------------- Circuit Overlay -----------------------------------

    function drawLabel(x, y, w, h, label, direction) {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = Font.LARGE;
        context.fillText(label, (x * 2 + w) / 2 + w * direction, (y * 2 + h) / 2);
    }

    function drawRect(x, y, w, h, symbol, label, negate) {
        if (label !== undefined) {
            drawLabel(x, y, w, h, label.name, label.dir);
        }

        context.fillStyle = fillColor;
        context.fillRect(x - 0.5, y - 0.5, w, h);
    
        context.rect(x - 0.5, y - 0.5, w, h);
        context.strokeStyle = "black";
        context.stroke();

        context.fillStyle = "black";
        context.textAlign="center";
        context.textBaseline = "middle";
        context.font = "15px Calibri";
        context.fillText(symbol, (x * 2 + w) / 2, (y * 2 + h) / 2);

        if (negate) {
            context.beginPath();
            var r = 2.8;
            context.arc(x + w + r , y + h / 2, r, 0, 2 * Math.PI);
            context.fill();
        }
    }
  
    function drawBox(x, y, size, symbol, negate) {
        drawRect(x, y, size, size, symbol, undefined, negate);
    }
    
    function drawDot(x, y) {
        context.beginPath();
        let r = 2.5;
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.fill();
    }

    function overlayCircuit() {
        context.save();
        
        let w = state.activeCircuit.circuitWidth;
        let h = state.activeCircuit.circuitHeight;

        context.translate(canvas.width / 2, canvas.height / 2);

        //let factor = canvas.width * 0.5 / w;
        context.scale(1.5, 1.5);
        context.translate(-w / 2, -h / 2);

        let circuitBorder = (w + h) / 2 * 0.1;
        context.translate(-circuitBorder, -circuitBorder);

        context.globalAlpha = 0.9;
        context.fillStyle = "#A9A9A9";
        context.fillRect(0, 0, w + circuitBorder * 2, h + circuitBorder * 2);
        context.globalAlpha = 1.0;

        context.fillStyle = "#000000";
        context.rect(0, 0, w + circuitBorder * 2, h + circuitBorder * 2);

        context.translate(circuitBorder, circuitBorder);

        state.activeCircuit.drawCircuit();
        context.restore();
    }

    function finishOverlay() {
        context.beginPath();
        context.stroke();
    }

    // -------------------------------- Misc ------------------------------------

    function reposition() {
        let w = 885;
        let h = 766;

        context.translate(canvas.width / 2, canvas.height / 2);

        let scaleX = canvas.width / w;
        let scaleY = canvas.height / h;

        if (scaleX < 1 || scaleY < 1) {
            let min = scaleX < scaleY ? scaleX : scaleY;
            context.scale(min, min);
        }
        
        context.translate(-w / 2, -h / 2);
    }

    function redraw() {
        simulate();
        //reposition();

        context.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0, len = objects.length; i < len; i++) {
            objects[i].draw();
        }

        if (state.activeCircuit != null) {
            overlayCircuit();
        }
    }
    this.redraw = redraw;

    function reset() {
        for (var [key, value] of boxsets) {
            value.resetBits();
        }
        redraw();
    }
    this.reset = reset;

    // ----------------------------------- Mouse -----------------------------------

    function mouseClicked(e) {
        let m = getMouse(e);

        for (let [key, value] of boxsets) {
            let box = value.getBinaryBoxIndexForPoint(m.x, m.y);
            if (box == -1) continue;

            // value is clicked boxset
            if (value.isClickable) {
                value.boxes[box].invert();
                simulate();
            }
        }
        redraw();
    }
    this.mouseClicked = mouseClicked;

    function mouseDoubleClicked(e) {
        var mouse = getMouse(e);

        if (state.activeCircuit != null) {
            state.activeCircuit = null;
        }

        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];

            if (!(obj instanceof LargeTextBox)) continue;
            if (mouse.x < obj.x) continue;
            if (mouse.x > obj.x + obj.width) continue;
            if (mouse.y < obj.y) continue;
            if (mouse.y > obj.y + obj.height) continue;

            state.activeCircuit = obj;
            break;
        }
        redraw();
        //redraw(); // This fixes the "phantom lines bug" but I have no idea why...
    }
    this.mouseDoubleClicked = mouseDoubleClicked;

    function getMouse(e) {
        let rect = e.target.getBoundingClientRect();
        let pos = {x: e.clientX - rect.left, y: e.clientY - rect.top};
        return {x: parseInt(pos.x), y: parseInt(pos.y)};
    }

    // Disable canvas selection
    canvas.onselectstart = function () {
        return false;
    }


    // =============================== MODEL SECTION ===============================

    // ---------------------------------- TextBox ----------------------------------

    // A rectangular box with the specified text in the center.
    function TextBox(x, y, width, height, text, font, isClickable) {
        objects.push(this);

        this.x = ~~x;
        this.y = ~~y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.font = font;
        this.isText = isText(this.text);
        this.isClickable = isClickable;
    }

    // Draws the textbox onto the canvas.
    TextBox.prototype.draw = function () {
        context.fillStyle = "black";
        context.fillRect(this.x, this.y, this.width, this.height);

        context.fillStyle = this.isClickable ? clickColor : fillColor;
        context.fillRect(this.x + border, this.y + border, this.width - 2 * border, this.height - 2 * border);

        context.fillStyle = "black";
        context.textAlign ="center";
        context.textBaseline = "middle";
        context.font = this.font != undefined ? this.font : Font.SMALL;

        let center = this.getCenter();

        if (!this.isText) {
            context.fillText(this.text, center.x, center.y);
            return;
        }

        // else, split the words and draw each in it's own line
        let height = parseInt(context.font) * 1.2;
        let lines = this.text.split("\n");

        for (let i = 0 ; i < lines.length; i++) {
            context.fillText(lines[i], center.x, center.y + height * i - height / 2);
        }
    };

    // Checks whether a given set of coordinates is inside the box.
    TextBox.prototype.contains = function (x, y) {
        return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
    }

    // Gets the central coordinate of this text box
    TextBox.prototype.getCenter = function() {
        return {x: (this.x + this.width / 2), y: (this.y + this.height / 2)};
    }

    TextBox.prototype.getSize = function() {
        return {width: this.width, height: this.height};
    }

    // -------------------------------- LargeTextBox --------------------------------

    // Creates a new BinaryBox at the given coordinates and of the given size.
    function LargeTextBox(x, y, width, height, text, isClickable) {
        TextBox.call(this, x, y, width, height, text, undefined, isClickable);

        this.font = Font.LARGE;
    }

    // Inherits properties from TextBox.
    LargeTextBox.prototype = Object.create(TextBox.prototype);
    LargeTextBox.prototype.constructor = LargeTextBox;

    // --------------------------------- BinaryBox ---------------------------------

    // Creates a new BinaryBox at the given coordinates and of the given size.
    function BinaryBox(x, y, size, isClickable) {
        this.size = size;
        this.isClickable = isClickable;


        if (size == BoxSize.LARGE) {
            LargeTextBox.call(this, x, y, size, size, "0", isClickable);
            
        } else {
            TextBox.call(this, x, y, size, size, "0", undefined, isClickable);
        }
    }

    // Inherits properties from TextBox.
    BinaryBox.prototype = Object.create(TextBox.prototype);
    BinaryBox.prototype.constructor = BinaryBox;

    // Inverts the current value.
    BinaryBox.prototype.invert = function () {
        this.text = this.text == "0" ? "1" : "0";
    }

    // Resets the value of this binary box to default (zero).
    BinaryBox.prototype.reset = function () {
        this.text = "0";
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

        let xOffset = orientation == Orientation.HORIZONTAL ? size - border: 0;
        let yOffset = orientation == Orientation.VERTICAL ? size - border: 0;

        for (let i = 0; i < n; i++) {
            // After the loop, xMax and yMax will hold the "size" of the whole BinaryBoxset
            this.xMax = this.x + xOffset * i;
            this.yMax = this.y + yOffset * i;
            this.boxes.push(new BinaryBox(this.xMax, this.yMax, this.size, this.isClickable));
        }
    }

    // Draws this boxset.
    BinaryBoxset.prototype.draw = function () {
        if (this.info !== undefined) {
            this.drawInfo();
        }
    }

    // Returns the box (of this Boxset) at the specified position.
    BinaryBoxset.prototype.getBinaryBoxIndexForPoint = function (x, y) {
        for (let i = 0, len = this.boxes.length; i < len; i++) {
            let box = this.boxes[i];
            if(box.contains(x, y)) return i;
        }
        return -1;
    }

    // Returns the (binary) value of this boxset.
    BinaryBoxset.prototype.getBits = function() {
        let binary = "";
        for (let i = 0; i < this.boxes.length; i++) {
            binary += this.boxes[i].text;
        }
        return binary;
    }

    // Sets the bits of this boxset.
    BinaryBoxset.prototype.setBits = function(bits) {
        for (let i = 0; i < bits.length; i++) {
            this.boxes[i].text = bits[i];
        }
    }

    // Resets the bits of this boxset.
    BinaryBoxset.prototype.resetBits = function() {
        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].reset();
        }
    }

    // Sets the information for this binary boxset (i.e. the information about
    // the bits of the boxset) at the given location (specified by Direction).
    BinaryBoxset.prototype.setInfo = function(info, location, font) {
        this.info = info;
        this.location = location;
        this.font = font;
    }

    // Draws the information of this binary boxset.
    BinaryBoxset.prototype.drawInfo = function() {
        context.fillStyle = "black";
        context.font = this.font != undefined ? this.font : Font.SMALL;

        for (let i = 0; i < this.boxes.length; i++) {
            let currentBox = this.boxes[i];

            let boxSize = currentBox.getSize();
            let x = currentBox.getCenter().x;
            let y = currentBox.getCenter().y;

            if (this.orientation == Orientation.HORIZONTAL) {
                y += this.location * boxSize.height * 0.8;

            } else {
                x += this.location * boxSize.width * 0.85;
            }
            
            context.fillText(this.info[i], x, y);
        }
    }

    BinaryBoxset.prototype.getLength = function() {
        return this.orientation == Orientation.HORIZONTAL ? this.xMax - this.x : this.yMax - this.y;
    }

    // --------------------------------- HammingCoder ----------------------------------

    function HammingCoder(x, y, width, height, text, decoder) {
        LargeTextBox.call(this, x, y, width, height, text);

        this.circuitWidth = 290;
        this.circuitHeight = 155;
        this.decoder = decoder;
    }

    HammingCoder.prototype = Object.create(LargeTextBox.prototype);
    HammingCoder.prototype.constructor = HammingCoder;

    HammingCoder.prototype.drawCircuit = function() {
        context.translate(15, 0);

        let dataBits = boxsets.get(this.decoder ? 'decoderCoder' : 'encoderCoder').getBits();

        // draw inputs
        drawRect(0, 0, 30, 30, dataBits[0], {name: "d3", dir: Direction.WEST});
        drawRect(0, 40, 30, 30, dataBits[1], {name: "d2", dir: Direction.WEST});
        drawRect(0, 80, 30, 30, dataBits[2], {name: "d1", dir: Direction.WEST});
        drawRect(0, 120, 30, 30, dataBits[3], {name: "d0", dir: Direction.WEST});

        // draw gates
        drawBox(150, 5, 40, "=1", false);
        drawBox(150, 60, 40, "=1", false);
        drawBox(150, 115, 40, "=1", false);

        // draw lines
        context.beginPath();
        context.moveTo(30, 15);
        context.lineTo(150, 15);
        context.stroke();

        context.beginPath();
        context.moveTo(50, 15);
        context.lineTo(50, 145);
        context.lineTo(150, 145);
        context.stroke();

        context.beginPath();
        context.moveTo(50, 15);
        context.lineTo(50, 80);
        context.lineTo(150, 80);
        context.stroke();

        context.beginPath();
        context.moveTo(30, 55);
        context.lineTo(120, 55);
        context.lineTo(120, 35);
        context.lineTo(150, 35);
        context.stroke();

        context.beginPath();
        context.moveTo(120, 35);
        context.lineTo(120, 70);
        context.lineTo(150, 70);
        context.stroke();

        context.beginPath();
        context.moveTo(30, 95);
        context.lineTo(70, 95);
        context.lineTo(70, 25);
        context.lineTo(150, 25);
        context.stroke();

        context.beginPath();
        context.moveTo(70, 95);
        context.lineTo(70, 125);
        context.lineTo(150, 125);
        context.stroke();

        context.beginPath();
        context.moveTo(30, 135);
        context.lineTo(150, 135);
        context.stroke();

        context.beginPath();
        context.moveTo(140, 135);
        context.lineTo(140, 90);
        context.lineTo(150, 90);
        context.stroke();

        context.beginPath();
        context.moveTo(190, 25);
        context.lineTo(230, 25);
        context.stroke();

        context.beginPath();
        context.moveTo(190, 80);
        context.lineTo(230, 80);
        context.stroke();

        context.beginPath();
        context.moveTo(190, 135);
        context.lineTo(230, 135);
        context.stroke();

        // draw dots
        drawDot(70, 95);
        drawDot(120, 55);
        drawDot(140, 135);
        drawDot(50, 80);
        drawDot(50, 15);

        // draw outputs
        let parityBits = boxsets.get(this.decoder ? 'decoderUpper' : 'encoderUpper').getBits();
        drawRect(230, 10, 30, 30, parityBits[2], {name: "c4", dir: Direction.EAST});
        drawRect(230, 65, 30, 30, parityBits[1], {name: "c2", dir: Direction.EAST});
        drawRect(230, 120, 30, 30, parityBits[0], {name: "c1", dir: Direction.EAST});
    }

    // --------------------------------- SyndromeGenerator ----------------------------------

    function SyndromeGenerator(x, y, width, height, text) {
        LargeTextBox.call(this, x, y, width, height, text);

        this.ioWidth = 20;
        this.ioHeight = 20;
        this.gateSize = 40;
        this.offset = 100;
        this.origin = {x: 15, y: 1};

        this.circuitWidth = this.ioWidth * 2 + this.gateSize + this.offset * 2 + 25;
        this.circuitHeight = this.origin.y + this.ioHeight * 10;
    }

    SyndromeGenerator.prototype = Object.create(LargeTextBox.prototype);
    SyndromeGenerator.prototype.constructor = SyndromeGenerator;

    SyndromeGenerator.prototype.drawCircuit = function() {
        let ioWidth = this.ioWidth;
        let ioHeight = this.ioHeight;
        let gateSize = this.gateSize;
        let offset = this.offset;
        let origin = this.origin;

        let lineOrigin = origin.x + ioWidth;

        // Get bits from the simulator
        let parityBitsUpper = boxsets.get('decoderUpper').getBits();
        let parityBitsLower = boxsets.get('decoderCentral').getBits();
        let outputBits = boxsets.get('sinGen').getBits();
        
        // inputs 1
        let input1 = {x: origin.x, y: origin.y};
        drawRect(input1.x, input1.y, ioWidth, ioHeight, parityBitsUpper[2], {name: "c4'", dir: Direction.WEST});
        
        let input2 = {x: origin.x, y: origin.y + ioHeight * 1.5};
        drawRect(input2.x, input2.y, ioWidth, ioHeight, parityBitsUpper[1], {name: "c2'", dir: Direction.WEST});
        
        let input3 = {x: origin.x, y: origin.y + ioHeight * 3};
        drawRect(input3.x, input3.y, ioWidth, ioHeight, parityBitsUpper[0], {name: "c1'", dir: Direction.WEST});
        
        // inputs 2
        let input4 = {x: origin.x, y: origin.y + ioHeight * 6};
        drawRect(input4.x, input4.y, ioWidth, ioHeight, parityBitsLower[2], {name: "c4", dir: Direction.WEST});
        
        let input5 = {x: origin.x, y: origin.y + ioHeight * 7.5};
        drawRect(input5.x, input5.y, ioWidth, ioHeight, parityBitsLower[1], {name: "c2", dir: Direction.WEST});
        
        let input6 = {x: origin.x, y: origin.y + ioHeight * 9};
        drawRect(input6.x, input6.y, ioWidth, ioHeight, parityBitsLower[0], {name: "c1", dir: Direction.WEST});
        
        // gates
        let gate1 = {x: lineOrigin + offset, y: origin.y + ioHeight * 2 - gateSize / 2}
        drawBox(gate1.x, gate1.y, gateSize, "=1");
        
        let gate2 = {x: lineOrigin + offset, y: origin.y + ioHeight * 5 - gateSize / 2}
        drawBox(gate2.x, gate2.y, gateSize, "=1");
        
        let gate3 = {x: lineOrigin + offset, y: origin.y + ioHeight * 8 - gateSize / 2}
        drawBox(gate3.x, gate3.y, gateSize, "=1");
        
        // outputs
        let output1 = {x: lineOrigin + gateSize + offset * 2, y: origin.y + ioHeight * 1.5}
        drawRect(output1.x, output1.y, ioWidth, ioHeight, outputBits[2], {name: "s4", dir: Direction.EAST});
        
        let output2 = {x: lineOrigin + gateSize + offset * 2, y: origin.y + ioHeight * 4.5}
        drawRect(output2.x, output2.y, ioWidth, ioHeight, outputBits[1], {name: "s2", dir: Direction.EAST});
        
        let output3 = {x: lineOrigin + gateSize + offset * 2, y: origin.y + ioHeight * 7.5}
        drawRect(output3.x, output3.y, ioWidth, ioHeight, outputBits[0], {name: "s1", dir: Direction.EAST});
        
        context.beginPath();
        context.moveTo(lineOrigin, origin.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 2 / 3, origin.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 2 / 3, gate1.y + gateSize / 3);
        context.lineTo(lineOrigin + offset, gate1.y + gateSize / 3);
        context.stroke();
        
        context.beginPath();
        context.moveTo(lineOrigin, input4.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 2 / 3, input4.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 2 / 3, gate1.y + gateSize * 2 / 3);
        context.lineTo(lineOrigin + offset, gate1.y + gateSize * 2 / 3);
        context.stroke();
        
        context.beginPath();
        context.moveTo(lineOrigin, input3.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 0.5, input3.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 0.5, gate3.y + gateSize * 1 / 3);
        context.lineTo(lineOrigin + offset, gate3.y + gateSize * 1 / 3);
        context.stroke();
        
        context.beginPath();
        context.moveTo(lineOrigin, input6.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 0.5, input6.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 0.5, gate3.y + gateSize * 2 / 3);
        context.lineTo(lineOrigin + offset, gate3.y + gateSize * 2 / 3);
        context.stroke();
        
        context.beginPath();
        context.moveTo(input2.x + ioWidth, input2.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 1 / 3, input2.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 1 / 3, gate2.y  + gateSize * 1 / 3);
        context.lineTo(lineOrigin + offset, gate2.y  + gateSize * 1 / 3);
        context.stroke();
        
        context.beginPath();
        context.moveTo(lineOrigin, input5.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 1 / 3, input5.y + ioHeight / 2);
        context.lineTo(lineOrigin + offset * 1 / 3, gate2.y  + gateSize * 2 / 3);
        context.lineTo(lineOrigin + offset, gate2.y  + gateSize * 2 / 3);
        context.stroke();

        context.beginPath();
        context.moveTo(gate1.x + gateSize, gate1.y + gateSize / 2);
        context.lineTo(gate1.x + gateSize + offset, gate1.y + gateSize / 2);
        context.stroke();

        context.beginPath();
        context.moveTo(gate2.x + gateSize, gate2.y + gateSize / 2);
        context.lineTo(gate2.x + gateSize + offset, gate2.y + gateSize / 2);
        context.stroke();

        context.beginPath();
        context.moveTo(gate3.x + gateSize, gate3.y + gateSize / 2);
        context.lineTo(gate3.x + gateSize + offset, gate3.y + gateSize / 2);
        context.stroke();

        finishOverlay();
    }

    // --------------------------------- CodeWordGenerator ----------------------------------

    function CodeWordGenerator(x, y, width, height, text) {
        LargeTextBox.call(this, x, y, width, height, text);

        this.ioWidth = 20;
        this.ioHeight = 20;
        this.gateSize = 40;
        this.offset = 150;
        this.origin = {x: 15, y: 1};

        this.circuitWidth = this.ioWidth + this.offset + 15;
        this.circuitHeight = this.origin.y + this.ioHeight * 11.5;
    }

    CodeWordGenerator.prototype = Object.create(LargeTextBox.prototype);
    CodeWordGenerator.prototype.constructor = CodeWordGenerator;

    CodeWordGenerator.prototype.drawCircuit = function() {
        let ioWidth = this.ioWidth;
        let ioHeight = this.ioHeight;
        let gateSize = this.gateSize;
        let offset = this.offset;
        let origin = this.origin;

        let lineOrigin = origin.x + ioWidth;
                
        let inputs = ["c4", "c2", "c1", "d7", "d6", "d5", "d3"];
        let inputsSorted = ["d7", "d6", "d5", "c4", "d3", "c2", "c1"];

        let parityBits = boxsets.get('encoderUpper').getBits();
        let dataBits = boxsets.get('encoderLower').getBits();
        let inputBits = [
            parityBits[2], parityBits[1], parityBits[0],
            dataBits[3], dataBits[2], dataBits[1], dataBits[0]
        ];

        let outputBits = boxsets.get('codeGenBoxset').getBits();
        
        for (let i = 0, j = 0; i < 8; i++, j++) {
            let factor = 1.5;
            let pos = {x: origin.x, y: origin.y + ioHeight * i * factor};
            let pos2 = {x: origin.x, y: origin.y + ioHeight * j * factor + 15};

            drawRect(pos.x, pos.y, ioWidth, ioHeight, inputBits[j], {name: inputs[j], dir: Direction.WEST});
            drawRect(offset, pos2.y, ioWidth, ioHeight, outputBits[j], {name: inputsSorted[j], dir: Direction.EAST});
            
            if (i == 2) i++;
        }

        let h = origin.y + ioHeight / 2;
        let lastY = 0.6;
        let lastYDec = 0.08;
        
        let h4 = h;
        context.beginPath();
        context.moveTo(lineOrigin, h4);
        context.lineTo(lineOrigin + offset * lastY, h4);
        context.lineTo(lineOrigin + offset * lastY, h4 + 104);
        context.lineTo(offset, h4 + 104);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h2 = h + ioHeight * 1.5;
        context.beginPath();
        context.moveTo(lineOrigin, h2);
        context.lineTo(lineOrigin + offset * lastY, h2);
        context.lineTo(lineOrigin + offset * lastY, h2 + 135);
        context.lineTo(offset, h2 + 135);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h1 = h + ioHeight * 3;
        context.beginPath();
        context.moveTo(lineOrigin, h1);
        context.lineTo(lineOrigin + offset * lastY, h1);
        context.lineTo(lineOrigin + offset * lastY, h1 + 135);
        context.lineTo(offset, h1 + 135);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h7 = h + ioHeight * 6;
        context.beginPath();
        context.moveTo(lineOrigin, h7);
        context.lineTo(lineOrigin + offset * lastY, h7);
        context.lineTo(lineOrigin + offset * lastY, h7 - 106);
        context.lineTo(offset, h7 - 106);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h6 = h + ioHeight * 7.5;
        context.beginPath();
        context.moveTo(lineOrigin, h6);
        context.lineTo(lineOrigin + offset * lastY, h6);
        context.lineTo(lineOrigin + offset * lastY, h6 - 106);
        context.lineTo(offset, h6 - 106);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h5 = h + ioHeight * 9;
        context.beginPath();
        context.moveTo(lineOrigin, h5);
        context.lineTo(lineOrigin + offset * lastY, h5);
        context.lineTo(lineOrigin + offset * lastY, h5 - 106);
        context.lineTo(offset, h5 - 106);
        context.stroke();
        
        lastY -= lastYDec;
        
        let h3 = h + ioHeight * 10.5;
        context.beginPath();
        context.moveTo(lineOrigin, h3);
        context.lineTo(lineOrigin + offset * lastY, h3);
        context.lineTo(lineOrigin + offset * lastY, h3 - 75);
        context.lineTo(offset, h3 - 75);
        context.stroke();
    }

    // --------------------------------- ErrorGenerator ----------------------------------

    function ErrorGenerator(x, y, width, height, text) {
        LargeTextBox.call(this, x, y, width, height, text);

        this.ioWidth = 20;
        this.ioHeight = 20;
        this.gateSize = 40;
        this.offset = 100;
        this.origin = {x: 1, y: -10};

        this.circuitWidth = this.ioWidth * 2 + this.gateSize + this.offset * 2;
        this.circuitHeight = this.origin.y + this.ioHeight * 6 * 3 + this.ioHeight * 1.25;
    }

    ErrorGenerator.prototype = Object.create(LargeTextBox.prototype);
    ErrorGenerator.prototype.constructor = ErrorGenerator;

    ErrorGenerator.prototype.drawCircuit = function() {
        let ioWidth = this.ioWidth;
        let ioHeight = this.ioHeight;
        let gateSize = this.gateSize;
        let offset = this.offset;
        let origin = this.origin;
            
        let lineOrigin = origin.x + ioWidth;
        
		let labels = ["d7", "d6", "d5", "c4", "d3", "c2", "c1"];

        let inputBits = reverse(boxsets.get('errGenUpper').getBits());
        let errorBits = reverse(boxsets.get('errGen').getBits());
        let outputBits = reverse(boxsets.get('errGenLower').getBits());
        
        for (let i = 0; i < 7; i++) {
            let heightUpper = origin.y + ioHeight * i * 3;
            let heightLower = heightUpper + ioHeight * 1.25;
            
            drawRect(origin.x, heightUpper, ioWidth, ioHeight, inputBits[i], {name: labels[i], dir: Direction.WEST});
            drawRect(origin.x, heightLower, ioWidth, ioHeight, errorBits[i], {name: "g" + (7-i), dir: Direction.WEST});
            
            context.beginPath();
            context.moveTo(lineOrigin, heightUpper + ioHeight * 0.5);
            context.lineTo(lineOrigin + offset, heightUpper + ioHeight * 0.5);
            context.stroke();
            
            context.beginPath();
            context.moveTo(lineOrigin, heightLower + ioHeight * 0.5);
            context.lineTo(lineOrigin + offset, heightLower + ioHeight * 0.5);
            context.stroke();
            
            let middleUpper = heightUpper + ioHeight * 0.5;
            let middleLower = heightLower + ioHeight * 0.5;
            let middle = (heightUpper + ioHeight * 0.5 + heightLower + ioHeight * 0.5) * 0.5 - gateSize * 0.5;
            let gateOrigin = {x: lineOrigin + offset, y: (middleUpper + middleLower) * 0.5 - gateSize * 0.5}
            
            drawRect(gateOrigin.x, gateOrigin.y, gateSize, gateSize, "=1");
            
            context.beginPath();
            context.moveTo(gateOrigin.x + gateSize, gateOrigin.y + gateSize * 0.5);
            context.lineTo(gateOrigin.x + gateSize + offset, gateOrigin.y + gateSize * 0.5);
            context.stroke();
            
            let outPos = {x: gateOrigin.x + gateSize + offset, y: middle + ioHeight * 0.5};
            drawRect(outPos.x, outPos.y, ioWidth, ioHeight, outputBits[i], {name: labels[i], dir: Direction.EAST});
        }
    }

    // --------------------------------- Correction ----------------------------------

    function Correction(x, y, width, height, text) {
        LargeTextBox.call(this, x, y, width, height, text);

        this.ioWidth = 20;
        this.ioHeight = 20;
        this.xorSize = 40;
        this.offset = 100;
        this.origin = {x: 1, y: 1};

        this.circuitWidth = 450;
        this.circuitHeight = 360;
    }

    Correction.prototype = Object.create(LargeTextBox.prototype);
    Correction.prototype.constructor = Correction;

    Correction.prototype.drawCircuit = function() {
        let ioWidth = this.ioWidth;
        let ioHeight = this.ioHeight;
        let xorSize = this.xorSize;
        let offset = this.offset;
        let origin = this.origin;

        let lineOrigin = origin.x + ioWidth + 30;
        let andYOffset = origin.y + ioHeight * 1.5 * 2 - xorSize * 0.5;
        
        let inputs = ["s4", "s2", "s1"];

        let SyndromeBits = boxsets.get('sinGen').getBits();
        let dataBits = reverse(boxsets.get('decoderLower').getBits());
        let outputBits = reverse(boxsets.get('lastBoxset').getBits());
        
        let nots = [];
        for (let i = 0; i < 3; i++) {
            let pos = {x: origin.x, y: origin.y + ioHeight * 1.5 * i};
            let xTopRight = lineOrigin + offset * 0.42 + offset * 0.13 * (3 - i);
            let xTopLeft = 0.1 * offset - offset * 0.15 * i; 
            
            drawRect(pos.x, pos.y, ioWidth, ioHeight, SyndromeBits[i], {name: inputs[i], dir: Direction.WEST});
            
            context.beginPath();
            context.moveTo(pos.x + ioWidth, pos.y + ioHeight / 2);
            context.lineTo(xTopRight, pos.y + ioHeight / 2);
            context.lineTo(xTopRight, origin.y + ioHeight * 8 + xorSize * 0.75 + andYOffset);
            context.stroke();
            
            context.beginPath();
            for (let j = 0; j < 4; j++) {
                let quarterY = origin.y + 0.5 * ioHeight * (5 * j + 1) + andYOffset + xorSize * (i + 1) / 4;

                if (j == i + 1) {
                    context.beginPath();
                    context.moveTo(lineOrigin + offset, quarterY);
                    context.lineTo(lineOrigin + xTopLeft, quarterY);
                    context.lineTo(lineOrigin + xTopLeft, pos.y + ioHeight * 0.5);
                    context.stroke();
                    drawDot(lineOrigin + xTopLeft, pos.y + ioHeight * 0.5);

                    nots.push({x: (lineOrigin * 2 + xTopLeft + offset * 0.42 + offset * 0.13) / 2, y: quarterY});
                    continue;
                }

                context.beginPath();
                context.moveTo(xTopRight, quarterY);
                drawDot(xTopRight, quarterY);
                context.lineTo(lineOrigin + offset, quarterY);
                context.stroke();
            }
        }

        let outputs = ["d7", "d6", "d5", "d3"];
        let in2Height = origin.y + ioHeight * 3.5 * 2.5 + xorSize * 2;
        
        for (let i = 0; i < 4; i++) {
            let and = {x: lineOrigin + offset, y: origin.y + ioHeight * i * 2.5 + ioHeight / 2 + andYOffset};
            drawBox(and.x, and.y, xorSize, "&");

            let xorHeight = ioHeight * i * 2.5 + xorSize / 2 + andYOffset;
            let xor = {x: lineOrigin + xorSize + offset * 2, y: origin.y + xorHeight};
            drawBox(xor.x, xor.y, xorSize, "=1");

            let out = {x: lineOrigin + xorSize + offset * 3.25, y: xorHeight + ioHeight / 2};
            drawRect(out.x, out.y, ioWidth, ioHeight, outputBits[3 - i], {name: outputs[i], dir: Direction.EAST});
            
            context.beginPath();
            context.moveTo(and.x + xorSize, and.y + xorSize / 2);
            context.lineTo(and.x + xorSize + offset, and.y + xorSize / 2);
            context.stroke();

            // andToOut
            context.beginPath();
            context.moveTo(lineOrigin + xorSize + offset * 2 + xorSize, origin.y + xorHeight + xorSize / 2);
            context.lineTo(lineOrigin + xorSize + offset * 3.25, origin.y + xorHeight + xorSize / 2);
            context.stroke();
        }
            
        // inputs 2
        for (let i = 0; i < 4; i++) {
            let h = in2Height + ioHeight * 1.5 * i;
            let smallOffset = offset * 0.25;
            let x1 = lineOrigin + offset + xorSize + smallOffset;;
            let x2 = x1 + offset - smallOffset * 2;

            drawRect(origin.x, h, ioWidth, ioHeight * 1, dataBits[i], {name: outputs[i], dir: Direction.WEST});

            context.beginPath();
            context.moveTo(origin.x + ioWidth, h + ioHeight / 2);
            context.lineTo(x1, h + ioHeight / 2);
            context.stroke();

            let currentPoint = {x: x1 + (x2 - x1) * i * 1 / 3, y: h + ioHeight / 2};
            let lineHeight = origin.y + ioHeight * i * 2.5 + xorSize / 2 + andYOffset + xorSize * 2 / 3;

            context.beginPath();
            context.moveTo(x1, h + ioHeight / 2);
            context.lineTo(currentPoint.x , currentPoint.y);
            context.stroke();

            context.beginPath();
            context.moveTo(x1, h + ioHeight / 2);
            context.lineTo(currentPoint.x, currentPoint.y);
            context.lineTo(currentPoint.x, lineHeight);
            context.lineTo(lineOrigin + offset * 2 + xorSize, lineHeight);
            context.stroke();
        }

        for (let i = 0; i < nots.length; i++) {
            let notPos = nots[i];
            let notSize = 16;
            drawBox(notPos.x - notSize * 0.5, notPos.y - notSize * 0.5, notSize, "1", true);
        }
    }

    // ================================= Pipeline ==================================

    // --------------------------------- OpenPipe ----------------------------------

    /*
    Specifies the 'extra width' of the open side of the pipe. This is used to
    "cover up" the previously placed pipe.
    */
    var pipeExtra = 3;

    function OpenPipe(x, y, length, orientation, showArrow) {
        this.x = ~~x
        this.y = ~~y;
        this.length = length;
        this.orientation = orientation;
        this.topLeft = {x: this.x, y: this.y};

        let triangle;
        this.reducedLength = this.length;
        
        if (showArrow === true) {
            triangle = new Triangle(this.topLeft.x, this.topLeft.y, this.length, this.orientation);
            this.reducedLength -= triangle.size;
        }

        if (this.orientation == Orientation.HORIZONTAL) {
            new TextBox(this.topLeft.x, this.topLeft.y, this.reducedLength, BoxSize.SMALL, "");

            // "cover-up" rect values
            this.coverupX = this.topLeft.x - pipeExtra;
            this.coverupY = this.topLeft.y + border;
            this.coverupW = this.length + 2 * pipeExtra;
            this.coverupH = BoxSize.SMALL - 2 * border;

        } else if (this.orientation == Orientation.VERTICAL) {
            new TextBox(this.topLeft.x, this.topLeft.y, BoxSize.SMALL, this.reducedLength, "");

            // "cover-up" rect values
            this.coverupX = this.topLeft.x + border;
            this.coverupY = this.topLeft.y - pipeExtra;
            this.coverupW = BoxSize.SMALL - 2 * border;
            this.coverupH = this.length + 2 * pipeExtra;
        }

        // push 'this' AFTER creating the TextBox; this way the "cover-up" rect
        // will go over the TexBox's borders
        objects.push(this);

        // push the triangle after pipe so it's drawn on top of it
        if (showArrow) {
            triangle.push();
        }
    }

    OpenPipe.prototype.draw = function() {
        context.fillStyle = fillColor;
        context.fillRect(this.coverupX, this.coverupY, this.coverupW, this.coverupH);
    }

    OpenPipe.prototype.setBoxset = function(size, name) {
        let x = this.x;
        let y = this.y;

        let offset = this.reducedLength / 2 - BoxSize.SMALL * size / 2;
        if(this.orientation == Orientation.HORIZONTAL) x += offset;
        else if(this.orientation == Orientation.VERTICAL) y += offset;

        this.boxset = new BinaryBoxset(name, x, y, size, BoxSize.SMALL, this.orientation);
    }

    OpenPipe.prototype.getBoxset = function() {
        return this.boxset;
    }

    // ------------------------------- HalfOpenPipe --------------------------------

    function HalfOpenPipe(x, y, length, orientation, direction, showArrow) {
        OpenPipe.call(this, x, y, length, orientation, showArrow);

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

    ClosedPipe.prototype.draw = function() {
        // do nothing
    }

    // -------------------------------- ClosedPipe ---------------------------------

    function ClosedPipe(x, y, length, orientation, showArrow) {
        OpenPipe.call(this, x, y, length, orientation, showArrow);
    }

    ClosedPipe.prototype = Object.create(OpenPipe.prototype);
    ClosedPipe.prototype.constructor = ClosedPipe;

    ClosedPipe.prototype.draw = function() {
        // do nothing
    }

    // --------------------------------- Triangle -----------------------------------

    function Triangle(x, y, length, orientation) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.orientation = orientation;
        this.size = BoxSize.SMALL * 0.85;
    }

    Triangle.prototype.constructor = Triangle;

    Triangle.prototype.draw = function() {
        if (this.orientation == Orientation.HORIZONTAL) {
            let h = 5;
            let origin = {x: this.x + this.length - this.size, y: this.y};

            context.fillStyle = "black";
            context.beginPath();
            context.moveTo(origin.x, origin.y);
            context.lineTo(origin.x, origin.y - h);
            context.lineTo(origin.x + this.size, origin.y + BoxSize.SMALL / 2);
            context.lineTo(origin.x, origin.y + BoxSize.SMALL + h);
            context.lineTo(origin.x, origin.y + BoxSize.SMALL);
            context.stroke();

        } else {
            let h = 5;
            let origin = {x: this.x, y: this.y + this.length - this.size};

            context.fillStyle = "black";
            context.beginPath();
            context.moveTo(origin.x, origin.y);
            context.lineTo(origin.x - h, origin.y);
            context.lineTo(origin.x + BoxSize.SMALL / 2, origin.y + this.size);
            context.lineTo(origin.x + BoxSize.SMALL + h, origin.y);
            context.lineTo(origin.x + BoxSize.SMALL, origin.y);
            context.stroke();
        }
    }

    Triangle.prototype.push = function() {
        objects.push(this);
    }


    // =============================== LOGIC SECTION ===============================

    function simulate() {
        // encoder
        let firstBoxset = boxsets.get('firstBoxset');
        let dataBits = firstBoxset.getBits();
        
        let encoderLower = boxsets.get('encoderLower');
        encoderLower.setBits(reverse(dataBits));

        let encoderCoder = boxsets.get('encoderCoder');
        encoderCoder.setBits(dataBits);

        let parityBits = calculateParityBitsFrom(reverse(dataBits));

        let encoderUpper = boxsets.get('encoderUpper');
        encoderUpper.setBits(parityBits);

        let allBits = combineBits(reverse(dataBits), parityBits);

        let codeGenBoxset = boxsets.get('codeGenBoxset');
        codeGenBoxset.setBits(reverse(allBits));

        // error generator

        let errGenUpper = boxsets.get('errGenUpper');
        errGenUpper.setBits(allBits);

        let errGen = boxsets.get('errGen');
        let errorBits = errGen.getBits();

        let propagatedBits = binaryOr(allBits, errorBits);

        let errGenLower = boxsets.get('errGenLower');
        errGenLower.setBits(propagatedBits);

        // decoder
		
        let separatedBits = separateBits(propagatedBits);
        let newDataBits = separatedBits.dataBits;
        let newParityBits = separatedBits.parityBits;

        let decoderCoder = boxsets.get('decoderCoder');
        decoderCoder.setBits(reverse(newDataBits));

        let decoderUpper = boxsets.get('decoderUpper');
        decoderUpper.setBits(calculateParityBitsFrom(newDataBits));

        let decoderCentral = boxsets.get('decoderCentral');
        decoderCentral.setBits(newParityBits);

        let sinGen = boxsets.get('sinGen');
        sinGen.setBits(binaryXor(decoderUpper.getBits(), decoderCentral.getBits()));

        let decoderLower = boxsets.get('decoderLower');
        decoderLower.setBits(newDataBits);

        let errIndex = binaryToDecimal(reverse(sinGen.getBits()));
        let fixed = fixError(propagatedBits, errIndex);

        let dataBitsOut = separateBits(fixed).dataBits;

        let preLast = boxsets.get('preLastBoxset');
        preLast.setBits(reverse(dataBitsOut));

        let last = boxsets.get('lastBoxset');
        last.setBits(reverse(dataBitsOut));
    }

    function fixError(bits, index) {
        if (index == 0) return bits;
        let replacement = bits[index - 1] == "0" ? "1" : "0";
        return bits.replaceAt(index - 1, replacement);
    }

    // ------------------------------- Calculations -------------------------------

    function calculateParityBitsFrom(dataBits) {
        let parityBits = "";
        let one = state.evenParity ? 0 : 1;
        parityBits += (Number(dataBits[0]) + Number(dataBits[1]) + Number(dataBits[3]) + one) % 2;
        parityBits += (Number(dataBits[0]) + Number(dataBits[2]) + Number(dataBits[3]) + one) % 2;
        parityBits += (Number(dataBits[1]) + Number(dataBits[2]) + Number(dataBits[3]) + one) % 2;
        return parityBits;
    }

    function combineBits(dataBits, parityBits) {
        let allBits = parityBits.substring(0, 2);
        allBits += dataBits.charAt(0);
        allBits += parityBits.charAt(2);
        allBits += dataBits.substring(1);
        return allBits;
    }

    function separateBits(allBits) {
        let dataBits = "";
        let parityBits = "";

        for (let i = 0; i < allBits.length; i++) {
            let bit = allBits[i];
            if (i == 2 || i > 3) {
                dataBits += bit;
            } else {
                parityBits += bit;
            }
        }
        return {dataBits: dataBits, parityBits: parityBits};
    }

    // Check what the hell is going on with these two methods
    function binaryOr(bits1, bits2) {
        let result = "";
        for (let i = 0; i < bits1.length; i++) {
            result += (Number(bits1[i]) + Number(bits2[i])) % 2;
        }
        return result;
    }

    function binaryXor(bits1, bits2) {
        let result = "";
        for (let i = 0; i < bits1.length; i++) {
            result += (Number(bits1[i]) + Number(bits2[i])) % 2;
        }
        return result;
    }


    // ============================== UTILITY SECTION ==============================

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

    function reverse(s){
        return s.split("").reverse().join("");
    }

    String.prototype.replaceAt = function(index, replacement) {
        return this.substr(0, index) + replacement + this.substr(index + replacement.length);
    }

    function binaryToDecimal(binary) {
        let dec = 0;
        for (let i = 0; i < binary.length; i++) {
            dec += Number(binary[i] * Math.pow(2, binary.length - i - 1));
        }
        return dec;
    }

    canvas.addEventListener("click", mouseClicked, false);
    canvas.addEventListener("dblclick", mouseDoubleClicked, false);

    // encoder
    var origin = {x: 1, y: 1};

    var dummyBoxset = new BinaryBoxset("lastBoxset", origin.x, origin.y, 4, BoxSize.LARGE, Orientation.VERTICAL, true);

    var firstBoxset = new BinaryBoxset("firstBoxset", origin.x, origin.y, 4, BoxSize.LARGE, Orientation.VERTICAL, true);
    firstBoxset.setInfo(["x3", "x2", "x1", "x0"], Direction.EAST, Font.LARGE);

    var pos1 = {x: BoxSize.LARGE, y: origin.y + 85};
    var pipe1 = new ClosedPipe(pos1.x, pos1.y, 175, Orientation.HORIZONTAL);

    var boxsetLen = BoxSize.SMALL * 4;
    var boxsetPos = {x: pos1.x + pipe1.length - border, y: pos1.y + BoxSize.SMALL / 2 - boxsetLen / 2 + border * 2};

    var coderSize = boxsetLen - border * 3;
    var coderPos = {x: pos1.x + pipe1.length - border + BoxSize.SMALL - border, y: pos1.y + BoxSize.SMALL / 2 - coderSize / 2};
    var coder = new HammingCoder(coderPos.x, coderPos.y, coderSize, coderSize, "Hammingov\nkoder", false);
	
	var boxsetEncoder = new BinaryBoxset("encoderCoder", boxsetPos.x, boxsetPos.y, 4, BoxSize.SMALL, Orientation.VERTICAL);
	//boxsetEncoder.setInfo(["d7", "d6", "d5", "d3"], Direction.EAST);

    var pos2 = {x: pos1.x + 0.75 * pipe1.length, y: pos1.y + BoxSize.SMALL};
    var pipe2 = new HalfOpenPipe(pos2.x, pos2.y, 85, Orientation.VERTICAL, Direction.NORTH);

    var pos3 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length - BoxSize.SMALL};
    var pipe3 = new OpenPipe(pos3.x, pos3.y, 273, Orientation.HORIZONTAL, true);
    pipe3.setBoxset(4, "encoderLower");
    pipe3.boxset.setInfo(["x0", "x1", "x2", "x3"], Direction.NORTH);

    var pos4 = {x: coderPos.x + coderSize - border, y: pos1.y};
    var pipe4 = new HalfOpenPipe(pos4.x, pos4.y, 135, Orientation.HORIZONTAL, Direction.EAST, true);
    pipe4.setBoxset(3, "encoderUpper");
    pipe4.boxset.setInfo(["c1", "c2", "c4"], Direction.NORTH);

    var codeGenBoxsetLen = BoxSize.SMALL * 7;
    var genSize = {x: 100, y: codeGenBoxsetLen - border * 6};
    var genPos = {x: pos4.x + pipe4.length, y: (pos1.y * 2 + BoxSize.SMALL + pipe2.length) / 2 - genSize.y / 2};
    var gen = new CodeWordGenerator(genPos.x, genPos.y, genSize.x, genSize.y, "Generator\nkodne\nriječi");

    var pos5 = {x: genPos.x + genSize.x - border, y: genPos.y + genSize.y / 2 - BoxSize.SMALL / 2};
    var pipe5 = new ClosedPipe(pos5.x, pos5.y, 200, Orientation.HORIZONTAL);

    var codeGenBoxset = new BinaryBoxset("codeGenBoxset", genPos.x + genSize.x - 1, genPos.y, 7, BoxSize.SMALL, Orientation.VERTICAL);
    codeGenBoxset.setInfo(["d7", "d6", "d5", "c4", "d3", "c2", "c1"], Direction.WEST);

    // error generator
    var pos6 = {x: pos5.x + pipe5.length - BoxSize.SMALL, y: pos5.y + BoxSize.SMALL};
    var pipe6 = new HalfOpenPipe(pos6.x, pos6.y, 130, Orientation.VERTICAL, Direction.NORTH);

    var pos7 = {x: (pos1.x * 2 + pos6.x + BoxSize.SMALL - border) / 2, y: pos5.y + pipe6.length};
    var pipe7 = new HalfOpenPipe(pos7.x, pos7.y, pos6.x - pos7.x + border, Orientation.HORIZONTAL, Direction.EAST);
    pipe7.setBoxset(7, "errGenUpper");
    pipe7.boxset.setInfo(["c1", "c2", "d3", "c4", "d5", "d6", "d7"], Direction.NORTH);

    var pos8 = {x: pos7.x, y: pos7.y + BoxSize.SMALL}
    var errGenVertPipeLength = 25;
    var pipe8 = new HalfOpenPipe(pos8.x, pos8.y, errGenVertPipeLength, Orientation.VERTICAL, Direction.NORTH, true);

    var genSize2 = {x: 375, y: 115};
    var genPos2 = {x: pos8.x - genSize2.x / 2 + BoxSize.SMALL / 2, y: pos8.y - border + pipe8.length};
    var gen2 = new ErrorGenerator(genPos2.x, genPos2.y, genSize2.x, genSize2.y, "Generator pogreške");

    var boxsetLen = BoxSize.SMALL * 7;
    var genBoxsetPos2 = {
        x: (genPos2.x * 2 + genSize2.x) / 2 - boxsetLen / 2, 
        y: (genPos2.y * 2 + genSize2.y) / 2 - BoxSize.SMALL / 2 + genSize2.y * 0.3
    };
    var genBoxset2 = new BinaryBoxset("errGen", genBoxsetPos2.x, genBoxsetPos2.y, 7, BoxSize.SMALL, Orientation.HORIZONTAL, true);
    genBoxset2.setInfo(["g1", "g2", "g3", "g4", "g5", "g6", "g7"], Direction.NORTH);

    var pos9 = {x: pos7.x, y: genPos2.y + genSize2.y - border};
    var pipe9 = new ClosedPipe(pos9.x, pos9.y, errGenVertPipeLength + BoxSize.SMALL - border, Orientation.VERTICAL);

    var errGenLowerPipeLength = pos9.x - pos1.x;
    var pos10 = {x: pos9.x - errGenLowerPipeLength, y: pos9.y + errGenVertPipeLength - border};
    var pipe10 = new HalfOpenPipe(pos10.x, pos10.y, errGenLowerPipeLength + border, Orientation.HORIZONTAL, Direction.EAST);
    pipe10.setBoxset(7, "errGenLower");
    pipe10.boxset.setInfo(["c1", "c2", "d3", "c4", "d5", "d6", "d7"], Direction.NORTH);

    var pos11 = {x: pos10.x, y: pos10.y + BoxSize.SMALL}
    var pipe11 = new HalfOpenPipe(pos11.x, pos11.y, pipe6.length, Orientation.VERTICAL, Direction.NORTH);

    // decoder
    var pos1 = {x: pos11.x + BoxSize.SMALL - border, y: ~~pos10.y + pipe11.length};
    var pipe1 = new HalfOpenPipe(pos1.x, pos1.y, pipe1.length - BoxSize.SMALL - 30, Orientation.HORIZONTAL, Direction.WEST);

    var boxsetLen = BoxSize.SMALL * 4;
    var boxsetPos = {x: pos1.x + pipe1.length - border, y: pos1.y + BoxSize.SMALL / 2 - boxsetLen / 2 + border * 2};

    var coderSize = {x:  boxsetLen - border * 3 + 15, y: boxsetLen - border * 3};
    var coderPos = {x: pos1.x + pipe1.length - border + BoxSize.SMALL - border, y: pos1.y + BoxSize.SMALL / 2 - coderSize.y / 2};
    var coder = new HammingCoder(coderPos.x, coderPos.y, coderSize.x, coderSize.y, "Hammingov\nkoder", true);

    var boxsetDecoder = new BinaryBoxset("decoderCoder", boxsetPos.x, boxsetPos.y, 4, BoxSize.SMALL, Orientation.VERTICAL);
    boxsetDecoder.setInfo(["d7", "d6", "d5", "d3"], Direction.EAST);

    var pos2 = {x: pos1.x + 0.6 * pipe1.length, y: pos1.y + BoxSize.SMALL};
    var pipe2 = new HalfOpenPipe(pos2.x, pos2.y, 170, Orientation.VERTICAL, Direction.NORTH);

    var pos3 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length / 2 - BoxSize.SMALL};
    var pipe3 = new OpenPipe(pos3.x, pos3.y, 276, Orientation.HORIZONTAL, true);
    pipe3.setBoxset(3, "decoderCentral");
    pipe3.boxset.setInfo(["c1", "c2", "c4"], Direction.NORTH);

    var pos4 = {x: coderPos.x + coderSize.x - border, y: pos1.y};
    var pipe4 = new HalfOpenPipe(pos4.x, pos4.y, 120, Orientation.HORIZONTAL, Direction.EAST, true);
    pipe4.setBoxset(3, "decoderUpper");
    pipe4.boxset.setInfo(["c1'", "c2'", "c4'"], Direction.NORTH);

    var genSize = {x: 75, y: 150};
    var genPos = {x: pos4.x + pipe4.length - border, y: (pos1.y * 2 + BoxSize.SMALL + pipe2.length / 2) / 2 - genSize.y / 2};
    var gen = new SyndromeGenerator(genPos.x, genPos.y, genSize.x, genSize.y, "Generator\nsindroma");

    var pos5 = {x: genPos.x + genSize.x - border, y: genPos.y + genSize.y / 2 - BoxSize.SMALL / 2};
    var pipe5 = new HalfOpenPipe(pos5.x, pos5.y, 120, Orientation.HORIZONTAL, Direction.EAST, true);
    pipe5.setBoxset(3, "sinGen");
    pipe5.boxset.setInfo(["s1", "s2", "s4"], Direction.NORTH);

    var pos6 = {x: pos2.x + BoxSize.SMALL, y: pos2.y + pipe2.length - BoxSize.SMALL};
    var pipe6 = new OpenPipe(pos6.x, pos6.y, pos5.x + pipe5.length - pos6.x, Orientation.HORIZONTAL, true);
    pipe6.setBoxset(4, "decoderLower");
    pipe6.boxset.setInfo(["d3", "d5", "d6", "d7"], Direction.NORTH);

    var corrSize = {x: 80, y: 200};
    var corrPos = {x: pos6.x + pipe6.length, y: (pos5.y + pos6.y) / 2 - corrSize.y / 2 + BoxSize.SMALL / 2};
    var corr = new Correction(corrPos.x, corrPos.y + 3, corrSize.x, corrSize.y - 3, "Ispravljanje");

    var pos7 = {x: corrPos.x + corrSize.x - border, y: corrPos.y + corrSize.y / 2 - BoxSize.SMALL / 2};
    var pipe7 = new HalfOpenPipe(pos7.x, pos7.y, 125, Orientation.HORIZONTAL, Direction.EAST, true);

    // temporary fix, I hope hope hope
    var dummy = new OpenPipe(10000, 10000, 1, Orientation.HORIZONTAL, true);

    var preLastBoxset = new BinaryBoxset("preLastBoxset", corrPos.x + corrSize.x - border, pos7.y - 85, 4, BoxSize.LARGE, Orientation.VERTICAL);
    preLastBoxset.setInfo(["d7'", "d6'", "d5'", "d3'"], Direction.EAST, Font.LARGE);

    var lastBoxset = new BinaryBoxset("lastBoxset", pos7.x + pipe7.length - border, pos7.y - 86, 4, BoxSize.LARGE, Orientation.VERTICAL );
    lastBoxset.setInfo(["x3", "x2", "x1", "x0"], Direction.EAST, Font.LARGE);

    redraw();
    
    return this;
}
