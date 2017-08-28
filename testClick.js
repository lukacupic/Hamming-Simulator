let itemsToDraw = [];
let canvas = document.getElementById("testClick");


function init() {
    let button = new Square("ClickMe", 200, 100, 100, 50, "cadetblue");
    itemsToDraw.push(button);

    addEventListeners(canvas);

    redraw();
}


function redraw() {
    let ctx = canvas.getContext("2d");
    itemsToDraw.forEach((item) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        item.draw(ctx);
    });
}


Square.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.fillStyle;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    ctx.fillStyle = "black";
    ctx.baseline = "middle";
    ctx.fillText(this.text, this.x + 5, this.y + this.h / 2);
};


function eventClickCallback(e) {
    let m = getMouse(e);

    console.log("Got click at: ", m.x, m.y);
    itemsToDraw.forEach((item) => {
        if (item.contains(m.x, m.y)) {
            //alert("Clicked an item with text:" + item.text);
            item.text = ((item.text === "ClickMe") ? "Clicked me" : "ClickMe");
            item.fillStyle = ((item.text === "ClickMe") ? "cadetblue" : "#FF0000" );
        }

    });

    redraw();
}


function Square(text, x, y, w, h, fillStyle) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;

    this.text = text;
    this.fillStyle = fillStyle || "cadetBlue";
}


Square.prototype.contains = function (x, y) {
    return containsForRectangle(x, y, this);
};


function addEventListeners(canvas) {
    canvas.addEventListener("click", eventClickCallback, false);
}


function getMouse(e) {
    let rect = e.target.getBoundingClientRect();
    let pos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };

    return {x: parseInt(pos.x), y: parseInt(pos.y)}
}


function containsForRectangle(mx, my, o) {
    return (o.x <= mx) && ((o.x + o.w) >= mx) &&
        (o.y <= my) && ((o.y + o.h) >= my);
}


init();
