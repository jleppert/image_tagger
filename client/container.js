var $ = require('jquery');
var qs = require('query-string').parse(location.search);
var size = JSON.parse(decodeURIComponent(qs.size));

var $container = $('<iframe></iframe>');
function setParentSize(width, height) {
  var scale = [size.thumbnail.x / size.viewport.x, size.thumbnail.y / size.viewport.y];
  $container.attr('width', width);
  $container.attr('height', height);

  $container.css({
    transform: 'scale(' + scale.join(', ') + ')',
    transformOrigin: '0 0 0',
    border: 'none'
  });
}

function getTagsForImage(image) {
  return window.parent.getTagsForImage(image);
}

window.updateTags = function(tags) {
  $container[0].contentWindow.updateTags(tags);
}

$container.on('load', (function(qs) {
  return function() {
    this.contentWindow.document.body.style.padding = '0';
    this.contentWindow.document.body.style.margin = '0';
    var image = document.createElement('iframe');
    image.src = '/image.html' + location.search;
    image.height = '100%';
    image.width = '100%';
    image.style.border = 'none';
    this.contentWindow._setSize = function(width, height) {
      setParentSize(width, height); 
    }
    this.contentWindow._getTagsForImage = function(image) {
      return getTagsForImage(image);
    }
    this.contentWindow.updateTags = function(tags) {
      image.contentWindow.updateTags(tags);
    }
    this.contentWindow.document.body.appendChild(image);
  }
})(qs));

$container.attr('src', 'javascript://');
$('body').append($container);
