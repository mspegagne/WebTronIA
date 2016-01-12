window.onload = function() {

  //////////////////// VARIABLES ////////////////////////

  var FRAMEDELAY = 100;
  var p1ai = false;
  var limitCalc = 50;

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  // map: 0 = empty, -1 = wall, 1 = player 1, 2 = player 2
  var map = [];

  // width and height constants
  var w = 0|(canvas.width/10);
  var h = 0|(canvas.height/10);

  // Move convention: 0 = left, 1 = up, 2 = right, 3 = down (corresponds to keyCode-37)
  var p1move, p2move;

  //Use to calcuate the coordinates
  var dx = [-1,0,1,0];
  var dy = [0,-1,0,1];

  //Init positions
  var p1x, p1y, p2x, p2y;

  //Timer 
  var tmr

  //Move queue with keyboard inputs
  var moveq = [];
  var gameover = false;

  //////////////////// FUNCTIONS ////////////////////////

  function init(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    //init the map
    for(var j=0;j<h*w;j++) map[j] = 0;

    addBorders();
    addBlocks();

    p1x = 1;
    p1y = h-2;
    p2x = w-2;
    p2y = 1;

    p1move = 2;
    p2move = 0;

    moveq = [];
    gameover = false;

    drawPlayer(p1x,p1y,1);
    drawPlayer(p2x,p2y,2);

    tmr = setInterval(frame, FRAMEDELAY);
  }

  function addBorders(){
    for(var i=0;i<w;i++){ 
      addWall(i,0); 
      addWall(i,h-1); 
    }
    for(j=0;j<h;j++){ 
      addWall(0,j); 
      addWall(w-1,j); 
    }
  }

  function addBlocks(){
    // Generate a random map with a random number of blocks
    var numBlocks=Math.random()*10;
    for(var n=0;n<numBlocks;n++) {

      //Generate randomly coordinates for the block
      var x = 0|(Math.random()*(w-4)) + 2;
      var y = 0|(Math.random()*(h-4)) + 2;

      //Generate the number of pixels of the block
      var blockLen = Math.random()*15;

      for(var k=0;k<blockLen;k++) {

        //Place the block
        addWall(x,y);
        //Place a symetricaly block
        addWall(w-1-x,h-1-y);

        //Generate the next pixel of the block randomly
        var move = 0|(Math.random()*4);
        switch(move) {
          case 0: x++; break;
          case 1: x--; break;
          case 2: y++; break;
          case 3: y--; break;
        }
        if(x<2) x=2; if(x>w-3) x=w-3;
        if(y<2) y=2; if(y>h-3) y=h-3;
      }
    }
  }

  function addWall(x,y) {
    map[x+y*w] = -1;
    ctx.fillStyle='#111';
    ctx.fillRect(x*10, y*10, 9, 9);
  }

  function isWall(x,y) {
    if(map[x+y*w] !== 0)
      return true;
  }

  function isStuck(x,y) {
    return isWall(x+1, y) && isWall(x-1, y) && isWall(x, y+1) && isWall(x, y-1)
  }

  function drawPlayer(x,y,player) {
    map[x+y*w] = player;
    ctx.fillStyle = player == 1 ? "#00f" : "#f00";
    ctx.fillRect(x*10,y*10,9,9);
  }

  function draw() {
    clearInterval(tmr); tmr=undefined;
    writeConsole("both players crashed; draw!");
    gameover = true;
  }

  function crash(x,y,player) {
    clearInterval(tmr); tmr=undefined;
    var other = 3-player;
    ctx.fillStyle = player == 1 ? "#00a" : "#a00";
    ctx.fillRect(x*10,y*10,9,9);
    writeConsole("player "+player+" crashed; player "+other+" wins!");
    gameover = true;
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
  function lineDist(player)
  {
    if(player === 'p1')
    {
      var x = p1x,
          y = p1y,
          idx = p1x+p1y*w;;

    }
    if(player === 'p2')
    {
      var x = p2x,
          y = p2y,
          idx = p2x+p2y*w;;
    }

    var move, newX, newY;
    var bestHeur = 0;
    var bestMove = 0;

    for(var move = 0; move<4; move++){
        var heur = 0;
        newX = x + dx[move];
        newY = y + dy[move];
        while(!isWall(newX, newY)){
            heur++;
            newX += dx[move];
            newY += dy[move];
        }
        if(heur>bestHeur){
            bestHeur = heur;
            bestMove = move;
        }
    }
  
    writeConsole(bestHeur);
    return bestMove;
  }

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

  


  function frame() {
    //Manage keyboard inputs
    if(moveq.length) {
      var move = moveq[0];
      var newidx = p1x+dx[move]+(p1y+dy[move])*w;
      if(!map[newidx]) {
        p1move = move;
        moveq.shift();
      }
    }

    //Run the AI
    if(p1ai) p1move= lineDist('p1');
    p2move = snailAI ('p2');

    //Make the move
    p1x += dx[p1move]; p1y += dy[p1move];
    p2x += dx[p2move]; p2y += dy[p2move];
    var p1idx = p1x+p1y*w;
    var p2idx = p2x+p2y*w;

    //Manage the game 
    if((map[p1idx] && map[p2idx]) || p1idx == p2idx)
      draw();
    if(map[p1idx]) {
      crash(p1x,p1y,1);
      drawPlayer(p2x,p2y,2);
    }
    else if(map[p2idx]) {
      drawPlayer(p1x,p1y,1);
      crash(p2x,p2y,2);
    }
    else {
      drawPlayer(p1x,p1y,1);
      drawPlayer(p2x,p2y,2);
    }

    var lastmove = p1move;
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
          if(!gameover) {
            tmr = setInterval(frame, FRAMEDELAY);
          } else {
            init();
          }
        }
        break;
      case 65: // A
        p1ai = !p1ai;
        break;
      case 37: // left
      case 38: // up
      case 39: // right
      case 40: // down
        // Move convention: 0 = left, 1 = up, 2 = right, 3 = down (corresponds to keyCode-37)
        var move = e.keyCode - 37;
        var lastmove = p1move;
        if(moveq.length) 
          lastmove = moveq[0];
        if(move != lastmove && Math.abs(lastmove - move) != 2) // don't allow reversal move sequences
          moveq.push(move);
        break;
    }
  }

  init();
}