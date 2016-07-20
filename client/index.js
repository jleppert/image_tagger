window.LiveReloadOptions = { host: 'localhost' };
require('livereload-js');

var $ = require('jquery');

var size = {
  viewport: {
    x: 1280,
    y: 1024
  },
  thumbnail: {
    x: 320,
    y: 240
  }
};

window.updateImage = function(image, tags) {
  try {
    document.getElementById(image).contentWindow.updateTags(tags);
  } catch(e) {
    console.log('Update image failed', image, e);
  }
}

var tags = {};
$.getJSON('/tags', function(data) {
  tags = data;
});

$('#view').on('click', function() {
  console.log('open!!');
  window.open('/tags');
});

window.getTagsForImage = function(image) {
  return tags[image];
}

function paramsForImage(taggedImage) {
  return 'image=' + encodeURIComponent(taggedImage.name) + '&size=' + encodeURIComponent(JSON.stringify(size));
}

$.getJSON('/images', function(data) {

  window.getNext = function(image) {
    var index = data.findIndex(function(taggedImage) {
      return taggedImage.name === image;
    });
    var next = data[index + 1] || data[0];

    return paramsForImage(next);
  }

  var $containerEl = $('<div></div>');
  $containerEl.css({
    width: Math.floor($(window).width() / size.thumbnail.x) * size.thumbnail.x + 'px',
    margin: '0 auto',
    border: '1px solid #ccc'
  });
  var taggedImages = [];
  data.forEach(function(taggedImage, index) {
    var $taggedImageEl = $('<iframe></iframe');
    $taggedImageEl.attr('height', size.thumbnail.y).attr('width', size.thumbnail.x);
    $taggedImageEl.attr('id', taggedImage.name);
    var params = paramsForImage(taggedImage);
    $taggedImageEl.attr('src', '/container.html?' + params);
    $taggedImageEl.params = params; 
    $containerEl.append($taggedImageEl);
    taggedImages.push($taggedImageEl);
  });

  $('body').append($containerEl);
  taggedImages.forEach(function($taggedImageEl) {
    var $proxyEl = $('<div></div>');
    $proxyEl.css({
      position: 'absolute',
      zIndex: 99,
      height: size.thumbnail.y + 'px',
      width: size.thumbnail.x + 'px',
      cursor: 'pointer'
    });
    $proxyEl.css({
      top: $taggedImageEl.position().top,
      left: $taggedImageEl.position().left
    });
    $proxyEl[0].iframe = $taggedImageEl;
    $proxyEl.on('click', function(e) {
      window.open('/image.html?' + $(e.target)[0].iframe.params);
    }).hover(function(e) {
      $(e.target)[0].iframe.addClass('active');
    }, function(e) {
      $(e.target)[0].iframe.removeClass('active');
    });
    $containerEl.append($proxyEl);
  });
});
