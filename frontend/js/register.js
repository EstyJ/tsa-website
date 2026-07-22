/*
  ============================================================
  THE SNOOGUMS ACADEMY — REGISTER PAGE JAVASCRIPT
  VERSION 3 — With Programme Selection
  ============================================================
*/

const API_BASE = 'http://localhost:5000/api';

/* All TSA programmes by category */
const PROGRAMMES = {
  academic: [
    { id: 1, name: 'Primary Key Subject (Maths, English or Science)', duration: '1 hr', price: 8500 },
    { id: 2, name: 'Primary Other Subject',                            duration: '1 hr', price: 7500 },
    { id: 3, name: 'Primary Combo (2 Subjects)',                       duration: '1 hr', price: 7500 },
    { id: 4, name: 'Primary Combo (3 Subjects)',                       duration: '1 hr', price: 7000 },
    { id: 5, name: 'Secondary Key Subject',                            duration: '1 hr', price: 10000 },
    { id: 6, name: 'Secondary Other Subject',                          duration: '1 hr', price: 8500 },
    { id: 7, name: 'Secondary Combo (2 Subjects)',                     duration: '1 hr', price: 9000 },
    { id: 8, name: 'Science Combo (3 Subjects)',                       duration: '1 hr', price: 9000 },
  ],
  exam: [
    { id: 9,  name: 'WAEC/NECO Single Subject', duration: '1.5 hrs', price: 10000 },
    { id: 10, name: 'WAEC/NECO 4 Subjects',     duration: '1.5 hrs', price: 9500 },
    { id: 11, name: 'WAEC/NECO 6 Subjects',     duration: '1.5 hrs', price: 9000 },
    { id: 12, name: 'JAMB Standard',             duration: '1.5 hrs', price: 9000 },
  ],
  international: [
    { id: 13, name: 'GCSE/IGCSE 1 Subject', duration: '1.5 hrs', price: 10000 },
    { id: 14, name: 'IELTS',                duration: '1.5 hrs', price: 12500 },
  ],
  skills: [
    { id: 15, name: 'Python Programming', duration: '1.5 hrs', price: 8500 },
  ],
  summer: [
    { id: 16, name: 'Summer Holiday Lessons', duration: '1.5 hrs', price: 8500 },
  ]
};

/* ── ELEMENTS ───────────────────────────────────────────── */
const registerForm     = document.getElementById('registerForm');
const firstNameInput   = document.getElementById('firstName');
const lastNameInput    = document.getElementById('lastName');
const emailInput       = document.getElementById('email');
const phoneInput       = document.getElementById('phone');
const passwordInput    = document.getElementById('password');
const confirmInput     = document.getElementById('confirmPassword');
const agreeTerms       = document.getElementById('agreeTerms');
const submitBtn        = document.getElementById('submitBtn');
const successMessage   = document.getElementById('successMessage');
const successName      = document.getElementById('successName');
const passwordToggle   = document.getElementById('passwordToggle');
const passwordToggleIcon = document.getElementById('passwordToggleIcon');
const strengthFill     = document.getElementById('strengthFill');
const strengthLabel    = document.getElementById('strengthLabel');
const categorySelect   = document.getElementById('category');
const programmeGroup   = document.getElementById('programmeGroup');
const programmeOptions = document.getElementById('programmeOptions');

/* ── CATEGORY CHANGE → SHOW PROGRAMMES ─────────────────── */
categorySelect.addEventListener('change', function() {
  const cat = this.value;
  document.getElementById('categoryError').innerHTML = '';

  if (!cat) { programmeGroup.style.display = 'none'; return; }

  const progs = PROGRAMMES[cat] || [];
  programmeGroup.style.display = 'block';

  programmeOptions.innerHTML = progs.map(p => `
    <label class="programme-option">
      <input type="checkbox" name="programmes[]" value="${p.id}" data-name="${p.name}" data-price="${p.price}" data-duration="${p.duration}">
      <span class="programme-check-box"></span>
      <span class="programme-label">
        <span class="programme-name">${p.name}</span>
        <span class="programme-meta">${p.duration} per contact</span>
      </span>
      <span class="programme-price">₦${p.price.toLocaleString()}</span>
    </label>`).join('');
});

/* ── HELPERS ────────────────────────────────────────────── */
function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (input) { input.classList.add('input-error'); input.classList.remove('input-success'); }
  if (errorEl) errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}

function showSuccess(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  const statusEl = document.getElementById(fieldId + 'Status');
  if (input) { input.classList.remove('input-error'); input.classList.add('input-success'); }
  if (errorEl) errorEl.innerHTML = '';
  if (statusEl) statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#4CAF50;"></i>';
}

/* ── VALIDATORS ─────────────────────────────────────────── */
function validateName(fieldId, label) {
  const val = document.getElementById(fieldId).value.trim();
  if (!val) { showError(fieldId, `${label} is required`); return false; }
  if (val.length < 2) { showError(fieldId, `${label} must be at least 2 characters`); return false; }
  if (!/^[a-zA-Z\s\-']+$/.test(val)) { showError(fieldId, `${label} can only contain letters`); return false; }
  showSuccess(fieldId); return true;
}

function validateEmail() {
  const val = emailInput.value.trim();
  if (!val) { showError('email', 'Email address is required'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showError('email', 'Please enter a valid email address'); return false; }
  showSuccess('email'); return true;
}

function validatePhone() {
  const val = phoneInput.value.trim().replace(/[\s\-()]/g, '');
  if (!val) { showError('phone', 'Phone number is required'); return false; }
  if (!/^\d+$/.test(val)) { showError('phone', 'Phone number must contain only digits'); return false; }
  if (val.length < 10 || val.length > 11) { showError('phone', 'Enter a valid phone number (10-11 digits)'); return false; }
  showSuccess('phone'); return true;
}

function validateCategory() {
  if (!categorySelect.value) { showError('category', 'Please select a category'); return false; }
  document.getElementById('categoryError').innerHTML = ''; return true;
}

function validateProgramme() {
  const checked = document.querySelectorAll('input[name="programmes[]"]:checked');
  const errorEl = document.getElementById('programmeError');
  if (checked.length === 0) {
    errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please select at least one programme';
    return false;
  }
  errorEl.innerHTML = ''; return true;
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val) { showError('password', 'Password is required'); return { valid: false, score: 0 }; }
  const rules = {
    length: val.length >= 8, upper: /[A-Z]/.test(val),
    number: /[0-9]/.test(val), special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)
  };
  updateRuleUI(document.getElementById('ruleLength'), rules.length);
  updateRuleUI(document.getElementById('ruleUpper'),  rules.upper);
  updateRuleUI(document.getElementById('ruleNumber'), rules.number);
  updateRuleUI(document.getElementById('ruleSpecial'),rules.special);
  const score = Object.values(rules).filter(Boolean).length;
  const levels = { 0: ['0%','transparent',''], 1: ['25%','#FF4D6D','Weak'], 2: ['50%','#FF9800','Fair'], 3: ['75%','#FFC107','Good'], 4: ['100%','#4CAF50','Strong'] };
  const [w, col, lbl] = levels[score];
  strengthFill.style.width = w; strengthFill.style.backgroundColor = col;
  strengthLabel.textContent = lbl; strengthLabel.style.color = col;
  const allValid = Object.values(rules).every(Boolean);
  if (!allValid) { document.getElementById('passwordError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Please meet all password requirements'; return { valid: false, score }; }
  document.getElementById('passwordError').innerHTML = ''; return { valid: true, score };
}

function updateRuleUI(el, passing) {
  if (!el) return;
  el.classList.toggle('rule-met', passing);
  el.querySelector('.rule-dot').className = passing ? 'fas fa-check-circle rule-dot' : 'fas fa-circle rule-dot';
}

function validateConfirmPassword() {
  const val = confirmInput.value;
  if (!val) { showError('confirmPassword', 'Please confirm your password'); return false; }
  if (val !== passwordInput.value) {
    showError('confirmPassword', 'Passwords do not match');
    document.getElementById('confirmStatus').innerHTML = '<i class="fas fa-times-circle" style="color:#FF4D6D;"></i>';
    return false;
  }
  showSuccess('confirmPassword'); return true;
}

function validateTerms() {
  if (!agreeTerms.checked) {
    document.getElementById('termsError').innerHTML = '<i class="fas fa-exclamation-circle"></i> You must agree to the Terms & Conditions';
    return false;
  }
  document.getElementById('termsError').innerHTML = ''; return true;
}

/* ── REAL-TIME VALIDATION ───────────────────────────────── */
const touched = {};
['firstName','lastName','email','phone','password','confirmPassword'].forEach(f => {
  const el = document.getElementById(f);
  if (!el) return;
  el.addEventListener('blur', () => { touched[f] = true; eval(`validate${f.charAt(0).toUpperCase()+f.slice(1)}()`); });
});
passwordInput.addEventListener('input', () => { touched.password = true; validatePassword(); if (touched.confirmPassword) validateConfirmPassword(); });
confirmInput.addEventListener('input',  () => { touched.confirmPassword = true; validateConfirmPassword(); });
agreeTerms.addEventListener('change',   () => { if (agreeTerms.checked) document.getElementById('termsError').innerHTML = ''; });

/* ── PASSWORD TOGGLE ────────────────────────────────────── */
passwordToggle.addEventListener('click', function() {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  passwordToggleIcon.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
});

/* ── FORM SUBMIT ────────────────────────────────────────── */
registerForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  Object.keys(touched).forEach(k => touched[k] = true);

  const valid = [
    validateName('firstName','First name'),
    validateName('lastName','Last name'),
    validateEmail(), validatePhone(),
    validateCategory(), validateProgramme(),
    validatePassword().valid,
    validateConfirmPassword(), validateTerms()
  ].every(Boolean);

  if (!valid) {
    const firstErr = registerForm.querySelector('.input-error');
    if (firstErr) { firstErr.scrollIntoView({ behavior:'smooth', block:'center' }); firstErr.focus(); }
    return;
  }

  // Get selected programmes
  const selectedProgrammes = Array.from(
    document.querySelectorAll('input[name="programmes[]"]:checked')
  ).map(cb => ({
    id:       parseInt(cb.value),
    name:     cb.dataset.name,
    price:    parseFloat(cb.dataset.price),
    duration: cb.dataset.duration
  }));

  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoad = submitBtn.querySelector('.btn-loading');
  btnText.style.display = 'none'; btnLoad.style.display = 'flex'; submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName:   firstNameInput.value.trim(),
        lastName:    lastNameInput.value.trim(),
        email:       emailInput.value.trim().toLowerCase(),
        phonePrefix: document.getElementById('phonePrefix').value,
        phone:       phoneInput.value.trim(),
        password:    passwordInput.value,
        category:    categorySelect.value,
        programmes:  selectedProgrammes
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      successName.textContent = firstNameInput.value.trim();
      registerForm.style.display = 'none';
      document.querySelector('.notice-box').style.display = 'none';
      document.querySelector('.auth-switch').style.display = 'none';
      successMessage.style.display = 'block';
      document.querySelector('.auth-form-container').scrollIntoView({ behavior:'smooth', block:'start' });
    } else {
      throw new Error(result.message || 'Registration failed');
    }

  } catch (error) {
    btnText.style.display = 'flex'; btnLoad.style.display = 'none'; submitBtn.disabled = false;
    const existing = document.getElementById('apiErrorBox');
    if (existing) existing.remove();
    const errDiv = document.createElement('div');
    errDiv.id = 'apiErrorBox'; errDiv.className = 'notice-box';
    errDiv.style.cssText = 'border-color:rgba(255,77,109,0.3);background:rgba(255,77,109,0.08);';
    errDiv.innerHTML = `<div class="notice-icon"><i class="fas fa-exclamation-triangle" style="color:#FF4D6D;"></i></div><div class="notice-text"><strong style="color:#FF4D6D;">Registration Failed</strong> ${error.message}</div>`;
    registerForm.parentNode.insertBefore(errDiv, registerForm);
    setTimeout(() => errDiv.remove(), 8000);
  }
});
