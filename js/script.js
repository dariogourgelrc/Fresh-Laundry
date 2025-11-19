// jQuery-based interactions
(function(){ if (!window.jQuery) return; $(function() {
  // Hamburger Menu Toggle
  const $hamburgerMenu = $('#hamburger-menu');
  const $nav = $('.nav');

  if ($hamburgerMenu.length && $nav.length) {
    $hamburgerMenu.on('click', function() {
      $(this).toggleClass('active');
      $nav.toggleClass('active');
    });

    // Close menu when clicking on a navigation link
    const $navLinks = $nav.find('a');
    $navLinks.on('click', function() {
      $hamburgerMenu.removeClass('active');
      $nav.removeClass('active');
    });

    // Close menu when clicking outside
    $(document).on('click', function(event) {
      const $target = $(event.target);
      const clickedOutside = !$hamburgerMenu.is($target) && $hamburgerMenu.has($target).length === 0 &&
                             !$nav.is($target) && $nav.has($target).length === 0;
      if (clickedOutside) {
        $hamburgerMenu.removeClass('active');
        $nav.removeClass('active');
      }
    });
  }

  // Pricing Tabs
  const $tabButtons = $('.tab-button');
  const $tabPanels = $('.tab-panel');

  if ($tabButtons.length && $tabPanels.length) {
    $tabButtons.on('click', function() {
      const $btn = $(this);
      const target = $btn.data('tab');

      // Update buttons state
      $tabButtons.removeClass('active').attr('aria-selected', 'false');
      $btn.addClass('active').attr('aria-selected', 'true');

      // Show target panel and hide others
      $tabPanels.each(function() {
        const $panel = $(this);
        if ($panel.attr('id') === `tab-${target}`) {
          $panel.addClass('active').removeAttr('aria-hidden');
        } else {
          $panel.removeClass('active').attr('aria-hidden', 'true');
        }
      });
    });
  }

  // Lightbox (jQuery)
  const $lightboxOverlay = $('<div class="lightbox-overlay" aria-hidden="true"></div>');
  const $lightboxContent = $('<div class="lightbox-content"></div>');
  const $lightboxImg = $('<img class="lightbox-img" alt="Expanded image" decoding="async">');
  const $lightboxClose = $('<button class="lightbox-close" aria-label="Close">×</button>');

  $lightboxContent.append($lightboxImg, $lightboxClose);
  $lightboxOverlay.append($lightboxContent);
  $('body').append($lightboxOverlay);

  function openLightbox(src, alt) {
    $lightboxImg.attr('src', src).attr('alt', alt || '');
    $lightboxOverlay.fadeIn(150).attr('aria-hidden', 'false');
  }

  function closeLightbox() {
    $lightboxOverlay.fadeOut(150).attr('aria-hidden', 'true');
  }

  // Click any image with .lightbox to open
  $(document).on('click', 'img.lightbox', function() {
    const src = $(this).attr('src');
    const alt = $(this).attr('alt');
    openLightbox(src, alt);
  });

  // Close when clicking overlay area or close button
  $lightboxOverlay.on('click', function(e) {
    const $target = $(e.target);
    if ($target.is('.lightbox-overlay') || $target.is('.lightbox-close')) {
      closeLightbox();
    }
  });

  // Close with Escape key
  $(document).on('keyup', function(e) {
    if (e.key === 'Escape') {
      closeLightbox();
    }
  });
}); })();

// Dynamic Services: load, filter, sort using jQuery
(function(){ if (!window.jQuery) return; $(function() {
  const $servicesList = $('#services-list');
  if (!$servicesList.length) return;

  let allServices = [];
  let filtered = [];

  function render(items) {
    $servicesList.empty();
    if (!items.length) {
      $servicesList.append('<p class="no-results">No services found.</p>');
      return;
    }
    items.forEach(function(s) {
      const $card = $(
        '<div class="service-box">\n' +
        '  <div class="service-image">\n' +
        `    <img src="${s.image}" alt="${s.name}" class="lightbox" loading="lazy" decoding="async">\n` +
        '  </div>\n' +
        '  <div class="service-content">\n' +
        `    <h3>${s.name}</h3>\n` +
        `    <p>${s.description}</p>\n` +
        '    <div class="service-buttons">\n' +
        '      <a href="pricing.html" class="btn-view-prices">VIEW PRICES</a>\n' +
        '      <a href="booknow.html" class="btn-book-now">BOOK NOW</a>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>'
      );
      $servicesList.append($card);
    });
  }

  function applyFilters() {
    const query = ($('#services-search').val() || '').toLowerCase().trim();
    const category = $('#services-filter').val() || '';
    const sort = $('#services-sort').val() || 'name-asc';

    filtered = allServices.filter(function(s) {
      const matchesCategory = !category || s.category === category;
      const haystack = (`${s.name} ${s.description} ${(s.tags || []).join(' ')}`).toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      return matchesCategory && matchesQuery;
    });

    if (sort === 'price-asc') {
      filtered.sort(function(a, b) { return (a.price || 0) - (b.price || 0); });
    } else if (sort === 'price-desc') {
      filtered.sort(function(a, b) { return (b.price || 0) - (a.price || 0); });
    } else {
      filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
    }

    render(filtered);
  }

  $.getJSON('./js/data/services.json')
    .done(function(data) {
      allServices = (data || []).map(function(s, i) { return $.extend({ id: s.id || ('svc_' + i) }, s); });
      // Clear any static content once data loads
      applyFilters();
    })
    .fail(function() {
      // Fallback: build dataset from any pre-existing DOM cards
      allServices = $('.services-grid .service-box').map(function() {
        const $box = $(this);
        const name = ($box.find('h3').text() || '').trim();
        const description = ($box.find('p').first().text() || '').trim();
        const image = $box.find('img').attr('src');
        return { id: name.toLowerCase().replace(/\s+/g, '_'), name: name, description: description, image: image, category: '', price: 0 };
      }).get();
      applyFilters();
    });

  $('#services-search').on('input', applyFilters);
  $('#services-filter').on('change', applyFilters);
  $('#services-sort').on('change', applyFilters);
}); })();

// Forms: validation and AJAX submission
(function(){ if (!window.jQuery) return; $(function() {
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
  }
  function validatePhone(phone) {
    return /^(\+?\d[\d\s-]{7,})$/.test(String(phone));
  }
  function clearErrors($form) {
    $form.find('.error-message').remove();
  }
  function showError($field, message) {
    const $msg = $('<div class="error-message" role="alert"></div>').text(message);
    $field.closest('.form-group').append($msg);
  }

  // CONTACT FORM
  const $contactForm = $('#contactForm');
  if ($contactForm.length) {
    $contactForm.on('submit', function(e) {
      e.preventDefault();
      const $f = $(this);
      clearErrors($f);
      const name = $('#ctName').val().trim();
      const email = $('#ctEmail').val().trim();
      const phone = $('#ctPhone').val().trim();
      const type = $('#ctType').val();
      const message = $('#ctMessage').val().trim();

      let valid = true;
      if (!name || name.length < 2) { showError($('#ctName'), 'Please enter your full name.'); valid = false; }
      if (!validateEmail(email)) { showError($('#ctEmail'), 'Enter a valid email address.'); valid = false; }
      if (!validatePhone(phone)) { showError($('#ctPhone'), 'Enter a valid phone number.'); valid = false; }
      if (!type) { showError($('#ctType'), 'Please select a message type.'); valid = false; }
      if (!message || message.length < 10) { showError($('#ctMessage'), 'Please enter at least 10 characters.'); valid = false; }
      if (!valid) return;

      const payload = { name, email, phone, type, message, page: 'contact' };
      // AJAX submit demo to httpbin (replace with real endpoint when available)
      fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function() { /* ignore network errors for demo */ });

      const $result = $('#contactResult');
      $result.html('<div class="success-message">Thanks! Your message has been prepared. Use the button below to send the email.</div>');

      const subject = encodeURIComponent(`Contact - ${type} from ${name}`);
      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Type: ${type}`,
        '',
        message
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));
      const mailtoHref = `mailto:info@freshwavelaundry.co.za?subject=${subject}&body=${body}`;
      $('#composeEmail').attr('href', mailtoHref);
      $('#composeWrap').show();
    });
  }

  // ENQUIRY FORM
  const $enquiryForm = $('#enquiryForm');
  if ($enquiryForm.length) {
    $enquiryForm.on('submit', function(e) {
      e.preventDefault();
      const $f = $(this);
      clearErrors($f);
      const name = $('#enqName').val().trim();
      const email = $('#enqEmail').val().trim();
      const phone = $('#enqPhone').val().trim();
      const type = $('#enqType').val();
      const subject = $('#enqSubject').val().trim();
      const date = $('#enqDate').val();
      const message = $('#enqMessage').val().trim();

      let valid = true;
      if (!name || name.length < 2) { showError($('#enqName'), 'Please enter your full name.'); valid = false; }
      if (!validateEmail(email)) { showError($('#enqEmail'), 'Enter a valid email address.'); valid = false; }
      if (!validatePhone(phone)) { showError($('#enqPhone'), 'Enter a valid phone number.'); valid = false; }
      if (!type) { showError($('#enqType'), 'Please select an enquiry type.'); valid = false; }
      if (!subject) { showError($('#enqSubject'), 'Please provide a subject.'); valid = false; }
      if (!message || message.length < 10) { showError($('#enqMessage'), 'Please enter at least 10 characters.'); valid = false; }
      if (!valid) return;

      const payload = { name, email, phone, type, subject, date, message, page: 'enquiry' };
      fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function() {
        $('#enquiryResult').html(
          `<div class="success-message">Thanks ${name}! We received your ${type} enquiry about "${subject}". We’ll review availability and cost${date ? ' for your preferred date '+date : ''} and reply to ${email} soon.</div>`
        );
      })
      .catch(function() {
        $('#enquiryResult').html(
          `<div class="success-message">Thanks ${name}! Your enquiry has been recorded locally. We’ll follow up at ${email}.</div>`
        );
      });
    });
  }

  // BOOKING FORM (Book Now page)
  const $bookingForm = $('.booking-form');
  if ($bookingForm.length) {
    $bookingForm.on('submit', function(e) {
      e.preventDefault();
      const $f = $(this);
      // Collect basic fields
      const name = ($('#name').val() || '').trim();
      const email = ($('#email').val() || '').trim();
      const phone = ($('#numero').val() || '').trim();
      const service = ($('input[name="service"]:checked').val() || '').trim();
      const date = ($('#date').val() || '').trim();
      const time = ($('#time').val() || '').trim();

      // Build a friendly service label
      const svcLabelMap = {
        washnfold: 'Wash & Fold',
        drycleaning: 'Dry Cleaning',
        ironing: 'Ironing',
        picndelivery: 'Pickup & Delivery',
        bedding: 'Bedding',
        eco: 'Eco-Friendly Options'
      };
      const serviceLabel = svcLabelMap[service] || 'Selected Service';

      // Demo submit payload (replace with real endpoint when available)
      const payload = { name, email, phone, service, date, time, page: 'booking' };
      fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function() { /* ignore network errors for demo */ });

      // Show confirmation message
      const $result = $('#bookingResult');
      if ($result.length) {
        const prettyDateTime = [date, time].filter(Boolean).join(' at ');
        $result.html(
          `<div class="success-message">Thanks${name ? ' '+name : ''}! We received your booking for ${serviceLabel}${prettyDateTime ? ' on '+prettyDateTime : ''}. We’ll reach out to confirm details shortly.</div>`
        );
      } else {
        alert('Thanks! We received your booking and will contact you shortly.');
      }
    });
  }
}); })();

// Vanilla JS: show a quick toast when clicking Book Now links, then navigate
(function() {
  function ensureToast() {
    let toast = document.querySelector('.toast-ack');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-ack';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.textContent = 'Thanks! We received your booking request.';
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message, duration) {
    const toast = ensureToast();
    if (message) toast.textContent = message;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, duration || 1500);
  }

  function hookBookLinks() {
    var links = Array.prototype.slice.call(document.querySelectorAll('a.btn-book-now, a.btn-book-now-pricing'));
    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        // Only intercept left-click without modifier keys
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        showToast('Thanks! We received your booking request.', 1200);
        var href = link.getAttribute('href');
        setTimeout(function() { window.location.href = href; }, 900);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookBookLinks);
  } else {
    hookBookLinks();
  }
})();