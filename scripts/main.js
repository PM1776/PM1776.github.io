import Graph from './graph.js';
import { resizeAnim, resizeInstantly, renderNewVertex, renderNewEdge, renderRemoveVertex, 
    drawVertex, drawEdge, drawGraph, GRAD_BY_X, VIEW_CHANGES, drawVertices } from './graphView.js';
import { alignToEvenSpacing, aligned } from './animations/sortingAnim.js';
import { mergeSort } from './algorithms/mergeSort.js';
import { findClosestPairIn } from './algorithms/closestPairOfPoints.js';

var graph;

var canvas;

var header;
var headerHeight;
var legend;
var legendHeight;

var disabled = false;

const CANVAS_MARGIN = 15;
const GENERATED_POINTS = 20;

var newPointName = GENERATED_POINTS;

window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };

window.addEventListener("load", async (e) => {
    
    canvas = document.getElementById('graphView');


    header = document.getElementById('header');
    legend = document.getElementById('legend');
    // headerHeight set in resize(e) below
    legendHeight = legend.getBoundingClientRect().height;

    canvas.addEventListener("mousedown", addPoint);
    document.getElementById('genRand').addEventListener("click", generateRandomPoints);
    document.getElementById('closest').addEventListener("click", findClosestPair);
    document.getElementById('byX').addEventListener("click", beginMergeSort);
    document.getElementById('byY').addEventListener("click", beginMergeSort);

    await resize(e);
    generateRandomPoints();
    enableButtons();
});

window.addEventListener("resize", resize);
window.addEventListener('orientationchange', resize, false); // for mobile

function addPoint(e) {
    if (disabled) return;

    renderNewVertex(
        {name: newPointName++, x: e.clientX - CANVAS_MARGIN, 
         y: e.clientY - headerHeight - legendHeight - CANVAS_MARGIN},
        graph);
}

function removeVertex (e) {
    if (disabled) return;
    let vIndex = 6;
    setTimeout(renderRemoveVertex(vIndex, graph), 500);
}

function generateRandomPoints() {
    var vertices = new Array(GENERATED_POINTS);

    for (let i = 0; i < vertices.length; i++) {
        vertices[i] = {name: i, x: Math.floor(Math.random() * canvas.width), 
                   y: Math.floor(Math.random() * canvas.height)};
    }
    let edges = [[6, 3], [1, 8], [2, 19], [11, 7], [3, 1], [6, 11], [8, 19], [7, 2]];
    graph = new Graph(vertices);
    graph.print();

    console.log("randomized");
    drawGraph(graph);
}

function resize(e) {

    // constantly refreshes header heights, as sometimes it stacks
    headerHeight = header.getBoundingClientRect().height;

    var targetX = document.body.clientWidth - CANVAS_MARGIN * 2;
    var targetY = document.body.clientHeight - headerHeight - legendHeight - CANVAS_MARGIN * 2;

    if (e.type === 'load') {
        return resizeAnim(targetX, targetY);
    } else {
        resizeInstantly(targetX, targetY);
        drawGraph(graph);
    }
}

async function beginMergeSort(e) {
    // change legend
    if (document.getElementById('item1')) document.getElementById('item1').remove();
    if (document.getElementById('item2')) document.getElementById('item2').remove();
    if (document.getElementById('item3')) document.getElementById('item3').remove();

    let rangeLegend = document.createElement('legend-item');
    document.getElementById('legend').appendChild(rangeLegend);
    rangeLegend.children[0].children[0].classList.add("green");

    let axis = (e.target.id === 'byX') ? 'x' : 'y';
    let oppAxis = (axis === 'y') ? 'x' : 'y'; 

    const sortedByOppAxis = (axis === 'x') ? graph.getVertices().sort((a, b) => a.y - b.y) :
            graph.getVertices().sort((a, b) => a.x - b.x);
    
    disableButtons();
    await new alignToEvenSpacing(sortedByOppAxis, oppAxis);
    await mergeSort(sortedByOppAxis, axis);
    enableButtons();
}

async function findClosestPair () {
    disableButtons();
    await findClosestPairIn(graph.getVertices());
    enableButtons();
}

function disableButtons () {
    disabled = true;

    document.getElementById('genRand').setAttribute("disabled", "");
    document.getElementById('closest').setAttribute("disabled", "");
    document.getElementById('shortest').setAttribute("disabled", "");
    document.getElementById('depth').setAttribute("disabled", "");
    document.getElementById('breadth').setAttribute("disabled", "");
    document.getElementById('sort').classList.add("disabled");

    // for assistive technologies
    document.getElementById('genRand').setAttribute("aria-disabled", "");
    document.getElementById('closest').setAttribute("aria-disabled", "");
    document.getElementById('shortest').setAttribute("aria-disabled", "");
    document.getElementById('depth').setAttribute("aria-disabled", "");
    document.getElementById('breadth').setAttribute("aria-disabled", "");
}

function enableButtons () {
    disabled = false;

    document.getElementById('genRand').removeAttribute("disabled");
    document.getElementById('closest').removeAttribute("disabled");
    document.getElementById('shortest').removeAttribute("disabled");
    document.getElementById('depth').removeAttribute("disabled");
    document.getElementById('breadth').removeAttribute("disabled");
    document.getElementById('sort').classList.remove("disabled");

    // assistive technologies
    document.getElementById('genRand').removeAttribute("aria-disabled");
    document.getElementById('closest').removeAttribute("aria-disabled");
    document.getElementById('shortest').removeAttribute("aria-disabled");
    document.getElementById('depth').removeAttribute("aria-disabled");
    document.getElementById('breadth').removeAttribute("aria-disabled");
}