// --- ANY GPA CORE: NEXT-GEN SPA ENGINE ---
const apiBase = "http://localhost/GpaCal/nima-core-calculator/src/api.php";
const container = document.getElementById("modules-container");
const sysSelector = document.getElementById("system-selector");
const gpaDisplay = document.getElementById("final-gpa");
const totalCreditsDisplay = document.getElementById("total-credits-display");
const awardStatusDisplay = document.getElementById("award-status");
const printedSystemName = document.getElementById("printed-system-name");
const dynamicRulesPanel = document.getElementById("dynamic-rules-panel");
const loader = document.getElementById("global-loader");
const gpaSvgFill = document.getElementById("gpa-svg-fill");

let currentGradeRules = {};
let tempGradeRules = null;
let tempSystemName = "";
let moduleCount = 0;
let currentStrategy = "STANDARD";

// --- 1. MICRO-INTERACTIONS & PHYSICS ---
function showToast(message, type = "info") {
  const toastBox = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = message;
  toastBox.appendChild(toast);
  gsap.to(toast, { x: 0, duration: 0.5, ease: "back.out(1.2)" });
  setTimeout(() => {
    gsap.to(toast, {
      x: 400,
      opacity: 0,
      duration: 0.4,
      onComplete: () => toast.remove(),
    });
  }, 3500);
}

document.addEventListener("mousemove", (e) => {
  gsap.to("#cursor-glow", {
    x: e.clientX,
    y: e.clientY,
    duration: 0.4,
    ease: "power2.out",
  });
  document.querySelectorAll(".spotlight-card").forEach((card) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  });
});

function apply3DTilt() {
  document.querySelectorAll(".tilt-effect").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      gsap.to(el, {
        rotationY: x * 8,
        rotationX: -y * 8,
        ease: "power1.out",
        duration: 0.3,
        transformPerspective: 1000,
      });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.4)",
      });
    });
  });
}

function applyMagneticHover() {
  document.querySelectorAll(".magnetic-btn, .remove-btn").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - rect.left - rect.width / 2) * 0.4,
        y: (e.clientY - rect.top - rect.height / 2) * 0.4,
        duration: 0.3,
        ease: "power2.out",
      });
    });
    btn.addEventListener("mouseleave", () =>
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" }),
    );
  });
}

// --- SPA ROUTER ENGINE ---
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("data-target");

    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    this.classList.add("active");

    document.querySelectorAll(".tab-section").forEach((sec) => {
      sec.classList.add("hidden");
      sec.classList.remove("active-section");
    });

    const targetSec = document.getElementById(targetId);
    targetSec.classList.remove("hidden");
    targetSec.classList.add("active-section");

    // Dynamic Section Stagger Reveal
    gsap.fromTo(
      targetSec.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
    );
    window.scrollTo(0, 0);
  });
});

// --- 2. CORE ARCHITECTURE ---
async function initSystem() {
  try {
    const res = await fetch(`${apiBase}?action=get_systems`);
    const systems = await res.json();

    sysSelector.innerHTML = tempGradeRules
      ? `<option value="temp" data-name="${tempSystemName}">${tempSystemName} [Session Only]</option>`
      : "";
    systems.forEach((sys) => {
      const opt = document.createElement("option");
      opt.value = sys.system_id;
      opt.dataset.name = sys.system_name;
      opt.textContent = `${sys.system_name} (${sys.country})`;
      sysSelector.appendChild(opt);
    });

    if (!tempGradeRules && systems.length > 0)
      loadRulesForSystem(systems[0].system_id, systems[0].system_name);
    else if (tempGradeRules) sysSelector.value = "temp";

    loader.classList.add("hidden");
    gsap.from(".sys-header, .editor-panel, .report-wrapper", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      stagger: 0.15,
      ease: "power3.out",
    });
    showToast("System Online. Engine Ready.", "success");
    apply3DTilt();
  } catch (err) {
    sysSelector.innerHTML = "<option>Database Offline.</option>";
    loader.classList.add("hidden");
    showToast("Database Connection Failed.", "error");
  }
  applyMagneticHover();
}

sysSelector.addEventListener("change", (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  if (e.target.value === "temp") {
    currentGradeRules = tempGradeRules;
    printedSystemName.innerText = tempSystemName + " (Unverified Session)";
    currentStrategy = "STANDARD";
    dynamicRulesPanel.innerHTML = "";
    dynamicRulesPanel.classList.add("hidden");
    updateAllDropdowns();
    calculateGPA();
    showToast("Local Session Strategy Active.", "info");
  } else {
    loadRulesForSystem(e.target.value, selectedOption.dataset.name);
  }
});

async function loadRulesForSystem(systemId, systemName) {
  const res = await fetch(`${apiBase}?action=get_rules&id=${systemId}`);
  const rulesArray = await res.json();
  currentGradeRules = {};
  rulesArray.forEach((rule) => {
    currentGradeRules[rule.grade_letter] = parseFloat(rule.point_value);
  });
  printedSystemName.innerText = systemName;

  if (
    systemName.toUpperCase().includes("NIBM") ||
    systemName.toUpperCase().includes("HND")
  ) {
    currentStrategy = "NIBM_HND";
    injectNibmGatewayRules();
  } else {
    currentStrategy = "STANDARD";
    dynamicRulesPanel.innerHTML = "";
    dynamicRulesPanel.classList.add("hidden");
  }
  updateAllDropdowns();
  calculateGPA();
}

function injectNibmGatewayRules() {
  dynamicRulesPanel.classList.remove("hidden");
  dynamicRulesPanel.innerHTML = `<label class="custom-checkbox magnetic-btn"><input type="checkbox" id="comm-toggle" checked onchange="calculateGPA()"><span class="checkbox-box"></span> Passed Effective Comm-2</label>`;
  document.querySelectorAll(".module-row").forEach((row) => {
    if (!row.querySelector(".attempt-toggle-container")) {
      row.insertAdjacentHTML(
        "beforeend",
        `<label class="custom-checkbox attempt-toggle-container" style="margin-left: 10px;"><input type="checkbox" class="mod-attempt" checked onchange="calculateGPA()"><span class="checkbox-box"></span> 1st Attempt</label>`,
      );
    }
  });
}

// --- 3. UI ROW SPAWNER ---
function spawnModuleRow(isInitial = false) {
  if (moduleCount >= 20)
    return showToast("Maximum module limit reached.", "error");
  moduleCount++;

  const rowId = `module-${Date.now()}`;
  const row = document.createElement("div");
  // Ensure spotlight-card is added for your hover effects
  row.className = "module-row spotlight-card";
  row.id = rowId;

  let optionsHTML = "";
  for (const [grade, points] of Object.entries(currentGradeRules)) {
    optionsHTML += `<option value="${points}">${grade} (${points.toFixed(2)})</option>`;
  }

  // Pure template fix: Ensure classes match the CSS exactly
  row.innerHTML = `
    <input type="text" placeholder="Course Title..." class="mod-name">
    <select class="mod-grade" onchange="calculateGPA()">${optionsHTML}</select>
    <input type="number" class="mod-credits" value="1" min="1" max="10" onchange="calculateGPA()">
    <div class="attempt-container">
        ${
          currentStrategy === "NIBM_HND"
            ? `
          <label class="custom-checkbox magnetic-btn">
            <input type="checkbox" class="mod-attempt" checked onchange="calculateGPA()">
            <span class="checkbox-box"></span> 1st Attempt
          </label>`
            : ""
        }
    </div>
    <button class="remove-btn magnetic-btn" onclick="destroyModuleRow('${rowId}')">✕</button>
  `;

  container.appendChild(row);

  gsap.from(row, { opacity: 0, y: 15, duration: 0.4, ease: "power2.out" });

  applyMagneticHover();
  calculateGPA();
}

function updateAllDropdowns() {
  let optionsHTML = "";
  for (const [grade, points] of Object.entries(currentGradeRules)) {
    optionsHTML += `<option value="${points}">${grade} (${points.toFixed(2)})</option>`;
  }
  document.querySelectorAll(".mod-grade").forEach((select) => {
    const currentVal = select.value;
    select.innerHTML = optionsHTML;
    if ([...select.options].some((opt) => opt.value === currentVal))
      select.value = currentVal;
  });
}

window.destroyModuleRow = function (rowId) {
  const row = document.getElementById(rowId);
  gsap.to(row, {
    scale: 0.95,
    x: 50,
    opacity: 0,
    duration: 0.3,
    ease: "power2.in",
    onComplete: () => {
      row.remove();
      moduleCount--;
      calculateGPA();
    },
  });
};

// --- 4. ALPHANUMERIC MATRIX SCRAMBLE ---
window.calculateGPA = function () {
  const rows = document.querySelectorAll(".module-row");
  let points = 0,
    credits = 0,
    isCFloorBroken = false,
    allFirstAttempt = true;

  rows.forEach((row) => {
    const pVal = parseFloat(row.querySelector(".mod-grade").value) || 0;
    const creditInput = parseFloat(row.querySelector(".mod-credits").value);
    const cVal = isNaN(creditInput) || creditInput <= 0 ? 0 : creditInput;
    points += pVal * cVal;
    credits += cVal;
    if (pVal < 2.0) isCFloorBroken = true;
    if (
      currentStrategy === "NIBM_HND" &&
      row.querySelector(".mod-attempt") &&
      !row.querySelector(".mod-attempt").checked
    )
      allFirstAttempt = false;
  });

  if (moduleCount === 0) {
    gpaDisplay.innerText = "0.00";
    gpaSvgFill.style.strokeDashoffset = 283;
    awardStatusDisplay.innerText = "AWAITING DATA";
    awardStatusDisplay.style.color = "var(--brand-main)";
    totalCreditsDisplay.innerText = "0";
    return;
  }

  const finalGpaValue = credits > 0 ? points / credits : 0;
  const finalGpaStr = finalGpaValue.toFixed(2);
  totalCreditsDisplay.innerText = credits;

  const cyberChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*X";
  let iterations = 0;

  const scrambleInterval = setInterval(() => {
    gpaDisplay.innerText =
      cyberChars[Math.floor(Math.random() * cyberChars.length)] +
      "." +
      cyberChars[Math.floor(Math.random() * cyberChars.length)] +
      cyberChars[Math.floor(Math.random() * cyberChars.length)];
    gpaDisplay.style.color = "#ffffff";
    iterations++;

    if (iterations > 12) {
      clearInterval(scrambleInterval);
      gpaDisplay.innerText = finalGpaStr;
      const dashOffset = 283 - 283 * Math.min(finalGpaValue / 4.0, 1);
      gpaSvgFill.style.strokeDashoffset = dashOffset;

      gsap.fromTo(
        gpaDisplay,
        { scale: 1.1, color: "#ffffff", textShadow: "0 0 30px #ffffff" },
        {
          scale: 1,
          color: "var(--brand-main)",
          textShadow: "0 0 20px var(--brand-glow)",
          duration: 0.5,
          ease: "back.out(2)",
        },
      );

      if (currentStrategy === "NIBM_HND")
        evaluateNIBMStrategy(finalGpaValue, isCFloorBroken, allFirstAttempt);
      else {
        awardStatusDisplay.innerText = "STANDARD EVALUATION";
        awardStatusDisplay.style.color = "var(--text-muted)";
      }
    }
  }, 40);
};

function evaluateNIBMStrategy(gpa, isCFloorBroken, allFirstAttempt) {
  const commPassed = document.getElementById("comm-toggle")
    ? document.getElementById("comm-toggle").checked
    : false;
  if (!commPassed)
    return setAward("INELIGIBLE: Missing Comm-2", "var(--danger)");
  if (isCFloorBroken) return setAward("INELIGIBLE: Grade < C", "var(--danger)");
  if (gpa < 2.0) return setAward("INELIGIBLE: GPA < 2.0", "var(--danger)");
  if (gpa >= 3.8 && allFirstAttempt)
    setAward("DISTINCTION", "var(--brand-main)");
  else if (gpa >= 3.33 && allFirstAttempt)
    setAward("MERIT", "var(--text-main)");
  else setAward("PASS", "var(--success)");
}

function setAward(text, color) {
  awardStatusDisplay.innerText = text;
  gsap.fromTo(
    awardStatusDisplay,
    { opacity: 0, y: -5 },
    { opacity: 1, y: 0, color: color, duration: 0.4 },
  );
}

// --- 5. PDF TRANSCRIPT GENERATOR ---
document.getElementById("export-pdf-btn").addEventListener("click", () => {
  if (moduleCount === 0)
    return showToast("Dashboard empty. No courses to export.", "error");
  showToast("Compiling Encrypted Transcript...", "info");

  const pdfTemplate = document.getElementById("hidden-pdf-template");
  const tbody = document.getElementById("pdf-course-table-body");
  tbody.innerHTML = "";

  document.querySelectorAll(".module-row").forEach((row) => {
    const name =
      row.querySelector(".mod-name").value.trim() || "Unspecified Course";
    const gradeSelect = row.querySelector(".mod-grade");
    const gradeText =
      gradeSelect.options[gradeSelect.selectedIndex].text.split(" ")[0];
    const credits = row.querySelector(".mod-credits").value || 0;
    tbody.innerHTML += `<tr><td>${name}</td><td style="text-align: center;">${credits}</td><td style="text-align: center;">${gradeText}</td></tr>`;
  });

  document.getElementById("pdf-date").innerText = new Date().toLocaleString();
  document.getElementById("pdf-verify-id").innerText =
    "ANYGPA-" + Math.floor(Math.random() * 1000000000);
  document.getElementById("pdf-uni-name").innerText =
    sysSelector.options[sysSelector.selectedIndex].text;
  document.getElementById("pdf-final-gpa").innerText =
    document.getElementById("final-gpa").innerText;

  const awardStatus = document.getElementById("award-status").innerText;
  const pdfAward = document.getElementById("pdf-award-status");
  pdfAward.innerText = awardStatus;
  pdfAward.style.color = awardStatus.includes("INELIGIBLE")
    ? "#e74c3c"
    : "#2c3e50";

  pdfTemplate.style.display = "block";
  html2pdf()
    .set({
      margin: 15,
      filename: `Official_Transcript_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(pdfTemplate)
    .save()
    .then(() => {
      pdfTemplate.style.display = "none";
      showToast("Transcript Downloaded Successfully!", "success");
    });
});

// --- 6. ADVANCED STRATEGY BUILDER ---
const builderModal = document.getElementById("builder-modal");
const gradesContainer = document.getElementById("custom-grades-container");

function addCustomGradeRow(grade = "", points = "") {
  const rowId = `cg-${Date.now()}`;
  const html = `<div class="custom-grade-row" id="${rowId}"><input type="text" class="modal-input cg-name" placeholder="Grade (A+)" value="${grade}" style="margin:0;"><input type="number" class="modal-input cg-points" placeholder="Points (4.0)" step="0.01" value="${points}" style="margin:0;"><button class="remove-btn" onclick="document.getElementById('${rowId}').remove()">✕</button></div>`;
  gradesContainer.insertAdjacentHTML("beforeend", html);
}

document.getElementById("open-builder-btn").addEventListener("click", () => {
  builderModal.classList.remove("hidden");
  gradesContainer.innerHTML = "";
  addCustomGradeRow("A", "4.0");
  addCustomGradeRow("B", "3.0");
  addCustomGradeRow("C", "2.0");
  addCustomGradeRow("F", "0.0");
  gsap.from("#builder-modal .modal-content", {
    y: 40,
    opacity: 0,
    duration: 0.4,
    ease: "back.out(1.2)",
  });
});

document.getElementById("close-modal-btn").addEventListener("click", () => {
  gsap.to("#builder-modal .modal-content", {
    y: -30,
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      builderModal.classList.add("hidden");
      gsap.set("#builder-modal .modal-content", { clearProps: "all" });
    },
  });
});

document
  .getElementById("add-custom-grade-btn")
  .addEventListener("click", () => addCustomGradeRow());

document.getElementById("use-temp-sys-btn").addEventListener("click", () => {
  const sysName =
    document.getElementById("new-sys-name").value.trim() || "Custom Session";
  let customRules = {};
  let valid = false;

  document.querySelectorAll(".custom-grade-row").forEach((row) => {
    const g = row.querySelector(".cg-name").value.trim();
    const p = parseFloat(row.querySelector(".cg-points").value);
    if (g && !isNaN(p)) {
      customRules[g] = p;
      valid = true;
    }
  });

  if (!valid) return showToast("Define at least one valid grade.", "error");

  tempSystemName = sysName;
  tempGradeRules = customRules;
  if (!document.querySelector('option[value="temp"]')) {
    const opt = document.createElement("option");
    opt.value = "temp";
    opt.dataset.name = tempSystemName;
    opt.textContent = `${tempSystemName} [Session Only]`;
    sysSelector.appendChild(opt);
  } else {
    document.querySelector('option[value="temp"]').textContent =
      `${tempSystemName} [Session Only]`;
  }

  sysSelector.value = "temp";
  sysSelector.dispatchEvent(new Event("change"));
  showToast("Session Strategy Applied.", "success");
  document.getElementById("close-modal-btn").click();
});

document.getElementById("save-sys-btn").addEventListener("click", async () => {
  const sysName = document.getElementById("new-sys-name").value.trim();
  const sysCountry = document.getElementById("new-sys-country").value.trim();
  let customRules = [];
  document.querySelectorAll(".custom-grade-row").forEach((row) => {
    const g = row.querySelector(".cg-name").value.trim();
    const p = parseFloat(row.querySelector(".cg-points").value);
    if (g && !isNaN(p)) customRules.push({ grade_letter: g, point_value: p });
  });

  if (!sysName || !sysCountry || customRules.length === 0)
    return showToast("Fill Name, Country, and Grades.", "error");

  const saveBtn = document.getElementById("save-sys-btn");
  saveBtn.innerText = "Deploying...";
  saveBtn.disabled = true;

  try {
    const response = await fetch(`${apiBase}?action=create_system`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_name: sysName,
        country: sysCountry,
        custom_rules: customRules,
      }),
    });
    const data = await response.json();
    if (data.success) {
      showToast(data.message, "success");
      document.getElementById("new-sys-name").value = "";
      document.getElementById("new-sys-country").value = "";
      document.getElementById("close-modal-btn").click();
      initSystem();
    } else showToast(data.error || "Failed to deploy.", "error");
  } catch (err) {
    showToast("Network Error.", "error");
  } finally {
    saveBtn.innerText = "Deploy to Global DB";
    saveBtn.disabled = false;
  }
});

// --- 7. WEB3FORMS DIRECT MESSAGING ---
document.getElementById("dm-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("dm-submit-btn");
  btn.innerText = "Encrypting & Transmitting...";
  btn.disabled = true;
  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: new FormData(e.target),
    });
    const data = await response.json();
    if (data.success) {
      showToast("Transmission delivered to Nima's inbox.", "success");
      e.target.reset();
    } else showToast("API Rejected: " + data.message, "error");
  } catch (err) {
    showToast("Transmission Failed.", "error");
  } finally {
    btn.innerText = "Transmit to Admin Core";
    btn.disabled = false;
  }
});

// --- 8. THE SECRET ADMIN EASTER EGG (KEYLOGGER) ---
let adminCredentials = { username: "", password: "" };
let keySequence = "";
const adminWarningModal = document.getElementById("admin-warning-modal");
const adminLoginModal = document.getElementById("admin-login-modal");
const mainAppView = document.getElementById("main-app-view");
const adminDashboardView = document.getElementById("admin-dashboard-view");
const phraseInput = document.getElementById("security-phrase-input");
const verifyWarningBtn = document.getElementById("verify-warning-btn");

document.addEventListener("keydown", (e) => {
  if (e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
    keySequence += e.key.toLowerCase();
    if (keySequence.length > 5) keySequence = keySequence.slice(-5);
    if (keySequence === "admin") {
      keySequence = "";
      adminWarningModal.classList.remove("hidden");
      gsap.from("#admin-warning-modal .modal-content", {
        scale: 0.9,
        opacity: 0,
        duration: 0.4,
        ease: "back.out(1.5)",
      });
      phraseInput.value = "";
      verifyWarningBtn.style.opacity = "0.3";
      verifyWarningBtn.style.pointerEvents = "none";
      phraseInput.focus();
    }
  }
});

phraseInput.addEventListener("input", (e) => {
  if (e.target.value.trim().toUpperCase() === "I UNDERSTAND") {
    verifyWarningBtn.style.opacity = "1";
    verifyWarningBtn.style.pointerEvents = "auto";
    gsap.to(verifyWarningBtn, {
      scale: 1.05,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
    });
  } else {
    verifyWarningBtn.style.opacity = "0.3";
    verifyWarningBtn.style.pointerEvents = "none";
  }
});

document.getElementById("abort-warning-btn").addEventListener("click", () => {
  gsap.to("#admin-warning-modal .modal-content", {
    y: -30,
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      adminWarningModal.classList.add("hidden");
      gsap.set("#admin-warning-modal .modal-content", { clearProps: "all" });
    },
  });
});

verifyWarningBtn.addEventListener("click", () => {
  adminWarningModal.classList.add("hidden");
  gsap.set("#admin-warning-modal .modal-content", { clearProps: "all" });
  adminLoginModal.classList.remove("hidden");
  gsap.from("#admin-login-modal .modal-content", {
    y: 40,
    opacity: 0,
    duration: 0.4,
    ease: "back.out(1.2)",
  });
});

document.getElementById("cancel-admin-btn").addEventListener("click", () => {
  gsap.to("#admin-login-modal .modal-content", {
    y: -30,
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      adminLoginModal.classList.add("hidden");
      gsap.set("#admin-login-modal .modal-content", { clearProps: "all" });
    },
  });
});

document
  .getElementById("auth-admin-btn")
  .addEventListener("click", async () => {
    const user = document.getElementById("admin-user").value;
    const pass = document.getElementById("admin-pass").value;
    try {
      const response = await fetch(`${apiBase}?action=verify_admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user, password: pass }),
      });
      const data = await response.json();
      if (data.success) {
        showToast("God Mode Enabled.", "success");
        adminCredentials = { username: user, password: pass };
        gsap.set("#admin-login-modal .modal-content", { clearProps: "all" });
        adminLoginModal.classList.add("hidden");
        mainAppView.classList.add("hidden");
        adminDashboardView.classList.remove("hidden");
        gsap.from(adminDashboardView.children, {
          opacity: 0,
          y: 30,
          duration: 0.6,
          stagger: 0.1,
        });
        loadAdminDatabase();
      } else {
        showToast(data.error, "error");
        gsap.to("#admin-login-modal .modal-content", {
          x: [-10, 10, -10, 10, 0],
          duration: 0.4,
        });
      }
    } catch (err) {
      showToast("Connection Error.", "error");
    }
  });

window.showMainApp = function () {
  adminDashboardView.classList.add("hidden");
  mainAppView.classList.remove("hidden");
  adminCredentials = { username: "", password: "" };
  document.getElementById("admin-user").value = "";
  document.getElementById("admin-pass").value = "";

  document
    .querySelectorAll(".tab-section")
    .forEach((sec) => sec.classList.add("hidden"));
  const calcSec = document.getElementById("calculator-section");
  calcSec.classList.remove("hidden");
  calcSec.classList.add("active-section");

  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document
    .querySelector('[data-target="calculator-section"]')
    .classList.add("active");

  initSystem();
  window.scrollTo(0, 0);
};

async function loadAdminDatabase() {
  const res = await fetch(`${apiBase}?action=get_systems`);
  const systems = await res.json();
  const tbody = document.getElementById("admin-table-body");
  tbody.innerHTML = "";
  systems.forEach((sys) => {
    tbody.innerHTML += `<tr><td style="color: var(--text-muted);">#${sys.system_id}</td><td style="font-size: 1.1rem;">${sys.system_name}</td><td style="color: var(--text-muted);">${sys.country}</td><td><button class="btn-purge magnetic-btn" onclick="purgeSystem(${sys.system_id})">PURGE</button></td></tr>`;
  });
  applyMagneticHover();
}

window.purgeSystem = async function (id) {
  if (!confirm("WARNING: This permanently deletes this university. Proceed?"))
    return;
  const response = await fetch(`${apiBase}?action=delete_system`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: id,
      username: adminCredentials.username,
      password: adminCredentials.password,
    }),
  });
  const data = await response.json();
  if (data.success) {
    showToast("System Purged.", "success");
    loadAdminDatabase();
  } else showToast("Error: " + data.error, "error");
};

document
  .getElementById("add-module-btn")
  .addEventListener("click", () => spawnModuleRow(false));
initSystem();
