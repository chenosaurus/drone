var arDrone = require('ar-drone'),
    fs      = require('fs'),
    cv      = require('opencv'),
    client  = arDrone.createClient(),
    exec    = require('child_process').exec;

var shouldCapture = false;
var snap = undefined;
var found = false;

client.takeoff();


setTimeout(function() {
  takeoffSuccess();
}, 3000);

setTimeout(function() {
  land();
  //process.exit();
}, 30000);


function takeoffSuccess() {
  client.stop();

  client.up(1);

  setTimeout(function() {
    startSteps();
  }, 2000);
}

function startSteps() {
  client.stop();

  setInterval(function() {
    step();
  }, 2000);
}

function land() {
  client.land();
}


function step() {
  if (!found) {
    client.clockwise(0.2);
  }

  setTimeout(function() {

    client.stop();

    detect(saveDetected);
    saveImage();

  }, 1000);
}


// //client.animateLeds("blinkOrange", 5, 2);

//capture and store image
var pngStream = client.createPngStream();
pngStream.on('data', function(data) {
  snap = data;
});

function saveImage() {
  if (!snap) {
    return;
  }

  cv.readImage(snap, function(err, im) {
    im.save("./out.png");  
  });
}

//run script to detect 
function detect(cb) {
  exec('node detect',
    function (error, stdout, stderr) {
     
      var features = JSON.parse(stdout);
      
      if (features && features.length) {
        found = true;
        cb(features);
      } else {
        found = false;
      }
  });
}

function saveDetected(features) {
  cv.readImage('./out.png', function(err, im) {

    for(var i = 0; i < features.length; i++) {

      var f = features[i];
      //draw on it
      im.ellipse(f.x + f.width/2, f.y + f.height/2, f.width/2, f.height/2);     
    }

    var date = new Date();
    im.save("./detected/" + date.toString() + ".png");  
    
    client.animateLeds("blinkOrange", 5, 2);
  });
}

//detect(saveDetected);
