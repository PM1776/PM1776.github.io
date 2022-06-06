import { SearchTree } from '../graph/graph.js';
import { clear, drawDirectionalEdgeAnim, drawVertex, showNotification } from '../graph/graphView.js';

const COLOR = 'blue';

/**
 * Animates through the search results of a Graph.dfs()
 * 
 * @param {*} searchTree the SearchTree object returned from a Graph.dfs() or Graph.bfs().
 */
async function depthFirstAnim (searchTree, searchingFor, graph) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.dfs");
    }

    let parents = searchTree.getParents();
    var found = false;
    for (let vertex in parents) {
        let v1 = JSON.parse(parents[vertex]), v2 = JSON.parse(vertex);
        let result = drawDirectionalEdgeAnim(v1, v2, true, .93, undefined, undefined, undefined, 
            graph.getWeight(v1, v2));
        drawVertex(v1, COLOR);
        drawVertex(v2, COLOR);
        await result;

        if (vertex === JSON.stringify(searchingFor)) {
            found = true;
            showResults(searchTree, searchingFor, 8000);
            break;
        }
    }

    if (found === false) {
        showNotification("No path found.", 3000);
    }
}

/**
 * Uses a Map to animate searching by level simultaneously, which helps visualize the algorithm.
 * 
 * @param {*} searchTree the SearchTree object returned from a Graph.dfs() or Graph.bfs().
 */
async function breadthFirstAnim (searchTree, searchingFor, graph) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.bfs");
    }

    let parents = searchTree.getParents();
    let searchLevel = new Map();
    searchLevel.set(JSON.stringify(searchTree.getRoot()), []);

    for (let vertex in parents) {
        // stores the level's parents as keys in searchLevel until the vertice's parent is no longer in searchLevel
        // (no longer at that level)
        if (!searchLevel.has(parents[vertex])) {
            await visualizeLevel(searchLevel, graph);
        }
        if (vertex === JSON.stringify(searchingFor)) { // will never visualize level twice, as it typically
            searchLevel.get(parents[vertex]).push(vertex);          // visualizes once no longer on the level
            await visualizeLevel(searchLevel, graph);
            showResults(searchTree, searchingFor, 8000);
            return;
        }

        searchLevel.get(parents[vertex]).push(vertex);
    }

    // empties searchLevel to display the last level
    await visualizeLevel(searchLevel, graph);

    showNotification("No path found.", 3000);

    /**
     * This method iterates through searchLevel and displays the animations of the edges in parallel. It additionally
     * deletes keys once finishing their iteration, and then indirectly sets its values as new keys for the
     * next level.
     */ 
    async function visualizeLevel (searchLevel, graph) {
        let result;
        let nextLevel = [];
        for (let [parent, vertices] of searchLevel) {
            for (let vertex of vertices) {
                let v1 = JSON.parse(parent), v2 = JSON.parse(vertex);
                result = drawDirectionalEdgeAnim(v1, v2, true, .95, undefined,
                    undefined, undefined, graph.getWeight(graph.hasVertex(v1), graph.hasVertex(v2)));
                drawVertex(v1, COLOR);
                drawVertex(v2, COLOR);
                nextLevel.push(vertex);
            }
            searchLevel.delete(parent);
        }

        await result;

        for (let vertex of nextLevel) {
            searchLevel.set(vertex, []);
        }
    }
}

function showResults (searchTree, searchingFor, time) {
    let path = searchTree.getPath(searchingFor);
    let pathString = "<b>" + searchTree.getRoot().name + "</b> > ";
    pathString += (path.length == 1) ? "<b>" + JSON.parse(path[0]).name + "</b>" :
        path.reduce((prev, val, i) => "<b>" + JSON.parse(val).name + "</b> > " + 
        ((i == 1) ? "<b>" + JSON.parse(prev).name + "</b>" : prev));
    showNotification(pathString + "</br>Search Count: <b>" + path.length + "</b>", time);
}

export { depthFirstAnim, breadthFirstAnim };