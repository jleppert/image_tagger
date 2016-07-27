var express = require('express'),
    browserify = require('browserify-middleware'),
    livereload = require('livereload'),
    serveJsonDir = require('express-serve-json-dir'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    package = require('./package.json'),
    sizeOf = require('image-size');

var app = express();

app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/static'));
app.use('/client', browserify(__dirname + '/client'));

app.use('/images', serveJsonDir(__dirname + '/images'));
app.use('/images', express.static(__dirname + '/images'));

app.get('/tags/:image', function(req, res) {
  var tagData = JSON.parse(fs.readFileSync(__dirname + '/tags/index.json'));
  var tags = tagData[req.params.image] || [];
  res.json(tags).end();
});

app.get('/tags', function(req, res) {
  res.setHeader('content-type', 'text/html');
  var tags = JSON.parse(fs.readFileSync(__dirname + '/tags/index.json'));
  res.send('<pre>' + JSON.stringify(tags, null, 4) + '</tags>').end();
});

app.get('/idl', function(req, res) {
  var padding = parseInt(req.query.padding);
  fs.readFile(__dirname + '/tags/index.json', function(err, data) {
    var tags = JSON.parse(data);
    var converted = {};
    Object.keys(tags).forEach(function(image) {
      var size = { width: -Infinity, height: -Infinity };
      try {
        size = sizeOf(__dirname + '/images/' + image);
      } catch(e) {
        console.log('Cannot get image size', e.message);
      }

      converted[image] = tags[image].map(function(tag) {
        var xCoords = tag.map(function(coord) { return coord[0]; }), 
            yCoords = tag.map(function(coord) { return coord[1]; });

        return [
          Math.min(Math.min.apply(Math, xCoords) + Math.ceil(padding / 2), size.width),
          Math.min(Math.min.apply(Math, yCoords) + Math.ceil(padding / 2), size.height),
          Math.min(Math.max.apply(Math, xCoords) + Math.ceil(padding / 2), size.width), 
          Math.min(Math.max.apply(Math, yCoords) + Math.ceil(padding / 2), size.height)];
      });
    });

    var output = '';
    Object.keys(converted).forEach(function(image) {
      output += '"' + image + '": ';

      output += converted[image].map(function(tag) {
        return '(' + tag.join(', ') + ')'
      }).join(', ') + ';' + "\n";
    });
    res.setHeader('content-type', 'text/html');
    res.send('<pre>' + output + '</pre>').end();
  });
});
app.post('/tags', function(req, res) {
  var tagData = JSON.parse(fs.readFileSync(__dirname + '/tags/index.json'));

  var info = req.body;
  tagData[info.image] = tagData[info.image] || [];
  tagData[info.image] = info.tags;
  
  fs.writeFileSync(__dirname + '/tags/index.json', JSON.stringify(tagData));
  res.status(200).end();
});
app.listen(package.port, function() {
  console.log('Started listening on port', package.port);
});

var liveReloadServer = livereload.createServer();
liveReloadServer.watch(__dirname + '/client');
liveReloadServer.watch(__dirname + '/static');
