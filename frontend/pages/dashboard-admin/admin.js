/*
  ============================================================
  THE SNOOGUMS ACADEMY - ADMIN DASHBOARD JAVASCRIPT
  File: dashboard/admin/admin.js

  THIS FILE HANDLES:
  1. JWT authentication check on page load
  2. Sidebar navigation between sections
  3. Loading data from backend for each section
  4. User management (activate, deactivate, delete)
  5. Payment confirmation / rejection
  6. Application status updates
  7. Message reading
  8. Password change
  ============================================================
*/

const API_BASE = 'https://tsa-website-8rqt.onrender.com/api';

/* ============================================================
   SECTION 1: AUTHENTICATION CHECK
   This runs IMMEDIATELY when the page loads.
   If no valid admin token → redirect to login.
============================================================ */

/*
  getAuthHeaders()
  Returns the Authorization header object needed for
  all protected API requests.
  Every fetch() call to /api/admin/* must include this.
*/
function getAuthHeaders() {
  const token = localStorage.getItem('tsa_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/*
  checkAuth()
  Verifies the stored token is valid and belongs to an admin.
  Called immediately on page load.
*/
async function checkAuth() {
  const token = localStorage.getItem('tsa_token');
  const userStr = localStorage.getItem('tsa_user');

  // No token at all → go to login
  if (!token || !userStr) {
    window.location.href = '../login.html';
    return;
  }

  const user = JSON.parse(userStr);

  // Token exists but user is not admin → go to login
  if (user.role !== 'admin') {
    window.location.href = '../login.html';
    return;
  }

  try {
    // Verify token is still valid with the server
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      // Token expired or invalid
      localStorage.removeItem('tsa_token');
      localStorage.removeItem('tsa_user');
      window.location.href = '../login.html';
      return;
    }

    const result = await response.json();

    if (result.data.role !== 'admin') {
      window.location.href = '../login.html';
      return;
    }

    // Auth passed — show the dashboard
    const adminName = result.data.first_name;
    document.getElementById('sidebarName').textContent  = adminName;
    document.getElementById('headerName').textContent   = adminName;
    document.getElementById('sidebarAvatar').textContent = adminName.charAt(0).toUpperCase();
    document.getElementById('headerAvatar').textContent  = adminName.charAt(0).toUpperCase();

    // Hide loading screen, show dashboard
    document.getElementById('authLoading').style.display    = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';

    // Load the default section (overview)
    loadSection('overview');
    updateHeaderDate();

  } catch (error) {
    console.error('Auth check failed:', error);
    window.location.href = '../login.html';
  }
}

// Run auth check immediately
checkAuth();


/* ============================================================
   SECTION 2: HEADER DATE
============================================================ */
function updateHeaderDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('headerDate').textContent = now.toLocaleDateString('en-GB', options);
}


/* ============================================================
   SECTION 3: SIDEBAR NAVIGATION
   Clicking a sidebar link shows the matching section
   and hides all others.
============================================================ */
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');

sidebarLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const section = this.dataset.section;
    loadSection(section);

    // Close mobile sidebar after clicking
    document.getElementById('sidebar').classList.remove('open');
  });
});

// "View all" links in overview cards
document.querySelectorAll('.dash-card-link[data-section]').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    loadSection(this.dataset.section);
  });
});

function loadSection(sectionName) {
  // Update active sidebar link
  sidebarLinks.forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Hide all sections, show the target one
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  const targetSection = document.getElementById(`section-${sectionName}`);
  if (targetSection) targetSection.classList.add('active');

  // Update header title
  const titles = {
    overview:     'Overview',
    users:        'User Management',
    payments:     'Payment Management',
    applications: 'Teacher Applications',
    messages:     'Contact Messages',
    courses:      'Course Management',
    liveclasses:   'Live Class Management',
    announcements: 'Announcement Board',
    settings:      'Account Settings'
  };
  document.getElementById('headerTitle').textContent = titles[sectionName] || sectionName;

  // Load data for this section
  const loaders = {
    overview:     loadOverview,
    users:        loadUsers,
    payments:     loadPayments,
    applications: loadApplications,
    messages:     loadMessages,
    courses:      loadCourses,
    liveclasses:   loadLiveClasses,
    announcements: loadAnnouncements
  };
  if (loaders[sectionName]) loaders[sectionName]();
}


/* ============================================================
   SECTION 4: MOBILE SIDEBAR TOGGLE
============================================================ */
document.getElementById('headerHamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

document.getElementById('sidebarClose').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
});


/* ============================================================
   SECTION 5: LOGOUT
============================================================ */
document.getElementById('logoutBtn').addEventListener('click', function (e) {
  e.preventDefault();
  localStorage.removeItem('tsa_token');
  localStorage.removeItem('tsa_user');
  window.location.href = '../login.html';
});


/* ============================================================
   SECTION 6: TOAST NOTIFICATION HELPER
   Shows a small notification at the bottom right of the screen.
   Used for success/error feedback after actions.
============================================================ */
function showToast(message, type = 'success') {
  const toast    = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');

  toast.className = `toast toast-${type}`;
  toastMsg.textContent = message;
  toastIcon.className = type === 'success'
    ? 'fas fa-check-circle toast-icon'
    : 'fas fa-exclamation-circle toast-icon';

  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}


/* ============================================================
   SECTION 7: MODAL HELPERS
============================================================ */
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');

function openModal(title, contentHTML) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalContent').innerHTML = contentHTML;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });


/* ============================================================
   SECTION 8: OVERVIEW
============================================================ */
async function loadOverview() {
  try {
    const response = await fetch(`${API_BASE}/admin/stats`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    const d = result.data;

    // Update stat cards
    document.getElementById('statTotalStudents').textContent       = d.totalStudents;
    document.getElementById('statPendingPayments').textContent     = d.pendingPayments;
    document.getElementById('statPendingApplications').textContent = d.pendingApplications;
    document.getElementById('statUnreadMessages').textContent      = d.unreadMessages;

    // Update sidebar badges
    document.getElementById('badgeUsers').textContent        = d.totalStudents;
    document.getElementById('badgePayments').textContent     = d.pendingPayments;
    document.getElementById('badgeApplications').textContent = d.pendingApplications;
    document.getElementById('badgeMessages').textContent     = d.unreadMessages;

    // Recent registrations
    const regContainer = document.getElementById('recentRegistrations');
    if (d.recentRegistrations.length === 0) {
      regContainer.innerHTML = '<p style="color:var(--text-light);font-size:0.875rem;">No registrations yet</p>';
    } else {
      regContainer.innerHTML = d.recentRegistrations.map(u => `
        <div class="mini-row">
          <div>
            <div class="mini-row-name">${u.first_name} ${u.last_name}</div>
            <div class="mini-row-sub">${u.email}</div>
          </div>
          <span class="pill ${u.is_active ? 'pill-active' : 'pill-inactive'}">
            ${u.is_active ? 'Active' : 'Pending'}
          </span>
        </div>`).join('');
    }

    // Recent pending payments
    const payContainer = document.getElementById('recentPayments');
    if (d.recentPayments.length === 0) {
      payContainer.innerHTML = '<p style="color:var(--text-light);font-size:0.875rem;">No pending payments</p>';
    } else {
      payContainer.innerHTML = d.recentPayments.map(p => `
        <div class="mini-row">
          <div>
            <div class="mini-row-name">${p.first_name} ${p.last_name}</div>
            <div class="mini-row-sub">₦${Number(p.amount).toLocaleString()} · ${p.payment_method}</div>
          </div>
          <span class="pill pill-pending">Pending</span>
        </div>`).join('');
    }

  } catch (error) {
    console.error('Load overview error:', error);
  }
}


/* ============================================================
   SECTION 9: USERS
============================================================ */
let currentRoleFilter = 'all';

async function loadUsers(role = currentRoleFilter) {
  currentRoleFilter = role;
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_BASE}/admin/users?role=${role}`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(u => `
      <tr>
        <td><strong>${u.first_name} ${u.last_name}</strong></td>
        <td>${u.email}</td>
        <td><span class="pill pill-${u.role}">${u.role}</span></td>
        <td><span class="pill ${u.is_active ? 'pill-active' : 'pill-inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>${formatDate(u.created_at)}</td>
        <td>
          <div class="btn-group">
            ${u.role === 'student' ? `<button class="dash-btn dash-btn-info" onclick="viewStudentProgrammes(${u.id}, '${u.first_name} ${u.last_name}')"><i class="fas fa-book"></i> Programmes</button>` : ''}
            <button class="dash-btn ${u.is_active ? 'dash-btn-danger' : 'dash-btn-success'}"
              onclick="toggleUserStatus(${u.id}, ${u.is_active})">
              <i class="fas fa-${u.is_active ? 'ban' : 'check'}"></i>
              ${u.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button class="dash-btn dash-btn-danger" onclick="deleteUser(${u.id}, '${u.first_name} ${u.last_name}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');

  } catch (error) {
    console.error('Load users error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Failed to load users</td></tr>';
  }
}

// Filter buttons for users table
document.querySelectorAll('#section-users .filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#section-users .filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    loadUsers(this.dataset.role);
  });
});

async function toggleUserStatus(userId, currentStatus) {
  try {
    const newStatus = !currentStatus;
    const response = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: newStatus })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    showToast(result.message);
    loadUsers(currentRoleFilter);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Make globally accessible (called from onclick in table rows)
window.toggleUserStatus = toggleUserStatus;

async function deleteUser(userId, userName) {
  if (!confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) return;
  try {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    showToast(result.message);
    loadUsers(currentRoleFilter);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

window.deleteUser = deleteUser;


/* ============================================================
   SECTION 10: PAYMENTS
============================================================ */
let currentPaymentFilter = 'all';

async function loadPayments(status = currentPaymentFilter) {
  currentPaymentFilter = status;
  const tbody = document.getElementById('paymentsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_BASE}/admin/payments?status=${status}`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No payments found</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(p => `
      <tr>
        <td>
          <strong>${p.first_name} ${p.last_name}</strong>
          <div style="font-size:0.78rem;color:var(--text-light)">${p.email}</div>
        </td>
        <td><strong>₦${Number(p.amount).toLocaleString()}</strong></td>
        <td>${p.payment_method === 'paystack' ? '💳 Paystack' : '🏦 Manual'}</td>
        <td><span class="pill pill-${p.status}">${p.status}</span></td>
        <td>${formatDate(p.created_at)}</td>
        <td>
          <div class="btn-group">
            ${p.status === 'pending' ? `
              <button class="dash-btn dash-btn-success" onclick="handlePayment(${p.id}, 'confirm')">
                <i class="fas fa-check"></i> Confirm
              </button>
              <button class="dash-btn dash-btn-danger" onclick="handlePayment(${p.id}, 'reject')">
                <i class="fas fa-times"></i> Reject
              </button>
            ` : `<span style="font-size:0.78rem;color:var(--text-light)">${p.confirmed_at ? formatDate(p.confirmed_at) : '—'}</span>`}
            <button class="dash-btn dash-btn-info" onclick="viewPaymentDetails(${JSON.stringify(p).replace(/"/g, '&quot;')})">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');

  } catch (error) {
    console.error('Load payments error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Failed to load payments</td></tr>';
  }
}

document.querySelectorAll('#section-payments .filter-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#section-payments .filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    loadPayments(this.dataset.status);
  });
});

async function handlePayment(paymentId, action) {
  const confirmMsg = action === 'confirm'
    ? 'Confirm this payment? This will activate the student\'s account.'
    : 'Reject this payment?';
  if (!confirm(confirmMsg)) return;

  try {
    const response = await fetch(`${API_BASE}/admin/payments/${paymentId}/confirm`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    showToast(result.message);
    loadPayments(currentPaymentFilter);
    loadOverview(); // Refresh stats
  } catch (error) {
    showToast(error.message, 'error');
  }
}

window.handlePayment = handlePayment;

function viewPaymentDetails(payment) {
  const content = `
    <p><strong>Student:</strong> ${payment.first_name} ${payment.last_name}</p>
    <p><strong>Email:</strong> ${payment.email}</p>
    <p><strong>Amount:</strong> ₦${Number(payment.amount).toLocaleString()}</p>
    <p><strong>Method:</strong> ${payment.payment_method}</p>
    ${payment.payment_method === 'manual' ? `
      <p><strong>Bank Name:</strong> ${payment.bank_name || '—'}</p>
      <p><strong>Account Name:</strong> ${payment.account_name || '—'}</p>
      <p><strong>Transfer Date:</strong> ${payment.transfer_date || '—'}</p>
    ` : `<p><strong>Paystack Ref:</strong> ${payment.paystack_reference || '—'}</p>`}
    <p><strong>Status:</strong> ${payment.status}</p>
    <p><strong>Date:</strong> ${formatDate(payment.created_at)}</p>`;
  openModal('Payment Details', content);
}

window.viewPaymentDetails = viewPaymentDetails;


/* ============================================================
   SECTION 11: APPLICATIONS
============================================================ */
async function loadApplications() {
  const tbody = document.getElementById('applicationsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_BASE}/admin/applications`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-loading">No applications yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(a => `
      <tr>
        <td><strong>${a.first_name} ${a.last_name}</strong></td>
        <td>${a.email}</td>
        <td>${a.subject || '—'}</td>
        <td>${a.experience || '—'}</td>
        <td><span class="pill pill-${a.status === 'pending' ? 'pending' : a.status === 'hired' ? 'active' : a.status === 'rejected' ? 'rejected' : 'inactive'}">${a.status}</span></td>
        <td>${formatDate(a.created_at)}</td>
        <td>
          <div class="btn-group">
            <button class="dash-btn dash-btn-info" onclick="viewApplication(${JSON.stringify(a).replace(/"/g, '&quot;')})">
              <i class="fas fa-eye"></i> View
            </button>
            ${a.status === 'pending' ? `
              <button class="dash-btn dash-btn-success" onclick="updateApplication(${a.id}, 'shortlisted')">
                <i class="fas fa-check"></i> Shortlist
              </button>
              <button class="dash-btn dash-btn-danger" onclick="updateApplication(${a.id}, 'rejected')">
                <i class="fas fa-times"></i> Reject
              </button>
            ` : ''}
          </div>
        </td>
      </tr>`).join('');

  } catch (error) {
    console.error('Load applications error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Failed to load applications</td></tr>';
  }
}

function viewApplication(app) {
  const createAccountBtn = (app.status === 'shortlisted' || app.status === 'pending' || app.status === 'reviewed')
    ? `<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--border);">
        <h4 style="font-family:var(--font-head);font-size:0.95rem;margin-bottom:1rem;color:var(--text);">
          <i class="fas fa-user-plus" style="color:var(--pink);"></i> Create Teacher Account
        </h4>
        <div style="margin-bottom:0.75rem;">
          <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-light);margin-bottom:0.3rem;">Temporary Password</label>
          <input type="password" id="teacherTempPassword" placeholder="Set a temporary password (min 8 chars)"
            style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-size:0.875rem;outline:none;">
        </div>
        <p style="font-size:0.78rem;color:var(--text-light);margin-bottom:0.75rem;">
          The teacher will be able to change this password after their first login.
        </p>
        <p class="create-teacher-msg" id="createTeacherMsg" style="font-size:0.82rem;min-height:1em;margin-bottom:0.5rem;"></p>
        <button class="dash-btn dash-btn-primary" onclick="createTeacherAccount(${app.id}, '${app.first_name} ${app.last_name}')">
          <i class="fas fa-user-plus"></i> Create Teacher Account
        </button>
      </div>`
    : app.status === 'hired'
    ? `<div style="margin-top:1rem;padding:0.75rem;background:rgba(56,161,105,0.08);border-radius:8px;color:var(--green);font-size:0.875rem;font-weight:700;">
        ✅ Teacher account already created for this applicant
      </div>`
    : '';

  const content = `
    <p><strong>Name:</strong> ${app.first_name} ${app.last_name}</p>
    <p><strong>Email:</strong> ${app.email}</p>
    <p><strong>Phone:</strong> ${app.phone || '—'}</p>
    <p><strong>Subject:</strong> ${app.subject || '—'}</p>
    <p><strong>Experience:</strong> ${app.experience || '—'}</p>
    <p><strong>Qualification:</strong> ${app.qualification || '—'}</p>
    <p><strong>Bio:</strong><br>${app.bio || '—'}</p>
    ${app.cv_path ? `<p><strong>CV:</strong> <a href="http://localhost:5000/${app.cv_path}" target="_blank" style="color:var(--pink);font-weight:700;">Download CV</a></p>` : ''}
    <p><strong>Status:</strong> ${app.status}</p>
    <p><strong>Applied:</strong> ${formatDate(app.created_at)}</p>
    ${createAccountBtn}`;

  openModal(`Application — ${app.first_name} ${app.last_name}`, content);
}

window.viewApplication = viewApplication;

async function updateApplication(appId, status) {
  try {
    const response = await fetch(`${API_BASE}/admin/applications/${appId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    showToast(result.message);
    loadApplications();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

window.updateApplication = updateApplication;


/* ============================================================
   SECTION 12: MESSAGES
============================================================ */
async function loadMessages() {
  const container = document.getElementById('messagesList');
  container.innerHTML = '<div class="table-loading">Loading messages...</div>';

  try {
    const response = await fetch(`${API_BASE}/admin/messages`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      container.innerHTML = '<div class="table-loading">No messages yet</div>';
      return;
    }

    container.innerHTML = result.data.map(m => `
      <div class="message-item ${m.is_read ? '' : 'unread'}" id="msg-${m.id}">
        <div class="message-icon">${m.name.charAt(0).toUpperCase()}</div>
        <div class="message-content">
          <div class="message-name">${m.name} ${!m.is_read ? '<span class="pill pill-pending" style="font-size:0.65rem;">New</span>' : ''}</div>
          <div class="message-subject">${m.subject || 'General Enquiry'}</div>
          <div class="message-preview">${m.message.substring(0, 100)}${m.message.length > 100 ? '...' : ''}</div>
          <div class="message-meta">${m.email} · ${formatDate(m.created_at)}</div>
        </div>
        <div class="message-actions">
          <button class="dash-btn dash-btn-info" onclick="viewMessage(${JSON.stringify(m).replace(/"/g, '&quot;')})">
            <i class="fas fa-eye"></i> Read
          </button>
          ${!m.is_read ? `<button class="dash-btn dash-btn-success" onclick="markRead(${m.id})"><i class="fas fa-check"></i></button>` : ''}
        </div>
      </div>`).join('');

  } catch (error) {
    console.error('Load messages error:', error);
    container.innerHTML = '<div class="table-loading">Failed to load messages</div>';
  }
}

function viewMessage(msg) {
  if (!msg.is_read) markRead(msg.id);
  openModal(`Message from ${msg.name}`, `
    <p><strong>From:</strong> ${msg.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${msg.email}" style="color:var(--pink)">${msg.email}</a></p>
    <p><strong>Subject:</strong> ${msg.subject || 'General Enquiry'}</p>
    <p><strong>Date:</strong> ${formatDate(msg.created_at)}</p>
    <hr style="margin:1rem 0;border-color:var(--border)">
    <p>${msg.message}</p>
    <div style="margin-top:1.5rem">
      <a href="mailto:${msg.email}?subject=Re: ${msg.subject || 'Your enquiry'}" class="dash-btn dash-btn-primary">
        <i class="fas fa-reply"></i> Reply via Email
      </a>
    </div>`);
}

window.viewMessage = viewMessage;

async function markRead(msgId) {
  try {
    await fetch(`${API_BASE}/admin/messages/${msgId}/read`, {
      method: 'PATCH', headers: getAuthHeaders()
    });
    const msgEl = document.getElementById(`msg-${msgId}`);
    if (msgEl) msgEl.classList.remove('unread');
    loadOverview(); // Refresh unread count badge
  } catch (error) {
    console.error('Mark read error:', error);
  }
}

window.markRead = markRead;


/* ============================================================
   SECTION 13: COURSES
============================================================ */
async function loadCourses() {
  const tbody = document.getElementById('coursesTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';

  try {
    const response = await fetch(`${API_BASE}/admin/courses`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success) throw new Error(result.message);

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No courses found. Add courses via the database for now.</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(c => `
      <tr>
        <td><strong>${c.title}</strong></td>
        <td>${c.category}</td>
        <td>${c.level}</td>
        <td>${c.first_name ? `${c.first_name} ${c.last_name}` : '—'}</td>
        <td><span class="pill ${c.is_active ? 'pill-active' : 'pill-inactive'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="dash-btn dash-btn-info">
            <i class="fas fa-edit"></i> Edit
          </button>
        </td>
      </tr>`).join('');

  } catch (error) {
    console.error('Load courses error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Failed to load courses</td></tr>';
  }
}


/* ============================================================
   SECTION 14: CHANGE PASSWORD
============================================================ */
document.getElementById('changePasswordForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const currentPassword    = document.getElementById('currentPassword').value;
  const newPassword        = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const msg                = document.getElementById('passwordMsg');

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    msg.textContent = 'All fields are required'; msg.className = 'settings-msg error'; return;
  }
  if (newPassword.length < 8) {
    msg.textContent = 'New password must be at least 8 characters'; msg.className = 'settings-msg error'; return;
  }
  if (newPassword !== confirmNewPassword) {
    msg.textContent = 'New passwords do not match'; msg.className = 'settings-msg error'; return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await response.json();

    if (result.success) {
      msg.textContent = '✓ Password changed successfully';
      msg.className = 'settings-msg success';
      this.reset();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    msg.textContent = error.message;
    msg.className = 'settings-msg error';
  }
});


/* ============================================================
   SECTION 15: DATE FORMATTER HELPER
============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}


/* ============================================================
   CREATE TEACHER ACCOUNT
============================================================ */
async function createTeacherAccount(applicationId, teacherName) {
  const passwordInput = document.getElementById('teacherTempPassword');
  const msgEl         = document.getElementById('createTeacherMsg');
  const password      = passwordInput ? passwordInput.value : '';

  if (!password || password.length < 8) {
    if (msgEl) { msgEl.textContent = 'Please set a password of at least 8 characters'; msgEl.style.color = 'var(--red)'; }
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/admin/applications/${applicationId}/create-teacher`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password })
    });

    const result = await response.json();

    if (result.success) {
      if (msgEl) {
        msgEl.textContent = `✅ Account created! ${teacherName} can now log in.`;
        msgEl.style.color = 'var(--green)';
      }
      showToast(`Teacher account created for ${teacherName}!`);
      // Refresh applications list
      setTimeout(() => { closeModal(); loadApplications(); }, 2000);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    if (msgEl) { msgEl.textContent = error.message; msgEl.style.color = 'var(--red)'; }
    showToast(error.message, 'error');
  }
}

window.createTeacherAccount = createTeacherAccount;


/* ============================================================
   LIVE CLASSES
============================================================ */
async function loadLiveClasses() {
  const tbody = document.getElementById('liveClassesBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Loading...</td></tr>';

  // Also populate the dropdowns for scheduling
  await populateScheduleDropdowns();

  try {
    const response = await fetch(`${API_BASE}/admin/live-classes`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No classes scheduled yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(lc => `
      <tr>
        <td><strong>${lc.title}</strong></td>
        <td>${lc.course_title}</td>
        <td>${lc.teacher_first} ${lc.teacher_last}</td>
        <td>${formatDate(lc.scheduled_at)}</td>
        <td>${lc.duration_mins} mins</td>
        <td><span class="pill pill-${lc.status === 'live' ? 'confirmed' : lc.status === 'completed' ? 'inactive' : 'pending'}">${lc.status}</span></td>
      </tr>`).join('');

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">Failed to load classes</td></tr>';
  }
}

async function populateScheduleDropdowns() {
  try {
    // Load teachers
    const tRes    = await fetch(`${API_BASE}/admin/users?role=teacher`, { headers: getAuthHeaders() });
    const tResult = await tRes.json();
    const teacherSelect = document.getElementById('lcTeacher');
    if (teacherSelect && tResult.data) {
      teacherSelect.innerHTML = '<option value="">-- Select Teacher --</option>' +
        tResult.data.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name}</option>`).join('');
    }

    // Load courses
    const cRes    = await fetch(`${API_BASE}/admin/courses`, { headers: getAuthHeaders() });
    const cResult = await cRes.json();
    const courseSelect = document.getElementById('lcCourse');
    if (courseSelect && cResult.data) {
      courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
        cResult.data.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    }
  } catch (error) {
    console.error('Populate dropdowns error:', error);
  }
}

// Schedule class form submit
const scheduleForm = document.getElementById('scheduleClassForm');
if (scheduleForm) {
  scheduleForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg = document.getElementById('scheduleMsg');

    const title       = document.getElementById('lcTitle').value.trim();
    const courseId    = document.getElementById('lcCourse').value;
    const teacherId   = document.getElementById('lcTeacher').value;
    const scheduledAt = document.getElementById('lcDateTime').value;
    const duration    = document.getElementById('lcDuration').value;

    if (!title || !courseId || !teacherId || !scheduledAt) {
      msg.textContent = 'Please fill in all required fields';
      msg.className   = 'settings-msg error';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/live-classes`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify({ title, courseId, teacherId, scheduledAt, durationMins: parseInt(duration) })
      });

      const result = await response.json();

      if (result.success) {
        msg.textContent = '✅ ' + result.message;
        msg.className   = 'settings-msg success';
        scheduleForm.reset();
        showToast('Live class scheduled successfully!');
        loadLiveClasses();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      msg.textContent = error.message;
      msg.className   = 'settings-msg error';
    }
  });
}


/* ============================================================
   ANNOUNCEMENTS
============================================================ */
const announceForm = document.getElementById('announceForm');
if (announceForm) {
  announceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg    = document.getElementById('announceMsg');
    const title  = document.getElementById('aTitle').value.trim();
    const body   = document.getElementById('aBody').value.trim();
    const target = document.getElementById('aTarget').value;

    if (!title || !body) {
      msg.textContent = 'Title and message are required';
      msg.className   = 'settings-msg error';
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/announcements`, {
        method:  'POST',
        headers: getAuthHeaders(),
        body:    JSON.stringify({ title, body, target })
      });
      const result = await response.json();
      if (result.success) {
        msg.textContent = '✅ ' + result.message;
        msg.className   = 'settings-msg success';
        announceForm.reset();
        showToast('Announcement posted!');
        loadAnnouncements();
      } else { throw new Error(result.message); }
    } catch (error) {
      msg.textContent = error.message;
      msg.className   = 'settings-msg error';
    }
  });
}

async function loadAnnouncements() {
  const list = document.getElementById('announceList');
  if (!list) return;
  list.innerHTML = '<div class="table-loading">Loading...</div>';

  try {
    const response = await fetch(`${API_BASE}/admin/announcements`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success || result.data.length === 0) {
      list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">No active announcements. Post one above!</p>';
      return;
    }

    list.innerHTML = result.data.map(a => `
      <div style="padding:1rem;border-bottom:1px solid var(--border);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.4rem;">
          <strong style="font-family:var(--font-head);color:var(--text);">${a.title}</strong>
          <span class="pill pill-${a.target === 'all' ? 'confirmed' : 'pending'}">${a.target === 'all' ? 'All Students' : a.target}</span>
        </div>
        <p style="font-size:0.875rem;color:var(--text-light);line-height:1.6;margin-bottom:0.4rem;">${a.body}</p>
        <span style="font-size:0.75rem;color:var(--text-light);">Posted by ${a.first_name} ${a.last_name} · ${formatDate(a.created_at)} · Expires ${formatDate(a.expires_at)}</span>
      </div>`).join('');

  } catch (error) {
    list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">Could not load announcements</p>';
  }
}

/* ============================================================
   VIEW STUDENT PROGRAMMES (in Users section)
============================================================ */
async function viewStudentProgrammes(studentId, studentName) {
  try {
    const response = await fetch(`${API_BASE}/admin/students/${studentId}/programmes`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success || result.data.length === 0) {
      openModal(`Programmes — ${studentName}`, '<p style="color:var(--text-light);">No programmes found for this student.</p>');
      return;
    }

    const content = result.data.map(p => `
      <p><strong>${p.name}</strong></p>
      <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:0.75rem;">
        Category: ${p.category} · ${p.duration_per_contact} · ₦${Number(p.price_per_contact).toLocaleString()}/contact<br>
        Payment: <strong style="color:var(--pink);">${p.payment_frequency || 'weekly'}</strong>
        · Status: <span style="color:${p.status === 'active' ? 'var(--green)' : 'var(--gold)'};">${p.status}</span>
      </p>`).join('<hr style="border-color:var(--border);margin:0.5rem 0;">');

    openModal(`Programmes — ${studentName}`, content);
  } catch (error) {
    showToast('Could not load programmes', 'error');
  }
}

window.viewStudentProgrammes = viewStudentProgrammes;


/* ============================================================
   CREATE STUDENT ACCOUNT
============================================================ */
const ALL_PROGRAMMES_ADMIN = {"academic": [{"id": 1, "name": "Primary Key Subject (Maths, English or Science)", "price": 8500}, {"id": 2, "name": "Primary Other Subject", "price": 7500}, {"id": 3, "name": "Primary Combo (2 Subjects)", "price": 7500}, {"id": 4, "name": "Primary Combo (3 Subjects)", "price": 7000}, {"id": 5, "name": "Secondary Key Subject", "price": 10000}, {"id": 6, "name": "Secondary Other Subject", "price": 8500}, {"id": 7, "name": "Secondary Combo (2 Subjects)", "price": 9000}, {"id": 8, "name": "Science Combo (3 Subjects)", "price": 9000}], "exam": [{"id": 9, "name": "WAEC/NECO Single Subject", "price": 10000}, {"id": 10, "name": "WAEC/NECO 4 Subjects", "price": 9500}, {"id": 11, "name": "WAEC/NECO 6 Subjects", "price": 9000}, {"id": 12, "name": "JAMB Standard", "price": 9000}, {"id": 17, "name": "IGCSE", "price": 8500}, {"id": 18, "name": "GCSE", "price": 8500}, {"id": 19, "name": "IELTS", "price": 8500}, {"id": 20, "name": "Checkpoint", "price": 8500}], "international": [{"id": 13, "name": "GCSE/IGCSE 1 Subject", "price": 10000}, {"id": 14, "name": "IELTS", "price": 12500}], "skills": [{"id": 15, "name": "Python Programming", "price": 8500}], "summer": [{"id": 17, "name": "AI Fundamentals & Digital Productivity", "price": 25000}, {"id": 18, "name": "Coding & Robotics", "price": 25000}, {"id": 19, "name": "Digital Design & Content Creation", "price": 25000}]};

function toggleCreateStudent() {
  const body = document.getElementById('createStudentBody');
  const icon = document.getElementById('createStudentToggleIcon');
  if (!body) return;
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  icon.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
}
window.toggleCreateStudent = toggleCreateStudent;

function loadCreateStudentProgrammes() {
  const cat  = document.getElementById('csCategory').value;
  const wrap = document.getElementById('csProgrammeWrap');
  const opts = document.getElementById('csProgrammeOptions');
  if (!cat) { wrap.style.display = 'none'; return; }
  const progs = ALL_PROGRAMMES_ADMIN[cat] || [];
  wrap.style.display = 'block';
  opts.innerHTML = progs.map(p => `
    <label style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0.75rem;border:1px solid var(--border);border-radius:8px;cursor:pointer;">
      <input type="checkbox" name="csProg[]" value="${p.id}" data-name="${p.name}" style="accent-color:var(--pink);">
      <span style="flex:1;font-size:0.875rem;">${p.name}</span>
      <strong style="color:var(--pink);">₦${p.price.toLocaleString()}</strong>
    </label>`).join('');
}
window.loadCreateStudentProgrammes = loadCreateStudentProgrammes;

const createStudentForm = document.getElementById('createStudentForm');
if (createStudentForm) {
  createStudentForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg       = document.getElementById('createStudentMsg');
    const firstName = document.getElementById('csFirstName').value.trim();
    const lastName  = document.getElementById('csLastName').value.trim();
    const email     = document.getElementById('csEmail').value.trim();
    const phone     = document.getElementById('csPhone').value.trim();
    const password  = document.getElementById('csPassword').value;
    const category  = document.getElementById('csCategory').value;
    const checked   = document.querySelectorAll('input[name="csProg[]"]:checked');
    const programmes = Array.from(checked).map(cb => ({ id: parseInt(cb.value), name: cb.dataset.name }));

    if (!firstName || !lastName || !email || !password) {
      msg.textContent = 'Name, email and password are required';
      msg.className   = 'settings-msg error'; return;
    }
    if (password.length < 8) {
      msg.textContent = 'Password must be at least 8 characters';
      msg.className   = 'settings-msg error'; return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/students/create`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ firstName, lastName, email, phone, password, category, programmes })
      });
      const result = await response.json();
      if (result.success) {
        msg.textContent = '✅ ' + result.message;
        msg.className   = 'settings-msg success';
        createStudentForm.reset();
        document.getElementById('csProgrammeWrap').style.display = 'none';
        showToast('Student account created!');
        loadUsers('student');
      } else { throw new Error(result.message); }
    } catch (error) {
      msg.textContent = error.message;
      msg.className   = 'settings-msg error';
    }
  });
}

console.log('%c 🛡️ Admin Dashboard Loaded ', 'background:#D0006F; color:white; padding:4px 8px; border-radius:4px;');
