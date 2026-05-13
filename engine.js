// --- NIMA CORE ENGINE: PORTFOLIO EDITION ---

const gradePoints = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,
  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,
  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,
  "D+": 1.3,
  D: 1.0,
  E: 0.0,
};

const container = document.getElementById("modules-container");
const addBtn = document.getElementById("add-module-btn");
const gpaDisplay = document.getElementById("final-gpa");
const statusDisplay = document.getElementById("award-status");
const errorDisplay = document.getElementById("error-messages");
const commToggle = document.getElementById("comm-toggle");

let moduleCount = 0;

// Portfolio Intro Animation
gsap.from(".portfolio-header, .master-controls, .results-panel", {
  y: 40,
  opacity: 0,
  duration: 1.2,
  stagger: 0.2,
  ease: "power4.out",
});

function spawnModuleRow(isInitial = false) {
  if (moduleCount >= 14) return;
  moduleCount++;
  const rowId = `module-${Date.now()}`;
  const row = document.createElement("div");
  row.className = "module-row";
  row.id = rowId;

  row.innerHTML = `
        <input type="text" placeholder="Module Title" class="mod-name">
        <select class="mod-grade" onchange="calculateGPA()">
            <option value="A+">A+ (4.0)</option>
            <option value="A">A (4.0)</option>
            <option value="A-">A- (3.7)</option>
            <option value="B+">B+ (3.3)</option>
            <option value="B">B (3.0)</option>
            <option value="B-">B- (2.7)</option>
            <option value="C+">C+ (2.3)</option>
            <option value="C">C (2.0)</option>
            <option value="C-">C- (1.7)</option>
            <option value="D+">D+ (1.3)</option>
            <option value="D">D (1.0)</option>
            <option value="E">E (0.0)</option>
        </select>
        <input type="number" class="mod-credits" value="1" min="1" max="6" onchange="calculateGPA()">
        <label class="checkbox-group">
            <input type="checkbox" class="mod-attempt" checked onchange="calculateGPA()"> 1st Attempt
        </label>
        <button class="remove-btn" onclick="destroyModuleRow('${rowId}')">✕</button>
    `;

  container.appendChild(row);

  // Vertical Carousel Slide-in Effect
  gsap.from(row, {
    y: 50,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
    delay: isInitial ? moduleCount * 0.1 : 0,
  });

  calculateGPA();
}

window.destroyModuleRow = function (rowId) {
  if (moduleCount <= 4) return alert("Minimum 4 modules required.");
  const row = document.getElementById(rowId);

  // Vertical Carousel Slide-out Effect
  gsap.to(row, {
    x: -50,
    opacity: 0,
    height: 0,
    padding: 0,
    margin: 0,
    duration: 0.4,
    ease: "power2.inOut",
    onComplete: () => {
      row.remove();
      moduleCount--;
      calculateGPA();
    },
  });
};

window.calculateGPA = function () {
  const rows = document.querySelectorAll(".module-row");
  if (rows.length === 0) return;

  let points = 0,
    credits = 0;
  let isCFloorBroken = false,
    allFirst = true;

  rows.forEach((row) => {
    const pVal = gradePoints[row.querySelector(".mod-grade").value];
    const cVal = parseFloat(row.querySelector(".mod-credits").value) || 0;

    points += pVal * cVal;
    credits += cVal;

    if (pVal < 2.0) isCFloorBroken = true;
    if (!row.querySelector(".mod-attempt").checked) allFirst = false;
  });

  const gpa = credits > 0 ? points / credits : 0;

  gsap.to(gpaDisplay, {
    innerHTML: gpa.toFixed(2),
    duration: 0.8,
    snap: { innerHTML: 0.01 },
    ease: "power3.out",
  });

  evaluateRules(gpa, isCFloorBroken, allFirst);
};

function evaluateRules(gpa, isCFloorBroken, allFirst) {
  errorDisplay.innerText = "";

  if (!commToggle.checked)
    return setStatus("INELIGIBLE", "Missing Comm-2", "var(--danger)");
  if (isCFloorBroken)
    return setStatus("INELIGIBLE", "Modules < C", "var(--danger)");
  if (gpa < 2.0) return setStatus("INELIGIBLE", "GPA < 2.0", "var(--danger)");

  if (gpa >= 3.8 && allFirst)
    setStatus("DISTINCTION", "HND SOFTWARE ENG", "var(--gold)");
  else if (gpa >= 3.33 && allFirst)
    setStatus("MERIT", "HND SOFTWARE ENG", "var(--text-main)");
  else setStatus("PASS", "HND SOFTWARE ENG", "var(--success)");
}

function setStatus(status, msg, color) {
  statusDisplay.innerText = `${status} — ${msg}`;
  gsap.to([gpaDisplay, statusDisplay], { color: color, duration: 0.4 });
}

addBtn.addEventListener("click", () => spawnModuleRow());
commToggle.addEventListener("change", calculateGPA);
for (let i = 0; i < 4; i++) spawnModuleRow(true);
