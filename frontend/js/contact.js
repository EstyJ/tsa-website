/*
  ============================================================
  THE SNOOGUMS ACADEMY — CONTACT PAGE JAVASCRIPT
  File: js/contact.js
  VERSION 2 — WIRED TO BACKEND
  ============================================================
*/

const API_BASE = 'http://localhost:5000/api';

const contactForm     = document.getElementById('contactForm');
const ctNameInput     = document.getElementById('ctName');
const ctEmailInput    = document.getElementById('ctEmail');
const ctSubjectInput  = document.getElementById('ctSubject');
const ctMessageInput  = document.getElementById('ctMessage');
const contactSubmitBtn = document.getElementById('contactSubmitBtn');
const contactSuccess  = document.getElementById('contactSuccess');

function ctShowError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  input.classList.add('input-error');
  input.classList.remove('input-success');
  errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
}

function ctClearError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById(fieldId + 'Error');
  input.classList.remove('input-error');
  input.classList.add('input-success');
  errorEl.innerHTML = '';
}

function validateCtName() {
  const val = ctNameInput.value.trim();
  if (!val) { ctShowError('ctName', 'Please enter your name'); return false; }
  if (val.length < 2) { ctShowError('ctName', 'Name must be at least 2 characters'); return false; }
  ctClearError('ctName'); return true;
}

function validateCtEmail() {
  const val = ctEmailInput.value.trim();
  if (!val) { ctShowError('ctEmail', 'Email address is required'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { ctShowError('ctEmail', 'Enter a valid email address'); return false; }
  ctClearError('ctEmail'); return true;
}

function validateCtSubject() {
  if (!ctSubjectInput.value) { ctShowError('ctSubject', 'Please select a subject'); return false; }
  ctClearError('ctSubject'); return true;
}

function validateCtMessage() {
  const val = ctMessageInput.value.trim();
  if (!val) { ctShowError('ctMessage', 'Please enter your message'); return false; }
  if (val.length < 20) { ctShowError('ctMessage', `Message must be at least 20 characters (currently ${val.length})`); return false; }
  ctClearError('ctMessage'); return true;
}

ctNameInput.addEventListener('blur', validateCtName);
ctEmailInput.addEventListener('blur', validateCtEmail);
ctSubjectInput.addEventListener('change', validateCtSubject);
ctMessageInput.addEventListener('blur', validateCtMessage);

contactForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const results = [validateCtName(), validateCtEmail(), validateCtSubject(), validateCtMessage()];
  if (!results.every(Boolean)) {
    const firstError = contactForm.querySelector('.input-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btnText    = contactSubmitBtn.querySelector('.btn-text');
  const btnLoading = contactSubmitBtn.querySelector('.btn-loading');
  btnText.style.display    = 'none';
  btnLoading.style.display = 'flex';
  contactSubmitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    ctNameInput.value.trim(),
        email:   ctEmailInput.value.trim(),
        subject: ctSubjectInput.value,
        message: ctMessageInput.value.trim()
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      contactForm.style.display = 'none';
      contactSuccess.style.display = 'block';
      contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      throw new Error(result.message || 'Failed to send message');
    }

  } catch (error) {
    console.error('Contact error:', error);
    btnText.style.display    = 'flex';
    btnLoading.style.display = 'none';
    contactSubmitBtn.disabled = false;

    // Show error
    const existing = document.getElementById('contactErrBox');
    if (existing) existing.remove();
    const errDiv = document.createElement('div');
    errDiv.id = 'contactErrBox';
    errDiv.style.cssText = 'color:#FF4D6D;font-size:0.85rem;padding:0.75rem;background:rgba(255,77,109,0.08);border-radius:8px;margin-bottom:1rem;border:1px solid rgba(255,77,109,0.2);';
    errDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    contactForm.prepend(errDiv);
    setTimeout(() => errDiv.remove(), 6000);
  }
});

/* FAQ Accordion */
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');
  const answer   = item.querySelector('.faq-answer');
  question.addEventListener('click', function () {
    const isOpen = item.classList.contains('open');
    faqItems.forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      other.querySelector('.faq-answer').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

console.log('%c 📞 Contact Page Loaded (Backend Connected) ', 'background:#6B0FA8; color:white; padding:4px 8px; border-radius:4px;');
