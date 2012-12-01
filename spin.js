var arDrone = require('ar-drone'),
    fs      = require('fs'),
    cv      = require('opencv'),
    client  = arDrone.createClient(),
    exec    = require('child_process').exec,
    Firebase = require('./lib/firebase-node'),
    snaps   = new Firebase('https://drone.firebaseio.com/snaps');

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
}, 3000);

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
    startSteps();
  }, 2000);
}

function startSteps() {

  if (fly) {
    client.stop();
  }

  setInterval(function() {
    step();
  }, 1000);
}

function land() {
  client.land();
}


function step() {
  if (!found && fly) {
    //client.clockwise(0.2);
  }

  if (found) {
    console.log('tracking');

    client.animateLeds("blinkGreen", 5, 1);
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
    }, 700);
  }

  setTimeout(function() {

    if (!tracking) {    
      client.stop();
    }

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
      
      //make sure features are big
      for (var i = features.length - 1; i >=0; i--) {

        var f = features[i];

        if (f.height < 80 && f.width < 80) {
          features.splice(i, 1);
        } else {

          if (f.x < 180) {
            tracking = 1;
          } else if (f.x > 360) {
            tracking = 2;
          } else {
            tracking = 0;
          }
        }
      }

      if (features && features.length) {
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

    var date = +(new Date());
    var filename = "./detected/" + date + ".png";
    im.save(filename);
    snaps.push({file: filename});

    client.animateLeds("blinkOrange", 5, 2);
  });
}

//detect(saveDetected);
