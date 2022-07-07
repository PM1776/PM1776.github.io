import Graph from './graph.js';
import { Point } from './point.js';
import { MOBILE, TEXT_ABOVE_VERTEX, POINT_RADIUS, resizeInstantly, renderNewVertex, 
    renderNewEdge, renderRemoveVertex, drawVertex, drawEdge, drawGraph, drawVertices, 
    clear, drawDirectionalEdgeAnim, showNotification, showInputForVertex, showInputForEdge, view, zoom, DPR, 
    resetCtxTransform, canvasCoorToGraphCoor, graphCoorToCanvasCoor } from './graphView.js';
import { draggingEdgeAnim } from '../animations/addingEdgeAnim.js';
import { getEventPoint } from '../general/utility.js';
import { updateZoomScale } from '../animations/zoomAnim.js';

let edgeStartpt;

var disabled;

let oneTouch = false;
let doubleTap = false;
const VIBRATION_TIME = 100;

/**
 * Adds or removes a point from the graph. This method additionally begins the process of adding an edge
 * if the click point was in an existing vertex, and handles mobile touch events.
 * 
 * @param {*} e the event data.
 * @param {Graph} graph the graph to add or remove vertices or edges from.
 * @param {Point} touchPoint the point to create from a tap, as this data isn't accessable from the 'touchend' event.
 * @returns true if successful or successful in beginning the edge addition, and false if otherwise.
 */
 export async function addRemove(e, graph, touchPoint) {
    if (disabled) return;

    let canvasPoint = (!(touchPoint instanceof Point)) ? getEventPoint(e) : touchPoint;
    let point = canvasCoorToGraphCoor(canvasPoint);
    let vertexFound = graph.hasVertexInRadius(point, (!MOBILE) ? POINT_RADIUS : POINT_RADIUS * 3);

    if (vertexFound && !vertexFound.name) return; // clicked the same new point again without entering a name

    if ((e.type == 'mousedown' && e.button == 2) || // right clicked
        (e.type == 'touchstart')) { // double tapped

        if (vertexFound) renderRemoveVertex(vertexFound, graph);
        if (MOBILE && window.navigator.vibrate) window.navigator.vibrate(VIBRATION_TIME);
        return true;

    } else if ((e.type == 'mousedown' && e.button == 0) || // left click
               (e.type == 'touchstart' && Date.now() - e.touchstamp < 1000)) { // tapped shorter than a sec

        if (vertexFound) { // add an edge
            edgeStartpt = vertexFound;
            drawVertex(edgeStartpt, 'blue', undefined, false, true);
            return true;

        } else { // or add a vertex
            let overboundsOtherPoint = graph.hasVertexInRadius(point, POINT_RADIUS * 2);
            if (!overboundsOtherPoint) {
                let newPoint = new Point(point.x, point.y);
                renderNewVertex(newPoint, graph);

                await showInputForVertex(newPoint, graph);
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
 * @param {*} e The event data (handles both mouse and touch events).
 * @param {Graph} graph The graph object to draw behind the moving edge animation.
 * @returns A {@link Point} object with the co-ordinates moved to by the event.
 */
export function moveEdge (e, graph) {
    if (!edgeStartpt) return;

    let point = getEventPoint(e, true);
    draggingEdgeAnim(graph, edgeStartpt, point);
    return point;
}

/**
 * A function that processes dropping, or letting go of, the second point of the edge being created. 
 * 
 * @param {*} e the event to data.
 * @param {Graph} graph The graph object to add the edge inputs to and redraw.
 * @param {Point} touchPoint the point to create from a tap, as this data isn't accessable from the 'touchend' event.
 * @returns true if successful and false if otherwise.
 */
export async function dropEdge (e, graph, touchPoint) {
    if (!edgeStartpt) return false;
    
    let canvasPoint = (!(touchPoint instanceof Point)) ? getEventPoint(e) : touchPoint;
    let point = canvasCoorToGraphCoor(canvasPoint);
    let vertexFound = graph.hasVertexInRadius(point, (!MOBILE) ? POINT_RADIUS : POINT_RADIUS * 3);

    let vertexStarted = edgeStartpt;
    edgeStartpt = null;

    // dropped on same vertex, do nothing
    if (vertexFound === vertexStarted) {
        drawGraph(graph, true);
        return false;
    }

    if (vertexFound) {
        graph.addEdge(vertexStarted, vertexFound);
        await showInputForEdge(vertexStarted, vertexFound, graph);
        return true;
        
    } else {
        let overboundsOtherPoint = graph.hasVertexInRadius(point, POINT_RADIUS * 2);
        if (!overboundsOtherPoint) {
            graph.addVertex(point);
            graph.addEdge(vertexStarted, point);
            drawGraph(graph);
            await showInputForVertex(point, graph);
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
 * @param {Graph} graph The graph object to check whether inputting to an existing or new vertex.
 */
export function touchStart (e, graph) {
    switch (e.touches.length) {
        case 1:
            oneTouch = getEventPoint(e);
            
            if (!checkDoubleTap(e, graph)) // runs double tap code if applicable
                setTimeout(() => { // begins edge addition if tap held longer than a sec
                    if (!oneTouch) return;
                    
                    let point = getEventPoint(e, true), v;

                    if (v = graph.hasVertexInRadius(point, POINT_RADIUS * 2)) {
                        if (MOBILE && window.navigator.vibrate) window.navigator.vibrate(VIBRATION_TIME);
                        
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
 * @param {Graph} graph The graph object to draw behind the moving edge animation.
 */
export function touchMove(e, graph) {
    switch (e.touches.length) {
        case 1:
            oneTouch = moveEdge(e, graph); // stores the moving vertex for dropEdge(),
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
 * @param {Graph} graph The graph object to add or remove inputs to.
 * @returns true if successful, and false if otherwise.
 */
export function touchEnd (e, graph) {
    let status;
    if (edgeStartpt) {
        status = dropEdge(e, graph, oneTouch);
    } else {
        status = addRemove(e, graph, oneTouch);
    }
    oneTouch = false;
    return status;
}

/**
 * Checks if this is the second tap, and runs the double tap code if true.
 * 
 * @param {*} e the 'touchstart' event data.
 * @param {Graph} graph the graph object to remove a vertex from if double tapped.
 * @returns true if successfully runs double tap code, and false if not the second tap or unsuccessful.
 */
function checkDoubleTap(e, graph) {
    if (!doubleTap) {
        doubleTap = true;
        setTimeout(() => {doubleTap = false}, 300);
        return false;
    }
    e.preventDefault();

    // code runs if double tap
    return addRemove(e, graph);
}

/**
 * Handles the mouse wheel and mobile 'pinching' events to determine the zoom scale and draws the graph at that 
 * scale.
 * 
 * @param {*} event the 'mousescroll', 'DOMMouseScroll' or 'touchstart' event data.
 * @returns true if successful and false if otherwise.
 */
 export function onmousewheel(event, graph) {
    if (disabled) return;
    updateZoomScale(event);
    zoom(() => {drawGraph(graph)});
    event.preventDefault();
    return true;
}

/**
 * Disables or enables any input into the graph.
 * 
 * @param {boolean} dis Disabled if true and enabled if false.
 */
export function setGraphDisabled(dis) {
    disabled = dis;
}