/* Rodcroft Civil Engineering Contractors — site scripts */
(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Current year in footer
  var yr = document.querySelectorAll('[data-year]');
  yr.forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // RFQ / contact form (client-side demo handling)
  var form = document.querySelector('.rfq-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var success = form.querySelector('.form-success');
      if (success) {
        success.classList.add('show');
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      form.reset();
    });
  }

  // Lazy-load project gallery backgrounds via IntersectionObserver
  var lazyEls = document.querySelectorAll('[data-bg]');
  if ('IntersectionObserver' in window && lazyEls.length) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.style.backgroundImage = el.getAttribute('data-bg');
          obs.unobserve(el);
        }
      });
    }, { rootMargin: '200px' });
    lazyEls.forEach(function (el) { io.observe(el); });
  } else {
    lazyEls.forEach(function (el) { el.style.backgroundImage = el.getAttribute('data-bg'); });
  }
})();
