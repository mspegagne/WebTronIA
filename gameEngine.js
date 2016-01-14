window.onload = function() {

  //////////////////// VARIABLES FOR GAMEENGINE ////////////////////////
  
  var FRAMEDELAY = 100;
  var limitCalc = 50;

  //Use to calcuate the coordinates
  var dx = [-1,0,1,0];
  var dy = [0,-1,0,1];

  //Timer 
  var tmr;

  //Move queue with keyboard inputs
  var moveq = [];

  var game;


  //////////////////// OBJECTS ////////////////////////

  var Player = function(pos, id, h, w){
    this.ai = true;
    this.id = id;

    // Move convention: 0 = left, 1 = up, 2 = right, 3 = down (corresponds to keyCode-37)
    this.move = 0;

    this.startPos = pos;    
    this.x = 0;
    this.y = 0;      
    this.idx = 0;  

    this.updatePosition = function(x,y){
      this.x = x;
      this.y = y;      
      this.idx = this.x+this.y*w;   
    }

    //Init positions
    //pos = 0 : North-West ; pos = 1 : North-East ; pos = 2 : South-West; pos = 3 : South-East
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

  var Game = function(){

    // map: 0 = empty, -1 = wall, 1 = player 1, 2 = player 2, 3 = player 1 crashed, 4 = player 2 crashed
    this.map = [];

    // width and height constants
    this.w = 0|(canvas.width/10);
    this.h = 0|(canvas.height/10);

    this.p1 = new Player(1,1,this.h,this.w);
    this.p1.move = 0;
    this.p2 = new Player(2,2,this.h,this.w);
    this.p2.move = 2;

    this.gameover = false;

    this.addWall = function(x,y) {
      this.map[x+y*this.w] = -1;
    }

    this.addPlayer = function(idx,playerId) {
      this.map[idx] = playerId;
    }

    this.addPlayerCrashed = function(idx,playerId) {
      this.map[idx] = playerId+2;
    }

    this.isWall = function(x,y){
      if(this.map[x+y*this.w] !== 0){
        return true;        
      }
      else{
        return false;
      }
    }

    this.isStuck = function(x,y) {
      return this.isWall(x+1, y) && this.isWall(x-1, y) && this.isWall(x, y+1) && this.isWall(x, y-1)
    }

    this.draw = function() {    
      //init
      var canvas = document.getElementById('canvas');
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,canvas.width,canvas.height);

      for(var j=0;j<this.h*this.w;j++) {
        var x = j%this.w;
        var y = Math.floor(j/this.w);
        //draw walls
        if (this.map[j] === -1){          
          ctx.fillStyle='#111';
          ctx.fillRect(x*10, y*10, 9, 9);
        }
        //draw player 1
        if (this.map[j] === 1){          
          ctx.fillStyle='#00f';
          ctx.fillRect(x*10,y*10,9,9);
        }
        //draw player 2
        if (this.map[j] === 2){          
          ctx.fillStyle='#f00';
          ctx.fillRect(x*10,y*10,9,9);
        }        
        //draw player 1 crashed
        if (this.map[j] === 3){          
          ctx.fillStyle='#00a';
          ctx.fillRect(x*10,y*10,9,9);
        }       
        //draw player 2 crashed
        if (this.map[j] === 4){          
          ctx.fillStyle='#a00';
          ctx.fillRect(x*10,y*10,9,9);
        }
      }
    }

    this.init = function(){

      for(var j=0;j<this.h*this.w;j++) { 
        this.map[j] = 0; 
      }

      //Add Borders
      for(var i=0;i<this.w;i++){ 
        this.addWall(i,0); 
        this.addWall(i,this.h-1); 
      }
      for(var j=0;j<this.h;j++){ 
        this.addWall(0,j); 
        this.addWall(this.w-1,j); 
      }

      // Generate a random map with a random number of blocks
      var numBlocks=Math.random()*10;
      for(var n=0;n<numBlocks;n++) {

        //Generate randomly coordinates for the block
        var x = 0|(Math.random()*(this.w-4)) + 2;
        var y = 0|(Math.random()*(this.h-4)) + 2;

        //Generate the number of pixels of the block
        var blockLen = Math.random()*15;

        for(var k=0;k<blockLen;k++) {

          //Place the block
          this.addWall(x,y);
          //Place a symetricaly block
          this.addWall(this.w-1-x,this.h-1-y);

          //Generate the next pixel of the block randomly
          var move = 0|(Math.random()*4);
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
  }

  //////////////////// FUNCTIONS ////////////////////////

  function init(canvas){
    game = new Game();
    game.init();
    game.draw(canvas);
    moveq = [];
    tmr = setInterval(frame, FRAMEDELAY);
  }

  function draw() {
    clearInterval(tmr); tmr=undefined;
    writeConsole("both players crashed; draw!");
  }

  function crash(playerId) {
    clearInterval(tmr); tmr=undefined;
    var other = 3-playerId;
    writeConsole("player "+playerId+" crashed; player "+other+" wins!");
  }

  function writeConsole(message) {
    document.getElementById('console').innerHTML += message+"<br>";
    document.getElementById('console').scrollTop +=100;
  }
 
  // RandomAI
  function randomAI()
  {
    return 0|(Math.random()*4);
  }

  // lineDist based AI
  // Move if there is a longer distance to a wall
  function lineDist(game, player)
  {

    var px = player.x;
    var py = player.y;
    var pidx = player.idx;

    var move, newX, newY;
    var bestHeur = 0;
    var bestMove = 0;

    for(var move = 0; move<4; move++){
        var heur = 0;
        newX = px + dx[move];
        newY = py + dy[move];
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
  
    //writeConsole(bestHeur);
    return bestMove;
  }
  /*
  // AI with snail comportement
  // Move when wall to the longest direction
  function snailAI(player)
  {
    if(player === 'p1')
    {
      var x = p1x,
          y = p1y,
          idx = p1x+p1y*w,
          move = p1move;


    }
    if(player === 'p2')
    {
      var x = p2x,
          y = p2y,
          idx = p2x+p2y*w,
          move = p2move;
    }

    var newMove, newX, newY;
    var bestHeur = 0;
    var bestMove = move;

    newX = x + dx[move];
    newY = y + dy[move];
    if(isWall(newX,newY)){

        for(newMove = 0; newMove<4; newMove++){
            var heur = 0;
            newX = x + dx[newMove];
            newY = y + dy[newMove];
            var altMove = newMove
            while(!isStuck(newX, newY) && !isWall(newX, newY)){
                heur++;
                newX += dx[newMove];
                newY += dy[newMove];
                if(isWall(newX, newY)){
                    var altMove = newMove;
                    if(newY<(h/2) && (newMove%2) === 0){
                        altMove=1;  
                    }
                    if(newY>(h/2) && (newMove%2) === 0){
                        altMove=3;  
                    }
                    if(newX<(w/2) && (newMove%2) === 1){
                        altMove=2;  
                    }
                    if(newX>(w/2) && (newMove%2) === 1){
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
  
    writeConsole(bestHeur);
    return bestMove;
  }
  */

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


  function frame() {
    //Manage keyboard inputs
    if(moveq.length) {
      var move = moveq[0];
      var newidx = game.p1.x+dx[move]+(game.p1.y+dy[move])*game.w;
      if(!game.map[newidx]) {
        game.p1.move = move;
        moveq.shift();
      }
    }

    
    var previousGame = clone(game);

    //Run the AI
    if(game.p1.ai) game.p1.move = lineDist(game, game.p1);
    game.p2.move = lineDist(game, game.p2);

    //if(game.p1.ai) game.p1.move = randomAI();
    //game.p2.move = randomAI();

    //Make the p1 move
    game.p1.updatePosition(game.p1.x+dx[game.p1.move],game.p1.y+dy[game.p1.move]); 
    game.addPlayer(game.p1.idx, 1);  
    

    //Make the p2 move
    game.p2.updatePosition(game.p2.x+dx[game.p2.move],game.p2.y+dy[game.p2.move]); 
    game.addPlayer(game.p2.idx, 2);


    //Manage the game 
    if((previousGame.isWall(game.p1.x, game.p1.y) && previousGame.isWall(game.p2.x, game.p2.y)) || (game.p1.idx === game.p2.idx)) {
      game.addPlayerCrashed(game.p1.idx, 1);
      game.addPlayerCrashed(game.p2.idx, 2);
      draw();
    }
    else if(previousGame.isWall(game.p1.x, game.p1.y)) {      
      game.addPlayerCrashed(game.p1.idx, 1);
      crash(1);
    }
    else if(previousGame.isWall(game.p2.x, game.p2.y)) {      
      game.addPlayerCrashed(game.p2.idx, 2);
      crash(2);
    }
    

    game.draw(canvas);
  }

  //Manage the keyboard inputs
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

  init();
}