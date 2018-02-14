# Project 2 Saahil Claypool

## Files

- README.md

    Contains the brief documentation of the project

- loads.js 

    Contains all of the logic for the program.
    This also builds off of the last project

- index.html 

    An html page. Open this in the browser to view
    
- lib

    Provided libary folder 

- plyfiles

    Provided ply files to test the program with



## Overview

The program will read the ply file, and redraw on the screen.

Events are handled within an event loop (called tick). 

Processing is split up into two phases, a setup phase where global transformations are 
calculated, and a individual face phase where things like pulse are calculated and 
each face is drawn. More of this is documented in the load.js file.

For ease of use thed default drawing is the cube shape. This is shown when 
the user opens the program for the first time. 

