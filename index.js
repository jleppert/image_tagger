var express = require('express'),
    browserify = require('browserify-middleware'),
    livereload = require('livereload'),
    serveJsonDir = require('express-serve-json-dir'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    package = require('./package.json');

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
  res.setHeader('content-type', 'application/json');
  fs.createReadStream(__dirname + '/tags/index.json').pipe(res);
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
