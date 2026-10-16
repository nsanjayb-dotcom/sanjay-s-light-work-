/**
 * Sanjay's Lightwork Studio - app.js
 * 
 * Critical Implementations:
 * 1. Form Submission Redirect Prevention (e.preventDefault()) & In-App Confirmation Popup
 *    - Never auto-open Google Calendar
 *    - "Sync with Google Calendar" strictly as an optional button in confirmation popup
 * 2. Homepage Layout & Section C Direct Calendar Integration
 * 3. Quick General Enquiry Modal (#booking-modal)
 *    - Only Full Name, Email, Phone, Message, and "SEND ENQUIRY"
 * 4. High-Contrast Typography & DOM Event Bridges
 * 5. Custom Gold Clock Time Picker Modal (Any exact hour 1-12 & minute 0-59)
 */

(function () {
  'use strict';

  var WEB3FORMS_ACCESS_KEY = "e0325d47-2f10-438e-b74b-b2b95446df03";
  var WEB3FORMS_SUBJECT = "New Website Booking/Enquiry - Sanjay's Lightworks";
  var WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
  var SANJAY_WHATSAPP_NUMBER = "19055882047";

  // Format pre-filled WhatsApp link with all collected details
  function formatWhatsAppLink(details) {
    var lines = [
      "Hi Sanjay, I just submitted an enquiry on your website!",
      "",
      "• Client Name: " + (details.clientName || details.name || details.fullName || "Valued Client"),
      "• Email: " + (details.clientEmail || details.email || "Not specified"),
      "• Phone: " + (details.clientPhone || details.phone || "Not specified"),
      "• Selected Package: " + (details.packageName || details.package || "Single Photo Session"),
      "• Add-ons: " + (details.addOns || "Standard Inclusions"),
      "• Shoot Date: " + (details.date || details.shootDate || "Flexible"),
      "• Time Window: " + (details.timeWindow || "09:30 AM – 11:30 AM"),
      "• Message/Notes: " + (details.notes || details.message || details.shootVision || "None")
    ];
    return "https://wa.me/" + SANJAY_WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  // Post form data asynchronously to Web3Forms
  function submitToWeb3Forms(data, callback) {
    var payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      to: "nsanjayb@gmail.com",
      recipient: "nsanjayb@gmail.com",
      subject: WEB3FORMS_SUBJECT,
      from_name: "Sanjay's Lightworks Studio",
      name: data.clientName || data.name || data.fullName || "Valued Client",
      email: data.clientEmail || data.email || "nsanjayb@gmail.com",
      phone: data.clientPhone || data.phone || "Not provided",
      package: data.packageName || data.package || "Single Photo Session",
      addOns: data.addOns || "Standard Inclusions",
      shootDate: data.date || data.shootDate || "Flexible",
      timeWindow: data.timeWindow || "09:30 AM – 11:30 AM",
      total: data.total ? ("$" + data.total + " CAD") : "",
      message: data.notes || data.message || data.shootVision || "Website enquiry"
    };

    try {
      fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        console.log("Web3Forms submission success:", result);
        if (callback) callback(null, result);
      })
      .catch(function (err) {
        console.warn("Web3Forms dispatch notification:", err);
        if (callback) callback(err);
      });
    } catch (e) {
      console.warn("Web3Forms fetch error:", e);
    }
  }

  // Helper to build Google Calendar URL strictly for optional button
  function generateGoogleCalendarUrl(details) {
    var title = encodeURIComponent("Photo Shoot with Sanjay Lightworks (" + (details.packageName || "Photography Session") + ")");
    var desc = encodeURIComponent(
      "Photography Session with Sanjay.\n" +
      "Package: " + (details.packageName || "Standard") + "\n" +
      "Add-ons: " + (details.addOns || "Standard Inclusions") + "\n" +
      "Total: $" + (details.total || "50") + " CAD\n" +
      "Client: " + (details.clientName || "Valued Client") + "\n" +
      "Notes: " + (details.notes || details.shootVision || "Natural light portraits")
    );
    var loc = encodeURIComponent("Ontario, Canada");

    // Format dates (YYYYMMDDTHHmmss)
    var dateStr = details.date ? details.date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
    var startHour = "100000";
    var endHour = "120000";
    var datesParam = dateStr + "T" + startHour + "/" + dateStr + "T" + endHour;

    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + title + "&dates=" + datesParam + "&details=" + desc + "&location=" + loc;
  }

  // Display the In-App Confirmation Popup over the current page
  function showInAppConfirmationPopup(data) {
    // Remove any existing popup first
    var existing = document.getElementById("reservation-confirmation-overlay");
    if (existing) {
      existing.remove();
    }

    var overlay = document.createElement("div");
    overlay.id = "reservation-confirmation-overlay";
    overlay.className = "confirmation-popup-overlay modal-backdrop";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "9999999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.webkitBackdropFilter = "blur(8px)";
    overlay.style.overflowY = "auto";
    overlay.style.boxSizing = "border-box";

    var calendarUrl = generateGoogleCalendarUrl(data);
    var whatsappUrl = formatWhatsAppLink(data);

    overlay.innerHTML =
      '<div id="reservation-confirmation-card" class="confirmation-popup modal-card enquiry-drawer" style="background:#FAF8F5; color:#1A1A1A; border-radius:18px; padding:32px 28px; max-width:540px; width:100%; max-height:80vh; overflow-y:auto; -webkit-overflow-scrolling:touch; box-shadow:0 30px 80px rgba(0,0,0,0.6); border:1.5px solid #C5A059; font-family: Plus Jakarta Sans, sans-serif; position:relative; box-sizing:border-box;">' +
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; border-bottom:1px solid #E5E0D8; padding-bottom:14px;">' +
          '<div>' +
            '<span style="font-size:11px; font-weight:800; letter-spacing:0.2em; text-transform:uppercase; color:#8C6207; display:block;">ENQUIRY SENT!</span>' +
            '<h3 style="font-family: Cormorant Garamond, Georgia, serif; font-size:26px; font-weight:700; color:#1A1A1A; margin:4px 0 0 0; text-transform:uppercase; letter-spacing:-0.02em;">ENQUIRY SENT!</h3>' +
            '<p style="font-size:13.5px; color:#1A1A1A; margin:6px 0 0 0; font-weight:600; line-height:1.4;">Thank you! Your note has been delivered to Sanjay\'s inbox (nsanjayb@gmail.com).</p>' +
          '</div>' +
          '<button type="button" id="confirm-popup-close-x" style="background:#FFF; border:1px solid #D1D5DB; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; font-weight:bold; color:#1A1A1A; flex-shrink:0;">&times;</button>' +
        '</div>' +
        '<div style="background:#FFF; border:1px solid #E5E0D8; border-radius:14px; padding:16px 18px; margin-bottom:20px; font-size:12.5px; color:#1A1A1A; line-height:1.6; box-shadow:0 1px 3px rgba(0,0,0,0.03);">' +
          '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
            '<span style="font-weight:600; color:#555;">Client Name:</span>' +
            '<span style="font-weight:700; color:#1A1A1A;">' + (data.clientName || data.name || data.fullName || "Valued Client") + '</span>' +
          '</div>' +
          (data.clientEmail || data.email ? (
            '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
              '<span style="font-weight:600; color:#555;">Email:</span>' +
              '<span style="font-weight:700; color:#1A1A1A;">' + (data.clientEmail || data.email) + '</span>' +
            '</div>'
          ) : '') +
          (data.clientPhone || data.phone ? (
            '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
              '<span style="font-weight:600; color:#555;">Phone:</span>' +
              '<span style="font-weight:700; color:#1A1A1A;">' + (data.clientPhone || data.phone) + '</span>' +
            '</div>'
          ) : '') +
          '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
            '<span style="font-weight:600; color:#555;">Selected Package:</span>' +
            '<span style="font-weight:700; color:#1A1A1A;">' + (data.packageName || data.package || "Single Photo Session") + '</span>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
            '<span style="font-weight:600; color:#555;">Add-ons:</span>' +
            '<span style="font-weight:700; color:#8C6207;">' + (data.addOns || "Standard Inclusions") + '</span>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
            '<span style="font-weight:600; color:#555;">Shoot Date:</span>' +
            '<span style="font-weight:700; color:#1A1A1A;">' + (data.date || data.shootDate || "Flexible") + '</span>' +
          '</div>' +
          '<div style="display:flex; justify-content:space-between; border-bottom:1px solid #F3EFEA; padding-bottom:6px; margin-bottom:6px;">' +
            '<span style="font-weight:600; color:#555;">Time Window:</span>' +
            '<span style="font-weight:700; color:#1A1A1A;">' + (data.timeWindow || "09:30 AM – 11:30 AM") + '</span>' +
          '</div>' +
          (data.notes || data.message || data.shootVision ? (
            '<div style="border-top:1px solid #F3EFEA; padding-top:6px; margin-top:6px;">' +
              '<span style="font-weight:600; color:#555; display:block; margin-bottom:2px;">Message / Notes:</span>' +
              '<span style="font-style:italic; color:#333; display:block; background:#FAF8F5; padding:6px 10px; border-radius:6px; font-size:12px;">"' + (data.notes || data.message || data.shootVision) + '"</span>' +
            '</div>'
          ) : '') +
          (data.total ? (
            '<div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid #F3EFEA; margin-top:6px;">' +
              '<span style="font-weight:700; color:#1A1A1A; text-transform:uppercase;">Total Investment:</span>' +
              '<span style="font-weight:800; font-size:15px; color:#1A1A1A;">$' + data.total + ' CAD</span>' +
            '</div>'
          ) : '') +
        '</div>' +
        '<div style="display:flex; flex-direction:column; gap:10px;">' +
          /* Primary Gold Button: "Chat on WhatsApp" */
          '<a id="popup-whatsapp-chat-btn" href="' + whatsappUrl + '" target="_blank" rel="noopener noreferrer" class="gold-submit-btn" style="display:flex; align-items:center; justify-content:center; gap:10px; padding:14px 20px; border-radius:12px; color:#1A1A1A; font-size:13px; font-weight:800; text-transform:uppercase; text-decoration:none; cursor:pointer; letter-spacing:0.04em; transition:all 0.18s ease;">' +
            '&#128172; Chat on WhatsApp' +
          '</a>' +
          /* Secondary Button: "DONE & CLOSE" */
          '<button type="button" id="popup-dismiss-done-btn" style="padding:13px 20px; border-radius:12px; background:#1A1A1A; color:#FFF; border:none; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; cursor:pointer; transition:background 0.2s;">' +
            'DONE &amp; CLOSE' +
          '</button>' +
          /* Optional Google Calendar sync button */
          '<a id="popup-sync-calendar-btn" href="' + calendarUrl + '" target="_blank" rel="noopener noreferrer" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 16px; border-radius:10px; background:#FAF6ED; border:1px solid #C5A059; color:#1A1A1A; font-size:11px; font-weight:700; text-transform:uppercase; text-decoration:none; cursor:pointer;">' +
            '&#128197; Sync with Google Calendar (Optional)' +
          '</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Event listeners to close popup
    function closePopup() {
      overlay.remove();
    }

    var closeBtn = document.getElementById("confirm-popup-close-x");
    if (closeBtn) closeBtn.onclick = closePopup;

    var doneBtn = document.getElementById("popup-dismiss-done-btn");
    if (doneBtn) doneBtn.onclick = closePopup;

    overlay.onclick = function (e) {
      if (e.target === overlay) closePopup();
    };
  }

  // =========================================================================
  // =========================================================================
  // 5. CUSTOM GOLD TIME PICKER MODAL (CLEAN LUXURY DUAL SCROLL WHEEL)
  // =========================================================================
  function openCustomGoldClockModal(targetInput, fieldTitle) {
    var existingClock = document.getElementById("clock-modal-overlay");
    if (existingClock) {
      existingClock.remove();
    }

    var currentVal = (targetInput && targetInput.value) ? targetInput.value.trim() : "09:30 AM";
    var match = currentVal.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    var hour = 9;
    var minute = 30;
    var period = "AM";

    if (match) {
      hour = parseInt(match[1], 10) || 9;
      minute = parseInt(match[2], 10) || 0;
      if (match[3]) period = match[3].toUpperCase();
    }
    if (hour < 1) hour = 12;
    if (hour > 12) hour = 12;
    if (minute < 0) minute = 0;
    if (minute > 59) minute = 59;

    var clockOverlay = document.createElement("div");
    clockOverlay.id = "clock-modal-overlay";
    clockOverlay.className = "clock-modal-overlay";
    clockOverlay.setAttribute("data-lenis-prevent", "true");

    function renderClockHtml() {
      var hourStr = String(hour).padStart(2, "0");
      var minStr = String(minute).padStart(2, "0");

      var hoursHtml = "";
      for (var h = 1; h <= 12; h++) {
        var hStr = String(h).padStart(2, "0");
        var isHSel = hour === h;
        hoursHtml += '<button type="button" class="time-wheel-item hour-item-btn" data-hour="' + h + '" style="width:100%; padding:7px 4px; border-radius:8px; font-family:Plus Jakarta Sans, sans-serif; font-size:13px; font-weight:' + (isHSel ? '800' : '600') + '; font-variant-numeric:tabular-nums; border:' + (isHSel ? '1px solid #C5A059' : '1px solid transparent') + '; background:' + (isHSel ? '#1A1A1A' : 'transparent') + '; color:' + (isHSel ? '#FFF' : '#1A1A1A') + '; cursor:pointer; margin-bottom:3px; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease;">' + hStr + '</button>';
      }

      var minutesHtml = "";
      for (var m = 0; m < 60; m++) {
        var mStr = String(m).padStart(2, "0");
        var isMSel = minute === m;
        minutesHtml += '<button type="button" class="time-wheel-item min-item-btn" data-min="' + m + '" style="width:100%; padding:7px 4px; border-radius:8px; font-family:Plus Jakarta Sans, sans-serif; font-size:13px; font-weight:' + (isMSel ? '800' : '600') + '; font-variant-numeric:tabular-nums; border:' + (isMSel ? '1px solid #C5A059' : '1px solid transparent') + '; background:' + (isMSel ? '#1A1A1A' : 'transparent') + '; color:' + (isMSel ? '#FFF' : '#1A1A1A') + '; cursor:pointer; margin-bottom:3px; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease;">' + mStr + '</button>';
      }

      clockOverlay.innerHTML =
        '<div id="clock-modal-card" class="clock-modal-card" data-lenis-prevent="true" style="background:#FAF8F5; color:#1A1A1A; border-radius:20px; border:1px solid rgba(197,160,89,0.7); box-shadow:0 30px 70px rgba(0,0,0,0.5); max-width:360px; width:100%; padding:20px 18px 20px 18px; font-family:Plus Jakarta Sans, sans-serif; text-align:center; position:relative; overflow:hidden; box-sizing:border-box;">' +
          '<button type="button" id="clock-close-btn" style="position:absolute; top:12px; right:12px; width:30px; height:30px; border-radius:50%; background:#FFF; border:1px solid #D1D5DB; color:#1A1A1A; font-weight:bold; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:30;">&times;</button>' +
          
          '<div style="text-align:left; border-bottom:1px solid #E5E0D8; padding-bottom:10px; margin-bottom:12px; padding-right:26px;">' +
            '<span style="font-size:10px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#8C6207; display:block;">EXACT TIME SELECTOR</span>' +
            '<h3 style="font-family:Cormorant Garamond, Georgia, serif; font-size:18px; font-weight:700; color:#1A1A1A; margin:2px 0 0 0; text-transform:uppercase;">' + (fieldTitle || "Preferred Time") + '</h3>' +
          '</div>' +

          /* Prominent Live Preview with AM/PM Pills */
          '<div style="display:flex; justify-content:space-between; align-items:center; background:#FFF; border:1px solid #C5A059; border-radius:12px; padding:10px 14px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
            '<div style="display:flex; align-items:baseline; gap:4px; font-family:Plus Jakarta Sans, sans-serif; font-variant-numeric:tabular-nums;">' +
              '<span style="font-size:28px; font-weight:800; color:#1A1A1A; letter-spacing:-0.03em;">' + hourStr + '</span>' +
              '<span style="color:#8C6207; font-size:22px; font-weight:bold;">:</span>' +
              '<span style="font-size:28px; font-weight:800; color:#1A1A1A; letter-spacing:-0.03em;">' + minStr + '</span>' +
              '<span style="font-size:12px; font-weight:700; color:#8C6207; margin-left:6px; text-transform:uppercase;">' + period + '</span>' +
            '</div>' +
            '<div style="display:flex; border:1px solid #C5A059; border-radius:8px; overflow:hidden; background:#FAF8F5; padding:2px;">' +
              '<button type="button" id="clock-set-am" style="padding:4px 10px; font-size:11px; font-weight:800; border-radius:6px; border:none; cursor:pointer; background:' + (period === 'AM' ? '#1A1A1A' : 'transparent') + '; color:' + (period === 'AM' ? '#FFF' : '#666') + ';">AM</button>' +
              '<button type="button" id="clock-set-pm" style="padding:4px 10px; font-size:11px; font-weight:800; border-radius:6px; border:none; cursor:pointer; background:' + (period === 'PM' ? '#1A1A1A' : 'transparent') + '; color:' + (period === 'PM' ? '#FFF' : '#666') + ';">PM</button>' +
            '</div>' +
          '</div>' +

          /* Quick Minute Preset Buttons */
          '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:11px;">' +
            '<span style="font-weight:700; color:#777; text-transform:uppercase; font-size:10px; letter-spacing:0.05em;">Quick Minutes:</span>' +
            '<div style="display:flex; gap:4px;">' +
              '<button type="button" class="quick-min-btn" data-qmin="0" style="padding:2px 7px; border-radius:6px; font-size:10px; font-weight:700; background:' + (minute === 0 ? '#C5A059' : '#FFF') + '; color:' + (minute === 0 ? '#1A1A1A' : '#444') + '; border:1px solid ' + (minute === 0 ? '#8C6207' : '#D1D5DB') + '; cursor:pointer;">:00</button>' +
              '<button type="button" class="quick-min-btn" data-qmin="15" style="padding:2px 7px; border-radius:6px; font-size:10px; font-weight:700; background:' + (minute === 15 ? '#C5A059' : '#FFF') + '; color:' + (minute === 15 ? '#1A1A1A' : '#444') + '; border:1px solid ' + (minute === 15 ? '#8C6207' : '#D1D5DB') + '; cursor:pointer;">:15</button>' +
              '<button type="button" class="quick-min-btn" data-qmin="30" style="padding:2px 7px; border-radius:6px; font-size:10px; font-weight:700; background:' + (minute === 30 ? '#C5A059' : '#FFF') + '; color:' + (minute === 30 ? '#1A1A1A' : '#444') + '; border:1px solid ' + (minute === 30 ? '#8C6207' : '#D1D5DB') + '; cursor:pointer;">:30</button>' +
              '<button type="button" class="quick-min-btn" data-qmin="45" style="padding:2px 7px; border-radius:6px; font-size:10px; font-weight:700; background:' + (minute === 45 ? '#C5A059' : '#FFF') + '; color:' + (minute === 45 ? '#1A1A1A' : '#444') + '; border:1px solid ' + (minute === 45 ? '#8C6207' : '#D1D5DB') + '; cursor:pointer;">:45</button>' +
            '</div>' +
          '</div>' +

          /* Dual Column Scroll Select Wheel (No Analog Needles or Spillover) */
          '<div style="background:#FFF; border:1px solid rgba(197,160,89,0.4); border-radius:12px; padding:10px 8px; margin-bottom:14px; box-shadow:inset 0 1px 4px rgba(0,0,0,0.04);">' +
            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">' +
              '<div style="display:flex; flex-direction:column;">' +
                '<span style="font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#8C6207; padding-bottom:6px; border-bottom:1px solid #F0ECE4; margin-bottom:4px;">HOUR (01–12)</span>' +
                '<div id="time-hour-scroll-col" data-lenis-prevent="true" style="height:160px; overflow-y:auto; padding-right:4px; overscroll-behavior:contain;">' +
                  hoursHtml +
                '</div>' +
              '</div>' +
              '<div style="display:flex; flex-direction:column; border-left:1px solid #E5E0D8; padding-left:8px;">' +
                '<span style="font-size:10px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#8C6207; padding-bottom:6px; border-bottom:1px solid #F0ECE4; margin-bottom:4px;">MINUTE (00–59)</span>' +
                '<div id="time-min-scroll-col" data-lenis-prevent="true" style="height:160px; overflow-y:auto; padding-right:4px; overscroll-behavior:contain;">' +
                  minutesHtml +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +

          /* Pinned Confirm Time Button at Bottom */
          '<div style="border-top:1px solid #E5E0D8; padding-top:10px;">' +
            '<button type="button" id="gold-clock-confirm-btn" style="background:#C5A059; color:#1A1A1A; border:none; border-radius:12px; padding:12px 18px; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; width:100%; cursor:pointer; box-shadow:0 4px 14px rgba(197,160,89,0.4); display:flex; align-items:center; justify-content:center; gap:6px;">' +
              '&#10003; CONFIRM TIME (' + hourStr + ':' + minStr + ' ' + period + ')' +
            '</button>' +
            '<button type="button" id="clock-cancel-btn" style="background:none; border:none; color:#777; font-size:11px; font-weight:700; margin-top:8px; cursor:pointer; padding:4px;">Cancel</button>' +
          '</div>' +
        '</div>';

      bindClockEvents();

      // Smooth scroll selected items into view inside columns
      setTimeout(function () {
        var hourCol = document.getElementById("time-hour-scroll-col");
        if (hourCol) {
          var selH = hourCol.querySelector('[data-hour="' + hour + '"]');
          if (selH && selH.scrollIntoView) selH.scrollIntoView({ block: "center", behavior: "smooth" });
        }
        var minCol = document.getElementById("time-min-scroll-col");
        if (minCol) {
          var selM = minCol.querySelector('[data-min="' + minute + '"]');
          if (selM && selM.scrollIntoView) selM.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 40);
    }

    function bindClockEvents() {
      var closeBtn = document.getElementById("clock-close-btn");
      if (closeBtn) closeBtn.onclick = function () { clockOverlay.remove(); };

      var cancelBtn = document.getElementById("clock-cancel-btn");
      if (cancelBtn) cancelBtn.onclick = function () { clockOverlay.remove(); };

      var amBtn = document.getElementById("clock-set-am");
      if (amBtn) amBtn.onclick = function () { period = "AM"; renderClockHtml(); };

      var pmBtn = document.getElementById("clock-set-pm");
      if (pmBtn) pmBtn.onclick = function () { period = "PM"; renderClockHtml(); };

      // Hour item click
      var hourButtons = clockOverlay.querySelectorAll(".hour-item-btn");
      hourButtons.forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var h = parseInt(btn.getAttribute("data-hour"), 10);
          if (!isNaN(h)) {
            hour = h;
            renderClockHtml();
          }
        };
      });

      // Minute item click
      var minButtons = clockOverlay.querySelectorAll(".min-item-btn");
      minButtons.forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var m = parseInt(btn.getAttribute("data-min"), 10);
          if (!isNaN(m)) {
            minute = m;
            renderClockHtml();
          }
        };
      });

      // Quick minute chips
      var quickChips = clockOverlay.querySelectorAll(".quick-min-btn");
      quickChips.forEach(function (btn) {
        btn.onclick = function (e) {
          e.stopPropagation();
          var qm = parseInt(btn.getAttribute("data-qmin"), 10);
          if (!isNaN(qm)) {
            minute = qm;
            renderClockHtml();
          }
        };
      });

      var confirmBtn = document.getElementById("gold-clock-confirm-btn");
      if (confirmBtn) {
        confirmBtn.onclick = function () {
          var finalHourStr = String(hour).padStart(2, "0");
          var finalMinStr = String(minute).padStart(2, "0");
          var finalTime = finalHourStr + ":" + finalMinStr + " " + period;

          if (targetInput) {
            targetInput.value = finalTime;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
            targetInput.dispatchEvent(new Event("change", { bubbles: true }));
          }
          clockOverlay.remove();
        };
      }
    }

    renderClockHtml();
    document.body.appendChild(clockOverlay);

    clockOverlay.onclick = function (e) {
      if (e.target === clockOverlay) clockOverlay.remove();
    };
  }

  // =========================================================================
  // 6. CUSTOM GOLD LUXURY DATE PICKER CALENDAR (WARM CREAM & METALLIC GOLD)
  // =========================================================================
  function openCustomGoldCalendarModal(targetInput) {
    var existingCal = document.getElementById("calendar-modal-overlay");
    if (existingCal) {
      existingCal.remove();
    }

    var now = new Date();
    var todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

    var currentVal = (targetInput && targetInput.value) ? targetInput.value.trim() : "";
    var viewYear = now.getFullYear();
    var viewMonth = now.getMonth();
    var selectedDateStr = todayStr;

    // Check if input value matches YYYY-MM-DD
    if (currentVal && /^\d{4}-\d{2}-\d{2}$/.test(currentVal)) {
      var parts = currentVal.split("-").map(Number);
      viewYear = parts[0];
      viewMonth = parts[1] - 1;
      selectedDateStr = currentVal;
    }

    var monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    var weekdayNames = ["S", "M", "T", "W", "T", "F", "S"];

    var calOverlay = document.createElement("div");
    calOverlay.id = "calendar-modal-overlay";
    calOverlay.className = "calendar-modal-overlay";
    calOverlay.setAttribute("data-lenis-prevent", "true");

    function renderCalHtml() {
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday, 6 = Saturday
      var prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

      // Weekday headers
      var weekdaysHtml = "";
      for (var w = 0; w < 7; w++) {
        var isWeekend = (w === 0 || w === 6);
        weekdaysHtml += '<div class="calendar-weekday-cell" style="font-family:\'Cormorant Garamond\', Georgia, serif; font-size:15px; font-weight:700; color:' + (isWeekend ? '#8C6207' : '#1A1A1A') + '; text-align:center; padding:4px 0;">' + weekdayNames[w] + '</div>';
      }

      // Days grid
      var daysHtml = "";

      // Prev month filler
      var prevMonthNum = viewMonth === 0 ? 12 : viewMonth;
      var prevYearNum = viewMonth === 0 ? viewYear - 1 : viewYear;

      for (var p = firstDay - 1; p >= 0; p--) {
        var pNum = prevMonthDays - p;
        var pDateStr = prevYearNum + "-" + String(prevMonthNum).padStart(2, "0") + "-" + String(pNum).padStart(2, "0");
        var isPPast = (pDateStr < todayStr);
        var isPSelected = (pDateStr === selectedDateStr);

        var pBtnClass = "calendar-day-btn is-adjacent is-overflow";
        var pBtnStyle = "width:38px; height:38px; border-radius:50%; font-family:Plus Jakarta Sans, sans-serif; font-size:13px; display:flex; align-items:center; justify-content:center; margin:auto; transition:all 0.18s ease; box-sizing:border-box;";

        if (isPSelected) {
          pBtnClass += " is-selected";
          pBtnStyle += " background:#C5A059; color:#FFF; font-weight:700; border:1.5px solid #B8860B; box-shadow:0 4px 12px rgba(197,160,89,0.45); cursor:pointer; text-decoration:none;";
        } else if (isPPast) {
          pBtnClass += " is-past is-disabled";
          pBtnStyle += " background:transparent; color:#C8C2B8; font-weight:500; border:1px solid transparent; cursor:not-allowed; opacity:0.35; text-decoration:line-through;";
        } else {
          pBtnStyle += " background:transparent; color:#A39E93; font-weight:500; border:1.5px solid transparent; cursor:pointer; opacity:0.45; text-decoration:none;";
        }

        daysHtml += '<div style="display:flex; align-items:center; justify-content:center;">' +
                      '<button type="button" class="' + pBtnClass + '" data-cal-date="' + pDateStr + '" data-cal-target-year="' + prevYearNum + '" data-cal-target-month="' + (prevMonthNum - 1) + '" ' + (isPPast ? 'disabled' : '') + ' style="' + pBtnStyle + '">' + pNum + '</button>' +
                    '</div>';
      }

      // Current month days
      for (var d = 1; d <= daysInMonth; d++) {
        var dStr = viewYear + "-" + String(viewMonth + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
        var isSelected = (dStr === selectedDateStr);
        var isToday = (dStr === todayStr);
        var isPast = (dStr < todayStr);

        var btnClass = "calendar-day-btn";
        var btnStyle = "width:38px; height:38px; border-radius:50%; font-family:Plus Jakarta Sans, sans-serif; font-size:13px; display:flex; align-items:center; justify-content:center; margin:auto; transition:all 0.18s ease; box-sizing:border-box;";

        if (isSelected) {
          btnClass += " is-selected";
          btnStyle += " background:#C5A059; color:#FFF; font-weight:700; border:1.5px solid #B8860B; box-shadow:0 4px 12px rgba(197,160,89,0.45); cursor:pointer; text-decoration:none;";
        } else if (isPast) {
          btnClass += " is-past is-disabled";
          btnStyle += " background:transparent; color:#C8C2B8; font-weight:500; border:1px solid transparent; cursor:not-allowed; opacity:0.50; text-decoration:line-through;";
        } else if (isToday) {
          btnClass += " is-today";
          btnStyle += " background:#FAF6ED; color:#1A1A1A; font-weight:700; border:1.5px solid #C5A059; cursor:pointer; text-decoration:none;";
        } else {
          btnStyle += " background:transparent; color:#1A1A1A; font-weight:600; border:1.5px solid transparent; cursor:pointer; text-decoration:none;";
        }

        daysHtml += '<div style="display:flex; align-items:center; justify-content:center;">' +
                      '<button type="button" class="' + btnClass + '" data-cal-date="' + dStr + '" ' + (isPast ? 'disabled' : '') + ' style="' + btnStyle + '">' + d + '</button>' +
                    '</div>';
      }

      // Next month filler
      var nextMonthNum = viewMonth === 11 ? 1 : viewMonth + 2;
      var nextYearNum = viewMonth === 11 ? viewYear + 1 : viewYear;
      var totalCells = firstDay + daysInMonth;
      var remaining = (7 - (totalCells % 7)) % 7;
      for (var n = 1; n <= remaining; n++) {
        var nDateStr = nextYearNum + "-" + String(nextMonthNum).padStart(2, "0") + "-" + String(n).padStart(2, "0");
        var isNPast = (nDateStr < todayStr);
        var isNSelected = (nDateStr === selectedDateStr);

        var nBtnClass = "calendar-day-btn is-adjacent is-overflow";
        var nBtnStyle = "width:38px; height:38px; border-radius:50%; font-family:Plus Jakarta Sans, sans-serif; font-size:13px; display:flex; align-items:center; justify-content:center; margin:auto; transition:all 0.18s ease; box-sizing:border-box;";

        if (isNSelected) {
          nBtnClass += " is-selected";
          nBtnStyle += " background:#C5A059; color:#FFF; font-weight:700; border:1.5px solid #B8860B; box-shadow:0 4px 12px rgba(197,160,89,0.45); cursor:pointer; text-decoration:none;";
        } else if (isNPast) {
          nBtnClass += " is-past is-disabled";
          nBtnStyle += " background:transparent; color:#C8C2B8; font-weight:500; border:1px solid transparent; cursor:not-allowed; opacity:0.35; text-decoration:line-through;";
        } else {
          // Future adjacent month day (e.g. Oct 1, 2, 3):
          // NO strikethrough line! Clean subtle muted opacity so clients clearly recognize next month, 100% available & clickable
          nBtnStyle += " background:transparent; color:#A39E93; font-weight:500; border:1.5px solid transparent; cursor:pointer; opacity:0.45; text-decoration:none;";
        }

        daysHtml += '<div style="display:flex; align-items:center; justify-content:center;">' +
                      '<button type="button" class="' + nBtnClass + '" data-cal-date="' + nDateStr + '" data-cal-target-year="' + nextYearNum + '" data-cal-target-month="' + (nextMonthNum - 1) + '" ' + (isNPast ? 'disabled' : '') + ' style="' + nBtnStyle + '">' + n + '</button>' +
                    '</div>';
      }

      // Format preview for display banner
      var previewText = selectedDateStr;
      try {
        var sParts = selectedDateStr.split("-").map(Number);
        var sObj = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        previewText = sObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      } catch (e) {}

      calOverlay.innerHTML =
        '<div id="calendar-modal-card" class="calendar-modal-card" data-lenis-prevent="true" style="background:#FAF8F5; color:#1A1A1A; border-radius:20px; border:1px solid #C5A059; box-shadow:0 12px 30px rgba(0,0,0,0.12), 0 30px 70px rgba(0,0,0,0.5); max-width:380px; width:100%; padding:22px 20px 20px 20px; font-family:Plus Jakarta Sans, sans-serif; position:relative; overflow:hidden; box-sizing:border-box;">' +
          '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E5E0E8; padding-bottom:12px; margin-bottom:12px;">' +
            '<div>' +
              '<h3 style="font-family:Cormorant Garamond, Georgia, serif; font-size:20px; font-weight:700; color:#1A1A1A; margin:0; text-transform:uppercase;">Select Shoot Date</h3>' +
            '</div>' +
            '<button type="button" id="calendar-close-x-btn" style="width:30px; height:30px; border-radius:50%; background:#FFF; border:1px solid #D1D5DB; color:#1A1A1A; font-weight:bold; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>' +
          '</div>' +

          /* Chosen Date Preview Banner */
          '<div style="background:#FFF; border:1px solid #E5E0D8; border-radius:12px; padding:10px 14px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
            '<div>' +
              '<span style="font-size:10px; font-weight:700; color:#777; text-transform:uppercase; letter-spacing:0.05em; display:block;">Chosen Date</span>' +
              '<span style="font-family:Cormorant Garamond, Georgia, serif; font-size:17px; font-weight:700; color:#1A1A1A; display:block;">' + previewText + '</span>' +
            '</div>' +
            '<button type="button" id="calendar-jump-today-btn" style="font-size:11px; font-weight:700; color:#8C6207; background:#FAF6ED; border:1px solid rgba(197,160,89,0.4); padding:4px 10px; border-radius:6px; cursor:pointer;">Today</button>' +
          '</div>' +

          /* Month/Year Navigation */
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:0 4px;">' +
            '<button type="button" id="cal-prev-month-btn" style="width:32px; height:32px; border-radius:8px; background:#FFF; border:1px solid #D1D5DB; color:#1A1A1A; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">&#9664;</button>' +
            '<div style="font-family:Cormorant Garamond, Georgia, serif; font-size:20px; font-weight:700; color:#1A1A1A; letter-spacing:0.02em;">' +
              monthNames[viewMonth] + ' ' + viewYear +
            '</div>' +
            '<button type="button" id="cal-next-month-btn" style="width:32px; height:32px; border-radius:8px; background:#FFF; border:1px solid #D1D5DB; color:#1A1A1A; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">&#9654;</button>' +
          '</div>' +

          /* 7-Column Calendar Grid with Guaranteed Saturday Column Padding */
          '<div class="calendar-grid-wrapper" style="background:rgba(255,255,255,0.7); border:1px solid #E5E0D8; border-radius:14px; padding:10px 12px; margin-bottom:14px; box-sizing:border-box;">' +
            '<div class="calendar-weekdays-row" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; padding:0 2px; margin-bottom:6px; text-align:center;">' +
              weekdaysHtml +
            '</div>' +
            '<div class="calendar-days-grid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; padding:0 2px; box-sizing:border-box;">' +
              daysHtml +
            '</div>' +
          '</div>' +

          /* Confirm Date Action Button Pinned at Bottom */
          '<div style="display:flex; gap:10px; border-top:1px solid #E5E0D8; padding-top:12px;">' +
            '<button type="button" id="calendar-cancel-btn" style="flex:1; background:#FFF; border:1px solid #D1D5DB; border-radius:12px; padding:12px; font-size:12px; font-weight:700; text-transform:uppercase; color:#1A1A1A; cursor:pointer;">Cancel</button>' +
            '<button type="button" id="gold-calendar-confirm-btn" style="flex:2; background:#C5A059; color:#1A1A1A; border:none; border-radius:12px; padding:12px 18px; font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; cursor:pointer; box-shadow:0 4px 14px rgba(197,160,89,0.4);">&#10003; CONFIRM DATE</button>' +
          '</div>' +
        '</div>';

      // Attach button event listeners
      var closeX = document.getElementById("calendar-close-x-btn");
      if (closeX) closeX.onclick = function () { calOverlay.remove(); };

      var cancelBtn = document.getElementById("calendar-cancel-btn");
      if (cancelBtn) cancelBtn.onclick = function () { calOverlay.remove(); };

      var todayBtn = document.getElementById("calendar-jump-today-btn");
      if (todayBtn) {
        todayBtn.onclick = function () {
          viewYear = now.getFullYear();
          viewMonth = now.getMonth();
          selectedDateStr = todayStr;
          renderCalHtml();
        };
      }

      var prevBtn = document.getElementById("cal-prev-month-btn");
      if (prevBtn) {
        prevBtn.onclick = function () {
          if (viewMonth === 0) {
            viewMonth = 11;
            viewYear--;
          } else {
            viewMonth--;
          }
          renderCalHtml();
        };
      }

      var nextBtn = document.getElementById("cal-next-month-btn");
      if (nextBtn) {
        nextBtn.onclick = function () {
          if (viewMonth === 11) {
            viewMonth = 0;
            viewYear++;
          } else {
            viewMonth++;
          }
          renderCalHtml();
        };
      }

      // Day buttons
      var dayButtons = calOverlay.querySelectorAll(".calendar-day-btn[data-cal-date]");
      dayButtons.forEach(function (btn) {
        btn.onclick = function () {
          if (btn.disabled || btn.classList.contains("is-disabled") || btn.classList.contains("is-past")) {
            return;
          }
          var clickedDate = btn.getAttribute("data-cal-date");
          var targetY = btn.getAttribute("data-cal-target-year");
          var targetM = btn.getAttribute("data-cal-target-month");
          if (clickedDate) {
            selectedDateStr = clickedDate;
            if (targetY !== null && targetM !== null) {
              viewYear = parseInt(targetY, 10);
              viewMonth = parseInt(targetM, 10);
            }
            renderCalHtml();
          }
        };
      });

      // Confirm button
      var confirmBtn = document.getElementById("gold-calendar-confirm-btn");
      if (confirmBtn) {
        confirmBtn.onclick = function () {
          if (targetInput) {
            targetInput.value = selectedDateStr;
            targetInput.dispatchEvent(new Event("input", { bubbles: true }));
            targetInput.dispatchEvent(new Event("change", { bubbles: true }));

            // Also synchronize any raw value or display text input
            var rawInput = document.getElementById("book-date-raw-value");
            if (rawInput) rawInput.value = selectedDateStr;
          }
          calOverlay.remove();
        };
      }
    }

    renderCalHtml();
    document.body.appendChild(calOverlay);

    calOverlay.onclick = function (e) {
      if (e.target === calOverlay) calOverlay.remove();
    };
  }

  // Intercept clicks on start time or end time inputs
  document.addEventListener("click", function (e) {
    // If React application is running in #root, React's GoldClockPickerModal handles time clicks
    var root = document.getElementById("root");
    if (root && root.children.length > 0) {
      return;
    }

    var target = e.target;
    var timeInput = target.closest("#book-start-time") ||
                    target.closest("#book-end-time") ||
                    target.closest("input[placeholder*='09:30 AM']") ||
                    target.closest("input[placeholder*='11:30 AM']");

    if (timeInput) {
      var reactClockModal = document.querySelector(".clock-modal-overlay");
      if (!reactClockModal) {
        e.preventDefault();
        var title = timeInput.id.includes("start") ? "Preferred Start Time" : "Preferred End Time";
        openCustomGoldClockModal(timeInput, title);
      }
    }
  });

  // Intercept clicks on Shoot Date inputs to open custom gold calendar
  document.addEventListener("click", function (e) {
    var root = document.getElementById("root");
    // If React application is running and handles date picker modal, skip fallback
    if (root && root.children.length > 0) {
      return;
    }

    var target = e.target;
    var dateInput = target.closest("#book-date-input") ||
                    target.closest("input[type='date']") ||
                    target.closest(".custom-calendar-trigger");

    if (dateInput) {
      var reactCal = document.getElementById("calendar-modal-overlay");
      if (!reactCal) {
        e.preventDefault();
        openCustomGoldCalendarModal(dateInput);
      }
    }
  });

  // Global submit listener for Web3Forms email delivery & WhatsApp routing
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form || form.tagName !== "FORM") return;

    var action = form.getAttribute("action") || "";
    if (form.id === "enquiry-form" || form.id === "reservation-form" || action.indexOf("web3forms") !== -1) {
      e.preventDefault();
      e.stopPropagation();

      var formData = new FormData(form);
      var clientName = formData.get("clientName") || formData.get("name") || formData.get("fullName") || "";
      var clientEmail = formData.get("email") || formData.get("clientEmail") || "";
      var clientPhone = formData.get("phone") || formData.get("clientPhone") || "";
      var packageName = formData.get("packageName") || formData.get("package") || "Single Photo Session";
      var addOns = formData.get("addOns") || "Standard Inclusions";
      var shootDate = formData.get("shootDate") || formData.get("date") || "";
      var timeWindow = formData.get("timeWindow") || "09:30 AM – 11:30 AM";
      var notes = formData.get("notes") || formData.get("message") || formData.get("shootVision") || "";
      var total = formData.get("total") || "";

      // Fallbacks if input fields had no FormData values
      if (!clientName) {
        var nEl = form.querySelector("[name='clientName'], [name='name'], #book-client-name, #enquiry-modal-fullname, #enquiry-name, #reservation-client-name");
        if (nEl) clientName = nEl.value;
      }
      if (!clientEmail) {
        var eEl = form.querySelector("[name='email'], [name='clientEmail'], #book-client-email, #enquiry-modal-email, #enquiry-email, #reservation-email");
        if (eEl) clientEmail = eEl.value;
      }
      if (!clientPhone) {
        var pEl = form.querySelector("[name='phone'], [name='clientPhone'], #book-client-phone, #enquiry-modal-phone, #enquiry-phone, #reservation-phone");
        if (pEl) clientPhone = pEl.value;
      }
      if (!notes) {
        var mEl = form.querySelector("[name='notes'], [name='message'], [name='shootVision'], #book-shoot-vision, #enquiry-modal-message, #enquiry-message, #reservation-notes, textarea");
        if (mEl) notes = mEl.value;
      }

      // Check required fields (Name, Email, Message/Notes)
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var hasValidName = clientName && clientName.trim().length > 0;
      var hasValidEmail = clientEmail && emailRegex.test(clientEmail.trim());
      var hasValidNotes = notes && notes.trim().length > 0;

      if (!hasValidName || !hasValidEmail || !hasValidNotes) {
        // Trigger subtle shake effect on form / modal card
        var cardToShake = form.closest("#booking-modal, #enquiry-modal-card, .modal-card, .inquiry-modal-card") || form;
        if (cardToShake) {
          cardToShake.classList.remove("shake-error");
          // Force layout reflow
          void cardToShake.offsetWidth;
          cardToShake.classList.add("shake-error");
          setTimeout(function () {
            cardToShake.classList.remove("shake-error");
          }, 500);
        }

        // Highlight missing inputs
        var nInput = form.querySelector("[name='clientName'], [name='name'], #enquiry-name, #enquiry-modal-fullname, #book-client-name");
        var eInput = form.querySelector("[name='email'], [name='clientEmail'], #enquiry-email, #enquiry-modal-email, #book-client-email");
        var mInput = form.querySelector("[name='notes'], [name='message'], #enquiry-message, #enquiry-modal-notes, #book-shoot-vision");

        if (nInput) {
          if (!hasValidName) nInput.classList.add("input-error-highlight");
          else nInput.classList.remove("input-error-highlight");
        }
        if (eInput) {
          if (!hasValidEmail) eInput.classList.add("input-error-highlight");
          else eInput.classList.remove("input-error-highlight");
        }
        if (mInput) {
          if (!hasValidNotes) mInput.classList.add("input-error-highlight");
          else mInput.classList.remove("input-error-highlight");
        }

        // Play haptic feedback if available
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try { navigator.vibrate(40); } catch(err) {}
        }

        return;
      }

      var submissionData = {
        clientName: clientName || "Valued Client",
        clientEmail: clientEmail,
        clientPhone: clientPhone,
        packageName: packageName,
        addOns: addOns,
        date: shootDate,
        shootDate: shootDate,
        timeWindow: timeWindow,
        notes: notes,
        message: notes,
        total: total
      };

      // 1. Post asynchronously to Web3Forms
      submitToWeb3Forms(submissionData);

      // 2. Open In-App Confirmation Popup
      showInAppConfirmationPopup(submissionData);

      // Hide static enquiry modal if active
      var enqModal = document.getElementById("enquiry-modal");
      if (enqModal) {
        enqModal.classList.add("hidden");
        enqModal.style.display = "none";
      }

      // 3. Reset form inputs
      try {
        form.reset();
      } catch (err) {}
    }
  }, true);

  // Universal single-click guarantee for Top Navbar and all "INQUIRY", "BOOK", or "RESERVE" CTA buttons
  document.addEventListener("click", function (e) {
    var target = e.target;
    if (!target) return;

    var btn = target.closest(
      "#nav-book-header-btn, #mobile-thumb-inquiry-btn, .nav-inquiry-btn, .open-enquiry-btn, .open-reserve-btn, #hero-book-session-btn, button[data-cursor='book'], button[data-action='open-enquiry'], a[href='#enquiry-modal']"
    );

    if (!btn && target.tagName === "BUTTON" && target.textContent) {
      var txt = target.textContent.toUpperCase();
      if (txt.includes("BOOK") || txt.includes("RESERVE") || txt.includes("INQUIRY") || txt.includes("INQUIRE")) {
        btn = target;
      }
    }

    if (btn) {
      var isEnquiry = btn.id === "nav-book-header-btn" ||
                      btn.id === "mobile-thumb-inquiry-btn" ||
                      btn.classList.contains("nav-inquiry-btn") ||
                      btn.classList.contains("open-enquiry-btn") ||
                      (btn.textContent && (btn.textContent.toUpperCase().includes("INQUIRY") || btn.textContent.toUpperCase().includes("INQUIRE")));

      if (isEnquiry) {
        if (typeof window.openEnquiryModal === "function") {
          e.preventDefault();
          window.openEnquiryModal();
        } else {
          var enqModal = document.getElementById("enquiry-modal");
          if (enqModal) {
            e.preventDefault();
            enqModal.classList.remove("hidden");
            enqModal.style.display = "flex";
            enqModal.setAttribute("aria-hidden", "false");
          }
        }
      } else {
        // Book / Reserve buttons: smooth scroll to Section C Direct Reservation
        if (typeof window.scrollToReservation === "function") {
          e.preventDefault();
          window.scrollToReservation();
        }
      }
    }

    // Close button for static enquiry modal
    var closeEnqBtn = target.closest(".close-enquiry-modal-btn");
    if (closeEnqBtn) {
      e.preventDefault();
      var enqModalToClose = document.getElementById("enquiry-modal");
      if (enqModalToClose) {
        enqModalToClose.classList.add("hidden");
        enqModalToClose.style.display = "none";
        enqModalToClose.setAttribute("aria-hidden", "true");
      }
    }
  }, true);

  // Intercept any click on "CONFIRM DATE & PROCEED"
  document.addEventListener("click", function (e) {
    var target = e.target;
    var btn = target.closest("#book-section-proceed-btn") ||
              target.closest("button[data-action='confirm-date']") ||
              (target.tagName === "BUTTON" && target.textContent && target.textContent.includes("CONFIRM DATE & PROCEED"));

    if (btn) {
      // 1. PREVENT PAGE REFRESH OR EXTERNAL REDIRECTS
      e.preventDefault();
      e.stopPropagation();

      // Collect form values from Section C
      var dateInput = document.querySelector("#book-date-input, input[type='date']");
      var startTimeInput = document.querySelector("#book-start-time, input[placeholder*='Start Time']");
      var endTimeInput = document.querySelector("#book-end-time, input[placeholder*='End Time']");
      var visionInput = document.querySelector("#book-shoot-vision, textarea[placeholder*='description']");
      var clientNameInput = document.querySelector("#book-client-name");
      var clientEmailInput = document.querySelector("#book-client-email");
      var clientPhoneInput = document.querySelector("#book-client-phone");

      var dateVal = dateInput ? dateInput.value : "";
      var startTimeVal = startTimeInput ? startTimeInput.value : "09:30 AM";
      var endTimeVal = endTimeInput ? endTimeInput.value : "11:30 AM";
      var visionVal = visionInput ? visionInput.value : "";
      var clientNameVal = clientNameInput ? clientNameInput.value : "Valued Client";
      var clientEmailVal = clientEmailInput ? clientEmailInput.value : "";
      var clientPhoneVal = clientPhoneInput ? clientPhoneInput.value : "";

      // Check selected package
      var pkgName = "Single Photo Session";
      var total = "50";
      var btnText = btn.textContent || "";
      var match = btnText.match(/\$(\d+)\s*CAD/i);
      if (match && match[1]) {
        total = match[1];
      }

      // Check add-ons
      var addOns = [];
      var checkboxes = document.querySelectorAll("#direct-calendar-reservation input[type='checkbox']");
      checkboxes.forEach(function (cb) {
        if (cb.checked) {
          var label = cb.closest("label");
          if (label) {
            var text = label.innerText.replace(/\n/g, " ").trim();
            if (text.includes("Secondary")) addOns.push("Secondary Photographer (+$40 CAD)");
            if (text.includes("Drone")) addOns.push("4K Drone Coverage (+$35 CAD)");
          }
        }
      });

      var reservationPayload = {
        date: dateVal,
        shootDate: dateVal,
        timeWindow: startTimeVal + " – " + endTimeVal,
        packageName: pkgName,
        addOns: addOns.length > 0 ? addOns.join(", ") : "Standard Inclusions",
        total: total,
        clientName: clientNameVal,
        clientEmail: clientEmailVal,
        clientPhone: clientPhoneVal,
        notes: visionVal,
        shootVision: visionVal
      };

      // 1. Post asynchronously to Web3Forms
      submitToWeb3Forms(reservationPayload);

      // 2. Render In-App Confirmation Popup
      showInAppConfirmationPopup(reservationPayload);

      // 3. Reset inputs to prevent duplicate sends
      if (visionInput) visionInput.value = "";
      if (clientNameInput) clientNameInput.value = "";
      if (clientEmailInput) clientEmailInput.value = "";
      if (clientPhoneInput) clientPhoneInput.value = "";
      var resForm = document.getElementById("reservation-form");
      if (resForm) {
        try { resForm.reset(); } catch (err) {}
      }
    }
  }, true);

  // Close modals on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var confOverlay = document.getElementById("reservation-confirmation-overlay");
      if (confOverlay) confOverlay.remove();

      var clockOverlay = document.getElementById("clock-modal-overlay");
      if (clockOverlay) clockOverlay.remove();

      var calendarOverlay = document.getElementById("calendar-modal-overlay");
      if (calendarOverlay) calendarOverlay.remove();
    }
  });

  // =========================================================================
  // 6. IMAGE PERFORMANCE OPTIMIZATION & SMOOTH SKELETON LOADERS
  // =========================================================================
  var CRITICAL_HERO_CAROUSEL_IMAGES = [
    "/images/golden-grace-2.jpg",
    "/images/golden-grace-1.jpg",
    "/images/golden-grace-3.jpg",
    "/images/portrait.png",
    "/images/emerald-harmony-2.jpg",
    "/images/still-vision-2.jpg",
    "/images/misty-pine-2.jpg"
  ];

  // 1. High-priority preloading of critical hero & top carousel images
  function preloadCriticalImages() {
    CRITICAL_HERO_CAROUSEL_IMAGES.forEach(function (src) {
      var preloadImg = new Image();
      preloadImg.decoding = "async";
      preloadImg.src = src;
    });
  }

  // 2. Wire up image lazy loading, decoding async, and smooth skeleton fade-in
  function setupImageLoadingOptimization(img) {
    if (!img || img.dataset.skeletonOptimized === "true") return;
    img.dataset.skeletonOptimized = "true";

    var isCritical = CRITICAL_HERO_CAROUSEL_IMAGES.some(function (src) {
      return img.src && img.src.indexOf(src) !== -1;
    });

    // Ensure lazy loading and async decoding
    if (!img.hasAttribute("loading")) {
      img.setAttribute("loading", isCritical ? "eager" : "lazy");
    }
    if (!img.hasAttribute("decoding")) {
      img.setAttribute("decoding", "async");
    }
    if (isCritical && !img.hasAttribute("fetchpriority")) {
      img.setAttribute("fetchpriority", "high");
    }

    // Ensure parent container has layout shift prevention
    var container = img.parentElement;
    if (container) {
      if (!container.style.aspectRatio && !container.classList.contains("aspect-[4/5]") && !container.classList.contains("aspect-square") && !container.classList.contains("aspect-[16/10]")) {
        // Set default aspect-ratio placeholder if container is an image card
        if (container.classList.contains("relative") || container.classList.contains("overflow-hidden")) {
          container.style.aspectRatio = "4 / 5";
        }
      }
      if (!container.style.backgroundColor && !container.className.includes("bg-")) {
        container.style.backgroundColor = "#FAF8F5";
      }

      // Check if skeleton placeholder already exists
      var existingSkeleton = container.querySelector(".cream-gold-skeleton-loader");
      if (!existingSkeleton && !img.complete) {
        var skeleton = document.createElement("div");
        skeleton.className = "cream-gold-skeleton-loader image-skeleton-loader";
        skeleton.style.position = "absolute";
        skeleton.style.inset = "0";
        skeleton.style.zIndex = "5";
        skeleton.style.background = "linear-gradient(90deg, #FAF8F5 25%, #FAF0DF 50%, #FAF8F5 75%)";
        skeleton.style.backgroundSize = "200% 100%";
        skeleton.style.animation = "shimmer 1.5s infinite linear";
        skeleton.style.transition = "opacity 0.4s ease-out";
        skeleton.style.pointerEvents = "none";
        container.appendChild(skeleton);
      }
    }

    // Setup smooth 0.4s fade-in transition
    img.style.transition = "opacity 0.4s ease-in-out";

    function onImageLoaded() {
      img.style.opacity = "1";
      img.setAttribute("data-loaded", "true");
      img.classList.add("is-loaded");
      if (container) {
        var skel = container.querySelector(".cream-gold-skeleton-loader");
        if (skel) {
          skel.style.opacity = "0";
          setTimeout(function () {
            if (skel && skel.parentNode) skel.parentNode.removeChild(skel);
          }, 400);
        }
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      onImageLoaded();
    } else {
      img.style.opacity = "0";
      img.addEventListener("load", onImageLoaded);
      img.addEventListener("error", function () {
        // Remove skeleton even on error so UI never stays stuck
        img.style.opacity = "1";
        if (container) {
          var skel = container.querySelector(".cream-gold-skeleton-loader");
          if (skel) skel.remove();
        }
      });
    }
  }

  // 3. Scan DOM and observe dynamic additions (e.g., carousel slides, gallery filtering)
  function initImagePerformanceSuite() {
    preloadCriticalImages();

    // Optimize existing images in DOM
    var existingImages = document.querySelectorAll("img");
    existingImages.forEach(setupImageLoadingOptimization);

    // MutationObserver to automatically optimize any newly mounted images
    if (window.MutationObserver) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) { // Element node
              if (node.tagName === "IMG") {
                setupImageLoadingOptimization(node);
              } else if (node.querySelectorAll) {
                var nestedImgs = node.querySelectorAll("img");
                nestedImgs.forEach(setupImageLoadingOptimization);
              }
            }
          });
        });
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Start image optimizations as early as DOM is available
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initImagePerformanceSuite);
  } else {
    initImagePerformanceSuite();
  }

  console.log("Sanjay Lightworks App logic initialized: Image Performance Suite, Skeleton Loaders, Custom Gold Clock Picker Modal, and Form Redirect Prevention active.");
})();
