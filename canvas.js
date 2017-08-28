var canvas = document.querySelector('canvas');
var c = canvas.getContext('2d');

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener("click", mouseClicked, false);

    var hammingCoder = new BoxWithText(50, 35, 200, 50, "Hammingov koder");
    tile = new Tile(25, 30);
}

function mouseClicked(e) {
    let m = getMouse(e);

    //console.log("Got click at: ", m.x, m.y);
    if (tile.contains(m.x, m.y)) {
        console.log("Clicked the tile!");
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

/*
// Function to get the current mouse position.
function getMousePos( event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
*/

// A rectangular box with the specified text in the center.
function BoxWithText(x, y, width, height, text, fontSize) {
    this.border = 1;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;

    this.font = (fontSize !== undefined) ? fontSize + "px Arial" : "20px Arial";

    this.draw();
}

BoxWithText.prototype.draw = function () {
    c.fillStyle = "black";
    c.fillRect(this.x, this.y, this.width, this.height);

    c.fillStyle = "white";
    c.fillRect(this.x + this.border, this.y + this.border, this.width - 2 * this.border, this.height - 2 * this.border);

    c.fillStyle = "black";
    c.font = this.font;
    c.textAlign ="center";
    c.textBaseline = "middle";
    c.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
};

// Function to check whether a given set of coordinates is inside the box.
BoxWithText.prototype.contains = function (x, y) {
    return x > this.x && x < this.x + this.width && y > this.y && y < this.y + this.height;
}

function Tile(x, y) {
    return new BoxWithText(x, y, 20, 20, "0", 10);
}

init();
