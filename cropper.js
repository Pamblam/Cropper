
/**
 * Cropper is a simple plugin to allow users to crop images
 * @author pamblam
 * @license WTFPL
 * @type Function
 */

var crop = (function(){
	
	function load_image(src){
		return new Promise(done=>{
			var img = new Image();
			img.onload = function(){
				done(this);
			};
			img.src = src;
		});
	}
	
	function prep_canvas(canvas, img){
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext('2d');
		ctx.strokeStyle = '#FF0000';
		ctx.lineWidth = 2;
		ctx.fillStyle = "rgba(102, 102, 102, 0.4)";
		return ctx;
	}
	
	function clearcanvas(ctx, img){
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.drawImage(img, 0, 0);
	}
	
	function draw_circle(ctx, x, y){
		var r = 15;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		ctx.stroke();
	}
	
	function set_crop_pos(ctx, img, leftx, topy, rightx, bottomy){
		clearcanvas(ctx, img);
		draw_circle(ctx, leftx, topy);
		draw_circle(ctx, rightx, topy);
		draw_circle(ctx, rightx, bottomy);
		draw_circle(ctx, leftx, bottomy);
		
		draw_circle(ctx, leftx, topy+((bottomy-topy)/2));
		draw_circle(ctx, rightx, topy+((bottomy-topy)/2));
		draw_circle(ctx, leftx+((rightx-leftx)/2), topy);
		draw_circle(ctx, leftx+((rightx-leftx)/2), bottomy);
		
		ctx.strokeRect(leftx, topy, rightx-leftx, bottomy-topy);
		ctx.fillRect(0, 0, leftx, ctx.canvas.width); // left, full height
		ctx.fillRect(leftx, 0, ctx.canvas.width-leftx, topy); // top, remaining width
		ctx.fillRect(rightx, topy, ctx.canvas.width-rightx, ctx.canvas.height-topy); // right, remaining height
		ctx.fillRect(leftx, bottomy, rightx-leftx, ctx.canvas.height-bottomy); // bottom, remaining width
	}
	
	function attach_events(ctx, img, leftx, topy, rightx, bottomy, callback){
		var coords = {leftx, topy, rightx, bottomy};
		var active_corner = null;
		var lastx = 0, lasty = 0, xmovement = 0, ymovement = 0;
		const getMousePos = e => {
			var bounds = ctx.canvas.getBoundingClientRect();
			var scale = ctx.canvas.width / parseFloat(bounds.width);
			var x = (e.clientX - bounds.left) * scale;
			var y = (e.clientY - bounds.top) * scale;
			return {canvasX: x, canvasY: y};
		};
		
		ctx.canvas.addEventListener('mousemove', function(event){
			if(!active_corner) return;
			var {canvasX, canvasY} = getMousePos(event);
			
			switch(active_corner){
				case "a":
					xmovement = canvasX - lastx;
					ymovement = canvasY - lasty;
					lastx = canvasX;
					lasty = canvasY;
					if(coords.bottomy + ymovement <= ctx.canvas.height && coords.topy + ymovement > 0){
						coords.topy += ymovement;
						coords.bottomy += ymovement;
					}
					if(coords.rightx + xmovement <= ctx.canvas.width && coords.leftx + xmovement > 0){
						coords.rightx += xmovement;
						coords.leftx += xmovement;
					}
					break;
				case "tl":
					coords.leftx = canvasX;
					coords.topy = canvasY;
					if(coords.rightx - coords.leftx < 60) coords.leftx = coords.rightx - 60;
					if(coords.bottomy - coords.topy < 60) coords.topy = coords.bottomy - 60;
					break;
				case "cl":
					coords.leftx = canvasX;
					if(coords.rightx - coords.leftx < 60) coords.leftx = coords.rightx - 60;
					break;
				case "tr":
					coords.rightx = canvasX;
					coords.topy = canvasY;
					if(coords.rightx - coords.leftx < 60) coords.rightx = coords.leftx + 60;
					if(coords.bottomy - coords.topy < 60) coords.topy = coords.bottomy - 60;
					break;
				case "tc":
					coords.topy = canvasY;
					if(coords.bottomy - coords.topy < 60) coords.topy = coords.bottomy - 60;
					break;
				case "br":
					coords.rightx = canvasX;
					coords.bottomy = canvasY;
					if(coords.rightx - coords.leftx < 60) coords.rightx = coords.leftx + 60;
					if(coords.bottomy - coords.topy < 60) coords.bottomy = coords.topy + 60;
					break;
				case "cr":
					coords.rightx = canvasX;
					if(coords.rightx - coords.leftx < 60) coords.rightx = coords.leftx + 60;
					break;
				case "bl":
					coords.leftx = canvasX;
					coords.bottomy = canvasY;
					if(coords.bottomy - coords.topy < 60) coords.bottomy = coords.topy + 60;
					if(coords.rightx - coords.leftx < 60) coords.leftx = coords.rightx - 60;
					break;
				case "bc":
					coords.bottomy = canvasY;
					if(coords.bottomy - coords.topy < 60) coords.bottomy = coords.topy + 60;
					break;
			}
			set_crop_pos(ctx, img, coords.leftx, coords.topy, coords.rightx, coords.bottomy);
			callback(coords);
		});
		
		ctx.canvas.addEventListener('mousedown', function(event){
			var {canvasX, canvasY} = getMousePos(event);
			var horiz_edge = null;
			var vert_edge = null;
			if(Math.abs(coords.topy - canvasY) <= 15) horiz_edge = 't';
			if(Math.abs(coords.bottomy - canvasY) <= 15) horiz_edge = 'b';
			if(Math.abs(coords.topy+((coords.bottomy-coords.topy)/2) - canvasY) <= 15) horiz_edge = 'c';
			if(Math.abs(coords.leftx - canvasX) <= 15) vert_edge = 'l';
			if(Math.abs(coords.rightx - canvasX) <= 15) vert_edge = 'r';
			if(Math.abs(coords.leftx+((coords.rightx-coords.leftx)/2) - canvasX) <= 15) vert_edge = 'c';
			if(horiz_edge && vert_edge) active_corner = horiz_edge+vert_edge;
			else if(canvasX > coords.leftx && canvasX < coords.rightx && canvasY > coords.topy && canvasY < coords.bottomy){
				active_corner = 'a';
				lastx = canvasX;
				lasty = canvasY;
			}
		});
		
		document.addEventListener('mouseup', function(event){
			active_corner = null;
		});
		
		ctx.canvas.addEventListener('mouseout', function(event){
			active_corner = null;
		});
		
	}
	
	function datauri(img, leftx, topy, rightx, bottomy){
		var canvas = document.createElement('canvas');
		canvas.width = rightx-leftx;
		canvas.height = bottomy-topy;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, leftx, topy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL();
	}
	
	return async function crop(canvas, image_url){
		var img = await load_image(image_url);
		var ctx = prep_canvas(canvas, img);
		var leftx = img.width/3;
		var topy = img.height/3;
		var rightx = (img.width/3)*2;
		var bottomy = (img.height/3)*2;
		set_crop_pos(ctx, img, leftx, topy, rightx, bottomy);
		var oncrop = ()=>{};
		attach_events(ctx, img, leftx, topy, rightx, bottomy, coords => {
			({leftx, topy, rightx, bottomy} = coords);
			oncrop();
		});
		return {
			oncrop: cb => oncrop = cb,
			datauri: () => datauri(img, leftx, topy, rightx, bottomy)
		}
	};
	
})();


