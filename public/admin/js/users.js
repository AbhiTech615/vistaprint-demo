// public/admin/js/users.js

// Load all users on page load
window.addEventListener("DOMContentLoaded", loadUsers);

// Fetch and render users
async function loadUsers() {
  try {
    const res = await fetch("/users");
    const users = await res.json();
    const tbody = document.getElementById("userList");
    tbody.innerHTML = "";

    users.forEach((user, index) => {
      const joinedDate = user.joined
        ? new Date(user.joined).toLocaleDateString()
        : "—";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${user.name || ""}</td>
        <td>${user.email || ""}</td>
        <td>${joinedDate}</td>
        <td class="actions">
          <button class="btn-edit" data-id="${user._id}" data-name="${user.name}" data-email="${user.email}">Edit</button>
          <button class="btn-delete" data-id="${user._id}">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    attachUserEvents();
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

// Attach delete and edit event listeners
function attachUserEvents() {
  // Delete button
  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.dataset.id;
      if (confirm("Are you sure you want to delete this user?")) {
        await fetch(`/users/${userId}`, { method: "DELETE" });
        loadUsers();
      }
    });
  });

  // Edit button
  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const email = btn.dataset.email;

      document.getElementById("editUserId").value = id;
      document.getElementById("editUserName").value = name;
      document.getElementById("editUserEmail").value = email;

      document.getElementById("userEditModal").classList.remove("hidden");
    });
  });
}

// Save changes from modal
document.getElementById("btnSaveUserChanges").addEventListener("click", async () => {
  const id = document.getElementById("editUserId").value;
  const name = document.getElementById("editUserName").value;
  const email = document.getElementById("editUserEmail").value;

  const res = await fetch(`/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  if (res.ok) {
    alert("User updated successfully");
    document.getElementById("userEditModal").classList.add("hidden");
    loadUsers();
  } else {
    alert("Failed to update user");
  }
});
