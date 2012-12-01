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
var vTracking = 0;
var x = 0;
var y = 0;

//capture and store image
var pngStream = client.createPngStream();
pngStream.on('data', function(data) {
  snap = data;
});


if (fly) {
  client.takeoff();
}


setTimeout(function() {
  takeoffSuccess();
}, 5000);

setTimeout(function() {
  land();
  //process.exit();
}, 40000);


function takeoffSuccess() {
  if (fly) {
    client.stop();
  }

  setTimeout(function() {

    client.up(.8);
  }, 500);

  setTimeout(function() {
    start();
  }, 1200);
}


function start() {

  if (fly) {
    client.stop();
  }

  setInterval(function() {
  
    detect();

  }, 700);

  // setInterval(function() {
  //   track();
  // }, 500);
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
        client.counterClockwise(0.4);

      } else if (tracking = 3) {

        console.log('hard left');
        client.counterClockwise(0.7);

      } else if (tracking = 4) {

        console.log('hard right');
        client.clockwise(0.7);
       
      } else if (tracking == 2) {

        console.log('right');
        client.clockwise(0.4);

      } else {

        console.log('centered');

      }

      // if (vTracking == 1) {

      //   console.log('up');
      //   client.up(0.6);

      // } else if (vTracking == 2) {

      //   console.log('down');
      //   client.down(0.6);

      // } else {

      //   console.log('vertically centered');

      // }

      setTimeout(function() {
        client.stop();
      }, 130);
    }

    found = false;
    tracking = 0;
    vTracking = 0;

}


// //client.animateLeds("blinkOrange", 5, 2);
function saveImage() {
  if (!snap) {
    return;
  }

  cv.readImage(snap, function(err, im) {
    im.save("./out.png");  
  });
}

setInterval(function() {
  saveImage();
}, 100);


//run script to detect 
function detect() {

  found = false;
  exec('node detect',
    function (error, stdout, stderr) {
      
      var features = [];
      try {
        features = JSON.parse(stdout);
      } catch(e) {
        console.log("opencv error");
      } 

      var falsePos = false;
      //make sure features are big and only 1

      console.log('found ' + features.length + ' features');
      if (features.length > 1) {
        falsePos = true;
        tracking = 0;
      }

      for (var i = features.length - 1; i >=0; i--) {

        var f = features[i];

        if (f.height < 70 && f.width < 70) {
          features.splice(i, 1);
        } else {

          if (f.x < 190) {
            tracking = 3;
          } else if (f.x < 230) {
            tracking = 1;
          } else if (f.x > 440) {
            tracking = 4;
          } else if (f.x > 410) {
            tracking = 2;
          } else {
            tracking = 0;
          }

          x = f.x;
          console.log('x: ', x);

          if (f.y < 60) {
            vTracking = 2;
          } else if (f.y > 300) {
            vTracking = 1;
          } else {
            vTracking = 0;
          }

          y = f.y;
          console.log('y: ', y);
        }
      }

      if (features && features.length && !falsePos) {
        //start tracking
        found = true;
        track();
        saveDetected(features);
      } else {
        found = false;
      }

     
  });
}

function reset() {
  tracking = 0;
  vTracking = 0;
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
