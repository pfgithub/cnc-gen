var CNC = require("./CNC");
var arcToBezier = require("svg-arc-to-cubic-bezier").default;
var parseSVG = require('svg-path-parser');

module.exports = function convert(argv,path,creasepath){
  function doStuff(svg){
    var wd = svg.split("\n").join("");
    var rgx = new RegExp(/\<path.+?\ d="(.+?)"/g);
    var resp = [];
    var ans = wd.replace(rgx, function(){
      resp.push(arguments[1]);
      return "";
    });
    //console.log(resp);
    return resp;
  }

    if(path.charAt(0) == "{"){
      path = JSON.parse(path);
    }else{
      path = {size:[500,500], paths: doStuff(path)};
    }
  var cnc = new CNC([argv.e, argv.d, argv.f,argv.p],argv.s * argv.m,path.size[1]/(path.size[0]/argv.s) * argv.n, argv.l == 0 ? -1 : argv.l);

  if(argv.c)cut(creasepath,true);
  cut(path);
  function cut(path, doordontdothings){
    cnc.setTool("cut");
    cnc.cardboardSize = [argv.e, doordontdothings ? argv.f : argv.d, argv.f,argv.p];
    if(doordontdothings){
      cnc.setTool("crease");


      if(path.charAt(0) == "{"){
        path = JSON.parse(path);
      }else{
        path = {size:[500,500], paths: doStuff(path)};
      }
    }

    cnc.heightOffset = argv.ho - 2;
    //0 0              1913.3858,          1417.3228
    var scalefactor = [path.size[0],path.size[1]];

    var highestX = 0;
    var highestY = 0;

    path.paths.forEach(function(pathi){
      var parsed = parseSVG(pathi);
      var lnis = 0;
      var firstx = 0;
      var firsty = 0;

      var currentX = 0;
      var currentY = 0;

      var prevcurrentx;
      var precvurrenty;
      parsed.forEach(function(thing,i){

        //console.log(thing.x/scalefactor[0] + (thing.relative? currentX/scalefactor[0]:0),thing.y/scalefactor[1] + (thing.relative?currentY/scalefactor[1]:0));

        switch(thing.command){
          case "lineto":
          case "elliptical arc":
            lnis++;
            if(lnis == 1){
              firstx = currentX / scalefactor[0];
              firsty = currentY / scalefactor[1];
            }
            cnc.drawLine(currentX / scalefactor[0],currentY / scalefactor[1],thing.x / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),thing.y / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0));
            break;
          case "moveto":
            break;
          /*case "elliptical arc":
            //break;
            //lnis++;
            if(lnis == 1){
              firstx = currentX / scalefactor[0];
              firsty = currentY / scalefactor[1];
            }
            //console.log(thing);
            //var cX = thing.x + (thing.relative ? currentX : 0);
            //var cy = thing.y + (thing.relative ? currentY : 0);

            var curves = arcToBezier(
              {
                px: currentX,
                py: currentY,
                cx: thing.x,
                cy: thing.y,
                rx: thing.rx,
                ry: thing.ry,
                xAxisRotation: thing.xAxisRotation,
                largeArcFlag: thing.largeArc ? 30 : 0,
                sweepFlag : thing.sweep ? 30 : 0
              }
            );
            var rtg = thing.relative;
            curves.forEach(function(thing){

              console.log(thing, [
                [
                  currentX / scalefactor[0],
                  currentY / scalefactor[1]
                ], [
                  thing.x1 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y1 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)
                ], [
                  thing.x2 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y2 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)
                ], [
                  thing.x / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)]
              ]);
              thing.relative = rtg;
              cnc.drawBezier([
                [
                  currentX / scalefactor[0],
                  currentY / scalefactor[1]
                ], [
                  thing.x1 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y1 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)
                ], [
                  thing.x2 / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y2 / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)
                ], [
                  thing.x / scalefactor[0] + (thing.relative ? currentX / scalefactor[0] : 0),
                  thing.y / scalefactor[1] + (thing.relative ? currentY / scalefactor[1] : 0)]
              ],
              0.1);
              //break;
            });
            break;*/
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
  }

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
  return cnc.generate();
}
