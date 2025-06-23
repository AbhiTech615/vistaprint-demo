const canvas = new fabric.Canvas('productCanvas');

// Load base product image (e.g., t-shirt mockup)
fabric.Image.fromURL('/images/templates/tshirt.png', function(img) {
  img.selectable = false;
  canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
});

// Add text
function addText() {
  const text = new fabric.Textbox('Your Text Here', {
    left: 100, top: 100, fontSize: 24, fill: '#000'
  });
  canvas.add(text);
}

// Add user image
function addImage() {
  const url = prompt("Enter image URL:");
  fabric.Image.fromURL(url, function(img) {
    img.set({ left: 150, top: 150, scaleX: 0.3, scaleY: 0.3 });
    canvas.add(img);
  });
}

// Save design as JSON
function saveDesign() {
  const design = JSON.stringify(canvas.toJSON());
  console.log(design); // Send this to backend via AJAX/fetch
}
