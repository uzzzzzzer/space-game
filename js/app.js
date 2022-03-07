
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth-50;
canvas.height = window.innerHeight-50;
map_width = 10000;
map_height = 2500;
document.body.appendChild(canvas);

// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function() {
        menu();
    });
	document.getElementById('to-menu').addEventListener('click', function() {
        menu();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/enemy_1.png',
    'img/blackhole.png',
    'img/exp.png',
    'img/enemy_2.png',
    'img/enemy_0.png',
    'img/deathstar.png',
    'img/enemy_4.png',
    'img/player_1.png',
    'img/bullet.png',
    'img/sprites.png',
    'img/compass.png',
    'img/enemy_marker.png',
    'img/player_marker.png',
    'img/terrain.png'
]);
resources.onReady(init);
// Game state
var player = {
	health:5,
	mhealth:5,
	object_type:"unit",
    pos: [0, 0],
    sprite: new Sprite('img/player_1.png', [0, 0], [122, 100], 16, [0],180)
};
var terrain = [{
    pos: [-800, -600],
	object_type:"env",
    sprite: new Sprite('img/terrain.png', [0, 0], [5000, 3000], 16, [0],180)
}];
var compass = [{
	object_type:"env",
    pos: [5, 5],
    sprite: new Sprite('img/compass.png', [0, 0], [300, 300], 16, [0],180)
}];
var stats = JSON.parse(localStorage.getItem('stats'));
if(stats.selected<10){
var holes = [{
	object_type:"env",
    pos: [5000, 1000],
	force:2500,
    sprite: new Sprite('img/blackhole.png', [0, 0], [800, 716], 16, [0],180)
}];
}
else{
var holes = [];
}
var compass_markers = [];
var bullets = [];
var enemies = [];
var explosions = [];
var xp = 0;
var lastFire = Date.now();
var lastChange = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;

var score = 0;
var scoreEl = document.getElementById('score');

// Speed in pixels per second
var playerSpeed = 200;
var bulletSpeed = 1000;
var enemySpeed = 100;
var on=0;
var bull=5;
var spawned=0;
var lastBullet = Date.now();
var vfx=[];
var stats = JSON.parse(localStorage.getItem('stats'));
var time=180/stats.diff;
var compositions=["tt","ff","d","fttf","ddd","tttttttttt","ftftf","ffffffffff","dttd","dfdfd","ttttttttttttttt","g","fdgdf","ttttttfgft","ggggg","tgtgt","gdg","fgfgf","ttdttgg","fffffdddddfffff"];
var sp=compositions[stats.selected-1];
var to_spawn=sp.length;
var config = {max_speed:[2,2,3,3,3,3,4,4,4,4,5,5],
      damage:[1,1,1,1.2,1.2,1.2,1.3,1.3,1.4,1.5,1.6,2],
      health:[5,5,5,5,6,6,6,6,7,7,8,8]};
function Log(x, y) {
  return Math.max(0,Math.log(y) / Math.log(x));
}

function get_level(xp){
  var lv = Math.floor(Log(2,xp));
  return lv;
}
var lv = get_level(stats.xp);
// Update game objects
function get_pos(obj){
	return [obj.pos[0]+obj.sprite.size[0]/2,obj.pos[1]+obj.sprite.size[1]/2];
}
function get_size(obj){
	return [obj.sprite.size[0]/2,obj.sprite.size[1]/2];
}
function get_d(a,b){
	return Math.pow(Math.pow(get_pos(a)[0]-get_pos(b)[0],2)+Math.pow(get_pos(a)[1]-get_pos(b)[1],2),0.5);
}
function get_dist(a,b){
	return [get_pos(a)[0]-get_pos(b)[0],get_pos(a)[1]-get_pos(b)[1]];
}
function menu(){
	window.location.replace("main.html");
}
function m(x){
	if(x>0){
		return Math.max(1,x);
	}
	else{
		return Math.min(-1,x);
	}
}
function spawn_vfx(type,pos){
	if(type == "explosion"){
			vfx.push({
                    pos: pos,
					object_type:"env",
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });
	}
	if(type =="teleport"){
			vfx.push({
                    pos: [pos[0]-198*1.2,pos[1]-266*1.2],
					object_type:"env",
                    sprite: new Sprite('img/exp.png',
                                       [20*3, 0],
                                       [198*3, 266*3],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });
	}
	}

function update(dt) {
	if(to_spawn==score/100){
		gameWin();
	}
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    if(sp[spawned]=="t" && enemies.length+score/100<to_spawn) {
		spawned+=1;
        enemies.push({
			xp_bonus:1,
			rotation:30,
			speed:100,
			health:2,
			mhealth:2,
			damage_chance:1,
			type:"transport",
			name:"transport",
			object_type:"unit",
            pos: [map_width-spawned*50,
                  ((spawned+1)%5)*300+5],
            sprite: new Sprite('img/enemy_1.png', [0, 0], [160, 73],
                               6, [0])
        });
		spawn_vfx("teleport",enemies[enemies.length-1].pos);
    }
	else if(sp[spawned]=="f" && enemies.length+score/100<to_spawn) {
		spawned+=1;
        enemies.push({
			xp_bonus:2,
			rotation:180,
			speed:250,
			health:1,
			damage_chance:1,
			mhealth:1,
			type:"fighter",
			name:"fighter",
			object_type:"unit",
            pos: [map_width-spawned*50,
                  ((spawned+1)%5)*300+5],
            sprite: new Sprite('img/enemy_2.png', [0, 0], [160, 115],
                               6, [0])
        });
		spawn_vfx("teleport",enemies[enemies.length-1].pos);
    }
	else if(sp[spawned]=="d" && enemies.length+score/100<to_spawn) {
		spawned+=1;
        enemies.push({
			xp_bonus:5,
			rotation:15,
			speed:100,
			damage_chance:1,
			health:10,
			mhealth:10,
			type:"fighter",
			name:"destroyer",
			object_type:"unit",
            pos: [map_width-spawned*50,
                  ((spawned+1)%5)*300+5],
            sprite: new Sprite('img/enemy_0.png', [0, 0], [523, 300],
                               6, [0])
        });
		spawn_vfx("teleport",enemies[enemies.length-1].pos);
    }
	else if(sp[spawned]=="g" && enemies.length+score/100<to_spawn) {
		spawned+=1;
        enemies.push({
			xp_bonus:2,
			rotation:60,
			speed:100,
			health:1,
			mhealth:1,
			damage_chance:0.5,
			type:"fighter",
			name:"ghost-fighter",
			object_type:"unit",
            pos: [map_width-spawned*50,
                  ((spawned+1)%5)*300+5],
            sprite: new Sprite('img/enemy_4.png', [0, 0], [100, 100],
                               6, [0])
        });
		spawn_vfx("teleport",enemies[enemies.length-1].pos);
    }
	else if(sp[spawned]=="s" && enemies.length+score/100<to_spawn) {
		spawned+=1;
        enemies.push({
			xp_bonus:100,
			rotation:60,
			speed:10,
			health:50,
			mhealth:50,
			damage_chance:1,
			type:"fighter",
			name:"death star",
			object_type:"unit",
            pos: [7000,
                  1000],
            sprite: new Sprite('img/deathstar.png', [0, 0], [2000, 2000],
                               6, [0])
        });
		spawn_vfx("teleport",enemies[enemies.length-1].pos);
    }
    checkCollisions();

    scoreEl.innerHTML = score;
};

function handleInput(dt) {
	var degrees=player.sprite.degrees;
    if((input.isDown('b'))&& Date.now()-lastChange>100) {
		lastChange = Date.now();
		on=Math.min(config.max_speed[lv],on+3);

    }
    if((input.isDown('UP') || input.isDown('w'))&& Date.now()-lastChange>100) {
		lastChange = Date.now();
		on=Math.min(config.max_speed[lv],on+0.1);

    }
    if(input.isDown('DOWN') || input.isDown('s')&& Date.now()-lastChange>100) {
		lastChange = Date.now();
		on=Math.max(0,on-0.1);

    }
    player.pos[1] -= playerSpeed * dt * Math.sin(degrees/180*Math.PI)*on;
    player.pos[0] -= playerSpeed * dt * Math.cos(degrees/180*Math.PI)*on;
    if(input.isDown('LEFT') || input.isDown('a')) {
        player.sprite.degrees -= 64 * dt * on;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.sprite.degrees += 64 * dt * on;
    }

    if(input.isDown('SPACE') &&
       !isGameOver &&
       Date.now() - lastFire > 100 && bull>0) {
		bull-=1;
        var x = player.pos[0] + player.sprite.size[0] / 2;
        var y = player.pos[1] + player.sprite.size[1] / 2;

        bullets.push({ pos: [x, y-4],
					   type:"simple",
                       dir: 'forward',
						object_type:"env",
                       sprite: new Sprite('img/bullet.png', [0, 0], [24, 8], 16, [0],degrees) });
		bullets[bullets.length-1].sprite.degrees=degrees;
        lastFire = Date.now();
    }
	  if(Date.now()-lastBullet>1000){
	  	bull=Math.min(bull+1,5);
		lastBullet = Date.now();
	  }
	
}

function updateEntities(dt) {
	console.log(time);
	time-=dt;
	for(var i=0; i<holes.length; i++) {
		var f=holes[i].force/Math.max(100,get_d(player,holes[i]));
		var dx=f*m(get_dist(player,holes[i])[0]/10000);
		var dy=f*m(get_dist(player,holes[i])[1]/10000);
		//alert(get_dist(player,holes[i]));
		player.pos[0]-=dx;
		player.pos[1]-=dy;
		holes[i].sprite.degrees=(holes[i].sprite.degrees-500*dt)%360;
	}
	compass_markers = [];
    // Update the player sprite animation
    player.sprite.update(dt);

    // Update all the bullets
    for(var i=0; i<bullets.length; i++) {
        var bullet = bullets[i];

        switch(bullet.dir) {
        case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
        case 'down': bullet.pos[1] += bulletSpeed * dt; break;
        default:
			var degrees=bullet.sprite.degrees;
            bullet.pos[1] -= bulletSpeed * dt *  Math.sin(degrees/180*Math.PI);
			bullet.pos[0] -= bulletSpeed * dt *  Math.cos(degrees/180*Math.PI);
        }
 
        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > map_height ||
           bullet.pos[0] > map_width) {
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update all the enemies
    for(var i=0; i<enemies.length; i++) {
		var enemy=enemies[i]; 
		var d=1000000;
		for(var j=0; j<enemies.length; j++) {
			if(i!=j && Math.max((enemy.pos[1]-enemies[j].pos[1]),(enemy.pos[0]-enemies[j].pos[0]))>0){
			d=Math.min(d,Math.max((enemy.pos[1]-enemies[j].pos[1]),(enemy.pos[0]-enemies[j].pos[0])));
			}
		}
		var dg=180+((Math.atan((enemy.pos[1]+enemies[i].sprite.size[1]/2-player.pos[1])/(enemy.pos[0]+enemies[i].sprite.size[0]/2-player.pos[0]))*180/Math.PI))-180*(0-((enemy.pos[0]+enemies[i].sprite.size[0]/2-player.pos[0])<0)*1);
		
		if(enemies[i].name=="death star" && Math.random()>0.95){
			enemies[i].pos[0] += enemy.speed * dt * Math.cos(enemy.sprite.degrees/180*Math.PI); 
			enemies[i].pos[1] += enemy.speed * dt * Math.sin(enemy.sprite.degrees/180*Math.PI);
				if(dg>=enemies[i].sprite.degrees){
				enemies[i].sprite.degrees=Math.min(enemies[i].sprite.degrees+enemies[i].rotation*dt,dg);
				}
				if(dg<enemies[i].sprite.degrees){
				enemies[i].sprite.degrees=Math.max(enemies[i].sprite.degrees-enemies[i].rotation*dt,dg);
				}
		        bullets.push({ pos: [enemies[i].pos[0]+800,enemies[i].pos[1]+800],
							   type:"enemy",
		                       dir: 'forward',
								object_type:"env",
		                       sprite: new Sprite('img/bullet.png', [0, 0], [24, 8], 16, [0],enemies[i].sprite.degrees) });
				bullets[bullets.length-1].sprite.degrees=enemies[i].sprite.degrees-180;
		}
		if(enemies[i].type=="fighter" && (Math.abs(enemy.pos[1]+enemies[i].sprite.size[1]/2-player.pos[1])<=600||enemies[i].name=="destroy"||name=="death star") && (Math.abs(enemy.pos[0]+enemies[i].sprite.size[0]/2-player.pos[0])<=800||enemies[i].name=="destroy"||name=="death star")){
			if(d>50+Math.max(enemies[i].sprite.size[0],enemies[i].sprite.size[1])){
				
			if(dg>=enemies[i].sprite.degrees){
			enemies[i].sprite.degrees=Math.min(enemies[i].sprite.degrees+enemies[i].rotation*dt,dg);
			}
			if(dg<enemies[i].sprite.degrees){
			enemies[i].sprite.degrees=Math.max(enemies[i].sprite.degrees-enemies[i].rotation*dt,dg);
			}
			enemies[i].pos[0] += enemy.speed * dt * Math.cos(enemy.sprite.degrees/180*Math.PI); 
			enemies[i].pos[1] += enemy.speed * dt * Math.sin(enemy.sprite.degrees/180*Math.PI);
			}
			else if(d>0){
			if(dg>=enemies[i].sprite.degrees){
			enemies[i].sprite.degrees=Math.min(enemies[i].sprite.degrees+enemies[i].rotation*dt,dg);
			}
			if(dg<enemies[i].sprite.degrees){
			enemies[i].sprite.degrees=Math.max(enemies[i].sprite.degrees-enemies[i].rotation*dt,dg);
			}
			}
			
			if(Math.random()>0.99 && enemies[i].name!="death star"){
		        bullets.push({ pos: get_pos(enemies[i]),
							   type:"enemy",
		                       dir: 'forward',
								object_type:"env",
		                       sprite: new Sprite('img/bullet.png', [0, 0], [24, 8], 16, [0],enemies[i].sprite.degrees) });
				bullets[bullets.length-1].sprite.degrees=enemies[i].sprite.degrees-180;
			}
			if(enemies[i].name=="death star" && Math.random()>0.9){
		        bullets.push({ pos: [enemies[i].pos[0]+200,enemies[i].pos[1]+200],
							   type:"enemy",
		                       dir: 'forward',
								object_type:"env",
		                       sprite: new Sprite('img/bullet.png', [0, 0], [24, 8], 16, [0],enemies[i].sprite.degrees) });
				bullets[bullets.length-1].sprite.degrees=enemies[i].sprite.degrees-180;
			}
		}
		else{
			enemies[i].pos[0] += enemy.speed * dt * Math.cos(enemy.sprite.degrees/180*Math.PI); 
			enemy.pos[1] += enemy.speed * dt * Math.sin(enemy.sprite.degrees/180*Math.PI);
		}
		compass_markers.push({pos:[enemies[i].pos[0]*(200/map_width)+20,enemies[i].pos[1]*(125/map_height)+20],sprite:new Sprite('img/enemy_marker.png', [0, 0], [10, 10], 16, [0], degrees)});
        enemies[i].sprite.update(dt);
        // Remove if offscreen
		var x=get_pos(enemies[i])[0];
		var y=get_pos(enemies[i])[1];
        if(x< 0 ||x>map_width||y  < 0 ||y>map_height) {
			spawn_vfx("teleport",enemies[i].pos);
            enemies[i].pos[0]=map_width-enemies[i].sprite.size[0]-10;
			enemies[i].pos[1]=Math.max(enemies[i].sprite.size[0]+10,Math.min(enemies[i].pos[1],map_height-enemies[i].sprite.size[0]-10));
			enemies[i].sprite.degrees=180;
			spawn_vfx("teleport",enemies[i].pos);
        }
    }

    // Update all the explosions
    for(var i=0; i<vfx.length; i++) {
        vfx[i].sprite.update(dt);

        // Remove if animation is done
        if(vfx[i].sprite.done) {
            vfx.splice(i, 1);
            i--;
        }
    }
	compass_markers.push({object_type:"env",pos:[player.pos[0]*(200/map_width)+20,player.pos[1]*(125/map_height)+20],sprite:new Sprite('img/player_marker.png', [0, 0], [10, 10], 16, [0], degrees)});
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(var i=0; i<enemies.length; i++) {
        var pos = enemies[i].pos;
        var size = enemies[i].sprite.size;

        for(var j=0; j<bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

            if(boxCollides(pos, size, pos2, size2)&& bullets[j].type=="simple") {
				if(enemies[i].damage_chance>Math.random()){
				enemies[i].health-=1*config.damage[lv];
				}
				bullets.splice(j, 1);
				if(enemies[i].health<=0){
		xp+=enemies[i].xp_bonus;
		stats.xp=Math.max(stats.xp+enemies[i].xp_bonus,0);
                // Remove the enemy
                enemies.splice(i, 1);
                i--;

                // Add score
                score += 100;

                // Add an explosion
                spawn_vfx("explosion",pos);

                // Remove the bullet and stop this iteration
                break;
				}
            }
            if(boxCollides(player.pos, player.sprite.size, pos2, size2)&& bullets[j].type=="enemy") {
				player.health--;
				bullets.splice(j, 1);
				if(player.health<1){
                gameOver();
                j--;
                break;
				}
            }
        }
	if(time<0){
                gameOver();
                break;
	}
        if(boxCollides(pos, size, player.pos, player.sprite.size)) {
				player.health--;
				if(player.health<1){
                gameOver();
                break;
				}
        }
    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > map_width - player.sprite.size[0]) {
        player.pos[0] = map_width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > map_height - player.sprite.size[1]) {
        player.pos[1] = map_height - player.sprite.size[1];
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
	//renderEntities(terrain);
	renderEntities(terrain);
    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
    }

    
    renderEntities(enemies);
	renderEntities(bullets);
    renderEntities(vfx);
	renderEntities(holes);
	renderEntities(compass);
	renderEntities(compass_markers);
};

function render_player_params(){
	
}

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
	if(isGameOver){
		if(entity.sprite.url=='img/terrain.png'){
	    ctx.save();
	    ctx.translate(0,0);
	    entity.sprite.render(ctx);
	    ctx.restore();
		}
	}
	else if(entity.sprite.url=='img/compass.png' ||entity.sprite.url=='img/player_marker.png' ||entity.sprite.url=='img/enemy_marker.png'){
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();	
	}
	else if(entity.sprite.url!='img/terrain.png'){
    ctx.save();
    ctx.translate(entity.pos[0]+(800-player.pos[0]), entity.pos[1]+(400-player.pos[1]));
    entity.sprite.render(ctx);
    ctx.restore();
	}
	else{
    ctx.save();
    ctx.translate(entity.pos[0]+(800-player.pos[0])%2500, entity.pos[1]+(400-player.pos[1])%1500);
    entity.sprite.render(ctx);
    ctx.restore();
	}
	
	if(!isGameOver && entity.object_type=="unit"){
	    var percent = entity.health / entity.mhealth;
	    var context = canvas.getContext('2d');
		var x=get_pos(entity)[0]+(800-player.pos[0]);
		var y=get_pos(entity)[1]+(400-player.pos[1]);
		var xs=get_size(entity)[0];
		var ys=get_size(entity)[1];
	
	    context.fillStyle = "black";
	    context.fillRect(x-40,y-ys-35, 80, 12); 
	
	    context.fillStyle = "red";
	    context.fillRect(x-38, y-ys-34, 76*percent, 10);    
		context.fillStyle = "white";
		
	}
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
    localStorage.setItem('stats', JSON.stringify(stats));
}

function gameWin() {
    document.getElementById('game-win').style.display = 'block';
    document.getElementById('game-win-overlay').style.display = 'block';
    isGameOver = true;
	stats.passed=Math.max(stats.selected,stats.passed);
	
	localStorage.setItem('stats', JSON.stringify(stats));
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;

    enemies = [];
    bullets = [];

	var player = {
		health:config.health[lv],
		mhealth:config.health[lv],
		object_type:"unit",
	    pos: [0, 0],
	    sprite: new Sprite('img/player_1.png', [0, 0], [122, 100], 16, [0],180)
	};
};
