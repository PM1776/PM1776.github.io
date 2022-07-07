export const HELP_MESSAGES = [
    { 
        header: "Graph Visualizer", 
        message: ["Appearently, the world is too small to name this structure differently from a 'graph' in Math. ",
        "So what the heck is a graph then?</br></br>Feel free to skip this tutorial if you'd like to just go for it, and ",
        "to click on the title."].join(''),
        image: '../src/resources/favicon.png' // location starts at index.html
    },
    { 
        header: "The Graph Programmers Know and Love", 
        message: ["A basic graph is a list of objects, with each object containing its own, typically smaller ",
        "list of objects with some kind of connection in the graph. Facebook uses them to hold people's data and ",
        "who they're friends with, and Google Maps uses them in storing locations and their neighboring ",
        "locations."].join(''),
        image: '../src/resources/graph rep.png'
    },
    { 
        header: "Customizing Graph Visualizer", 
        message: ["<i>Adding and Removing Points</i> - A user can customize the graph by simply clicking to add a point and ",
        "right-clicking to remove one.</br></br>",
        "<i>Adding Connections</i> - You can also begin dragging from a point to add a connection to it.</br></br>",
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
        "connections one of its 'neighbors' has before going on to its second 'neighbor' for every point, digging all ",
        "the way to the end of a neighboring line until there are no more.</br></br>",
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
        "</a>."].join(''),
        image: ''
    },
];