import { clear, drawEdge, drawGraph, drawVertex } from '../graph/graphView.js';

export function draggingEdgeAnim(graph, addingEdge, point) {
    clear();
    drawEdge(addingEdge, point, 'blue');
    drawGraph(graph, false, 1);
    drawVertex(addingEdge, 'blue');
}