import { TEXT_ABOVE_VERTEX, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, GRAD_BY_X, GRAD_BY_Y, drawVertices, clear, view,
    GradObject } from '../graph/graphView.js';

var canvas = document.getElementById('graphView');
var ctx = canvas.getContext('2d');

var rangeColor = '144, 238, 144';

var moved;

function mergeSortRangeAndSwap (points, axis, rangeBegin, rangeEnd) {

    let colors = new Array(points.length).fill(rangeColor, rangeBegin, rangeEnd + 1);
    let speed = (axis == 'y') ? 4 : 2.5;

    return new alignToEvenSpacing(points, axis, true, speed, .1, 500, colors, false);
}

/**
 * Animates moving an array of points with 'x' and 'y' properties to targeted 'x' or 'y'
 * cordinates. The targets can be specified in an associating array of the 2nd parameter
 * 
 * @param {*} points an array of points to animate with 'x' and 'y' properties.
 * @param {*} axis the axis string of 'x' or 'y' on which to traverse to the target co-ordinate.
 * @param {*} targets either an array of target co-ordinates of associating indices to the point array,
 *      or a boolean value of true indicating to space them evenly along the axis.
 * @param {*} speed the speed at which to move the points
 * @param {*} overlaySpeed a value between 0 and 1 that specifies how quickly to draw the background overlay color.
 *      This essentially determines the trailing effect speed of items drawn.
 * @param {*} colors an array of rgb values in the format of "-, -, -", assiciating with point indices,
 *      to color the points.
 * @param {*} clear boolean value to clear #graphView prior to animation, with default to true.
 */
function alignToEvenSpacing(points, axis = 'y', targets = true, speed = 2, overlaySpeed = 0.1, finishDelay = 1000,
        colors = [], clear = true) {

    return new Promise(resolve => {
        moved = new Array(points.length).fill(false, 0, points.length);

        var gap = undefined;
        if (targets === true) {
            gap = (axis === 'y') ? 
                (canvas.clientHeight - TEXT_ABOVE_VERTEX + 12) / points.length: 
                canvas.clientWidth / points.length;
        }

        this.delayed = 0;
        
        if (clear) ctx.clearRect(0, 0, canvas.width, canvas.height);

        const align = async () => {

            // slowly overlays the background layer on drawn objects to allow a trailing effect
            ctx.fillStyle = "rgb(255, 255, 255, " + overlaySpeed + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // moves the points closer to their target
            for (var i = 0; i < points.length; i++) {
                let target = (Array.isArray(targets)) ? 
                    targets[i] : // target has been specified
                    TEXT_ABOVE_VERTEX - 12 + Math.floor((i + 1) * gap - gap / 2); // determines target by the evenly spaced method

                let color = (colors[i]) ? colors[i] : '0, 0, 0';

                moveVertexToTarget(points[i], target, speed, axis, color);

                if (Object.getOwnPropertyDescriptor(points[i], axis).value === target) {
                    moved[i] = true;
                }
            }

            if (!aligned()) {
                window.requestAnimationFrame(align);
            } else {
                if (!this.delayed) this.delayed = Date.now();

                if ((Date.now() - this.delayed) <= finishDelay) {
                    window.requestAnimationFrame(align);
                } else {
                    resolve();
                }
            }
        };
        requestAnimationFrame(align);
    });
}

function moveVertexToTarget(vertex, target, speed, axis, changeColor) {
    // moves the vertex closer to the evenly split y target point
    var axisVal = Object.getOwnPropertyDescriptor(vertex, axis).value;

    if (axisVal < target) {
        axisVal = (axisVal + speed > target) ? target : axisVal + speed;
    } else if (axisVal > target) {
        axisVal = (axisVal - speed < target) ? target : axisVal - speed;
    }
    Object.defineProperty(vertex, axis, {value: axisVal});
    
    let color = (changeColor) ? changeColor : "0, 0, 0";
    const GRAD = (axis === 'y') ? GRAD_BY_X : GRAD_BY_Y;
    drawVertex(vertex, 'rgb(' + color + ', .5)', new GradObject(GRAD, null, null, 'rgb(' + color + ', .5)'), true);
}

const aligned = () => moved.every((val) => val);

function linesOnAxis (points, axis) {
    for (let point of points) {
        if (axis === 'x') {
            drawEdge({x: point.x, y: 0}, {x: point.x, y: canvas.height}, 'black', null, 1);
        } else {
            drawEdge({x: 0, y: point.y}, {x: canvas.width, y: point.y}, 'black', null, 1);
        }
    }
} 

/**
 * Fades from a function which perhaps draws on #graphView into another function at an overlaying speed.
 * 
 * @param {*} funcFrom the function to fade from.
 * @param {*} funcInto the function to fade into.
 * @param {*} overlaySpeed the speed to fade into or out of.
 */
function fade(funcFrom, funcInto, overlaySpeed, finishWait = 0) {

    return new Promise(resolve => {

        let fromOverlay = 1;
        let intoOverlay = 0;
        let delayed = 0;

        const transition = async () => {

            fromOverlay -= overlaySpeed;
            intoOverlay = 1 - fromOverlay;

            // paints the function with the lowest opacity first to be overlayed more
            if (Math.min(fromOverlay, intoOverlay) == intoOverlay) {
                funcInto();
            } else {
                funcFrom();
            }

            // overlays background color opacity of the greatest to be laid minus the lesser
            let deductedOpacity = Math.max(fromOverlay, intoOverlay) - Math.min(fromOverlay, intoOverlay);
            ctx.fillStyle = "rgb(255, 255, 255, " + deductedOpacity + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // higher opacity function
            if (Math.min(fromOverlay, intoOverlay) == intoOverlay) {
                funcFrom();
            } else {
                funcInto();
            }

            // finishes overlaying the lesser opacity
            ctx.fillStyle = "rgb(255, 255, 255, " + Math.min(fromOverlay, intoOverlay) + ")";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            //Math.abs(overlaySpeed) >= Number.EPSILON;
            if (parseFloat(fromOverlay - 1) > -1) {
                requestAnimationFrame(transition);
            } else {
                if (!delayed) delayed = Date.now();

                if (Date.now() - delayed >= finishWait) {
                    resolve();
                } else {
                    requestAnimationFrame(transition);
                }
            }
        };
        requestAnimationFrame(transition);
    });
}

function fadeFromSorted (graph, sortedPoints, axis) {

    var GRAD = (axis == 'y') ? GRAD_BY_X : GRAD_BY_Y;

    const fadeFrom = () => {
        // Drawing gradient from sorted point to original point: O(n logn)
        for (let vertex of graph.getVertices()) {
            // binary search
            let vAxisVal = Object.getOwnPropertyDescriptor(vertex, axis).value;
            let low = 0, high = sortedPoints.length, mid = high / 2;
            while (high >= low) {
                if (Object.getOwnPropertyDescriptor(sortedPoints[mid], axis).value > vAxisVal) {
                    high = mid - 1;
                    mid = 0|(low + (high - low) / 2);
                } else if (Object.getOwnPropertyDescriptor(sortedPoints[mid], axis).value < vAxisVal) {
                    low = mid + 1;
                    mid = 0|(low + (high - low) / 2);
                } else {
                    high = low - 1;
                    let oppAxisVal = Object.getOwnPropertyDescriptor(sortedPoints[mid], (axis == 'y') ? 'x' : 'y').value;
                    let gradObject = new GradObject(GRAD, oppAxisVal, undefined, 'rgb(' + rangeColor + ')');
                    drawVertex(vertex, undefined, gradObject, true);
                    drawVertex(sortedPoints[mid], 'rgb(' + rangeColor + ')', undefined, true);
                }
            }
        }
        //drawVertices(sortedPoints, axis, true, 'rgb(' + rangeColor + ', 255)');
    }, fadeTo = () => {
        drawGraph(graph, false);
    };

    return fade(fadeFrom, fadeTo, .005); //.008
}

export { mergeSortRangeAndSwap, alignToEvenSpacing, aligned, linesOnAxis, fadeFromSorted, fade };