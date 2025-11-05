/* ---------- Basic Config ---------- */
const CONFIG = {
  inspectorName: "Matthew Urbanski",
  inspectorEmail: "matthew.urbanski@aquaguard.net",
  inspectorPhone: "470-568-1681",

  // Replace with your live Wix Bookings or Calendly URL:
  calendarUrl: "https://your-wix-bookings-or-calendly-link.com/schedule",

  // Optional third-party form endpoint (e.g., Formspree/Web3Forms) – leave blank to disable
  formEndpoint: ""
};

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);

function getMultiSelectValues(selectEl){
  return [...selectEl.selectedOptions].map(o => o.value);
}

/* ---------- Lead Score (simple) ---------- */
function scoreLead({ urgency, issues=[] }){
  let score = 0;
  if (urgency === "Immediate concern") score += 3;
  else if (urgency === "Within 30 days") score += 2;

  const highValue = ["Foundation Cracks","Wall Bowing/Leaning","Uneven/Bouncy Floors","Basement Water Intrusion","Concrete Settling"];
  issues.forEach(i => { if (highValue.includes(i)) score += 1; });

  return score; // 0 – 10 rough scale
}

/* ---------- Populate Calendar UI ---------- */
function showCalendar(){
  const frame = $("#calendarFrame");
  const link  = $("#calendarLink");

  frame.src = CONFIG.calendarUrl;
  link.href  = CONFIG.calendarUrl;
  $("#calendarBlock").classList.remove("hidden");
}

/* ---------- Form Handling ---------- */
$("#leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name:  $("#name").value.trim(),
    phone: $("#phone").value.trim(),
    email: $("#email").value.trim(),
    zip:   $("#zip").value.trim(),
    role:  $("#role").value,
    urgency: $("#urgency").value,
    issues: getMultiSelectValues($("#issues")),
    utm: Object.fromEntries(new URLSearchParams(location.search)),
    ts: new Date().toISOString(),
    to: {
      name: CONFIG.inspectorName,
      email: CONFIG.inspectorEmail,
      phone: CONFIG.inspectorPhone
    }
  };

  payload.leadScore = scoreLead(payload);
  localStorage.setItem("aquaguard_lead", JSON.stringify(payload));

  const msg = $("#formMsg");
  msg.textContent = "Thanks! Loading calendar…";
  showCalendar();

  // Optional: send to a static form endpoint (Formspree/Web3Forms) if configured
  if (CONFIG.formEndpoint) {
    try {
      await fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      msg.textContent = "Saved. Choose a time that works for you.";
    } catch {
      msg.textContent = "Calendar loaded. (Note: couldn’t reach the form endpoint.)";
    }
  }
});

/* ---------- Utilities ---------- */
$("#exportBtn").addEventListener("click", () => {
  const data = localStorage.getItem("aquaguard_lead") || "{}";
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lead.json";
  a.click();
  URL.revokeObjectURL(url);
});

$("#copyLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.calendarUrl);
    alert("Calendar link copied!");
  } catch {
    prompt("Copy this link:", CONFIG.calendarUrl);
  }
});