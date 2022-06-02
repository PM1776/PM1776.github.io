import { SearchTree } from '../graph/graph.js';
import { clear, drawDirectionalEdgeAnim, drawVertex, showNotification } from '../graph/graphView.js';

const COLOR = 'blue';

/**
 * Animates through the search results of a Graph.dfs()
 * 
 * @param {*} searchTree the SearchTree object returned from a Graph.dfs() or Graph.bfs().
 */
async function depthFirstAnim (searchTree, searchingFor) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.dfs or Graph.bfs");
    }

    let parents = searchTree.getParents();
    var found = false;
    for (let vertex in parents) {
        let result = drawDirectionalEdgeAnim(JSON.parse(parents[vertex]), JSON.parse(vertex), true, .93);
        drawVertex(JSON.parse(parents[vertex]), COLOR);
        drawVertex(JSON.parse(vertex), COLOR);
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
async function breadthFirstAnim (searchTree, searchingFor) {
    if (!searchTree instanceof SearchTree) {
        throw new TypeError("Only displays results from a SearchTree class, returned from a Graph.dfs or Graph.bfs");
    }

    let parents = searchTree.getParents();
    let searchLevel = new Map();
    searchLevel.set(JSON.stringify(searchTree.getRoot()), []);

    for (let vertex in parents) {
        // stores the level's parents as keys in searchLevel until the vertice's parent is no longer in searchLevel
        // (no longer at that level)
        if (!searchLevel.has(parents[vertex])) {
            await visualizeLevel(searchLevel, searchingFor);
        }
        if (vertex === JSON.stringify(searchingFor)) {
            searchLevel.get(parents[vertex]).push(vertex);
            await visualizeLevel(searchLevel, searchingFor);
            showResults(searchTree, searchingFor, 8000);
            return;
        }

        searchLevel.get(parents[vertex]).push(vertex);
    }

    // empties searchLevel to display the last level
    await visualizeLevel(searchLevel);

    showNotification("No path found.", 3000);

    /**
     * This method iterates through searchLevel and displays the animations of the edges in parallel. It additionally
     * deletes keys once finishing their iteration, and then indirectly sets its values as new keys for the
     * next level.
     */ 
    async function visualizeLevel (searchLevel, searchingFor) {
        let result;
        let nextLevel = [];
        for (let [parent, vertices] of searchLevel) {
            for (let vertex of vertices) {
                result = drawDirectionalEdgeAnim(JSON.parse(parent), JSON.parse(vertex), true, .95);
                drawVertex(JSON.parse(parent), COLOR);
                drawVertex(JSON.parse(vertex), COLOR);
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
    let pathString = searchTree.getRoot().name + " -> ";
    pathString += (path.length == 1) ? JSON.parse(path[0]).name :
        path.reduce((prev, val, i) => JSON.parse(val).name + " -> " + ((i == 1) ? JSON.parse(prev).name : prev));
    showNotification(pathString + "</br>Search Count: " + path.length, time);
}

export { depthFirstAnim, breadthFirstAnim };