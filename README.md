## Cropper

A simple plugin to allow users to crop images

Demo: https://pamblam.github.io/Cropper/

#### Usage

The plugin exposes a single function: `crop`:

```
/**
 * Create plugin that allows user to crop image
 * @param - {HTMLCanvasElement} canvas - Canvas on which to build the interface
 * @param - {DOMString} image_url - CORS safe URI of image to be cropped
 * @param - (optional) {Number} circle_diam - Diameter of grab points in pixels - default is 30
 * @param - (optional) {Number} line_width - Line width - default is 2
 * @param - (optional) {DOMString} line_color - CSS color value of the crop lines - default is '#FF0000'
 * @param - (optional) {DOMString} bg_color - CSS color value of the crop background - default is 'rgba(102, 102, 102, 0.4)'
 */
async function crop(canvas, image_url, circle_diam = 30, line_width = 2, line_color = '#FF0000', bg_color = 'rgba(102, 102, 102, 0.4)')
```

`crop` returns a promise which resolves to an object with 4 properties: 

 - `oncrop` which is a function that accepts a callback function to be called every time the crop area changes.
 - `datauri` which is a function that returns a datauri for the cropped area.
 - `blob` which is a function that return a promise that resolves with a Blob that represents the cropped image.
 - `destroy` which is function that destroys the cropper instance.

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

See also: [Cropper Demo](https://pamblam.github.io/Cropper/)