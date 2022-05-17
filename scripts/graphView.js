import { Graph } from './graph.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext("2d");

const POINT_RADIUS = 5;
const VIEW_CHANGES = 1000;
const GRAD_BY_X = 1;
const GRAD_BY_Y = 2;

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

function renderNewVertex(v, graph) {
    checkIfGraph(graph);
    graph.addVertex(v);
    drawGraph(graph);
}

function renderNewEdge(u, v, graph) {
    checkIfGraph(graph);
    graph.addEdge(u, v);
    drawGraph(graph);
}

function renderRemoveVertex(vIndex, graph) {
    checkIfGraph(graph);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let v1 = graph.getVertices()[vIndex];
    let neighbors = graph.getNeighbors().get(v1);

    graph.removeVertex(v1);
    
    //drawGraph(graph, [v1], graph.getNeighbors().get(v1).map((val) => [v1, val]));

    for (let v2 of neighbors) {
        // draws them in red
        drawEdge(v1, v2, 'red');
        drawVertex(v2);
    }

    drawVertex(v1, 'red');
    drawGraph(graph, false);

    setTimeout(() => {
        drawGraph(graph);
    }, VIEW_CHANGES);
}

function swapVertices(index1, index2, graph) {
    checkIfGraph(graph);
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
            
        var lingrad2 = ctx.createLinearGradient(0, v.y, v.x * .93, v.y);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, v.y);
        ctx.lineTo(v.x * .93, v.y);
        ctx.stroke();

    } else if (gradient === GRAD_BY_Y) {
        var lingrad2 = ctx.createLinearGradient(v.x, 0, v.x, v.y * .93);
        lingrad2.addColorStop(0, color);
        lingrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.strokeStyle = lingrad2;

        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(v.x, 0);
        ctx.lineTo(v.x, v.y * .93);
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
 */
function drawVertices (vertices, gradient, clear = true) {

    if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let vertex of vertices) {
        drawVertex(vertex, 'black', gradient);
    }    
}

function drawEdge (v1, v2, color = 'black', verticesColor = color) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    ctx.stroke();

    // redraws the vertices the edge is incident of
    if (verticesColor !== undefined) {
        drawVertex(v1, verticesColor);
        drawVertex(v2, verticesColor);
    }
}

/**
 * Draws a graph to the #graphView. Can additionally provide parameters to 
 * exclude certain vertices and edges.
 * 
 * @param {*} graph the graph to draw.
 * @param {*} excludingVs an array of vertices to exclude in the the drawing
 * @param {*} excludingEs an array of edges to exclude in the the drawing
 */
function drawGraph (graph, excludingVs = true, excludingEs) {
    checkIfGraph(graph);

    if (excludingVs) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // if (!excludingVs) excludingVs = [];
    // if (!excludingEs) excludingEs = [];
    
    // Draws edges and vertices
    graph.getNeighbors().forEach((neighbors, vertex) => {

        for (let neighbor of neighbors) {
            // skips neighbors in excludingEs
            // EDGES: {
            //     for (let exE of excludingEs) {
            //         if ((vertex === exE[0] && neighbor === exE[1]) || 
            //             vertex === exE[1] && neighbor === exE[0]) {
            //             break EDGES;
            //         }
            //     }

            // prevents duplicate drawings of an edge
            if (parseInt(vertex.name) < parseInt(neighbor.name)) {
                drawEdge(vertex, neighbor);
            }
            // }
        }

        // skips excludingVs
        // for (let exV of excludingVs) {
        //     if (exV === vertex) {
        //         return;
        //     }
        // }
        drawVertex(vertex);
    });
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y,
    renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawGraph };