/*
  ============================================================
  THE SNOOGUMS ACADEMY - TEACHER DASHBOARD JAVASCRIPT
  File: pages/dashboard-teacher/teacher.js

  KEY FEATURE: CLOCK IN
  Before a live class, the teacher clicks "Clock In".
  This:
  1. Records the clock-in time in the database
  2. Sets the class status to "live"
  3. Students on their dashboard see a "LIVE NOW" indicator
  4. The Jitsi room opens for the teacher to start teaching
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
  if (user.role !== 'teacher') { window.location.href = '../login.html'; return; }

  try {
    const response = await fetch(`${API_BASE}/auth/profile`, { headers: getAuthHeaders() });
    if (!response.ok) { localStorage.clear(); window.location.href = '../login.html'; return; }

    const result  = await response.json();
    const teacher = result.data;
    const name    = `${teacher.first_name} ${teacher.last_name}`;

    document.getElementById('sidebarName').textContent   = name;
    document.getElementById('headerName').textContent    = teacher.first_name;
    document.getElementById('sidebarAvatar').textContent = teacher.first_name.charAt(0).toUpperCase();
    document.getElementById('headerAvatar').textContent  = teacher.first_name.charAt(0).toUpperCase();
    document.getElementById('welcomeMsg').textContent    = `Welcome back, ${teacher.first_name}!`;

    document.getElementById('authLoading').style.display     = 'none';
    document.getElementById('dashboardWrapper').style.display = 'flex';

    loadSection('overview');

  } catch (error) {
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

function loadSection(name) {
  sidebarLinks.forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-section="${name}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');

  const titles = { overview: 'Overview', classes: 'My Live Classes', students: 'My Students', attendance: 'Attendance', profile: 'My Profile' };
  document.getElementById('headerTitle').textContent = titles[name] || name;

  const loaders = { overview: loadOverview, classes: loadClasses, students: loadStudents, attendance: loadAttendance, content: loadContent, announce: loadTeacherAnnouncements, profile: loadProfile };
  if (loaders[name]) loaders[name]();
}

document.getElementById('headerHamburger').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
document.getElementById('logoutBtn').addEventListener('click', function (e) {
  e.preventDefault(); localStorage.clear(); window.location.href = '../login.html';
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
    const response = await fetch(`${API_BASE}/teacher/classes`, { headers: getAuthHeaders() });
    if (!response.ok) {
      document.getElementById('nextClassBody').innerHTML = '<p style="color:var(--text-light)">No classes scheduled yet.</p>';
      return;
    }

    const result  = await response.json();
    const classes = result.data || [];

    document.getElementById('statClasses').textContent = classes.length;

    const upcoming = classes.find(c => c.status === 'scheduled' || c.status === 'live');

    if (!upcoming) {
      document.getElementById('nextClassBody').innerHTML = '<p style="color:var(--text-light)">No upcoming classes scheduled.</p>';
      return;
    }

    const isLive = upcoming.status === 'live';
    const date   = new Date(upcoming.scheduled_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    document.getElementById('nextClassBody').innerHTML = `
      <div class="live-class-card ${isLive ? 'is-live' : ''}">
        <div class="lcc-icon ${isLive ? 'live-now' : ''}">
          <i class="fas fa-video"></i>
        </div>
        <div class="lcc-info">
          <div class="lcc-title">${upcoming.title}</div>
          <div class="lcc-meta">${upcoming.course_title} · ${date} · ${upcoming.duration_mins} mins</div>
          ${isLive ? '<div class="lcc-status-live">🔴 You are LIVE</div>' : ''}
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          ${!isLive ? `
            <button class="dash-btn dash-btn-primary" onclick="clockIn(${upcoming.id}, '${upcoming.jitsi_room}', '${upcoming.title}')">
              <i class="fas fa-clock"></i> Clock In & Start
            </button>` : `
            <button class="dash-btn dash-btn-primary" onclick="openClass('${upcoming.jitsi_room}', '${upcoming.title}')">
              <i class="fas fa-video"></i> Rejoin Class
            </button>`
          }
        </div>
      </div>`;

  } catch (error) {
    document.getElementById('nextClassBody').innerHTML = '<p style="color:var(--text-light)">Could not load class data.</p>';
  }
}


/* ============================================================
   CLOCK IN — The key teacher feature
============================================================ */
async function clockIn(classId, jitsiRoom, className) {
  try {
    /*
      When the teacher clocks in:
      1. We tell the backend → sets clocked_in_at + status = 'live'
      2. Students refresh their dashboard → see LIVE NOW indicator
      3. We open the Jitsi room for the teacher
    */
    const response = await fetch(`${API_BASE}/teacher/classes/${classId}/clockin`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });

    const result = await response.json();

    if (result.success) {
      showToast('Clocked in! Students have been notified. Opening your class...');
      setTimeout(() => openClass(jitsiRoom, className), 1500);
      loadOverview(); // Refresh to show live state
    } else {
      showToast(result.message, 'error');
    }
  } catch (error) {
    showToast('Clock in failed. Please try again.', 'error');
  }
}

window.clockIn = clockIn;


/* ============================================================
   OPEN JITSI CLASS
============================================================ */
function openClass(roomName, className) {
  document.getElementById('jitsiClassName').textContent = className;
  document.getElementById('jitsiModal').classList.add('active');
  document.getElementById('jitsiContainer').innerHTML = `
    <iframe
      src="https://8x8.vc/tsa-snoogums/${roomName}"
      allow="camera; microphone; fullscreen; display-capture"
      style="width:100%;height:100%;border:none;">
    </iframe>`;
}

window.openClass = openClass;

document.getElementById('jitsiClose').addEventListener('click', function () {
  document.getElementById('jitsiModal').classList.remove('active');
  document.getElementById('jitsiContainer').innerHTML = '';
});


/* ============================================================
   MY CLASSES
============================================================ */
async function loadClasses() {
  const list = document.getElementById('classesList');
  list.innerHTML = '<div class="loading-rows"></div>';

  try {
    const response = await fetch(`${API_BASE}/teacher/classes`, { headers: getAuthHeaders() });

    if (!response.ok) {
      list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">No classes found.</p>';
      return;
    }

    const result  = await response.json();
    const classes = result.data || [];

    document.getElementById('statClasses').textContent = classes.length;

    if (classes.length === 0) {
      list.innerHTML = `
        <div class="dash-card">
          <div class="dash-card-body" style="text-align:center;padding:2rem;">
            <i class="fas fa-video" style="font-size:2rem;color:var(--border);display:block;margin-bottom:1rem;"></i>
            <p style="color:var(--text-light);">No classes scheduled yet. Contact admin to schedule your classes.</p>
          </div>
        </div>`;
      return;
    }

    list.innerHTML = classes.map(c => {
      const now         = new Date();
      const classEnd    = new Date(new Date(c.scheduled_at).getTime() + c.duration_mins * 60000);
      const hasEnded    = now > classEnd || c.status === 'completed';
      const isLive      = c.status === 'live' && !hasEnded;
      const date        = new Date(c.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="live-class-card ${isLive ? 'is-live' : ''}">
          <div class="lcc-icon ${isLive ? 'live-now' : ''}">
            <i class="fas fa-video"></i>
          </div>
          <div class="lcc-info">
            <div class="lcc-title">${c.title}</div>
            <div class="lcc-meta">${c.course_title} · ${date} · ${c.duration_mins} mins</div>
            ${isLive ? '<div class="lcc-status-live">🔴 LIVE NOW</div>' : ''}
            ${hasEnded ? '<div style="color:var(--text-light);font-size:0.8rem;font-weight:700;">✅ Class Ended</div>' : ''}
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${c.status === 'scheduled' ? `
              <button class="dash-btn dash-btn-primary" onclick="clockIn(${c.id}, '${c.jitsi_room}', '${c.title}')">
                <i class="fas fa-clock"></i> Clock In & Start
              </button>` : ''
            }
            ${isLive ? `
              <button class="dash-btn dash-btn-primary" onclick="openClass('${c.jitsi_room}', '${c.title}')">
                <i class="fas fa-video"></i> Rejoin
              </button>` : ''
            }
          </div>
        </div>`;
    }).join('');

  } catch (error) {
    list.innerHTML = '<p style="color:var(--text-light);padding:1rem;">Could not load classes.</p>';
  }
}


/* ============================================================
   MY STUDENTS
============================================================ */
async function loadStudents() {
  const tbody = document.getElementById('studentsBody');

  try {
    const response = await fetch(`${API_BASE}/teacher/students`, { headers: getAuthHeaders() });

    if (!response.ok) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No students found</td></tr>';
      document.getElementById('statStudents').textContent = 0;
      return;
    }

    const result = await response.json();
    document.getElementById('statStudents').textContent = result.data.length;

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No students enrolled in your courses yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(s => `
      <tr>
        <td><strong>${s.first_name} ${s.last_name}</strong></td>
        <td>${s.email}</td>
        <td>${s.course_title}</td>
        <td><span class="pill ${s.is_active ? 'pill-confirmed' : 'pill-pending'}">${s.is_active ? 'Active' : 'Pending'}</span></td>
      </tr>`).join('');

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-loading">Could not load students</td></tr>';
  }
}


/* ============================================================
   ATTENDANCE
============================================================ */
async function loadAttendance() {
  const tbody = document.getElementById('attendanceBody');

  try {
    const response = await fetch(`${API_BASE}/teacher/attendance`, { headers: getAuthHeaders() });

    if (!response.ok) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No attendance records yet</td></tr>';
      return;
    }

    const result = await response.json();

    if (result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No completed classes yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(a => `
      <tr>
        <td><strong>${a.title}</strong></td>
        <td>${formatDate(a.scheduled_at)}</td>
        <td>${a.student_count} students</td>
        <td>${a.duration_mins} mins</td>
      </tr>`).join('');

    // Update stat
    if (result.data.length > 0) {
      document.getElementById('statAttendance').textContent = result.data[0].student_count;
    }

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-loading">Could not load attendance</td></tr>';
  }
}


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
        <div class="profile-info-item"><div class="profile-info-label">First Name</div><div class="profile-info-value">${u.first_name}</div></div>
        <div class="profile-info-item"><div class="profile-info-label">Last Name</div><div class="profile-info-value">${u.last_name}</div></div>
        <div class="profile-info-item"><div class="profile-info-label">Email</div><div class="profile-info-value">${u.email}</div></div>
        <div class="profile-info-item"><div class="profile-info-label">Role</div><div class="profile-info-value">Teacher</div></div>
        <div class="profile-info-item"><div class="profile-info-label">Member Since</div><div class="profile-info-value">${formatDate(u.created_at)}</div></div>
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
    if (result.success) { msg.textContent = '✓ Password changed successfully'; msg.className = 'settings-msg success'; this.reset(); }
    else { throw new Error(result.message); }
  } catch (error) { msg.textContent = error.message; msg.className = 'settings-msg error'; }
});


function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}


/* ============================================================
   CONTENT UPLOAD
============================================================ */
document.getElementById('contentFile').addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const file = this.files[0];
    document.getElementById('contentUploadUI').style.display    = 'none';
    document.getElementById('contentFileSelected').style.display = 'flex';
    document.getElementById('contentFileName').textContent = `${file.name} (${(file.size/1024/1024).toFixed(1)}MB)`;
  }
});

function clearContentFile() {
  document.getElementById('contentFile').value = '';
  document.getElementById('contentUploadUI').style.display    = 'flex';
  document.getElementById('contentFileSelected').style.display = 'none';
}

window.clearContentFile = clearContentFile;

document.getElementById('uploadContentForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const msg   = document.getElementById('contentMsg');
  const title = document.getElementById('contentTitle').value.trim();
  const type  = document.getElementById('contentType').value;
  const file  = document.getElementById('contentFile').files[0];

  if (!title) { msg.textContent = 'Please enter a title'; msg.className = 'settings-msg error'; return; }
  if (!file)  { msg.textContent = 'Please select a file to upload'; msg.className = 'settings-msg error'; return; }

  if (file.size > 100 * 1024 * 1024) {
    msg.textContent = 'File too large. Maximum size is 100MB';
    msg.className   = 'settings-msg error';
    return;
  }

  msg.textContent = '⏳ Uploading... please wait';
  msg.className   = 'settings-msg';

  try {
    const formData = new FormData();
    formData.append('title',           title);
    formData.append('type',            type);
    formData.append('description',     document.getElementById('contentDesc').value.trim());
    formData.append('targetCategory',  document.getElementById('contentCategory')?.value || 'all');
    formData.append('targetProgramme', document.getElementById('contentProgramme')?.value || '');
    formData.append('content',         file);

    const token    = localStorage.getItem('tsa_token');
    const response = await fetch(`${API_BASE}/teacher/content`, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body:    formData
    });

    const result = await response.json();

    if (result.success) {
      msg.textContent = '✅ Content uploaded successfully!';
      msg.className   = 'settings-msg success';
      this.reset();
      clearContentFile();
      showToast('Content uploaded!');
      loadContent();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    msg.textContent = error.message;
    msg.className   = 'settings-msg error';
  }
});

async function loadContent() {
  const tbody = document.getElementById('contentTableBody');
  if (!tbody) return;

  try {
    const response = await fetch(`${API_BASE}/teacher/content`, { headers: getAuthHeaders() });

    if (!response.ok) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No content uploaded yet</td></tr>';
      return;
    }

    const result = await response.json();

    if (!result.data || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="table-loading">No content uploaded yet</td></tr>';
      return;
    }

    tbody.innerHTML = result.data.map(item => `
      <tr>
        <td><strong>${item.title}</strong>${item.description ? `<div style="font-size:0.78rem;color:var(--text-light)">${item.description}</div>` : ''}</td>
        <td><span class="pill pill-pending">${item.type}</span></td>
        <td>${formatDate(item.created_at)}</td>
        <td>
          <a href="${API_BASE.replace('/api','')}/${item.file_path}" target="_blank" class="dash-btn dash-btn-info">
            <i class="fas fa-download"></i> View
          </a>
        </td>
      </tr>`).join('');

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="table-loading">Could not load content</td></tr>';
  }
}


/* ── TEACHER ANNOUNCEMENTS ──────────────────────────────── */
async function loadTeacherAnnouncements() {
  const form = document.getElementById('teacherAnnounceForm');
  if (!form) return;

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg    = document.getElementById('tAnnMsg');
    const title  = document.getElementById('tAnnTitle').value.trim();
    const body   = document.getElementById('tAnnBody').value.trim();
    const target = document.getElementById('tAnnTarget').value;

    if (!title || !body) { msg.textContent = 'Title and message required'; msg.className = 'settings-msg error'; return; }

    try {
      const response = await fetch(`${API_BASE}/teacher/announcements`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ title, body, target })
      });
      const result = await response.json();
      if (result.success) {
        msg.textContent = '✅ ' + result.message;
        msg.className   = 'settings-msg success';
        this.reset();
        showToast('Announcement posted!');
      } else { throw new Error(result.message); }
    } catch (error) { msg.textContent = error.message; msg.className = 'settings-msg error'; }
  }, { once: true }); // once: true prevents duplicate listeners
}

console.log('%c 📖 Teacher Dashboard Loaded ', 'background:#6B0FA8; color:white; padding:4px 8px; border-radius:4px;');
