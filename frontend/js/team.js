/*
  ============================================================
  THE SNOOGUMS ACADEMY — TEAM PAGE JAVASCRIPT
  File: js/team.js

  THIS FILE HANDLES:
  1. Storing all 6 full biographies in one data object
  2. Opening the modal with the correct bio when "Read Full Bio" is clicked
  3. Closing the modal (✕ button, overlay click, or Escape key)
  4. Preventing background scroll while modal is open

  KEY CONCEPT — DATA-DRIVEN UI:
  Instead of writing 6 separate pieces of show/hide logic,
  we store ALL the bio content in ONE JavaScript object (teamBios).
  Then a SINGLE set of functions reads from that object based
  on which "data-member" was clicked. This is a very common,
  scalable pattern: separate your DATA from your DISPLAY LOGIC.
  If the school adds a 7th teacher later, we just add one more
  entry to this object — no new functions needed.
  ============================================================
*/


/* ============================================================
   SECTION 1: TEAM BIO DATA
   Each key (esther, odinaka, etc.) matches the data-member
   attribute on the HTML cards and buttons.

   Each bio is broken into an array of paragraphs.
   This makes it easy for JS to wrap each paragraph in its own
   <p> tag when displaying it in the modal.
============================================================ */
const teamBios = {

  esther: {
    name: 'Esther Joshua',
    role: 'Technology & Web Development Facilitator',
    photo: '../images/team-esther.jpeg',
    paragraphs: [
      'Esther is a passionate technology facilitator with a strong foundation in web development, cybersecurity, and digital solutions. At The Snoogums Academy, she brings complex tech concepts to life in ways that are accessible, engaging, and practical for every learner.',
      'Driven by a deep commitment to education and digital empowerment, Esther combines technical knowledge with exceptional communication skills to create learning experiences that inspire curiosity and build real-world skills. She is known for her patience, adaptability, and genuine investment in the growth of every student she works with.'
    ],
    tagline: 'Empowering the next generation of tech innovators'
  },

  odinaka: {
    name: 'Odinaka Udewena',
    role: 'Creative Media & AI Video Production',
    photo: '../images/team-odinaka.jpeg',
    paragraphs: [
      'Odinaka Udewena is a certified teacher and creative media professional bringing a unique blend of education and digital storytelling to The Snoogums Academy. She specializes in AI-powered video production and graphic design, making her a dynamic force at the intersection of technology, creativity, and learning.',
      'As a facilitator, Odinaka transforms complex creative and digital concepts into clear, engaging, and practical learning experiences. Her background in education gives her a natural ability to connect with learners at every level — breaking down tools, techniques, and technology in ways that are accessible, inspiring, and immediately applicable.',
      'With expertise spanning AI video creation, motion storytelling, social media content, and professional graphic design, she equips students with the creative and technical skills needed to thrive in today\'s digital landscape.'
    ],
    tagline: 'At TSA, Odinaka doesn\'t just teach creativity — she ignites it.'
  },

  confidence: {
    name: 'Confidence Simeon',
    role: 'ICT & Computer Science Educator',
    photo: '../images/team-confidence.jpeg',
    paragraphs: [
      'Confidence Simeon has over five years of dedicated experience in ICT education. She brings a wealth of knowledge, passion, and proven impact to The Snoogums Academy. Holding an HND in Computer Science, she specializes in making technology education engaging, inclusive, and deeply practical for learners across all age groups.',
      'She is a skilled integrator of modern educational tools and software, seamlessly weaving technology into every learning experience — teaching computer programming, digital literacy, and a broad range of ICT subjects in ways that spark curiosity and build lasting competence.',
      'Known for exceptional communication, collaborative spirit, and genuine commitment to every student\'s success, she creates classroom environments where learners feel supported, challenged, and inspired. Her track record speaks for itself — consistently improving student performance and cultivating a generation of confident, tech-savvy individuals.'
    ],
    tagline: 'Turning classrooms into launchpads for tomorrow\'s digital leaders.'
  },

  amarachi: {
    name: 'Hegan Amarachi',
    role: 'Primary Education Specialist (KS1 & KS2)',
    photo: '../images/team-amarachi.jpeg',
    paragraphs: [
      'Hegan Amarachi is a passionate and dedicated educator whose love for teaching spans over 15 years of transformative experience with primary school learners across Key Stage 1 (KS1) and Key Stage 2 (KS2). At The Snoogums Academy, she brings a wealth of knowledge, warmth, and proven excellence that makes every learner feel seen, supported, and inspired.',
      'Amarachi delivers all core subjects — Mathematics, English, and Science — with confidence and creativity, holding a particular strength and deep passion for Mathematics. Her ability to make numbers exciting, accessible, and meaningful sets her apart as an educator who doesn\'t just teach subjects, but builds genuine love for learning.',
      'Highly proficient in the British National Curriculum and well-versed in Cambridge Assessment frameworks, she brings both academic rigor and learner sensitivity to every classroom. Her approach is always inclusive, engaging, and firmly centered on the needs of each individual child — creating environments where curiosity thrives and confidence grows.',
      'With Amarachi, teaching is never just a profession — it is a calling. She takes immense pride in nurturing young minds, celebrating every milestone, and walking alongside each learner on their journey to reaching their fullest potential.'
    ],
    tagline: 'Where passion meets purpose — every child deserves a champion in their corner.'
  },

  nelson: {
    name: 'Nelson Amibor O.',
    role: 'Mathematics, English & Humanities',
    photo: '../images/team-nelson.jpeg',
    paragraphs: [
      'Nelson is a dedicated and versatile educator with a rich and diverse teaching background spanning Mathematics, English Language, Geography, and History across primary and junior secondary levels. At The Snoogums Academy, he brings a multi-disciplinary perspective, a nurturing spirit, and a proven commitment to academic excellence and holistic character development.',
      'His classroom experience is both broad and deeply hands-on. As a Class Teacher, he maintained structured, supportive learning environments while delivering curriculum objectives with consistency and care. He ignites critical thinking and a genuine love for learning through dynamic, interactive teaching methods that went far beyond the textbook.',
      'Beyond the classroom, Nelson has demonstrated remarkable versatility as a Diction & Elocution Instructor — developing communication skills, pronunciation, public speaking confidence, and personal presence that serve students well beyond academic settings.',
      'Skilled in lesson planning, classroom management, student assessment, and curriculum delivery, he approaches every learner as an individual — meeting them where they are and walking with them toward where they could be.'
    ],
    tagline: 'Teaching is not just about what students learn — it\'s about who they become.'
  },

  johny: {
    name: 'Johny Austine',
    role: 'AI Tools Educator & STEM Specialist',
    photo: '../images/team-johny.jpeg',
    paragraphs: [
      'Johny Austine is an award-winning educator, certified Artificial Intelligence (AI) Tools Educator, and visionary leader with several years of distinguished experience in education, sports, and administration. Recognized as Best Tutor of the Year, he is renowned for transforming learning through innovative, hands-on, blended, and technology-driven teaching methodologies.',
      'Johny specializes in teaching Mathematics, Further Mathematics, English Language, ICT/Computer Science, Basic Science, Physics, Chemistry, Design & Technology, Robotics, Coding, and Artificial Intelligence — while expertly preparing learners for SAT, Cambridge Checkpoint, GCSE, IGCSE, WAEC, NECO, IELTS, and other international and national examinations.',
      'Beyond academic excellence, he is passionate about mentoring young people to become critical thinkers, creative problem-solvers, and globally competitive leaders. As a certified AI educator, Johny equips educators, professionals, and organizations with practical AI skills for teaching, content creation, productivity, and institutional transformation.',
      'Complementing his educational expertise, Johny is a championship-winning chess coach, a certified Award Leader with The Duke of Edinburgh\'s International Award (Nigeria Chapter), and a transformational leader committed to empowering individuals and institutions through innovation, strategic thinking, and lifelong learning.'
    ],
    tagline: 'Best Tutor of the Year — Certified AI Tools Educator'
  }

};


/* ============================================================
   SECTION 2: GET MODAL ELEMENTS
============================================================ */
const modalOverlay = document.getElementById('modalOverlay');
const modalBox      = document.getElementById('modalBox');
const modalClose    = document.getElementById('modalClose');
const modalPhoto    = document.getElementById('modalPhoto');
const modalName     = document.getElementById('modalName');
const modalRole     = document.getElementById('modalRole');
const modalBio      = document.getElementById('modalBio');


/* ============================================================
   SECTION 3: OPEN MODAL FUNCTION

   openBioModal(memberKey)
   Looks up the team member's data and fills the modal with it,
   then shows the modal.
============================================================ */
function openBioModal(memberKey) {
  /*
    Look up the bio data using the key.
    teamBios['esther'] is the same as teamBios.esther —
    bracket notation lets us use a variable as the property name.
  */
  const member = teamBios[memberKey];

  // Safety check: if somehow the key doesn't exist, stop here
  if (!member) {
    console.error(`No bio data found for member: ${memberKey}`);
    return;
  }

  // Fill in the photo, name, and role
  modalPhoto.src = member.photo;
  modalPhoto.alt = member.name;
  modalName.textContent = member.name;
  modalRole.textContent = member.role;

  /*
    BUILD THE BIO PARAGRAPHS
    member.paragraphs is an array of strings.
    We use .map() to convert each string into an HTML <p> tag,
    then .join('') to combine them all into one HTML string.

    .map(paragraph => `<p>${paragraph}</p>`)
    This takes each paragraph and WRAPS it in <p></p> tags.

    Example:
    ['Hello.', 'World.'] 
    becomes
    ['<p>Hello.</p>', '<p>World.</p>']
    then .join('') combines them:
    '<p>Hello.</p><p>World.</p>'
  */
  const paragraphsHTML = member.paragraphs
    .map(paragraph => `<p>${paragraph}</p>`)
    .join('');

  // Add the italic tagline at the end, if one exists
  const taglineHTML = member.tagline
    ? `<p class="bio-tagline">"${member.tagline}"</p>`
    : '';

  // Insert all the HTML into the modal body at once
  modalBio.innerHTML = paragraphsHTML + taglineHTML;

  // Show the modal
  modalOverlay.classList.add('active');

  /*
    Prevent the page BEHIND the modal from scrolling.
    Without this, a user could scroll the background page
    while the modal is open, which feels broken.
  */
  document.body.classList.add('modal-open');

  /*
    Move keyboard focus to the close button.
    This is important for ACCESSIBILITY — keyboard and screen
    reader users need focus to move INTO the modal when it opens,
    otherwise they'd be stuck interacting with content hidden behind it.
  */
  modalClose.focus();
}


/* ============================================================
   SECTION 4: CLOSE MODAL FUNCTION
============================================================ */
function closeBioModal() {
  modalOverlay.classList.remove('active');
  document.body.classList.remove('modal-open');
}


/* ============================================================
   SECTION 5: EVENT LISTENERS
============================================================ */

/*
  Attach click listeners to ALL "Read Full Bio" buttons.
  We use querySelectorAll + forEach since there are 6 buttons,
  one per team card.
*/
const readMoreButtons = document.querySelectorAll('.read-more-btn');

readMoreButtons.forEach(button => {
  button.addEventListener('click', function () {
    // Read which member this button belongs to from data-member
    const memberKey = this.dataset.member;
    openBioModal(memberKey);
  });
});

/*
  ALSO allow clicking the whole card photo to open the modal
  (not just the button) — improves usability, especially on touch devices.
*/
const teamCards = document.querySelectorAll('.team-card');
teamCards.forEach(card => {
  const photo = card.querySelector('.team-card-photo');
  photo.style.cursor = 'pointer';
  photo.addEventListener('click', function () {
    const memberKey = card.dataset.member;
    openBioModal(memberKey);
  });
});

// Close button click
modalClose.addEventListener('click', closeBioModal);

/*
  Close when clicking the dark overlay (outside the modal box).
  We check that the click target IS the overlay itself,
  not a child element like the modal box — otherwise clicking
  ANYWHERE inside the modal would also close it, which is wrong.
*/
modalOverlay.addEventListener('click', function (e) {
  if (e.target === modalOverlay) {
    closeBioModal();
  }
});

/*
  Close when the user presses the Escape key.
  This is a standard, expected behaviour for modals/popups
  across almost all websites and apps.
*/
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
    closeBioModal();
  }
});


console.log('%c 👥 Team Page Loaded ', 'background:#D0006F; color:white; padding:4px 8px; border-radius:4px;');
