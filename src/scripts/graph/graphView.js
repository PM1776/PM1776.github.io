import { Graph } from './graph.js';

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
/** The size at which a pixel is displayed on the monitor. The #graphView canvas negates this by
 * multiplying its actual size by the DPR but fitting it into the according smaller size, and scales 
 * all drawing by the DPR.
 * @see {@link scaleToDPR} */
const DPR = window.devicePixelRatio;

const ARROW_SIZE = 10;
const TEXT_ABOVE_VERTEX = 26;

// Functions to draw the graph on the canvas.

function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hipDPR|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

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

function clear() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

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
 * Draws a vertex (point) on the canvas.
 * 
 * 
 * @param {*} v the point object, with properties 'x', 'y', and optional 'name', if using the 'withName' parameter.
 * @param {*} color the color to draw the vertex, defaulted to 'black'.
 * @param {*} gradient an optional gradient fade to the vertex on the specified 'GRAD_BY_X' or 'GRAD_BY_Y' constants 
 *      of this class, or a {@link GradObject} to specify the gradient begin point
 * @param {*} withName 
 * @param {*} translate 
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
        var lingrad2 = ctx.createLinearGradient(gradObject.axisBegin, v.y, v.x * gradObject.gradPercentage, v.y);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gradObject.axisBegin, v.y);
        ctx.lineTo(v.x * gradObject.gradPercentage, v.y);
        ctx.stroke();

    } else if (gradObject.grad === GRAD_BY_Y) {

        // y grad goes to just above the vertex from the full canvas height
        const GRAD_TO_VERTEX_INVERTED = (gradObject.axisBegin < v.y) ? // checks if grad ends above or below vertex
            gradObject.gradPercentage : 2 - gradObject.gradPercentage; 

        var lingrad2 = ctx.createLinearGradient(v.x, gradObject.axisBegin, v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(v.x, gradObject.axisBegin);
        ctx.lineTo(v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        ctx.stroke();
    }

    ctx.restore();
}

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
 * Adds a new vertex and draws the graph again.
 * 
 * @param {*} v the vertex to add.
 * @param {*} graph the graph to add it to.
 */
 function renderNewVertex(v, graph) {
    checkIfGraph(graph);
    let pos = view.getPosition();
    let scale = view.getScale();
    let defTranslation = view.getDefaultTranslate();
    Object.defineProperties(v, {
        x: {value: (v.x / DPR) * (getReciprocal(scale) * DPR) - (pos.x * getReciprocal(scale) / DPR) }, 
        y: {value: (v.y / DPR) * (getReciprocal(scale) * DPR) - (pos.y * getReciprocal(scale) / DPR) }
    });
    graph.addVertex(v);
    drawGraph(graph, true);
}

function renderRemoveVertex(v, graph) {
    checkIfGraph(graph);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    v = graph.hasVertex(v);
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
 * @param {*} clear a boolean indicating whether to clear #graphView before drawing, with a default of true.
 * @param {*} color the color to draw the 
 */
function drawVertices (vertices, gradient, clear = true, color) {

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let vertex of vertices) {
        drawVertex(vertex, color, gradient, true);
    }
}

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

function drawEdgeWeight (v1, v2, weight, color = 'black') {

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
    
    ctx.save();
    translateByScale(center);
    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.translate(-center.x, -center.y);

    ctx.fillStyle = 'white';
    ctx.fillRect(center.x - String(String(weight)).length * 4, center.y - 5,
                String(weight).length * 8, 10);

    ctx.fillStyle = color;
    ctx.font = EDGE_FONT;
    ctx.textAlign = 'center';
    ctx.fillText(weight, center.x, center.y + 5);

    ctx.restore();
    
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
        arrowCanvas.style.top = parseInt(window.getComputedStyle(canvas).border) + "px";
        arrowCanvas.style.left = parseInt(window.getComputedStyle(canvas).border) + "px";
        arrowCanvas.style.position = 'absolute';
        
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
            actx.moveTo(triangleTip.x, triangleTip.y);
            let arrowLeft = {
                x: triangleTip.x - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
                y: triangleTip.y - ARROW_SIZE * Math.sin(angle - Math.PI / 6)
            };
            
            actx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
                       triangleTip.y - ARROW_SIZE * Math.sin(angle - Math.PI / 6));

            // right arrowhead
            actx.moveTo(triangleTip.x, triangleTip.y);
            actx.lineTo(triangleTip.x - ARROW_SIZE * Math.cos(angle + Math.PI / 6),
                       triangleTip.y - ARROW_SIZE * Math.sin(angle + Math.PI / 6));
            
            actx.strokeStyle = arrowColor;
            actx.lineWidth = 2;
            actx.stroke();
            
            // Gradiant from the arrow to the end of the edge
            let coloredLength = totalLength - lengthDownArrow;
            var lingrad2 = ctx.createLinearGradient(triangleTip.x, triangleTip.y,
                triangleTip.x - coloredLength * Math.cos(angle), triangleTip.y - coloredLength * Math.sin(angle));
            lingrad2.addColorStop(0, arrowColor);
            lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

            //actx.strokeStyle = lingrad2;
            actx.lineWidth = 2;
            actx.beginPath();
            actx.moveTo(triangleTip.x, triangleTip.y);
            actx.lineTo(triangleTip.x - coloredLength * Math.cos(angle),
                       triangleTip.y - coloredLength * Math.sin(angle));

            actx.closePath();
            actx.stroke();

            drawEdgeWeight(v1, v2, weight);
            
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
async function drawGraph (graph, clear = true, edgeDrawing) {
    checkIfGraph(graph);

    if (clear) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
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

const view = (() => {
    const matrix = [1, 0, 0, 1, 0, 0]; // current view transform
    var m = matrix; // alias for clear code
    var scale = 1; // current scale
    var ctx; // reference to the 2D context
    const pos = { x: 0, y: 0 }; // current position of origin
    var dirty = true;
    var defTranslate = { x: 0, y: 0 };
    const API = {
        setContext(_ctx) { ctx = _ctx; dirty = true },
        apply() {
            if (dirty) { this.update() }
            ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
        },
        getScale() { return scale },
        getPosition() { return pos },
        getDefaultTranslate() {
            return defTranslate;
        },
        isDirty() { return dirty },
        update() {
            dirty = false;
            m[3] = m[0] = DPR; // scale, which is always the devicePixelRatio (1.5 on my laptop)
            m[2] = m[1] = 0;
            m[4] = defTranslate.x + pos.x; // translate x (automatically moves any pixel drawn by this amount)
            m[5] = defTranslate.y + pos.y; // translate y
        },
        scaleAt(at, amount) { // at in screen coords
            if (dirty) { this.update() }
            scale *= amount;
            //console.log("pos.x = " + at.x + " - (" + at.x + " - " + pos.x + ") * " + amount);
            pos.x = at.x - (at.x - pos.x) * amount;
            pos.y = at.y - (at.y - pos.y) * amount;
            //console.log("scale: " + scale);
            //console.log("pos.x: " + pos.x);
            dirty = true;
        },
        setDefaultTranslate(x, y) { // not used for now
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
function translateByScale(v) {
    ctx.translate(v.x * view.getScale() - v.x, v.y * view.getScale() - v.y);
}

function zoom (drawFunc) {
    if (view.isDirty()) { // has the view changed, then draw all
        resetCtxTransform(); // default transform for clear
        clear();
        view.apply(); // set the 2D context transform to the view
        drawFunc();
    }
}

function resetCtxTransform () {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function showNotification (message, time) {
    document.getElementsByClassName('alert')[0].innerHTML = message;
    document.getElementsByClassName('alert')[0].style.display = 'block';
    setTimeout(() => {
        document.getElementsByClassName('alert')[0].style.display = 'none';
    }, time);
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
 * @param {*} defaultValue The default value of the text input.
 * @param {*} blur A function that runs when the input's onblur event handler runs.
 * @param {*} enter A function that runs with a parameter of the text input value when the 'enter' key is pressed.
 *      Can return true for successful entry, and false for otherwise.
 */
 async function showGraphInput (point, defaultValue, blur, enter) {
    return new Promise(resolve => {
        let popup = document.createElement("input");
        popup.value = defaultValue;
        popup.type = 'text';
        popup.size = 8;
        popup.classList.add('poppin');

        document.body.appendChild(popup);
        const CANVAS_MARGIN = parseInt(window.getComputedStyle(document.getElementById('canvasContainer')).left);
        const CANVAS_BORDER = parseInt(window.getComputedStyle(canvas).border);
        let x = point.x - (popup.clientWidth / 2) + CANVAS_MARGIN + CANVAS_BORDER;
        let leftX = point.x + (popup.clientWidth / 2) + CANVAS_MARGIN + (CANVAS_BORDER * 2);
        let withinBordersX = ((x > 0) ? (leftX < document.body.clientWidth) ? x : document.body.clientWidth - popup.clientWidth : 0);
        console.log(document.body.clientWidth - popup.clientWidth);
        popup.style.left = withinBordersX + 'px';
        popup.style.top = point.y + 'px';

        popup.onblur = () => {
            document.body.removeChild(popup);
            blur();
        };
        popup.onkeydown = (e) => {
            if (e.key === 'Enter') {
                if (enter(popup.value) == undefined || enter(popup.value) == true) {
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

    let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
    let halfLength = Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y)) / 2;
    let x = v2.x - halfLength * Math.cos(angle);
    let y = v2.y - halfLength * Math.sin(angle) + headerHeight + legendHeight;
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
    await showGraphInput(new Point(x, y), 0, blur, enter);
}

/**
 * A utility function that gets the reciprocal of a number.
 * 
 * @param {*} number the number to get the reciprocal of.
 * @returns the reciprocal number.
 */
function getReciprocal(number) {
    // Get the fraction of the numbe (multiplies by 10 until number is a whole number for decimals)
    let bottom;
    for (bottom = 1; !Number.isInteger(number); bottom *= 10, number *= 10);

    return bottom / number;
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
 * An object with 'grad', 'axisBegin', and 'gradPercentage' properties.
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

    grad;
    axisBegin;
    gradPercentage;

    /**
     * 
     * @param {*} grad an integer value of GRAD_BY_X or GRAD_BY_Y.
     * @param {*} axisBegin An integer that determines the beginning 'x' value with parameter 'grad' at value 
     * {@link GRAD_BY_X}, or the 'y' for a 'grad' at value {@link GRAD_BY_Y}.
     * @param {*} gradPercentage a percentage from 0 to 1 that determines how far the gradient will be drawn toward the
     * vertex, with 0 being the value of 'axisBegin' and 1 being position of the vertex (i.e. when gradPercentage = 1, 
     * the gradient travels completely from 'axisBegin' to the vertex; when gradPercentage = .5, the gradient 
     * travels half-way from 'axisBegin' to the vertex).
     */
    constructor(grad, axisBegin, gradPercentage) {
        switch (arguments.length) {
            case 3: 
                if (typeof gradPercentage == 'number') {
                    if (gradPercentage > 1 || gradPercentage < 0) {
                        this.gradPercentage = gradPercentage; 
                    } else {
                        throw new TypeError ('"gradPercentage" must be between 0 and 1.');
                    }
                } else {
                    throw new TypeError ('"gradPercentage" must be a number.');
                }
            case 2: 
                if (typeof axisBegin == 'number') {
                    this.axisBegin = axisBegin;
                } else {
                    throw new TypeError ('"gradOriginPoint" must be a number.');
                }
            case 1: 
                if (grad === GRAD_BY_X || grad === GRAD_BY_Y) {
                    this.grad = grad;
                } else {
                    throw new TypeError ('"grad" property must be the values of GRAD_BY_X or GRAD_BY_Y constants' +
                        'of this script.');
                }
                
        }
        if (arguments.length == 2) {
            this.gradPercentage = GRAD_TO_VERTEX;
        } else if (arguments.length == 1) {
            this.axisBegin = (grad === GRAD_BY_X) ? 0 : canvas.height;
            this.gradPercentage = GRAD_TO_VERTEX;
        }
    }
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, MOBILE, TEXT_ABOVE_VERTEX, Point,
    clear, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawDirectionalEdge, drawDirectionalEdgeAnim, drawGraph,
    showNotification, showGraphInput, showInputForEdge, view, zoom, DPR, resetCtxTransform, getReciprocal,
    GradObject
};