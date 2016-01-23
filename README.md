# WebTronIA
Web implementation of Google AI Challenge 2010

For our project, we have implement few Artificial Intelligences : 

#### Line Dist AI

The green player is played by this one (by default). The player choose the direction where the distance to the next wall is maximum.

#### Snail AI

A second one, implemented but not played, is the snail AI. This one decides which direction to go only when it meets a wall. The heuristic is the same as the Line Dist, it goes where the distance to the next wall is maximum. We called it the snail AI because it behaves like a snail.

#### MiniMax AI

This one is the cleverest and is played by the pink player (player 2). This is an implementation of the [minimax algo](https://en.wikipedia.org/wiki/Minimax) with alpha-beta prerunning. To evaluate a score for each player, we have these heuristics :

* If both players can't be joined (there is a wall between them), then the score is their free space.
* Else the score is the difference between the number of first joinable position on the map.
* If the adversary meets a wall, the score is maximal because we win. If we meet a wall, the score is minimal because we loose.
* If both players collide, then the score is null to avoid a draw.