var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

var hammingCoder = new BoxWithText(50, 35, 200, 50, "Hammingov koder");
var tile = new Tile(30, 30);

// Binding the click event on the canvas.
canvas.addEventListener('click', function(evt) {
    var mousePos = getMousePos(evt);

    /*
    if (isInside(mousePos,rect)) {
        alert('clicked inside rect');
    } else {
        alert('clicked outside rect');
    }
    */
}, false);

// Function to get the current mouse position.
function getMousePos( event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}
// Function to check whether a point is inside a rectangle.
function isInside(pos, rect){
    return pos.x > rect.x && pos.x < rect.x+rect.width && pos.y < rect.y+rect.height && pos.y > rect.y
}

// Empty box, with no text.
function EmptyBox(x, y, width, height) {
    var border = 1;
    c.fillStyle = "black";
    c.fillRect(x, y, width, height);
    c.fillStyle = "white";
    c.fillRect(x + border, y + border, width - 2 * border, height - 2 * border);
}

// A box with the specified text in the center.
function BoxWithText(x, y, width, height, text, fontSize) {
    EmptyBox(x, y, width, height);
    c.fillStyle = "black";

    var font = (fontSize !== undefined) ? fontSize + "px Arial" : "20px Arial";
    c.font = font;

    c.textAlign ="center";
    c.textBaseline = "middle";

    var textWidth = c.measureText(text).width;
    c.fillText(text, x + (width / 2), y + (height / 2));
}

function Tile(x, y) {
    BoxWithText(x, y, 20, 20, "0", 10);
}
