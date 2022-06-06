import { alignToEvenSpacing, mergeSortRangeAndSwap, linesOnAxis, fadeFromSorted, fade } from '../animations/sortingAnim.js';
import { GRAD_BY_X, GRAD_BY_Y, drawVertices, drawGraph } from '../graph/graphView.js';
import Graph from '../graph/graph.js';

var axis;
var oppAxis;

/**
 * Sorts an array by the int value of the specified axis, overriding the other axis to display ordering.
 * 
 * @param {*} list the array to sort
 * @param {*} axis the axis of the array objects to compare ('x' or 'y' property)
 */
export async function mergeSort(graph, theAxis) {
    if (!theAxis) {
        throw new TypeError("Must specify an axis of the array objects to compare ('x' or 'y').");
    }

    if (!(graph instanceof Graph && graph.isDisplayable())) {
        throw new TypeError("Every object must have 'x' and 'y' co-ordinate properties.");
    }
    
    axis = theAxis;
    oppAxis = (axis === 'x') ? 'y' : 'x';

    const list = graph.getVertices();
    const GRAD = (axis === 'x') ? GRAD_BY_X : GRAD_BY_Y;
    
    if (axis === 'x') {
        list.sort((a, b) => a.y - b.y);
    } else {
        list.sort((a, b) => a.x - b.x);
    }

    await fade(() => drawGraph(graph, false, false),
               () => drawVertices(list, GRAD, false), .014, 150);

    await new alignToEvenSpacing(list, oppAxis, undefined, 1.05, undefined, 1500, undefined, false);

    await divide(0, list.length - 1, list);
    await new Promise(resolve => {
        setTimeout(async () => {
            await fadeFromSorted(graph, list, axis);
            resolve();
        }, 2500);
    });
}

async function divide(low, high, list) {
    if (high - low != 0) {
        let lowIndex = low;
        let highIndex = 0|(low + (high - low) / 2);
        await divide(lowIndex, highIndex, list);
        
        let lowIndex2 = highIndex + 1;
        let highIndex2 = high;
        await divide(lowIndex2, highIndex2, list);
        
        await new Promise(resolve => resolve(conquer(lowIndex, highIndex, lowIndex2, highIndex2, list)));
        
        await mergeSortRangeAndSwap(list, oppAxis, low, high);
    }
}

function conquer(low1, high1, low2, high2, list) {

    let listIndex = low1;
    let temp = new Array(high2 - low1 + 1);
    let tempIndex = 0;

    while (low1 <= high1 && low2 <= high2) {
        if (Object.getOwnPropertyDescriptor(list[low1], axis).value <
            Object.getOwnPropertyDescriptor(list[low2], axis).value) {
            temp[tempIndex++] = list[low1++];
        } else {
            temp[tempIndex++] = list[low2++];
        }
    }

    while (low1 <= high1) {
        temp[tempIndex++] = list[low1++];
    }
    while (low2 <= high2) {
        temp[tempIndex++] = list[low2++];
        
    }

    for (let i = 0; i < temp.length; i++) {
        list[listIndex++] = temp[i];
    }
}