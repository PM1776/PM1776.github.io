import { Graph } from '../graph/graph.js';
import { Point } from '../graph/point.js';
import { isColor } from './utility.js';

/**
 * Throws an error if the parameter passed in is not a {@link Graph} object.
 * 
 * @param {*} graph the object to check.
 * @returns true if a {@link Graph} and false if otherwise.
 */
 export function checkIfGraph (graph) {
    if (graph instanceof Graph) {
        return true;
    } else if (graph === undefined) {
        graph = new Graph();
        console.log("graph in GraphView was undefined");
        return false;
    } else {
        throw new TypeError("Cannot display anything other then a Graph object");
    }
}

/**
 * Throws an error if the object does not hold property values with {@link Point} properties. The 
 * error thrown names the property key, which is the reason the checked objects are wrapped in the object.
 * 
 * @param {*} obj the object with property values to check if possessing {@link Point} property values 
 * (i.e. { point }).
 */
export function checkIfPoints (obj) {
    for (const o in obj) {
        if (!Point.hasPointProperties(obj[o])) {
            throw new TypeError("'" + o + "' must be an object with 'x', 'y', and 'name' properties.");
        }
    }
}

/**
 * Throws an error if an array does not contain entirely {@link Point} objects.
 * 
 * @param {*} vertices The array to check.
 */
 export function checkIfArrayOfPoints (vertices) {
    if (!vertices.every(o => Point.hasPointProperties(o))) {
        throw new TypeError("the array of 'vertices' must contain types of 'Point' objects.");
    }
}

/**
 * Throws an error if the object does not hold property values with 'x' and 'y' properties. The 
 * error thrown names the property key, which is the reason the checked objects are wrapped in the object.
 * 
 * @param {*} obj the object with property values to check if possessing {@link Point} property values 
 * (i.e. { point }).
 */
 export function checkIfXYProp (obj) {
    for (const o in obj) {
        if (!(obj[o].hasOwnProperty('x') && obj[o].hasOwnProperty('y'))) {
            throw new TypeError("'" + o + "' must be an object with 'x', 'y', and 'name' properties.");
        }
    }
}

/**
 * Throws an error if the object does not hold properties with values that are Strings of CSS colors. The 
 * error thrown names the property key, which is checked objects are wrapped in an object.
 * 
 * @param {*} obj an object with property values to check (i.e. { someColor }).
 */
export function checkIfColors (obj) {
    for (const o in obj) {
        if (!isColor(obj[o])) {
            throw new TypeError("'" + o + "' must be a string of a CSS formatted color.");
        }
    }
}

/**
 * Throws an error if the object does not hold properties with values that are Strings. The 
 * error thrown names the property key, which is checked objects are wrapped in an object.
 * 
 * @param {*} obj an object with property values to check (i.e. { font });
 */
export function checkIfFont (obj) {
    for (const o in obj) {
        if (!(typeof obj[o] == 'string')) {
            throw new TypeError("'" + o + "' must be a String of a font format.");
        }
    }
}

/**
 * Throws an error if the object does not hold properties with values that are Numbers. The 
 * error thrown names the property key, which is checked objects are wrapped in an object.
 * 
 * @param {*} obj an object with property values to check (i.e. { font });
 */
export function checkIfNumbers(obj) {
    for (const o in obj) {
        if (!(typeof obj[o] == 'number')) {
            throw new TypeError("'" + o + "' must be a Number.");
        }
    }
}

/**
 * Throws an error if the object does not hold properties with values that are Strings. The 
 * error thrown names the property key, which is checked objects are wrapped in an object.
 * 
 * @param {*} obj an object with property values to check (i.e. { str });
 */
 export function checkIfString (obj) {
    for (const o in obj) {
        if (!(typeof obj[o] == 'string')) {
            throw new TypeError("'" + o + "' must be a String type.");
        }
    }
}

/**
 * Throws an error if the object does not hold properties with values that are functions. The 
 * error thrown names the property key, which is checked objects are wrapped in an object.
 * 
 * @param {*} obj an object with property values to check (i.e. { str });
 */
 export function checkIfFuncs (obj) {
    for (const o in obj) {
        if (!(typeof obj[o] == 'function')) {
            throw new TypeError("'" + o + "' must be a String type.");
        }
    }
}