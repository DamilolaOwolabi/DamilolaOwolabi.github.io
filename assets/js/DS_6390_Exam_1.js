// assets/js/sketch.js

function setup() {
    // Create a canvas and attach it to a specific HTML element by its ID
    let canvas = createCanvas(windowWidth, windowHeight / 2);
    canvas.parent('p5-container');
    // Set the background color to a light gray
    background(240);
}

function draw() {
    // Set the fill color for shapes to a semi-transparent blue
    fill(100, 150, 200, 50);
    // Disable stroke (outline) for shapes
    noStroke();
    // Draw an ellipse at the mouse position with a width and height of 50
    ellipse(mouseX, mouseY, 50, 50);
}

function windowResized() {
    // Resize the canvas to fit the new window dimensions
    resizeCanvas(windowWidth, windowHeight / 2);
}
