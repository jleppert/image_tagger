Setup Instructions
----

Clone the repo, make sure you have node, then just run npm install in the checked out directory. After that's done, run node index.js to start the web server and open your browser to http://localhost:9000 to see the UI.

Put image files (browser compatible) under /images
JSON data is under /tags

Some sample data is provided and already checked in.

Usage
----

Index page UI lists all images with all of their tags and a button at the bottom to download the data.

![](http://i.imgur.com/6zcFsOe.jpg)

Clicking on an image in the index page will take you to a full size version where you can add or delete tags. Only quadrilaterals are supported for now. Click four corners to define the tag, or click the delete button to remove it. Changes are automatically saved. To go to the next image without having to go back to the index page, press space. Once you're done you can go back to the index page to download the data.

![](http://i.imgur.com/QbFqPvZ.jpg)

Happy image taging!! lol
