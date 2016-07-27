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

$('#view_json').on('click', function() {
  window.open('/tags?pretty=true');
});

$('#view_idl').on('click', function() {
  window.open('/idl?padding=' + ($('#padding').val() || 0) );
});


window.getTagsForImage = function(image) {
  return tags[image];
}

function paramsForImage(taggedImage) {
  return 'image=' + encodeURIComponent(taggedImage.name) + '&size=' + encodeURIComponent(JSON.stringify(size));
}

function naturalCompare(a, b) {
  var ax = [], bx = [];

  a.name.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
  b.name.replace(/(\d+)|(\D+)/g, function(_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });

  while(ax.length && bx.length) {
    var an = ax.shift();
    var bn = bx.shift();
    var nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
    if(nn) return nn;
  }

  return ax.length - bx.length;
}

function paginate(pageSize, data) {
  var currentPage = 1,
      currentOffset = 0,
      contents = [],
      pageIterator = undefined,
      cb = undefined;

  return {
    init: function() {
      contents = data.slice(currentOffset, currentOffset + pageSize);
      cb(this);
      return this;
    },
    pages: function() {
      Math.ceil(data.length / pageSize);
    },
    pageIterator: function() {
      var nextIndex = 0;

      var self = this;
      return {
        loop: function(cb) {
          if(nextIndex < contents.length) {
            return { item: contents[nextIndex++] };
          } else {
            self.next();
            nextIndex = 0;
            return { item: contents[nextIndex++] };
          }
        }
      };
    },
    go: function(page) {
      currentPage = page;
      currentOffset = pageSize * (page - 1);
      contents = data.slice(currentOffset, currentOffset + pageSize);
      
      if(cb) cb(this);
    },
    state: function() {
      return {
        page: currentPage,
        offset: (currentOffset - pageSize) > 0 ? currentOffset - pageSize : currentOffset,
        contents: contents,
        totalCount: data.length,
        pages: Math.ceil(data.length / pageSize)
      };
  
      if(cb) cb(this);
      return this;
    },
    next: function() {
      currentOffset += pageSize;
      if(currentOffset >= (data.length)) {
        currentOffset = 0;
        currentPage = 1;
      }
      contents = data.slice(currentOffset, currentOffset + pageSize);
      if(cb) cb(this);
      return this;
    },
    previous: function() {
      currentOffset -= pageSize;
      if(currentOffset < 0) currentOffset = (data.length + 1) - pageSize;
      contents = data.slice(currentOffset, currentOffset + pageSize);

      if(cb) cb(this);
      return this;
    },
    cb: function(_cb) {
      cb = _cb;
      return this;
    }
  };
}

function renderIndex($containerEl, $paginatorEl) {
  return function(paginator) {
    $containerEl.empty();
    $paginatorEl.empty();

    var taggedImages = [];

    var state = paginator.state();
    for(var i = 1; i <= state.pages; i++) {
      var $anchor = $('<a>' + i + '</a>');
      $anchor.addClass('page');
      $anchor.attr('href', '#');
      $anchor[0].page = i;
      $paginatorEl.append($anchor);

      if(state.page === i) {
        $anchor.addClass('current');
        $anchor[0].scrollIntoView(0);
      }

      $anchor.on('click', function(e) {
        paginator.go(e.target.page);
        e.preventDefault();
        return false;
      });
    }

    console.log('state!', state);

    state.contents.forEach(function(taggedImage, index) {
      var $taggedImageEl = $('<iframe></iframe');
      $taggedImageEl.attr('height', size.thumbnail.y).attr('width', size.thumbnail.x);
      $taggedImageEl.attr('id', taggedImage.name);
      var params = paramsForImage(taggedImage);
      $taggedImageEl.attr('src', '/container.html?' + params);
      $taggedImageEl.params = params; 
      $containerEl.append($taggedImageEl);
      taggedImages.push($taggedImageEl);
    });
    
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
        $(e.target).addClass('active');
      }, function(e) {
        $(e.target)[0].iframe.removeClass('active');
        $(e.target).removeClass('active');
      });
      $containerEl.append($proxyEl);
    });
  }
}

$.getJSON('/images', function(data) {
  window.getNext = function(image) {
    var index = data.findIndex(function(taggedImage) {
      return taggedImage.name === image;
    });
    var next = data[index + 1] || data[0];

    return paramsForImage(next);
  }

  var $containerEl = $('#container');
  $containerEl.css({
    width: Math.floor($(window).width() / size.thumbnail.x) * size.thumbnail.x + 'px',
    margin: '0 auto',
    border: '1px solid #ccc'
  });
  $('body').append($containerEl);
 
  data.filter(function(item) {
    return item.type === "file";
  }).sort(naturalCompare);

  var paginator = paginate(30, data);
  paginator.cb(renderIndex($containerEl, $('#paginator'))).init();
});
