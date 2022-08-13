import Graph from './scripts/graph/graph.js';
import { MOBILE, TEXT_ABOVE_VERTEX, POINT_RADIUS, resizeInstantly, renderNewVertex, 
    renderNewEdge, renderRemoveVertex, drawVertex, drawEdge, drawGraph, drawVertices, 
    clear, drawDirectionalEdgeAnim, showNotification, showInputForEdge, view, zoom, DPR, 
    resetCtxTransform, canvasCoorToGraphCoor, graphCoorToCanvasCoor } from './scripts/graph/graphView.js';
import { addRemove, moveEdge, dropEdge, touchStart, touchMove, touchEnd, onmousewheel,
    setGraphDisabled } from './scripts/graph/graphController.js'; 
import { resizeAnim } from './scripts/animations/resizeAnim.js';
import { mergeSort } from './scripts/algorithms/mergeSort.js';
import { findClosestPairIn } from './scripts/algorithms/closestPairOfPoints.js';
import { depthFirstAnim, breadthFirstAnim, minimumSpanningTreeAnim, shortestPathAnim } from './scripts/animations/graphTraversingAnim.js';
import { scale1Instantly } from './scripts/animations/zoomAnim.js';
import { loadGraphMap, loadUSGraph } from './scripts/graph/maps.js';
import { loadCurrentHelpPage } from './scripts/general/helpMessages.js';
import { checkIfString } from './scripts/general/errorHandling.js';

var graph;
var canvas;

var header;
var legend;
var headerHeight;
var legendHeight;

/** The margin of the #graphView canvas. */
let CANVAS_MARGIN;
/** The margin + border size of the #graphView canvas. */
let CANVAS_OFFSET;

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', e => {collapseNavbarToggle(false); resize(e)}, false); // for mobile
window.addEventListener("contextmenu", e => e.preventDefault());

document.getElementById('closest').addEventListener("click", findClosestPair);
document.getElementById('byX').addEventListener("click", beginMergeSort);
document.getElementById('byY').addEventListener("click", beginMergeSort);
document.getElementById('search').addEventListener("click", traverseGraph);
for (let s of ['byDepth', 'byBreadth', 'byMinimumSpanningTree', 'byShortestPaths']) {
    document.getElementById(s).addEventListener("click", changeSearchType);
}
document.getElementById('us').addEventListener("click", loadGraph);
document.getElementById('binary').addEventListener("click", loadGraph);

window.addEventListener("load", async (e) => {
    
    canvas = document.getElementById('graphView');
    canvas.style.border = '2px solid black'; // couldn't re-access from initializing in css

    header = document.getElementById('header');
    legend = document.getElementById('legend');

    // headerHeight initialized in resize() below
    legendHeight = legend.getBoundingClientRect().height;
    CANVAS_MARGIN = parseInt(window.getComputedStyle(document.getElementById('canvasContainer')).marginTop);
    CANVAS_OFFSET = CANVAS_MARGIN + parseInt(window.getComputedStyle(canvas).border);
    document.getElementById('alert').style.backgroundColor = 'rgba(224, 224, 224, .9)';

    canvas.addEventListener("mousedown", (e) => addRemove(e, graph));
    canvas.addEventListener("touchstart", (e) => touchStart(e, graph));
    canvas.addEventListener("touchmove", (e) => touchMove(e, graph));
    canvas.addEventListener("touchend", (e) => touchEnd(e, graph));
    canvas.addEventListener("mousemove", (e) => moveEdge(e, graph));
    canvas.addEventListener("mouseup", (e) => dropEdge(e, graph));
    canvas.addEventListener("mousewheel", (e) => onmousewheel(e, graph), false);
    canvas.addEventListener("DOMMouseScroll", (e) => onmousewheel(e, graph), false);

    loadCurrentHelpPage();

    defaultLegend();
    await resize(e);

    loadGraph('us');
    enableButtons();
});

/**
 * Loads a pre-made graph mapping into the graph and draws it.
 * 
 * @param {*} e An event from a "Change Map" dropdown button, or the name of the map to load and draw.
 */
function loadGraph(e) {
    let name = (typeof e == 'string') ? e : e.currentTarget.id;
    graph = loadGraphMap(name);
    drawGraph(graph);
    if (name == 'us') {
        document.getElementById('start').value = "Seattle";
        document.getElementById('searchingFor').value = "Houston";
    } else {
        document.getElementById('start').value = "43";
        document.getElementById('searchingFor').value = "34";
    }
}

/**
 * Resizes the canvas #graphView to re-size to the window size.
 * 
 * @param {*} e the event that triggered the resizing.
 */
async function resize(e) {

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;
    legendHeight = legend.getBoundingClientRect().height;

    var targetX = document.body.offsetWidth - CANVAS_OFFSET * 2;
    var targetY = document.body.offsetHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

    if (e.type === 'load') {
        await resizeAnim(targetX, targetY);
    } else if (e.type === 'orientationchange' || e.type === 'resize') {
        resizeInstantly(targetX, targetY);
        drawGraph(graph, true);
    }
}

/**
 * Animates merge sorting the graph's points at a zoom scale of 1.
 * 
 * @param {*} e the event data.
 * @returns true if successful and false if otherwise.
 */
async function beginMergeSort(e) {

    collapseNavbarToggle(true);
    scale1Instantly();

    let axis = (e.target.id === 'byX') ? "x" : "y";

    createLegendItems([
        ['green', "Sorting By " + axis.toUpperCase()]
    ]);
    
    disableButtons();
    await mergeSort(graph, axis);
    enableButtons();
    
    defaultLegend();
    return true;
}

/**
 * Animates finding the closest pair of points in the graph's points at a zoom scale of 1.
 * 
 * @returns true if successful and false if otherwise.
 */
async function findClosestPair () {

    collapseNavbarToggle(true);
    scale1Instantly();

    createLegendItems([
        ['blue', "Closest Pair"],
        ['darkGreen', "Comparing Pair"],
        ['yellow', "Searching Sector"],
        ['blue-yellow', "Merging Sectors"],
    ]);

    disableButtons();
    await findClosestPairIn(graph);
    enableButtons();

    defaultLegend();
    return true;
}

/**
 * Finds a path in the graph, typically from a starting point to a 'searching for' point at a scale of 1.
 * This method handles depth-first, breadth-first, minimum spanning tree, and shortest path searching.
 * 
 * @returns true if successful and false if otherwise.
 */
async function traverseGraph () {

    collapseNavbarToggle(true);
    scale1Instantly();
    drawGraph(graph);

    let starting = document.getElementById("start").value;
    let searchingFor = document.getElementById("searchingFor").value;
    let search = document.getElementById('searchType').innerText;

    if (!((starting = graph.getVertex(starting)) && (searchingFor = graph.getVertex(searchingFor)))) {
        showNotification("Could not find the starting or searching point in the graph.", 5000);
        return;
    }
    if (starting === searchingFor) {
        showNotification("Path Found: <b>" + starting.name + "</b></br>Search Length: <b>0</b></br></br>Humans.", 3000);
        return false;
    }

    createLegendItems([
        ['blue', "Searched"]
    ]);

    disableButtons();
    drawGraph(graph);
    if (search == 'Depth-First Search') {
        await depthFirstAnim(graph.dfs(starting), searchingFor, graph);
    } else if (search == 'Breadth-First Search') {
        await breadthFirstAnim(graph.bfs(starting), searchingFor, graph);
    } else if (search == 'Minimum Spanning Tree') {
        await minimumSpanningTreeAnim(graph.getMinimumSpanningTree(starting), graph);
    } else if (search == 'Shortest Path') {
        await shortestPathAnim(graph.getShortestPath(starting), searchingFor, graph);
    }
    enableButtons();
    defaultLegend();
    return true;
}

/**
 * Creates a legend item with an optional icon and/or text, and attaches it to the #legend.
 * 
 * @param {*} classOfIcon a preset class in index.css to display the icon (or color) of the legend item.
 * @param {*} text the text to place to the right of the legend icon.
 * @returns true if successful and false if otherwise.
 */
function createLegendItem(classOfIcon, text) {

    checkIfString({ classOfIcon, text });

    let legendItem = document.createElement('div');

    let icon = document.createElement('div');
    icon.classList.add("legendItem");
    icon.classList.add(classOfIcon);

    legendItem.appendChild(icon);
    legendItem.innerHTML += text;

    legend.appendChild(legendItem);
    return true;
}

/**
 * Clears the legend and uses the {@link createLegendItem} function to create new legend items. It additionally
 * sets the height of the legend as the highest height of the previous legend or the newly created one to
 * prevent a gap at the bottom of the #graphView canvas.
 * 
 * @param {*} legendItems an array holding the arrays of items to create, with the item arrays containing 
 * 'classOfIcon' in the first index and 'text' in the second.
 * @returns true if successful and false if otherwise.
 */
 function createLegendItems(legendItems) {
    if (!(Array.isArray(legendItems))) {
        throw new TypeError("'legendItems' must be an array holding the arrays of items to create, with the " +
        "item arrays containing its 'classOfIcon' in the first index and 'text' in the second");
    }

    legendHeight = parseInt(window.getComputedStyle(legend).height);
    legend.innerHTML = '';
    for (let legendItem of legendItems) {
        createLegendItem(legendItem[0], legendItem[1]);
    }
    legendHeight = Math.max(parseInt(window.getComputedStyle(legend).height), legendHeight);
    legend.style.height = legendHeight + "px";
    return true;
}

/**
 * Creates the default legend shown at the loading of the page.
 */
function defaultLegend () {
    document.getElementById('legend').innerHTML = '';
    createLegendItem((!MOBILE) ? 'click' : 'tap', "Add Point");
    createLegendItem((!MOBILE) ? 'rightClick' : 'doubleTap', "Remove Point");
    createLegendItem((!MOBILE) ? 'drag' : 'dragTap', "Connect");
    createLegendItem((!MOBILE) ? 'zoom' : 'zoomPinch', "Zoom");
}

/**
 * Enables nearly all of the buttons in the navBar.
 */
function enableButtons () {
    setGraphDisabled(false);

    for (let s of ['closest', 'findPaths', 'search', 'maps', 'tutorial']) {
        document.getElementById(s).removeAttribute("disabled");
        document.getElementById(s).removeAttribute("aria-disabled"); // for assistive technologies
    }

    document.getElementById('sort').classList.remove("disabled"); // disabled look
    document.getElementById('maps').classList.remove("disabled"); // disabled look
    canvas.style.cursor = "pointer";
}

/**
 * Disables nearly all of the buttons in the navBar.
 */
function disableButtons () {
    setGraphDisabled(true);
    resetCtxTransform();
    drawGraph(graph);

    for (let s of ['closest', 'findPaths', 'search', 'maps', 'tutorial']) {
        document.getElementById(s).setAttribute("disabled", "");
        document.getElementById(s).setAttribute("aria-disabled", ""); // for assistive technologies
    }

    document.getElementById('sort').classList.add("disabled"); // disabled look
    document.getElementById('maps').classList.add("disabled"); // disabled look
    canvas.style.cursor = "default";
}

/**
 *  Bootstrap has a nice smooth collapse; this is instant and not smooth.
 */ 
function collapseNavbarToggle () {
    document.getElementById('navbarNavAltMarkup').classList.remove("show");
    document.getElementsByClassName('navbar-toggler')[0].classList.add("collapsed");
}

/**
 * Simply changes the text of the 'searchType' button to whatever was selected in its dropdown.
 * 
 * @param {*} e the event data.
 */
function changeSearchType (e) {
    document.getElementById('searchType').innerHTML = e.target.innerHTML;
    if (e.target.id == 'byMinimumSpanningTree') {
        document.getElementById('searchingFor').setAttribute("disabled", "");
    } else {
        document.getElementById('searchingFor').removeAttribute("disabled");
    }
}

/**
 * An easter-egg of sound when the user clicks the title.
 */
document.getElementsByClassName('navbar-brand')[0].addEventListener("click", () => {
    var audio = new Audio('src/resources/a-whole-new-world-cropped.mp3');
    audio.play();
});

document.getElementById('findPaths').addEventListener("click", () => {
    if (!MOBILE) setTimeout(() => { // delay to let its content expand
        headerHeight = header.getBoundingClientRect().height;

        var targetX = document.body.offsetWidth - CANVAS_OFFSET * 2;
        var targetY = document.body.offsetHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

        resizeInstantly(targetX, targetY);
        drawGraph(graph);
    }, 500);
});

document.getElementById('findPaths').addEventListener("click", () => {
    if (document.getElementById('navbarToggleExternalContent').classList.contains('show')) {
        document.getElementById('findPaths').classList.remove('active');
    } else {
        document.getElementById('findPaths').classList.add('active');
    }
});