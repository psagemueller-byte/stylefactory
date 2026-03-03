/* ========================================
   Stylefactory – Complete UI Logic
   Components: Drawer, Carousel, Accordion,
   Toast, Scroll-Spy, Back-to-Top,
   Segmented Control, Booking System
   ======================================== */

// ---------- Service Data ----------
const SERVICES = [
  { id: 'herrenschnitt',   name: 'Herrenschnitt',       icon: '✂️',  duration: 15,  price: 25,  category: 'schnitt',  desc: 'Klassischer oder moderner Schnitt – perfekt auf dich abgestimmt.' },
  { id: 'damenschnitt',    name: 'Damenschnitt',         icon: '✨', duration: 45,  price: 45,  category: 'schnitt',  desc: 'Waschen, schneiden, föhnen – für deinen perfekten Look.' },
  { id: 'faerben',         name: 'Färben / Strähnen',    icon: '🎨', duration: 90,  price: 75,  category: 'farbe',    desc: 'Frische Farbe oder natürliche Highlights für strahlende Haare.' },
  { id: 'balayage',        name: 'Balayage',             icon: '💡', duration: 120, price: 120, category: 'farbe',    desc: 'Natürlicher Farbverlauf für einen sonnengeküssten Look.' },
  { id: 'dauerwelle',      name: 'Dauerwelle',           icon: '🌀', duration: 120, price: 95,  category: 'styling',  desc: 'Volumen und Locken, die halten – von natürlichen Wellen bis Korkenzieher.' },
  { id: 'bartpflege',      name: 'Bartpflege',           icon: '🧔', duration: 20,  price: 18,  category: 'pflege',   desc: 'Bartschnitt, Kontur und Pflege – für den gepflegten Gentleman.' },
  { id: 'hochsteckfrisur', name: 'Hochsteckfrisur',      icon: '💃', duration: 60,  price: 65,  category: 'styling',  desc: 'Für Hochzeiten, Events und besondere Anlässe – elegante Updos.' },
  { id: 'keratin',         name: 'Keratin-Behandlung',   icon: '⚡', duration: 90,  price: 110, category: 'pflege',   desc: 'Glattes, seidiges Haar ohne Frizz – bis zu 3 Monate Wirkung.' },
];

const CATEGORY_LABELS = {
  all: 'Alle',
  schnitt: 'Schnitt',
  farbe: 'Farbe',
  styling: 'Styling',
  pflege: 'Pflege'
};

// Opening hours
const OPENING_HOURS = {
  0: null,
  1: { open: '09:00', close: '19:00' },
  2: { open: '09:00', close: '19:00' },
  3: { open: '09:00', close: '19:00' },
  4: { open: '09:00', close: '19:00' },
  5: { open: '09:00', close: '19:00' },
  6: { open: '09:00', close: '16:00' },
};

const EXISTING_BOOKINGS = [];

// ---------- State ----------
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let activeFilter = 'all';

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================================
// COMPONENT: Toast Notification System
// ============================================================
const Toast = {
  container: null,

  init() {
    this.container = $('#toastContainer');
  },

  show({ title, message, type = 'info', duration = 4000 }) {
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close" aria-label="Schließen">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    this.container.appendChild(toast);

    setTimeout(() => this.remove(toast), duration);
  },

  remove(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }
};

// ============================================================
// COMPONENT: Drawer (Mobile Navigation)
// ============================================================
const Drawer = {
  el: null,
  overlay: null,

  init() {
    this.el = $('#drawer');
    this.overlay = $('#drawerOverlay');

    $('#navToggle').addEventListener('click', () => this.open());
    $('#drawerClose').addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());

    this.el.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', () => this.close());
    });
  },

  open() {
    this.el.classList.add('open');
    this.overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.el.classList.remove('open');
    this.overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// ============================================================
// COMPONENT: Carousel
// ============================================================
class Carousel {
  constructor(el, { slidesPerView = 3, autoplay = false, interval = 5000 } = {}) {
    this.el = el;
    this.track = el.querySelector('[id$="Track"]');
    this.slides = [...this.track.children];
    this.dotsContainer = el.querySelector('[id$="Dots"]');
    this.prevBtn = el.querySelector('[id$="Prev"]');
    this.nextBtn = el.querySelector('[id$="Next"]');
    this.currentIndex = 0;
    this.baseSlidesPerView = slidesPerView;
    this.slidesPerView = slidesPerView;
    this.autoplay = autoplay;
    this.interval = interval;
    this.timer = null;

    this.init();
  }

  init() {
    this.updateSlidesPerView();
    this.renderDots();
    this.update();

    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    if (this.autoplay) this.startAutoplay();

    this.el.addEventListener('mouseenter', () => this.stopAutoplay());
    this.el.addEventListener('mouseleave', () => { if (this.autoplay) this.startAutoplay(); });

    // Touch support
    let startX = 0;
    this.track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    this.track.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.updateSlidesPerView();
      this.renderDots();
      this.update();
    });
  }

  updateSlidesPerView() {
    const w = window.innerWidth;
    if (w <= 768) this.slidesPerView = 1;
    else if (w <= 1024) this.slidesPerView = Math.min(2, this.baseSlidesPerView);
    else this.slidesPerView = this.baseSlidesPerView;
  }

  get maxIndex() {
    return Math.max(0, this.slides.length - this.slidesPerView);
  }

  renderDots() {
    if (!this.dotsContainer) return;
    const count = this.maxIndex + 1;
    this.dotsContainer.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = `carousel-dot${i === this.currentIndex ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    }
  }

  update() {
    if (this.currentIndex > this.maxIndex) this.currentIndex = this.maxIndex;
    const pct = -(this.currentIndex * (100 / this.slidesPerView));
    this.track.style.transform = `translateX(${pct}%)`;

    if (this.dotsContainer) {
      this.dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === this.currentIndex);
      });
    }
  }

  prev() {
    this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.maxIndex;
    this.update();
  }

  next() {
    this.currentIndex = this.currentIndex < this.maxIndex ? this.currentIndex + 1 : 0;
    this.update();
  }

  goTo(i) {
    this.currentIndex = i;
    this.update();
  }

  startAutoplay() {
    this.stopAutoplay();
    this.timer = setInterval(() => this.next(), this.interval);
  }

  stopAutoplay() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

// ============================================================
// COMPONENT: Accordion
// ============================================================
const Accordion = {
  init() {
    $$('.accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.parentElement;
        const content = item.querySelector('.accordion-content');
        const isOpen = item.classList.contains('open');

        // Close all
        $$('.accordion-item').forEach(other => {
          other.classList.remove('open');
          other.querySelector('.accordion-content').style.maxHeight = '0';
          other.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
        });

        // Open clicked (if it was closed)
        if (!isOpen) {
          item.classList.add('open');
          content.style.maxHeight = content.scrollHeight + 'px';
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
};

// ============================================================
// COMPONENT: Scroll Spy (Active Nav)
// ============================================================
const ScrollSpy = {
  init() {
    const sections = $$('section[id]');
    const navLinks = $$('[data-nav]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(section => observer.observe(section));
  }
};

// ============================================================
// COMPONENT: Back to Top
// ============================================================
const BackToTop = {
  init() {
    const btn = $('#backToTop');
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 600);
    });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

// ============================================================
// COMPONENT: Reveal on Scroll
// ============================================================
const RevealOnScroll = {
  init() {
    // Add reveal class to elements
    $$('.service-card, .team-card, .contact-item, .accordion-item').forEach(el => {
      el.classList.add('reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    $$('.reveal').forEach(el => observer.observe(el));
  }
};

// ============================================================
// COMPONENT: Navbar Scroll
// ============================================================
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ============================================================
// COMPONENT: Hero Particles
// ============================================================
function initParticles() {
  const container = $('#heroParticles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'hero-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 6 + 's';
    p.style.animationDuration = (4 + Math.random() * 4) + 's';
    p.style.width = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    container.appendChild(p);
  }
}

// ============================================================
// Segmented Control (Service Filter)
// ============================================================
function initServiceFilter() {
  $$('.segment').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.segment').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderServiceCards();
    });
  });
}

function renderServiceCards() {
  const grid = $('#servicesGrid');
  const filtered = activeFilter === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeFilter);

  grid.innerHTML = filtered.map(s => `
    <div class="service-card reveal visible" data-category="${s.category}">
      <span class="badge-category">${CATEGORY_LABELS[s.category]}</span>
      <div class="service-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <div class="service-meta">
        <span class="service-duration">${formatDuration(s.duration)}</span>
        <span class="service-price">${s.price} €</span>
      </div>
      <p>${s.desc}</p>
    </div>
  `).join('');
}

// ============================================================
// BOOKING SYSTEM
// ============================================================

// --- Steps ---
function showStep(stepNum) {
  $$('.booking-step').forEach(el => el.classList.add('hidden'));
  $(`#step${stepNum}`).classList.remove('hidden');

  $$('.booking-steps .step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === stepNum) el.classList.add('active');
    if (s < stepNum) el.classList.add('done');
  });

  // Animate step line fills
  $$('.step-line-fill').forEach((fill, i) => {
    if (i < stepNum - 1) fill.style.width = '100%';
    else fill.style.width = '0';
  });
}

function showSuccess() {
  $$('.booking-step').forEach(el => el.classList.add('hidden'));
  $('#stepSuccess').classList.remove('hidden');
  $$('.booking-steps .step').forEach(el => el.classList.add('done'));
  $$('.step-line-fill').forEach(fill => fill.style.width = '100%');
}

// --- Step 1: Service Selection ---
function renderServiceOptions(filter = '') {
  const grid = $('#serviceSelect');
  const filtered = SERVICES.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  grid.innerHTML = filtered.map(s => `
    <div class="service-option${selectedService && selectedService.id === s.id ? ' selected' : ''}" data-id="${s.id}">
      <span class="service-option-icon">${s.icon}</span>
      <div class="service-option-info">
        <strong>${s.name}</strong>
        <span>${formatDuration(s.duration)} · ${s.price} €</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.service-option').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.service-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      selectedService = SERVICES.find(s => s.id === el.dataset.id);
      selectedDate = null;
      selectedTime = null;
      setTimeout(() => {
        showStep(2);
        renderSelectedBadge();
        renderCalendar();
        clearTimeSlots();
      }, 200);
    });
  });
}

// Search input
$('#serviceSearch').addEventListener('input', (e) => {
  renderServiceOptions(e.target.value);
});

function renderSelectedBadge() {
  if (!selectedService) return;
  $('#selectedServiceBadge').innerHTML = `
    <span class="badge badge-accent">${selectedService.icon} ${selectedService.name} – ${formatDuration(selectedService.duration)} – ${selectedService.price} €</span>
  `;
}

// --- Step 2: Calendar ---
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

function renderCalendar() {
  const monthYear = $('#calMonthYear');
  const daysContainer = $('#calDays');

  monthYear.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  let html = '';
  for (let i = 0; i < startDow; i++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(currentYear, currentMonth, d);
    const dayOfWeek = date.getDay();
    const isPast = date < today;
    const isClosed = OPENING_HOURS[dayOfWeek] === null;
    const isToday = date.getTime() === today.getTime();
    const isSelected = selectedDate && date.getTime() === selectedDate.getTime();

    let classes = 'cal-day';
    if (isPast || isClosed) classes += ' disabled';
    if (isToday) classes += ' today';
    if (isSelected) classes += ' selected';

    html += `<button class="${classes}" data-date="${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}"${(isPast || isClosed) ? ' disabled' : ''}>${d}</button>`;
  }

  daysContainer.innerHTML = html;

  daysContainer.querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(btn => {
    btn.addEventListener('click', () => {
      daysContainer.querySelectorAll('.cal-day').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const parts = btn.dataset.date.split('-');
      selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      selectedTime = null;
      $('#toStep3').disabled = true;
      renderTimeSlots();
    });
  });
}

$('#prevMonth').addEventListener('click', () => {
  const now = new Date();
  if (currentMonth === now.getMonth() && currentYear === now.getFullYear()) return;
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
  clearTimeSlots();
});

$('#nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
  clearTimeSlots();
});

// --- Step 2: Time Slots ---
function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function generateTimeSlots(date, serviceDuration) {
  const dayOfWeek = date.getDay();
  const hours = OPENING_HOURS[dayOfWeek];
  if (!hours) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  const slots = [];
  const interval = 15;

  for (let t = openMin; t + serviceDuration <= closeMin; t += interval) {
    slots.push({
      time: minutesToTime(t),
      available: !isSlotBooked(date, t, serviceDuration)
    });
  }
  return slots;
}

function isSlotBooked(date, startMinutes, duration) {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return EXISTING_BOOKINGS.some(booking => {
    if (booking.date !== dateStr) return false;
    const bookingStart = timeToMinutes(booking.time);
    const bookingEnd = bookingStart + booking.duration;
    const slotEnd = startMinutes + duration;
    return startMinutes < bookingEnd && slotEnd > bookingStart;
  });
}

function renderTimeSlots() {
  if (!selectedDate || !selectedService) return;

  const hint = $('#timeHint');
  const container = $('#timeSlots');
  const slots = generateTimeSlots(selectedDate, selectedService.duration);

  if (slots.length === 0) {
    hint.textContent = 'Keine verfügbaren Zeiten an diesem Tag.';
    hint.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  hint.classList.add('hidden');
  container.innerHTML = slots.map(s => `
    <button class="time-slot${s.available ? '' : ' disabled'}"
            data-time="${s.time}"
            ${!s.available ? 'disabled' : ''}>
      ${s.time}
    </button>
  `).join('');

  container.querySelectorAll('.time-slot:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTime = btn.dataset.time;
      $('#toStep3').disabled = false;
    });
  });
}

function clearTimeSlots() {
  $('#timeHint').textContent = 'Bitte wähle zuerst ein Datum.';
  $('#timeHint').classList.remove('hidden');
  $('#timeSlots').innerHTML = '';
  selectedTime = null;
  $('#toStep3').disabled = true;
}

$('#backToStep1').addEventListener('click', () => showStep(1));

$('#toStep3').addEventListener('click', () => {
  if (!selectedService || !selectedDate || !selectedTime) return;
  fillConfirmation();
  showStep(3);
});

// --- Step 3: Confirmation ---
function formatDate(date) {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return `${days[date.getDay()]}, ${date.getDate()}. ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} Std.`;
  return `${h} Std. ${m} Min.`;
}

function fillConfirmation() {
  $('#confirmService').textContent = selectedService.name;
  $('#confirmDuration').textContent = formatDuration(selectedService.duration);
  $('#confirmPrice').textContent = `${selectedService.price} €`;
  $('#confirmDate').textContent = formatDate(selectedDate);
  $('#confirmTime').textContent = `${selectedTime} Uhr`;
}

$('#backToStep2').addEventListener('click', () => showStep(2));

$('#confirmBooking').addEventListener('click', () => {
  const name = $('#customerName').value.trim();
  const phone = $('#customerPhone').value.trim();

  if (!name || !phone) {
    Toast.show({
      title: 'Fehlende Angaben',
      message: 'Bitte gib deinen Namen und deine Telefonnummer ein.',
      type: 'error'
    });
    return;
  }

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  EXISTING_BOOKINGS.push({
    date: dateStr,
    time: selectedTime,
    duration: selectedService.duration,
    service: selectedService.name,
    customer: name,
    phone: phone,
    email: $('#customerEmail').value.trim()
  });

  showSuccess();

  Toast.show({
    title: 'Termin bestätigt!',
    message: `${selectedService.name} am ${formatDate(selectedDate)} um ${selectedTime} Uhr`,
    type: 'success',
    duration: 6000
  });
});

$('#newBooking').addEventListener('click', () => {
  selectedService = null;
  selectedDate = null;
  selectedTime = null;
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  $('#customerName').value = '';
  $('#customerPhone').value = '';
  $('#customerEmail').value = '';
  $('#serviceSearch').value = '';
  renderServiceOptions();
  showStep(1);
});

// ============================================================
// Smooth Scroll
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Drawer.init();
  Accordion.init();
  ScrollSpy.init();
  BackToTop.init();
  RevealOnScroll.init();

  initParticles();
  initServiceFilter();
  renderServiceCards();
  renderServiceOptions();
  showStep(1);

  // Gallery Carousel
  new Carousel($('#galleryCarousel'), { slidesPerView: 3, autoplay: true, interval: 4000 });

  // Testimonial Carousel
  new Carousel($('#testimonialCarousel'), { slidesPerView: 1, autoplay: true, interval: 6000 });
});
