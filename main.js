function sigmoid(value){//between 0 and 1
  return 1/(Math.pow(Math.E, -value)+1);
}

function modulus(value, mod){
  var v = value%mod;
  if(v<0){
    v+=mod;
  }
  return v;
}

function normalizeAngle(theta){
  return theta%(Math.PI*2);
}

function angleDif(angle1, angle2){
  return modulus((angle2 - angle1 + Math.PI), Math.PI*2) - Math.PI;
}

function sum(arr){
  var sum = 0;
  for(var i in arr){
    sum += arr[i];
  }
  return sum;
}

function averageAngle(angleArr, weights){
  if(angleArr.length === 0){
    return 0;
  }
  
  var sum = [0,0];
  for(var i in angleArr){
    if(weights !== undefined){
      sum[0] += Math.cos(angleArr[i])*weights[i];
      sum[1] += Math.sin(angleArr[i])*weights[i];
    }else{
      sum[0] += Math.cos(angleArr[i]);
      sum[1] += Math.sin(angleArr[i]);
    }
  }
  
  return Math.atan2(sum[1], sum[0]);
}

function dist(pos1, pos2){
  return Math.sqrt(Math.pow(pos1[0]-pos2[0],2) + Math.pow(pos1[1]-pos2[1],2));
}

function average(arr){
  return sum(arr)/arr.length;
}

function averagePos(arrOfPos, weights, returnSum){
  if(arrOfPos.length === 0){
    return [0,0];
  }
  
  var sum = [0,0];
  var wSum = 0;
  for(var i in arrOfPos){
    if(weights !== undefined){
      sum[0] += arrOfPos[i][0]*weights[i];
      sum[1] += arrOfPos[i][1]*weights[i];
      wSum += weights[i];
    }else{
      sum[0] += arrOfPos[i][0];
      sum[1] += arrOfPos[i][1];
      wSum++;
    }
  }
  sum[0] /= wSum;
  sum[1] /= wSum;
  
  if(returnSum){
    return [sum, wSum];
  }else{
    return sum;
  }
}

function apply(fn, arr){
  var outArr = [];
  for(var i in arr){
    outArr.push(fn(arr[i]));
  }
  return outArr;
}

function frontDist(y){
  return function(x){
    if(x<y){
      return 1;
  	}else{
      return 0;
    }
  };
}

class Being{
  constructor(position, moveFn){
    //constants
    this.maxTurn = 0.04;
    this.maxSpeed = 6;
	  this.minSpeed = 6;
    this.maxDeltaSpeed = 1;

	  //others
	  this.position = position;
    this.moveFn = moveFn;
    this.angle = normalizeAngle(Math.random()*Math.PI*2);
    this.speed = this.minSpeed;
  }
  
  move(worldState){
    var movement = this.moveFn(worldState);
    
    this.changeSpeed(movement[0]);
    this.forward();
    this.turn(movement[1]);
    
    this.position[0] = modulus(this.position[0], document.body.clientWidth);
    this.position[1] = modulus(this.position[1], document.body.clientHeight);
  }
  
  turn(theta){
    theta = normalizeAngle(theta);
    if(theta < -this.maxTurn){
      this.angle -= this.maxTurn;
    }else if(theta > this.maxTurn){
      this.angle += this.maxTurn;
    }else{
      this.angle += theta;
    }
  }
  
  forward(){
    this.position[0] += this.speed*Math.cos(this.angle);
    this.position[1] += this.speed*Math.sin(this.angle);
  }
  
  changeSpeed(delta){
    if(delta > this.maxDeltaSpeed){
      this.speed += this.maxDeltaSpeed;
    }else if(delta < -this.maxDeltaSpeed){
      this.speed -= this.maxDeltaSpeed;
    }else{
      this.speed += delta;
    }
    
    if(this.speed > this.maxSpeed){
      this.speed = this.maxSpeed;
    }else if(this.speed < this.minSpeed){
      this.speed = this.minSpeed;
    }
  }
}

function boid(worldState){
  var move = [0,0];

  var localTurnings = [];
  var localPositions = [];
  var localDistances = [];
  for(var i in worldState.beings){
    var ang = Math.atan2(worldState.beings[i].position[1]-this.position[1], worldState.beings[i].position[0]-this.position[0]);
    if(Math.abs(angleDif(this.angle, ang)) < Math.PI/2 || ang == 0){
      localDistances.push(dist(worldState.beings[i].position, this.position));
      localTurnings.push(worldState.beings[i].angle);
      if(worldState.beings[i] != this){
        localPositions.push(worldState.beings[i].position);
      }else{
        localPositions.push([
          worldState.beings[i].position[0]+Math.cos(worldState.beings[i].angle)*50,
          worldState.beings[i].position[1]+Math.sin(worldState.beings[i].angle)*50]);
      }
    }
  }
  
  var distWeightArr = apply(frontDist(160), localDistances);
  var avgLoc = averagePos(localPositions, distWeightArr);
  var centerTurn = angleDif(this.angle, Math.atan2(avgLoc[1] - this.position[1], avgLoc[0] - this.position[0]));

  var turnWeightArr = apply(frontDist(80), localDistances);
  var agreementTurn = angleDif(this.angle, averageAngle(localTurnings, turnWeightArr));

  var superClose = apply(frontDist(30), localDistances);
  var avgVcloseLoc = averagePos(localPositions, superClose);
  var sCloseTurn = angleDif(this.angle, Math.atan2(avgVcloseLoc[1] - this.position[1], avgVcloseLoc[0] - this.position[0]));
  
  if(isMouseDown){
    move[1] = averageAngle([centerTurn, agreementTurn, -sCloseTurn, angleDif(this.angle, Math.atan2(mousePos[1]-this.position[1],mousePos[0]-this.position[0]))], [2, 2, 3, 2]);
  }else{
    move[1] = averageAngle([centerTurn, agreementTurn, -sCloseTurn], [2, 2, 3]);
  }
  
  move[0] = -Math.abs(move[1])*0.0005+0.0003;
  return move;
}

class WorldState{
  constructor(ctx){
    this.ctx = ctx;
    this.beings = [];
    this.averagePos = [0.5,0.5];
    
    this.drawSize = 10;
  }
  
  draw(){
    ctx.fillStyle = bgColorElem.value;
    ctx.fillRect(0,0,document.body.clientWidth,document.body.clientHeight);
    
    var color = boidColorElem.value;

    for(var i in this.beings){
      var b = this.beings[i];
      
      ctx.beginPath();
      ctx.moveTo(b.position[0] + Math.cos(b.angle)*this.drawSize, b.position[1] + Math.sin(b.angle)*this.drawSize);
      ctx.lineTo(b.position[0] + Math.cos(b.angle + Math.PI*5/7)*this.drawSize, b.position[1] + Math.sin(b.angle + Math.PI*3/4)*this.drawSize);
      ctx.lineTo(b.position[0] + Math.cos(b.angle + Math.PI*9/7)*this.drawSize, b.position[1] + Math.sin(b.angle + Math.PI*5/4)*this.drawSize);
      
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

var canvas = document.getElementById("draw");
var ctx = canvas.getContext("2d");
var world = new WorldState(ctx);

var bgColorElem;
var boidColorElem;

function tick(){
  requestAnimationFrame(tick);
  
  for(var i=0; i<world.beings.length; i++){
    world.beings[i].move(world);
  }
  
  world.draw();
}

var isMouseDown = false;
var mousePos = [];

document.onmousedown = function(event){isMouseDown = true; mousePos = [event.x, event.y];};
document.ontouchstart = function(event){isMouseDown = true; mousePos = [event.x, event.y];};

document.onmouseup = function(event){isMouseDown = false;};
document.ontouchend = function(event){isMouseDown = false;};

document.onmousemove = function(){if(isMouseDown){mousePos = [event.x, event.y];}};
document.ontouchmove = function(){if(isMouseDown){mousePos = [event.x, event.y];}};



window.onload = function(){
  for(var i=0;i<100;i++){
    world.beings.push(new Being([Math.random()*document.body.clientWidth, Math.random()*document.body.clientHeight], boid));
  }
  bgColorElem = document.getElementById("bgclr");
  boidColorElem = document.getElementById("boidclr");

  resize();
  tick();
};