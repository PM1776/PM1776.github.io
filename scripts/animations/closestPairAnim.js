import { clear, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawVertices, drawEdge, drawGraph, GRAD_BY_X, GRAD_BY_Y } from '../graphView.js';

const canvas = document.getElementById('graphView');
const ctx = canvas.getContext('2d');

const closestPairColor = 'blue';
const comparingColor = 'green';
const loserColor = 'red';

const RATE = 750;

export function visualizeBruteCompare (points, closestPair, p1, p2, low, high) {
    return new Promise(resolve => {

        drawVertices(points, undefined, true);

        drawEdge(closestPair.p1, closestPair.p2, closestPairColor, );
        drawEdge(p1, p2, comparingColor);

        drawDividers(points[low].x, points[high].x);
        
        setTimeout(() => {
            clear();
            resolve();
        }, RATE);
    });
}

export function visualizeBruteCloser (points, closestPair, low, high) {
    return new Promise(resolve => {
        drawVertices(points, undefined, false);
        drawEdge(closestPair.p1, closestPair.p2, closestPairColor);

        drawDividers(points[low].x, points[high].x);

        setTimeout(() => {
            clear();
            resolve();
        }, RATE);
    });
}

export function compareSectors(points, pair1, pair2, closestPair, low, high) {
    return new Promise(resolve => {

        drawVertices(points, undefined, false);

        drawEdge(pair1.p1, pair1.p2, closestPairColor);
        drawEdge(pair2.p1, pair2.p2, closestPairColor);

        drawDividers(points[low].x, points[high].x);
        let midIndex = 0|(low + (high - low) / 2);
        drawDottedDivider(points[midIndex].x);

        setTimeout(() => {
            clear();
            drawVertices(points, undefined, false);

            drawEdge(closestPair.p1, closestPair.p2, closestPairColor);
            let loser = (closestPair === pair1) ? pair2 : pair1;
            drawEdge(loser.p1, loser.p2, loserColor);

            drawDividers(points[low].x, points[high].x);
            drawDottedDivider(points[midIndex].x);

            setTimeout(() => {
                resolve();
            }, RATE);

        }, RATE);
    });
}

export function mergeSectors(points, closestBefore, closestPair) {
    return new Promise(resolve => {

        drawVertices(points, undefined, false);

        drawEdge(closestBefore.p1, closestBefore.p2, closestPairColor);
        
        setTimeout(() => {
            drawVertices(points, undefined, true);
            drawEdge(closestPair.p1, closestPair.p2, closestPairColor);
            //
            setTimeout(() => {
                resolve();
            }, RATE);

        }, RATE);
    });
}

export function drawRange(midX, closestPairDist) {
    clear();
    drawDividers(midX - closestPairDist, midX + closestPairDist);
    drawDottedDivider(midX);
}

function drawDividers (beginningRange, endRange) {
    drawEdge({x: beginningRange, y: 0}, {x: beginningRange, y: canvas.clientHeight}, 'yellow', null);
    drawEdge({x: endRange, y: 0}, {x: endRange, y: canvas.clientHeight}, 'yellow', null);
}

function drawDottedDivider(x) {
    // draw dotted divider
    ctx.strokeStyle = 'red';
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

