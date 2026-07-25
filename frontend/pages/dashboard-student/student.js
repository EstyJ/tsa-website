/*
  ============================================================
  THE SNOOGUMS ACADEMY - STUDENT DASHBOARD JAVASCRIPT
  File: pages/dashboard-student/student.js
  ============================================================
*/

const API_BASE = 'https://tsa-website-8rqt.onrender.com/api';

function getAuthHeaders() {
  const token = localStorage.getItem('tsa_token');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

/* ============================================================
   AUTH CHECK
============================================================ */
async function checkAuth() {
  const token   = localStorage.getItem('tsa_token');
  const userStr = localStorage.getItem('tsa_user');

  if (!token || !userStr) { window.location.href = '../login.html'; return; }

  const user = JSON.parse(userStr);
  if (user.role !== 'student') { window.location.href = '../login.html'; return; }

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
    if (!response.ok) { localStorage.clear(); window.location.href = '../login.html'; return; }

    const result = await response.json();
    const student = result.data;

    // Set name in UI
    const name = `${student.first_name} ${student.last_name}`;
    document.getElementById('sidebarName').textContent  = name;
    document.getElementById('headerName').textContent   = student.first_name;
    document.getElementById('sidebarAvatar').textContent = student.first_name.charAt(0).toUpperCase();
    document.getElementById('headerAvatar').textContent  = student.first_name.charAt(0).toUpperCase();
    document.getElementById('welcomeMsg').textContent    = `Welcome back, ${student.first_name}!`;

    // Account status
    if (student.is_active) {
      document.getElementById('sidebarStatus').textContent = '✅ Access Active';
      document.getElementById('sidebarStatus').style.color = '#68D391';
      document.getElementById('statStatus').textContent = 'Active';
    } else {
      document.getElementById('sidebarStatus').textContent = '⏳ Pending Payment';
      document.getElementById('sidebarStatus').style.color = '#FFC200';
      document.getElementById('statStatus').textContent = 'Pending';
      document.getElementById('paymentNotice').style.display = 'flex';
    }

    // Show dashboard
    document.getElementById('authLoading').style.display    = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';

    // Load default section
    loadSection('overview');

  } catch (error) {
    console.error('Auth error:', error);
    window.location.href = '../login.html';
  }
}

checkAuth();


/* ============================================================
   NAVIGATION
============================================================ */
const sidebarLinks = document.querySelectorAll('.sidebar-link[data-section]');

sidebarLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    loadSection(this.dataset.section);
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.querySelectorAll('[data-section]').forEach(el => {
  if (!el.classList.contains('sidebar-link')) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      loadSection(this.dataset.section);
    });
  }
});

function loadSection(name) {
  sidebarLinks.forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-section="${name}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');

  const titles = { overview: 'Overview', courses: 'My Courses', live: 'Live Classes', payment: 'Payment', profile: 'My Profile' };
  document.getElementById('headerTitle').textContent = titles[name] || name;

  const loaders = { overview: loadOverview, courses: loadCourses, live: loadLiveClasses, payment: loadPaymentSection, profile: loadProfile };
  if (loaders[name]) loaders[name]();
}

/* Mobile sidebar */
document.getElementById('headerHamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

/* Logout */
document.getElementById('logoutBtn').addEventListener('click', function (e) {
  e.preventDefault();
  localStorage.clear();
  window.location.href = '../login.html';
});


/* ============================================================
   TOAST
============================================================ */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  document.getElementById('toastMessage').textContent = message;
  document.getElementById('toastIcon').className = type === 'success' ? 'fas fa-check-circle toast-icon' : 'fas fa-exclamation-circle toast-icon';
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}


/* ============================================================
   OVERVIEW
============================================================ */
async function loadOverview() {
  try {
    // Load payment history to show count
    const payRes  = await fetch(`${API_BASE}/payment/history`, { headers: getAuthHeaders() });
    const payData = await payRes.json();

    // Load courses
    const courseRes  = await fetch(`${API_BASE}/student/courses`, { headers: getAuthHeaders() });
    const courseData = courseRes.ok ? await courseRes.json() : { data: [] };

    document.getElementById('statCourses').textContent = courseData.data ? courseData.data.length : 0;

    // Show courses mini list in overview
    const overviewCourses = document.getElementById('overviewCourses');
    if (!courseData.data || courseData.data.length === 0) {
      overviewCourses.innerHTML = '<p style="color:var(--text-light);font-size:0.875rem;">No courses enrolled yet. Contact admin to get started.</p>';
    } else {
      overviewCourses.innerHTML = courseData.data.slice(0, 4).map(c => `
        <div class="mini-row">
          <div>
            <div class="mini-row-name">${c.title}</div>
            <div class="mini-row-sub">${c.category} · ${c.level}</div>
          </div>
          <span class="pill pill-confirmed">Enrolled</span>
        </div>`).join('');
    }

  } catch (error) {
    console.error('Overview error:', error);
  }

  // Load live classes
  loadLiveClassesPreview();
}


/* ============================================================
   LIVE CLASSES PREVIEW (for overview)
============================================================ */
async function loadLiveClassesPreview() {
  try {
    const response = await fetch(`${API_BASE}/student/live-classes`, { headers: getAuthHeaders() });
    if (!response.ok) return;

    const result = await response.json();
    const classes = result.data || [];

    document.getElementById('statLive').textContent = classes.length;

    // Check if any class is currently live
    const liveClass = classes.find(c => c.status === 'live');
    if (liveClass) {
      document.getElementById('liveIndicator').style.display = 'inline-block';
      const card = document.getElementById('upcomingLiveCard');
      const body = document.getElementById('upcomingLiveBody');
      card.style.display = 'block';
      body.innerHTML = `
        <div class="live-class-card is-live">
          <div class="lcc-icon live-now"><i class="fas fa-video"></i></div>
          <div class="lcc-info">
            <div class="lcc-title">${liveClass.title}</div>
            <div class="lcc-status-live">🔴 LIVE NOW — Teacher is in the classroom</div>
          </div>
          <button class="dash-btn dash-btn-primary" onclick="joinClass('${liveClass.jitsi_room}', '${liveClass.title}')">
            <i class="fas fa-video"></i> Join Now
          </button>
        </div>`;
    }
  } catch (error) {
    console.error('Live preview error:', error);
  }
}


/* ============================================================
   COURSES
   Uses the all-courses list since student enrollment
   will be managed by admin. Shows available courses.
============================================================ */
async function loadCourses() {
  const grid = document.getElementById('studentCoursesGrid');
  grid.innerHTML = '<div class="loading-rows"></div>';

  const userStr  = localStorage.getItem('tsa_user');
  const user     = JSON.parse(userStr);
  const isActive = user ? user.is_active : false;

  // Course images mapping
  const images = {
    coding:      '../../images/s13.jpg',
    mathematics: '../../images/s10.jpg',
    science:     '../../images/s15.jpg',
    english:     '../../images/s17.jpg',
    other:       '../../images/s12.jpg'
  };

  // Static courses matching the frontend courses page
  const courses = [
    { title: 'Introduction to Coding',      category: 'coding',      level: 'Beginner',     lessons: 24, weeks: 8 },
    { title: 'Mathematics Mastery',          category: 'mathematics', level: 'All Levels',   lessons: 30, weeks: 10 },
    { title: 'Science Explorers',            category: 'science',     level: 'Intermediate', lessons: 20, weeks: 6 },
    { title: 'English Language & Literature',category: 'english',     level: 'All Levels',   lessons: 28, weeks: 9 },
    { title: 'Advanced Web Development',     category: 'coding',      level: 'Advanced',     lessons: 36, weeks: 12 },
    { title: 'Junior Classroom',             category: 'other',       level: 'Ages 6-10',    lessons: 20, weeks: 8 },
  ];

  grid.innerHTML = courses.map(c => `
    <div class="student-course-card">
      <div class="scc-thumbnail">
        <img src="${images[c.category] || images.other}" alt="${c.title}">
        ${!isActive ? `
          <div class="scc-locked-overlay">
            <i class="fas fa-lock"></i>
            <span>Pay to Unlock</span>
          </div>` : ''}
      </div>
      <div class="scc-body">
        <div class="scc-category"><i class="fas fa-tag"></i> ${c.category}</div>
        <div class="scc-title">${c.title}</div>
        <div class="scc-meta">
          <span><i class="fas fa-play-circle"></i> ${c.lessons} Lessons</span>
          <span><i class="fas fa-clock"></i> ${c.weeks} Weeks</span>
        </div>
        ${isActive ?
          `<button class="dash-btn dash-btn-primary" style="margin-top:0.75rem;width:100%;justify-content:center;">
            <i class="fas fa-play"></i> Continue Learning
          </button>` :
          `<button class="dash-btn dash-btn-gold" style="margin-top:0.75rem;width:100%;justify-content:center;" onclick="document.querySelector('[data-section=payment]').click()">
            <i class="fas fa-lock"></i> Unlock Course
          </button>`
        }
      </div>
    </div>`).join('');
}


/* ============================================================
   LIVE CLASSES
============================================================ */
async function loadLiveClasses() {
  const list = document.getElementById('liveClassesList');
  list.innerHTML = '<div class="loading-rows"></div>';

  try {
    const response = await fetch(`${API_BASE}/student/live-classes`, { headers: getAuthHeaders() });

    if (!response.ok) {
      list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">No live classes scheduled yet.</p>';
      return;
    }

    const result = await response.json();
    const classes = result.data || [];

    if (classes.length === 0) {
      list.innerHTML = `
        <div class="dash-card">
          <div class="dash-card-body" style="text-align:center;padding:2rem;">
            <i class="fas fa-video" style="font-size:2rem;color:var(--border);margin-bottom:1rem;display:block;"></i>
            <p style="color:var(--text-light);">No live classes scheduled yet. Check back soon!</p>
          </div>
        </div>`;
      return;
    }

    list.innerHTML = classes.map(c => {
      const isLive = c.status === 'live';
      const date   = new Date(c.scheduled_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
      return `
        <div class="live-class-card ${isLive ? 'is-live' : ''}">
          <div class="lcc-icon ${isLive ? 'live-now' : ''}">
            <i class="fas fa-video"></i>
          </div>
          <div class="lcc-info">
            <div class="lcc-title">${c.title}</div>
            <div class="lcc-meta">
              ${isLive ? '<span class="lcc-status-live">🔴 LIVE NOW</span> · ' : ''}
              ${date} · ${c.duration_mins} mins
            </div>
          </div>
          ${isLive ?
            `<button class="dash-btn dash-btn-primary" onclick="joinClass('${c.jitsi_room}', '${c.title}')">
              <i class="fas fa-video"></i> Join Now
            </button>` :
            `<span style="font-size:0.8rem;color:var(--text-light);">Scheduled</span>`
          }
        </div>`;
    }).join('');

  } catch (error) {
    list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">Unable to load live classes.</p>';
  }
}


/* ============================================================
   JOIN JITSI CLASS
============================================================ */
function joinClass(roomName, className) {
  document.getElementById('jitsiClassName').textContent = className;
  document.getElementById('jitsiModal').classList.add('active');

  /*
    Jitsi Meet embed:
    We create an iframe pointing to meet.jit.si with the room name.
    The room name is stored in our database per class.
    No API key needed for public Jitsi rooms.
  */
  document.getElementById('jitsiContainer').innerHTML = `
    <iframe
      src="https://meet.jit.si/${roomName}"
      allow="camera; microphone; fullscreen; display-capture"
      style="width:100%;height:100%;border:none;">
    </iframe>`;
}

window.joinClass = joinClass;

document.getElementById('jitsiClose').addEventListener('click', function () {
  document.getElementById('jitsiModal').classList.remove('active');
  document.getElementById('jitsiContainer').innerHTML = ''; // Stop the video
});


/* ============================================================
   PAYMENT HISTORY
============================================================ */
async function loadPaymentHistory() {
  const tbody = document.getElementById('paymentHistoryBody');

  try {
    const response = await fetch(`${API_BASE}/payment/history`, { headers: getAuthHeaders() });
    const result   = await response.json();

    if (!result.success || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No payment records yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(p => `
      <tr>
        <td><strong>₦${Number(p.amount).toLocaleString()}</strong></td>
        <td>${p.payment_method === 'paystack' ? '💳 Paystack' : '🏦 Bank Transfer'}</td>
        <td><span class="pill pill-${p.status}">${p.status}</span></td>
        <td>${formatDate(p.created_at)}</td>
      </tr>`).join('');

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-loading">Could not load payment history</td></tr>';
  }
}


/* ============================================================
   MANUAL PAYMENT FORM
============================================================ */
document.getElementById('manualPaymentForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const msg = document.getElementById('payMsg');

  const amount  = document.getElementById('manualAmount').value;
  const bank    = document.getElementById('manualBank').value;
  const account = document.getElementById('manualAccount').value;
  const date    = document.getElementById('manualDate').value;

  if (!amount || !bank || !account || !date) {
    msg.textContent = 'Please fill in all fields'; msg.className = 'pay-msg error'; return;
  }

  try {
    const response = await fetch(`${API_BASE}/payment/manual`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount: parseFloat(amount), bankName: bank, accountName: account, transferDate: date })
    });
    const result = await response.json();

    if (result.success) {
      msg.textContent = '✓ Payment details submitted! Admin will confirm within 24 hours.';
      msg.className = 'pay-msg success';
      this.reset();
      loadPaymentHistory();
      showToast('Payment details submitted successfully!');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    msg.textContent = error.message;
    msg.className = 'pay-msg error';
  }
});


/* ============================================================
   PAYSTACK PAYMENT
============================================================ */
async function initPaystack(amount) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    alert('Please select your contacts per week first');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/payment/paystack/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    const result = await response.json();

    if (result.success) {
      /*
        window.location.href does a FULL PAGE redirect to Paystack.
        This is better than opening in a popup/iframe because:
        1. Paystack blocks iframes for security (you saw the blank page)
        2. Full redirect works with ALL payment methods including bank auth
        3. After payment, Paystack redirects back to our payment-success.html
      */
      window.location.href = result.data.authorizationUrl;
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Payment initialization failed. Please try again.', 'error');
  }
}

window.initPaystack = initPaystack;


/* ============================================================
   PROFILE
============================================================ */
async function loadProfile() {
  const container = document.getElementById('profileInfo');

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
    const result   = await response.json();
    const u = result.data;

    container.innerHTML = `
      <div class="profile-info-grid">
        <div class="profile-info-item">
          <div class="profile-info-label">First Name</div>
          <div class="profile-info-value">${u.first_name}</div>
        </div>
        <div class="profile-info-item">
          <div class="profile-info-label">Last Name</div>
          <div class="profile-info-value">${u.last_name}</div>
        </div>
        <div class="profile-info-item">
          <div class="profile-info-label">Email</div>
          <div class="profile-info-value">${u.email}</div>
        </div>
        <div class="profile-info-item">
          <div class="profile-info-label">Phone</div>
          <div class="profile-info-value">${u.phone || '—'}</div>
        </div>
        <div class="profile-info-item">
          <div class="profile-info-label">Account Status</div>
          <div class="profile-info-value">${u.is_active ? '✅ Active' : '⏳ Pending Payment'}</div>
        </div>
        <div class="profile-info-item">
          <div class="profile-info-label">Member Since</div>
          <div class="profile-info-value">${formatDate(u.created_at)}</div>
        </div>
      </div>`;
  } catch (error) {
    container.innerHTML = '<p style="color:var(--text-light);">Could not load profile</p>';
  }
}


/* ============================================================
   CHANGE PASSWORD
============================================================ */
document.getElementById('changePasswordForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const currentPassword    = document.getElementById('currentPassword').value;
  const newPassword        = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;
  const msg                = document.getElementById('passwordMsg');

  if (!currentPassword || !newPassword || !confirmNewPassword) { msg.textContent = 'All fields are required'; msg.className = 'settings-msg error'; return; }
  if (newPassword.length < 8) { msg.textContent = 'New password must be at least 8 characters'; msg.className = 'settings-msg error'; return; }
  if (newPassword !== confirmNewPassword) { msg.textContent = 'Passwords do not match'; msg.className = 'settings-msg error'; return; }

  try {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH', headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await response.json();
    if (result.success) {
      msg.textContent = '✓ Password changed successfully'; msg.className = 'settings-msg success'; this.reset();
    } else { throw new Error(result.message); }
  } catch (error) {
    msg.textContent = error.message; msg.className = 'settings-msg error';
  }
});


/* ============================================================
   HELPER
============================================================ */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}


/* ============================================================
   AUTO-REFRESH LIVE CLASSES EVERY 30 SECONDS
   Checks if any teacher has clocked in and shows LIVE NOW
   without the student needing to manually refresh the page.
============================================================ */
setInterval(() => {
  // Only refresh if we are currently on the live or overview section
  const liveSection     = document.getElementById('section-live');
  const overviewSection = document.getElementById('section-overview');
  if (liveSection && liveSection.classList.contains('active')) {
    loadLiveClasses();
  }
  if (overviewSection && overviewSection.classList.contains('active')) {
    loadLiveClassesPreview();
  }
}, 30000); // 30 seconds


/* ============================================================
   MY PROGRAMMES + PAYMENT CALCULATION
============================================================ */
let myProgrammes = [];

async function loadMyProgrammes() {
  const body = document.getElementById('myProgrammesBody');
  if (!body) return;

  try {
    const response = await fetch(`${API_BASE}/student/programmes`, { headers: getAuthHeaders() });
    if (!response.ok) {
      body.innerHTML = '<p style="color:var(--text-light);font-size:0.875rem;">No programmes selected yet. Contact admin.</p>';
      return;
    }

    const result = await response.json();
    myProgrammes  = result.data || [];

    if (myProgrammes.length === 0) {
      body.innerHTML = '<p style="color:var(--text-light);font-size:0.875rem;">No programmes found. Contact admin to update your registration.</p>';
      return;
    }

    body.innerHTML = myProgrammes.map(p => `
      <div class="mini-row">
        <div>
          <div class="mini-row-name">${p.name}</div>
          <div class="mini-row-sub">${p.duration_per_contact} per contact · ${p.category}</div>
        </div>
        <strong style="color:var(--pink);font-family:var(--font-head);">₦${Number(p.price_per_contact).toLocaleString()}/contact</strong>
      </div>`).join('');

    // Show total display
    calculateTotal();
    document.getElementById('totalDisplay').style.display = 'block';

  } catch (error) {
    if (body) body.innerHTML = '<p style="color:var(--text-light);">Could not load programmes.</p>';
  }
}

function calculateTotal() {
  const contacts  = parseInt(document.getElementById('contactsPerWeek')?.value || 1);
  const totalPerContact = myProgrammes.reduce((sum, p) => sum + Number(p.price_per_contact), 0);
  const total = totalPerContact * contacts;
  const el = document.getElementById('totalAmount');
  if (el) el.textContent = `₦${total.toLocaleString()}`;
  return total;
}

async function payWithPaystack() {
  const contacts = parseInt(document.getElementById('contactsPerWeek')?.value || 1);
  const total    = calculateTotal();

  if (total <= 0 || myProgrammes.length === 0) {
    showToast('No programmes found. Contact admin.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/payment/paystack/initialize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount: total, contactsPerWeek: contacts })
    });
    const result = await response.json();
    if (result.success) {
      window.location.href = result.data.authorizationUrl;
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Payment initialization failed. Please try again.', 'error');
  }
}

window.payWithPaystack = payWithPaystack;
window.calculateTotal  = calculateTotal;


async function loadPaymentSection() {
  await loadMyProgrammes();
  await loadPaymentHistory();
}

console.log('%c 🎓 Student Dashboard Loaded ', 'background:#FFC200; color:#0D0D1A; padding:4px 8px; border-radius:4px;');
