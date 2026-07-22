/*
  ============================================================
  THE SNOOGUMS ACADEMY — COURSES PAGE JAVASCRIPT
  File: js/courses.js

  THIS FILE HANDLES:
  1. Filter tab switching (All / Coding / Maths / etc.)
  2. Showing/hiding course cards based on selected filter
  3. Animating cards in when they appear
  4. Updating the results count text
  5. Showing the empty state when no cards match

  KEY CONCEPT — CLIENT-SIDE FILTERING:
  All 8 course cards exist in the HTML at all times.
  We never make a server request to filter them.
  We simply ADD the class "hidden" (display:none) to cards
  that don't match the filter, and REMOVE it from those that do.
  This is fast, smooth, and requires no backend at all.

  When the backend IS built, we might switch to server-side
  filtering for large course catalogues (hundreds of courses),
  but for 8–20 courses, client-side is perfectly fine.
  ============================================================
*/


/* ============================================================
   SECTION 1: GET ELEMENTS
============================================================ */
const filterTabs    = document.querySelectorAll('.filter-tab');
const courseCards   = document.querySelectorAll('.course-card-full');
const filterResults = document.getElementById('filterResults');
const noResults     = document.getElementById('noResults');
const coursesGrid   = document.getElementById('coursesGrid');


/* ============================================================
   SECTION 2: FILTER FUNCTION

   filterCourses(category)
   Shows cards matching the category, hides the rest.
   'all' is a special case that shows every card.
============================================================ */
function filterCourses(category) {
  let visibleCount = 0;

  courseCards.forEach((card, index) => {
    /*
      card.dataset.category reads the data-category attribute.
      e.g. <article data-category="coding"> → card.dataset.category = "coding"
    */
    const cardCategory = card.dataset.category;
    const shouldShow = (category === 'all' || cardCategory === category);

    if (shouldShow) {
      visibleCount++;

      // Remove hidden class — CSS transitions kick in
      card.classList.remove('hidden');

      /*
        We add a small staggered delay to each card so they
        don't all animate in at exactly the same time.
        The delay is based on the card's index in the visible set.

        We use setTimeout with a short delay to:
        1. First remove 'hidden' (so display:none is gone)
        2. Then add 'animate-in' (the entrance animation)
        The tiny 20ms gap ensures the browser has redrawn the
        element before we start the CSS animation.
      */
      setTimeout(() => {
        card.classList.add('animate-in');
        // Remove the class after animation completes so it can run again next time
        setTimeout(() => card.classList.remove('animate-in'), 500);
      }, index * 60 + 20);
      // index * 60ms = each card is 60ms later than the previous one

    } else {
      // Hide this card
      card.classList.add('hidden');
      card.classList.remove('animate-in');
    }
  });

  // Update the results count text
  updateResultsText(category, visibleCount);

  // Show or hide the empty state
  if (visibleCount === 0) {
    noResults.style.display = 'block';
    coursesGrid.style.display = 'none';
  } else {
    noResults.style.display = 'none';
    coursesGrid.style.display = 'grid';
  }
}


/* ============================================================
   SECTION 3: UPDATE RESULTS TEXT
   Updates the "Showing X courses" text below the filter tabs.
============================================================ */
function updateResultsText(category, count) {
  /*
    Template literals (backtick strings) let us embed expressions
    directly inside a string using ${ }.
    Much cleaner than "Showing " + count + " courses".
  */
  const categoryLabels = {
    all:         'all',
    coding:      'Coding',
    mathematics: 'Mathematics',
    science:     'Science',
    english:     'English',
    other:       'Other'
  };

  const label = categoryLabels[category] || category;

  if (category === 'all') {
    filterResults.innerHTML = `Showing <span>all ${count} courses</span>`;
  } else {
    filterResults.innerHTML = `Showing <span>${count} ${label} course${count !== 1 ? 's' : ''}</span>`;
    /*
      count !== 1 ? 's' : '' — a ternary operator for pluralisation.
      If count is 1: "1 Coding course"
      If count is 2: "2 Coding courses"
    */
  }
}


/* ============================================================
   SECTION 4: TAB CLICK HANDLER
   Attach a click listener to every filter tab.
============================================================ */
filterTabs.forEach(tab => {
  tab.addEventListener('click', function () {

    // Remove active state from all tabs
    filterTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });

    // Add active state to clicked tab
    this.classList.add('active');
    this.setAttribute('aria-selected', 'true');

    // Run the filter with this tab's data-filter value
    const filter = this.dataset.filter;
    filterCourses(filter);
  });
});


/* ============================================================
   SECTION 5: RESET FILTER FUNCTION
   Called by the "View All Courses" button in the empty state.
   Also accessible globally (window scope) because it's called
   inline in the HTML: onclick="resetFilter()"
============================================================ */
function resetFilter() {
  // Find and click the "All Courses" tab
  const allTab = document.querySelector('.filter-tab[data-filter="all"]');
  if (allTab) allTab.click();
}

// Make it available on the window object so the inline onclick works
window.resetFilter = resetFilter;


/* ============================================================
   SECTION 6: URL HASH FILTER
   If someone links to courses.html#coding, the coding tab
   automatically activates on page load.
   
   This is a nice touch for when we link to specific course
   categories from elsewhere on the site.

   window.location.hash reads the URL fragment (the # part).
   e.g. URL is "courses.html#mathematics" → hash is "#mathematics"
   We strip the # with .slice(1) to get "mathematics".
============================================================ */
function checkUrlHash() {
  const hash = window.location.hash.slice(1); // Remove the "#"
  if (hash) {
    const matchingTab = document.querySelector(`.filter-tab[data-filter="${hash}"]`);
    if (matchingTab) {
      matchingTab.click();
      // Scroll to the courses section so the filtered view is visible
      document.querySelector('.courses-page-section').scrollIntoView({
        behavior: 'smooth'
      });
    }
  }
}

// Run on page load
checkUrlHash();

// Also run if the hash changes while on the page
// (e.g., user clicks browser back/forward)
window.addEventListener('hashchange', checkUrlHash);


console.log('%c 📚 Courses Page Loaded ', 'background:#6B0FA8; color:white; padding:4px 8px; border-radius:4px;');
