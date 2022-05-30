import Graph from './graph/graph.js';
import { mobileCheck, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, drawVertices, 
    GRAD_BY_X, GRAD_BY_Y, POINT_RADIUS, VIEW_CHANGES, clear, drawDirectionalEdgeAnim } from './graph/graphView.js';
import { mergeSort } from './algorithms/mergeSort.js';
import { findClosestPairIn } from './algorithms/closestPairOfPoints.js';
import { depthFirstAnim, breadthFirstAnim } from './animations/graphTraversingAnim.js';
import { draggingEdgeAnim } from './animations/addingEdgeAnim.js';

var graph;
var canvas;

var header;
var legend;
var headerHeight;
var legendHeight;

var disabled;
let edgeStartpt;

let CANVAS_OFFSET;
const GENERATE_POINTS = (mobileCheck()) ? 8 : 20;
var newPointName = GENERATE_POINTS;

let touchstamp;

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', (e) => {collapseNavbarToggle(); resize(e);}, false); // for mobile
window.addEventListener("contextmenu", e => e.preventDefault());

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
    canvas.addEventListener("touchstart", () => {touchstamp = Date.now()});
    canvas.addEventListener("touchend", addRemove);
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

    // map of the US
    if (!mobileCheck()) {
        let scale = Math.min(canvas.width / 900, canvas.height / 450);

        let vertices = [{name: "Seattle", x: 75, y: 50},
                {name: "San Francisco", x: 50, y: 210},
                {name: "Los Angeles", x:75, y:275},
                {name: "Denver", x:275, y:175},
                {name: "Kansas City", x:400, y:245},
                {name: "Chicago", x:450, y:100},
                {name: "Boston", x:700, y:80},
                {name: "New York", x:675, y:120},
                {name: "Atlanta", x:575, y:295},
                {name: "Miami", x:600, y:400},
                {name: "Dallas", x:408, y:325},
                {name: "Houston", x:450, y:360},
                {name: "Caribbean", x:700, y:350},
                {name: "Caribbean2", x:780, y:375},
                {name: "Island1", x:825, y:340},
                {name: "Island2", x:870, y:370},
            ];

            for (let i = 0; i < vertices.length; i++) {
                let x = Object.getOwnPropertyDescriptor(vertices[i], 'x').value * scale;
                let y = Object.getOwnPropertyDescriptor(vertices[i], 'y').value * scale;
                Object.defineProperties(vertices[i], {x: {value: x}, y: {value: y}});
            }

            let edges = [
                [0, 1], [0, 3], [0, 5], 
                [1, 2], [1, 3],
                [2, 3], [2, 4], [2, 10],
                [3, 4], [3, 5],
                [4, 5], [4, 7], [4, 8], [4, 10],
                [5, 6], [5, 7],
                [6, 7], 
                [7, 8],
                [8, 9], [8, 10], [8, 11],
                [9, 11],
                [10, 11],
                [12, 13]
            ];

            graph = new Graph(vertices, edges);
    } else {
        generateRandomPoints();
    }

    
    graph.print();
    drawGraph(graph, true, 2);
    enableButtons();
});

function resize(e) {

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;
    legendHeight = legend.getBoundingClientRect().height;

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

    graph = new Graph();
    newPointName = GENERATE_POINTS;

    for (let i = 0; i < GENERATE_POINTS; i++) {
        let vertex;
        do {
            vertex = {name: i, x: Math.floor(Math.random() * canvas.width), 
                y: Math.floor(Math.random() * canvas.height)};
        } while (graph.hasVertexInRadius(vertex, POINT_RADIUS * 2));
        graph.addVertex(vertex);
    }

    let prev = Math.floor(Math.random() * GENERATE_POINTS);
    for (let i = 0, rand = Math.floor(Math.random() * GENERATE_POINTS); i < rand; i++) {
        let curr;
        do {
            curr = Math.floor(Math.random() * GENERATE_POINTS);
        } while (prev == curr);
        graph.addEdge(prev, prev = curr);
    }

    drawGraph(graph, true, 2);
}

function addRemove(e) {
    if (disabled) return;

    let x = (e.type === 'mousedown') ? e.clientX - CANVAS_OFFSET : e.touches[0].clientX;
    let y = (e.type === 'mousedown') ? e.clientY - headerHeight - legendHeight - CANVAS_OFFSET : e.touches[0].clientY;
    let v = graph.hasVertexInRadius({x: x, y: y}, POINT_RADIUS);

    if (e.type == 'mousedown') {
        if (e.button == 2) { // right click, remove vertex
            if (v) renderRemoveVertex(v, graph); 
            
        } else if (e.button == 0) { // left click
            if (v) { // add edge
                edgeStartpt = v;
                drawVertex(edgeStartpt, 'blue');

            } else { // or add vertex
                let inOtherPoint = graph.hasVertexInRadius({x: x, y: y}, POINT_RADIUS * 2);
                if (!inOtherPoint) {
                    renderNewVertex( {name: newPointName++, x: x, y: y}, graph);
                } else {
                    document.getElementsByClassName('alert')[0].style.display = 'block';
                    setTimeout(() => {
                        document.getElementsByClassName('alert')[0].style.display = 'none';
                    }, 3000);
                }
            }
        }

    // on mobile
    } else {
        if (touchstamp - Date.now() < 1000) { // add point
            let inOtherPoint = graph.hasVertexInRadius({x: x, y: y}, POINT_RADIUS * 2);
            if (!inOtherPoint) {
                renderNewVertex( {name: newPointName++, x: x, y: y}, graph);
            } else {
                document.getElementsByClassName('alert')[0].style.display = 'block';
                setTimeout(() => {
                    document.getElementsByClassName('alert')[0].style.display = 'none';
                }, 3000);
            }
        } else { // held longer, remove
            if (v) renderRemoveVertex(v, graph); 
        }

    }
}

function moveEdge (e) {
    if (!edgeStartpt) {
        return;
    }

    let point = {x: e.clientX - CANVAS_OFFSET, 
                 y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET}

    draggingEdgeAnim(graph, edgeStartpt, point);
}

function dropEdge (e) {
    if (!edgeStartpt) return;

    let point = {x: e.clientX - CANVAS_OFFSET,
                 y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET};
    let v = graph.hasVertexInRadius(point, POINT_RADIUS);

    // dropped on same vertex, do nothing
    if (v === edgeStartpt) {
        drawGraph(graph, true, 1);
        edgeStartpt = null;
        return;
    }

    if (v) {
        drawGraph(graph, true, 1);
        drawDirectionalEdgeAnim(edgeStartpt, v, true, .95);
        graph.addEdge(edgeStartpt, v);
    } else {
        drawGraph(graph, true, 1);
        Object.defineProperty(point, 'name', {value: newPointName++});
        drawDirectionalEdgeAnim(edgeStartpt, point, true, .95);
        drawVertex(point, undefined, undefined, true);
        graph.addVertex(point);
        graph.addEdge(edgeStartpt, point);
        graph.print();
    }

    edgeStartpt = null;
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

    let firstEdge;
    FIRSTNEIGHBOR:
    for (let [vertex, neighbors] of graph.getNeighbors()) {
        for (let neighbor of neighbors) {
            firstEdge = vertex;
            break FIRSTNEIGHBOR;
        }
    }

    if (e.target.id == 'depth') {
        await depthFirstAnim(graph.dfs(firstEdge));
    } else if (e.target.id == 'breadth') {
        await breadthFirstAnim(graph.bfs(firstEdge));

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
    createLegendItem('doubleClick', "Begin Search From Point"); 
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
    var audio = new Audio('src/resources/a-whole-new-world-cropped.mp3');
    audio.play();
});