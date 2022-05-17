import { mergeSortRangeAndSwap } from '../animations/sortingAnim.js';
import { GRAD_BY_X, GRAD_BY_Y, drawVertices } from '../graphView.js';

var axis;
var oppAxis;

const canvas = document.getElementById('graphView');

/**
 * Sorts an array by the int value of the specified axis, overriding the other axis to display ordering.
 * 
 * @param {*} list the array to sort
 * @param {*} axis the axis of the array objects to compare ('x' or 'y' property)
 */
export async function mergeSort(list, theAxis) {
    if (!theAxis) {
        throw new TypeError("Must specify an axis of the array objects to compare ('x' or 'y').");
    }

    if (!list.every((val) => Object.hasOwn(val, theAxis))) {
        throw new TypeError("Every object must have the axis to compare.");
    }
    
    axis = theAxis;
    oppAxis = (axis === 'x') ? 'y' : 'x';

    await divide(0, list.length - 1, list);
    const GRAD = (axis === 'x') ? GRAD_BY_X : GRAD_BY_Y;
    setTimeout(() => drawVertices(list, GRAD, true), 1500);
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
        
        await mergeSortRangeAndSwap(list, oppAxis, low, high, '0, 255, 0', '0, 255, 0');
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