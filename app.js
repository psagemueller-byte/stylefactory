/* ========================================
   Stylefactory – Booking System & UI Logic
   ======================================== */

// ---------- Service Data ----------
const SERVICES = [
  { id: 'herrenschnitt',   name: 'Herrenschnitt',       icon: '✂',  duration: 15,  price: 25  },
  { id: 'damenschnitt',    name: 'Damenschnitt',         icon: '✨', duration: 45,  price: 45  },
  { id: 'faerben',         name: 'Färben / Strähnen',    icon: '🎨', duration: 90,  price: 75  },
  { id: 'balayage',        name: 'Balayage',             icon: '💡', duration: 120, price: 120 },
  { id: 'dauerwelle',      name: 'Dauerwelle',           icon: '🌀', duration: 120, price: 95  },
  { id: 'bartpflege',      name: 'Bartpflege',           icon: '🧔', duration: 20,  price: 18  },
  { id: 'hochsteckfrisur', name: 'Hochsteckfrisur',      icon: '💃', duration: 60,  price: 65  },
  { id: 'keratin',         name: 'Keratin-Behandlung',   icon: '⚡', duration: 90,  price: 110 },
];

// Opening hours: key = day of week (0=Sun, 1=Mon, ..., 6=Sat)
const OPENING_HOURS = {
  0: null,                        // So: geschlossen
  1: { open: '09:00', close: '19:00' }, // Mo
  2: { open: '09:00', close: '19:00' }, // Di
  3: { open: '09:00', close: '19:00' }, // Mi
  4: { open: '09:00', close: '19:00' }, // Do
  5: { open: '09:00', close: '19:00' }, // Fr
  6: { open: '09:00', close: '16:00' }, // Sa
};

// Simulated existing bookings (for demo purposes)
const EXISTING_BOOKINGS = [];

// ---------- State ----------
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// ---------- DOM References ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---------- Navbar ----------
const navbar = $('#navbar');
const navToggle = $('#navToggle');
const navLinks = $('#navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ---------- Booking Steps ----------
function showStep(stepNum) {
  $$('.booking-step').forEach(el => el.classList.add('hidden'));
  $(`#step${stepNum}`).classList.remove('hidden');

  $$('.booking-steps .step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === stepNum) el.classList.add('active');
    if (s < stepNum) el.classList.add('done');
  });
}

function showSuccess() {
  $$('.booking-step').forEach(el => el.classList.add('hidden'));
  $('#stepSuccess').classList.remove('hidden');
  $$('.booking-steps .step').forEach(el => el.classList.add('done'));
}

// ---------- Step 1: Service Selection ----------
function renderServiceOptions() {
  const grid = $('#serviceSelect');
  grid.innerHTML = SERVICES.map(s => `
    <div class="service-option" data-id="${s.id}">
      <span class="service-option-icon">${s.icon}</span>
      <div class="service-option-info">
        <strong>${s.name}</strong>
        <span>${s.duration} Min. · ${s.price} €</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.service-option').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.service-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      selectedService = SERVICES.find(s => s.id === el.dataset.id);
      // Auto-advance to step 2
      selectedDate = null;
      selectedTime = null;
      setTimeout(() => {
        showStep(2);
        renderCalendar();
        clearTimeSlots();
      }, 200);
    });
  });
}

// ---------- Step 2: Calendar ----------
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

  // Monday=0 based offset
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

  let html = '';

  // Empty cells for days before first of month
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

  // Attach click handlers
  daysContainer.querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(btn => {
    btn.addEventListener('click', () => {
      daysContainer.querySelectorAll('.cal-day').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const parts = btn.dataset.date.split('-');
      selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      selectedTime = null;
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

// ---------- Step 2: Time Slots ----------
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
  const interval = 15; // 15-minute intervals

  for (let t = openMin; t + serviceDuration <= closeMin; t += interval) {
    slots.push({
      time: minutesToTime(t),
      available: !isSlotBooked(date, t, serviceDuration)
    });
  }

  return slots;
}

function isSlotBooked(date, startMinutes, duration) {
  const dateStr = date.toISOString().split('T')[0];
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

// Step 2 navigation
$('#backToStep1').addEventListener('click', () => {
  showStep(1);
});

$('#toStep3').addEventListener('click', () => {
  if (!selectedService || !selectedDate || !selectedTime) return;
  fillConfirmation();
  showStep(3);
});

// ---------- Step 3: Confirmation ----------
function formatDate(date) {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const d = date.getDate();
  const m = MONTH_NAMES[date.getMonth()];
  const y = date.getFullYear();
  return `${days[date.getDay()]}, ${d}. ${m} ${y}`;
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} Minuten`;
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

$('#backToStep2').addEventListener('click', () => {
  showStep(2);
});

$('#confirmBooking').addEventListener('click', () => {
  const name = $('#customerName').value.trim();
  const phone = $('#customerPhone').value.trim();

  if (!name || !phone) {
    alert('Bitte gib deinen Namen und deine Telefonnummer ein.');
    return;
  }

  // Register booking
  EXISTING_BOOKINGS.push({
    date: selectedDate.toISOString().split('T')[0],
    time: selectedTime,
    duration: selectedService.duration,
    service: selectedService.name,
    customer: name,
    phone: phone,
    email: $('#customerEmail').value.trim()
  });

  showSuccess();
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
  $$('.service-option').forEach(o => o.classList.remove('selected'));
  showStep(1);
});

// ---------- Smooth Scroll for anchor links ----------
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---------- Init ----------
renderServiceOptions();
showStep(1);
