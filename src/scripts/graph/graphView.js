import { Graph } from './graph.js';
import { mobileCheck, getReciprocal, isColor } from '../utility.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext("2d");

const MOBILE = mobileCheck();

const POINT_RADIUS = (MOBILE) ? 10 : 6;
const VIEW_CHANGES = 1000;
const GRAD_BY_X = 1;
const GRAD_BY_Y = 2;
const GRAD_TO_VERTEX = .93;
const EDGE_FONT = '14px Arial';
const VERTEX_FONT = '14px Arial';
const ARROW_SIZE = 10;
const TEXT_ABOVE_VERTEX = 26;
/** The size at which a pixel is displayed on the monitor. The #graphView canvas negates this by
 * multiplying its actual size by the DPR but fitting it into the according smaller size, and scales 
 * all drawing by the DPR.
 * @see {@link scaleToDPR} */
const DPR = window.devicePixelRatio;

/**
 * Checks if the parameter passed in is a {@link Graph} object.
 * 
 * @param {*} graph the object to check.
 * @returns true if a {@link Graph} and false if otherwise.
 */
function checkIfGraph (graph) {
    if (graph instanceof Graph) {
        return true;
    } else if (graph === undefined) {
        graph = new Graph();
        console.log("graph in GraphView was undefined");
        return false;
    } else {
        throw new TypeError("Cannot display anything other then a Graph object");
    }
}

/**
 * Clears the #graphView canvas, with regards to the zoom scale.
 */
function clear() {
    let pos = view.getPosition();
    // let start = canvasCoorToGraphCoor(new Point(0, 0));
    // let end = canvasCoorToGraphCoor(new Point(canvas.clientWidth, canvas.clientHeight));
    let start = new Point(getReciprocal((pos.x !== 0) ? pos.x : 1) / DPR, getReciprocal((pos.y !== 0) ? pos.y : 1) / DPR);
    let end = new Point(canvas.clientWidth + 4, canvas.clientHeight + 4);
    ctx.clearRect(start.x, start.y, end.x, end.y);
}

/**
 * Resizes the #graphView canvas to x and y parameters in an animation, beginning at a specified speed and slows
 * down until resized.
 * 
 * @param {*} targetX the 'x' co-ordinate to resize to.
 * @param {*} targetY the 'y' co-ordinate to resize to.
 * @returns true if successful and false if otherwise.
 */
function resizeAnim(targetX, targetY) {
    let canvasDoubleW = 0.0, canvasDoubleH = 0.0; // stores canvas dimensions in doubles to be more precise

    return new Promise(resolve => {
        let resize = () => {

            let changeX = (targetX - canvas.width) * .12;
            let changeY = (targetY - canvas.height) * .12;

            let DPRSpeed = .052, DPRSpeedX = targetX * DPRSpeed, DPRSpeedY = targetY * DPRSpeed;
            let lowestSpeed = .38;

            canvasDoubleW += (changeX > lowestSpeed) ? (changeX < DPRSpeedX) ? changeX : DPRSpeedX : lowestSpeed;
            canvasDoubleH += (changeY > lowestSpeed) ? (changeY < DPRSpeedY) ? changeY : DPRSpeedY : lowestSpeed;

            canvas.width = canvasDoubleW;
            canvas.height = canvasDoubleH;
            
            if (canvas.width < targetX || canvas.height < targetY) {
                requestAnimationFrame(resize);
            } else {
                resolve();
                scaleToDPR();
                return true;
            }
        }
        requestAnimationFrame(resize);
    });
}

/**
 * Resizes #graphView to the specified width and height instantly, additionally scaling it with the 
 * @see {@link scaleToDPR} method.
 * 
 * @param {*} width the width to resize to.
 * @param {*} height the height to resize to.
 */
function resizeInstantly (width, height) {
    scaleToDPR(width, height);
}

/**
 * Sizes a canvas by the specified width and height multiplied by the devicePixelRatio, and puts it in the 
 * designated display width and height through styling to draw per pixel on the device despite the 
 * monitor's set pixel ratio.
 * 
 * @param {*} width the width to 'place' the canvas in. If not specified, defaults to #graphView width.
 * @param {*} height the height to 'place' the canvas in. If not specified, defaults to #graphView height.
 * @param {*} canv the canvas to scale. If not specified, defaults to #graphView.
 */
function scaleToDPR (width, height, canv) {
    // check params
    if (canv === undefined) {
        canv = canvas;
    } else if (!(canv instanceof HTMLCanvasElement)) {
        throw new TypeError ("'canv' must be an HTMLCanvasElement.");
    }
    
    if (width === undefined) {
        width = canv.getBoundingClientRect().width;
    } else if (isNaN(width)) {
        throw new TypeError ("'width' must be a number.");
    }

    if (height === undefined) {
        height = canv.getBoundingClientRect().height;
    } else if (isNaN(height)) {
        throw new TypeError ("'height' must be a number.");
    }

    // Set the "actual" size of the canvas
    canv.width = width * DPR;
    canv.height = height * DPR;

    // Scale the context to ensure correct drawing operations
    canv.getContext('2d').scale(DPR, DPR);

    // Set the "drawn" size of the canvas
    canv.style.width = width + 'px';
    canv.style.height = height + 'px';
}

/**
 * Draws a vertex ({@link Point} object) on the canvas.
 * 
 * 
 * @param {*} v the point object, with properties 'x', 'y', and optional 'name', if using the 'withName' parameter.
 * @param {*} color the color to draw the vertex, defaulted to 'black'.
 * @param {*} gradient an optional gradient fade to the vertex on the specified 'GRAD_BY_X' or 'GRAD_BY_Y' constants 
 *      of this class, or a {@link GradObject} to specify the gradient begin point
 * @param {*} withName an option to display the name of the {@link Point} object.
 * @param {*} translate an option to translate the vertex in relation to the {@link view} zoom scale.
 */
function drawVertex(v, color = 'black', gradObject, withName, translate) {

    ctx.save();
    if (translate) translateByScale(v);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(v.x, v.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (withName) {
        drawVertexName(v);
    }

    if (gradObject === GRAD_BY_X || gradObject === GRAD_BY_Y) { // works with older code
        gradObject = new GradObject(gradObject);
    }

    if (!(gradObject instanceof GradObject)) {
        ctx.restore();
        return;
    }

    if (gradObject.grad === GRAD_BY_X) {
        var lingrad2 = ctx.createLinearGradient(gradObject.axisBegin ?? 0, v.y, v.x * gradObject.gradPercentage, v.y);
        lingrad2.addColorStop(0, gradObject.color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gradObject.axisBegin ?? 0, v.y);
        ctx.lineTo(v.x * gradObject.gradPercentage, v.y);
        ctx.stroke();

    } else if (gradObject.grad === GRAD_BY_Y) {

        // y grad goes to just above the vertex from the full canvas height
        const GRAD_TO_VERTEX_INVERTED = (gradObject.axisBegin < v.y) ? // checks if grad ends above or below vertex
            gradObject.gradPercentage : 2 - gradObject.gradPercentage; 

        var lingrad2 = ctx.createLinearGradient(v.x, gradObject.axisBegin ?? 0, v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        lingrad2.addColorStop(0, gradObject.color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(v.x, gradObject.axisBegin ?? 0);
        ctx.lineTo(v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        ctx.stroke();
    }

    ctx.restore();
}

/**
 * Draws the {@link Point} object's 'name' property above the vertex.
 * @param {*} v the {@link Point} object to display the name of.
 * @param {*} font the font to write the name in, in the CSS font format style (i.e. '14px Arial').
 * @param {*} color the color to draw the name in.
 * @param {*} withBackground the option to draw a background behind the name.
 */
function drawVertexName(v, font = VERTEX_FONT, color = 'blue', withBackground) {

    if (withBackground) {
        ctx.fillStyle = '#f6f2f2';
        ctx.fillRect(v.x - String(v.name).length * 3.6, v.y - TEXT_ABOVE_VERTEX, // x, y
                     String(v.name).length * 7.2, TEXT_ABOVE_VERTEX - 12);       // w, h
    }
    
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.fillText(v.name, v.x, v.y - 15);
    drawEdge({x: v.x, y: v.y}, {x: v.x, y: v.y - 12}, 'blue', null, 2);
}

/**
 * Adds a new vertex to the {@link Graph} object, with consideration to the {@link view} zoom scale and draws 
 * the graph again.
 * 
 * @param {*} v the vertex to add.
 * @param {*} graph the {@link Graph} object to add the vertex to.
 */
 function renderNewVertex(v, graph) {
    checkIfGraph(graph);
    graph.addVertex(v);
    drawGraph(graph, true);
}

/**
 * Animates the removing of a vertex from a {@link Graph} object by drawing it red for 1 second, and then removing
 * from the graph.
 * @param {*} v the vertex to remove.
 * @param {*} graph the {@link Graph} object to remove the vertex from.
 */
function renderRemoveVertex(v, graph) {
    checkIfGraph(graph);

    clear();

    v = graph.getNeighbors().has(v);
    let neighbors = graph.getNeighbors().get(v);

    graph.removeVertex(v);

    for (let v2 of neighbors) {
        // draws them in red
        drawEdge(v, v2, 'red', null);
        drawVertex(v2);
    }

    drawGraph(graph, false);
    drawVertex(v, 'red', undefined, true);

    setTimeout(() => {
        drawGraph(graph, true);
    }, VIEW_CHANGES);
}

/**
 * Draws an array of vertices with an optional gradient leading up to it on the X or Y axis.
 * 
 * @param {*} vertices an array of the vertices to draw.
 * @param {*} gradient an int value of GRAD_BY_X or GRAD_BY_Y will add a gradient on the
 *      specified axis until it nearly reaches the vertex.
 * @param {*} clearr a boolean indicating whether to clear #graphView before drawing, with a default of true.
 * @param {*} color the color to draw the vertices.
 */
function drawVertices (vertices, gradient, clearr = true, color) {

    if (clearr) clear();

    for (let vertex of vertices) {
        drawVertex(vertex, color, gradient, true);
    }
}

/**
 * A function to draw all the names of the vertices in a {@link Graph} object without drawing the vertices.
 * 
 * @param {*} vertices the vertices to draw the names of.
 * @param {*} font the font to draw the names, in the format of CSS font format (i.e. '14px Arial')
 * @param {*} color the color to draw the names.
 * @param {*} withBackground the option to draw the names with a background.
 * @param {*} translate the option to draw the names with relation to {@link view}'s zoom scale.
 */
function drawVerticesNames (vertices, font, color, withBackground, translate) {
    for (let v of vertices) {
        ctx.save();
        if (translate) translateByScale(v);
        drawVertexName(v, font, color, withBackground);
        ctx.restore();
    }
}

/**
 * Draws an edge from one vertex to another in an optional specified color. Can additionally specify
 * a vertex color to redraw the edge vertices.
 * 
 * @param {*} v1 the first vertex of the edge.
 * @param {*} v2 the second vertex of the edge.
 * @param {*} edgeColor the color to draw the edge, defaulted to black.
 * @param {*} verticesColor the color to draw the vertices of the incident edge. It is by default
 *      set to <b>color</b>, with a value of 'null' to not render them.
 */
function drawEdge (v1, v2, edgeColor = 'black', verticesColor = edgeColor, lineWidth = 2, weight, translate) {

    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = edgeColor;
    ctx.beginPath();
    ctx.save();
    if (translate) translateByScale(v1);
    ctx.moveTo(v1.x, v1.y);
    ctx.restore();
    ctx.save();
    if (translate) translateByScale(v2);
    ctx.lineTo(v2.x, v2.y);
    ctx.restore();
    ctx.stroke();
    ctx.restore();

    // redraws the vertices the edge is incident of
    if (verticesColor !== null) {
        drawVertex(v1, verticesColor, undefined, undefined, translate);
        drawVertex(v2, verticesColor, undefined, undefined, translate);
    }

    if (weight) drawEdgeWeight(v1, v2, weight, edgeColor);
}

function drawEdgeWeight (v1, v2, weight, color = 'black', c = ctx) {

    let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    let halfLength = Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y)) / 2;
    let center = {
        x: v2.x - halfLength * Math.cos(angle),
        y: v2.y - halfLength * Math.sin(angle)
    };

    // flips angle 180 for readablility if downside
    if (angle < -(Math.PI / 2) || (angle > (Math.PI / 2))) {
        angle += Math.PI;
    }
    
    c.save();
    translateByScale(center, c);
    c.translate(center.x, center.y);
    c.rotate(angle);
    c.translate(-center.x, -center.y);

    c.fillStyle = 'white';
    c.fillRect(center.x - String(String(weight)).length * 4, center.y - 5,
                String(weight).length * 8, 10);

    c.fillStyle = color;
    c.font = EDGE_FONT;
    c.textAlign = 'center';
    c.fillText(weight, center.x, center.y + 5);

    c.restore();
}

function drawDirectionalEdge (v1, v2, color = 'black', verticesColor = color, weight) {

    drawEdge(v1, v2, color, verticesColor, undefined, weight);

    let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    let triangleTip = {x: v2.x - POINT_RADIUS * Math.cos(angle), y: v2.y - POINT_RADIUS * Math.sin(angle)};

    ctx.beginPath();

    ctx.moveTo(triangleTip.x, triangleTip.y);
    ctx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle - Math.PI / 6), triangleTip.y - ARROW_SIZE * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(triangleTip.x, triangleTip.y);
    ctx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle + Math.PI / 6), triangleTip.y - ARROW_SIZE * Math.sin(angle + Math.PI / 6));
    ctx.closePath();

    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawEdgeWeight(v1, v2, weight);
}

/**
 * Slides arrow down the edge until just before the vertex's radius. However, this method doesn't render very 
 * well as it stores the background before the arrow in an another canvas but looses quality each time it 
 * redraws after the arrow moves. This results in very blurry backgrounds at the end 
 * of the edge, as the arrow slows down the closer it gets to its target.
 * 
 * @param {*} v1 the vertex to begin sliding from.
 * @param {*} v2 the vertex to slide to.
 * @param {*} edgecolor the color of the edge. 
 * @param {*} verticesColor the color of the incident vertices.
 * @param {*} arrowColor the color of the arrow.
 */
function drawDirectionalEdgeAnim (v1, v2, keepOnCanvas = true, decreasingPercentage = .9,
    edgeColor = 'black', verticesColor = edgeColor, arrowColor = 'blue', weight) {

    drawEdge(v1, v2, edgeColor, verticesColor, undefined, weight);

    return new Promise(resolve => {

        // point just before the vertex radius on the edge
        let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
        let lengthDownArrow = Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y));
        let totalLength = lengthDownArrow;
        let triangleTip;

        let arrowCanvas = document.createElement("canvas");
        scaleToDPR(parseInt(canvas.style.width), parseInt(canvas.style.height), arrowCanvas);
        arrowCanvas.style.position = 'absolute';
        arrowCanvas.style.border = '2px solid blue';
        
        document.getElementById('canvasContainer').appendChild(arrowCanvas);

        let actx = arrowCanvas.getContext('2d');

        const moveArrow = () => {

            lengthDownArrow *= decreasingPercentage;

            triangleTip = {
                x: v2.x - lengthDownArrow * Math.cos(angle),
                y: v2.y - lengthDownArrow * Math.sin(angle)
            };
            
            actx.clearRect(0, 0, canvas.width, canvas.height);
            actx.beginPath();
        
            // left arrowhead
            translateByScale(triangleTip, actx);
            actx.moveTo(triangleTip.x, triangleTip.y);
            let arrowLeft = {
                x: triangleTip.x - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
                y: triangleTip.y - ARROW_SIZE * Math.sin(angle - Math.PI / 6)
            };
            translateByScale(arrowLeft, actx);
            actx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
                       triangleTip.y - ARROW_SIZE * Math.sin(angle - Math.PI / 6));

            // right arrowhead
            translateByScale(triangleTip, actx);
            actx.moveTo(triangleTip.x, triangleTip.y);
            let arrowRight = {
                x: triangleTip.x - ARROW_SIZE * Math.cos(angle + Math.PI / 6),
                y: triangleTip.y - ARROW_SIZE * Math.sin(angle + Math.PI / 6)
            };
            translateByScale(arrowRight, actx);
            actx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle + Math.PI / 6),
                       triangleTip.y - ARROW_SIZE * Math.sin(angle + Math.PI / 6));
            
            actx.strokeStyle = arrowColor;
            actx.lineWidth = 2;
            actx.stroke();
            
            actx.lineWidth = 2;
            actx.beginPath();
            translateByScale(triangleTip, actx);
            actx.moveTo(triangleTip.x, triangleTip.y);
            let coloredLength = totalLength - lengthDownArrow;
            let coloredEnd = {
                x: triangleTip.x - coloredLength * Math.cos(angle),
                y: triangleTip.y - coloredLength * Math.sin(angle)
            };
            translateByScale(coloredEnd, actx);
            actx.lineTo(triangleTip.x - coloredLength * Math.cos(angle),
                       triangleTip.y - coloredLength * Math.sin(angle));

            actx.closePath();
            actx.stroke();

            drawEdgeWeight(v1, v2, weight, undefined, actx);
            
            if (lengthDownArrow > POINT_RADIUS) {
                drawVertexName(v1, undefined, undefined, true);
                drawVertexName(v2, undefined, undefined, true);
                requestAnimationFrame(moveArrow);
            } else {
                if (keepOnCanvas) {
                    let reciprocal = getReciprocal(DPR);
                    ctx.scale(reciprocal, reciprocal);
                    ctx.drawImage(arrowCanvas, 0, 0);
                    ctx.scale(DPR, DPR);
                }
                drawVertexName(v1, undefined, undefined, true);
                drawVertexName(v2, undefined, undefined, true);
                document.getElementById('canvasContainer').removeChild(arrowCanvas);
                resolve();
            }
        }

        requestAnimationFrame(moveArrow);
    });
}

function renderNewEdge(u, v, graph) {
    checkIfGraph(graph);
    graph.addEdge(u, v);
    drawGraph(graph, true);
}

/**
 * Draws a graph to the #graphView. Can additionally provide parameters to 
 * exclude certain vertices and edges.
 * 
 * @param {*} graph the graph to draw.
 * @param {*} clear a boolean value of whether to clear the graph beforehand, defaulted to true.
 * @param {*} edgeDrawing an integer value of 0 (drawing edges with no animation), 1 (edges drawn with 
 * direction), and 2 (a sliding arrow animation for showing the direction).
 */
async function drawGraph (graph, clearr = true, edgeDrawing) {
    checkIfGraph(graph);

    if (clearr) clear();
    
    // Draws edges and vertices
    graph.getNeighbors().forEach((neighbors, vertex) => {

        for (let neighbor of neighbors) {

            switch (edgeDrawing) {
                case 1:
                    drawDirectionalEdge(vertex, neighbor.v, undefined, undefined, neighbor.weight); break;
                case 2:
                    drawDirectionalEdgeAnim(vertex, neighbor.v, undefined, undefined, undefined, undefined, undefined, neighbor.weight); break;
                default:
                    drawEdge(vertex, neighbor.v, undefined, undefined, undefined, neighbor.weight, true);
            }
        }
        drawVertex(vertex, undefined, undefined, false, true);
    });

    drawVerticesNames(graph.getVertices(), undefined, undefined, true, true);
}

/**
 * Handles the #graphView context scaling to the {@link DPR}, as well as translating it porportionally to the point 
 * that is being zoomed in on. This works with {@link translateByScale}, which is called before any point is
 * drawn on the canvas to essentially scale the graph to {@link view}.getZoomScale() but keep the same size, to create
 * a zooming effect.
 */
const view = (() => {
    const matrix = [1, 0, 0, 1, 0, 0]; // current view transform
    var m = matrix; // alias for clear code
    var ctx; // reference to the 2D context
    let zoomScale = 1; // the scale that the canvas is zoomed
    const pos = { x: 0, y: 0 }; // current position of origin
    var dirty = true;
    var defTranslate = { x: 0, y: 0 };
    const API = {
        setContext(_ctx) { ctx = _ctx; dirty = true },
        apply() {
            if (dirty) { this.update() }
            ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
        },
        getZoomScale() { return zoomScale },
        getPosition() { return pos },
        getDefaultTranslate() {
            return defTranslate;
        },
        isDirty() { return dirty },
        update() {
            dirty = false;
            m[3] = m[0] = DPR; // canvas scale, which is always the devicePixelRatio (1.5 on my laptop)
            m[2] = m[1] = 0;
            m[4] = defTranslate.x + pos.x; // translate x (automatically moves any pixel drawn by this amount)
            m[5] = defTranslate.y + pos.y; // translate y
        },
        scaleAt(at, amount) { // at in screen coords
            if (dirty) { this.update() }
            zoomScale *= amount;
            //console.log("pos.x = " + at.x + " - (" + at.x + " - " + pos.x + ") * " + amount);
            pos.x = at.x - (at.x - pos.x) * amount;
            pos.y = at.y - (at.y - pos.y) * amount;
            //console.log("scale: " + zoomScale);
            //console.log("pos.x: " + pos.x);
            dirty = true;
        },
        setDefaultTranslate(x, y) { // not used
            defTranslate = { x: x, y: y };
        },
    };
    return API;
})();
view.setContext(ctx);

/**
 * Translates #graphView based on the scale in 'view.' This method essentially duplicates the scale function
 * of a canvas 2d context without magnifying what will be drawn at that point (i.e. an arc drawn on the canvas
 * at the point passed in will only multiply its position based on the scale, and not magnitude). This helps create
 * a zooming effect without magnifying objects together with the translation of mousescrolling in 'view'.
 * 
 * @param {*} v the point to translate by scale.
 */
function translateByScale(v, c = ctx) {
    c.translate(v.x * view.getZoomScale() - v.x, v.y * view.getZoomScale() - v.y);
}

function zoom (drawFunc) {
    if (view.isDirty()) { // has the view changed, then draw all
        resetCtxTransform(); // default transform for clear
        clear();
        view.apply(); // set the 2D context transform to the view
    }
    drawFunc();
}

function canvasCoorToGraphCoor (point) {
    let pos = view.getPosition();
    let scale = view.getZoomScale();
    let defTranslation = view.getDefaultTranslate();
    return new Point(
        (point.x / DPR) * (getReciprocal(scale) * DPR) - (pos.x * getReciprocal(scale) / DPR), // x
        (point.y / DPR) * (getReciprocal(scale) * DPR) - (pos.y * getReciprocal(scale) / DPR)  // y
    );
}

function graphCoorToCanvasCoor (point) {
    let pos = view.getPosition();
    let scale = view.getZoomScale();
    let defTranslation = view.getDefaultTranslate();
    return new Point(
        ((DPR * point.x) / ((getReciprocal(scale) * DPR) * DPR) + (pos.x * getReciprocal(scale) / DPR) * DPR / ((getReciprocal(scale) * DPR) * DPR)) * DPR, // x
        ((DPR * point.y) / ((getReciprocal(scale) * DPR) * DPR) + (pos.y * getReciprocal(scale) / DPR) * DPR / ((getReciprocal(scale) * DPR) * DPR)) * DPR  // y
    );
}

function resetCtxTransform () {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function showNotification (message, time) {
    document.getElementsByClassName('alert')[0].innerHTML = message;
    document.getElementsByClassName('alert')[0].style.display = 'block';
    setTimeout(() => {
        if (!isShowingNewNotification(message)) document.getElementsByClassName('alert')[0].style.display = 'none';
    }, time);
}

function isShowingNewNotification(message) {
    if (document.getElementsByClassName('alert')[0].innerText.replace(/\n/g, '') !== message.replace(/<[^>]*>/g, '')) return true;
    return false;
}

/**
 * This method creates a text input at a specified x and y (centers on x) and runs the passed in
 * methods when the clicked away (<b>blur</b> param) or hitting the 'enter' key (<b>blur</b> and <b>enter</b> 
 * params). The onblur event handler, by default, runs before an element is removed, so when removing the 
 * element after pressing the 'enter' key, the blur param will run again. Therefore, it may be important to provide 
 * conditions in the blur parameter that check if the enter parameter has run so as to not provide the same 
 * effect as when simply blurred away.
 * 
 * @param {*} point A point to place to text input, and centering on the 'x' co-ordinate.
 * @param {*} defaultValue The value put as the text input's placeholder.
 * @param {*} blur A function that runs when the input's onblur event handler runs.
 * @param {*} enter A function that runs with a parameter of the text input value when the 'enter' key is pressed.
 *      Can return true for successful entry, and false for otherwise.
 */
 async function showGraphInput (point, defaultValue, blur, enter) {
    return new Promise(resolve => {
        let popup = document.createElement("input");
        popup.placeholder = defaultValue;
        popup.type = 'text';
        popup.size = 8;
        popup.classList.add('poppin');

        document.body.appendChild(popup);
        const CANVAS_MARGIN = parseInt(window.getComputedStyle(document.getElementById('canvasContainer')).left);
        const CANVAS_BORDER = parseInt(window.getComputedStyle(canvas).border);
        let x = point.x - (popup.clientWidth / 2) + CANVAS_MARGIN + CANVAS_BORDER;
        let leftX = point.x + (popup.clientWidth / 2) + CANVAS_MARGIN + (CANVAS_BORDER * 2);
        let withinBordersX = ((x > 0) ? (leftX < document.body.clientWidth) ? x : document.body.clientWidth - popup.clientWidth : 0);
        popup.style.left = withinBordersX + 'px';
        popup.style.top = point.y + 'px';

        popup.onblur = () => {
            document.body.removeChild(popup);
            blur();
        };
        popup.onkeydown = (e) => {
            if (e.key === 'Enter') {
                let popVal = (popup.value) ? popup.value : popup.placeholder;
                if (enter(popVal) == undefined || enter(popVal) == true) {
                    popup.blur();
                    resolve();
                }
                e.stopPropagation();
            }
        };
        setTimeout(() => popup.focus(), 10);
    });
}

async function showInputForEdge (v1, v2, graph) {

    const headerHeight = document.getElementById('header').getBoundingClientRect().height;
    const legendHeight = document.getElementById('legend').getBoundingClientRect().height;

    let c1 = graphCoorToCanvasCoor(v1);
    let c2 = graphCoorToCanvasCoor(v2);

    let angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
    let distance = Math.sqrt((c2.x - c1.x) * (c2.x - c1.x) + (c2.y - c1.y) * (c2.y - c1.y));
    let halfLength = distance / 2;
    let x = c2.x - halfLength * Math.cos(angle);
    let y = c2.y - halfLength * Math.sin(angle) + headerHeight + legendHeight;
    let blur = () => {
        drawGraph(graph);
    };
    let enter = (inputValue) => {
        if (!isNaN(inputValue) && !(Number(inputValue) == 0)) {
            graph.setWeight(v1, v2, Number(inputValue));
        } else {
            showNotification("Input for connecting points must be a number ('0' for no 'weight'" +
                "on the connection)")
        }
    };
    await showGraphInput(new Point(x, y), Math.floor(distance * 4.5), blur, enter);
}

/**
 * An object that holds 'x', 'y', and 'name' properties.
 */
class Point {

    x = 0;
    y = 0;
    name = null;

    /**
     * Can take up to three arguments: two arguments to set the 'x' and 'y' properties, and three
     * to set the 'x,' 'y,' and 'name' properties.
     * 
     * @param {*} x Typically the 'x' co-ordinate on a plane.
     * @param {*} y Typically the 'y' co-ordinate on a plane.
     * @param {*} name A name for the point on the plane.
     */
    constructor (x, y, name) {
        if (arguments.length == 2) {
            this.x = x;
            this.y = y;
        } else if (arguments.length == 3) {
            this.x = x;
            this.y = y;
            this.name = name;
        }
    }
}

/**
 * An object with 'grad', 'axisBegin', 'gradPercentage', and 'gradColor' properties.
 * 
 * <ul>
 *  <li> 'grad' - GRAD_BY_X or GRAD_BY_Y constants of this script file. </li>
 *  <li> 'axisBegin' - an integer that determines the beginning 'x' for a 'grad' of value {@link GRAD_BY_X}, or 
 * 'y' for 'grad' of value {@link GRAD_BY_Y}. </li>
 *  <li> 'gradPercentage' - a percentage from 0 to 1 that determines how far the gradient will be drawn toward the
 * vertex, with 0 being the value of 'axisBegin' and 1 being position of the vertex (i.e. when gradPercentage = 1, 
 * the gradient travels completely from the origin point to the vertex; when gradPercentage = .5, the gradient 
 * travels halfway from the 'axisBegin' value to the vertex). </li>
 * </ul>
 */
class GradObject {

    /** An Integer value of {@link GRAD_BY_X} or {@link GRAD_BY_Y} that determines which axis the gradient will 
     * travel on toward the vertex. */
    grad;
    /** A Number value that determines where the gradient begins on the 'grad' axis (i.e. a value of '10' and 
     * a grad of 'GRAD_BY_X' will begin at an 'x' of '10' and gradient till it reaches the 'gradPercentage' value). */
    axisBegin = 0;
    /** A Number, typically between 0 (axisBegin value) and 1 (vertex), that determines how far to gradient till 
     * stopping (i.e. a value of .5 will stop half-way from the 'axisBegin' value to the vertex). */
    gradPercentage = GRAD_TO_VERTEX;
    /** The color to draw the gradient. */
    color = 'black';

    /**
     * Creates an object that holds values used to create a small line gradient towards a vertex on an 'x' or 'y' 
     * axis, utilized by {@link drawVertex}.
     * 
     * @param {*} grad An integer value of GRAD_BY_X or GRAD_BY_Y.
     * @param {*} axisBegin An integer that determines the beginning 'x' value with parameter 'grad' at value 
     * {@link GRAD_BY_X}, or the 'y' for a 'grad' at value {@link GRAD_BY_Y}. Defaults to 0.
     * @param {*} gradPercentage A Number, typically from 0 to 1, that determines how far the gradient will be 
     * drawn toward the vertex, with 0 being the value of 'axisBegin' and 1 being the position of the vertex 
     * (i.e. when gradPercentage = 1, the gradient travels completely from 'axisBegin' to the vertex; when 
     * gradPercentage = .5, the gradient travels half-way from 'axisBegin' to the vertex). Defaults to {@link 
     * GRAD_TO_VERTEX}.
     * @param color the color to draw the gradient.
     */
    constructor(grad, axisBegin, gradPercentage, color) {
        // Checks arguments
        switch (arguments.length) {
            case 4:
                if (isColor(color)) {
                    this.color = color;
                }
            case 3: 
                if (typeof gradPercentage == 'number') {
                    if (gradPercentage > 1 || gradPercentage < 0) {
                        this.gradPercentage = gradPercentage; 
                    } else {
                        throw new TypeError ('"gradPercentage" must be between 0 and 1.');
                    }
                }
            case 2: 
                if (typeof axisBegin == 'number') {
                    this.axisBegin = axisBegin;
                }
            case 1: 
                if (grad === GRAD_BY_X || grad === GRAD_BY_Y) {
                    this.grad = grad;
                } else {
                    throw new TypeError ('"grad" property must be the values of GRAD_BY_X or GRAD_BY_Y constants' +
                        'of this script.');
                }
        }
    }
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, MOBILE, TEXT_ABOVE_VERTEX, DPR,
    clear, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawDirectionalEdge, drawDirectionalEdgeAnim, drawGraph,
    showNotification, showGraphInput, showInputForEdge, zoom, resetCtxTransform, canvasCoorToGraphCoor,
    graphCoorToCanvasCoor,
    view, Point, GradObject
};