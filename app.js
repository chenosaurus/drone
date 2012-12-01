var express = require('express');
var Firebase  = require('./lib/firebase-node');


var app = express();

app.use(express.static(__dirname + '/public'));

app.listen(3000);