

var width = (window.innerWidth > 0) ? window.innerWidth : screen.width,
// width of the canvas
height = width = (window.innerHeight > 0) ? window.innerHeight : screen.height,
// height of the canvas
gLoop,
points = 0,
globalTilt = 0,
pointMultiple = 0,
fpsVar = 60,
state = true,
maxVel = 8,
c = document.getElementById('c'),
// the canvas itself

ctx = c.getContext("2d");
// two-dimensional graphic context of
// the canvas, the only one supported by all
// browsers at the moment

c.width = width;
c.height = height;
// setting the cavas size

if( /Android|AppleWebKit|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	//On mobile
	fpsVar = 70;
	width = document.documentElement.clientWidth;
	height = document.documentElement.clientHeight;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

var paintColor = getRandomColor();

var clear = function(){
	ctx.fillStyle = paintColor;
	ctx.beginPath();
	ctx.rect(0, 0, width, height);
	ctx.closePath();
	ctx.fill();
	player.draw();
};

var howManyCircles = 20, circles = [];

for (var i = 0; i < howManyCircles; i++)
	circles.push([Math.random() * width, 
		Math.random() * height, 
		Math.random() * 100, 
		Math.random() / 2]);

var DrawCircles = function(){
  for (var i = 0; i < howManyCircles; i++) {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + circles[i][3] + ')';
	//white color with transparency in rgba
    ctx.beginPath();
    ctx.arc(circles[i][0], circles[i][1], circles[i][2], 0, Math.PI * 2, true);
	//arc(x, y, radius, startAngle, endAngle, anticlockwise)
	//circle has always PI*2 end angle
    ctx.closePath();
    ctx.fill();
  }
};

var MoveCircles = function(deltaY){
  for (var i = 0; i < howManyCircles; i++) {
    if (circles[i][1] - circles[i][2] > height) {
	//the circle is under the screen so we change
	//informations about it 
      circles[i][0] = Math.random() * width;
      circles[i][2] = Math.random() * 100;
      circles[i][1] = 0 - circles[i][2];
      circles[i][3] = Math.random() / 2;
    } else {
	//move circle deltaY pixels down
      circles[i][1] += deltaY;
    }
  }
};

var GameLoop = function(){
	clear();

	//Circles Logic
	MoveCircles(2);
	DrawCircles();

	//Player Logic
	if (player.isJumping) player.checkJump();
	if (player.isFalling) player.checkFall();
	player.setPosition(player.X + player.xVel, player.Y);
	if (player.X < 0)
		player.setPosition(0,player.Y);
	if (player.X+player.width > width)
		player.setPosition(width-player.width,player.Y);
	player.draw();
	

	//Platforms Logic
	platforms.forEach(function(platform, index){
        if (platform.isMoving) {
		//if platform is able to move
            if (platform.x < 0) {
			//and if is on the end of the screen
                platform.direction = 1;
            } else if (platform.x > width - platformWidth) {
                platform.direction = -1;
				//switch direction and start moving in the opposite direction
            }
            platform.x += platform.direction * (index / 2) * ~~(points / 500);
			//with speed dependent on the index in platforms[] array (to avoid moving all the displayed platforms with the same speed, it looks ugly) and number of points
        }
        platform.draw();
    });
	checkCollision();

	ctx.fillStyle = "Black";
	//change active color to black
	ctx.fillText("POINTS:" + points, 10, height-10);
	//and add text in the left-bottom corner of the canvas
	ctx.fillText("TILT: " + globalTilt, 10, height-30);
	ctx.fillText("VEL: " + player.xVel, 10, height-20);

	if (state)
        gLoop = setTimeout(GameLoop, 1000 / fpsVar);
}

var player = new (function(){
	var that = this;
	that.image = new Image();

	//fall flag attributes
	that.isJumping = false;
	that.isFalling = false;
	//state of the object described by bool variables - is it rising or falling?

	//movement speed attributes
	that.jumpSpeed = 0;
	that.fallSpeed = 0;
	that.xVel = 0;

	that.image.src = "levatas.png";
	that.width = 112;
	that.height = 105;
	if( /Android|AppleWebKit|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		that.image.style.width = '50%'
		that.image.style.height = 'auto'
		that.width = that.width/2
		that.height = that.height/2;
		that.image.src = "levatas-mobile.png"
	}
	that.X = 0;
	that.Y = 0;

	that.setPosition = function(x, y){
		that.X = x;
		that.Y = y;
	}

	that.draw = function(){
        try {
            ctx.drawImage(that.image, 0, 0, that.width, that.height, that.X, that.Y, that.width, that.height);
			//cutting source image and pasting it into destination one, drawImage(Image Object, source X, source Y, source Width, source Height, destination X (X position), destination Y (Y position), Destination width, Destination height)
        } catch (e) {
			//sometimes, if character's image is too big and will not load until the drawing of the first frame, Javascript will throws error and stop executing everything. To avoid this we have to catch an error and retry painting in another frame. It is invisible for the user with 50 frames per second.
        }
	}

	that.jump = function() {
	//initiation of the jump
		if (!that.isJumping && !that.isFalling) {
			//if objects isn't currently jumping or falling (preventing of 'double jumps', or bouncing from the air
			that.fallSpeed = 0;
			that.isJumping = true;
			that.jumpSpeed = 27;
			// initial velocity
		}
	}

	that.checkJump = function() {     
	    if (that.Y > height*0.4) {
			//if player is under about half of the screen - let him move
	        that.setPosition(that.X, that.Y - that.jumpSpeed);        
	    } else {
	    	if (that.jumpSpeed > 10) points++;
			//in other dont move player up, move platforms and circles down instead
	        MoveCircles(that.jumpSpeed * 0.5); 
			//clouds are in the background, further than platforms and player, so we will move it with half speed
	        
	        platforms.forEach(function(platform, ind){
	            platform.y += that.jumpSpeed;

	            if (platform.y > height) {
					//if platform moves outside the screen, we will generate another one on the top
	                var type = ~~(Math.random() * 5);
	                if (type == 0) 
	                    type = 1;
	                else 
	                    type = 0;
	                platforms[ind] = new Platform(Math.random() * (width - platformWidth), platform.y - height, type);
	            }
	        });
	    }
	    
	    
	    that.jumpSpeed--;
	    if (that.jumpSpeed == 0) {
	        that.isJumping = false;
	        that.isFalling = true;
	        that.fallSpeed = 1;
	    }

	}

	that.checkFall = function(){
	    if (that.Y < height - that.height) {
	        that.setPosition(that.X, that.Y + that.fallSpeed);
	        that.fallSpeed++;
	    } else {
	        if (points == 0) 
			//allow player to step on the floor at he beginning of the game
	            that.fallStop();
	        else 
	            GameOver();
	    }
	}

	that.fallStop = function(){
		//stop falling, start jumping again
		that.isFalling = false;
		that.fallSpeed = 0;
		that.jump();    
	}

	that.moveLeft = function(){
		that.xVel = -8;
	}

	that.moveRight = function(){

		that.xVel = 8;
	}
})();

var Platform = function(x, y, type){
	//function takes position and platform type
	var that=this;
	that.isMoving = ~~(Math.random() * 2);
	//console.log("isMoving: %d",that.isMoving);
	that.direction= ~~(Math.random() * 2) ? -1 : 1;
	//console.log("direction: %d",that.direction);
	that.firstColor = '#FF8C00';
	that.secondColor = '#EEEE00';
	that.onCollide = function(){
		player.fallStop();
		var newPointMultiple = ~~(points/400);
		if (newPointMultiple > pointMultiple){
			pointMultiple = newPointMultiple;
			paintColor = getRandomColor();
		}
	};
	//if platform type is different than 1, set right color & collision function (in this case just call player's fallStop() method we defined last time
	if (type === 1) {
		//but if type is equal '1', set different color and set jumpSpeed to 50. After such an operation checkJump() method will takes substituted '50' instead of default '17' we set in jump().
		that.firstColor = '#AADD00';
		that.secondColor = '#698B22';
		that.onCollide = function(){
			player.fallStop();
			player.jumpSpeed = 50;
		};
	}

	that.x = ~~x;
	that.y = y;
	that.type = type;

	that.draw = function(){
		ctx.fillStyle = 'rgba(255, 255, 255, 1)';
		//it's important to change transparency to '1' before drawing the platforms, in other case they acquire last set transparency in Google Chrome Browser, and because circles in background are semi-transparent it's good idea to fix it. I forgot about that in my 10kApart entry, I think because Firefox and Safari change it by default
		var gradient = ctx.createRadialGradient(that.x + (platformWidth/2), that.y + (platformHeight/2), 5, that.x + (platformWidth/2), that.y + (platformHeight/2), 45);
		gradient.addColorStop(0, that.firstColor);
		gradient.addColorStop(1, that.secondColor);
		ctx.fillStyle = gradient;
		ctx.fillRect(that.x, that.y, platformWidth, platformHeight);
		//drawing gradient inside rectangular platform
	};

	return that;
};

//GameOver screen
var GameOver = function(){
    state = false;
	//set state to false
    clearTimeout(gLoop);
	//stop calling another frame
    setTimeout(function(){
		//wait for already called frames to be drawn and then clear everything and render text
        clear(); 
        ctx.fillStyle = "Black";
        ctx.font = "10pt Arial";
        ctx.fillText("GAME OVER", width / 2 - 60, height / 2 - 50);
        ctx.fillText("YOUR RESULT:" + points, width / 2 - 60, height / 2 - 30);
        ctx.fillText("Tap to Restart",width/2-60, height/2-10);
    }, 100);
};

var Restart = function(){
	if (!state) {
		points = 0;
		state = 1;
		player.jump();
	};
}

var nrOfPlatforms = 7, 
platforms = [],
platformWidth = width / 10,
platformHeight = 20;

if( /Android|AppleWebKit|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	//On mobile
	nrOfPlatforms = 5;
	platformWidth = platformWidth*1.5;
	platformHeight = platformHeight*0.75;
}
//global (so far) variables are not the best place for storing platform size information, but in case it will be needed to calculate collisions I put it here, not as a Platform attributes
var generatePlatforms = function(){
	var position = 0, type;
	//'position' is Y of the platform, to place it in quite similar intervals it starts from 0
	for (var i = 0; i < nrOfPlatforms; i++) {
		type = ~~(Math.random()*5);
	if (type == 0) type = 1;
	else type = 0;
	//it's 5 times more possible to get 'ordinary' platform than 'super' one
	platforms[i] = new Platform(Math.random()*(width-platformWidth),position,type);
	//random X position
	if (position < height - platformHeight) 
		position += ~~(height / nrOfPlatforms);
}
//and Y position interval
}();
//we call that function only once, before game start

var checkCollision = function(){
	platforms.forEach(function(e, ind){
		//check every plaftorm
		if (
		(player.isFalling) && 
		//only when player is falling
		(player.X < e.x + platformWidth) && 
		(player.X + player.width > e.x) && 
		(player.Y + player.height > e.y) && 
		(player.Y + player.height < e.y + platformHeight)
		//and is directly over the platform
		) {
			e.onCollide();
		}
	})
}

document.onkeydown = checkKey;
document.onkeyup = upCheckKey;

function checkKey(e) {
	e = e || window.event;

	if (e.keyCode == 37)
	{
		// left key
		player.moveLeft();
	}
	else if (e.keyCode == 39)
	{
		// right key
		player.moveRight();
	}
}

function upCheckKey(e) {
	e = e || window.event;
		if (e.keyCode == 37)
	{
		// left key
		if (player.xVel < 0)
			player.xVel = 0;
	}
	else if (e.keyCode == 39)
	{
		if (player.xVel > 0)
			player.xVel = 0;
	}
}

// Mobile Support
if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function () {
        tilt([event.beta, event.gamma]);
    }, true);
} else if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function () {
        tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
    }, true);
} else {
    window.addEventListener("MozOrientation", function () {
        tilt([orientation.x * 50, orientation.y * 50]);
    }, true);
}

window.addEventListener('load', function(){
 
 c.addEventListener('touchstart', function(e){
 	Restart();
  e.preventDefault()
 }, false)
 
}, false)

function tilt(tilts)
{
	yTilt = tilts[0];
	xTilt = tilts[1];
	globalTilt = xTilt;
	player.xVel = xTilt;
	if (xTilt > maxVel)
		player.xVel = maxVel;
	else if (xTilt < -maxVel)
		player.xVel = -maxVel;
		
	/*if (yTilt > 0)
		player.xVel = 8
	if (yTilt < 0)
		player.xVel = -8*/

}


player.setPosition(~~((width-player.width)/2),  ~~((height - player.height)/2));
player.jump();


GameLoop();

