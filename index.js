var CNC = require("./CNC");
var fs = require("fs");
var lines = require("./shape.json");
var argv = require('yargs')
  .alias("w", "width")
  .describe("w", "The width (in px) of your input file")
  .alias("h", "height")
  .describe("h", "The height (in px) of your input file")
  .alias("s", "scale")
  .describe("s", "The width of the resulting output file")
  .alias("o", "output")
  .describe("o", "The location to put the resulting .tap file (overrites without warning!)")

  .alias("l", "rotation-cutoff")
  .default("l", 10)
  .describe("l", "The ammount allowed to be turned without pulling out the cutting tool (set to 360 if there is no rotation)")

  .alias("d", "depth")
  .default("d", -0.5)
  .describe("d", "The ammount to put the cutting tool in so that it is just peaking out the other side")

  .alias("e", "scratch")
  .default("e", 0)
  .describe("e", "The ammount to put the cutting tool in so that it is a little bit infront of where it starts to cut the surface")

  .alias("m", "x-multiplier")
  .default("m",1)
  .describe("m", "The ammount to multiply final X values by")
  .alias("n", "y-multiplier")
  .default("n",-1)
  .describe("n", "The ammount to multiply final Y values by")

  .help('help')

  .usage('Usage: $0 path/to/input/file --scale [num] --width [num] --height [num]')
  .demand(1)
  .demand(['w','h', 's'])
  .argv;

var parseSVG = require('svg-path-parser');
var path = require(argv._[0]);

var cnc = new CNC([argv.e,argv.d],argv.s * argv.m,argv.h/(argv.w/argv.s) * argv.n, argv.l); // 191.33858

//0 0              1913.3858,          1417.3228
var scalefactor = [argv.w,argv.h];
var currentX = 0;
var currentY = 0;

var highestX = 0;
var highestY = 0;

path.paths.forEach(function(pathi){
  var parsed = parseSVG(pathi);
  var lnis = 0;
  var firstx = 0;
  var firsty = 0;

  var prevcurrentx;
  var precvurrenty;
  parsed.forEach(function(thing,i){

    //console.log(thing.x/scalefactor[0] + (thing.relative? currentX/scalefactor[0]:0),thing.y/scalefactor[1] + (thing.relative?currentY/scalefactor[1]:0));

    switch(thing.command){
      case "lineto":
        lnis++;
        if(lnis == 1){
          firstx = currentX / scalefactor[0];
          firsty = currentY / scalefactor[1];
        }
        cnc.drawLine(currentX / scalefactor[0],currentY / scalefactor[1],thing.x / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),thing.y / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0));
        break;
      case "moveto":
        break;
      case "curveto":
        lnis++;
        if(lnis == 1){
          firstx = currentX / scalefactor[0];
          firsty = currentY / scalefactor[1];
        }
        cnc.drawBezier([[currentX / scalefactor[0], currentY / scalefactor[1]], [thing.x1 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0), thing.y1 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)], [thing.x2 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0), thing.y2 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)], [thing.x / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0), thing.y / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)]],0.1);
        break;
      case "closepath":
        if(parsed[i-1].command == "lineto" || parsed[i-1].command == "curveto"){
          cnc.drawLine(firstx,firsty,parsed[i-1].x / scalefactor[0] + (parsed[i-1].relative ? prevcurrentx / scalefactor[0] : 0),parsed[i-1].y / scalefactor[1] + (parsed[i-1].relative ? prevcurrenty / scalefactor[1] : 0));
        }
        break;
      default:
        console.log("WARN: Type "+thing.command+ " not supported");
    }

    prevcurrentx = currentX;
    prevcurrenty = currentY;

    if(thing.x)if(thing.relative)currentX += thing.x;else currentX = thing.x;
    if(thing.y)if(thing.relative)currentY += thing.y;else currentY = thing.y;

    if(currentX)highestX = Math.max(currentX,highestX);
    if(currentY)highestY = Math.max(currentY,highestY);
  });
});

console.log("required size is:", highestX,highestY);

/*lines.lines.forEach(function(line){
  switch (line.type){
    case "line":
      cnc.drawLine(line.x1,line.y1,line.x2,line.y2);
      break;
    case "bezier":
      cnc.drawBezier(line.bezier, line.quality);
  }
});*/

//cnc.drawBezier();

if(argv.o){
  fs.writeFile(argv.o, cnc.generate(), function (err) {
    if (err) throw err;
    console.log('It\'s saved! in same location.');
  });
}else{
  console.log(cnc.generate());
}
