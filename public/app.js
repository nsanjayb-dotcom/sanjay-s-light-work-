/**
 * Sanjay's Lightwork Studio - Luxury Client Experience
 * - Section A: Horizontal Services Swipe Carousel
 * - Section B: Transparent Pricing & Packages
 * - Section C: Direct Reservation & Calendar with Full Saturday Visibility
 * - Popup Modal: Quick Enquiry Form Only (Full Name, Email, Phone, Message, Send Enquiry)
 */

function initLuxuryExperience() {
  // 1. Horizontal Services Swipe Carousel Arrow Navigation
  const carousel = document.querySelector('.services-swipe-container, #services [class*="overflow-x-auto"]');
  const prevBtn = document.querySelector('#services-swipe-prev, [aria-label="Previous service"]');
  const nextBtn = document.querySelector('#services-swipe-next, [aria-label="Next service"]');

  if (carousel) {
    if (prevBtn && !prevBtn.dataset.bound) {
      prevBtn.dataset.bound = 'true';
      prevBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: -360, behavior: 'smooth' });
      });
    }
    if (nextBtn && !nextBtn.dataset.bound) {
      nextBtn.dataset.bound = 'true';
      nextBtn.addEventListener('click', () => {
        carousel.scrollBy({ left: 360, behavior: 'smooth' });
      });
    }
  }

  // 2. Flatpickr Calendar initialization with Saturday full visibility
  if (typeof flatpickr !== 'undefined') {
    const dateInputs = document.querySelectorAll('#shoot-date, input[name="shootDate"], .flatpickr-date-input');
    dateInputs.forEach((el) => {
      if (!el._flatpickr) {
        flatpickr(el, {
          minDate: 'today',
          dateFormat: 'Y-m-d',
          altInput: true,
          altFormat: 'M j, Y (D)',
          disableMobile: true,
          onChange: function(selectedDates, dateStr) {
            el.value = dateStr;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }
    });
  }

  // 3. Attach Clock Picker triggers for Preferred Start & End Time
  const startTimeTrigger = document.getElementById('preferred-start-time');
  const endTimeTrigger = document.getElementById('preferred-end-time');

  if (startTimeTrigger && !startTimeTrigger.dataset.clockBound) {
    startTimeTrigger.dataset.clockBound = 'true';
    startTimeTrigger.addEventListener('click', () => {
      if (window.openVanillaClockPicker) {
        window.openVanillaClockPicker('preferred-start-time', 'Preferred Start Time');
      }
    });
  }

  if (endTimeTrigger && !endTimeTrigger.dataset.clockBound) {
    endTimeTrigger.dataset.clockBound = 'true';
    endTimeTrigger.addEventListener('click', () => {
      if (window.openVanillaClockPicker) {
        window.openVanillaClockPicker('preferred-end-time', 'Preferred End Time');
      }
    });
  }
}

// 4. Global Quick Enquiry Modal Drawer (Containing ONLY: Full Name, Email, Phone, Message, Send Enquiry)
window.openQuickEnquiryModal = function() {
  const existing = document.getElementById('global-quick-enquiry-drawer');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'global-quick-enquiry-drawer';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:1000030;display:flex;align-items:center;justify-content:center;padding:16px;user-select:none;font-family:"Plus Jakarta Sans",sans-serif;';

  overlay.innerHTML = `
    <div class="quick-enquiry-drawer" style="background:#FAF8F5;border:2px solid #C5A059;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.35);max-width:440px;width:100%;padding:28px;color:#1A1A1A;position:relative;">
      <button type="button" id="quick-enquiry-close-btn" style="position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;background:#FFF;border:1px solid #C5A059;color:#1A1A1A;cursor:pointer;font-weight:bold;font-size:18px;display:flex;align-items:center;justify-content:center;">&times;</button>
      
      <div style="font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#8C6207;margin-bottom:2px;">DIRECT INQUIRY · ONTARIO, CANADA</div>
      <h3 style="font-size:22px;font-weight:900;text-transform:uppercase;color:#1A1A1A;margin:0 0 6px 0;font-family:'Cinzel',serif;">QUICK ENQUIRY</h3>
      <p style="font-size:12px;color:#4A4A4A;font-weight:500;margin:0 0 20px 0;">Reach out directly with questions, desired dates, or custom projects. Sanjay replies personally within 24 hours.</p>

      <form id="quick-enquiry-form" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#1A1A1A;margin-bottom:4px;">Full Name *</label>
          <input type="text" id="quick-name" required placeholder="e.g. Priya Sharma" style="width:100%;padding:10px 14px;font-size:13px;border-radius:10px;border:2px solid rgba(197,160,89,0.7);background:#FFF;color:#1A1A1A;box-sizing:border-box;font-weight:600;outline:none;" />
        </div>

        <div>
          <label style="display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#1A1A1A;margin-bottom:4px;">Email *</label>
          <input type="email" id="quick-email" required placeholder="priya@example.com" style="width:100%;padding:10px 14px;font-size:13px;border-radius:10px;border:2px solid rgba(197,160,89,0.7);background:#FFF;color:#1A1A1A;box-sizing:border-box;font-weight:600;outline:none;" />
        </div>

        <div>
          <label style="display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#1A1A1A;margin-bottom:4px;">Phone *</label>
          <input type="tel" id="quick-phone" required placeholder="+1 (905) 555-0199" style="width:100%;padding:10px 14px;font-size:13px;border-radius:10px;border:2px solid rgba(197,160,89,0.7);background:#FFF;color:#1A1A1A;box-sizing:border-box;font-weight:600;outline:none;" />
        </div>

        <div>
          <label style="display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#1A1A1A;margin-bottom:4px;">Message *</label>
          <textarea id="quick-message" rows="3" required placeholder="Tell Sanjay about your desired session, dates, venue, or questions..." style="width:100%;padding:10px 14px;font-size:13px;border-radius:10px;border:2px solid rgba(197,160,89,0.7);background:#FFF;color:#1A1A1A;box-sizing:border-box;font-weight:500;resize:none;outline:none;"></textarea>
        </div>

        <button type="submit" style="margin-top:6px;padding:13px 20px;font-size:12px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#1A1A1A;background:linear-gradient(135deg, #C5A059 0%, #D4AF37 50%, #C5A059 100%);border:1px solid #9A7432;border-radius:12px;cursor:pointer;box-shadow:0 4px 14px rgba(197,160,89,0.35);">
          SEND ENQUIRY
        </button>
      </form>
    </div>
  `;

  overlay.querySelector('#quick-enquiry-close-btn').onclick = () => overlay.remove();
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const form = overlay.querySelector('#quick-enquiry-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = overlay.querySelector('#quick-name').value;
    const email = overlay.querySelector('#quick-email').value;
    const phone = overlay.querySelector('#quick-phone').value;
    const msg = overlay.querySelector('#quick-message').value;

    overlay.querySelector('.quick-enquiry-drawer').innerHTML = `
      <div style="text-align:center;padding:16px 0;">
        <div style="width:54px;height:54px;border-radius:50%;background:#FFF;border:2px solid #C5A059;color:#8C6207;font-size:26px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px auto;">✓</div>
        <h3 style="font-size:22px;font-weight:900;text-transform:uppercase;color:#1A1A1A;margin:0 0 8px 0;">Enquiry Sent!</h3>
        <p style="font-size:12px;color:#4A4A4A;margin:0 0 20px 0;">Thank you, <strong>${name}</strong>. Sanjay will review your note and respond within 24 hours.</p>
        <button type="button" id="quick-done-btn" style="padding:10px 24px;font-size:12px;font-weight:800;text-transform:uppercase;background:#C5A059;color:#1A1A1A;border:none;border-radius:10px;cursor:pointer;">Done</button>
      </div>
    `;
    overlay.querySelector('#quick-done-btn').onclick = () => overlay.remove();
  };

  document.body.appendChild(overlay);
};

// Global click delegation for "Reserve", "Inquire", or navbar enquiry buttons
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, a');
  if (!target) return;

  const text = (target.innerText || '').toLowerCase();
  const id = target.id || '';
  
  if (
    target.matches('[data-action="enquire"], .btn-open-enquiry') ||
    id === 'open-enquire-btn' ||
    (target.tagName === 'BUTTON' && (text.includes('inquire') || text.includes('reserve date') || text.includes('reserve package') || text.includes('quick enquiry')))
  ) {
    // If it is not a direct calendar inline button, trigger quick enquiry drawer
    if (!target.closest('#book') && !id.includes('proceed')) {
      e.preventDefault();
      window.openQuickEnquiryModal();
    }
  }
});

// Initialize pickers on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLuxuryExperience);
} else {
  initLuxuryExperience();
}

document.addEventListener('click', () => {
  setTimeout(initLuxuryExperience, 100);
});

window.initLuxuryExperience = initLuxuryExperience;
