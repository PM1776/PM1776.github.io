import { renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, GRAD_BY_X, GRAD_BY_Y } from '../graphView.js';

var canvas = document.getElementById('graphView');
var ctx = canvas.getContext('2d');

var moved;

function mergeSortRangeAndSwap (points, axis, rangeBegin, rangeEnd, rangeColor, changeColor) {

    let colors = new Array(points.length).fill(rangeColor, rangeBegin, rangeEnd + 1);

    // var gap = (axis === 'y') ? 
    //         canvas.clientHeight / points.length : 
    //         canvas.clientWidth / points.length;

    // colors = colors.map((val, i) => {
    //     let target = Math.floor((i + 1) * gap - gap / 2);
    //     let axisDif = Object.getOwnPropertyDescriptor(points[i], axis).value - target;
    //     return (axisDif) ? changeColor : rangeColor;
    // });

    return new alignToEvenSpacing(points, axis, true, 2, .1, 500, colors, false);
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
 */
function alignToEvenSpacing(points, axis = 'y', targets = true, speed = 2, overlaySpeed = 0.1, finishDelay = 1000,
        colors = [], clear = true) {

    return new Promise(resolve => {
        moved = new Array(points.length).fill(false, 0, points.length);

        var gap = undefined;
        if (targets === true) {
            gap = (axis === 'y') ? 
                canvas.clientHeight / points.length : 
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
                    Math.floor((i + 1) * gap - gap / 2); // determines target by the evenly spaced method

                let color = (colors[i]) ? colors[i] : '0, 0, 0';

                moveVertexToTarget(points[i], target, speed, axis, color);
            }

            console.log(aligned());
            if (!aligned()) {
                window.requestAnimationFrame(align);
            } else {
                // calls the finished listeners after a finishing delay
                if (!this.delayed) this.delayed = Date.now();
                console.log(Date.now() - this.delayed);
                console.log(this);

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
    // var changed = true;

    // no change
    // if (Math.floor(axisVal) === target) {
    //     changed = false;
    // }

    if (axisVal < target) {
        axisVal = (axisVal + speed > target) ? target : axisVal + speed;
    } else if (axisVal > target) {
        axisVal = (axisVal - speed < target) ? target : axisVal - speed;
    }
    Object.defineProperty(vertex, axis, {value: axisVal});
    
    let color = (changeColor) ? changeColor : "0, 0, 0";
    drawVertex(vertex, 'rgb(' + color + ', .5)', GRAD_BY_X);

    if (axisVal === target) {
        moved[vertex.name] = true;
    }
}

const aligned = () => moved.every((val) => val);

function hexToRGB(h) {
    let r = 0, g = 0, b = 0;
  
    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
  
    // 6 digits
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    
    return "rgb("+ +r + "," + +g + "," + +b + ")";
  }

export { mergeSortRangeAndSwap, alignToEvenSpacing, aligned };