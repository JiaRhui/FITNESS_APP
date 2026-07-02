function $(id) {
  return document.getElementById(id);
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server response' }));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function setMessage(id, message, type = 'error') {
  const element = $(id);
  if (!element) return;
  element.textContent = message || '';
  element.className = `form-message ${type}`;
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  sessionStorage.clear();
  window.location.href = '/pages/login.html';
}

async function login() {
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;

  if (email === 'admin' && password === 'admin') {
    sessionStorage.setItem('admin', 'true');
    window.location.href = '/pages/admin.html';
    return;
  }

  try {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.success) {
      sessionStorage.setItem('email', email);
      window.location.href = '/pages/dashboard.html';
    }
  } catch (error) {
    setMessage('loginMessage', error.message);
  }
}

async function signup() {
  try {
    const data = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value })
    });
    setMessage('message', data.message || 'Account created successfully', 'success');
    setTimeout(() => { window.location.href = '/pages/login.html'; }, 700);
  } catch (error) {
    setMessage('message', error.message);
  }
}

async function loadUsers() {
  const userList = $('userList');
  if (!userList) return;
  try {
    const data = await apiFetch('/api/admin/users');
    userList.innerHTML = '';
    if (!data.users.length) {
      userList.innerHTML = '<p class="empty-state">No users found.</p>';
      return;
    }
    data.users.forEach((user) => {
      const row = document.createElement('div');
      row.className = 'user-row';
      row.dataset.email = user.email.toLowerCase();
      row.innerHTML = `<span>${user.email}</span><div class="row-actions"><button onclick="overviewUser('${user.email}')">Overview</button><button class="danger-button" onclick="deleteUser('${user.email}')">Delete</button></div>`;
      userList.appendChild(row);
    });
  } catch (error) {
    userList.innerHTML = `<p class="form-message error">${error.message}</p>`;
  }
}

function filterUsers() {
  const search = $('searchUser').value.toLowerCase();
  document.querySelectorAll('.user-row').forEach((row) => {
    row.style.display = row.dataset.email.includes(search) ? 'flex' : 'none';
  });
}

async function deleteUser(email) {
  if (!confirm(`Delete ${email}?`)) return;
  try {
    await apiFetch(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' });
    await loadUsers();
  } catch (error) {
    alert(error.message);
  }
}

async function overviewUser(email) {
  try {
    const data = await apiFetch('/api/admin/users/overview', { method: 'POST', body: JSON.stringify({ email }) });
    const overview = data.overview;
    $('overviewPanel').innerHTML = `<h3>${overview.email}</h3><dl class="overview-list"><div><dt>Created</dt><dd>${overview.createdAt}</dd></div><div><dt>Last login</dt><dd>${overview.lastLogin}</dd></div></dl>`;
  } catch (error) {
    alert(error.message);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    loadUsers();
  });
}
