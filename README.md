# Graph Visualizer
Graph theory is incredibly helpful in the development world, providing capabilities such as holding the connections within a list and searching through those connections seemingly in ways only limited to one's creativity, all while allowing the same capabilities of an Array list. I built this application to learn about the graph data structure, and I hope it's as visualizing of graphs as it was for me in building it. It is additionally mobile friendly. </br></br>
The running application can be found here: https://paulmeddaugh.github.io/Graph-Visualizer/</br>
The Trello board can be found here: https://trello.com/b/0vXmvjiV/graph-visualizer

## The Algorithm Cast
The following algorithms are supported in this application:

### Graph Searching algorithms
<b>Depth-First</b> - Searches from a point by exploring every connection it can find in one of its 'neighbors', or points connected, before going on to another, and does this recursively, digging through one 'neighbor' branch before going on to the next.

<b>Breadth-First</b> - Explores all a point's neighbors, or points connected, before searching all the neighbors of those neighbors.

<i>Uses connection 'weights' (i.e. storing miles)</i></br>
<b>Minimum Spanning Tree</b> - Determines the least 'weightiest' way to travel to every point in the graph.

<b>Shortest Path</b> - Determines the least 'weightiest' path from one point to another.

### Additional Algorithms
<b>Merge Sort</b> - Sorts the points in the graph by either their 'X' co-ordinate or 'Y' co-ordinate by spliting the list into sub-sections and merging those sorted subsections.

<b>Closest Pair of Points</b> - Finds the closest pair in the graph by determining the closest pair in smaller sections and merging those sub-sections (Divide and Conquer method).

## Maps
This application additionally has options to load a map of certain locations in the U.S. or a small binary tree map.