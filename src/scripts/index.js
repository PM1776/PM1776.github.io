import Graph from './graph/graph.js';
import { MOBILE, TEXT_ABOVE_VERTEX, POINT_RADIUS, Point, resizeAnim, resizeInstantly, renderNewVertex, 
    renderNewEdge, renderRemoveVertex, drawVertex, drawEdge, drawGraph, drawVertices, 
    clear, drawDirectionalEdgeAnim, showNotification, showGraphInput, showInputForEdge, view, zoom, DPR, 
    resetCtxTransform } from './graph/graphView.js';
import { mergeSort } from './algorithms/mergeSort.js';
import { findClosestPairIn } from './algorithms/closestPairOfPoints.js';
import { depthFirstAnim, breadthFirstAnim, minimumSpanningTreeAnim, shortestPathAnim } from './animations/graphTraversingAnim.js';
import { draggingEdgeAnim } from './animations/addingEdgeAnim.js';
import { scale1Anim, scale1Instantly } from './animations/zoomAnim.js';
import { fade } from './animations/sortingAnim.js';

var graph;
var canvas;

var header;
var legend;
var headerHeight;
var legendHeight;

var disabled;
let edgeStartpt;

let CANVAS_OFFSET;
var newPointName;

let touchstamp;
let orientationchange = false;

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', (e) => {collapseNavbarToggle(false); resize(e)}, false); // for mobile
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
    canvas.addEventListener("mousewheel", onmousewheel, false);
    canvas.addEventListener("DOMMouseScroll", onmousewheel, false);
    
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
        {name: "Los Angeles", x:128, y:285},
        {name: "Denver", x:325, y:185},
        {name: "Kansas City", x:450, y:255},
        {name: "Chicago", x:500, y:110},
        {name: "Boston", x:728, y:90},
        {name: "New York", x:725, y:130},
        {name: "Atlanta", x:625, y:305},
        {name: "Miami", x:650, y:410},
        {name: "Dallas", x:458, y:335},
        {name: "Houston", x:495, y:370},
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

    // translates to center the map
    // view.setDefaultTranslate((canvas.width / 2) / dpr - (mapWidth * scale / 2),
    //         ((canvas.height / 2) / dpr - (mapHeight * scale / 2)));
    // view.apply();

    // scales each point manually
    for (let i = 0; i < vertices.length; i++) {
        let x = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'x').value * scale);
        let y = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'y').value * scale);
        x = Math.floor((canvas.width / 2) / dpr - (mapWidth * scale / 2) + x);
        y = Math.floor((canvas.height / 2) / dpr - (mapHeight * scale / 2) + y);
        Object.defineProperties(vertices[i], {x: {value: x}, y: {value: y}});
    }

    graph = new Graph(vertices, edges);
    graph.print();
    drawGraph(graph);
    enableButtons();
});

async function resize(e) {

    console.log(e.type);

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;
    legendHeight = legend.getBoundingClientRect().height;

    var targetX = document.body.clientWidth - CANVAS_OFFSET * 2;
    var targetY = document.body.clientHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

    if (e.type === 'load') {
        await resizeAnim(targetX, targetY);
    } else if (e.type === 'orientationchange' ||
              (e.type === 'resize')) {
                  console.log(e.type);
        resizeInstantly(targetX, targetY);
        drawGraph(graph, true);
    }
}

function addRemove(e) {
    if (disabled) return;

    headerHeight = header.getBoundingClientRect().height; // updates

    console.log(e.type + ", ");
    let x = (e.type === 'mousedown') ? e.clientX - CANVAS_OFFSET : e.touches[0].clientX;
    let y = (e.type === 'mousedown') ? e.clientY - headerHeight - legendHeight - CANVAS_OFFSET : e.touches[0].clientY;
    let v = graph.hasVertexInRadius(new Point(x, y), POINT_RADIUS);

    if (v && !v.name) return; // clicked same point again when text input asked for a new point

    if (e.type == 'mousedown') {
        if (e.button == 2) { // right click
            if (v) renderRemoveVertex(v, graph); 
            
        } else if (e.button == 0) { // left click
            if (v) { // add edge
                edgeStartpt = v;
                drawVertex(edgeStartpt, 'blue');

            } else { // or add vertex
                let inOtherPoint = graph.hasVertexInRadius(new Point(x, y), POINT_RADIUS * 2);
                if (!inOtherPoint) {
                    let newPoint = new Point(x, y);
                    renderNewVertex(newPoint, graph);

                    // blur() runs when both the user clicks away and hits 'enter'
                    let blur = () => {
                        if (newPoint.name == null) graph.removeVertex(newPoint);
                        drawGraph(graph);
                    }, enter = (inputValue) => {
                        graph.setVertexName(newPoint, inputValue);
                        newPointName++;
                    };

                    showGraphInput(new Point(x, headerHeight + legendHeight + y - TEXT_ABOVE_VERTEX), newPointName, blur, enter);
                } else {
                    showNotification("<strong>A point must not overlap on another.</strong> Space is nice.",
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

    let point = {name: null,
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
        showInputForEdge(vertexStarted, secondPoint, graph);
    } else {
        let inOtherPoint = graph.hasVertexInRadius(point, POINT_RADIUS * 2);
        if (!inOtherPoint) {
            graph.addVertex(point);
            graph.addEdge(vertexStarted, point);
            drawGraph(graph);

            // blur will run when both the user clicks away and hits 'enter'
            let blur = () => {
                if (point.name == null) graph.setVertexName(point, newPointName++);
                drawGraph(graph);
            }, enter = (inputValue) => {
                graph.setVertexName(point, inputValue);
                newPointName++;
            }
            await showGraphInput(new Point(point.x, headerHeight + legendHeight + point.y - TEXT_ABOVE_VERTEX), 
                newPointName, blur, enter);
            await showInputForEdge(vertexStarted, point, graph);
            drawGraph(graph);
            graph.print();
        } else {
            showNotification("<strong>A point must not overlap on another.</strong> Space is nice.",
                3000);
            drawGraph(graph);
        }
    }
}

async function beginMergeSort(e) {

    collapseNavbarToggle(true);
    scale1Instantly();

    let axis = (e.target.id === 'byX') ? "x" : "y";

    legendHeight = parseInt(window.getComputedStyle(legend).height);
    legend.innerHTML = '';
    createLegendItem('green', "Sorting By " + axis.toUpperCase());
    legendHeight = Math.max(parseInt(window.getComputedStyle(legend).height), legendHeight);
    legend.style.height = legendHeight + "px";
    
    disableButtons();
    await mergeSort(graph, axis);
    enableButtons();
    defaultLegend();
}

async function findClosestPair () {

    collapseNavbarToggle(true);
    scale1Instantly();

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
    scale1Instantly();
    drawGraph(graph);

    let starting = document.getElementById("start").value;
    let searchingFor = document.getElementById("searchingFor").value;
    let search = document.getElementById('searchType').innerText;

    if (!((starting = graph.hasVertex(starting)) && (searchingFor = graph.hasVertex(searchingFor)))) {
        showNotification("Could not find the starting or searching point in the graph.", 5000);
    }
    if (starting === searchingFor) {
        showNotification("<b>" + starting.name + "</b></br>Search Length: <b>0</b></br></br>Humans.", 3000);
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
    } else if (search == 'Breadth-First Search') {
        await breadthFirstAnim(graph.bfs(starting), searchingFor, graph);
    } else if (search == 'Total Shortest Distance') {
        await minimumSpanningTreeAnim(graph.getMinimumSpanningTree(starting), graph);
    } else {
        await shortestPathAnim(graph.getShortestPath(starting), graph);
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
    createLegendItem('mouseWheel', "Zoom");
}

function disableButtons () {
    disabled = true;
    resetCtxTransform();
    drawGraph(graph);

    for (let s of ['closest', 'findPaths', 'search']) {
        document.getElementById(s).setAttribute("disabled", "");
        document.getElementById(s).setAttribute("aria-disabled", ""); // for assistive technologies
    }

    document.getElementById('sort').classList.add("disabled"); // disabled look
    canvas.style.cursor = "default";
}

function enableButtons () {
    disabled = false;

    for (let s of ['closest', 'findPaths', 'search']) {
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
    if (e.target.innerHTML == 'Shortest Paths') {
        document.getElementById('searchingFor').setAttribute("disabled", "");
    } else {
        document.getElementById('searchingFor').removeAttribute("disabled")
    }
}

function onmousewheel(event) {
    if (disabled) return;
    var e = window.event || event;
    var x = e.offsetX;
    var y = e.offsetY;
    const delta = e.type === "mousewheel" ? e.wheelDelta : -e.detail;
    if (delta > 0) { view.scaleAt({x, y}, 1.1) }
    else { view.scaleAt({x, y}, 1 / 1.1) }
    zoom(() => {drawGraph(graph)});
    e.preventDefault();
  }

document.getElementsByClassName('navbar-brand')[0].addEventListener("click", () => {
    var audio = new Audio('src/resources/a-whole-new-world-cropped.mp3');
    audio.play();
});

document.getElementById('findPaths').addEventListener("click", () => {
    if (document.getElementById('findPaths').classList.contains('collapsed')) { // checks just before the collapsed 
        document.getElementById('findPaths').classList.add('active');           // class is removed when collapsing,
    } else {                                                                    // basically switching the effect
        document.getElementById('findPaths').classList.remove('active');
    }
});