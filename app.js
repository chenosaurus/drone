var express = require('express');
var Firebase  = require('./lib/firebase-node');


var node = new Firebase('https://drone.firebaseio.com/snaps');


var app = express();

app.use(express.static(__dirname + '/public'));

app.listen(3000);