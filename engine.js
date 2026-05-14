// =====================================================================
// ANY GPA CORE: NEXT-GEN SPA ENGINE (V-FINAL)
// =====================================================================

const apiBase = "api.php";

// =====================================================================
// 1. CORE DOM ELEMENTS & CACHE
// =====================================================================
const container = document.getElementById("modules-container");
const sysSelector = document.getElementById("system-selector");
const gpaDisplay = document.getElementById("final-gpa");
const totalCreditsDisplay = document.getElementById("total-credits-display");
const awardStatusDisplay = document.getElementById("award-status");
const printedSystemName = document.getElementById("printed-system-name");
const dynamicRulesPanel = document.getElementById("dynamic-rules-panel");
const loader = document.getElementById("global-loader");
const gpaSvgFill = document.getElementById("gpa-svg-fill");
const toastBox = document.getElementById("toast-container");

// Mobile UX Failsafe
const isTouchDevice = () =>
  "ontouchstart" in window || navigator.maxTouchPoints > 0;

// Global State
let currentGradeRules = {};
let tempGradeRules = null;
let tempSystemName = "";
let moduleCount = 0;
let currentStrategy = "STANDARD";

// =====================================================================
// 2. HARDWARE-ACCELERATED PHYSICS (GPU OPTIMIZED)
// =====================================================================

// Global Error Catcher
window.addEventListener("error", () => {
  if (loader) loader.classList.add("hidden");
});

function showToast(message, type = "info") {
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

// 🚀 ENTERPRISE OPTIMIZATION: GSAP QuickSetter for massive performance boost
if (!isTouchDevice()) {
  const glowSetX = gsap.quickSetter("#cursor-glow", "x", "px");
  const glowSetY = gsap.quickSetter("#cursor-glow", "y", "px");

  document.addEventListener("mousemove", (e) => {
    // Direct GPU manipulation bypasses layout thrashing
    glowSetX(e.clientX);
    glowSetY(e.clientY);

    document.querySelectorAll(".spotlight-card").forEach((card) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
    });
  });
}

function apply3DTilt() {
  if (isTouchDevice()) return; // Abort heavy physics on mobile

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
  if (isTouchDevice()) return; // Abort heavy physics on mobile

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
    btn.addEventListener("mouseleave", () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
    });
  });
}

// =====================================================================
// 3. SPA ROUTER & MOBILE HUD NAVIGATION
// =====================================================================
const hamburgerBtn = document.getElementById("hamburger-btn");
const mobileNavOverlay = document.getElementById("mobile-nav"); // This targets your new dropdown

function toggleMobileMenu(forceClose = false) {
  if (!hamburgerBtn || !mobileNavOverlay) return;

  if (forceClose) {
    hamburgerBtn.classList.remove("active");
    mobileNavOverlay.classList.remove("active");
  } else {
    hamburgerBtn.classList.toggle("active");
    mobileNavOverlay.classList.toggle("active");
  }
}

if (hamburgerBtn) {
  hamburgerBtn.addEventListener("click", () => toggleMobileMenu());
}

// Unified Router for both Desktop and Mobile links
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const targetId = this.getAttribute("data-target");

    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    document
      .querySelectorAll(`[data-target="${targetId}"]`)
      .forEach((l) => l.classList.add("active"));

    document.querySelectorAll(".tab-section").forEach((sec) => {
      sec.classList.add("hidden");
      sec.classList.remove("active-section");
    });

    const targetSec = document.getElementById(targetId);
    targetSec.classList.remove("hidden");
    targetSec.classList.add("active-section");

    gsap.fromTo(
      targetSec.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" },
    );

    toggleMobileMenu(true); // Retracts the HUD menu automatically
    window.scrollTo(0, 0);
  });
});

// Auto-close menu if screen resizes to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) toggleMobileMenu(true);
});

// =====================================================================
// 4. CORE DATABASE INTEGRATION
// =====================================================================
async function initSystem() {
  try {
    const res = await fetch(`${apiBase}?action=get_systems`);
    if (!res.ok) throw new Error("Database unreadable.");
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

    if (!tempGradeRules && systems.length > 0) {
      loadRulesForSystem(systems[0].system_id, systems[0].system_name);
    } else if (tempGradeRules) {
      sysSelector.value = "temp";
    }

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
  try {
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
  } catch (err) {
    showToast("Failed to fetch rule set.", "error");
  }
}

function injectNibmGatewayRules() {
  dynamicRulesPanel.classList.remove("hidden");
  dynamicRulesPanel.innerHTML = `<label class="custom-checkbox magnetic-btn"><input type="checkbox" id="comm-toggle" checked onchange="calculateGPA()"><span class="checkbox-box"></span> Passed Effective Comm-2</label>`;
  document.querySelectorAll(".module-row").forEach((row) => {
    if (
      !row.querySelector(".attempt-toggle-container") &&
      !row.querySelector(".mod-attempt")
    ) {
      row.insertAdjacentHTML(
        "beforeend",
        `<div class="attempt-container"><label class="custom-checkbox magnetic-btn"><input type="checkbox" class="mod-attempt" checked onchange="calculateGPA()"><span class="checkbox-box"></span> 1st Attempt</label></div>`,
      );
    }
  });
}

// =====================================================================
// 5. UI ROW MANAGER
// =====================================================================
function spawnModuleRow() {
  if (moduleCount >= 20)
    return showToast("Maximum module limit reached.", "error");
  moduleCount++;

  const rowId = `module-${Date.now()}`;
  const row = document.createElement("div");
  row.className = "module-row spotlight-card";
  row.id = rowId;

  let optionsHTML = "";
  for (const [grade, points] of Object.entries(currentGradeRules)) {
    optionsHTML += `<option value="${points}">${grade} (${points.toFixed(2)})</option>`;
  }

  row.innerHTML = `
        <input type="text" placeholder="Course Title..." class="mod-name" aria-label="Course Name">
        <select class="mod-grade" onchange="calculateGPA()" aria-label="Grade">${optionsHTML}</select>
        <input type="number" class="mod-credits" value="1" min="1" max="10" onchange="calculateGPA()" aria-label="Credits">
        <div class="attempt-container">
            ${currentStrategy === "NIBM_HND" ? `<label class="custom-checkbox magnetic-btn"><input type="checkbox" class="mod-attempt" checked onchange="calculateGPA()"><span class="checkbox-box"></span> 1st Attempt</label>` : ""}
        </div>
        <button class="remove-btn magnetic-btn" onclick="destroyModuleRow('${rowId}')" aria-label="Remove Row">✕</button>
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
    x: isTouchDevice() ? 0 : 50,
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

document
  .getElementById("add-module-btn")
  .addEventListener("click", () => spawnModuleRow());

// =====================================================================
// 6. ALPHANUMERIC MATRIX SCRAMBLE & MATHEMATICS
// =====================================================================
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
    ) {
      allFirstAttempt = false;
    }
  });

  if (moduleCount === 0 || credits === 0) {
    gpaDisplay.innerText = "0.00";
    gpaSvgFill.style.strokeDashoffset = 283;
    awardStatusDisplay.innerText = "AWAITING DATA";
    awardStatusDisplay.style.color = "var(--brand-main)";
    totalCreditsDisplay.innerText = "0";
    return;
  }

  const finalGpaValue = points / credits;
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

      if (currentStrategy === "NIBM_HND") {
        evaluateNIBMStrategy(finalGpaValue, isCFloorBroken, allFirstAttempt);
      } else {
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

// =====================================================================
// 7. NATIVE PROGRAMMATIC PDF ENGINE
// =====================================================================
document.getElementById("export-pdf-btn").addEventListener("click", () => {
  if (moduleCount === 0)
    return showToast("Dashboard empty. No courses to export.", "error");

  showToast("Drawing Mathematical PDF Record...", "info");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const uniName = sysSelector.options[sysSelector.selectedIndex].text.replace(
    " [Session Only]",
    "",
  );
  const gpaValue = document.getElementById("final-gpa").innerText;
  const awardStatus = document.getElementById("award-status").innerText;
  const verificationId =
    "ANYGPA-" + Math.floor(10000000 + Math.random() * 90000000);
  const dateStr = new Date().toLocaleString();
  const strategyName =
    currentStrategy === "NIBM_HND"
      ? "NIBM Institutional Gateway Logic"
      : "Standard Cumulative Scale";
  let totalCredits = 0;

  let tableData = [];
  document.querySelectorAll(".module-row").forEach((row) => {
    const name =
      row.querySelector(".mod-name").value.trim() || "Unspecified Course";
    const gradeSelect = row.querySelector(".mod-grade");
    const gradeText =
      gradeSelect.options[gradeSelect.selectedIndex].text.split(" ")[0];
    const credits = parseFloat(row.querySelector(".mod-credits").value) || 0;

    totalCredits += credits;
    tableData.push([name, credits.toString(), gradeText]);
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(10, 10, 10);
  doc.text("OFFICIAL ACADEMIC TRANSCRIPT", pageWidth / 2, 25, {
    align: "center",
  });

  doc.setLineWidth(1);
  doc.setDrawColor(0, 0, 0);
  doc.line(15, 30, pageWidth - 15, 30);

  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text(uniName, 15, 42);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Certified & Encrypted by ANY GPA Global SaaS Engine", 15, 48);

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(15, 55, pageWidth - 30, 25, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(`Date of Issue: ${dateStr}`, 20, 63);
  doc.text(`Grading Strategy: ${strategyName}`, 20, 73);

  doc.setFont("helvetica", "bold");
  doc.text(`Verification ID: ${verificationId}`, pageWidth - 20, 63, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.text(`Total Credits Attempted: ${totalCredits}`, pageWidth - 20, 73, {
    align: "right",
  });

  doc.autoTable({
    startY: 85,
    head: [["Course / Module Title", "Credits", "Grade Awarded"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: { textColor: 30, halign: "center" },
    columnStyles: { 0: { halign: "left", cellWidth: 100 } },
    styles: { fontSize: 11, cellPadding: 6 },
  });

  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, finalY, pageWidth - 30, 30, 2, 2, "S");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("OVERALL ACADEMIC STANDING", 20, finalY + 10);

  doc.setFontSize(18);
  if (awardStatus.includes("INELIGIBLE")) doc.setTextColor(200, 0, 0);
  else doc.setTextColor(0, 150, 0);
  doc.text(awardStatus, 20, finalY + 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("CUMULATIVE GPA", pageWidth - 20, finalY + 10, { align: "right" });

  doc.setFontSize(26);
  doc.setTextColor(10, 10, 10);
  doc.text(gpaValue, pageWidth - 20, finalY + 24, { align: "right" });

  const sigY = finalY + 60;
  doc.setLineWidth(0.5);
  doc.line(25, sigY, 85, sigY);
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("System Administrator", 55, sigY + 8, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Authorized Validation", 55, sigY + 14, { align: "center" });

  doc.setDrawColor(0, 0, 0);
  doc.line(pageWidth - 85, sigY, pageWidth - 25, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("Registrar Certification", pageWidth - 55, sigY + 8, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Automated Ledger", pageWidth - 55, sigY + 14, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 0, 0);
  doc.text("OFFICIAL", pageWidth - 55, sigY - 12, {
    align: "center",
    angle: 10,
  });
  doc.text("SEAL", pageWidth - 55, sigY - 6, { align: "center", angle: 10 });

  doc.save(`Official_Transcript_${Date.now()}.pdf`);
  showToast("Official Transcript Generated Successfully!", "success");
});

// =====================================================================
// 8. ADVANCED STRATEGY BUILDER
// =====================================================================
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
  let customRules = {},
    valid = false;

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
    } else {
      showToast(data.error || "Failed to deploy.", "error");
    }
  } catch (err) {
    showToast("Network Error.", "error");
  } finally {
    saveBtn.innerText = "Deploy to Global DB";
    saveBtn.disabled = false;
  }
});

// =====================================================================
// 9. WEB3FORMS SECURE TRANSMISSION
// =====================================================================
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
      showToast("Transmission delivered to Administrator.", "success");
      e.target.reset();
    } else {
      showToast("API Rejected: " + data.message, "error");
    }
  } catch (err) {
    showToast("Transmission Failed.", "error");
  } finally {
    btn.innerText = "Transmit to Admin Core";
    btn.disabled = false;
  }
});

// =====================================================================
// 10. THE SECRET GOD MODE KEYLOGGER
// =====================================================================
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
  document.getElementById("calculator-section").classList.remove("hidden");
  document.getElementById("calculator-section").classList.add("active-section");

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
  } else {
    showToast("Error: " + data.error, "error");
  }
};

// =====================================================================
// 11. SYSTEM INITIALIZATION
// =====================================================================
document.addEventListener("DOMContentLoaded", initSystem);
document
  .querySelectorAll(".mobile-year, #current-year")
  .forEach((el) => (el.textContent = new Date().getFullYear()));
