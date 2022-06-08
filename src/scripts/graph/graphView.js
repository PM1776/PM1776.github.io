import { Graph } from './graph.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext("2d");

const MOBILE = mobileCheck();

const POINT_RADIUS = (MOBILE) ? 10 : 5;
const VIEW_CHANGES = 1000;
const GRAD_BY_X = 1;
const GRAD_BY_Y = 2;
const GRAD_TO_VERTEX = .93;

const ARROW_SIZE = 10;
const TEXT_ABOVE_VERTEX = 26;

// Functions to draw the graph on the canvas.

function mobileCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
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

            canvasDoubleW += (targetX - canvas.width) * .19;
            canvasDoubleH += (targetY - canvas.height) * .19;

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

function resizeInstantly (targetX, targetY) {
    canvas.width = targetX;
    canvas.height = targetY;

    scaleToDPR(targetX, targetY);
}

function scaleToDPR (x, y) {
    // Get the DPR and size of the canvas
    var dpr = window.devicePixelRatio;
    if (arguments.length == 0) {
        x = canvas.getBoundingClientRect().width;
        y = canvas.getBoundingClientRect().height;
    }

    // Set the "actual" size of the canvas
    canvas.width = x * dpr;
    canvas.height = y * dpr;

    // Scale the context to ensure correct drawing operations
    ctx.scale(dpr, dpr);

    // Set the "drawn" size of the canvas
    canvas.style.width = x + 'px';
    canvas.style.height = y + 'px';
}

/**
 * Adds a new vertex and draws the graph again.
 * 
 * @param {*} v the vertex to add.
 * @param {*} graph the graph to add it to.
 */
function renderNewVertex(v, graph) {
    checkIfGraph(graph);
    graph.addVertex(v);
    drawGraph(graph, true);
}

function renderNewEdge(u, v, graph) {
    checkIfGraph(graph);
    graph.addEdge(u, v);
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

//updateVertexWithoutEdges()

function drawVertex(v, color = 'black', gradient, withName) {

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(v.x, v.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    if (withName) {
        drawVertexName(v);
    }

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

function drawVertexName(v, font = '14px Arial', color = 'blue', withBackground) {
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

function drawVerticesNames (vertices, font, color, withBackground) {
    for (let v of vertices) {
        drawVertexName(v, font, color, withBackground);
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
function drawEdge (v1, v2, edgeColor = 'black', verticesColor = edgeColor, lineWidth = 2, weight) {

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

    ctx.translate(center.x, center.y);
    ctx.rotate(angle);
    ctx.translate(-center.x, -center.y);

    ctx.fillStyle = 'white';
    ctx.fillRect(center.x - String(String(weight)).length * 4, center.y - 5,
                String(weight).length * 8, 10);

    ctx.fillStyle = color;
    ctx.font = '14px Arial';
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
 * @returns 
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
                if (keepOnCanvas) ctx.drawImage(arrowCanvas, 0, 0);
                drawVertexName(v1, undefined, undefined, true);
                drawVertexName(v2, undefined, undefined, true);
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

            switch (edgeDrawing) {
                case 1:
                    drawDirectionalEdge(vertex, neighbor.v, undefined, undefined, neighbor.weight); break;
                case 2:
                    drawDirectionalEdgeAnim(vertex, neighbor.v, undefined, undefined, undefined, undefined, undefined, neighbor.weight); break;
                default:
                    drawEdge(vertex, neighbor.v, undefined, undefined, undefined, neighbor.weight);
            }
        }
        drawVertex(vertex, undefined, undefined);
    });

    drawVerticesNames(graph.getVertices(), undefined, undefined, true);
}

function showNotification (message, time) {
    document.getElementsByClassName('alert')[0].innerHTML = message;
    document.getElementsByClassName('alert')[0].style.display = 'block';
    setTimeout(() => {
        document.getElementsByClassName('alert')[0].style.display = 'none';
    }, time);
}

export { VIEW_CHANGES, GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, MOBILE, TEXT_ABOVE_VERTEX, showNotification,
    clear, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawDirectionalEdge, drawDirectionalEdgeAnim, drawGraph };