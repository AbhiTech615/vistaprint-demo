
const ordersApi = '/orders';
let allOrders = [];

async function loadOrders() {
  try {
    allOrders = await fetch(ordersApi).then(res => res.json());
    renderOrders(allOrders);
  } catch (err) {
    console.error('Error loading orders:', err);
  }
}

function renderOrders(data) {
  const fromDate = document.getElementById('dateFrom').value;
  const toDate   = document.getElementById('dateTo').value;
  const status   = document.getElementById('statusFilter').value;

  let filtered = data;
  if (fromDate) filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(fromDate));
  if (toDate)   filtered = filtered.filter(o => new Date(o.createdAt) <= new Date(toDate));
  if (status)   filtered = filtered.filter(o => o.status === status);

  const tbody = document.querySelector('#ordersTable tbody');
  tbody.innerHTML = '';

  filtered.forEach(order => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${order.orderNumber}</td>
      <td>${order.customer.name}<br/><small>${order.customer.email}</small></td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>₹${order.total.toFixed(2)}</td>
      <td>
        <select class="status-dropdown" data-id="${order._id}">
          <option ${order.status?.toLowerCase() === 'pending' ? 'selected' : ''}>Pending</option>
          <option ${order.status?.toLowerCase() === 'processing' ? 'selected' : ''}>Processing</option>
          <option ${order.status?.toLowerCase() === 'shipped' ? 'selected' : ''}>Shipped</option>
          <option ${order.status?.toLowerCase() === 'delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
      <td>
        <button class="btnView" data-id="${order._id}">View</button>
        <button class="btnUpdate" data-id="${order._id}">Update</button>
        <button class="delete-order-btn" data-id="${order._id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  attachEventListeners();
}

function attachEventListeners() {
  document.querySelectorAll('.status-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', async (e) => {
      const orderId = e.target.dataset.id;
      const status = e.target.value;

      const res = await fetch(`/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const result = await res.json();
      alert(result.success ? 'Status updated' : 'Failed to update status');
    });
  });

  document.querySelectorAll('.delete-order-btn').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm("Delete this order?")) return;

      const orderId = button.dataset.id;
      const res = await fetch(`/admin/orders/${orderId}`, { method: 'DELETE' });
      const result = await res.json();

      if (result.success) {
        alert("Order deleted");
        loadOrders(); // Reload orders
      } else {
        alert("Failed to delete order");
      }
    });
  });

  document.querySelectorAll('.btnView').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      viewOrder(id);
    });
  });

  document.querySelectorAll('.btnUpdate').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      showEditModal(id);
    });
  });
}

async function showEditModal(orderId) {
  try {
    const order = await fetch(`/orders/${orderId}`).then(res => res.json());
    document.getElementById('editOrderAddress').value = order.customer.address || '';
    document.getElementById('editOrderStatus').value = order.status || 'Pending';
    document.getElementById('btnSaveOrderChanges').dataset.id = order._id;
    document.getElementById('orderModal').classList.remove('hidden');
  } catch (err) {
    console.error('Failed to load order for update:', err);
  }
}

async function viewOrder(id) {
  try {
    const order = await fetch(`/orders/${id}`).then(res => res.json());
    const detailDiv = document.getElementById('orderDetails');
    detailDiv.innerHTML = `
      <p><strong>Order #:</strong> ${order.orderNumber}</p>
      <p><strong>Customer:</strong> ${order.customer.name} (${order.customer.email})</p>
      <p><strong>Address:</strong> ${order.customer.address || '—'}</p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <h4>Items:</h4>
      <ul>
        ${order.items?.map(item => `<li>${item.qty}× ${item.name} @ ₹${item.price.toFixed(2)}</li>`).join('') || '<li>No items</li>'}
      </ul>
      <p><strong>Total:</strong> ₹${order.total.toFixed(2)}</p>
    `;
    document.getElementById('orderModal').classList.remove('hidden');
  } catch (err) {
    console.error('Error fetching order details:', err);
    alert("Unable to load order details.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();

  document.getElementById('btnFilter').addEventListener('click', () => {
    renderOrders(allOrders);
  });

  document.getElementById('btnCloseOrderModal').addEventListener('click', () => {
    document.getElementById('orderModal').classList.add('hidden');
  });

  document.body.addEventListener('click', async (e) => {
    if (e.target.id === 'btnSaveOrderChanges') {
      const orderId = e.target.dataset.id;
      const address = document.getElementById('editOrderAddress').value;
      const status = document.getElementById('editOrderStatus').value;

      const res = await fetch(`/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { address },
          status
        })
      });

      if (res.ok) {
        alert("Order updated");
        document.getElementById('orderModal').classList.add('hidden');
        loadOrders();
      } else {
        alert("Failed to update order");
      }
    }
  });
});
