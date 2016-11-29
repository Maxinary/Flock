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
    this.maxTurn = 0.05;
    this.maxSpeed = 0.007;
	  this.minSpeed = 0.007;
    this.maxDeltaSpeed = 0.0001;
	
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
    
    for(var i in this.position){
      this.position[i] = modulus(this.position[i], 1);
    }
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
    if(Math.abs(ang-this.angle) < Math.PI/2 || ang == 0){
      localDistances.push(dist(worldState.beings[i].position, this.position));
      localTurnings.push(worldState.beings[i].angle);
      if(worldState.beings[i] != this){
        localPositions.push(worldState.beings[i].position);
      }else{
        localPositions.push([
          worldState.beings[i].position[0]+Math.cos(worldState.beings[i].angle)*0.1,
          worldState.beings[i].position[1]+Math.sin(worldState.beings[i].angle)*0.1]);
      }
    }
  }
  
  var distWeightArr = apply(frontDist(0.2), localDistances);
  var avgLoc = averagePos(localPositions, distWeightArr);
  var centerTurn = angleDif(this.angle, Math.atan2(avgLoc[1] - this.position[1], avgLoc[0] - this.position[0]));

  var turnWeightArr = apply(frontDist(0.1), localDistances);
  var agreementTurn = angleDif(this.angle, averageAngle(localTurnings, turnWeightArr));

  var superClose = apply(frontDist(0.04), localDistances);
  var avgVcloseLoc = averagePos(localPositions, superClose);
  var sCloseTurn = angleDif(this.angle, Math.atan2(avgVcloseLoc[1] - this.position[1], avgVcloseLoc[0] - this.position[0]));
  
  move[1] = averageAngle([centerTurn, agreementTurn, -sCloseTurn], [2, 2, 3]);

  move[0] = -Math.abs(move[1])*0.0005+0.0004;
  return move;
}

class WorldState{
  constructor(ctx){
    this.ctx = ctx;
    this.beings = [];
    this.averagePos = [0.5,0.5];
    
    this.drawSize = 0.015;
  }
  
  draw(){
    ctx.clearRect(0,0,1000,1000);
    ctx.strokeRect(0,0,400,400);
    
    for(var i in this.beings){
      var b = this.beings[i];
      
      ctx.beginPath();
      ctx.moveTo(b.position[0]*400 + Math.cos(b.angle)*this.drawSize*400, b.position[1]*400 + Math.sin(b.angle)*this.drawSize*400);
      ctx.lineTo(b.position[0]*400 + Math.cos(b.angle + Math.PI*5/7)*this.drawSize*400, b.position[1]*400 + Math.sin(b.angle + Math.PI*3/4)*this.drawSize*400);
      ctx.lineTo(b.position[0]*400 + Math.cos(b.angle + Math.PI*9/7)*this.drawSize*400, b.position[1]*400 + Math.sin(b.angle + Math.PI*5/4)*this.drawSize*400);
      
      ctx.closePath();
      ctx.fillStyle = "#FF0000";
      ctx.fill();
    }
  }
}

var canvas = document.getElementById("draw");
var ctx = canvas.getContext("2d");
var world = new WorldState(ctx);
for(var i=0;i<100;i++){
  world.beings.push(new Being([Math.random(), Math.random()], boid));
}

function tick(){
  requestAnimationFrame(tick);
  
  for(var i=0; i<world.beings.length; i++){
    world.beings[i].move(world);
  }
  
  world.draw();
}

window.onload = function(){resize(); tick();};