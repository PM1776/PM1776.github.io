import Graph from './scripts/graph.js';
import { resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, drawVertices, 
    GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, VIEW_CHANGES, clear, drawDirectionalEdgeAnim } from './scripts/graphView.js';
import { mergeSort } from './scripts/algorithms/mergeSort.js';
import { findClosestPairIn } from './scripts/algorithms/closestPairOfPoints.js';
import { depthFirstAnim, breadthFirstAnim } from './scripts/animations/graphTraversingAnim.js';
import { draggingEdgeAnim } from './scripts/animations/addingEdgeAnim.js';

var graph;

var canvas;

var header;
var legend;
var headerHeight;
var legendHeight;

var disabled;
let addingEdge;

let CANVAS_OFFSET;
const GENERATED_POINTS = (window.mobileCheck) ? 5 : 20;

var newPointName = GENERATED_POINTS;

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

window.addEventListener("load", async (e) => {
    
    canvas = document.getElementById('graphView');
    canvas.style.border = '2px solid black'; // couldn't access from initializing in css

    header = document.getElementById('header');
    legend = document.getElementById('legend');

    // headerHeight initialized in resize() below
    legendHeight = legend.getBoundingClientRect().height;
    CANVAS_OFFSET = parseInt(window.getComputedStyle(document.getElementById('canvasContainer')).marginTop) +
        parseInt(window.getComputedStyle(canvas).border);

    canvas.addEventListener("mousedown", addRemove);
    canvas.addEventListener("mousemove", moveEdge);
    canvas.addEventListener("mouseup", dropEdge);
    canvas.addEventListener("dblclick", traverseGraph);
    document.getElementById('genRand').addEventListener("click", generateRandomPoints);
    document.getElementById('closest').addEventListener("click", findClosestPair);
    document.getElementById('byX').addEventListener("click", beginMergeSort);
    document.getElementById('byY').addEventListener("click", beginMergeSort);
    document.getElementById('depth').addEventListener("click", traverseGraph);
    document.getElementById('breadth').addEventListener("click", traverseGraph);

    // values of navBar elements already set to disabled
    resize(e);
    generateRandomPoints();
    enableButtons();
});

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', resize, false); // for mobile
window.addEventListener("contextmenu", e => e.preventDefault());

function resize(e) {

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;

    var targetX = document.body.clientWidth - CANVAS_OFFSET * 2;
    var targetY = document.body.clientHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

    if (e.type === 'load') {
        resizeInstantly(targetX, targetY);
    } else {
        resizeInstantly(targetX, targetY);
        drawGraph(graph, true, 1);
    }
}

function generateRandomPoints() {
    var vertices = new Array(GENERATED_POINTS);

    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = {name: i, x: Math.floor(Math.random() * canvas.width), 
                   y: Math.floor(Math.random() * canvas.height)};
    }
    let edges = [[6, 3], [1, 8], [2, 19], [11, 7], [3, 1], [6, 11], [8, 19], [7, 2]];
    graph = new Graph(vertices, edges);

    drawGraph(graph, true, 2);
}

function addRemove(e) {
    if (disabled) return;

    let x = e.clientX - CANVAS_OFFSET;
    let y = e.clientY - headerHeight - legendHeight - CANVAS_OFFSET;
    let v = graph.hasVertexInRadius({x: x, y: y}, POINT_RADIUS);

    if (e.button == 2) { // right click, remove vertex
        if (v) renderRemoveVertex(v, graph); 
        
    } else if (e.button == 0) { // left click
        if (v) { // add edge
            addingEdge = v;
            drawVertex(addingEdge, 'blue');

        } else { // or add vertex
            renderNewVertex( {name: newPointName++, x: x, y: y}, graph);
        }
    }
}

function moveEdge (e) {
    if (!addingEdge) {
        return;
    }

    let point = {x: e.clientX - CANVAS_OFFSET, 
                 y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET}

    draggingEdgeAnim(graph, addingEdge, point);
}

function dropEdge (e) {
    if (!addingEdge) return;

    let point = {name: newPointName++,
                 x: e.clientX - CANVAS_OFFSET,
                 y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET};
    let v = graph.hasVertexInRadius(point, POINT_RADIUS);

    // dropped on same vertex, do nothing
    if (v === addingEdge) {
        drawGraph(graph, true, 1);
        addingEdge = null;
        return;
    }

    if (v) {
        drawGraph(graph, true, 1);
        drawDirectionalEdgeAnim(addingEdge, v, true, .95);
        graph.addEdge(addingEdge, v);
    } else {
        drawGraph(graph, true, 1);
        drawDirectionalEdgeAnim(addingEdge, point, true, .95);
        drawVertex(point);
        graph.addVertex(point);
        graph.addEdge(addingEdge, point);
        graph.print();
    }

    addingEdge = null;
}

async function beginMergeSort(e) {

    document.getElementById('legend').innerHTML = '';
    createLegendItem('green', "Merging Range");

    let axis = (e.target.id === 'byX') ? "x" : "y";
    
    disableButtons();
    await mergeSort(graph, axis);
    enableButtons();
    defaultLegend();
}

async function findClosestPair () {

    document.getElementById('legend').innerHTML = '';
    createLegendItem('blue', "Closest Pair");
    createLegendItem('darkGreen', "Comparing Pair");
    createLegendItem('yellow', "Searching Sector");
    createLegendItem('blue-yellow', "Merging Sectors");

    disableButtons();
    await findClosestPairIn(graph.getVertices());
    enableButtons();
    defaultLegend();
}

async function traverseGraph (e) {

    document.getElementById('legend').innerHTML = '';
    createLegendItem('blue', "Traversed Edges");

    disableButtons();
    drawGraph(graph);

    if (e.target.id == 'depth') {
        await depthFirstAnim(graph.dfs(6));
    } else if (e.target.id == 'breadth') {
        await breadthFirstAnim(graph.bfs(6));

    } else if (e.type === 'dblclick') {
        let point = {x: e.clientX - CANVAS_OFFSET,
                     y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET};
        let v = graph.hasVertexInRadius(point, POINT_RADIUS);
        if (v) await breadthFirstAnim(graph.bfs(v));
    }
    enableButtons();
    defaultLegend();
}

function createLegendItem(classOfIcon, text) {

    let legendItem = document.createElement('div');

    let icon = document.createElement('div');
    icon.classList.add("legendItem");
    icon.classList.add(classOfIcon);

    legendItem.appendChild(icon);
    legendItem.innerHTML += text;

    document.getElementById('legend').appendChild(legendItem);
}

function defaultLegend () {
    document.getElementById('legend').innerHTML = '';
    createLegendItem('click', "Add Point");
    createLegendItem('drag', "Add Edge");
    createLegendItem('doubleClick', "BFS From A Point"); 
    createLegendItem('rightClick', "Remove Point");
}

function disableButtons () {
    disabled = true;

    for (let s of ['genRand', 'closest', 'depth', 'breadth']) {
        document.getElementById(s).setAttribute("disabled", "");
        document.getElementById(s).setAttribute("aria-disabled", ""); // for assistive technologies
    }

    document.getElementById('sort').classList.add("disabled"); // disabled look
    canvas.style.cursor = "default";
}

function enableButtons () {
    disabled = false;

    for (let s of ['genRand', 'closest', 'depth', 'breadth']) {
        document.getElementById(s).removeAttribute("disabled");
        document.getElementById(s).removeAttribute("aria-disabled"); // for assistive technologies
    }

    document.getElementById('sort').classList.remove("disabled"); // disabled look
    canvas.style.cursor = "pointer";
}

// Bootstrap has a nice smooth collapse; this is instant and not smooth
function collapseNavbarToggle () {
    document.getElementById('navbarNavAltMarkup').classList.remove("show");
    document.getElementsByClassName('navbar-toggler')[0].classList.add("collapsed");
}

document.getElementsByClassName('navbar-brand')[0].addEventListener("click", () => {
    var audio = new Audio('src/a-whole-new-world-cropped.mp3');
    audio.play();
});