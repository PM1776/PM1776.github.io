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

        function MapProxy(map = new Map()) {
            return new Proxy(map, MapProxy.handlers);
        }
        MapProxy.handlers = {
            get: function get(map, key) {
                if (map.has(key)) {
                    return map.get(key);
                } else {
                    return map[key];
                }
            },
            set: function set(map, key, value) {
                map.set(key, value);
            },
            has: function has(map, key) {
                return map.has(key);
            }
        };

        const obj1 = {Name: "Rahim", City: 'Hyderabad',Country: "India" };
        const obj2 = {Name: "Rahim", City: 'Hyderabad',Country: "India" };
        //document.write(JSON.stringify(obj1) === JSON.stringify(obj2));

        // Adds vertices if passed in
        if (vertices != undefined) {
            if (!(Array.isArray(vertices))) {
                throw new TypeError("param 'vertices' must be an Array of vertices with 'x' and 'y' properties.");
            } else {
                for (let vertex of vertices) {
                    this.addVertex(vertex);
                }
            }
        }

        // Adds edges if passed in
        if (edges != undefined) {
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
    }

    addVertex(v) {
        this.neighbors.set(v, []);
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

            if (this.neighbors.includes(u)) {
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
            throw new TypeError("v must be a vertex added to the graph or a index to one relative to insertion order.")
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
        return [...this.neighbors.keys()];
    }

    getNeighbors () {
        return this.neighbors;
        //return new Map(JSON.parse(JSON.stringify([...this.neighbors])));
    }

    print() {
        var i = 0;
        this.neighbors.forEach((edges, vertex) => {
            let edgesString = (edges.length == 0) ? "-" : edges.reduce((prev, curr) => prev.name + ", " + curr.name);
            console.log("vertex[" + vertex.name + "]: x: " + vertex.x + ", y: " + vertex.y + " -> " + edgesString);
            i++;
        });
    }
}

export default Graph;