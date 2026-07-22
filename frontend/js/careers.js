/*
  ============================================================
  THE SNOOGUMS ACADEMY — CAREERS PAGE JAVASCRIPT
  File: js/careers.js
  VERSION 2 — WIRED TO BACKEND
  ============================================================
*/

const API_BASE = 'http://localhost:5000/api';

const careerForm        = document.getElementById('careerForm');
const fileInput         = document.getElementById('cfCV');
const fileUploadWrap    = document.getElementById('fileUploadWrap');
const fileUploadUI      = document.getElementById('fileUploadUI');
const fileSelected      = document.getElementById('fileSelected');
const fileSelectedName  = document.getElementById('fileSelectedName');
const fileSelectedSize  = document.getElementById('fileSelectedSize');
const fileRemoveBtn     = document.getElementById('fileRemove');
const bioTextarea       = document.getElementById('cfBio');
const charCountEl       = document.getElementById('charCount');
const careerSubmitBtn   = document.getElementById('careerSubmitBtn');
const careerSuccess     = document.getElementById('careerSuccess');
const careerSuccessName = document.getElementById('careerSuccessName');

const MAX_FILE_SIZE  = 5 * 1024 * 1024;
const ALLOWED_TYPES  = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function handleFileSelection(file) {
  const errorEl = document.getElementById('cfCVError');
  const extension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_TYPES.includes(file.type) && !['pdf','doc','docx'].includes(extension)) {
    errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Only PDF, DOC, or DOCX files are allowed.';
    clearFileSelection(); return;
  }
  if (file.size > MAX_FILE_SIZE) {
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> File too large. Maximum is 5MB.`;
    clearFileSelection(); return;
  }
  errorEl.innerHTML = '';
  fileUploadUI.style.display    = 'none';
  fileSelected.style.display    = 'flex';
  fileSelectedName.textContent  = file.name;
  fileSelectedSize.textContent  = formatFileSize(file.size);
  fileUploadWrap.classList.add('has-file');
}

function clearFileSelection() {
  fileInput.value = '';
  fileUploadUI.style.display  = 'flex';
  fileSelected.style.display  = 'none';
  fileUploadWrap.classList.remove('has-file', 'drag-over');
}

fileInput.addEventListener('change', function () { if (this.files && this.files[0]) handleFileSelection(this.files[0]); });
fileRemoveBtn.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); clearFileSelection(); document.getElementById('cfCVError').innerHTML = ''; });

fileUploadWrap.addEventListener('dragenter', (e) => { e.preventDefault(); fileUploadWrap.classList.add('drag-over'); });
fileUploadWrap.addEventListener('dragover',  (e) => { e.preventDefault(); fileUploadWrap.classList.add('drag-over'); });
fileUploadWrap.addEventListener('dragleave', (e) => { if (!fileUploadWrap.contains(e.relatedTarget)) fileUploadWrap.classList.remove('drag-over'); });
fileUploadWrap.addEventListener('drop', (e) => { e.preventDefault(); fileUploadWrap.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFileSelection(e.dataTransfer.files[0]); });

bioTextarea.addEventListener('input', function () {
  const count = this.value.length;
  const min   = 100;
  charCountEl.textContent = count;
  if (count >= min) {
    charCountEl.closest('.char-count').classList.add('count-met');
    charCountEl.closest('.char-count').innerHTML = `<i class="fas fa-check-circle"></i> ${count} characters — minimum reached`;
  } else {
    charCountEl.closest('.char-count').classList.remove('count-met');
    charCountEl.closest('.char-count').innerHTML = `<span id="charCount">${count}</span> / ${min} minimum characters`;
  }
});

function cfShowError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (input) { input.classList.add('input-error'); input.classList.remove('input-success'); }
  if (errorEl) errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}

function cfClearError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  if (input) { input.classList.remove('input-error'); input.classList.add('input-success'); }
  if (errorEl) errorEl.innerHTML = '';
}

function validateCFName(id, label) {
  const val = document.getElementById(id).value.trim();
  if (!val) { cfShowError(id, `${label} is required`); return false; }
  if (val.length < 2) { cfShowError(id, `${label} must be at least 2 characters`); return false; }
  cfClearError(id); return true;
}

function validateCFEmail() {
  const val = document.getElementById('cfEmail').value.trim();
  if (!val) { cfShowError('cfEmail', 'Email is required'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { cfShowError('cfEmail', 'Enter a valid email'); return false; }
  cfClearError('cfEmail'); return true;
}

function validateCFPhone() {
  const val = document.getElementById('cfPhone').value.trim().replace(/[\s\-()]/g, '');
  if (!val) { cfShowError('cfPhone', 'Phone number is required'); return false; }
  if (!/^\d+$/.test(val)) { cfShowError('cfPhone', 'Only digits allowed'); return false; }
  if (val.length < 10 || val.length > 11) { cfShowError('cfPhone', 'Enter a valid phone number'); return false; }
  cfClearError('cfPhone'); return true;
}

function validateCFSelect(id, label) {
  if (!document.getElementById(id).value) { cfShowError(id, `Please select your ${label}`); return false; }
  cfClearError(id); return true;
}

function validateCFBio() {
  const val = bioTextarea.value.trim();
  const errorEl = document.getElementById('cfBioError');
  if (!val) { bioTextarea.classList.add('input-error'); errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please write a brief introduction'; return false; }
  if (val.length < 100) { bioTextarea.classList.add('input-error'); errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Please write at least 100 characters (currently ${val.length})`; return false; }
  bioTextarea.classList.remove('input-error'); bioTextarea.classList.add('input-success'); errorEl.innerHTML = ''; return true;
}

function validateCFAvailability() {
  const boxes = document.querySelectorAll('input[name="availability[]"]');
  const anyChecked = Array.from(boxes).some(b => b.checked);
  const errorEl = document.getElementById('cfAvailabilityError');
  if (!anyChecked) { errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please select at least one availability slot'; return false; }
  errorEl.innerHTML = ''; return true;
}

function validateCFCV() {
  const errorEl = document.getElementById('cfCVError');
  if (!fileInput.files || !fileInput.files[0]) {
    errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please upload your CV';
    fileUploadWrap.style.borderColor = '#FF4D6D'; return false;
  }
  fileUploadWrap.style.borderColor = ''; errorEl.innerHTML = ''; return true;
}

function validateCFTerms() {
  const errorEl = document.getElementById('cfTermsError');
  if (!document.getElementById('cfTerms').checked) { errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> You must confirm the information is accurate'; return false; }
  errorEl.innerHTML = ''; return true;
}

document.getElementById('cfFirstName').addEventListener('blur', () => validateCFName('cfFirstName', 'First name'));
document.getElementById('cfLastName').addEventListener('blur',  () => validateCFName('cfLastName',  'Last name'));
document.getElementById('cfEmail').addEventListener('blur',     () => validateCFEmail());
document.getElementById('cfPhone').addEventListener('blur',     () => validateCFPhone());
document.getElementById('cfSubject').addEventListener('change', () => validateCFSelect('cfSubject', 'subject'));
document.getElementById('cfExperience').addEventListener('change', () => validateCFSelect('cfExperience', 'experience level'));
document.getElementById('cfQualification').addEventListener('change', () => validateCFSelect('cfQualification', 'qualification'));
bioTextarea.addEventListener('blur', () => validateCFBio());
document.getElementById('cfTerms').addEventListener('change', () => { if (document.getElementById('cfTerms').checked) document.getElementById('cfTermsError').innerHTML = ''; });

careerForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const results = [
    validateCFName('cfFirstName', 'First name'),
    validateCFName('cfLastName',  'Last name'),
    validateCFEmail(), validateCFPhone(),
    validateCFSelect('cfSubject', 'subject'),
    validateCFSelect('cfExperience', 'experience level'),
    validateCFSelect('cfQualification', 'qualification'),
    validateCFAvailability(), validateCFBio(), validateCFCV(), validateCFTerms()
  ];

  if (!results.every(Boolean)) {
    const firstErr = careerForm.querySelector('.input-error');
    if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btnText    = careerSubmitBtn.querySelector('.btn-text');
  const btnLoading = careerSubmitBtn.querySelector('.btn-loading');
  btnText.style.display    = 'none';
  btnLoading.style.display = 'flex';
  careerSubmitBtn.disabled = true;

  try {
    /*
      FILE UPLOAD uses FormData — NOT JSON.stringify.
      FormData handles files natively as multipart/form-data.
      We do NOT set Content-Type header — the browser sets it
      automatically with the correct boundary string.
    */
    const availability = Array.from(document.querySelectorAll('input[name="availability[]"]:checked'))
      .map(cb => cb.value);

    const formData = new FormData();
    formData.append('firstName',     document.getElementById('cfFirstName').value.trim());
    formData.append('lastName',      document.getElementById('cfLastName').value.trim());
    formData.append('email',         document.getElementById('cfEmail').value.trim());
    formData.append('phone',         document.getElementById('cfPhone').value.trim());
    formData.append('subject',       document.getElementById('cfSubject').value);
    formData.append('experience',    document.getElementById('cfExperience').value);
    formData.append('qualification', document.getElementById('cfQualification').value);
    formData.append('availability',  JSON.stringify(availability));
    formData.append('bio',           bioTextarea.value.trim());
    formData.append('cv',            fileInput.files[0]);

    const response = await fetch(`${API_BASE}/careers/apply`, {
      method: 'POST',
      body: formData
      // No Content-Type header — browser sets it automatically for FormData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      careerSuccessName.textContent = document.getElementById('cfFirstName').value.trim();
      careerForm.style.display = 'none';
      document.querySelector('.apply-form-header').style.display = 'none';
      careerSuccess.style.display = 'block';
      document.querySelector('.apply-form-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      throw new Error(result.message || 'Submission failed');
    }

  } catch (error) {
    console.error('Career form error:', error);
    btnText.style.display    = 'flex';
    btnLoading.style.display = 'none';
    careerSubmitBtn.disabled = false;

    const errDiv = document.createElement('div');
    errDiv.style.cssText = 'color:#FF4D6D;padding:0.75rem;background:rgba(255,77,109,0.08);border-radius:8px;margin-bottom:1rem;border:1px solid rgba(255,77,109,0.2);font-size:0.875rem;';
    errDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    careerForm.prepend(errDiv);
    setTimeout(() => errDiv.remove(), 6000);
  }
});

console.log('%c 💼 Careers Page Loaded (Backend Connected) ', 'background:#FFC200; color:#0D0D1A; padding:4px 8px; border-radius:4px;');
