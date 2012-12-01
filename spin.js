var arDrone = require('ar-drone'),
    fs      = require('fs'),
    cv      = require('opencv'),
    client  = arDrone.createClient(),
    exec    = require('child_process').exec;

var fly = true;

var shouldCapture = false;
var snap = undefined;
var found = false;
var tracking = 0; // 0- center, 1 - left, 2 - right

if (fly) {
  client.takeoff();
}


setTimeout(function() {
  takeoffSuccess();
}, 5000);

setTimeout(function() {
  land();
  //process.exit();
}, 30000);


function takeoffSuccess() {
  if (fly) {
    client.stop();
  }

  setTimeout(function() {

    client.up(.8);
  }, 500);

  setTimeout(function() {
    start();
  }, 1500);
}

function start() {

  if (fly) {
    client.stop();
  }

  setInterval(function() {
  
    detect(saveDetected);
    saveImage();

  }, 1000);

  setInterval(function() {
    track();
  }, 1000);
}

function land() {
  client.land();
}

///TRACKING 
// call tracking every 500 ms, rotate if tracked obj is found

function track() {

  if (found) {
      console.log('tracking');

      client.animateLeds("blinkGreen", 3, 1);

      if (tracking == 1) {

        console.log('left');
        client.counterClockwise(0.2);

      } else if (tracking == 2) {

        console.log('right');
        client.clockwise(0.2);

      } else {

        console.log('centered');

      }

      setTimeout(function() {
        client.stop();
      }, 800);
    }

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
      
      var falsePos = false;
      //make sure features are big and only 1

      console.log('found ' + features.length + ' features');
      if (features.length > 1) {
        falsePos = true;
        tracking = 0;
      }

      for (var i = features.length - 1; i >=0; i--) {

        var f = features[i];

        if (f.height < 80 && f.width < 80) {
          features.splice(i, 1);
        } else {

          if (f.x < 200) {
            tracking = 1;
          } else if (f.x > 300) {
            tracking = 2;
          } else {
            tracking = 0;
          }
        }
      }

      if (features && features.length && !falsePos) {
        //start tracking
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
      console.log(f);
    }

    var date = new Date();
    im.save("./detected/" + date.toString() + ".png");  
    
    client.animateLeds("blinkOrange", 5, 2);
  });
}

//detect(saveDetected);
