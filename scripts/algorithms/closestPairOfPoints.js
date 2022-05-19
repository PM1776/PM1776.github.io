import { drawRange, compareSectors, mergeSectors, visualizeBruteCompare, visualizeBruteCloser, drawClosestPair } from '../animations/closestPairAnim.js';
import { drawEdge } from '../graphView.js';

/**
 * Returns the closest pair of a list of objects with 'x' and 'y' properties as an array.
 * 
 * @param {*} list the array of points with 'x' and 'y' properties of which to determine the closest pair.
 * @returns  an array of the closest two objects by co-ordinates.
 */
async function findClosestPairIn (list) {

    if (!list.every((point) => point.hasOwnProperty('x') && point.hasOwnProperty('y'))) {
        throw new TypeError("Every object must have an 'x' and a 'y' property.");
    }
    
    var sortedByX = [...list].sort((p1, p2) => p1.x - p2.x);
    var sortedByY = [...list].sort((p1, p2) => p1.y - p2.y);

    let closestPair = await divide(sortedByX, 0, sortedByX.length - 1, sortedByY);

    drawClosestPair(sortedByX, closestPair);

    return [closestPair.p1, closestPair.p2];
}

async function divide (sortedByX, low, high, sortedByY) {
    if (high - low <= 3) {
        return await bruteForce(sortedByX.slice(low, high + 1), sortedByX, low, high);
    } else {
        let low1 = low;
        let high1 = 0|(low + (high - low) / 2);
        let pair1 = await divide(sortedByX, low1, high1, sortedByY);

        let low2 = high1 + 1;
        let high2 = high;
        let pair2 = await divide(sortedByX, low2, high2, sortedByY);

        let closestPair = (pair1.getDistance() < pair2.getDistance()) ? pair1 : pair2;
        await compareSectors(sortedByX, pair1, pair2, closestPair, low, high);

        let closestAfterMerge = await conquer(closestPair, sortedByX, low, high, sortedByY);
        await mergeSectors(sortedByX, closestPair, closestAfterMerge);

        return closestAfterMerge;
    }
}

async function conquer (pair, sortedByX, low, high, sortedByY) {
    let midIndex = 0|(low + (high - low) / 2);
    let midX = sortedByX[midIndex].x;

    drawRange(midX, pair.dist);

    let stripL = [];
    let stripR = [];

    // creates stripR and stripL
    for (let p of sortedByY) {
        // on left, but still within smallest distance
        if (p.x <= midX && p.x >= midX - pair.getDistance()) {
            stripL.push(p);
        // on right, still within
        } else if (p.x > midX && p.x <= midX + pair.getDistance()) {
            stripR.push(p);
        }
    }

    let rI = 0; // strip right index
    for (let lp of stripL) {
        while (rI < stripR.length && stripR[rI].y <= lp.y - pair.getDistance()) {
            rI++;
        }

        let fromRI = rI;
        while (fromRI < stripR.length && +(stripR[fromRI].y - lp.y) <= pair.getDistance()) {
            // within the box of sides of smallest distance, checks if new closest pair
            if (distance(lp, stripR[fromRI]) < pair.getDistance()) {
                pair = new Pair(lp, stripR[fromRI]);
            }

            fromRI++;
        }
    }

    return pair;
}

async function bruteForce (points, sortedByX, low, high) {
    let closestPair = new Pair(points[0], points[1]);
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {

            await visualizeBruteCompare(sortedByX, closestPair, points[i], points[j], low, high);

            if (distance(points[i], points[j]) < closestPair.getDistance()) {
                closestPair = new Pair(points[i], points[j]);
            }

            await visualizeBruteCloser(sortedByX, closestPair, low, high);
        }
    }
    
    return closestPair;
}

function distance(p1, p2) {
    let xParen = (p2.x - p1.x) * (p2.x - p1.x);
    let yParen = (p2.y - p1.y) * (p2.y - p1.y);
    return Math.sqrt(xParen + yParen);
}

class Pair {

    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.dist = this.distance(this.p1, this.p2);
    }

    distance = distance;

    getDistance() {
        return this.dist;
    }
}

export { findClosestPairIn };