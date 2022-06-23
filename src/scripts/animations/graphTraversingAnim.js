import { SearchTree, Graph } from '../graph/graph.js';
import { drawDirectionalEdgeAnim, drawVertex, drawVertices, showNotification } from '../graph/graphView.js';

const COLOR = 'blue';
const AWAIT_TIME = 250;
const ARROW_SPEED = .94;
const ARROW_SPEED_BY_TIME = .93;
const MESSAGE_TIME = 10000;

/**
 * Animates through the search results of a Depth-First search from a {@link Graph}.dfs() returned {@link SearchTree}.
 * 
 * @param {*} searchTree the {@link SearchTree} object returned from a {@link Graph} search.
 * @param {*} searchingFor the vertex that is being searched for.
 * @param {*} graph the {@link Graph} object that was searched in.
 */
async function depthFirstAnim (searchTree, searchingFor, graph) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.dfs");
    }

    let parents = searchTree.getParents();
    var found = false, toSearchCount = 0;
    for (let vertex in parents) {
        let v1 = JSON.parse(parents[vertex]), v2 = JSON.parse(vertex);
        await animToPoint(v1, v2, graph, 325);
        toSearchCount++;

        if (vertex === JSON.stringify(searchingFor)) {
            found = true;
            break;
        }
    }

    if (found === false) {
        showNotification("No path found.", 3000);
    } else {
        showResults(searchTree, searchingFor, MESSAGE_TIME, toSearchCount);
    }
}

/**
 * Uses a Map to hold the 'levels' of a Breadth-First search, which searches through all the connecting points
 * of a root vertex before searching through the connecting points of those points, creating the effect of
 * a 'level' being searched. The Map holds the points which all the points being searched are connected to 
 * (their 'parents') as keys, and keeps adding the searched points until the parent no longer connects to
 * any of the points in the Map, which signals the next level.
 * 
 * @param {*} searchTree the SearchTree object returned from the {@link Graph}.bfs() search.
 * @param {*} searchingFor the vertex that the search is searching for.
 * @param {*} graph the {@link Graph} object that was searched within.
 */
async function breadthFirstAnim (searchTree, searchingFor, graph) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.bfs");
    }

    let parents = searchTree.getParents();
    let searchLevel = new Map(), toSearchCount = 0, result;
    searchLevel.set(JSON.stringify(searchTree.getRoot()), []);

    for (let vertex in parents) {
        // stores the level's parents as keys in searchLevel until the vertice's parent is no longer in searchLevel
        if (!searchLevel.has(parents[vertex])) {
            await visualizeLevel(searchLevel, graph);
        }
        toSearchCount++;

        if (vertex === JSON.stringify(searchingFor)) { 
            searchLevel.get(parents[vertex]).push(vertex);          
            await visualizeLevel(searchLevel, graph);       // will never visualize level twice, as it runs visualization
            showResults(searchTree, searchingFor, MESSAGE_TIME, toSearchCount); // once no longer on the level
            return;
        }

        await result;
        searchLevel.get(parents[vertex]).push(vertex);
    }

    // empties searchLevel to display the last level
    await visualizeLevel(searchLevel, graph);

    showNotification("No path found.", 3000);

    /**
     * This method iterates through searchLevel and displays the animations of the edges asynchronously. It 
     * additionally deletes keys once finishing their iteration, and then indirectly sets its values as new keys 
     * for the next level.
     */ 
    async function visualizeLevel (searchLevel, graph) {
        let nextLevel = [], v1, v2, result;
        for (let [parent, vertices] of searchLevel) {
            for (let vertex of vertices) {
                if (v1) await animToPoint(v1, v2, graph, AWAIT_TIME);
                v1 = JSON.parse(parent), v2 = JSON.parse(vertex);
                nextLevel.push(vertex);
            }
            searchLevel.delete(parent);
        }
        await animToPoint(v1, v2, graph);
        await new Promise(resolve => setTimeout(() => resolve(), 75));

        for (let vertex of nextLevel) {
            searchLevel.set(vertex, []);
        }
    }
}

/**
 * Animates displaying the results of a {@link SearchTree} from a {@link Graph}.getMinimumSpanningTree() search
 * simply by displaying them all at once.
 * 
 * @param {*} searchTree the {@link SearchTree} object to display results from
 * @param {*} graph the {@link Graph} object which was searched from.
 */
async function minimumSpanningTreeAnim (searchTree, graph) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class returned from Graph.");
    }

    let parents = searchTree.getParents();

    let result = null;
    for (let vertex in parents) {
        let v1 = JSON.parse(parents[vertex]), v2 = JSON.parse(vertex);
        result = drawDirectionalEdgeAnim(v1, v2, true, .95, undefined,
            undefined, undefined, graph.getWeight(graph.getNeighbors().has(v1), graph.getNeighbors().has(v2)));
    }

    drawVertices(graph.getVertices(), undefined, false, 'blue');
    await result;
    
    showNotification("Smallest distance to travel to every point: <b>" + searchTree.getTotalWeight() + "</b>", 
        MESSAGE_TIME);
}

/**
 * Animates displaying the shortest path to a vertex in a {@link Graph} object from a {@link SearchTree} returned
 * be a {@link Graph}.getShortestPath() search asynchronously.
 * 
 * @param {*} searchTree the {@link SearchTree} object returned from a {@link Graph}.getShortestPath() search.
 * @param {*} searchingFor the vertex in the {@link Graph} object to search for.
 * @param {*} graph the {@link Graph} object that was searched in.
 */
async function shortestPathAnim (searchTree, searchingFor, graph) {
    let path = searchTree.getPath(searchingFor);
    let v1 = searchTree.getRoot(), v2;
    for (let i = path.length - 1; i != -1; i--) {
        v2 = JSON.parse(path[i]);
        await animToPoint(v1, v2, graph, AWAIT_TIME);
        v1 = v2;
    }

    let additionalMessage = '</br>Total Path Distance: <b>' + searchTree.getCost(searchingFor) + '</b>';
    showResults(searchTree, searchingFor, MESSAGE_TIME, undefined, additionalMessage);
}

/**
 * The animation to move from one vertex to another in {@link SearchTree} results. This method is asynchronous,
 * and either awaits for the animation to the complete to the second vertex at {@link ARROW_SPEED}, or awaits for 
 * an alloted time at {@link ARROW_SPEED_BY_TIME}.
 * 
 * @param {*} v1 the vertex to begin from.
 * @param {*} v2 the vertex to move to.
 * @param {*} graph the {@link Graph} object that the vertices are in to get the edge of the connecting vertices'
 * weight.
 * @param {*} byTime By default, this async function awaits until the animation completely reaches the second point,
 * but setting this value to a millisecond time will await only for that specified amount of time, and additionally 
 * changes the speed of the animation to {@link ARROW_SPEED_BY_TIME} to allow for smoother animation.
 */
async function animToPoint (v1, v2, graph, byTime) {
    let speed = (!byTime) ? ARROW_SPEED : ARROW_SPEED_BY_TIME;
    let result = drawDirectionalEdgeAnim(v1, v2, true, speed, undefined, undefined, undefined, 
        graph.getWeight(graph.getNeighbors().has(v1), graph.getNeighbors().has(v2)));
    drawVertex(v1, COLOR);
    drawVertex(v2, COLOR);

    if (!byTime) await result;
    else await new Promise(resolve => setTimeout(() => resolve(), byTime));
}

/**
 * Displays the results of the {@link SearchTree}, as far the the vertex of 'searchingFor' is concerned, with a 
 * time to display the message, an optional 'toSearchCount' for counting number of searches, and any additional
 * message to add to the results.
 * 
 * @param {*} searchTree the {@link SearchTree} object to display the results of as far as 'searchingFor' is
 * concerned.
 * @param {*} searchingFor the vertex to display results of related to the 'searchTree' search.
 * @param {*} time the time to display the results.
 * @param {*} toSearchCount an optional insert of the number of searches to find the 'searchingFor' vertex.
 * @param {*} additionalMessage any additional message to add to the results.
 */
function showResults (searchTree, searchingFor, time, toSearchCount, additionalMessage) {
    let path = searchTree.getPath(searchingFor);

    let pathString = "Path Found: <b>" + searchTree.getRoot().name + "</b> > ";
    pathString += (path.length == 1) ? "<b>" + JSON.parse(path[0]).name + "</b>" :
        path.reduce((prev, val, i) => "<b>" + JSON.parse(val).name + "</b> > " + 
        ((i == 1) ? "<b>" + JSON.parse(prev).name + "</b>" : prev));

    let message = pathString + "</br>Path Length: <b>" + path.length + "</b>";
    message += ((toSearchCount) ? "</br>Search Count: <b>" + toSearchCount + "</b>" : "")
        + (additionalMessage ? additionalMessage : "");
    showNotification(message, time);
}

export { depthFirstAnim, breadthFirstAnim, minimumSpanningTreeAnim, shortestPathAnim };