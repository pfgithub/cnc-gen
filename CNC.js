"use strict";

var bezier = require('bezier-curve');

var start = "G17\n\
G0Z0.0020\n\
G0X0.0000Y0.0000";

var end = "G0Z0\n\
G0X0Y0Z0A0\n\
M30";

function CNC(cardboardSize, width, height, rotationCutoff){
  this.instructions = [];

  this.cardboardSize = cardboardSize;
  this.width = width;
  this.height = height;
  this.widthOffset = 0;
  this.heightOffset = 0;
  this.rotationCutoff = rotationCutoff;

  this.prevtangle = 0;

  this.xoffset = 0;
  this.yoffset = 0;
}

CNC.prototype.goTo = function(x, y, alsoRotate){
  if(alsoRotate){
    console.log("alsorotate is disabled");
    //throw new Error("alsoRotate is disabled");
    /*this.addInstruction([
      ["G", 0],
      ["X", (x * this.width + this.xoffset * this.width) + this.xoffset],
      ["Y", (y * this.height + this.yoffset * this.height) + this.yoffset],
      ["A", alsoRotate]
    ]);*/
  }else{
    this.addInstruction([
      ["G", 0],
      ["X", (x * this.width + this.widthOffset * this.width) + this.xoffset],
      ["Y", (y * this.height + this.heightOffset * this.height) + this.yoffset]
    ]);
  }
};
CNC.prototype.drawLine = function(startX, startY, endX, endY){
  this.stab(0);
  this.facePoint(startX, startY, endX, endY);
  this.goTo(startX, startY);
  this.stab(1);
  this.goTo(endX, endY);
  this.stab(0);
};
CNC.prototype.drawBezier = function(curve, quality){
  this.addInstruction([["G", 64]]);
  //var quality = Math.pow(10,-qval);

  var prevpoint = [];
  var prevrot = 0;
  for(var t = 0; t < 1; t += quality){
    var point = bezier(t, curve);
    if(prevpoint[1]){
      var currRot = this.calculateAngle(prevpoint[0], prevpoint[1], point[0], point[1]);
      if(Math.abs(prevrot - currRot) > this.rotationCutoff){
        this.stab(0);
        /*this.addInstruction([
          ["G", 4],
          ["P", 10]
        ]);*/
      }
      this.facePoint(currRot);
      if(Math.abs(prevrot - currRot) > this.rotationCutoff){
        this.stab(1);
        /*this.addInstruction([
          ["G", 4],
          ["P", 10]
        ]);*/
      }
      prevrot = currRot;
    }else{
      this.stab(0);
      prevrot = this.facePoint(point[0], point[1], bezier(t + quality, curve)[0], bezier(t + quality, curve)[1]);
    }
    this.goTo(point[0], point[1]);
    if(!prevpoint[1])this.stab(1);
    prevpoint = point;
  }

  this.addInstruction([["G", 61]]);
  this.stab(0);
};
CNC.prototype.calculateAngle = function(startX, startY, endX, endY){
  var dX = endX * this.width - startX * this.width;
  var dY = endY * this.height - startY * this.height;

  return(Math.atan2(dY, dX) * 180 / Math.PI);
};
CNC.prototype.crease = function(startX, startY, endX, endY){
  // 3 in below
  // -> works -> CNC.prototype.drawLine(startX, startY + 3, endX, endY + 3);
};
CNC.prototype.setTool = function(tool){
  if(tool == "crease"){
    this.yoffset = this.cardboardSize[3];
    this.xoffset = 0;
  }else{
    this.xoffset = 0;
    this.yoffset = 0;
  }
};
CNC.prototype.facePoint = function(startX, startY, endX, endY){
  this.rotate(startY ? this.calculateAngle(startX, startY, endX, endY) : startX);

  return startY ? this.calculateAngle(startX, startY, endX, endY) : startX;
};
CNC.prototype.rotate = function(direction){
  this.addInstruction([["G", 91]]);
  var tangle = direction % 360;
  if(tangle < 0)tangle += 360;
  this.addInstruction([
    ["G", 0],
    ["A", tangle - this.prevtangle]
  ]);
  this.prevtangle = tangle;
  this.addInstruction([["G", 90]]);
};

CNC.prototype.stab = function(ammount){
  this.addInstruction([
    ["G", 0],
    ["Z", this.cardboardSize[1] * ammount + this.cardboardSize[0]]
  ]);
};

CNC.prototype.generate = function(){
  this.rotate(0);
  this.stab(0);

  var genString = [start];
  this.instructions.forEach(function(instruction){
    var gss = [];
    instruction.forEach(function(instPiece){
      gss.push(instPiece.join(""));
    });
    genString.push(gss.join(""));
  });
  genString.push(end);
  return genString.join("\n");
};

CNC.prototype.addInstruction = function(instruction){
  this.instructions.push(instruction);
};

module.exports = CNC;
