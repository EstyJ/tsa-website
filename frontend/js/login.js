/*
  ============================================================
  THE SNOOGUMS ACADEMY — LOGIN PAGE JAVASCRIPT
  File: js/login.js
  VERSION 2 — WIRED TO BACKEND
  ============================================================
*/

const API_BASE = 'http://localhost:5000/api';

/* ============================================================
   ELEMENTS
============================================================ */
const loginForm           = document.getElementById('loginForm');
const loginEmailInput     = document.getElementById('loginEmail');
const loginPasswordInput  = document.getElementById('loginPassword');
const selectedRoleInput   = document.getElementById('selectedRole');
const loginSubmitBtn      = document.getElementById('loginSubmitBtn');
const loginBtnText        = document.getElementById('loginBtnText');
const loginIcon           = document.getElementById('loginIcon');
const loginSubtitle       = document.getElementById('loginSubtitle');
const roleNote            = document.getElementById('roleNote');
const roleNoteText        = document.getElementById('roleNoteText');
const loginSuccess        = document.getElementById('loginSuccess');
const loginSuccessText    = document.getElementById('loginSuccessText');
const roleTabs            = document.querySelectorAll('.role-tab');
const loginPasswordToggle     = document.getElementById('loginPasswordToggle');
const loginPasswordToggleIcon = document.getElementById('loginPasswordToggleIcon');

/* ============================================================
   ROLE CONFIGURATION
============================================================ */
const roleConfig = {
  student: {
    label: 'Student', icon: 'fa-user-graduate',
    subtitle: 'Welcome back, Student! Enter your details below.',
    btnText: 'Sign In as Student', btnTheme: '', iconTheme: '',
    showNote: false, noteText: '',
    successText: 'Welcome back! Redirecting you to your student dashboard...',
    redirect: 'dashboard-student/index.html'
  },
  teacher: {
    label: 'Teacher', icon: 'fa-chalkboard-teacher',
    subtitle: 'Welcome back, Teacher! Sign in to access your classes.',
    btnText: 'Sign In as Teacher', btnTheme: 'theme-purple', iconTheme: 'theme-purple',
    showNote: true,
    noteText: 'Teacher accounts are created by the admin team. If you don\'t have an account yet, <a href="careers.html">apply on our Careers page</a>.',
    successText: 'Welcome back! Redirecting you to your teacher dashboard...',
    redirect: 'dashboard-teacher/index.html'
  },
  admin: {
    label: 'Admin', icon: 'fa-user-shield',
    subtitle: 'Admin portal. Restricted access only.',
    btnText: 'Sign In as Admin', btnTheme: 'theme-gold', iconTheme: 'theme-gold',
    showNote: true,
    noteText: 'This portal is for authorised administrators only.',
    successText: 'Access granted! Redirecting you to the admin dashboard...',
    redirect: '../pages/dashboard-admin/index.html'
  }
};

/* ============================================================
   ROLE TAB SWITCHING
============================================================ */
function switchRole(selectedTab) {
  const role = selectedTab.dataset.role;
  const config = roleConfig[role];
  roleTabs.forEach(tab => { tab.classList.remove('active'); tab.setAttribute('aria-selected', 'false'); });
  selectedTab.classList.add('active');
  selectedTab.setAttribute('aria-selected', 'true');
  selectedRoleInput.value = role;
  loginIcon.className = 'form-icon';
  if (config.iconTheme) loginIcon.classList.add(config.iconTheme);
  loginIcon.innerHTML = `<i class="fas ${config.icon}"></i>`;
  loginSubtitle.textContent = config.subtitle;
  loginSubmitBtn.className = 'btn btn-primary btn-full';
  if (config.btnTheme) loginSubmitBtn.classList.add(config.btnTheme);
  loginBtnText.innerHTML = `<i class="fas fa-sign-in-alt"></i> ${config.btnText}`;
  if (config.showNote) { roleNote.style.display = 'flex'; roleNoteText.innerHTML = config.noteText; }
  else roleNote.style.display = 'none';
  clearLoginErrors();
}

roleTabs.forEach(tab => tab.addEventListener('click', () => switchRole(tab)));

/* ============================================================
   VALIDATION
============================================================ */
function showLoginError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  input.classList.add('input-error');
  input.classList.remove('input-success');
  if (errorEl) errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}

function showLoginFieldSuccess(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  input.classList.remove('input-error');
  input.classList.add('input-success');
  if (errorEl) errorEl.innerHTML = '';
}

function clearLoginErrors() {
  loginForm.querySelectorAll('.form-input').forEach(input => input.classList.remove('input-error', 'input-success'));
  loginForm.querySelectorAll('.field-error').forEach(el => el.innerHTML = '');
}

function validateLoginEmail() {
  const value = loginEmailInput.value.trim();
  if (!value) { showLoginError('loginEmail', 'Email address is required'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { showLoginError('loginEmail', 'Please enter a valid email address'); return false; }
  showLoginFieldSuccess('loginEmail');
  return true;
}

function validateLoginPassword() {
  const value = loginPasswordInput.value;
  if (!value) { showLoginError('loginPassword', 'Password is required'); return false; }
  if (value.length < 6) { showLoginError('loginPassword', 'Password must be at least 6 characters'); return false; }
  showLoginFieldSuccess('loginPassword');
  return true;
}

let loginEmailTouched = false, loginPasswordTouched = false;
loginEmailInput.addEventListener('blur', () => { loginEmailTouched = true; validateLoginEmail(); });
loginEmailInput.addEventListener('input', () => { if (loginEmailTouched) validateLoginEmail(); });
loginPasswordInput.addEventListener('blur', () => { loginPasswordTouched = true; validateLoginPassword(); });
loginPasswordInput.addEventListener('input', () => { if (loginPasswordTouched) validateLoginPassword(); });

/* ============================================================
   PASSWORD TOGGLE
============================================================ */
loginPasswordToggle.addEventListener('click', function () {
  const isPassword = loginPasswordInput.type === 'password';
  loginPasswordInput.type = isPassword ? 'text' : 'password';
  loginPasswordToggleIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
});

/* ============================================================
   FORM SUBMIT — WIRED TO BACKEND
============================================================ */
loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  loginEmailTouched = true;
  loginPasswordTouched = true;

  const emailOk    = validateLoginEmail();
  const passwordOk = validateLoginPassword();
  if (!emailOk || !passwordOk) {
    if (!emailOk) loginEmailInput.focus();
    else loginPasswordInput.focus();
    return;
  }

  // Loading state
  const btnText    = loginSubmitBtn.querySelector('.btn-text');
  const btnLoading = loginSubmitBtn.querySelector('.btn-loading');
  btnText.style.display    = 'none';
  btnLoading.style.display = 'flex';
  loginSubmitBtn.disabled  = true;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:      loginEmailInput.value.trim().toLowerCase(),
        password:   loginPasswordInput.value,
        role:       selectedRoleInput.value,
        rememberMe: document.getElementById('rememberMe').checked
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      /*
        Store the JWT token in localStorage.
        Every subsequent request to a protected route will include this token.
        The dashboard pages will read it to know who is logged in.
      */
      localStorage.setItem('tsa_token', result.token);
      localStorage.setItem('tsa_user', JSON.stringify(result.user));

      const config = roleConfig[selectedRoleInput.value];
      loginSuccessText.textContent = config.successText;

      // Hide form, show success
      loginForm.style.display = 'none';
      document.querySelector('.role-tabs').style.display = 'none';
      document.querySelector('.auth-switch').style.display = 'none';
      if (roleNote.style.display !== 'none') roleNote.style.display = 'none';
      loginSuccess.style.display = 'block';

      // Countdown then redirect
      startRedirectCountdown(result.redirect || config.redirect, result.user.role);

    } else {
      // Handle specific backend errors
      if (result.pendingPayment) {
        // Student registered but payment not confirmed yet
        throw new Error('Your account is pending payment confirmation. Please contact our admin team to complete your payment.');
      }
      throw new Error(result.message || 'Login failed');
    }

  } catch (error) {
    console.error('Login error:', error);

    // Reset button
    btnText.style.display    = 'flex';
    btnLoading.style.display = 'none';
    loginSubmitBtn.disabled  = false;

    // Show error on password field
    showLoginError('loginPassword', error.message || 'Invalid email or password. Please try again.');
    loginPasswordInput.value = '';
    loginPasswordInput.focus();
  }
});

/* ============================================================
   REDIRECT COUNTDOWN
============================================================ */
function startRedirectCountdown(redirectUrl, role) {
  const redirectFill = document.getElementById('redirectFill');
  const countdown    = document.getElementById('countdown');
  let secondsLeft = 3;

  setTimeout(() => { redirectFill.style.width = '100%'; }, 50);

  const timer = setInterval(() => {
    secondsLeft--;
    countdown.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(timer);
      window.location.href = redirectUrl;
    }
  }, 1000);
}

/* ============================================================
   FORGOT PASSWORD
============================================================ */
document.getElementById('forgotLink').addEventListener('click', function (e) {
  e.preventDefault();
  const emailValue = loginEmailInput.value.trim();
  const existing = document.getElementById('forgotMsg');
  if (existing) existing.remove();
  const msg = document.createElement('p');
  msg.id = 'forgotMsg';
  msg.style.cssText = 'color:var(--color-gold);font-size:0.82rem;margin-top:0.5rem;padding:0.5rem 0.75rem;background:rgba(255,194,0,0.08);border-radius:var(--radius-sm);border:1px solid rgba(255,194,0,0.2);';
  if (emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
    msg.innerHTML = `<i class="fas fa-envelope"></i> Password reset coming soon! Contact us at info.snoogums@gmail.com`;
  } else {
    msg.innerHTML = `<i class="fas fa-info-circle"></i> Enter your email address above first.`;
    loginEmailInput.focus();
  }
  loginEmailInput.closest('.form-group').appendChild(msg);
  setTimeout(() => msg.remove(), 5000);
});

console.log('%c 🔐 Login Page Loaded (Backend Connected) ', 'background:#6B0FA8; color:white; padding:4px 8px; border-radius:4px;');
