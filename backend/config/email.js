/*
  ============================================================
  THE SNOOGUMS ACADEMY - EMAIL SERVICE
  File: config/email.js

  WHAT IS THIS FILE?
  A reusable email service using Nodemailer.
  We define all email templates here and export
  functions that other controllers can call.

  HOW NODEMAILER WORKS:
  1. We create a "transporter" — a connection to Gmail's SMTP server
  2. We call transporter.sendMail() with the email details
  3. Gmail sends the email on our behalf

  SMTP = Simple Mail Transfer Protocol
  It's the standard protocol for sending emails over the internet.
  ============================================================
*/

require('dotenv').config();
const nodemailer = require('nodemailer');

/*
  Create the transporter — our connection to Gmail's SMTP server.
  We authenticate using the EMAIL_USER and EMAIL_PASS from .env.
  EMAIL_PASS must be a Gmail App Password (not your real password).
*/
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/*
  Verify the transporter connection on startup.
  This checks that our Gmail credentials are correct.
*/
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
    console.error('Check EMAIL_USER and EMAIL_PASS in your .env file');
  } else {
    console.log('✅ Email service ready');
  }
});


/*
  ============================================================
  BASE EMAIL TEMPLATE
  All emails share the same branded HTML wrapper.
  We just swap out the content in the middle.
  ============================================================
*/
function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Snoogums Academy</title>
  <style>
    body { margin: 0; padding: 0; background: #F4F6FA; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #D0006F, #6B0FA8); padding: 2rem; text-align: center; }
    .header img { width: 70px; height: 70px; border-radius: 50%; object-fit: contain; border: 3px solid rgba(255,255,255,0.3); }
    .header h1 { color: white; font-size: 1.4rem; font-weight: 800; margin: 0.75rem 0 0; }
    .header p { color: rgba(255,255,255,0.8); font-size: 0.85rem; margin: 0.25rem 0 0; }
    .body { padding: 2rem; }
    .body h2 { color: #2D3748; font-size: 1.2rem; font-weight: 700; margin: 0 0 1rem; }
    .body p { color: #718096; font-size: 0.95rem; line-height: 1.7; margin: 0 0 1rem; }
    .body strong { color: #2D3748; }
    .btn { display: inline-block; background: linear-gradient(135deg, #D0006F, #6B0FA8); color: white; padding: 0.85rem 2rem; border-radius: 99px; text-decoration: none; font-weight: 700; font-size: 0.95rem; margin: 0.5rem 0 1rem; }
    .info-box { background: #F4F6FA; border-radius: 10px; padding: 1.25rem; margin: 1rem 0; }
    .info-box p { margin: 0.3rem 0; font-size: 0.9rem; }
    .info-box strong { color: #D0006F; }
    .divider { border: none; border-top: 1px solid #E8ECF0; margin: 1.5rem 0; }
    .footer { background: #0D0D1A; padding: 1.5rem 2rem; text-align: center; }
    .footer p { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin: 0.3rem 0; }
    .footer a { color: #FFC200; text-decoration: none; }
    .badge { display: inline-block; background: rgba(255,194,0,0.15); color: #B8860B; padding: 0.3rem 0.9rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>The Snoogums Academy</h1>
        <p>Knowledge Without Barriers, Potential Without Limits</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© 2025 The Snoogums Academy · Gwarimpa Estate, Abuja, FCT</p>
        <p><a href="mailto:info.snoogums@gmail.com">info.snoogums@gmail.com</a></p>
        <p style="margin-top:0.5rem;font-size:0.72rem;">This email was sent automatically. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}


/*
  ============================================================
  SEND EMAIL HELPER
  All email sending goes through this one function.
  Returns true if sent, false if failed (we never crash
  the main request just because email failed).
  ============================================================
*/
async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `The Snoogums Academy <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return false;
    /*
      We return false instead of throwing.
      A failed email should NEVER crash the main operation
      (e.g. registration should still succeed even if email fails).
    */
  }
}


/*
  ============================================================
  EMAIL 1: WELCOME EMAIL (sent after student registers)
  ============================================================
*/
async function sendWelcomeEmail({ firstName, email }) {
  const html = baseTemplate(`
    <div class="badge">🎓 Welcome to TSA</div>
    <h2>Welcome, ${firstName}!</h2>
    <p>
      Your account has been successfully created at
      <strong>The Snoogums Academy</strong>. We're thrilled to have you join our community of learners!
    </p>
    <div class="info-box">
      <p>📧 <strong>Email:</strong> ${email}</p>
      <p>🔒 <strong>Status:</strong> Pending Payment Confirmation</p>
    </div>
    <p>
      <strong>What happens next?</strong><br>
      Your account is created but course access is currently locked.
      To unlock your dashboard and start learning, please complete your tuition payment.
    </p>
    <p>We accept:</p>
    <ul style="color:#718096;font-size:0.95rem;line-height:2;padding-left:1.5rem;">
      <li>💳 Online payment via <strong>Paystack</strong> (instant activation)</li>
      <li>🏦 Manual bank transfer (confirmed within 24 hours)</li>
    </ul>
    <hr class="divider">
    <p>
      Once your payment is confirmed, you'll receive another email and your
      dashboard will be unlocked automatically.
    </p>
    <p>Have questions? Reply to this email or contact us:</p>
    <a href="mailto:info.snoogums@gmail.com" class="btn">📧 Contact Us</a>
  `);

  return sendEmail({
    to:      email,
    subject: '🎓 Welcome to The Snoogums Academy!',
    html
  });
}


/*
  ============================================================
  EMAIL 2: PAYMENT CONFIRMED (sent when admin confirms payment
  OR Paystack payment is verified)
  ============================================================
*/
async function sendPaymentConfirmedEmail({ firstName, email, amount, method }) {
  const html = baseTemplate(`
    <div class="badge">✅ Payment Confirmed</div>
    <h2>Your Account is Now Active, ${firstName}!</h2>
    <p>
      Great news! Your payment has been confirmed and your
      <strong>Snoogums Academy</strong> account is now fully active.
      You can now access all your courses and live classes.
    </p>
    <div class="info-box">
      <p>💰 <strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
      <p>💳 <strong>Method:</strong> ${method === 'paystack' ? 'Paystack (Online)' : 'Manual Bank Transfer'}</p>
      <p>✅ <strong>Status:</strong> Confirmed</p>
    </div>
    <p>
      Log in to your student dashboard to start learning:
    </p>
    <a href="https://tourmaline-lokum-1443ac.netlify.app/pages/login.html" class="btn">🚀 Go to My Dashboard</a>
    <hr class="divider">
    <p style="font-size:0.85rem;">
      Your dashboard gives you access to all enrolled courses, live class schedules,
      and your personal learning progress. Welcome aboard! 🎉
    </p>
  `);

  return sendEmail({
    to:      email,
    subject: '✅ Payment Confirmed — Your TSA Account is Active!',
    html
  });
}


/*
  ============================================================
  EMAIL 3: CAREER APPLICATION RECEIVED
  ============================================================
*/
async function sendApplicationReceivedEmail({ firstName, email, subject }) {
  const html = baseTemplate(`
    <div class="badge">📋 Application Received</div>
    <h2>Thank You, ${firstName}!</h2>
    <p>
      We have received your teaching application at
      <strong>The Snoogums Academy</strong>. Thank you for your interest in joining our team!
    </p>
    <div class="info-box">
      <p>👤 <strong>Name:</strong> ${firstName}</p>
      <p>📚 <strong>Subject Applied For:</strong> ${subject || 'Not specified'}</p>
      <p>📅 <strong>Applied:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <p>
      <strong>What happens next?</strong><br>
      Our admin team will review your application and CV within <strong>3–5 business days</strong>.
      If shortlisted, we will contact you at this email address to arrange an interview.
    </p>
    <p>
      In the meantime, if you have any questions feel free to reach out:
    </p>
    <a href="mailto:info.snoogums@gmail.com" class="btn">📧 Contact Us</a>
    <hr class="divider">
    <p style="font-size:0.85rem;">
      Please note that due to the high volume of applications, we can only contact
      shortlisted candidates. Thank you for your understanding.
    </p>
  `);

  return sendEmail({
    to:      email,
    subject: '📋 Application Received — The Snoogums Academy',
    html
  });
}


/*
  ============================================================
  EMAIL 4: TEACHER ACCOUNT CREATED
  Sent when admin creates a teacher account from an application.
  ============================================================
*/
async function sendTeacherAccountCreatedEmail({ firstName, email, tempPassword }) {
  const html = baseTemplate(`
    <div class="badge">🏫 Teacher Account Created</div>
    <h2>Welcome to the Team, ${firstName}!</h2>
    <p>
      Congratulations! Your teaching application has been approved and your
      <strong>Snoogums Academy teacher account</strong> has been created.
    </p>
    <div class="info-box">
      <p>📧 <strong>Email:</strong> ${email}</p>
      <p>🔑 <strong>Temporary Password:</strong> ${tempPassword}</p>
    </div>
    <p>
      ⚠️ <strong>Important:</strong> Please log in and change your password immediately.
    </p>
    <a href="https://tourmaline-lokum-1443ac.netlify.app/pages/login.html" class="btn">🔐 Log In Now</a>
    <hr class="divider">
    <p style="font-size:0.85rem;">
      Select the <strong>Teacher</strong> tab on the login page and use the
      credentials above. After logging in, go to <strong>My Profile → Change Password</strong>
      to set your own secure password.
    </p>
    <p style="font-size:0.85rem;">
      We look forward to working with you. If you have any questions,
      contact our admin team at info.snoogums@gmail.com.
    </p>
  `);

  return sendEmail({
    to:      email,
    subject: '🏫 Your TSA Teacher Account is Ready!',
    html
  });
}


/*
  ============================================================
  EMAIL 5: LIVE CLASS REMINDER
  Sent 30 minutes before a scheduled class.
  (We'll trigger this from a scheduled job later)
  ============================================================
*/
async function sendLiveClassReminderEmail({ firstName, email, className, scheduledAt, jitsiRoom }) {
  const date = new Date(scheduledAt).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit'
  });

  const html = baseTemplate(`
    <div class="badge">🔴 Live Class Starting Soon</div>
    <h2>Class Reminder, ${firstName}!</h2>
    <p>
      Your live class is starting soon. Make sure you're ready!
    </p>
    <div class="info-box">
      <p>📚 <strong>Class:</strong> ${className}</p>
      <p>🕐 <strong>Time:</strong> ${date}</p>
      <p>🎥 <strong>Platform:</strong> Jitsi Meet (in your dashboard)</p>
    </div>
    <p>
      Log in to your dashboard to join the class when it goes live:
    </p>
    <a href="https://tourmaline-lokum-1443ac.netlify.app/pages/login.html" class="btn">🎥 Go to Live Class</a>
    <hr class="divider">
    <p style="font-size:0.85rem;">
      The class will appear as <strong>"LIVE NOW"</strong> on your dashboard
      once your teacher has clocked in. No separate app download is needed.
    </p>
  `);

  return sendEmail({
    to:      email,
    subject: `🔴 Reminder: "${className}" starts soon!`,
    html
  });
}


// Export all email functions


/*
  ============================================================
  EMAIL 6: ADMIN NOTIFICATION — NEW STUDENT REGISTERED
  Sent to admin when a new student registers with their
  selected category and programmes.
  ============================================================
*/
async function sendAdminNewStudentEmail({ studentName, email, category, programmes, paymentFrequency }) {
  const programmeRows = programmes.map(p =>
    `<tr>
      <td style="padding:0.5rem 0.75rem;border-bottom:1px solid #E8ECF0;">${p.name}</td>
      <td style="padding:0.5rem 0.75rem;border-bottom:1px solid #E8ECF0;">${p.duration}</td>
      <td style="padding:0.5rem 0.75rem;border-bottom:1px solid #E8ECF0;font-weight:700;color:#D0006F;">₦${Number(p.price).toLocaleString()}/contact</td>
    </tr>`
  ).join('');

  const html = baseTemplate(`
    <div class="badge">🔔 New Student Registration</div>
    <h2>New Student Registered</h2>
    <p>A new student has registered and is awaiting account activation.</p>
    <div class="info-box">
      <p>👤 <strong>Name:</strong> ${studentName}</p>
      <p>📧 <strong>Email:</strong> ${email}</p>
      <p>📚 <strong>Category:</strong> ${category}</p>
      <p>💳 <strong>Payment Preference:</strong> ${paymentFrequency || 'Not specified'}</p>
    </div>
    <p><strong>Selected Programme(s):</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:0.875rem;margin-bottom:1rem;">
      <thead>
        <tr style="background:#F4F6FA;">
          <th style="padding:0.5rem 0.75rem;text-align:left;">Programme</th>
          <th style="padding:0.5rem 0.75rem;text-align:left;">Duration</th>
          <th style="padding:0.5rem 0.75rem;text-align:left;">Price</th>
        </tr>
      </thead>
      <tbody>${programmeRows}</tbody>
    </table>
    <p>Please log in to the admin dashboard to review and activate this student's account.</p>
    <a href="https://tourmaline-lokum-1443ac.netlify.app/pages/dashboard-admin/index.html" class="btn">
      🛡️ Go to Admin Dashboard
    </a>
  `);

  return sendEmail({
    to:      process.env.EMAIL_USER,
    subject: `🔔 New Student: ${studentName} — Needs Activation`,
    html
  });
}

module.exports = {
  sendWelcomeEmail,
  sendPaymentConfirmedEmail,
  sendApplicationReceivedEmail,
  sendTeacherAccountCreatedEmail,
  sendLiveClassReminderEmail,
  sendAdminNewStudentEmail
};
