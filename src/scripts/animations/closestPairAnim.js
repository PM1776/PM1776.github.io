import { clear, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawGraph, GRAD_BY_X, GRAD_BY_Y } from '../graph/graphView.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext('2d');

const closestPairColor = 'blue';
const comparingColor = 'green';
const loserColor = 'red';

const RATE = 500;
const BRUTE_RATE = 500;

export function visualizeBruteCompare (points, closestPair, p1, p2, low, high) {
    return new Promise(resolve => {

        drawVertices(points, undefined, true);

        drawEdge(closestPair.p1, closestPair.p2, closestPairColor, );
        drawEdge(p1, p2, comparingColor);

        drawDividers(points[(low === 0) ? 0 : low - 1].x, points[high].x);
        
        setTimeout(() => {
            clear();
            resolve();
        }, BRUTE_RATE);
    });
}

export function visualizeBruteCloser (points, closestPair, low, high) {
    return new Promise(resolve => {
        drawVertices(points, undefined, true);
        drawEdge(closestPair.p1, closestPair.p2, closestPairColor);

        drawDividers(points[(low === 0) ? 0 : low - 1].x, points[high].x);

        setTimeout(() => {
            resolve();
        }, BRUTE_RATE);
    });
}

export function compareSectors(points, pair1, pair2, closestPair, low, high) {
    return new Promise(resolve => {

        // repaints all verticies without clearing
        drawVertices(points, undefined, true);

        // comparing closestPairs
        drawEdge(pair1.p1, pair1.p2, closestPairColor);
        drawEdge(pair2.p1, pair2.p2, closestPairColor);

        // borders of the two sectors merging
        drawDividers(points[low].x, points[high].x);
        let extra =  + (low != 0) ? 1 : 0; // an index higher to make the sectors converging more obvious
        let midX = points[0|(low + (high - low) / 2) + extra].x;
        drawEdge({x: midX, y: 0}, {x: midX, y: canvas.clientHeight}, 'yellow', null);

        // displays results
        setTimeout(() => {

            clear();
            drawVertices(points, undefined, false);
            drawEdge(closestPair.p1, closestPair.p2, closestPairColor);
            drawDividers(points[low].x, points[high].x);
            drawEdge({x: midX, y: 0}, {x: midX, y: canvas.clientHeight}, 'yellow', null);

            setTimeout(() => {
                resolve();
            }, RATE);

        }, RATE);
    });
}

export function mergeSectors(points, closestBefore, closestPair, low, high) {
    return new Promise(resolve => {

        drawVertices(points, undefined, false);
        drawEdge(closestBefore.p1, closestBefore.p2, closestPairColor);
        drawDividers(points[low].x, points[high].x);
        
        setTimeout(() => {
            drawVertices(points, undefined, true);
            drawEdge(closestPair.p1, closestPair.p2, closestPairColor);
            drawDividers(points[low].x, points[high].x);

            setTimeout(() => {
                resolve();
            }, RATE);

        }, RATE);
    });
}

export function drawRange(midX, closestPairDist) {
    clear();
    drawDividers(midX - closestPairDist, midX + closestPairDist, closestPairColor);
    drawDottedDivider(midX);
}

function drawDividers (beginningRange, endRange, color = 'yellow') {
    drawEdge({x: beginningRange, y: 0}, {x: beginningRange, y: canvas.clientHeight}, color, null);
    drawEdge({x: endRange, y: 0}, {x: endRange, y: canvas.clientHeight}, color, null);
}

function drawDottedDivider(x) {
    // draw dotted divider
    ctx.strokeStyle = 'yellow';
    ctx.beginPath();
    ctx.setLineDash([5, 10]);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    // reset
    ctx.setLineDash([]);
}

export function visualizeSectorSmallest(pair1, pair2) {
    return new Promise(resolve => {
        clear();
    }, RATE);
}

export function drawClosestPair (points, closestPair) {
    clear();
    drawVertices(points, undefined, false);
    drawEdge(closestPair.p1, closestPair.p2, closestPairColor);   
}

