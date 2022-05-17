import Graph from './graph.js';
import { renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, GRAD_BY_X, VIEW_CHANGES } from './graphView.js';
import { alignToEvenSpacing, aligned } from './animations/sortingAnim.js';
import { mergeSort } from './algorithms/mergeSort.js';
import { findClosestPair } from './algorithms/closestPairOfPoints.js';

var graph = null;

var canvas = null;
var header = null;

const CANVAS_MARGIN = 15;
var canvasBorderWidth = 0; // set on window load

window.addEventListener("load", async () => {
    
    canvas = document.getElementById('graphView');
    canvasBorderWidth = canvas.style.borderLeftWidth * 2;

    header = document.getElementById('header');

    canvas.addEventListener("mousedown", addPoint);
    document.getElementById('genRand').addEventListener("click", generateRandomPoints);
    document.getElementById('closest').addEventListener("click", findClosest);
    document.getElementById('byX').addEventListener("click", beginMergeSortX);

    await resizeCanvas();
    generateRandomPoints();
});

//window.addEventListener("resize", resizeAndDraw);

function removeVertex (e) {
    let vIndex = 6;
    setTimeout(renderRemoveVertex(vIndex, graph), 500);
}

function addPoint(e) {
    renderNewVertex(
        {x: e.clientX - CANVAS_MARGIN - canvasBorderWidth, 
         y: e.clientY - header.getBoundingClientRect().height - CANVAS_MARGIN - canvasBorderWidth},
        graph);
}

function generateRandomPoints() {
    var vertices = new Array(20);

    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = {name: i, x: Math.floor(Math.random() * canvas.width), 
                   y: Math.floor(Math.random() * canvas.height)};
    }

    graph = new Graph(vertices, [[6, 3], [1, 8], [2, 19], [11, 7], [3, 1], [6, 11], [8, 19], [7, 2]]);
    graph.print();

    console.log("randomized");
    drawGraph(graph);
}

function resizeCanvas() {
    return new Promise(resolve => {
        let resize = () => {
    
            const headerHeight = header.getBoundingClientRect().height;
            const canvasBorderWidth = canvas.style.borderLeftWidth * 2;
            console.log("canvas Border: " + canvasBorderWidth);

            var targetX = document.body.scrollWidth - canvasBorderWidth - CANVAS_MARGIN * 2;
            var targetY = document.body.scrollHeight - headerHeight - canvasBorderWidth - CANVAS_MARGIN * 2;

            const xChange = (targetX - canvas.width) * .15;
            const yChange = (targetY - canvas.height) * .15;

            canvas.width += (xChange < 1) ? 1 : xChange;
            canvas.height += (yChange < 1) ? 1 : yChange;
            
            if (canvas.width < targetX || canvas.height < targetY) {
                requestAnimationFrame(resize);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(resize);
    });
}

function resizeAndDraw() {
    resizeCanvas();
    drawGraph(graph);
}

async function beginMergeSortX() {
    const sortedByY = graph.getVertices().sort((a, b) => a.y - b.y);
    await new alignToEvenSpacing(sortedByY);
    mergeSort(sortedByY, 'x');
}

function findClosest () {

}