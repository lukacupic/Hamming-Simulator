function drawBox(x, y, size, symbol, negate, context) {
    context.rect(x, y, size, size);
    context.stroke();

    context.textAlign="center";
    context.textBaseline = "middle";
    context.font = "15px Calibri";
    context.fillText(symbol, (x * 2 + size) / 2, (y * 2 + size) / 2);

    if (negate) {
        context.beginPath();
        var r = 4;
        context.arc(x + size + r , y + size / 2, r, 0, 2 * Math.PI);
        context.stroke();
    }
}

function dot(x, y, context) {
    context.beginPath();
    var r = 2.5;
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.fill();
}

function Circuit(canvasID) {
	var canvas = document.getElementById(canvasID);
    var context = canvas.getContext('2d');
    
    var scale = true;
    var factor = 1.5;
    if (scale) {
        canvas.width *= factor;
        canvas.height *= factor;
        context.scale(factor, factor);
    }

    // draw inputs
    drawBox(30, 30, 30, "d3", false, context);
    drawBox(30, 70, 30, "d2", false, context);
    drawBox(30, 110, 30, "d1", false, context);
    drawBox(30, 150, 30, "d0", false, context);

    // draw gates
    drawBox(180, 35, 40, "&", false, context);
    drawBox(180, 90, 40, "&", false, context);
    drawBox(180, 145, 40, "&", false, context);

    // draw lines
    context.beginPath();
    context.moveTo(60, 45);
    context.lineTo(180, 45);
    context.stroke();
    
    context.beginPath();
    context.moveTo(80, 45);
    context.lineTo(80, 175);
    context.lineTo(180, 175);
    context.stroke();

    context.beginPath();
    context.moveTo(80, 45);
    context.lineTo(80, 110);
    context.lineTo(180, 110);
    context.stroke();

    context.beginPath();
    context.moveTo(60, 85);
    context.lineTo(150, 85);
    context.lineTo(150, 65);
    context.lineTo(180, 65);
    context.stroke();

    context.beginPath();
    context.moveTo(150, 65);
    context.lineTo(150, 100);
    context.lineTo(180, 100);
    context.stroke();

    context.beginPath();
    context.moveTo(60, 125);
    context.lineTo(100, 125);
    context.lineTo(100, 55);
    context.lineTo(180, 55);
    context.stroke();

    context.beginPath();
    context.moveTo(100, 125);
    context.lineTo(100, 155);
    context.lineTo(180, 155);
    context.stroke();

    context.beginPath();
    context.moveTo(60, 165);
    context.lineTo(180, 165);
    context.stroke();

    context.beginPath();
    context.moveTo(170, 165);
    context.lineTo(170, 120);
    context.lineTo(180, 120);
    context.stroke();

    context.beginPath();
    context.moveTo(220, 55);
    context.lineTo(260, 55);
    context.stroke();

    context.beginPath();
    context.moveTo(220, 110);
    context.lineTo(260, 110);
    context.stroke();

    context.beginPath();
    context.moveTo(220, 165);
    context.lineTo(260, 165);
    context.stroke();

    // draw dots
    dot(100, 125, context);
    dot(150, 85, context);
    dot(170, 165, context);
    dot(80, 110, context);
    dot(80, 45, context);

    // draw outputs
    drawBox(260, 40, 30, "c2", false, context);
    drawBox(260, 95, 30, "c1", false, context);
    drawBox(260, 150, 30, "c0", false, context);
}