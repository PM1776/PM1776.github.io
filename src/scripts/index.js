import Graph from './graph/graph.js';
import { MOBILE, resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, drawVertices, 
    POINT_RADIUS, VIEW_CHANGES, clear, drawDirectionalEdgeAnim, showNotification, TEXT_ABOVE_VERTEX } from './graph/graphView.js';
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
const GENERATE_POINTS = (MOBILE) ? 8 : 20;
var newPointName;

let touchstamp;

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', (e) => {collapseNavbarToggle(false); resize(e);}, false); // for mobile
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
    canvas.addEventListener("touchmove", moveEdge);
    canvas.addEventListener("touchend", addRemove);
    canvas.addEventListener("mousemove", moveEdge);
    canvas.addEventListener("mouseup", dropEdge);
    
    document.getElementById('closest').addEventListener("click", findClosestPair);
    document.getElementById('byX').addEventListener("click", beginMergeSort);
    document.getElementById('byY').addEventListener("click", beginMergeSort);
    document.getElementById('search').addEventListener("click", traverseGraph);

    for (let s of ['byDepth', 'byBreadth', 'byMinimumSpanningTree', 'byShortestPaths']) {
        document.getElementById(s).addEventListener("click", changeSearchType);
    }

    defaultLegend();
    await resize(e);

    let mapWidth, mapHeight;
    var dpr = window.devicePixelRatio;
    let scale = Math.min(canvas.width / ((mapWidth = 780) * dpr), canvas.height / ((mapHeight = 430) * dpr));

    let vertices = [{name: "Seattle", x: 125, y: 60},
        {name: "San Francisco", x: 100, y: 220},
        {name: "Los Angeles", x:125, y:285},
        {name: "Denver", x:325, y:185},
        {name: "Kansas City", x:450, y:255},
        {name: "Chicago", x:500, y:110},
        {name: "Boston", x:725, y:90},
        {name: "New York", x:725, y:130},
        {name: "Atlanta", x:625, y:305},
        {name: "Miami", x:650, y:410},
        {name: "Dallas", x:458, y:335},
        {name: "Houston", x:500, y:370},
    ];

    newPointName = vertices.length;

    let edges = [
        [0, 1, 807], [0, 3, 1331], [0, 5, 2097], 
        [1, 2, 381], [1, 3, 1267],
        [2, 3, 1015], [2, 4, 1663], [2, 10, 1435],
        [3, 4, 599], [3, 5, 1003],
        [4, 5, 533], [4, 7, 1260], [4, 8, 864], [4, 10, 496],
        [5, 6, 983], [5, 7, 787],
        [6, 7, 214], 
        [7, 8, 888],
        [8, 9, 661], [8, 10, 781], [8, 11, 810],
        [9, 11, 1187],
        [10, 11, 239],
    ];

    // Scales and centers
    for (let i = 0; i < vertices.length; i++) {
        let x = Object.getOwnPropertyDescriptor(vertices[i], 'x').value * scale;
        let y = Object.getOwnPropertyDescriptor(vertices[i], 'y').value * scale;
        x = Math.floor(((canvas.width / 2) / dpr - (mapWidth * scale / 2) + x));
        y = Math.floor(((canvas.height / 2) / dpr - (mapHeight * scale / 2) + y));
        Object.defineProperties(vertices[i], {x: {value: x}, y: {value: y}});
    }

    graph = new Graph(vertices, edges);
    graph.print();
    drawGraph(graph, true);
    enableButtons();
});

async function resize(e) {

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;
    legendHeight = legend.getBoundingClientRect().height;

    var targetX = document.body.clientWidth - CANVAS_OFFSET * 2;
    var targetY = document.body.clientHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

    if (e.type === 'load') {
        await resizeAnim(targetX, targetY);
    } else if (e.type === 'orientationchange' ||
              (e.type === 'resize' && !MOBILE)) {
        resizeInstantly(targetX, targetY);
        drawGraph(graph, true);
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

    drawGraph(graph, true);
}

function addRemove(e) {
    if (disabled) return;

    headerHeight = header.getBoundingClientRect().height; // updates

    console.log(e.type + ", ");
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
                    let newPoint = {name: null, x: x, y: y};
                    renderNewVertex(newPoint, graph);

                    // will run when both the user clicks away and hits 'enter'
                    let blur = () => {
                        if (newPoint.name == null) graph.removeVertex(newPoint);
                        drawGraph(graph);
                    }
                    
                    let enter = (inputValue) => {
                        graph.setVertexName(newPoint, inputValue);
                    }
                    showGraphInput(x, headerHeight + legendHeight + y - TEXT_ABOVE_VERTEX, newPointName++, blur, enter);
                } else {
                    showNotification("<strong>A point must not overlap another.</strong> Space is nice.",
                        3000);
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

async function dropEdge (e) {
    if (!edgeStartpt) return;

    let point = {name: '-',
                 x: e.clientX - CANVAS_OFFSET,
                 y: e.clientY - headerHeight - legendHeight - CANVAS_OFFSET};
    let secondPoint = graph.hasVertexInRadius(point, POINT_RADIUS);

    let vertexStarted = edgeStartpt;
    edgeStartpt = null;

    // dropped on same vertex, do nothing
    if (secondPoint === vertexStarted) {
        drawGraph(graph, true);
        return;
    }

    if (secondPoint) {
        graph.addEdge(vertexStarted, secondPoint);
        getInputForEdge(vertexStarted, secondPoint);
    } else {

        Object.defineProperty(point, 'name', {value: newPointName++});
        renderNewVertex(point, graph);
        graph.addEdge(vertexStarted, point);

        // blur will run when both the user clicks away and hits 'enter'
        let blur = () => {
            if (point.name == null) graph.setVertexName(point, newPointName++);
            drawGraph(graph);
        }, enter = (inputValue) => { 
            graph.setVertexName(point, inputValue);
        };
        await showGraphInput(point.x, headerHeight + legendHeight + point.y - TEXT_ABOVE_VERTEX, 
            newPointName++, blur, enter);
        await getInputForEdge(vertexStarted, point);
        drawGraph(graph);
        graph.print();
    }

    async function getInputForEdge (v1, v2) {
        let angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);
        let halfLength = Math.sqrt((v2.x - v1.x) * (v2.x - v1.x) + (v2.y - v1.y) * (v2.y - v1.y)) / 2;
        let x = v2.x - halfLength * Math.cos(angle);
        let y = v2.y - halfLength * Math.sin(angle) + headerHeight + legendHeight;
        let blur = () => {
            drawGraph(graph);
        };
        let enter = (inputValue) => {
            graph.setWeight(v1, v2, inputValue);
        };
        await showGraphInput(x, y, '0', blur, enter);
    }
}

async function beginMergeSort(e) {

    collapseNavbarToggle(true);

    legendHeight = parseInt(window.getComputedStyle(legend).height);
    document.getElementById('legend').innerHTML = '';
    createLegendItem('green', "Sorting");
    legendHeight = Math.max(parseInt(window.getComputedStyle(legend).height), legendHeight);
    legend.style.height = legendHeight + "px";

    let axis = (e.target.id === 'byX') ? "x" : "y";
    
    disableButtons();
    await mergeSort(graph, axis);
    enableButtons();
    defaultLegend();
}

async function findClosestPair () {

    collapseNavbarToggle(true);

    legendHeight = parseInt(window.getComputedStyle(legend).height);
    document.getElementById('legend').innerHTML = '';
    createLegendItem('blue', "Closest Pair");
    createLegendItem('darkGreen', "Comparing Pair");
    createLegendItem('yellow', "Searching Sector");
    createLegendItem('blue-yellow', "Merging Sectors");
    legendHeight = Math.max(parseInt(window.getComputedStyle(legend).height), legendHeight);
    legend.style.height = legendHeight + "px";

    disableButtons();
    await findClosestPairIn(graph);
    enableButtons();
    defaultLegend();
}

async function traverseGraph () {

    collapseNavbarToggle(true);

    let starting = document.getElementById("start").value;
    let searchingFor = document.getElementById("searchingFor").value;
    let search = document.getElementById('searchType').innerHTML;

    if (!((starting = graph.hasVertex(starting)) && (searchingFor = graph.hasVertex(searchingFor)))) {
        showNotification("Could not find the starting or searching point in the graph.", 5000);
    }
    if (starting === searchingFor) {
        showNotification(starting.name + "</br>I know, slow down there.", 3000);
        return;
    }

    legendHeight = parseInt(window.getComputedStyle(legend).height);
    legend.innerHTML = '';
    createLegendItem('blue', "Searched");
    legendHeight = Math.max(parseInt(window.getComputedStyle(legend).height), legendHeight);
    legend.style.height = legendHeight + "px";

    disableButtons();
    drawGraph(graph);
    if (search == 'Depth-First Search') {
        await depthFirstAnim(graph.dfs(starting), searchingFor, graph);
    } else {
        await breadthFirstAnim(graph.bfs(starting), searchingFor, graph);
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

    legend.appendChild(legendItem);
}

function defaultLegend () {
    document.getElementById('legend').innerHTML = '';
    createLegendItem((!MOBILE) ? 'click' : 'touch', "Add Point");
    createLegendItem((!MOBILE) ? 'drag' : 'dragTouch', "Connect");
    createLegendItem('rightClick', "Remove Point");
}

function disableButtons () {
    disabled = true;

    for (let s of ['closest', 'findPoint']) {
        document.getElementById(s).setAttribute("disabled", "");
        document.getElementById(s).setAttribute("aria-disabled", ""); // for assistive technologies
    }

    document.getElementById('sort').classList.add("disabled"); // disabled look
    canvas.style.cursor = "default";
}

function enableButtons () {
    disabled = false;

    for (let s of ['closest', 'findPoint']) {
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

function changeSearchType (e) {
    document.getElementById('searchType').innerHTML = e.target.innerHTML;
}

/**
 * This method creates a text input at a specified x and y (centers on x) and runs the passed in
 * methods when the clicks away (blur) and hits the 'enter' key (blur and enter). The onblur event handler, 
 * by default, runs before an element is removed, so when removing the element after pressing the 'enter' it, it
 * will run again. Therefore, it may be important to provide conditions in the blur parameter that check
 * if the enter parameter has run so as to not provide the same effect as when simply blurred away.
 * 
 * @param {*} x The 'x' co-ordinate the text input centers on.
 * @param {*} y The 'y' co-ordinate the text input is set to.
 * @param {*} defaultValue The default value of the text input.
 * @param {*} blur A function that runs when the input's onblur event handler runs.
 * @param {*} enter A function that runs with a parameter of the text input value when the 'enter' key is pressed.
 */
async function showGraphInput (x, y, defaultValue, blur, enter) {
    return new Promise(resolve => {
        let popup = document.createElement("input");
        popup.value = defaultValue;
        popup.type = 'text';
        popup.size = 8;
        popup.classList.add('poppin');

        document.body.appendChild(popup);
        popup.style.left = x - (popup.clientWidth / 2) + 'px';
        popup.style.top = y + 'px';

        popup.onblur = () => {
            document.body.removeChild(popup);
            blur();
        };
        popup.onkeydown = (e) => {
            if (e.key === 'Enter') {
                enter(popup.value);
                popup.blur();
                e.stopPropagation();
                resolve();
            }
        };
        setTimeout(() => popup.focus(), 10);
    });
}

document.getElementsByClassName('navbar-brand')[0].addEventListener("click", () => {
    var audio = new Audio('src/resources/a-whole-new-world-cropped.mp3');
    audio.play();
});