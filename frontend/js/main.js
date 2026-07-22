/*
  ============================================================
  THE SNOOGUMS ACADEMY - MAIN JAVASCRIPT
  File: js/main.js

  WHAT IS JAVASCRIPT?
  HTML = structure (the walls of the house)
  CSS  = style (the paint and furniture)
  JS   = behaviour (the electricity — things that MOVE and REACT)

  JavaScript runs IN the browser. When you load the page,
  the browser reads and executes this file line by line.

  HOW JS FINDS HTML ELEMENTS:
  document.getElementById('myId')       → finds ONE element by its id
  document.querySelector('.myClass')    → finds the FIRST element with that class
  document.querySelectorAll('.myClass') → finds ALL elements with that class

  Think of the HTML page as a tree structure called the DOM
  (Document Object Model). JS lets us reach into that tree
  and change things — text, colours, classes, visibility.
  ============================================================
*/


/*
  ============================================================
  1. NAVBAR: SCROLL EFFECT
  When the user scrolls down, add a class "scrolled" to the
  navbar so CSS can change its background from transparent to dark.
  ============================================================
*/

// Select the navbar element from the DOM
// document = the whole HTML page
// getElementById returns the ONE element with id="navbar"
const navbar = document.getElementById('navbar');

/*
  window.addEventListener('scroll', function) —
  "window" is the browser window itself.
  We're telling it: "every time the user scrolls, run this function."
  This is called an EVENT LISTENER — we're listening for an event (scroll).
*/
window.addEventListener('scroll', function () {

  /*
    window.scrollY = how many pixels the user has scrolled DOWN from the top.
    If they've scrolled more than 50px, we consider them "past" the hero.
    
    classList.toggle(class, condition):
    - If condition is TRUE → ADD the class
    - If condition is FALSE → REMOVE the class
  */
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});


/*
  ============================================================
  2. MOBILE NAVIGATION: HAMBURGER MENU
  On mobile, clicking the "☰" button opens/closes the nav links.
  ============================================================
*/

// Get the hamburger button and the nav links list
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

/*
  'click' event — fires when the user clicks the element.
  Inside the function, we TOGGLE classes on both elements.
  CSS is already written to respond to these classes.
*/
hamburger.addEventListener('click', function () {
  hamburger.classList.toggle('open');    // Animates ☰ → ✕
  navLinks.classList.toggle('open');     // Slides nav links down on mobile
});

/*
  Close the mobile menu if a nav link is clicked.
  We select ALL nav links and loop through them.
*/
const allNavLinks = document.querySelectorAll('.nav-link');

/*
  forEach — a way to loop through every item in a list.
  For each link, we attach a click event listener.
  Arrow function syntax: (parameter) => { code }
  This is a shorter way of writing function(parameter) { code }
*/
allNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');  // Close hamburger animation
    navLinks.classList.remove('open');   // Hide nav links
  });
});

/*
  SAFEGUARD: auto-close the mobile menu if the window is resized
  past the mobile breakpoint (768px) while it's open.

  WHY THIS MATTERS:
  Imagine a user opens the menu on their phone, then rotates the
  phone to landscape, or they're on a tablet and resize the
  browser window wider. Without this check, the .open class would
  stay stuck on .nav-links. At desktop widths .nav-links switches
  back to a normal horizontal flex row, so this wouldn't be visibly
  broken — but it's still bad practice to leave UI state stale.
  This keeps the hamburger and nav state always in sync with the
  actual screen size.
*/
window.addEventListener('resize', function () {
  // 768px matches the breakpoint used in style.css for .hamburger
  if (window.innerWidth > 768) {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  }
});


/*
  ============================================================
  3. TYPEWRITER EFFECT
  The hero subtitle cycles through different phrases,
  typing them out letter by letter, then deleting.
  ============================================================
*/

// The element where the typewriter text appears
const typewriterEl = document.getElementById('typewriter');

// The phrases to cycle through — change these to match the bootcamp!
const phrases = [
  'our TSA Academy 2025.',
  'expert-led live classes.',
  'a world of knowledge.',
  'The Snoogums Academy!'
];

/*
  These variables track the STATE of the typewriter.
  State = what's currently happening.
  We need to know:
  - Which phrase are we on? (phraseIndex)
  - Which character position are we at? (charIndex)
  - Are we typing or deleting? (isDeleting)
*/
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

/*
  This is the MAIN TYPEWRITER FUNCTION.
  It runs, pauses, then schedules itself to run again.
  This pattern (a function that calls itself after a delay) 
  is called a RECURSIVE TIMEOUT.
*/
function typeWriter() {
  // The currently active phrase
  const currentPhrase = phrases[phraseIndex];

  if (isDeleting) {
    // DELETING: remove the last character
    // substring(0, charIndex) returns characters from position 0 to charIndex
    charIndex--;
    typewriterEl.textContent = currentPhrase.substring(0, charIndex);
  } else {
    // TYPING: add the next character
    charIndex++;
    typewriterEl.textContent = currentPhrase.substring(0, charIndex);
  }

  // Determine the speed for the next timeout
  let speed = isDeleting ? 50 : 100; // Deleting is faster than typing

  if (!isDeleting && charIndex === currentPhrase.length) {
    // We finished TYPING the full phrase → pause, then start deleting
    isDeleting = true;
    speed = 1800; // Wait 1.8 seconds before deleting
  } else if (isDeleting && charIndex === 0) {
    // We finished DELETING → move to next phrase
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    // The modulo (%) operator wraps back to 0 after the last phrase.
    // E.g., 3 % 4 = 3, 4 % 4 = 0 (wraps!), 5 % 4 = 1
    speed = 400; // Brief pause before typing the next phrase
  }

  /*
    setTimeout(function, delay) — schedule a function to run after `delay` ms.
    1000ms = 1 second. So this re-runs typeWriter() after `speed` milliseconds.
    This creates the typing illusion: run → wait → run → wait...
  */
  setTimeout(typeWriter, speed);
}

// Start the typewriter effect!
// We wait 1 second before starting so the page animation finishes first.
setTimeout(typeWriter, 1000);


/*
  ============================================================
  4. SCROLL REVEAL ANIMATION
  As the user scrolls down, elements with class "reveal"
  fade and slide into view.
  
  We use the IntersectionObserver API — a modern, efficient way
  to detect when an element enters the visible viewport.
  
  WHY NOT JUST USE THE SCROLL EVENT?
  The scroll event fires HUNDREDS of times per second.
  Checking every element's position that often is slow.
  IntersectionObserver is smarter — it only fires when
  an element actually crosses the threshold. Much better performance!
  ============================================================
*/

/*
  Create an IntersectionObserver.
  The callback function runs when any observed element's
  visibility changes.
  "entries" = an array of elements that changed
  "observer" = the observer itself (so we can stop watching an element)
*/
const revealObserver = new IntersectionObserver(function (entries, observer) {

  entries.forEach(entry => {
    /*
      entry.isIntersecting = true when the element is visible in the viewport
      When it becomes visible, add the "visible" class.
      The CSS for .reveal.visible makes it fade in and slide up.
    */
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      /*
        Stop watching this element once it's animated.
        We don't need to watch it anymore — it's already visible!
        This saves memory and processing power.
      */
      observer.unobserve(entry.target);
    }
  });

}, {
  /*
    OPTIONS for the observer:
    threshold: 0.1 = trigger when 10% of the element is visible.
    So the animation starts just as the element peeks into view.
  */
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
  /*
    rootMargin: '0px 0px -50px 0px' — shrinks the "detection zone" by 50px
    at the bottom. This means the element has to scroll 50px MORE into view
    before triggering. Prevents animation from firing too early.
  */
});

/*
  Find ALL elements with the class "reveal" and start watching each one.
  querySelectorAll returns a NodeList (like an array).
  We loop through with forEach.
*/
const revealElements = document.querySelectorAll('.reveal');
revealElements.forEach(el => revealObserver.observe(el));


/*
  ============================================================
  5. ANIMATED COUNTER (Stats Section)
  Numbers count up from 0 to their target value.
  Each stat has a data-target attribute in the HTML
  that specifies what number to count to.
  ============================================================
*/

/*
  This function animates one counter element from 0 to its target.
  
  Parameters:
  - element: the DOM element containing the number
  - target: the final number to count to
*/
function animateCounter(element, target) {

  let current = 0;                  // Start from 0
  const duration = 2000;            // Animation takes 2 seconds (2000ms)
  const stepTime = 30;              // Update the number every 30ms
  const totalSteps = duration / stepTime;  // How many times we'll update
  const increment = target / totalSteps;   // How much to add each step

  /*
    setInterval(function, delay) — runs a function repeatedly, every `delay` ms.
    Unlike setTimeout (runs ONCE), setInterval runs FOREVER until we stop it.
    We store it in "counter" so we can stop it later.
  */
  const counter = setInterval(function () {
    current += increment;

    if (current >= target) {
      // We've reached the target — set exact value and STOP the interval
      element.textContent = target;
      element.classList.add('done'); // CSS makes this number turn gold
      clearInterval(counter);         // Stop the interval
    } else {
      // Round to whole number for display — Math.ceil rounds UP
      element.textContent = Math.ceil(current);
    }
  }, stepTime);
}

/*
  Find all stat number elements.
  We use IntersectionObserver again so the counter only starts
  when the stats section scrolls into view — not on page load.
*/
const statNumbers = document.querySelectorAll('.stat-number');

const counterObserver = new IntersectionObserver(function (entries, observer) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Get the target number from the data-target HTML attribute
      // parseInt() converts a string ("100") to an integer (100)
      const target = parseInt(entry.target.getAttribute('data-target'));
      animateCounter(entry.target, target);

      // Stop watching after the animation starts (we only want it once)
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 }); // Trigger when 50% of the stats section is visible

statNumbers.forEach(num => counterObserver.observe(num));


/*
  ============================================================
  6. TESTIMONIALS SLIDER
  Displays one testimonial at a time. Dots at the bottom
  let users navigate, and it auto-advances every 5 seconds.
  ============================================================
*/

const track = document.getElementById('testimonialTrack');
const dots = document.querySelectorAll('.dot');

let currentSlide = 0;   // Which slide is currently showing
let autoSlideTimer;     // Stores the interval so we can reset it

/*
  This function moves the slider to show the card at `index`.
  
  HOW SLIDER WORKS:
  All cards sit side by side in a row (display: flex).
  The track is the full width × number of cards.
  We "move" the visible window by changing the track's left position.
  
  E.g., for 3 cards: [Card0] [Card1] [Card2]
  To show Card1: move the track left by 100% (one card width)
  
  CSS transform: translateX(-100%) moves the element 100% of its width to the left.
*/
function goToSlide(index) {
  currentSlide = index;

  // Move the track — index × 100% shifts by that many card-widths
  track.style.transform = `translateX(-${index * 100}%)`;

  // Update dots: remove "active" from all, add to current
  dots.forEach((dot, i) => {
    // ternary operator: condition ? value-if-true : value-if-false
    dot.classList[i === index ? 'add' : 'remove']('active');
  });
}

// Next slide function
function nextSlide() {
  // Move to next slide, wrap back to 0 after the last one
  const next = (currentSlide + 1) % dots.length;
  goToSlide(next);
}

// Start auto-advancing every 5 seconds
function startAutoSlide() {
  autoSlideTimer = setInterval(nextSlide, 5000);
}

// Stop auto-advancing (we pause when user clicks a dot)
function stopAutoSlide() {
  clearInterval(autoSlideTimer);
}

// Attach click events to each dot
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    stopAutoSlide();      // Stop auto-advance when user takes control
    goToSlide(index);     // Jump to clicked slide
    startAutoSlide();     // Restart auto-advance
  });
});

// Start the auto-slider
startAutoSlide();


/*
  ============================================================
  7. ACTIVE NAV LINK ON SCROLL
  Highlights the correct nav link based on which section
  is currently visible as the user scrolls the page.
  ============================================================
*/

/*
  We define the sections and their corresponding nav links.
  When a section scrolls into view, we highlight its nav link.
*/
const sections = document.querySelectorAll('section[id]');

const sectionObserver = new IntersectionObserver(function (entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Get the id of the visible section (e.g., "hero", "courses")
      const sectionId = entry.target.getAttribute('id');

      // Find the nav link that points to this section
      // href ends with #sectionId — the [attribute$=value] CSS selector
      const activeLink = document.querySelector(`.nav-link[href*="#${sectionId}"]`);

      // Remove active class from all links, then add to the current one
      allNavLinks.forEach(link => link.classList.remove('active'));
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, {
  threshold: 0.4  // Section must be 40% visible to be considered "active"
});

sections.forEach(section => sectionObserver.observe(section));


/*
  ============================================================
  8. SMOOTH SCROLL FOR ANCHOR LINKS
  When a link's href starts with "#" (e.g., href="#courses"),
  this makes the page scroll smoothly to that section.
  ============================================================
*/

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault(); // Stop the browser's default jump-to-anchor behaviour

    const targetId = this.getAttribute('href'); // e.g., "#courses"
    const targetSection = document.querySelector(targetId);

    if (targetSection) {
      /*
        scrollIntoView smoothly scrolls the page so the target element is visible.
        behavior: 'smooth' = animated scroll (not instant jump)
        block: 'start' = align the top of the element with the top of the viewport
      */
      targetSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});


/*
  ============================================================
  9. CONSOLE WELCOME MESSAGE
  A fun Easter egg for other developers who open DevTools.
  Not visible to regular users — only in the browser console.
  Press F12 in the browser → Console tab to see it!
  ============================================================
*/
console.log('%c 🎓 The Snoogums Academy ', 'background: #D0006F; color: white; font-size: 16px; font-weight: bold; padding: 8px 16px; border-radius: 8px;');
console.log('%c Knowledge Without Barriers, Potential Without Limits.', 'color: #FFC200; font-size: 12px;');
console.log('%c Built with ❤️ — TSA Web Team', 'color: #666; font-size: 11px;');

/* ============================================================
   ANTHEM AUDIO PLAYER
   Autoplays on page load. User can toggle mute/unmute.
   Browsers block autoplay with sound by default so we
   start muted and prompt the user to unmute.
============================================================ */
(function() {
  const audio    = document.getElementById('anthemAudio');
  const toggle   = document.getElementById('anthemToggle');
  const icon     = document.getElementById('anthemIcon');
  const progress = document.getElementById('anthemProgress');
  const closeBtn = document.getElementById('anthemClose');
  const player   = document.getElementById('anthemPlayer');

  if (!audio) return; // Only runs on pages that have the player

  // Start muted so autoplay works (browser policy)
  audio.muted  = true;
  audio.volume = 0.7;

  // Try to autoplay
  audio.play().catch(() => {
    // Autoplay blocked — wait for user interaction
    document.addEventListener('click', function startPlay() {
      audio.play();
      document.removeEventListener('click', startPlay);
    }, { once: true });
  });

  // Toggle mute/unmute on button click
  toggle.addEventListener('click', function() {
    if (audio.paused) {
      audio.play();
      icon.className = 'fas fa-volume-up';
    } else if (audio.muted) {
      audio.muted = false;
      icon.className = 'fas fa-volume-up';
    } else {
      audio.muted = true;
      icon.className = 'fas fa-volume-mute';
    }
  });

  // Update progress bar as audio plays
  audio.addEventListener('timeupdate', function() {
    if (audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progress.style.width = pct + '%';
    }
  });

  // Close player
  closeBtn.addEventListener('click', function() {
    audio.pause();
    player.style.display = 'none';
  });

  // After 2 seconds, unmute and show a subtle prompt
  setTimeout(() => {
    audio.muted = false;
    icon.className = 'fas fa-volume-up';
  }, 2000);
})();
