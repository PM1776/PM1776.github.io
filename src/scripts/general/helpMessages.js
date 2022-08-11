import { MOBILE } from '../graph/graphView.js';

let helpPage = 0;

export const HELP_MESSAGES = [
    { 
        header: "Graph Visualizer", 
        message: ["The english vocab is, apprarently, too small to name this 'graph' separate from the 'graph' in Math. ",
        "So what on earth is a programmer's graph?</br></br>Feel free to skip this tutorial if you'd like to just ",
        "go for it, and to click on the title."].join(''),
        image: './src/resources/favicon.png' // location starts at index.html
    },
    { 
        header: "The Graph Programmers Know and Love", 
        message: ["A graph is essentially a list of objects, with each object containing its own, typically smaller, ",
        "list of objects with some kind of connection in the graph. Facebook uses them to hold people's data and ",
        "who they're friends with, and Google Maps uses them in storing locations and a location's neighboring ",
        "locations."].join(''),
        image: './src/resources/graph rep.png'
    },
    { 
        header: "Customizing Graph Visualizer", 
        message: ["<i>Adding and Removing Points</i> - A user can customize the graph by simply ",
        ((!MOBILE) ? "clicking to add a point and right-clicking to remove one." : 
                    "tapping to add a point, and double tapping to remove one.") + "</br></br>",
        "<i>Adding Connections</i> - You can also ",
        ((!MOBILE) ? "begin dragging from a point to add a connection to it." : 
        "hold down on a point for half a second and drag from it to add a connection to it.") + "</br></br>",
        "<i>Zooming</i> - A user can use the mouse wheel to zoom in and out.</br></br>",
        "Users can additionally load pre-made maps using the <span class=buttonText>Change Map</span> dropdown."].join(''),
        image: ''
    },
    { 
        header: "Searching", 
        message: ["A main advantage of graphs is their searching ability throughout all the connections.</br></br>",
        "Users can search the graph for a path using the <span class=buttonText>Find Paths</span> button.</br></br>",
        "All the algorithms have starting points, and most have 'searching-for' ",
        "points, which can be typed in the appropriate <span class=buttonText>Find Paths</span> inputs. </br></br>",
        "The searching algorithm to use can be selected in the last dropdown of the <span class=buttonText>",
        "Find Paths</span> section."].join(''),
        image: ''
    },
    { 
        header: "The Algorithm Cast", 
        message: ["<font size=2><i>Depth-First Search</i> - This algorithm searches from a point by going through all the ",
        "connections one of its 'neighbors' has before going on to its second 'neighbor', digging all ",
        "the way to the end of one neighboring line until there are no more.</br></br>",
        "<i>Breadth-First Search</i> - This algorithm searches by going through all a point's 'neighbors' ",
        "before going on to its neighbors' neighbors. The fewer the connections to a searching point, the ",
        "quicker it'll be found.</br></br>",
        "<i>Shortest Entirety Path</i> - This algorithm determines the smallest distance in traveling to every ",
        "point, though not necessarily linearly.</br>",
        "<i>Shortest Path</i> - This algorithm guarantees the shortest path from starting point to searching-for ",
        "point."].join(''),
        image: ''
    },
    { 
        header: "Additional Features", 
        message: ["<i>Sorting</i> - Users can additionally sort the points based on their 'x' or 'y' co-ordinates ",
        "using the <span class=buttonText>Sort</span> dropdown, which uses the algorithm, 'Merge Sort'.</br></br>",
        "<i>Closest Pair</i> - A last feature includes finding the closest pair of points in the graph, ",
        "which visualizes using the 'Divide and Conquer' method."].join(''),
        image: ''
    },
    { 
        header: "Thanks so much for checking this project out!", 
        message: ["It has been incredibly learning for me, and I hope you find it interesting as well.</br></br>",
        "The github repository can be found <a href=\'https://github.com/paulmeddaugh/Graph-Visualizer\'>here",
        "</a>.</br></br>",
        "The Trello board can be found <a href=\'https://trello.com/b/0vXmvjiV/graph-visualizer'>here",
        "</a>."].join(''),
        image: ''
    },
];

export function showHelpMessages (e) {

    // Checks pre-helpPage value to determine if button text needs to be changed
    changeIfOnEndingPages("Previous", "Next");

    helpPage = (e.currentTarget.id == 'previous') ? --helpPage : ++helpPage;

    if (helpPage < 0 || helpPage >= HELP_MESSAGES.length) {
        document.getElementById('helpMessage').style.visibility = 'hidden';
        return;
    }

    // Changes to beginning or finishing button text if currently on first or last HELP_MESSAGE index
    changeIfOnEndingPages("Skip", "Finish");

    loadCurrentHelpPage();
}

/**
 * Checks if the current help page is the first index or last index of HELP_MESSAGES, and changes the
 * 'previous' button text to previousButtonText param if first, or 'next' button text to nextButtonText
 * if last.
 * @param {*} previousButtonText The text to change the 'previous' button text to if on the first index 
 * of HELP_MESSAGES.
 * @param {*} nextButtonText The text to change the 'next' button text to if on the last index of 
 * HELP_MESSAGES.
 */
function changeIfOnEndingPages(previousButtonText, nextButtonText) {
    if (helpPage == 0) {
        document.getElementById('previous').innerHTML = previousButtonText;
    } else if (helpPage == HELP_MESSAGES.length - 1) {
        document.getElementById('next').innerHTML = nextButtonText;
    }
}

export function loadCurrentHelpPage() {
    document.getElementsByClassName('helpHeader')[0].innerHTML = HELP_MESSAGES[helpPage].header;
    document.getElementsByClassName('helpMessage')[0].innerHTML = HELP_MESSAGES[helpPage].message;
    
    // Loads or hids the help img
    document.getElementsByTagName('img')[0].style.display = (HELP_MESSAGES[helpPage].image != '') ?
        'block' : 'none';
    if (HELP_MESSAGES[helpPage].image != '') {
        document.getElementsByTagName('img')[0].src = HELP_MESSAGES[helpPage].image;
    }
    
}

document.getElementById('tutorial').addEventListener("click", () => {
    helpPage = 0;
    loadCurrentHelpPage();
    document.getElementById('previous').innerHTML = "Skip";
    document.getElementById('next').innerHTML = "Next";
    document.getElementById('helpMessage').style.visibility = 'visible';
});

document.getElementById('closeTutorial').addEventListener("click", () => {
    document.getElementById('helpMessage').style.visibility = 'hidden';
});