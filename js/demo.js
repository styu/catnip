$(document).ready(function() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    demoType = $('#canvas').attr('name');
    var isMoving = false;
    var started = false;

    $('#canvas').mousedown(function() {
      if (demoType == 'draw') {
        isMoving = true;
      }
    });

    $('#canvas').mouseup(function() {
      if (demoType == 'draw') {
        isMoving = false;
        started = false;
      }
    });

    $('#canvas').mousemove(function(event) {
      if (demoType == 'draw' && isMoving) {
        mouseDemo(event);
      }
    });

    function mouseDemo(ev) {
      var x, y;

      // Get the mouse position relative to the canvas element.
      if (ev.layerX || ev.layerX == 0) { // Firefox
        x = ev.layerX;
        y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
      }

      // The event handler works like a drawing pencil which tracks the mouse 
      // movements. We start drawing a path made up of lines.
      if (!started) {
        context.beginPath();
        context.moveTo(x, y);
        started = true;
      } else {
        context.lineTo(x, y);
        context.stroke();
      }
    }
});