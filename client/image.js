var $ = require('jquery');
var qs = require('query-string').parse(location.search);

var $img = $('<img></img>');
$img.attr('src', '/images/' + decodeURIComponent(qs.image));

document.title = "Image Tagger - " + qs.image;

$img.on('load', function() {
  var width  = $img[0].naturalWidth,
      height = $img[0].naturalHeight;

  var $canvas = $('<canvas></canvas>'),
      canvas = $canvas[0];
  $canvas.attr('width', width).attr('height', height);
  $canvas.css({
    top: '0px',
    left: '0px',
    position: 'absolute',
    zIndex: 99,
    cursor: 'crosshair'
  });

  var tags = [],
      ctx = $canvas[0].getContext('2d'),
      mouse = 0,
      dashList = [5, 5, 5, 5],
      currentScale = 1,
      buttons = [],
      offset = 0;

  if(window.parent) {
    if(window.parent._setSize) window.parent._setSize(width, height);
    if(window.parent._getTagsForImage) {
      tags = window.parent._getTagsForImage(decodeURIComponent(qs.image)) || [];
      tags.map(addRemoveButton);
    } else {
      $.get('/tags/' + qs.image, function(t) {
        tags = t;
        tags.map(addRemoveButton);
      });
    }
  }

  document.addEventListener('keyup', function(e) {
    if (e.keyCode === 32) {
      if(window.opener.getNext) {
        window.location = '/image.html?' + window.opener.getNext(decodeURIComponent(qs.image));
      }
      console.log('space');
      e.preventDefault();
      return false;
    }
  });

  window.updateTags = function(updatedTags) {
    tags = updatedTags || tags;
    removeAllButtons();
    tags.map(addRemoveButton);
  }

  function drawTag(tag, index) {
      if(index !== undefined) {
        ctx.restore();
        drawCoord(tag[index], index);
        ctx.save();
        tag.forEach(drawHandle);
      } else {
        ctx.restore();
        tag.forEach(drawCoord);
        ctx.save();
        tag.forEach(drawHandle);
      }
      drawBoundingBox(tag);

      function drawHandle(coord, index) {
        var r = 2;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.arc(coord[0], coord[1], r, 0, 2 * Math.PI);
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
      }
        
      function drawCoord(coord, index) {
        var x = coord[0],
            y = coord[1],
            originX = tag[0][0],
            originY = tag[0][1];

        switch(true) {
          case (index === 0):
            ctx.setLineDash(dashList);
            ctx.lineWidth = 1;
            ctx.lineDashOffset = offset;
            ctx.strokeStyle = 'yellow';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(x, y);
          break;

          case (index < 3 && index > 0):
            ctx.lineTo(x, y);
            ctx.stroke();
          break;

          case (index === 3):
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.lineTo(originX, originY);
            ctx.stroke();
            ctx.closePath();
            ctx.fill();
          break;
        }
      }
    }

    function drawBoundingBox(tag) {
      var xCoords = tag.map(function(coord) {
        return coord[0];
      }), yCoords = tag.map(function(coord) {
        return coord[1];
      });

      var tl = [Math.min.apply(Math, xCoords), Math.min.apply(Math, yCoords)],
          width = Math.max.apply(Math, xCoords) - tl[0],
          height = Math.max.apply(Math, yCoords) - tl[1];
      
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect(tl[0], tl[1], width, height);
      ctx.restore();
    }
   
    function getPolygonCenter(pts) {
      var first = pts[0], last = pts[pts.length-1];
      if (first.x != last.x || first.y != last.y) pts.push(first);
      var twicearea=0,
          x=0, y=0,
          nPts = pts.length,
          p1, p2, f;
      for ( var i=0, j=nPts-1 ; i<nPts ; j=i++ ) {
        p1 = pts[i]; p2 = pts[j];
        f = p1.x*p2.y - p2.x*p1.y;
        twicearea += f;          
        x += ( p1.x + p2.x ) * f;
        y += ( p1.y + p2.y ) * f;
      }
      f = twicearea * 3;
      return { x:x/f, y:y/f };
    }

    function removeAllButtons() {
      buttons.forEach(function($btn) {
        $btn.remove();
      });
    }
    
    /*function addRemoveButton(tag, offset) {
      var $btn = $('<button>Delete</button>');
      buttons.push($btn);
      $btn.css({
        position: 'absolute',
        zIndex: 99
      });
      var center = getPolygonCenter(tag.map(function(pos) {
        return { x: pos[0], y: pos[1] };
      }));
      $btn.css({
        left:  center.x * currentScale + 'px',
        top: center.y * currentScale + 'px'
      });
      $btn.tag = tag;
      $(document.body).append($btn);
      window.$btn = $btn;
      $btn.css({
        left: $btn.position().left - ($btn.width()) + 'px',
        top: $btn.position().top - ($btn.height()) + 'px'
      });

      $btn.click(function() {
        delete tags[offset];
        $btn.remove();
        saveTags();
      });
    }*/
    function addRemoveButton() {}
    
    var currentTag = [];
    function step() {
      offset++;
      if(offset > 20) offset = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tags.forEach(function(tag) {
        drawTag(tag.map(scale));
      });
      drawTag(currentTag.map(scale));
      window.requestAnimationFrame(step);
    }
    step();

    function saveTags() {
      $.ajax('/tags', { data: JSON.stringify({ image: qs.image, tags: tags.filter(function(tag) {
        return tag !== undefined;
      })}), contentType: 'application/json', type: 'POST' }).done(function() {
        $('#saved').fadeIn();
        if(!window.t) {
          window.t = setTimeout(function() {
            $('#saved').fadeOut();
            delete window.t;
          }, 2500);
        }
      }).fail(function() {
        $('#fail').fadeIn();
        if(!window.t) {
          window.t = setTimeout(function() {
            $('#fail').fadeOut();
            delete window.t;
          }, 2500);
        }
      });

      if(window.opener && window.opener.updateImage) {
        window.opener.updateImage(qs.image, tags);
      }
    }

    $canvas.click(function(e) {
      var length = currentTag.length;
      
      if(length < 3) {
        currentTag.push([(e.offsetX / currentScale) - mouse, (e.offsetY / currentScale) - mouse]);
      } else {
        currentTag.push([(e.offsetX / currentScale) - mouse, (e.offsetY / currentScale) - mouse]);
        tags.push(currentTag);
        addRemoveButton(currentTag, tags.length - 1);
        currentTag = [];
        saveTags();
      }
    });

    function scale(coords) {
      return [coords[0] * currentScale, coords[1] * currentScale];
    }
    
    $('body').append($canvas);
});
$('body').append($img);
