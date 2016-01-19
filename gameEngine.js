window.onload = function(){

  //////////////////// VARIABLES FOR GAMEENGINE ////////////////////////
  
  var FRAMEDELAY = 120;
  var limitCalc = 4; //Depth of Minimax algo
  var dx = [-1,0,1,0]; //Use to calcuate the coordinates
  var dy = [0,-1,0,1]; 
  var tmr;  //Timer   
  var moveq = []; //Move queue with keyboard inputs
  var game;

  //////////////////// OBJECTS ////////////////////////

  var Player = function(id, ai, move){

    this.ai = ai;
    this.id = id;
    this.startPos = 0;    
    this.x = 0;
    this.y = 0;
    this.space = 0;      
    this.w = 0;
    this.idx = 0;  
    this.move = move;  //Move: 0 = left, 1 = up, 2 = right, 3 = down (corresponds to keyCode-37)

    //Init positions
    this.init = function(pos, h, w){      
      this.startPos = pos; //Pos: 0 = North-West , 1 = North-East, 2 = South-West, 3 = South-East
      this.w = w;
      if(pos === 0){
        this.updatePosition(0,1);   
      }
      if(pos === 1){
        this.updatePosition(w-1,1);   
      }
      if(pos === 2){
        this.updatePosition(0,h-2);      
      }    
      if(pos === 3){
        this.updatePosition(w-1,h-2);    
      }
    }

    this.updatePosition = function(x,y){
      this.x = x;
      this.y = y;      
      this.idx = this.x+this.y*this.w; 
    }

  }


  var Game = function(){
    
    this.map = []; // Map: 0 = empty, -1 = wall, 1 = player 1, 2 = player 2, 3 = player 1 crashed, 4 = player 2 crashed
    this.w = 0|(canvas.width/10); // width and height constants
    this.h = 0|(canvas.height/10);
    this.p1 = new Player(1,true,2);
    this.p2 = new Player(2,true,0);
    this.gameover = false;

    this.addWall = function(x,y){
      this.map[x+y*this.w] = -1;
    }

    //Add the player's trace
    this.addPlayer = function(player){
      if(this.isWall(player.x,player.y)){        
        this.map[player.idx] = player.id+2;
        this.gameover = true; 
      }
      else{        
        this.map[player.idx] = player.id;
      }
    }

    this.isWall = function(x,y){
      return this.map[x+y*this.w] !== 0;
    }

    this.isStuck = function(x,y){
      return this.isWall(x+1,y) && this.isWall(x-1,y) && this.isWall(x,y+1) && this.isWall(x,y-1);
    }

    //Draw all the map in the canvas
    this.draw = function(){

      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);

      for(var j=0;j<this.h*this.w;j++){
        var x = j%this.w;
        var y = Math.floor(j/this.w);
        //Coloration
        if(this.map[j] != 0){
          switch(this.map[j]){
            case -1:
              ctx.fillStyle='#111';
              break;
            case 1:
              ctx.fillStyle='#00f';
              break;
            case 2:
              ctx.fillStyle='#f00';
              break;
            case 3:
              ctx.fillStyle='#00a';
              break;
            case 4:
              ctx.fillStyle='#a00';
              break;
          }            
          ctx.fillRect(x*10, y*10, 9, 9); 
        }     
      }
    }

    this.addBorders = function(){
      for(var i=0;i<this.w;i++){ 
        this.addWall(i,0); 
        this.addWall(i,this.h-1); 
      }
      for(var j=0;j<this.h;j++){ 
        this.addWall(0,j); 
        this.addWall(this.w-1,j); 
      }
    }

    this.addBlocks = function(){
      var numBlocks=Math.random()*10; // Generate a random map with a random number of blocks

      for(var n=0;n<numBlocks;n++){
        var x = 0|(Math.random()*(this.w-4)) + 2;  //Generate randomly coordinates for the block
        var y = 0|(Math.random()*(this.h-4)) + 2;        
        var blockLen = Math.random()*15; //Generate the number of pixels of the block

        for(var k=0;k<blockLen;k++){
          this.addWall(x,y); //Place the block         
          this.addWall(this.w-1-x,this.h-1-y); //Place a symetricaly block         
          var move = 0|(Math.random()*4);  //Generate the next pixel of the block randomly

          switch(move) {
            case 0: x++; break;
            case 1: x--; break;
            case 2: y++; break;
            case 3: y--; break;
          }
          if(x<2) x=2; if(x>this.w-3) x=this.w-3;
          if(y<2) y=2; if(y>this.h-3) y=this.h-3;
        }
      }
    }

    this.score = function(player){
      var score = 0;
      var adv = (player.id === 1 ? this.p2 : this.p1);
      this.spaceCounting(this.p1);
      this.spaceCounting(this.p2);

      if(player.space !== adv.space){
        score = player.space - adv.space;
      }
      else{
        score = this.diffFirstJoinable(player,adv);
      }

      if(this.map[adv.idx] === adv.id+2){
        score = 2000;
      }
      if(this.map[player.idx] === player.id+2){
        score = -2000;
      }
      return score;
    }

    //Evaluate the free space from x,y. Used in blockCounting
    //Recursive function
    this.propagation = function(access,x,y,player){
      for(var i=(x-1);i<=(x+1);i++){        
        if(i<this.w && i>=0 && y<this.h && y>=0 && !this.isWall(i,y) && access[i+y*this.w] !== 1){
          access[i+y*this.w] = 1;
          player.space++;
          this.propagation(access,i,y,player);              
        }          
      }
      for(j=(y-1);j<=(y+1);j++){
        if(x<this.w && x>=0 && j<this.h && j>=0 && !this.isWall(x,j) && access[x+j*this.w] !== 1){
          access[x+j*this.w] = 1;
          player.space++;
          this.propagation(access,x,j,player);              
        }          
      }
    }

    this.spaceCounting = function(player){
      //init access
      var access = [];      
      for(var j=0;j<this.h*this.w;j++){ 
        access[j] = 0; 
      }
      player.space = 0;
      this.propagation(access,player.x,player.y,player);
      return player.space;
    }

    this.diffFirstJoinable = function(player,adv){     
      var score = 0;
      for(var i=0;i<this.w;i++){ 
        for(var j=0;j<this.h;j++){ 
          var distancePlayer = Math.sqrt(Math.pow((player.x - i),2)+Math.pow((player.y - j),2)); 
          var distanceAdv = Math.sqrt(Math.pow((adv.x - i),2)+Math.pow((adv.y - j),2)); 
          if(distancePlayer < distanceAdv){
            score++;
          }
          if(distancePlayer > distanceAdv){
            score--;
          }
        }
      }
      return score;      
    }

    this.init = function(){ 
      //Init players     
      this.p2.init(1,this.h,this.w);    
      this.p1.init(2,this.h,this.w);
      //Init map
      for(var j=0;j<this.h*this.w;j++){ 
        this.map[j] = 0; 
      }
      this.addBorders();
      this.addBlocks();     
    }
  }


  //////////////////// GENERAL FUNCTIONS ////////////////////////

  //Used to clone object in js
  function clone(obj){
    if(obj == null || typeof(obj) != 'object'){
      return obj;
    }
    var temp = new obj.constructor();
    for(var key in obj){
      temp[key] = clone(obj[key]);
    }
    return temp;
  }

  //Write 'message' in div console
  function writeConsole(message) {
    document.getElementById('console').innerHTML += message+"<br>";
    document.getElementById('console').scrollTop +=100;
  }
 
  //Keyboard listener to manage the keyboard inputs
  document.onkeydown = function(e) {
    //document.getElementById('d').innerHTML = "key: " + e.keyCode;
    switch(e.keyCode) {
      case 32: // space
        if(tmr) {
          clearInterval(tmr);
          tmr = undefined;
        } else {
          if(!game.gameover) {
            tmr = setInterval(frame, FRAMEDELAY);
          } else {
            init();
          }
        }
        break;
      case 65: // A
        game.p1.ai = !game.p1.ai;
        break;
      case 37: // left
      case 38: // up
      case 39: // right
      case 40: // down
        // Move convention: 0 = left, 1 = up, 2 = right, 3 = down (corresponds to keyCode-37)
        var move = e.keyCode - 37;
        var lastmove = game.p1.move;
        if(moveq.length) 
          lastmove = moveq[0];
        if(move != lastmove && Math.abs(lastmove - move) != 2) // don't allow reversal move sequences
          moveq.push(move);
        break;
    }
  }

  //////////////////// GAME'S FUNCTIONS ////////////////////////

  function init(canvas){
    game = new Game();
    game.init();
    game.draw(canvas);
    moveq = [];
    tmr = setInterval(frame, FRAMEDELAY);
  }

  //Ex Aequo
  function draw(){
    clearInterval(tmr); tmr=undefined;
    writeConsole("both players crashed; draw!");
  }

  //Player Crash
  function crash(player){
    clearInterval(tmr); tmr=undefined;
    var other = 3-player.id;
    writeConsole("player "+player.id+" crashed; player "+other+" wins!");
  }


  //////////////////// AIs ////////////////////////

  // RandomAI
  function randomAI(){
    return 0|(Math.random()*4);
  }

  // lineDist based AI
  // Move if there is a longer distance to a wall
  function lineDist(game,player){

    var x = player.x;
    var y = player.y;
    var idx = player.idx;

    var move, newX, newY;
    var bestHeur = 0;
    var bestMove = 0;

    for(var move = 0; move<4; move++){
        var heur = 0;
        newX = x + dx[move];
        newY = y + dy[move];
        while(!game.isWall(newX, newY)){
            heur++;
            newX += dx[move];
            newY += dy[move];
        }
        if(heur>bestHeur){
            bestHeur = heur;
            bestMove = move;
        }
    }
    return bestMove;
  }


  
  // AI with snail comportement
  // Move when wall to the longest direction
  function snailAI(game,player){
    var x = player.x;
    var y = player.y;
    var idx = player.idx;
    var move = player.move;

    var newMove, newX, newY;
    var bestHeur = 0;
    var bestMove = move;

    newX = x + dx[move];
    newY = y + dy[move];

    if(game.isWall(newX,newY)){

        for(newMove = 0; newMove<4; newMove++){
            var heur = 0;
            newX = x + dx[newMove];
            newY = y + dy[newMove];
            var altMove = newMove
            while(!game.isStuck(newX, newY) && !game.isWall(newX, newY)){
                heur++;
                newX += dx[newMove];
                newY += dy[newMove];
                if(game.isWall(newX, newY)){
                    var altMove = newMove;
                    if(newY<(game.h/2) && (newMove%2) === 0){
                        altMove=1;  
                    }
                    if(newY>(game.h/2) && (newMove%2) === 0){
                        altMove=3;  
                    }
                    if(newX<(game.w/2) && (newMove%2) === 1){
                        altMove=2;  
                    }
                    if(newX>(game.w/2) && (newMove%2) === 1){
                        altMove=0;  
                    }                
                    newX += dx[altMove];
                    newY += dy[altMove];
                }          
            }
            if(heur>bestHeur){
                bestHeur = heur;
                bestMove = newMove;
            }
        }
    }
    return bestMove;
  }

  function minimaxAI(node,depth,maximizing,player,init){   
    var adv = (player.id === 1 ? node.p2 : node.p1);    
    var newPlayer = (player.id === 1 ? node.p1 : node.p2);    
    var newInit = (init.id === 1 ? node.p1 : node.p2);
    var bestMove =0;

    if(depth === 0 || node.gameover){
      return [node.score(newInit),newPlayer.move];
    }
    else if(maximizing){
      var bestValue = -3000;
      for(var newMove = 0; newMove<4; newMove++){
        var newNode = clone(node);
        adv = (player.id === 1 ? newNode.p2 : newNode.p1);    
        newPlayer = (player.id === 1 ? newNode.p1 : newNode.p2);
        newPlayer.move = newMove;
        newPlayer.updatePosition(newPlayer.x+dx[newPlayer.move],newPlayer.y+dy[newPlayer.move]); 
        newNode.addPlayer(newPlayer);
        var value = minimaxAI(newNode,(depth-1),false,adv,init)[0];
        bestValue = Math.max(bestValue,value);
        if(bestValue === value){
          bestMove = newMove;
        }
      }
      return [bestValue,bestMove];
    }
    else{
      var bestValue = 3000;
      for(var newMove = 0; newMove<4; newMove++){
        var newNode = clone(node);
        adv = (player.id === 1 ? newNode.p2 : newNode.p1);    
        newPlayer = (player.id === 1 ? newNode.p1 : newNode.p2);
        newPlayer.move = newMove;
        newPlayer.updatePosition(newPlayer.x+dx[newPlayer.move],newPlayer.y+dy[newPlayer.move]); 
        newNode.addPlayer(newPlayer);
        var value = minimaxAI(newNode,(depth-1),true,adv,init)[0];
        bestValue = Math.min(bestValue,value);
        if(bestValue === value){
          bestMove = newMove;
        }
      }
      return [bestValue,bestMove];
    }
  }
  

 
  //////////////////// GAME MANAGER ////////////////////////

  function keyboardManager(){ 
    if(moveq.length) {
      var move = moveq[0];
      var newidx = game.p1.x+dx[move]+(game.p1.y+dy[move])*game.w;
      if(!game.map[newidx]) {
        game.p1.move = move;
        moveq.shift();
      }
    }
  } 

  function gameManager(){
    var previousGame = clone(game); //Used to comparaison 
    var p1 = game.p1;
    var p2 = game.p2;

    //Run the AI
    if(p1.ai){ p1.move = lineDist(game, p1); }
    //p2.move = snailAI(game, p2);
    var minimax = minimaxAI(game, limitCalc, true, p2, p2);
    p2.move = minimax[1];
    writeConsole(minimax[0]);

    //Make the p1 move
    p1.updatePosition(p1.x+dx[p1.move],p1.y+dy[p1.move]); 
    game.addPlayer(p1);  

    //Make the p2 move
    p2.updatePosition(p2.x+dx[p2.move],p2.y+dy[p2.move]); 
    game.addPlayer(p2);

    //Manage the game 
    if((previousGame.isWall(p1.x, p1.y) && previousGame.isWall(p2.x, p2.y)) || (p1.idx === p2.idx)){
      draw();
    }
    else if(previousGame.isWall(game.p1.x, game.p1.y)){      
      crash(p1);
    }
    else if(previousGame.isWall(game.p2.x, game.p2.y)){   
      crash(p2);
    }   
  }

  //Called each FRAMEDELAY
  function frame(){  
    keyboardManager(); 
    gameManager();
    game.draw(canvas);
  }

  //Start !!!
  init();
}