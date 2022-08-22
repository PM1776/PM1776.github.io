import { Graph } from './graph.js';
import { Point } from './point.js';
import { mobileCheck, getReciprocal, isColor, getCenterPoint } from '../general/utility.js';
import { checkIfGraph, checkIfPoints, checkIfArrayOfPoints, checkIfXYProp, checkIfColors, checkIfFont, 
    checkIfNumbers, checkIfString, checkIfFuncs } from '../general/errorHandling.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext("2d");

const MOBILE = mobileCheck();

const POINT_RADIUS = (MOBILE) ? 10 : 6;
const VIEW_CHANGES = 1000;

const DRAW_EDGE = 0;
const DRAW_EDGE_ARROWS = 1;
const DRAW_EDGE_ARROWS_ANIM = 0;

const GRAD_BY_X = 1;
const GRAD_BY_Y = 2;
const GRAD_TO_VERTEX = .93;

const EDGE_FONT = '14px Arial';
const VERTEX_FONT = '14px Arial';
const AXIS_FONT = VERTEX_FONT;

const VERTEX_BACKGROUND_COLOR = 'rgb(246, 242, 242, .7)';
const VERTEX_FONT_COLOR = 'blue';
const TEXT_ABOVE_VERTEX = 26;

const ARROW_SIZE = 10;
/** The size at which a pixel is displayed on the monitor. The #graphView canvas negates this by
 * multiplying its actual size by the DPR but fitting it into the according smaller size, and scales 
 * all drawing by the DPR.
 * @see {@link scaleToDPR} */
const DPR = window.devicePixelRatio;

/**
 * Clears the #graphView canvas, with regards to the zoom scale.
 */
function clear() {
    let scale = view.getZoomScale();
    let pos = view.getPosition();
    let start = new Point(getReciprocal((pos.x !== 0) ? pos.x : 1) / DPR, getReciprocal((pos.y !== 0) ? pos.y : 1) / DPR);
    let end = new Point(canvas.clientWidth + 4, canvas.clientHeight + 4);
    ctx.clearRect(start.x, start.y, end.x, end.y);
}

/**
 * Resizes #graphView to the specified width and height instantly, additionally scaling it with the 
 * @see {@link scaleToDPR} method.
 * 
 * @param {Number} width the width to resize to.
 * @param {Number} height the height to resize to.
 */
function resizeInstantly (width, height) {
    scaleToDPR(width, height);
}

/**
 * Sizes a canvas by the specified width and height multiplied by the devicePixelRatio, and puts it in the 
 * designated display width and height through styling to draw per pixel on the device despite the 
 * monitor's set pixel ratio.
 * 
 * @param {Number} width the width to 'place' the canvas in. If not specified, defaults to #graphView width.
 * @param {Number} height the height to 'place' the canvas in. If not specified, defaults to #graphView height.
 * @param {HTMLCanvasElement} canv the canvas to scale. If not specified, defaults to #graphView.
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
 * @param {Point} v the point object, with properties 'x', 'y', and optional 'name', if using the 'withName' parameter.
 * @param {String} color the color to draw the vertex, defaulted to 'black'.
 * @param {*} gradient an optional gradient to the vertex on a specified axis, taking values 'GRAD_BY_X' (x-axis)
 * or 'GRAD_BY_Y' (y-axis) constants of this script for the according gradients, or a {@link GradObject} to 
 * further customize the gradient.
 * @param {boolean} withName an option to display the name of the {@link Point} object.
 * @param {boolean} translate an option to translate the vertex in relation to the {@link view} zoom scale.
 */
function drawVertex(v, color = 'black', gradObject, withName, translate) {

    checkIfXYProp({ v });
    checkIfColors({ color });
    // All other parameters are checked below

    ctx.save();
    if (translate) translateByScale(v);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(v.x, v.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (withName) {
        checkIfPoints({ v });
        drawVertexName(v);
    }

    if (gradObject === GRAD_BY_X || gradObject === GRAD_BY_Y) { // works with older code
        gradObject = new GradObject(gradObject);
    }

    if (!(gradObject instanceof GradObject)) {
        ctx.restore();
        return;

    } else {
        let xAxis = gradObject.axis === GRAD_BY_X;
        let x1, x2, y1, y2;
        // Inverts the gradPercentage if beginning after the vertex axis value to end on the appropriate side
        const PERCENTAGE = ((xAxis && gradObject.axisBegin > v.x) || (!xAxis && gradObject.axisBegin > v.y)) ?
            2 - gradObject.gradPercentage : gradObject.gradPercentage; 

        var lingrad2 = ctx.createLinearGradient(
            x1 = (xAxis) ? gradObject.axisBegin : v.x, // assigns the 'axisBegin' property to the co-ordinate 
            y1 = (!xAxis) ? gradObject.axisBegin : v.y, // of the according axis of gradObject
            x2 = (xAxis) ? v.x * PERCENTAGE : v.x, // determines the percentage to travel toward the vertex on
            y2 = (!xAxis) ? v.y * PERCENTAGE : v.y); // the according axis
        lingrad2.addColorStop(0, gradObject.color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (gradObject.withAxisVal) {
            let center = getCenterPoint(new Point(x1, y1), new Point(x2, y2));
            let text = String(Math.floor((xAxis) ? v.x : v.y));
            drawTextWithBackground(text, center, 'rgb(246, 242, 242)', 'black');
        }
    }

    ctx.restore();
}

/**
 * Draws the {@link Point} object's 'name' property above the vertex.
 * 
 * @param {Point} v the {@link Point} object to display the name of.
 * @param {string} font the font to write the name in, in the CSS font format style (i.e. '14px Arial').
 * @param {string} color the color to draw the name in.
 * @param {string} backgroundColor draws a background behind the vertex name that is a transparent lightgray if
 * true, or can contain a string of background color wanted.
 * @returns true if successful and false if otherwise.
 */
function drawVertexName(v, font = VERTEX_FONT, color = VERTEX_FONT_COLOR, backgroundColor, ctx = canvas.getContext('2d')) {

    checkIfPoints({ v });
    checkIfFont({ font });
    checkIfColors({ color });

    if (backgroundColor) {
        ctx.fillStyle = (typeof backgroundColor != 'boolean' && isColor(backgroundColor)) ? backgroundColor :
            VERTEX_BACKGROUND_COLOR;
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
 * @param {Point} v the vertex to add.
 * @param {Graph} graph the {@link Graph} object to add the vertex to.
 */
 function renderNewVertex(v, graph) {

    checkIfGraph(graph);
    checkIfPoints({ v });

    graph.addVertex(v);
    drawGraph(graph, true);
}

/**
 * Animates the removing of a vertex from a {@link Graph} object by drawing it red for 1 second, and then removing
 * from the graph.
 * @param {Point} v the vertex to remove.
 * @param {Graph} graph the {@link Graph} object to remove the vertex from.
 */
function renderRemoveVertex(v, graph) {

    checkIfGraph(graph);
    checkIfPoints({ v });

    clear();

    v = graph.getVertex(v);
    let neighbors = graph.getVertexNeighbors(v);

    graph.removeVertex(v);

    for (let edge of neighbors) {
        drawEdge(v, edge.v, 'red', null, undefined, undefined, true);
        drawVertex(edge.v, undefined, undefined, undefined, true);
    }

    drawGraph(graph, false);
    drawVertex(v, 'red', undefined, true, true);

    setTimeout(() => {
        drawGraph(graph, true);
    }, VIEW_CHANGES);
}

/**
 * Draws an array of vertices with an optional gradient leading up to it on the X or Y axis.
 * 
 * @param {*} vertices the array of the vertices to draw.
 * @param {Number} gradient an Integer value of {@link GRAD_BY_X} or {@link GRAD_BY_Y} will add a gradient on the
 *      specified axis until it nearly reaches the vertex.
 * @param {boolean} clearr a boolean indicating whether to clear #graphView before drawing, with a default of true.
 * @param {string} color the color to draw the vertices.
 */
function drawVertices (vertices, gradient, clearr = true, color) {

    checkIfArrayOfPoints(vertices);

    if (clearr) clear();

    for (let vertex of vertices) {
        drawVertex(vertex, color, gradient, true);
    }
}

/**
 * A function to draw all the names of the vertices in a {@link Graph} object without drawing the vertices.
 * 
 * @param {*} vertices an array of vertices to draw the names of.
 * @param {string} font the font to draw the names, in the format of CSS font format (i.e. '14px Arial')
 * @param {string} color the color to draw the names.
 * @param {boolean} withBackground the option to draw a background behind the names.
 * @param {boolean} translate the option to draw the names with relation to {@link view}'s zoom scale.
 */
function drawVerticesNames (vertices, font, color, withBackground, translate, ctx = canvas.getContext('2d')) {

    checkIfArrayOfPoints(vertices);

    for (let v of vertices) {
        ctx.save();
        if (translate) translateByScale(v);
        drawVertexName(v, font, color, withBackground, ctx);
        ctx.restore();
    }
}

/**
 * Draws an edge, or a line connecting two points, from one vertex to another in an optional color. 
 * Can additionally specify a vertex color to redraw the edge vertices.
 * 
 * @param {Point} v1 The first vertex of the edge.
 * @param {Point} v2 The second vertex of the edge.
 * @param {string} edgeColor The color to draw the edge, defaulted to black.
 * @param {string} verticesColor The color to draw the vertices of the incident edge. It is by default
 *      set to <b>color</b>, with a value of 'null' to not render them.
 * @param {number} lineWidth The width to draw the edge. Defaulted to 2.
 * @param {number} weight Optional text to draw in the center of the edge.
 * @param {boolean} translate Essentially, the option to draw the edge scaled. It translates the point as if it
 * were scaled to {@link view}'s zoom scale, which works with {@link view}'s position to animate zooming in and out. 
 */
function drawEdge (v1, v2, edgeColor = 'black', verticesColor = edgeColor, lineWidth = 2, weight, translate) {

    checkIfXYProp({ v1, v2 });
    checkIfColors({ edgeColor }); // verticesColor can be null
    checkIfNumbers({ lineWidth }); // weight can be null

    ctx.lineWidth = Math.floor(lineWidth);
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

/**
 * Draws a string in the center of two points with a white background behind it.
 * 
 * @param {*} v1 a first object with 'x' and 'y' properties.
 * @param {Po*int} v2 a second object with 'x' and 'y' properties.
 * @param {string} weight the text to draw between the two point objects, relating to their 'x' and 'y' properties.
 * @param {string} color the color to draw the text.
 * @param {*} ctx the context of the canvas element to draw the string on.
 */
function drawEdgeWeight (v1, v2, weight, color = 'black', ctx = canvas.getContext('2d')) {

    checkIfPoints({ v1, v2 });
    checkIfNumbers({ weight });
    checkIfColors({ color });

    let center = getCenterPoint(v1, v2);
    let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);

    // flips angle 180 for readablility if downside
    if (angle < -(Math.PI / 2) || (angle > (Math.PI / 2))) {
        angle += Math.PI;
    }
    
    ctx.save();
    translateByScale(center, ctx);
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.translate(-center.x, -center.y);

    drawTextWithBackground(String(weight), center, 'white', undefined, ctx);

    ctx.restore();
}

/**
 * Draws an edge, or a line connecting two {@link Point} objects, with an arrow pointing to the second point, 
 * the optional text in the center of the edge.
 * 
 * @param {Point} v1 a first {@link Point} object.
 * @param {Point} v2 a second {@link Point} object.
 * @param {string} color the color to draw the edge.
 * @param {string} verticesColor the color to draw the {@link Point} objects using the {@link drawVertex} method.
 * @param {string} weight optional text to draw in the center of the edge.
 */
function drawDirectionalEdge (v1, v2, color = 'black', verticesColor = color, weight) {

    checkIfPoints({ v1, v2 });
    checkIfColors({ color, backgroundColor });

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
 * @param {Point} v1 The vertex to begin sliding from.
 * @param {Point} v2 The vertex to slide to.
 * @param {boolean} keepOnCanvas The option to draw the animation on #graphView canvas when finished.
 * @param {number} decreasingPercentage A number greater than 0 and 1 that effects the speed of the animation, 
 * with 0 not moving the edge at all and 1 moving the edge instantaniously. Defaulted to 0.9.
 * @param {string} edgeColor The color of the edge. Defaulted to 'black'.
 * @param {string} verticesColor The color of the incident vertices. Defaulted to edgeColor
 * @param {string} arrowColor The color of the arrow. Defaulted to 'blue'.
 * @param {Number} weight Optional text to draw in the center of the edge.
 */
function drawDirectionalEdgeAnim (v1, v2, keepOnCanvas = true, decreasingPercentage = .9,
    edgeColor = 'black', verticesColor = edgeColor, arrowColor = 'blue', weight) {

    checkIfNumbers({ decreasingPercentage });
    if (decreasingPercentage <= 0 || decreasingPercentage > 1) throw new TypeError("'decreasingPercentage' must"
        + "be a number greater than 0 and 1.");
    checkIfColors({ arrowColor });
    // checks all other params in drawEdge()

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
            drawVertexName(v1, undefined, undefined, true, actx);
            drawVertexName(v2, undefined, undefined, true, actx);
            
            if (lengthDownArrow > POINT_RADIUS) {
                requestAnimationFrame(moveArrow);
            } else {
                if (keepOnCanvas) {
                    let reciprocal = getReciprocal(DPR);
                    ctx.scale(reciprocal, reciprocal);
                    ctx.drawImage(arrowCanvas, 0, 0);
                    ctx.scale(DPR, DPR);
                }
                document.getElementById('canvasContainer').removeChild(arrowCanvas);
                resolve();
            }
        }

        requestAnimationFrame(moveArrow);
    });
}

/**
 * A quick method to add and render an edge, or connection, to a {@link Graph} object.
 * 
 * @param {Point} u the first vertex of the connecting edge to add.
 * @param {Point} v the second vertex that connects to the edge.
 * @param {Graph} graph the {@link Graph} object to add the edge to.
 */
function renderNewEdge(u, v, graph) {
    checkIfGraph(graph);
    checkIfPoints({ u, v });
    graph.addEdge(u, v);
    drawGraph(graph, true);
}

/**
 * Draws a background for text with font '14px Arial' at a specific centering point.
 * 
 * @param {string} text the text to estimate the size of the background, assumed to be of font '14px Arial'.
 * @param {*} point the center point to draw the text.
 * @param {string} color the color to draw the background.
 * @param {string} color the color to draw the text.
 */
function drawTextWithBackground (text, point, bgColor, textColor = 'black', ctx = canvas.getContext('2d')) {

    checkIfString({ text });
    checkIfXYProp({ point });
    checkIfColors({ bgColor, textColor });

    // draws background
    ctx.fillStyle = bgColor;
    ctx.fillRect(point.x - text.length * 4, point.y - 5, text.length * 8, 10);

    // draws text
    ctx.fillStyle = textColor;
    ctx.font = EDGE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText(text, point.x, point.y + 5);
}

/**
 * Draws a graph to the #graphView. Can additionally provide parameters to 
 * exclude certain vertices and edges.
 * 
 * @param {Graph} graph the graph to draw.
 * @param {boolean} clear a boolean value of whether to clear the graph beforehand, defaulted to true.
 * @param {Number} edgeDrawing an integer value of 0 (drawing edges with no animation), 1 (edges drawn with 
 * direction), and 2 (a sliding arrow animation for showing the direction).
 */
async function drawGraph (graph, clearr = true, edgeDrawing) {
    checkIfGraph(graph);

    if (clearr) clear();
    
    // Draws edges and vertices
    graph.getVertices().forEach((vertex) => {

        for (let neighbor of graph.getVertexNeighbors(vertex)) {

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
        resetPosition() { Object.defineProperties(pos, { x: { value: 0 }, y: { value: 0} }) },
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

/**
 * Updates the zoom scale before invoking the function, typically a function that draws on #graphView canvas.
 * 
 * @param {function} drawFunc the function to call after updating the zoome scale.
 */
function zoom (drawFunc) {
    checkIfFuncs({ drawFunc });

    if (view.isDirty()) {
        resetCtxTransform();
        clear();
        view.apply();
    }
    drawFunc();
}

/**
 * Converts an object with 'x' and 'y' of a point within the #graphView canvas (such as an event point) into a 
 * {@link Point} object with 'x' and 'y' properties of where that would be in the graph with regard to the
 * {@link view}'s zoom scale.
 * 
 * @param {*} point an object with 'x' and 'y' properties.
 * @returns a {@link Point} object with co-ordinates of where that would be in the graph.
 */
function canvasCoorToGraphCoor (point) {
    checkIfXYProp({ point });

    let pos = view.getPosition();
    let scale = view.getZoomScale();
    let defTranslation = view.getDefaultTranslate();
    return new Point(
        (point.x / DPR) * (getReciprocal(scale) * DPR) - (pos.x * getReciprocal(scale) / DPR), // x
        (point.y / DPR) * (getReciprocal(scale) * DPR) - (pos.y * getReciprocal(scale) / DPR)  // y
    );
}

/**
 * Converts an object with 'x' and 'y' of a point in the graph into a {@link Point} object with 'x' and 'y' 
 * properties of where that would be on the #graphView canvas with regard to {@link view}'s zoom scale.
 * 
 * @param {*} point an object with 'x' and 'y' properties.
 * @returns a {@link Point} object with co-ordinates of where that would be in the graph.
 */
function graphCoorToCanvasCoor (point) {
    checkIfXYProp({ point });

    let pos = view.getPosition();
    let scale = view.getZoomScale();
    let defTranslation = view.getDefaultTranslate();
    return new Point(
        ((DPR * point.x) / ((getReciprocal(scale) * DPR) * DPR) + (pos.x * getReciprocal(scale) / DPR) * DPR / ((getReciprocal(scale) * DPR) * DPR)) * DPR, // x
        ((DPR * point.y) / ((getReciprocal(scale) * DPR) * DPR) + (pos.y * getReciprocal(scale) / DPR) * DPR / ((getReciprocal(scale) * DPR) * DPR)) * DPR  // y
    );
}

/**
 * Resets #graphView canvas's context to it's defaulted transform.
 */
function resetCtxTransform () {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

/**
 * Displays a message in a transparent bar at the bottom of #graphView.
 * 
 * @param {string} message the message to display.
 * @param {number} time the time to display the message.
 */
function showNotification (message, time = 5000) {
    checkIfString({ message });
    checkIfNumbers({ time });

    document.getElementsByClassName('alert')[0].innerHTML = message;
    document.getElementsByClassName('alert')[0].style.display = 'block';
    setTimeout(() => {
        if (!isShowingNewNotification(message)) document.getElementsByClassName('alert')[0].style.display = 'none';
    }, time);
}

/**
 * Checks if the notification bar is displaying a new message, excluding any HTML.
 * 
 * @param {*} message the message to check if displaying, excluding HTML.
 * @returns true if showing a new message, and false if otherwise.
 */
function isShowingNewNotification(message) {
    checkIfString({ message });

    if (document.getElementsByClassName('alert')[0].innerText.replace(/\n/g, '') !== message.replace(/<[^>]*>/g, '')) return true;
    return false;
}

/**
 * This method creates a text input at a specified x and y (centers on x) and runs the passed in
 * methods when clicked away (<b>blur</b>) or hitting the 'enter' key (<b>blur</b> and <b>enter</b>. 
 * The onblur event handler, by default, runs before an element is removed, so when removing the 
 * element after pressing the 'enter' key, the blur param will run again. Therefore, it may be important to provide 
 * conditions in the blur parameter that check if the enter parameter has run so as to not provide the same 
 * effect as when simply blurred away.
 * 
 * @param {*} point A point to place to text input, and centering on the 'x' co-ordinate.
 * @param {string} defaultValue The value put as the text input's placeholder.
 * @param {function} blur A function that runs when the input's onblur event handler runs.
 * @param {function} enter A function that runs with a parameter of the text input value when the 'enter' key is 
 * pressed. Can return true for successful entry, and false for otherwise.
 */
 async function showGraphInput (point, defaultValue, blur, enter) {

    checkIfPoints({ point });
    checkIfString({ defaultValue });
    checkIfFuncs({ blur, enter });

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
        setTimeout(() => popup.focus(), 50);
    });
}

async function showInputForVertex(point, graph) {

    const headerHeight = document.getElementById('header').getBoundingClientRect().height;
    const legendHeight = document.getElementById('legend').getBoundingClientRect().height;

    const canvasPoint = graphCoorToCanvasCoor(point);

    let pointCount = graph.getSize();

    let enter = (inputValue) => {
        let duplicate = false;
        for (let key of graph.getVertices()) {
            if (String(key.name).toLowerCase() === String(inputValue).toLowerCase()) {
                duplicate = true;
                break;
            }
        }
        if (!duplicate) {
            graph.setVertexName(point, inputValue);
            pointCount++;
        } else {
            showNotification("Point name must be unique.");
            return false;
        }
    }, blur = () => { // will run both when the user clicks away and hits 'enter'
        if (point.name == null) graph.removeVertex(point);
        drawGraph(graph);
    }, inputPoint = new Point(canvasPoint.x, headerHeight + legendHeight + canvasPoint.y - TEXT_ABOVE_VERTEX);

    await showGraphInput(inputPoint, String(pointCount), blur, enter);
}

/**
 * Displays a text input at the center of two vertices with a connecting edge in a {@link Graph} object, and 
 * sets the weight of the edge upon the 'enter' key, or cancels the input upon focusing on another element.
 * 
 * @param {*} v1 the first vertex connecting to the edge in a {@link Graph} object.
 * @param {*} v2 the second vertex of the edge in the {@link Graph} object.
 * @param {*} graph the {@link Graph} object to set the edge weight within.
 */
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
    let enter = (inputValue) => {
        if (!isNaN(inputValue) && !(Number(inputValue) == 0)) {
            graph.setWeight(v1, v2, Number(inputValue));
        } else {
            showNotification("Input for connecting points must be a number ('0' for no 'weight'" +
                "on the connection)");
                return false;
        }
    }, blur = () => {
        drawGraph(graph);
    };
    await showGraphInput(new Point(x, y), String(Math.floor(distance * 4.5)), blur, enter);
}

/**
 * An object with values to customize the axis, axis beginning point, axis stopping point, and color, as well
 * as the option to draw the axis value at the center of the gradient.
 */
class GradObject {

    /** An Integer value of {@link GRAD_BY_X} or {@link GRAD_BY_Y} that determines which axis the gradient will 
     * travel on towards the vertex. */
    axis = GRAD_BY_X;
    /** An Integer value that determines where the gradient will begin on the axis (i.e. a value of '10' with 
     * an axis of 'GRAD_BY_X' will begin at an x of '10' and gradient till it reaches the 'gradPercentage' value). */
    axisBegin = 0;
    /** A Number between 0 (axisBegin value) and 1 (vertex), that determines how far to gradient till 
     * stopping (i.e. a value of .5 will stop half-way from the 'axisBegin' value to the vertex). */
    gradPercentage = GRAD_TO_VERTEX;
    /** The color to draw the gradient. */
    color = 'black';
    /** If true, draws the vertice's 'axis' value (i.e.) */
    withAxisVal = false;

    /**
     * Creates an object that holds values for creating a linear gradient towards a vertex using the 
     * {@link drawVertex} method.
     * 
     * @param {Number} axis A value of {@link GRAD_BY_X} or {@link GRAD_BY_Y} that determines the axis of the 
     * linear gradient. Defaults to {@link GRAD_BY_X}.
     * @param {Number} axisBegin An Integer value that determines where the gradient will begin on the axis (i.e. 
     * a value of '10' with an axis of {@link GRAD_BY_X} will begin at an x of '10' and gradient till it reaches 
     * the 'gradPercentage' value). Defaults to 0 on the 'x' axis, and canvas height on the 'y' axis.
     * @param {Number} gradPercentage A Number between from 0 to 1, that determines how far the gradient will be 
     * drawn toward the vertex, with 0 being the value of 'axisBegin' and 1 being the position of the vertex 
     * (i.e. when gradPercentage = 1, the gradient travels completely from 'axisBegin' to the vertex; when 
     * gradPercentage = .5, the gradient travels half-way from 'axisBegin' to the vertex). Defaults to {@link 
     * GRAD_TO_VERTEX}.
     * @param {string} color the color to draw the gradient. Defaults to 'black'.
     * @param {boolean} withAxisVal If true, draws the vertice's axis value at the middle of the gradient. Defaults
     * to false.
     */
    constructor(axis, axisBegin, gradPercentage, color, withAxisVal) {
        switch (arguments.length) {
            case 5:
                if (typeof withAxisVal == 'boolean') {
                    this.withAxisVal = withAxisVal;
                }
            case 4:
                if (isColor(color)) {
                    this.color = color;
                }
            case 3: 
                if (typeof gradPercentage == 'number') {
                    if (gradPercentage <= 1 || gradPercentage > 0) {
                        this.gradPercentage = gradPercentage; 
                    } else {
                        throw new RangeError ('"gradPercentage" must be between 0 and 1.');
                    }
                }
            case 2: 
                if (typeof axisBegin == 'number') {
                    this.axisBegin = Math.floor(axisBegin);
                }
            case 1: 
                if (axis === GRAD_BY_X || axis === GRAD_BY_Y) {
                    this.axis = axis;
                } else {
                    throw new RangeError ('"axis" property must be a value of "GRAD_BY_X" or "GRAD_BY_Y" constants' +
                        ' of this script.');
                }
        }

        // defaults the axisBegin value to the canvas height if on 'y' axis.
        if (!axisBegin && axis == GRAD_BY_Y) this.axisBegin = canvas.clientHeight;
    }
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, MOBILE, TEXT_ABOVE_VERTEX, DPR,
    DRAW_EDGE, DRAW_EDGE_ARROWS, DRAW_EDGE_ARROWS_ANIM,
    clear, scaleToDPR, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawDirectionalEdge, drawDirectionalEdgeAnim, drawGraph,
    showNotification, showInputForVertex, showInputForEdge, zoom, resetCtxTransform, canvasCoorToGraphCoor,
    graphCoorToCanvasCoor,
    view, Point, GradObject
};