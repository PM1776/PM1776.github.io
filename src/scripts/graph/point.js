/**
 * An object that holds 'x', 'y', and 'name' properties.
 */
 export class Point {

    x = 0;
    y = 0;
    name = null;

    /**
     * Can take up to three arguments: two arguments to set the 'x' and 'y' properties, and three
     * to set the 'x,' 'y,' and 'name' properties.
     * 
     * @param {*} x Typically the 'x' co-ordinate on a plane.
     * @param {*} y Typically the 'y' co-ordinate on a plane.
     * @param {*} name A name for the point on the plane.
     */
    constructor (x, y, name) {
        if (arguments.length == 2) {
            this.x = x;
            this.y = y;
        } else if (arguments.length == 3) {
            this.x = x;
            this.y = y;
            this.name = name;
        }
    }

    /**
    * Checks if the object is a {@link Point} object purely based on having declared the Point properties.
    * 
    * @param {*} o the Object to check.
    * @returns true if so, and false otherwise.
    */
    static hasPointProperties (o) {
        if (o.hasOwnProperty('name') && o.hasOwnProperty('x') && o.hasOwnProperty('y')) return true;
        return false;
    }
    
    /**
     * Checks if the array of objects are {@link Point} objects purely based on their declaring the Point properties.
     * 
     * @param {*} objs the array of Objects to check.
     * @returns true if so, and false otherwise.
     */
    static arePoints (...objs) {
        return objs.every(o => checkIfPoints({ o }));
    }
}