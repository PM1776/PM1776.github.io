import Graph from './scripts/graph/graph.js';
import { MOBILE, TEXT_ABOVE_VERTEX, POINT_RADIUS, Point, resizeAnim, resizeInstantly, renderNewVertex, 
    renderNewEdge, renderRemoveVertex, drawVertex, drawEdge, drawGraph, drawVertices, 
    clear, drawDirectionalEdgeAnim, showNotification, showGraphInput, showInputForEdge, view, zoom, DPR, 
    resetCtxTransform, canvasCoorToGraphCoor, graphCoorToCanvasCoor } from './scripts/graph/graphView.js';
import { mergeSort } from './scripts/algorithms/mergeSort.js';
import { findClosestPairIn } from './scripts/algorithms/closestPairOfPoints.js';
import { depthFirstAnim, breadthFirstAnim, minimumSpanningTreeAnim, shortestPathAnim } from './scripts/animations/graphTraversingAnim.js';
import { draggingEdgeAnim } from './scripts/animations/addingEdgeAnim.js';
import { scale1Instantly } from './scripts/animations/zoomAnim.js';
import { zoomScaleHandler } from './scripts/animations/zoomAnim.js';

var graph;
var canvas;

var header;
var legend;
var headerHeight;
var legendHeight;

var disabled;
let edgeStartpt;

/** The margin of the #graphView canvas. */
let CANVAS_MARGIN;
/** The margin + border size of the #graphView canvas. */
let CANVAS_OFFSET;

var pointCount;

let oneTouch = false;
let doubleTap = false;
const VIBRATION_TIME = 100;

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', e => {collapseNavbarToggle(false); resize(e)}, false); // for mobile
window.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener("load", async (e) => {
    
    canvas = document.getElementById('graphView');
    canvas.style.border = '2px solid black'; // couldn't access from initializing in css

    header = document.getElementById('header');
    legend = document.getElementById('legend');

    // headerHeight initialized in resize() below
    legendHeight = legend.getBoundingClientRect().height;
    CANVAS_MARGIN = parseInt(window.getComputedStyle(document.getElementById('canvasContainer')).marginTop);
    CANVAS_OFFSET = CANVAS_MARGIN + parseInt(window.getComputedStyle(canvas).border);

    canvas.addEventListener("mousedown", addRemove);
    canvas.addEventListener("touchstart", touchStart);
    canvas.addEventListener("touchmove", touchMove);
    canvas.addEventListener("touchend", touchEnd);
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

    // Adds a portion of the map of the US and connecting some near-by points as edges to the graph.
    let mapWidth, mapHeight;
    let scale = Math.min(canvas.width / ((mapWidth = 780) * DPR), canvas.height / ((mapHeight = 430) * DPR));

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

    pointCount = vertices.length;

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

    // scales each point manually
    for (let i = 0; i < vertices.length; i++) {
        let x = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'x').value * scale);
        let y = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'y').value * scale);
        x = Math.floor((canvas.width / 2) / DPR - (mapWidth * scale / 2) + x);
        y = Math.floor((canvas.height / 2) / DPR - (mapHeight * scale / 2) + y);
        Object.defineProperties(vertices[i], {x: {value: x}, y: {value: y}});
    }

    graph = new Graph(vertices, edges);
    graph.print();
    drawGraph(graph);
    enableButtons();
});

/**
 * Resizes the canvas #graphView to re-size to the window size.
 * 
 * @param {*} e the event that triggered the resizing.
 */
async function resize(e) {

    console.log(e.type);

    // constantly refreshes header heights, as sometimes header stacks
    headerHeight = header.getBoundingClientRect().height;
    legendHeight = legend.getBoundingClientRect().height;

    var targetX = document.body.clientWidth - CANVAS_OFFSET * 2;
    var targetY = document.body.clientHeight - headerHeight - legendHeight - CANVAS_OFFSET * 2;

    if (e.type === 'load') {
        await resizeAnim(targetX, targetY);
    } else if (e.type === 'orientationchange' || e.type === 'resize') {
        resizeInstantly(targetX, targetY);
        drawGraph(graph, true);
    }
}

/**
 * Adds or removes a point from the graph. This method additionally begins the process of adding an edge
 * if the click point was in an existing vertex, and handles mobile touch events.
 * 
 * @param {*} e the event data.
 * @param {*} touchPoint the point to create from a tap, as this data isn't accessable from the 'touchend' event.
 * @returns true if successful or successful in beginning the edge addition, and false if otherwise.
 */
async function addRemove(e, touchPoint) {
    if (disabled) return;

    headerHeight = header.getBoundingClientRect().height; // updates

    let canvasPoint = (!(touchPoint instanceof Point)) ? getEventPoint(e) : touchPoint;
    let point = canvasCoorToGraphCoor(canvasPoint);
    let vertex = graph.hasVertexInRadius(point, POINT_RADIUS);

    if (vertex && !vertex.name) return; // clicked the same new point again without entering a name

    if ((e.type == 'mousedown' && e.button == 2) || // right clicked
        (e.type == 'touchstart')) { // double tapped

        if (vertex) renderRemoveVertex(vertex, graph);
        if (MOBILE) window.navigator.vibrate(VIBRATION_TIME);
        return true;

    } else if ((e.type == 'mousedown' && e.button == 0) || // left click
               (e.type == 'touchstart' && Date.now() - e.touchstamp < 1000)) { // tapped shorter than a sec

        if (vertex) { // add an edge
            edgeStartpt = vertex;
            drawVertex(edgeStartpt, 'blue', undefined, false, true);
            return true;

        } else { // or add a vertex
            let overboundsOtherPoint = graph.hasVertexInRadius(point, POINT_RADIUS * 2);
            if (!overboundsOtherPoint) {
                let newPoint = new Point(point.x, point.y);
                renderNewVertex(newPoint, graph);

                let blur = () => { // runs when both the user clicks away and hits 'enter'
                    if (newPoint.name == null) graph.removeVertex(newPoint);
                    drawGraph(graph);
                }, enter = (inputValue) => {
                    graph.setVertexName(newPoint, inputValue);
                    pointCount++;
                };

                await showGraphInput(new Point(canvasPoint.x, headerHeight + legendHeight + canvasPoint.y - TEXT_ABOVE_VERTEX), pointCount, blur, enter);
                return true;
            } else {
                showNotification("<strong>A point must not overlap on another.</strong> Space is nice.",
                    3000);
                return false;
            }
        }
    }
}

/**
 * Animates an edge that follows the mouse or tap if the second point is not finalized.
 * 
 * @param {*} e the event data (handles mouse and touch events).
 * @returns a {@link Point} object with the co-ordinates moved to by the event.
 */
function moveEdge (e) {
    if (!edgeStartpt) return;

    let point = getEventPoint(e, true);
    draggingEdgeAnim(graph, edgeStartpt, point);
    return point;
}

/**
 * A function that processes dropping, or letting go of, the second point of the edge being created. 
 * 
 * @param {*} e the event to data.
 * @param {*} touchPoint the point to create from a tap, as this data isn't accessable from the 'touchend' event.
 * @returns true if successful and false if otherwise.
 */
async function dropEdge (e, touchPoint) {
    if (!edgeStartpt) return false;
    
    let canvasPoint = (!(touchPoint instanceof Point)) ? getEventPoint(e) : touchPoint;
    let point = canvasCoorToGraphCoor(canvasPoint);
    let secondPoint = graph.hasVertexInRadius(point, POINT_RADIUS);

    let vertexStarted = edgeStartpt;
    edgeStartpt = null;

    // dropped on same vertex, do nothing
    if (secondPoint === vertexStarted) {
        drawGraph(graph, true);
        return false;
    }

    if (secondPoint) {
        graph.addEdge(vertexStarted, secondPoint);
        await showInputForEdge(vertexStarted, secondPoint, graph);
        return true;
    } else {
        let overboundsOtherPoint = graph.hasVertexInRadius(point, POINT_RADIUS * 2);
        if (!overboundsOtherPoint) {
            graph.addVertex(point);
            graph.addEdge(vertexStarted, point);
            drawGraph(graph);

            let blur = () => { // will run when both the user clicks away and hits 'enter'
                if (point.name == null) graph.setVertexName(point, pointCount++);
                drawGraph(graph);
            }, enter = (inputValue) => {
                graph.setVertexName(point, inputValue);
                pointCount++;
            }
            await showGraphInput(new Point(canvasPoint.x, headerHeight + legendHeight + canvasPoint.y - TEXT_ABOVE_VERTEX), 
                pointCount, blur, enter);
            await showInputForEdge(vertexStarted, point, graph);

            drawGraph(graph);
            graph.print();
            return true;
        } else {
            showNotification("<strong>A point must not overlap on another.</strong> Space is nice.",
                3000);
            drawGraph(graph);
            return false;
        }
    }
}

/**
 * The 'touchstart' event handler that handles double tapping and edge addition when held longer than a second.
 * 
 * @param {*} e the event data.
 */
function touchStart (e) {
    switch (e.touches.length) {
        case 1:
            oneTouch = getEventPoint(e);
            
            if (!checkDoubleTap(e)) // runs double tap code if applicable
                setTimeout(() => { // begins edge addition if tap held longer than a sec
                    showNotification("Held boi!!", 5000);
                    if (!oneTouch) return;
                    
                    let point = getEventPoint(e, true), v;

                    if (v = graph.hasVertexInRadius(point, POINT_RADIUS * 2)) {
                        if (MOBILE) window.navigator.vibrate(VIBRATION_TIME);
                        
                        edgeStartpt = v;
                        drawVertex(edgeStartpt, 'blue');
                    }
                }, 1000);
            break;
        default:
            oneTouch = false;
    }
}

/**
 * Handles the 'touchmove' mobile event, determining either to change the zoom scale or animate the edge to 
 * be created when released.
 * 
 * @param {*} e the event data.
 */
function touchMove(e) {
    switch (e.touches.length) {
        case 1:
            oneTouch = moveEdge(e); // stores the moving vertex for dropEdge(),
            break;                  // as 'touchend' handler doesn't store
        case 2:
            onmousewheel(e);
            break;
    }
}
/**
 * The 'touchend' handler to determine if completing adding an edge, or adding or removing a point.
 * 
 * @param {*} e The event data.
 * @returns true if successful, and false if otherwise.
 */
function touchEnd (e) {
    let status;
    if (edgeStartpt) {
        status = dropEdge(e, oneTouch);
    } else {
        status = addRemove(e, oneTouch);
    }
    oneTouch = false;
    return status;
}

/**
 * Checks if this is the second tap, and runs the double tap code if true.
 * 
 * @param {*} e the 'touchstart' event data.
 * @returns true if successfully runs double tap code, and false if not the second tap or unsuccessful.
 */
function checkDoubleTap(e) {
    if (!doubleTap) {
        doubleTap = true;
        setTimeout(() => {doubleTap = false}, 300);
        return false;
    }
    e.preventDefault();

    // code runs if double tap
    return addRemove(e);
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

    if (!((starting = graph.getNeighbors().has(starting)) && (searchingFor = graph.getNeighbors().has(searchingFor)))) {
        showNotification("Could not find the starting or searching point in the graph.", 5000);
    }
    if (starting === searchingFor) {
        showNotification("Path Found: <b>" + starting.name + "</b></br>Search Length: <b>0</b></br></br>Humans.", 3000);
        return;
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
    } else if (search == 'Smallest Entirety Distance') {
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
 * its 'classOfIcon' in the first index and 'text' in the second.
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
    createLegendItem((!MOBILE) ? 'drag' : 'dragTap', "Connect");
    createLegendItem((!MOBILE) ? 'rightClick' : 'doubleTap', "Remove Point");
    createLegendItem((!MOBILE) ? 'zoom' : 'zoomPinch', "Zoom");
}

/**
 * Handles the mouse wheel and mobile 'pinching' events to determine the zoom scale and draws the graph at that 
 * scale.
 * 
 * @param {*} event the 'mousescroll', 'DOMMouseScroll' or 'touchstart' event data.
 * @returns true if successful and false if otherwise.
 */
function onmousewheel(event) {
    if (disabled) return;
    zoomScaleHandler(event);
    zoom(() => {drawGraph(graph)});
    event.preventDefault();
    return true;
}

/**
 * A utility method to get the canvas co-ordinates from the event.
 * 
 * @param {*} e the event data.
 * @param {*} toGraphCoor If true, additionally converts the canvas co-ordinates to its graph co-ordinates.
 * @returns a {@link Point} object with the 'x' and'y' data.
 */
function getEventPoint(e, toGraphCoor) {
    let point = (e.type == 'mousedown' || e.type == 'mousemove' || e.type == 'mouseup') ? 
        new Point(e.clientX - CANVAS_MARGIN, e.clientY - headerHeight - legendHeight - CANVAS_MARGIN)
        : new Point(e.touches[0].clientX - CANVAS_MARGIN, e.touches[0].clientY - headerHeight - legendHeight 
            - CANVAS_MARGIN);
    return (!toGraphCoor) ? point : canvasCoorToGraphCoor(point);
}

/**
 * Enables nearly all of the buttons in the navBar.
 */
function enableButtons () {
    disabled = false;

    for (let s of ['closest', 'findPaths', 'search']) {
        document.getElementById(s).removeAttribute("disabled");
        document.getElementById(s).removeAttribute("aria-disabled"); // for assistive technologies
    }

    document.getElementById('sort').classList.remove("disabled"); // disabled look
    canvas.style.cursor = "pointer";
}

/**
 * Disables nearly all of the buttons in the navBar.
 */
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

/**
 * This method reverses the collapsing of the 'findPaths' button, as it's toggle panel to display begins open.
 */
document.getElementById('findPaths').addEventListener("click", () => {
    if (document.getElementById('findPaths').classList.contains('collapsed')) {
        document.getElementById('findPaths').classList.add('active');           
    } else {                                                                    
        document.getElementById('findPaths').classList.remove('active');
    }
});