class TwoEqualsMap extends Map {

    constructor () {
        super();
        this.map = new Map();
    }

    get(key) {
        return function () {
            if (this.map.has(key)) {
                return this.map.get(JSON.stringify(key));
            }
        }
    }
    set(key, value) {
        return this.map.set(JSON.stringify(key), value);
    }
    has(key) {
        return this.map.has(JSON.stringify(key));
    }
}

export class Graph {

    #neighbors;
    
    /**
     * Constructs a graph from no parameters, only vertices, or vertices and edges.
     * @param {*} vertices An array of objects to use as vertices. If these objects contain the properties
     *      'name,' 'x,' and 'y,' they will be able to be displayed using the GraphView class.
     * @param {*} edges An array of arrays that contain the two indices of the vertices that 
     *      have an incident edge.
     */
    constructor(vertices, edges) {
    
        this.neighbors = new Map();
        // this.neighbors = new Proxy(new Map(), {
        //     get(map, key) {
        //         return function () {
        //             if (map.has(map, key)) {
        //                 return map.get(JSON.stringify(key));
        //             }
        //         }
        //     },
        //     set(map, key, value) {
        //         return function () {
        //             return map.set(JSON.stringify(key), value);
        //         }
        //     },
        //     has(map, key) {
        //         return map.has(JSON.stringify(key));
        //     }
        // });
        // this.neighbors.set("key", "val");

        // Adds vertices if passed in
        if (vertices != undefined) {
            this.addVertices(vertices);
        }

        // Adds edges if passed in
        if (edges != undefined) {
            this.addEdges(edges);
        }
    }

    /**
     * 
     * @param {*} v the (relative) index of a vertex within neighbors.keys(), whose value is determined by
     *      the order elements were inserted and flunctuates on the deletion of previously inserted keys.
     * @returns the vertex at the relative index within neighbors.keys()
     */
    vertexAt(i) {
        if (i < 0 || i >= this.neighbors.keys().length) {
            throw new TypeError("i must be within the size of total vertices");
        }

        let count = 0;
        for (let key of this.neighbors.keys()) {
            if (count === i) {
                return key;
            }
            count++;
        }

        return null;
    }

    indexOf(v) {
        let count = 0;
        for (let key of this.neighbors.keys()) {
            if (key === v) {
                return count;
            }
            count++;
        }

        return -1;
    }

    addVertex(v) {
        this.neighbors.set(v, []);
    }

    addVertices (vertices) {
        if (!(Array.isArray(vertices))) {
            throw new TypeError("param 'vertices' must be an Array of vertices with 'x' and 'y' properties.");
        } else {
            for (let vertex of vertices) {
                this.addVertex(vertex);
            }
        }
    }

    /**
     * Adds an edge to the graph, passing either the vertices themselves or the relative 
     * indices to the vertices.
     * 
     * @param {*} u the first vertex of the edge, or the relative index to the vertex.
     * @param {*} v the second vertex, or the relative index to the vertex.
     * @returns true if the insertion was a success and false if not.
     */
    addEdge(u, v) {

        // adding by element
        if (isNaN(u) && isNaN(v)) {

            if (this.neighbors.has(u)) {
                this.neighbors.get(u).push(v);
                this.neighbors.get(v).push(u);
                return true;
            }

        // adding by relative index
        } else { 
            if (u < 0 || u >= this.neighbors.size) {
                console.log("couldn't add 'u' " + u +": index out of bounds");
                return -1;
            }
            if (v < 0 || v >= this.neighbors.size) {
                console.log("couldn't add 'v': index out of bounds");
                return -1;
            }

            let v1 = this.vertexAt(u);
            let v2 = this.vertexAt(v);

            this.neighbors.get(v1).push(v2);
            this.neighbors.get(v2).push(v1);

            return true;
        }

        return false;
    }

    addEdges (edges) {
        if (!(Array.isArray(edges))) {
            throw new TypeError("param \'edges\' must be an Array.");
        } else {
            for (let edge of edges) {
                if (Array.isArray(edge)) {
                    this.addEdge(edge[0], edge[1]);
                } else {
                    this.addEdge(edge.u, edge.v);
                }
            }
        }
    }

    /**
     * Removes a vertex from the graph by a parameter of either the vertex itself or the 
     * relative index of the vertex.
     * 
     * @param {*} v The vertex or index of the vertex to remove.
     * @returns true if the element was successfully removed and false if not.
     */
    removeVertex(v) {

        let vertex = (isNaN(v)) ? v : this.vertexAt(v);

        if (!(this.neighbors.has(v))) {
            throw new TypeError("v must be a vertex in the graph or an index to one.")
        }

        var found = false;
        for (let edges of this.neighbors.get(vertex)) {

            let neighborsEdges = this.neighbors.get(edges);
            for (let i = 0; i < neighborsEdges.length; i++) {
                if (neighborsEdges[i] == vertex) {
                    found = true;
                }
                if (found) {
                    neighborsEdges[i] = neighborsEdges[i + 1];
                }
            }

            neighborsEdges.length = neighborsEdges.length - 1;
            found = false;
        }

        this.neighbors.delete(vertex);
        
        return true;
    }

    /**
     * Removes an edge from the graph.
     * @param {*} u the first index of the vertex the edge is to incident to.
     * @param {*} v the second index the edge is to incident to.
     * @returns true if successfully removed and false if not.
     */
    removeEdge(u, v) {

        let v1 = u;
        let v2 = v;

        // remove by relative index of insertion order
        if (typeof u == 'number' && typeof v == 'number') {
            if (u < 0 || u >= this.neighbors.size) {
                console.log("u cannot be removed because it does not exist.");
            }
            if (v < 0 || v >= this.neighbors.size) {
                console.log("v cannot be removed because it does not exist.");
            }

            v1 = this.vertexAt(u);
            v2 = this.vertexAt(v);
        }

        if (this.neighbors.has(v1) && this.neighbors.has(v2)) {

            let edges = this.neighbors.get(v1);
            for (var i = edges.length; i >=0; i--) { 
                if (edges[i] === v2) {
                    edges[i].splice(i, i);
                }
            }
            return true;
        }

        return false;
    }

    getVertices () {
        return JSON.parse(JSON.stringify([...this.neighbors.keys()]));
    }

    getNeighbors () {
        return this.neighbors;
        //return new Map(JSON.parse(JSON.stringify([...this.neighbors])));
    }

    getSize() {
        return this.neighbors.keys().length;
    }

    isDisplayable () {
        return this.getVertices().every((val) => 'x' in val && 'y' in val && 'name' in val);
    }

    /** 
     * An alternative has() method for the this.neighbors Map, in place due to object keys in a Map requiring 
     * the exact reference. I believe a Proxy could work over the
     * get, set, and has methods and inputing them as strigified objects, but I don't seem to understand much
     * at all about them.
     * 
     * @param v the vertex to check if in the graph. Alternatively, can pass in a name and search by that.
     * @returns the vertex in the graph.
     */
    hasVertex(v) {

        for (let [vertex, neighs] of this.neighbors) {
            if (typeof v === 'string') {
                if (vertex.name.normalize() === v.normalize()) {
                    return vertex;
                }
            } else {
                if (JSON.stringify(v) === JSON.stringify(vertex)) {
                    return vertex;
                }
            }
        }

        return null;
    }

    hasVertexInRadius (point, radius) {
        for (let [v, neighs] of this.neighbors) {
            let vDistance = Math.sqrt((point.x - v.x) * (point.x - v.x) + (point.y - v.y) * (point.y - v.y));
            if (vDistance <= radius) {
                return v;
            }
        }

        return null;
    }

    print() {
        var i = 0;
        this.neighbors.forEach((edges, vertex) => {
            let edgesString = (edges.length == 0) ? "-" : edges.reduce((prev, curr) => prev.name + ", " + curr.name);
            console.log("vertex[" + vertex.name + "]: x: " + vertex.x + ", y: " + vertex.y + " -> " + edgesString);
            i++;
        });
    }

    dfs(v) {
        if (typeof v == 'number') {
            v = this.vertexAt(v);
        }
        if (v == null) {
            throw new TypeError("Must pass in a vertex or an index to a vertex to search the graph.");
        }

        var visited = {};
        var searchOrder = [];
        var parent = {};

        this.dfsRecursive(v, parent, searchOrder, visited);

        return new SearchTree(v, parent, searchOrder);
    }

    dfsRecursive(vertex, parent, searchOrder, visited) {
        searchOrder.push(vertex);
        visited[JSON.stringify(vertex)] = true;

        let neighbors = this.neighbors.get(vertex);

        for (let neighbor of neighbors) {
            if (!visited[JSON.stringify(neighbor)]) {
                parent[JSON.stringify(neighbor)] = JSON.stringify(vertex);
                this.dfsRecursive(neighbor, parent, searchOrder, visited);
            }
        }
    }

    bfs(v) {
        if (typeof v == 'number') {
            v = this.vertexAt(v);
        }
        if (v == null) {
            throw new TypeError("Must pass in a vertex or an index to a vertex to search the graph.");
        }

        var searchOrder = [];
        var parents = {};
        var queue = [v];
        var visited = {};
        visited[JSON.stringify(queue[0])] = true;
        
        while (queue.length != 0) {
            let u = queue.shift();
            let neighbors = this.neighbors.get(u);

            for (let neighbor of neighbors) {
                if (!visited[JSON.stringify(neighbor)]) {
                    searchOrder.push(neighbor);
                    queue.push(neighbor);
                    parents[JSON.stringify(neighbor)] = JSON.stringify(u);
                    visited[JSON.stringify(neighbor)] = true;
                }
            }
        }

        return new SearchTree(v, parents, searchOrder);
    }
}

class SearchTree {
    root;
    parents;
    searchOrder;

    /**
     * Takes in the root object, array of parents determined in the search, and the order of vertices searched
     * in an array.
     * 
     * @param {*} root 
     * @param {*} parent 
     * @param {*} searchOrder 
     */
    constructor(root, parents, searchOrder) {
        this.root = root;
        this.parents = parents;
        this.searchOrder = searchOrder;
    }

    /**
     * @returns the root vertex.
     */
    getRoot() {
        return JSON.parse(JSON.stringify(this.root));
    }

    /**
     * @returns stringified versions of both the vertex (property) and the parent of that vertex (value).
     */
    getParents() {
        return this.parents;
    }

    /**
     * @returns the number of vertices traversed during the search.
     */
    getNumberOfVerticesFound() {
        return this.searchOrder.length;
    }

    /**
     * 
     * @param {*} vertex the vertex to begin the search
     * @returns 
     */
    getPath(vertex) {

        if (typeof vertex != 'string') {
            vertex = JSON.stringify(vertex);
        }
        let path = [];

        do {
            path.push(vertex);
            vertex = this.parents[vertex];
        } while (this.parents[vertex] != null);

        return path;
    }

    printTree () {
        console.log("Root: " + this.root);
        console.log("Edges: ");

        for (let vertex in this.parents) {
            console.log("(" + this.parents[vertex] + ", " + vertex + ")");
        }
    }
}

export default Graph;
export { SearchTree };