var express = require('express');
var app = express();
var bodyParser = require("body-parser");

var convert = require("./converter.js")

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({}));

app.get('/', function (req, res) {
  res.render('controlpanel');
});

function getObjectFor(body,letters){
  var ans = {};
  (letters.split ? letters.split(",") : letters).forEach(function(l){
    ans[l] = body[l];
  });
  return ans;
}

app.post('/get.php', function(req,res){
  // s - scale, o - output, l - rotation-cutoff, d - depth, e - scratch, f- crease, ho - height-offset, p - crease-offset, m - x-multiplier, n - y-multiplier, c - crease-input
  console.log(req);
  var result = convert(
    getObjectFor(req.body,"l,d,e,f,ho,p,m,n"),
    "input...",
    "creaseinput..."
  );

  res.send(result);
});

app.listen(process.env.port || 3000, function () {
  console.log('Example app listening on port 3000!');
});
