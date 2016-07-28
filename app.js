var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var fileUpload = require('express-fileupload');

var convert = require("./converter.js");

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({}));
app.use(fileUpload());

app.get('/', function(req, res){
  res.redirect('/index.php');
});

app.get('/index.php', function(req, res){
  res.render('controlpanel');
});

app.get('/style.css', function(req, res){
  res.sendFile(__dirname + "/styles/style.css");
});

app.get('/normalize.css', function(req, res){
  res.sendFile(__dirname + "/styles/normalize.css");
});

function getRandomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.get('/cardboard.jpg', function(req, res){
  res.sendFile(__dirname + "/images/cardboard" + getRandomInt(1, 5) + ".jpg");
});

app.get('/script.js', function(req, res){
  res.sendFile(__dirname + "/activate-power-mode.js");
});

app.get('/small-triangle.png', function(req, res){
  res.sendFile(__dirname + "/images/small-triangle.png");
});

function getObjectFor(body, letters){
  var ans = {};
  (letters.split ? letters.split(",") : letters).forEach(function(l){
    ans[l] = parseFloat(body[l]);
  });
  return ans;
}

app.post('/get.php', function(req, res){
  // s - scale, o - output, l - rotation-cutoff, d - depth, e - scratch, f- crease, ho - height-offset, p - crease-offset, m - x-multiplier, n - y-multiplier, c - crease-input
  //console.log();
  var objr = getObjectFor(req.body, "s,l,d,e,f,ho,p,m,n");
  objr.c = true;
  console.log(objr);
  var result = convert(
    objr,
    req.files.cut.data.toString("utf8"),
    req.files.crease ? req.files.crease.data.toString("utf8") : undefined
  );

  console.log(req.body);

  // + rules : 10 + 21 ok, "10"+"21" ok, 10+21 not ok, "10" + "21" not ok, "10"+variable ok, 10+variable not ok, "ten"+10 ok

  res.setHeader('Content-type', "application/octet-stream");
  res.setHeader('Content-disposition', 'attachment; filename=' + req.body.name.toLowerCase().split(" ").join("-") + "-" + (new Date()).getTime() + '.tap');
  res.send(new Buffer(result));
});

app.listen(process.env.port || 3000, function(){
  console.log('Example app listening on port 3000!');
});
