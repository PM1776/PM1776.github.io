/**
 * TwoEqualsMap allows keys that are objects in the Map to be gotten (get()) by their 'name' value if not found 
 * by their object reference, and allows similar functionality for its has() function.
 */
class TwoEqualsMap extends Map {

    /** Searches for a value in the Map by firstly the key's reference value, then simply equaling 'name' 
     * property. It additionally gets a key's value by a String of the key's 'name' property.
     * 
     * @param key the key to retrieve its value, searching by type of the actual key, its 'name' property, or 
     * a String of the desired key's 'name' property.
     * @returns the value that was set to match the key.
     */
    get(key) {
        let get = super.get(key);
        if (get) return get;

        /* Searches for the vertex by its name property if not found, as JavaScript Maps set keys that are
         * objects to thier reference value. */
        let name = (typeof key === 'string') ? key : (key.hasOwnProperty('name')) ? key.name : null;

        if (!name) {
            throw new TypeError("The key must be an object with an equal 'name' property or the name " +
                "as a String.");
        }

        for (let [vertex, neighbors] of this) {
            if (name.toLowerCase() == String(vertex.name).toLowerCase()) {
                return neighbors;
            }
        }

        return [];
    }
    /** Checks if a key exists in the Map by its reference value, then simply by equaling 'name' property. It 
     * additionally can check by a String of the key's 'name' property.
     * 
     * @param key the key to check if existing in the Map, of type of either an object with equaling reference,
     * 'name' property, or a String of the desired key's 'name' property.
     * @returns the key, if found.
     */
    has(key) {

        let has = super.has(key);
        if (has) return has;

        let name = (typeof key === 'string') ? key : (key.hasOwnProperty('name')) ? key.name : null;

        if (!name) {
            throw new TypeError("The key must be an object with an equal 'name' property or the name " +
                "as a String.");
        }

        for (let [vertex, neighbors] of this) {
            if (name.toLowerCase() == String(vertex.name).toLowerCase()) {
                return vertex;
            }
        }
    }
}

export class Graph {
    
    /**
     * Constructs a graph from no parameters, only vertices, or vertices and edges.
     * @param {*} vertices An array of objects to use as vertices. If these objects contain the properties
     *      'name,' 'x,' and 'y,' they will be able to be displayed using the GraphView class.
     * @param {*} edges An array of arrays that contain the two indices of the vertices that 
     *      have an incident edge.
     */
    constructor(vertices, edges) {
    
        this.neighbors = new TwoEqualsMap();

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
     * Gets a vertex at the specified index.
     * 
     * @param {*} v the (relative) index of a vertex within neighbors.keys(), whose value is determined by
     *      the order elements were inserted and flunctuates on the deletion of previously inserted keys.
     * @returns the vertex at the relative index within neighbors.keys()
     */
    vertexAt(i) {
        if (i < 0 || i >= this.neighbors.keys().length) {
            throw new TypeError("Index " + i + " not within length of total vertices.");
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

    /**
     * Gets the index of the specified vertex.
     * 
     * @param {*} v the vertex to retrieve the index of.
     * @returns the index, if found, or -1 if not.
     */
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

    /**
     * Adds a vertex to the graph.
     * 
     * @param {*} v the vertex to add.
     */
    addVertex(v) {
        let vHandlers = {
            get(target, prop, receiver) {
                const prim = Reflect.get(target, 'value');
                const v = JSON.parse(prim);
                console.log(v + ", " + prop);
                //return typeof value === 'function' ? value.bind(prim) : value;
                if (prop == 'name' || prop == 'x' || prop == 'y') {
                    //console.log(JSON.parse(target)[prop]);
                    return v[prop];
                } else if (prop == 'value') {
                    return v;
                }
                return Reflect.get(target, prop, receiver);
            }
        };
        this.neighbors.set(v, []);
    }

    /**
     * Adds an array of vertice objects to the graph.
     * 
     * @param {*} vertices an array of the vertices to add.
     */
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
    addEdge(u, v, weight) {

        let edgeHandlers = {
            get(target, prop, receiver) {
                if (prop === 'v') {
                    return JSON.parse(target[prop]);
                }
                return Reflect.get(target, prop, receiver);
            }
        };

        // adding by element
        if (isNaN(u) && isNaN(v)) {

            if (this.neighbors.has(u)) {

                this.neighbors.get(u).push({v: v, weight: (weight) ? weight : null});
                this.neighbors.get(v).push({v: u, weight: (weight) ? weight : null});

                return true;
            }

        // adding by relative index
        } else { 
            if (u < 0 || u >= this.neighbors.size) {
                console.log("couldn't add 'u' " + u + ": index out of bounds");
                return -1;
            }
            if (v < 0 || v >= this.neighbors.size) {
                console.log("couldn't add 'v' " + v + ": index out of bounds");
                return -1;
            }

            let v1 = this.vertexAt(u);
            let v2 = this.vertexAt(v);

            this.neighbors.get(v1).push({v: v2, weight: (weight) ? weight : null});
            this.neighbors.get(v2).push({v: v1, weight: (weight) ? weight : null});

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
                    this.addEdge(edge[0], edge[1], (edge[2]) ? edge[2] : undefined);
                } else {
                    this.addEdge(edge.u, edge.v, (edge.weight) ? edge.weight : undefined);
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

            let neighborsEdges = this.neighbors.get(edges.v);
            for (let i = 0; i < neighborsEdges.length; i++) {
                if (neighborsEdges[i].v == vertex) {
                    found = true;
                }
                if (found && i != neighborsEdges.length - 1) {
                    neighborsEdges[i].v = neighborsEdges[i + 1].v;
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
            for (var i = edges.length; i >= 0; i--) { 
                if (edges[i].v === v2) {
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
        //return new TwoEqualsMap(JSON.parse(JSON.stringify([...this.neighbors])));
    }

    getSize() {
        return this.neighbors.size;
    }

    getWeight(u, v) {
        if (typeof u == 'number' && typeof v == 'number') {
            if (u < 0 || u >= this.neighbors.size) {
                console.log("Cannot get weight of edge with u because " + u + " is not within index bounds.");
            }
            if (v < 0 || v >= this.neighbors.size) {
                console.log("Cannot get weight of edge with v because " + v + "is not within index bounds.");
            }

            u = this.vertexAt(u);
            v = this.vertexAt(v);
        }

        for (let edge of this.neighbors.get(u)) {
                if (edge.v == v) {
                    return edge.weight;
                }
        }

        return null;
    }

    isDisplayable () {
        return this.getVertices().every((val) => 'x' in val && 'y' in val && 'name' in val);
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

    setVertexName(v, name) {
        if (this.neighbors.has(v)) Object.defineProperty(v, 'name', {value: name});
    }

    setWeight(u, v, weight) {
        if (typeof u == 'number' && typeof v == 'number') {
            if (u < 0 || u >= this.neighbors.size) {
                console.log("Cannot get weight of edge with u because " + u + " is not within index bounds.");
            }
            if (v < 0 || v >= this.neighbors.size) {
                console.log("Cannot get weight of edge with v because " + v + "is not within index bounds.");
            }

            u = this.vertexAt(u);
            v = this.vertexAt(v);
        }

        for (let edge of this.neighbors.get(u)) {
            if (edge.v == v) {
                Object.defineProperty(edge, 'weight', {value: weight});
            }
        }
        for (let edge of this.neighbors.get(v)) {
            if (edge.v == u) {
                Object.defineProperty(edge, 'weight', {value: weight});
                return true;
            }
        }

        return false;
    }

    print() {
        var i = 0;
        this.neighbors.forEach((edges, vertex) => {
            let edgesString = (edges.length == 0) ? "-" : edges.reduce((prev, curr) => (prev.v) ? prev.v.name : prev + ", " + curr.v.name);
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
            if (!visited[JSON.stringify(neighbor.v)]) {
                parent[JSON.stringify(neighbor.v)] = JSON.stringify(vertex);
                this.dfsRecursive(neighbor.v, parent, searchOrder, visited);
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
                if (!visited[JSON.stringify(neighbor.v)]) {
                    searchOrder.push(neighbor.v);
                    queue.push(neighbor.v);
                    parents[JSON.stringify(neighbor.v)] = JSON.stringify(u);
                    visited[JSON.stringify(neighbor.v)] = true;
                }
            }
        }

        return new SearchTree(v, parents, searchOrder);
    }

    getMinimumSpanningTree (startingVertex) {
        if (typeof startingVertex === 'number') {
            startingVertex = vertexAt(startingVertex);

            if (startingVertex === null) {
                throw new TypeError("Vertex must be a vertex or an index of " +
                "a vertix in the graph to get a minimum spanning tree.");
            }
        }

        let parents = {};
        var totalWeight = 0;

        let T = [];
        T.push(startingVertex);

        while(T.length < this.getSize()) {
            let u = -1, v = -1;
            let currentMinCost = Number.MAX_VALUE;
            for (let i of T) {
                for (let edge of this.neighbors.get(i)) {
                    if (!T.includes(edge.v) && (edge.weight < currentMinCost)) {
                        currentMinCost = edge.weight;
                        u = i;
                        v = edge.v;
                    }
                }
            }

            if (v == -1) {
                break;
            } else {
                T.push(v);
                parents[JSON.stringify(v)] = JSON.stringify(u);
            }
            totalWeight += currentMinCost;
        }

        return new MST(startingVertex, parents, T, totalWeight);
    }

    getShortestPath(sourceVertex) {

        if (typeof startingVertex === 'number') {
            startingVertex = vertexAt(startingVertex);

            if (startingVertex === null) {
                throw new TypeError("Vertex must be a vertex or an index of " +
                "a vertix in the graph to get its shortest path.");
            }
        }

        let cost = {};
        for (let vertex of this.neighbors.keys()) {
            cost[JSON.stringify(vertex)] = Number.MAX_VALUE;
        }
        cost[JSON.stringify(sourceVertex)] = 0;

        let parents = {};

        let T = [];

        while (T.length < this.getSize()) {
            var u = -1;
            var currentMinCost = Number.MAX_VALUE;

            for (let [vertex, edges] of this.neighbors) {
                if (!T.includes(vertex) && cost[JSON.stringify(vertex)] < currentMinCost) {
                    currentMinCost = cost[JSON.stringify(vertex)];
                    u = vertex;
                }
            }

            if (u == -1) {
                break;
            } else {
                T.push(u);
            }

            for (let edge of this.neighbors.get(u)) {
                if (!T.includes(edge.v) && cost[JSON.stringify(edge.v)] > cost[JSON.stringify(u)] + edge.weight) {
                    cost[JSON.stringify(edge.v)] = cost[JSON.stringify(u)] + edge.weight;
                    parents[JSON.stringify(edge.v)] = JSON.stringify(u);
                }
            }
        }

        return new ShortestPath(sourceVertex, parents, T, cost);
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
     * @param {*} parent assumes the array of parent vertices is in JSON stringified form, and parses it
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

    getSearchOrder() {
        return [...this.searchOrder];
    }

    printTree () {
        console.log("Root: " + this.root);
        console.log("Edges: ");

        for (let vertex in this.parents) {
            console.log("(" + this.parents[vertex] + ", " + vertex + ")");
        }
    }
}

class MST extends SearchTree {
    totalWeight;

    constructor(root, parents, searchOrder, totalWeight) {
        super(root, parents, searchOrder);
        this.totalWeight = totalWeight;
    }

    getTotalWeight() {
        return this.totalWeight;
    }
}

class ShortestPath extends SearchTree {
    cost;

    constructor(root, parents, searchOrder, cost) {
        super(root, parents, searchOrder);
        this.cost = cost;
    }

    getCost(v) {
        if (typeof v === 'number') {
            v = vertexAt(startingVertex);

            if (v === null) {
                throw new TypeError("Vertex must be a vertex or an index of " +
                "a vertix in the graph to get its cost.");
            }
        }

        return this.cost[JSON.stringify(v)];
    }
}

export default Graph;
export { SearchTree };