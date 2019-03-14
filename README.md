## Cropper

a simple plugin to allow users to crop images

https://pamblam.github.io/Cropper/

#### Usage

plugin exposes a single function: `crop` which accepts a canvas element as the first argument and an image path as the second argument. obviously the image must be CORS safe.

the `crop` function returns a promise which resolves to an object with 2 properties: 

 - `oncrop` which is a function that accepts a callback function to be called every time the crop area changes.
 - `datauri` which is afunction that returns a datauri for the cropped area.

@todo: get blob method

#### Example

	<canvas id="canvas" style="width:50%;"></canvas>
	<div><img src="" id="preview"></div>
	<script src="cropper.js"></script>
	<script>
		var canvas = document.getElementById('canvas');
		var preview = document.getElementById('preview');
		crop(canvas, 'example.jpg').then(cropper=>{
			cropper.oncrop(()=>{
				console.log(cropper.datauri());
				preview.src = cropper.datauri();
			});
		});
	</script>
