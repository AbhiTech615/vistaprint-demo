
// public/admin/js/products.js

const api = '/products';
let allProducts = [];

// Modal control
function openModal(isEdit = false, data = {}) {
  const modal = document.getElementById('productModal');
  modal.classList.remove('hidden');
  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Product' : 'Add Product';

  const form = document.getElementById('formProduct');
  form.name.value        = data.name || '';
  form.price.value       = data.starting_price || data.price || '';
  form.thumbnail.value   = data.thumbnail || data.imageUrl || '';
  form.category.value    = data.category || '';
  form.description.value = data.description || '';
  form.isActive.checked  = data.is_active !== false;
  form.dataset.id        = data._id || '';
}

function closeModal() {
  document.getElementById('productModal').classList.add('hidden');
}

// Save (create/update)
async function saveProduct(e) {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.id;
  const payload = {
    name: form.name.value,
    starting_price: parseFloat(form.price.value),
    thumbnail: form.thumbnail.value,
    category: form.category.value,
    description: form.description.value,
    is_active: form.isActive.checked
  };

  await fetch(id ? `${api}/${id}` : api, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  document.getElementById('categoryFilter').value = '';
  document.getElementById('statusFilter').value = '';
  closeModal();
  fetchProducts();
}

// Delete
async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  await fetch(`${api}/${id}`, { method: 'DELETE' });
  fetchProducts();
}

// Fetch and render
async function fetchProducts() {
  allProducts = await fetch(api).then(r => r.json());
  initFilters();
  document.getElementById('categoryFilter').value = '';
  document.getElementById('statusFilter').value = '';
  renderProducts();
}

function initFilters() {
  const catSel = document.getElementById('categoryFilter');
  catSel.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

  const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    catSel.appendChild(opt);
  });

  catSel.onchange = renderProducts;
  document.getElementById('statusFilter').onchange = renderProducts;
}

function renderProducts() {
  const category = document.getElementById('categoryFilter').value;
  const status = document.getElementById('statusFilter').value;

  let filtered = allProducts;
  if (category) filtered = filtered.filter(p => p.category === category);
  if (status) filtered = filtered.filter(p => status === 'active' ? p.is_active : !p.is_active);

  const tbody = document.querySelector('#productsTable tbody');
  tbody.innerHTML = '';

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    const price = typeof p.starting_price === 'number'
      ? p.starting_price.toFixed(2)
      : (typeof p.price === 'number' ? p.price.toFixed(2) : '0.00');

    const imageSrc = p.thumbnail || p.imageUrl;
    const thumb = imageSrc ? `<img class="thumb-img" src="${imageSrc.startsWith('/assets') ? imageSrc : '/assets/' + imageSrc}" alt="${p.name}">` : '';

    tr.innerHTML = `
      <td>${thumb}</td>
      <td>${p.name}</td>
      <td>$${price}</td>
      <td>${p.is_active ? '✔️' : '❌'}</td>
      <td>
        <button class="btnEdit" data-id="${p._id}">Edit</button>
        <button class="btnDelete" data-id="${p._id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

// Event listeners
window.addEventListener('DOMContentLoaded', () => {
  fetchProducts();

  document.getElementById('btnAddProduct').onclick = () => openModal();
  document.getElementById('btnCancel').onclick = closeModal;
  document.getElementById('formProduct').onsubmit = saveProduct;

  document.querySelector('#productsTable tbody').onclick = e => {
    if (e.target.matches('.btnEdit')) {
      fetch(`${api}/${e.target.dataset.id}`)
        .then(r => r.json())
        .then(data => openModal(true, data));
    }
    if (e.target.matches('.btnDelete')) {
      deleteProduct(e.target.dataset.id);
    }
  };
});
// Fetch and render
async function fetchProducts() {
  console.log("🔍 fetching products..."); // ✅ Add this line
  allProducts = await fetch(api).then(r => r.json());
  console.log("📦 allProducts:", allProducts); // 🔍 Optional: show what's coming from server
  initFilters();
  document.getElementById('categoryFilter').value = '';
  document.getElementById('statusFilter').value = '';
  renderProducts();
}

