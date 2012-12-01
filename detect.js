var cv = require('opencv'),
    fs = require('fs');


//console.log(cv.version)
cv.readImage("./out.png", function(err, im){

  im.detectObject("./xml/fist.xml", {}, function(err, faces){  
 
    for (var i=0;i<faces.length; i++){
      var x = faces[i];
      //im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2);
    }

  	if (!faces || faces.length == 0) {
  	  console.log("[]");
  	} else {
      console.log(JSON.stringify(faces));
    }
    //im.save('./out.png');   
  });
});