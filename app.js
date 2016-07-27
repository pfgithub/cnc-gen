var express = require('express');
var app = express();
var bodyParser = require("body-parser");
var fileUpload = require('express-fileupload');

var convert = require("./converter.js")

app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({}));
app.use(fileUpload());

app.get('/', function (req, res) {
  res.render('controlpanel');
});

function getObjectFor(body,letters){
  var ans = {};
  (letters.split ? letters.split(",") : letters).forEach(function(l){
    ans[l] = parseFloat(body[l]);
  });
  return ans;
}

app.post('/get.php', function(req,res){
  // s - scale, o - output, l - rotation-cutoff, d - depth, e - scratch, f- crease, ho - height-offset, p - crease-offset, m - x-multiplier, n - y-multiplier, c - crease-input
  //console.log();
  var objr = getObjectFor(req.body,"s,l,d,e,f,ho,p,m,n");
  objr.c = true;
  console.log(objr);
  var result = convert(
    objr,
    req.files.cut.data.toString("utf8"),
    req.files.crease ? req.files.crease.data.toString("utf8") : undefined
  );

  console.log(req.body);

  res.setHeader('Content-type', "application/octet-stream");
  res.setHeader('Content-disposition', 'attachment; filename='+req.body.name+(new Date()).getTime()+'.tap');
  res.send( new Buffer(result) );
});

app.listen(process.env.port || 3000, function () {
  console.log('Example app listening on port 3000!');
});
