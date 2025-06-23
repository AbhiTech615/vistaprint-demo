const params = new URLSearchParams(window.location.search);
const productId = params.get('id');
const canvas = new fabric.Canvas('productCanvas');
let textObj = null;

let canvasHistory = [];
let historyStep = -1;
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

function updateHistory() {
  historyStep++;
  if (historyStep < canvasHistory.length) {
    canvasHistory = canvasHistory.slice(0, historyStep);
  }
  canvasHistory.push(JSON.stringify(canvas));
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  if (undoBtn) undoBtn.disabled = historyStep <= 0;
  if (redoBtn) redoBtn.disabled = historyStep >= canvasHistory.length - 1;
}

canvas.on('object:added', updateHistory);
canvas.on('object:modified', updateHistory);
canvas.on('object:removed', updateHistory);

function undoCanvas() {
  if (historyStep > 0) {
    historyStep--;
    canvas.loadFromJSON(canvasHistory[historyStep], () => canvas.renderAll());
    updateUndoRedoButtons();
  }
}

function redoCanvas() {
  if (historyStep < canvasHistory.length - 1) {
    historyStep++;
    canvas.loadFromJSON(canvasHistory[historyStep], () => canvas.renderAll());
    updateUndoRedoButtons();
  }
}

fetch(`/api/products/${productId}`)
  .then(res => res.json())
  .then(product => {
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productDescription').textContent = product.description;
    document.getElementById('productPrice').textContent = product.starting_price;

    fabric.Image.fromURL(product.thumbnail, function(img) {
      img.selectable = false;
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
      updateHistory();
    });
  })
  .catch(err => console.error('Error fetching product:', err));

bizName.addEventListener('input', function () {
  if (!textObj) {
    textObj = new fabric.Textbox(this.value, { left: 100, top: 100, fontSize: 24, fill: fontColor.value, fontFamily: fontStyle.value });
    canvas.add(textObj);
  } else {
    textObj.text = this.value;
  }
  canvas.renderAll();
});

fontStyle.addEventListener('change', function () {
  if (textObj) {
    textObj.set("fontFamily", this.value);
    canvas.renderAll();
  }
});

fontColor.addEventListener('input', function () {
  if (textObj) {
    textObj.set("fill", this.value);
    canvas.renderAll();
  }
});

quantity.addEventListener('input', function () {
  const basePrice = parseFloat(document.getElementById('productPrice').textContent);
  const qty = parseInt(this.value) || 1;
  const updatedPrice = basePrice * qty;
  document.getElementById('productPrice').textContent = isFinite(updatedPrice) ? updatedPrice.toFixed(2) : '0.00';
});

function addText() {
  const newText = new fabric.Textbox('Your Text Here', { left: 100, top: 100, fontSize: 24, fill: '#000' });
  canvas.add(newText);
  textObj = newText;
}

function addImage() {
  const imageUrl = prompt('Enter image URL:');
  if (imageUrl) {
    fabric.Image.fromURL(imageUrl, function(img) {
      img.set({ left: 150, top: 150, scaleX: 0.3, scaleY: 0.3 });
      canvas.add(img);
    });
  }
}

function saveDesign() {
  const designData = canvas.toJSON();
  const productName = document.getElementById('productName').textContent;
  const quantityVal = parseInt(document.getElementById('quantity').value) || 1;

  fetch('/api/designs/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      productId,
      productName,
      quantity: quantityVal,
      designJson: designData
    })
  })
  .then(res => res.json())
  .then(data => {
    alert('Design saved to database!');
    console.log('Server Response:', data);
  })
  .catch(err => {
    alert('Error saving design.');
    console.error(err);
  });
}



function loadSavedDesign() {
  const saved = localStorage.getItem('savedDesign');
  if (saved) {
    canvas.loadFromJSON(saved, () => canvas.renderAll());
    alert('Loaded saved design!');
  } else {
    alert('No saved design found.');
  }
}

function downloadDesign() {
  const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'custom-design.png';
  link.click();
}

addToCartButton.addEventListener('click', () => {
  const designData = canvas.toJSON();
  const quantityVal = parseInt(document.getElementById('quantity').value) || 1;
  const productName = document.getElementById('productName').textContent;
  const payload = {
    productId,
    productName,
    quantity: quantityVal,
    design: designData
  };
  console.log('Sending to cart:', payload);
  alert('Product added to cart!');
});

function loadTemplate(imageSrc) {
  fabric.Image.fromURL(imageSrc, function(img) {
    img.selectable = false;
    canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    updateHistory();
  });
}

document.getElementById('imageUpload').addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) {
    alert('Please upload a valid image file (JPG, PNG, GIF)');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch('/api/designs/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      fabric.Image.fromURL(result.url, function (img) {
        img.selectable = false;
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas)); // ✅ set as background
      });
    } else {
      alert('Image upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Error uploading image');
  }
});
