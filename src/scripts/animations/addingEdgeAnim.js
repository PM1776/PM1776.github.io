import { clear, drawEdge, drawGraph, drawVertex } from '../graph/graphView.js';

const COLOR = 'blue';

/**
 * Draws the edge to be added when the mouse is being dragged or a tap is being held with mobile.
 * 
 * @param {*} graph the graph to display with the edge.
 * @param {*} v2 the second point of the edge, which is the mouse of tap point data.
 * @param {*} v1 the first point that the edge is beginning from.
 */
export function draggingEdgeAnim(graph, v2, v1) {
    clear();
    drawEdge(v2, v1, COLOR, 'blue', undefined, false, true);
    drawGraph(graph, false);
    drawVertex(v2, COLOR, undefined, false, true);
}