var bezier = require('bezier-curve');

var start = "G17\n\
G0Z0.0020\n\
G0X0.0000Y0.0000";

var end="M30";

function CNC(cardboardSize, width, height,rotationCutoff){
  this.instructions = [];

  this.cardboardSize = cardboardSize;
  this.width = width;
  this.height = height;
  this.rotationCutoff = rotationCutoff;
};

CNC.prototype.goTo = function(x,y,alsoRotate){
  if(alsoRotate){
    this.addInstruction([
      ["G", 0],
      ["X", x * this.width],
      ["Y", y * this.height],
      ["A", alsoRotate]
    ]);
  }else{
    this.addInstruction([
      ["G", 0],
      ["X", x * this.width],
      ["Y", y * this.height]
    ]);
  }
};
CNC.prototype.drawLine = function(startX,startY,endX,endY){
  this.stab(0);
  this.facePoint(startX,startY,endX,endY);
  this.goTo(startX,startY);
  this.stab(1);
  this.goTo(endX,endY);
  this.stab(0);
}
CNC.prototype.drawBezier = function(curve, quality){
  //var quality = Math.pow(10,-qval);

  var prevpoint = [];
  var prevrot = 0;
  for(var t=0; t<1; t+=quality) {
    var point = bezier(t, curve);
    if(prevpoint[1]){
      var currRot = this.calculateAngle(prevpoint[0],prevpoint[1],point[0],point[1]);
      if(Math.abs(prevrot - currRot) > this.rotationCutoff){
        this.stab(0);
      }
      this.facePoint(currRot);
      if(Math.abs(prevrot - currRot) > this.rotationCutoff){
        this.stab(1);
      }
      prevrot = currRot;
    }else{
      this.stab(0);
      prevrot = this.facePoint(point[0],point[1],bezier(t+quality,curve)[0],bezier(t+quality,curve)[1]);
    }
    this.goTo(point[0],point[1]);
    if(!prevpoint[1])this.stab(1);
    prevpoint = point;
  }
  this.stab(0);
}
CNC.prototype.calculateAngle = function(startX,startY,endX,endY){
  dX = endX * this.width - startX * this.width;
  dY = endY * this.height - startY * this.height;

  return(Math.atan2(dY, dX) * 180 / Math.PI);
}
CNC.prototype.facePoint = function(startX, startY, endX, endY){

  this.rotate(startY ? this.calculateAngle(startX,startY,endX,endY) : startX);

  return startY ? this.calculateAngle(startX,startY,endX,endY) : startX;
};
CNC.prototype.rotate = function(direction){
  tangle = direction % 360;
  if(tangle<0)tangle+=360;
  this.addInstruction([
    ["G", 0],
    ["A", tangle]
  ]);
}

CNC.prototype.stab = function(ammount){
  this.addInstruction([
    ["G", 0],
    ["Z", this.cardboardSize[1]*ammount+this.cardboardSize[0]]
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
  this.instructions.push( instruction);
};

module.exports = CNC;
