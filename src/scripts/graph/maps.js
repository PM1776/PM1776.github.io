import Graph from "./graph.js";
import { DPR } from "./graphView.js";

let canvas = document.getElementById('graphView');

export function loadUSGraph() {
    return loadGraphMap("us");
}

export function loadBinaryGraph() {
    return loadGraphMap("binary");
}

/**
 * Loads a new {@link Graph} object from some pre-made maps of vertices and edges.
 * 
 * @param {String} mapName The name of the map to load - "us", or "binary".
 * @returns A new {@link Graph} object created from the map data.
 */
export function loadGraphMap(mapName) {
    // Adds a portion of the map of the US and connecting some near-by points as edges to the graph.
    let mapWidth, mapHeight, scale, vertices, edges;

    switch (mapName.toLowerCase()) {
        case "us":
            scale = Math.min(canvas.width / ((mapWidth = 780) * DPR), canvas.height / ((mapHeight = 430) * DPR));

            vertices = [
                {name: "Seattle", x: 125, y: 60},
                {name: "San Francisco", x: 100, y: 220},
                {name: "Los Angeles", x:128, y:285},
                {name: "Denver", x:325, y:185},
                {name: "Kansas City", x:450, y:255},
                {name: "Chicago", x:500, y:110},
                {name: "Boston", x:728, y:90},
                {name: "New York", x:725, y:130},
                {name: "Atlanta", x:625, y:305},
                {name: "Miami", x:650, y:410},
                {name: "Dallas", x:458, y:335},
                {name: "Houston", x:495, y:370},
            ];

            edges = [
                [0, 1, 807], [0, 3, 1331], [0, 5, 2097], 
                [1, 2, 381], [1, 3, 1267],
                [2, 3, 1015], [2, 4, 1663], [2, 10, 1435],
                [3, 4, 599], [3, 5, 1003],
                [4, 5, 533], [4, 7, 1260], [4, 8, 864], [4, 10, 496],
                [5, 6, 983], [5, 7, 787],
                [6, 7, 214], 
                [7, 8, 888],
                [8, 9, 661], [8, 10, 781], [8, 11, 810],
                [9, 11, 1187],
                [10, 11, 239],
            ];
            break;
        case "binary":
            scale = Math.min(canvas.width / ((mapWidth = 680) * DPR), canvas.height / ((mapHeight = 380) * DPR));

            vertices = [
                {name: "43", x: 362, y: 34},
                {name: "19", x: 178, y: 107},
                {name: "15", x: 89, y: 184},
                {name: "17", x: 133, y: 258},
                {name: "23", x: 272, y: 185},
                {name: "21", x: 225, y: 258},
                {name: "25", x: 317, y: 259},
                {name: "34", x: 338, y: 335},
                {name: "84", x: 543, y: 108},
                {name: "48", x: 452, y: 185},
                {name: "64", x: 497, y: 258},
                {name: "62", x: 474, y: 335},
                {name: "91", x: 635, y: 184},
            ];

            edges = [
                [0, 1, 200], [0, 8, 200],
                [1, 2, 150], [1, 4, 150],
                [2, 3, 100],
                [4, 5, 100], [4, 6, 100],
                [6, 7, 50],
                [8, 9, 150], [8, 12, 150],
                [9, 10, 100],
                [10, 11, 50]
            ];
            break;

        default:
            throw new TypeError("No graph map to load with the name '" + mapName + "'");
    }
    

    // scales each point manually
    for (let i = 0; i < vertices.length; i++) {
        let x = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'x').value * scale);
        let y = Math.floor(Object.getOwnPropertyDescriptor(vertices[i], 'y').value * scale);
        x = Math.floor((canvas.width / 2) / DPR - (mapWidth * scale / 2) + x);
        y = Math.floor((canvas.height / 2) / DPR - (mapHeight * scale / 2) + y);
        Object.defineProperties(vertices[i], {x: {value: x}, y: {value: y}});
    }

    return new Graph(vertices, edges);
}