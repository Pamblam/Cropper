
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
	
	function waitForCanvasWidth(canvas){
		return new Promise(done=>{
			const wait = () => {
				setTimeout(() => {
					if(canvas.getBoundingClientRect().width > 0) return done();
					wait();
				}, 10);
			};
			wait();
		});
	}
	
	async function prep_canvas(canvas, img, line_width, line_color, bg_color){
		canvas.width = img.width;
		canvas.height = img.height;
		await waitForCanvasWidth(canvas);
		var ctx = canvas.getContext('2d');
		var scale = canvas.width / canvas.getBoundingClientRect().width;
		ctx.strokeStyle = line_color;
		ctx.lineWidth = line_width * scale;
		ctx.fillStyle = bg_color;
		return ctx;
	}
	
	function clearcanvas(ctx, img){
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.drawImage(img, 0, 0);
	}
	
	function draw_circle(ctx, x, y, circle_diam){
		var r = circle_diam / 2;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, 2 * Math.PI, false);
		ctx.stroke();
	}
	
	function set_crop_pos(ctx, img, leftx, topy, rightx, bottomy, circle_diam){
		var scale = ctx.canvas.width / parseFloat(ctx.canvas.getBoundingClientRect().width);
		circle_diam = circle_diam * scale;
		
		clearcanvas(ctx, img);
		draw_circle(ctx, leftx, topy, circle_diam);
		draw_circle(ctx, rightx, topy, circle_diam);
		draw_circle(ctx, rightx, bottomy, circle_diam);
		draw_circle(ctx, leftx, bottomy, circle_diam);
		
		draw_circle(ctx, leftx, topy+((bottomy-topy)/2), circle_diam);
		draw_circle(ctx, rightx, topy+((bottomy-topy)/2), circle_diam);
		draw_circle(ctx, leftx+((rightx-leftx)/2), topy, circle_diam);
		draw_circle(ctx, leftx+((rightx-leftx)/2), bottomy, circle_diam);
		
		ctx.strokeRect(leftx, topy, rightx-leftx, bottomy-topy);
		
		ctx.fillRect(0, 0, leftx, ctx.canvas.height); // left, full height
		ctx.fillRect(leftx, 0, ctx.canvas.width-leftx, topy); // top, remaining width
		ctx.fillRect(rightx, topy, ctx.canvas.width-rightx, ctx.canvas.height-topy); // right, remaining height
		ctx.fillRect(leftx, bottomy, rightx-leftx, ctx.canvas.height-bottomy); // bottom, remaining width
	}
	
	function attach_events(ctx, img, leftx, topy, rightx, bottomy, circle_diam, callback){
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
		
		const getTouchPos = e => {
			var bounds = ctx.canvas.getBoundingClientRect();
			var scale = ctx.canvas.width / parseFloat(bounds.width);
			var x = (e.touches[0].clientX - bounds.left) * scale;
			var y = (e.touches[0].clientY - bounds.top) * scale;
			return {canvasX: x, canvasY: y};
		};

		const onMove = pos => {
			var {canvasX, canvasY} = pos;
			
			var scaled_circle_diam = (ctx.canvas.width / parseFloat(ctx.canvas.getBoundingClientRect().width)) * circle_diam;
			
			var onDownCallback = ()=>{};
			var onUpCallback = ()=>{};
			
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
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.leftx = coords.rightx - (scaled_circle_diam*2);
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.topy = coords.bottomy - (scaled_circle_diam*2);
					break;
				case "cl":
					coords.leftx = canvasX;
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.leftx = coords.rightx - (scaled_circle_diam*2);
					break;
				case "tr":
					coords.rightx = canvasX;
					coords.topy = canvasY;
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.rightx = coords.leftx + (scaled_circle_diam*2);
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.topy = coords.bottomy - (scaled_circle_diam*2);
					break;
				case "tc":
					coords.topy = canvasY;
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.topy = coords.bottomy - (scaled_circle_diam*2);
					break;
				case "br":
					coords.rightx = canvasX;
					coords.bottomy = canvasY;
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.rightx = coords.leftx + (scaled_circle_diam*2);
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.bottomy = coords.topy + (scaled_circle_diam*2);
					break;
				case "cr":
					coords.rightx = canvasX;
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.rightx = coords.leftx + (scaled_circle_diam*2);
					break;
				case "bl":
					coords.leftx = canvasX;
					coords.bottomy = canvasY;
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.bottomy = coords.topy + (scaled_circle_diam*2);
					if(coords.rightx - coords.leftx < (scaled_circle_diam*2)) coords.leftx = coords.rightx - (scaled_circle_diam*2);
					break;
				case "bc":
					coords.bottomy = canvasY;
					if(coords.bottomy - coords.topy < (scaled_circle_diam*2)) coords.bottomy = coords.topy + (scaled_circle_diam*2);
					break;
			}
			set_crop_pos(ctx, img, coords.leftx, coords.topy, coords.rightx, coords.bottomy, circle_diam);
			callback(coords);
		};
		
		const onDown = pos => {
			var {canvasX, canvasY} = pos;
			var scaled_circle_diam = (ctx.canvas.width / parseFloat(ctx.canvas.getBoundingClientRect().width)) * circle_diam;
			var horiz_edge = null;
			var vert_edge = null;
			if(Math.abs(coords.topy - canvasY) <= (scaled_circle_diam/2)) horiz_edge = 't';
			if(Math.abs(coords.bottomy - canvasY) <= (scaled_circle_diam/2)) horiz_edge = 'b';
			if(Math.abs(coords.topy+((coords.bottomy-coords.topy)/2) - canvasY) <= (scaled_circle_diam/2)) horiz_edge = 'c';
			if(Math.abs(coords.leftx - canvasX) <= (scaled_circle_diam/2)) vert_edge = 'l';
			if(Math.abs(coords.rightx - canvasX) <= (scaled_circle_diam/2)) vert_edge = 'r';
			if(Math.abs(coords.leftx+((coords.rightx-coords.leftx)/2) - canvasX) <= (scaled_circle_diam/2)) vert_edge = 'c';
			if(horiz_edge && vert_edge) active_corner = horiz_edge+vert_edge;
			else if(canvasX > coords.leftx && canvasX < coords.rightx && canvasY > coords.topy && canvasY < coords.bottomy){
				active_corner = 'a';
				lastx = canvasX;
				lasty = canvasY;
			}
		};
		
		function onMouseMove(event){ if(active_corner) onMove(getMousePos(event)); }
		ctx.canvas.addEventListener('mousemove', onMouseMove);
		
		function onTouchMove(event){ if(active_corner) onMove(getTouchPos(event)); }
		ctx.canvas.addEventListener('touchmove', onTouchMove);
		
		function onMouseDown(event){ onDown(getMousePos(event)); }
		ctx.canvas.addEventListener('mousedown', onMouseDown);
		
		function onTouchStart(event){ onDown(getTouchPos(event)); }
		ctx.canvas.addEventListener('touchstart', onTouchStart);
		
		function onUp(){ active_corner = null; }
		document.addEventListener('touchend', onUp);
		document.addEventListener('mouseup', onUp);
		
		return {
			destroy: function destroy(){
				clearcanvas(ctx, img);
				ctx.canvas.removeEventListener('mousemove', onMouseMove);
				ctx.canvas.removeEventListener('touchmove', onTouchMove);
				ctx.canvas.removeEventListener('mousedown', onMouseDown);
				ctx.canvas.removeEventListener('touchstart', onTouchStart);
				document.removeEventListener('touchend', onUp);
				document.removeEventListener('mouseup', onUp);
			},
			onDown: function onDown(callback){
				if(typeof callback !== 'function') return;
				onDownCallback = callback;
			},
			onUp: function onUp(){
				if(typeof callback !== 'function') return;
				onUpCallback = callback;
			}
		};
	}
	
	function datauri(img, leftx, topy, rightx, bottomy){
		var canvas = document.createElement('canvas');
		canvas.width = rightx-leftx;
		canvas.height = bottomy-topy;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, leftx, topy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL();
	}
	
	function blob(img, leftx, topy, rightx, bottomy){
		var canvas = document.createElement('canvas');
		canvas.width = rightx-leftx;
		canvas.height = bottomy-topy;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, leftx, topy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
		return new Promise(cb => canvas.toBlob(cb));
	}
	
	return async function crop(canvas, image_url, circle_diam = 30, line_width = 2, line_color = '#FF0000', bg_color = 'rgba(102, 102, 102, 0.4)'){
		var img = await load_image(image_url);
		var ctx = await prep_canvas(canvas, img, line_width, line_color, bg_color);
		var leftx = img.width/3;
		var topy = img.height/3;
		var rightx = (img.width/3)*2;
		var bottomy = (img.height/3)*2;
		
		set_crop_pos(ctx, img, leftx, topy, rightx, bottomy, circle_diam);
		
		var oncrop = ()=>{};
		const cropper = attach_events(ctx, img, leftx, topy, rightx, bottomy, circle_diam, coords => {
			({leftx, topy, rightx, bottomy} = coords);
			oncrop();
		});
		
		return {
			oncrop: cb => oncrop = cb,
			datauri: () => datauri(img, leftx, topy, rightx, bottomy),
			blob: () => blob(img, leftx, topy, rightx, bottomy),
			destroy: cropper.destroy,
			ondown: cropper.onDown,
			onup: cropper.onUp
		};
	};
	
})();


