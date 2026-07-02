async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.success) {
    if (data.user && data.user.role === 'admin') {
      window.location.href = "/pages/admin.html";
    } else {
      window.location.href = "/pages/dashboard.html";
    }
  } else {
    message.textContent = data.message || "Login failed";
  }
}

async function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const message = document.getElementById("message");

  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  message.textContent = data.message;

  if (data.success) {
    setTimeout(() => {
      window.location.href = "/pages/login.html";
    }, 1000);
  }
}

async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  window.location.href = "/pages/login.html";
}

async function loadAdminUsers() {
  const userList = document.getElementById('userList');
  if (!userList) return;

  const res = await fetch('/api/admin/users', {
    credentials: 'include'
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    userList.innerHTML = '<p class="empty-state">Unable to load users.</p>';
    return;
  }

  window.adminUsers = data.users || [];
  renderAdminUsers(window.adminUsers);
}

function renderAdminUsers(users) {
  const userList = document.getElementById('userList');
  if (!userList) return;

  if (!users.length) {
    userList.innerHTML = '<p class="empty-state">No registered users found.</p>';
    return;
  }

  userList.innerHTML = users.map((user) => `
    <div class="food-item admin-user-item">
      <span>${user.email}</span>
      <div class="admin-actions">
        <button type="button" onclick="viewUserOverview('${user.email}')">Overview</button>
        <button type="button" style="background-color: #dc3545;" onclick="alert('Deleting user ${user.email}'); deleteAdminUser('${user.email}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deleteAdminUser(email) {
  if (!confirm(`Delete user ${email}?`)) return;

  const overviewPanel = document.getElementById('overviewPanel');
  const res = await fetch('/api/admin/users/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email })
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    alert(data.message || 'Unable to delete user');
    return;
  }

  window.adminUsers = (window.adminUsers || []).filter((user) => user.email !== email);
  renderAdminUsers(window.adminUsers);

  if (overviewPanel && overviewPanel.textContent.includes(email)) {
    overviewPanel.innerHTML = '<p class="empty-state">Select a user overview to see account details.</p>';
  }
}

async function filterUsers() {
  const query = document.getElementById('searchUser').value.trim().toLowerCase();
  const users = (window.adminUsers || []).filter((user) => user.email.toLowerCase().includes(query));
  renderAdminUsers(users);
}

async function viewUserOverview(email) {
  const overviewPanel = document.getElementById('overviewPanel');
  if (!overviewPanel) return;

  const res = await fetch('/api/admin/users/overview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email })
  });
  const data = await res.json();

  if (!res.ok || !data.success) {
    overviewPanel.innerHTML = '<p class="empty-state">Unable to load overview.</p>';
    return;
  }

  overviewPanel.innerHTML = `
    <div class="user-overview">
      <p><strong>Email:</strong> ${data.overview.email}</p>
      <p><strong>Created:</strong> ${data.overview.createdAt}</p>
      <p><strong>Last login:</strong> ${data.overview.lastLogin}</p>
      <p><strong>Foods logged:</strong> ${data.overview.foodCount}</p>
      <p><strong>Total calories:</strong> ${data.overview.totalCalories}</p>
    </div>
  `;
}

window.addEventListener('load', () => {
  if (document.getElementById('userList')) {
    loadAdminUsers();
  }
});
