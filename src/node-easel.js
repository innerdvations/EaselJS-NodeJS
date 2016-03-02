/*
 * Copyright (c) 2013 Wes Gorgichuk
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
var Canvas = require('canvas');
var Image = Canvas.Image;

/**
 * Surpress addEventListener errors on easel.
 * Its currently only used for MouseEvent, so its not needed on the server.
 *
 */
Canvas.prototype.addEventListener = function () { };

/**
 * Inject a window object
 *
 * @type {Object}
 */
window = { addEventListener:function () { } };

/**
 * node-canvas doesn't support cloneNode();
 * So create our own.
 *
 * @return {Canvas}
 */
Canvas.prototype.cloneNode = function () {
	var c = new Canvas(this.width, this.height);
	c.type = this.type;

	return c;
};

// Easel uses instanceof HTMLCanvasElement, so change it to Canvas.
HTMLCanvasElement = Canvas;

// Create our global createjs namespace.
createjs = {
	_snapToPixelEnabled:true,

	createCanvas:function () {
		return new Canvas();
	},

	createImage:function () {
		return new Image();
	}
};

/**
 * Require all createjs, easeljs, and tweenjs libraries dynamically for ease of updating
 *
 */
var fs = require('fs');
var path = require('path');
var libs = ["createjs","easeljs","tweenjs"];
var classes = [];
var walk = require('walk');
// use priority to require base classes before dependent files
var priority = {
  "events":100,
  "utils":90,
  "DisplayObject.js":100,
  "Container.js":90,
  "Stage.js":80,
  "Filter.js":70,
  "version.js":-100,
  "version_movieclip.js":-110
};

var options = {
  listeners: {
    names: function(root, nodeNamesArray) {
      nodeNamesArray.sort(function (a, b) {
        // due to the way the walking works, directories need to be reverse sorted
        var toggle = -1;
        if(path.parse(a).ext) toggle = 1;

        var priorityA = 0, priorityB = 0;
        if(priority.hasOwnProperty(a)) priorityA = priority[a];
        if(priority.hasOwnProperty(b)) priorityB = priority[b];

        // sort based on priority if different
        if(priorityB < priorityA) return -1 * toggle;
        if(priorityB > priorityA) return 1 * toggle;

        // sort by alphabetical order if priorities are equal
        if (a > b) return 1 * toggle;
        if (a < b) return -1 * toggle;
        return 0;
      });
    },
    directories: function(root, dirStatsArray, next) {
      next();
    },
    file: function(root, fileStats, next) {
      classes.push(path.join(root, fileStats.name));
      next();
    },
    errors: function(root, nodeStatsArray, next) {
      next();
    },
    end: function() {
    }
  }
};

for(var i in libs) {
  walk.walkSync( path.join(__dirname, libs[i]), options);
}

for (var i = 0; i < classes.length; i++) {
  var fn = classes[i];
	var fp = path.parse(fn);
	require(fn)[fp.name];
};

/**
 * Inject custom functionality that is only required on the server.
 * So we can keep the same EaselJS source desktop / server.
 *
 */

/**
 * Inject a halt method for Ticker.
 * Clears the Ticker's Timeout, and stops all animation.
 * Should only be called when your ready to stop the node instance.
 *
 */
createjs.Ticker.halt = function() {
	if (createjs.Ticker.timeoutID !== null) {
		clearTimeout(createjs.Ticker.timeoutID);
	}
}
