var arDrone = require('ar-drone'),
    fs      = require('fs'),
    cv      = require('opencv'),
    client  = arDrone.createClient();

client.animateLeds("blinkOrange", 5, 2);
var currentSnapshot = undefined;
var i = 0;

var pngStream = client.createPngStream();


pngStream.on('data', function(data) {
  console.log(data)
  currentSnapshot = data;
});

setInterval(function() {
  console.log('checking current snapshot');

  if (!currentSnapshot) { 
    return; 
  }

  detect(currentSnapshot);
}, 2000);

function detect(data) {
  try {

    cv.readImage(data, function(err, im) {

      if (err) console.log('readImage error', err);

      im.save('./current.png');

      im.detectObject("./xml/fist.xml", {}, function(err, features) {

        if (features.length > 0) {
          captured = true;
          console.log('features detected!');

          for(var i = 0; i < features.length; i++) {

            var f = features[i];
            //draw on it
            im.ellipse(f.x + f.width/2, f.y + f.height/2, f.width/2, f.height/2);

            
          }

          i++;
          im.save("./detected/" + i + ".png");  
          client.animateLeds("blinkOrange", 5, 2);
        }
      });
    });
  } catch (e) {
    console.log('opencv error');
  }
}