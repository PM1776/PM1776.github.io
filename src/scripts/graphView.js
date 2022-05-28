import { Graph } from './graph.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext("2d");

const POINT_RADIUS = (window.mobileCheck) ? 15 : 5;
const VIEW_CHANGES = 1000;
const GRAD_BY_X = 1;
const GRAD_BY_Y = 2;
const GRAD_TO_VERTEX = .93;

const ARROW_SIZE = 10;

/**
 * Functions to draw the graph on a canvas with an id of 'graphView.'
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

function checkIfOnBorder (point) {
    //if (point.x >)
}

function clear() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function resizeAnim(targetX, targetY) {
    let canvasDoubleW = 0.0, canvasDoubleH = 0.0; // stores canvas dimensions in doubles to be more precise

    return new Promise(resolve => {
        let resize = () => {

            canvasDoubleW += (targetX - canvas.width) * .15;
            canvasDoubleH += (targetY - canvas.height) * .15;
            console.log("target: " + targetX + ", " + targetY);

            canvas.width = canvasDoubleW;
            canvas.height = canvasDoubleH;
            
            if (canvas.width < targetX || canvas.height < targetY) {
                requestAnimationFrame(resize);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(resize);
    });
}

function resizeInstantly (targetX, targetY) {
    canvas.width = targetX;
    canvas.height = targetY;
}

function renderNewVertex(v, graph) {
    checkIfGraph(graph);
    graph.addVertex(v);
    drawGraph(graph, true, 1);
}

function renderNewEdge(u, v, graph) {
    checkIfGraph(graph);
    graph.addEdge(u, v);
    drawGraph(graph, true, 1);
}

function renderRemoveVertex(v, graph) {
    checkIfGraph(graph);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    v = graph.hasVertex(v);
    let neighbors = graph.getNeighbors().get(v);

    graph.removeVertex(v);

    for (let v2 of neighbors) {
        // draws them in red
        drawEdge(v, v2, 'red');
        drawVertex(v2);
    }

    drawVertex(v, 'red');
    drawGraph(graph, false, 1);

    setTimeout(() => {
        drawGraph(graph, true, 1);
    }, VIEW_CHANGES);
}

//updateVertexWithoutEdges()

function drawVertex(v, color = 'black', gradient) {

    ctx.lineWidth = POINT_RADIUS * 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(v.x, v.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();

    if (gradient === GRAD_BY_X) {

        var lingrad2 = ctx.createLinearGradient(0, v.y, v.x * GRAD_TO_VERTEX, v.y);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, v.y);
        ctx.lineTo(v.x * GRAD_TO_VERTEX, v.y);
        ctx.stroke();

    } else if (gradient === GRAD_BY_Y) {

        // y grad goes to just above the vertex from the full canvas height
        const GRAD_TO_VERTEX_INVERTED = 2 - GRAD_TO_VERTEX; 

        var lingrad2 = ctx.createLinearGradient(v.x, canvas.height, v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(v.x, canvas.height);
        ctx.lineTo(v.x, v.y * GRAD_TO_VERTEX_INVERTED);
        ctx.stroke();
    }
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
function drawVertices (vertices, gradient, clear = true, color = 'black') {

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let vertex of vertices) {
        drawVertex(vertex, color, gradient);
    }    
}

/**
 * 
 * @param {*} v1 
 * @param {*} v2 
 * @param {*} edgeColor 
 * @param {*} verticesColor the color to draw the vertices of the incident edge. It is by default
 *      set to <b>color</b>, with a value of 'null' to not render them.
 */
function drawEdge (v1, v2, edgeColor = 'black', verticesColor = edgeColor, lineWidth = 2) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = edgeColor;
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.stroke();

    // redraws the vertices the edge is incident of
    if (verticesColor !== null) {
        drawVertex(v1, verticesColor);
        drawVertex(v2, verticesColor);
    }
}

function drawDirectionalEdge (v1, v2, color = 'black', verticesColor = color) {
    drawEdge(v1, v2, color, verticesColor);

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
 * @returns 
 */
function drawDirectionalEdgeAnim (v1, v2, keepOnCanvas = true, decreasingPercentage = .9,
    edgeColor = 'black', verticesColor = edgeColor, arrowColor = 'blue') {

    drawEdge(v1, v2, edgeColor, verticesColor);

    return new Promise(resolve => {

        // point just before the vertex radius on the edge
        let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
        let lengthDownArrow = Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y));
        let triangleTip;

        let arrowCanvas = document.createElement("canvas");
        arrowCanvas.width = canvas.width;
        arrowCanvas.height = canvas.height;
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
            var lingrad2 = ctx.createLinearGradient(triangleTip.x, triangleTip.y,
                triangleTip.x - 20 * Math.cos(angle), triangleTip.y - 20 * Math.sin(angle));
            lingrad2.addColorStop(0, arrowColor);
            lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');    

            actx.strokeStyle = lingrad2;
            actx.lineWidth = 2;
            actx.beginPath();
            actx.moveTo(triangleTip.x, triangleTip.y);
            actx.lineTo(triangleTip.x - 20 * Math.cos(angle),
                       triangleTip.y - 20 * Math.sin(angle));

            actx.closePath();
            actx.stroke();
            
            if (lengthDownArrow > POINT_RADIUS) {
                requestAnimationFrame(moveArrow);
            } else {
                if (keepOnCanvas) ctx.drawImage(arrowCanvas, 0, 0);
                document.getElementById('canvasContainer').removeChild(arrowCanvas);
                resolve();
            }
        }

        requestAnimationFrame(moveArrow);
    });

    
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

            // prevents duplicate drawings of an edge
            //if (parseInt(vertex.name) < parseInt(neighbor.name)) {
                switch (edgeDrawing) {
                    case 1:
                        drawDirectionalEdge(vertex, neighbor); break;
                    case 2:
                        drawDirectionalEdgeAnim(vertex, neighbor); break;
                    default:
                        drawEdge(vertex, neighbor);
                }
            //}
        }
        drawVertex(vertex);
    });
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS,
    clear, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawDirectionalEdge, drawDirectionalEdgeAnim, drawGraph };