const BASE_INCOME_PER_UNIT = 1930;
const MAX_AGE = 125;

// Income Inputs
const incomeEmploymentInput = document.getElementById("income-employment");
const incomeBusinessInput = document.getElementById("income-business");
const monthsTaxInput = document.getElementById("months-tax");
const monthsDecisionInput = document.getElementById("months-decision");
const incomePensionInput = document.getElementById("income-pension");
const incomeServiceInput = document.getElementById("income-service");
const incomeError = document.getElementById("income-error");

// Member Inputs
const membersList = document.getElementById("members-list");
const membersError = document.getElementById("members-error");
const addMemberBtn = document.getElementById("add-member");

// Actions & Results
const checkBtn = document.getElementById("check-btn");
const statSize = document.getElementById("stat-size");
const statMaxIncome = document.getElementById("stat-max-income");
const statIncome = document.getElementById("stat-income");
const resultMessage = document.getElementById("result-message");
const resultPill = document.getElementById("result-pill");

function formatMoney(value) {
    if (!Number.isFinite(value)) return "-";
    return value.toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function createMemberRow(initialAge = "") {
    const row = document.createElement("div");
    row.className = "member-row";

    const ageWrapper = document.createElement("div");
    ageWrapper.className = "age-input";

    const label = document.createElement("label");
    label.textContent = "Age";

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = String(MAX_AGE);
    input.step = "1";
    input.placeholder = "42";
    input.value = initialAge;

    ageWrapper.appendChild(label);
    ageWrapper.appendChild(input);

    const ageError = document.createElement("span");
    ageError.className = "age-error";
    ageWrapper.appendChild(ageError);

    const weightInfo = document.createElement("div");
    weightInfo.className = "member-weight";
    weightInfo.textContent = "Weight: -";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";

    removeBtn.addEventListener("click", () => {
        if (membersList.children.length > 1) {
            row.remove();
        } else {
            input.value = "";
        }
        updateWeightsPreview();
    });

    input.addEventListener("input", () => {
        updateWeightsPreview();
    });

    input.addEventListener("blur", () => {
        const value = input.value.trim();
        if (!value) {
            input.classList.remove("input-error");
            ageError.textContent = "";
            return;
        }
        const age = parseFloat(value);
        if (!Number.isFinite(age) || age <= 0 || age >= MAX_AGE) {
            input.classList.add("input-error");
            ageError.textContent = "Age must be > 0 and < 125";
        } else {
            input.classList.remove("input-error");
            ageError.textContent = "";
        }
    });

    row.appendChild(ageWrapper);
    row.appendChild(weightInfo);
    row.appendChild(removeBtn);

    membersList.appendChild(row);
}

function getAges() {
    const rows = Array.from(membersList.querySelectorAll(".member-row"));
    return rows.map((row) => {
        const input = row.querySelector("input[type='number']");
        const value = input.value.trim();
        if (!value) return null;
        const age = parseFloat(value);
        return Number.isFinite(age) && age > 0 && age < MAX_AGE ? age : null;
    });
}

function computeHouseholdSize(ages) {
    if (!ages.length) return 0;

    const adultsAndTeens = ages.filter((a) => a >= 14);
    const children = ages.filter((a) => a < 14);

    let size = 0;

    if (adultsAndTeens.length > 0) {
        size += 1; // first member 14+
        if (adultsAndTeens.length > 1) {
            size += (adultsAndTeens.length - 1) * 0.7;
        }
    }

    size += children.length * 0.5;

    return size;
}

function updateWeightsPreview() {
    const rows = Array.from(membersList.querySelectorAll(".member-row"));
    const ages = rows.map((row) => {
        const input = row.querySelector("input[type='number']");
        const value = input.value.trim();
        if (!value) return null;
        const age = parseFloat(value);
        return Number.isFinite(age) && age > 0 ? age : null;
    });

    const adultIndices = ages
        .map((age, index) => (age !== null && age >= 14 ? index : null))
        .filter((index) => index !== null);

    rows.forEach((row, index) => {
        const weightEl = row.querySelector(".member-weight");
        const age = ages[index];

        if (age === null) {
            weightEl.textContent = "Weight: -";
            return;
        }

        if (age >= 14) {
            const isFirstAdult = adultIndices[0] === index;
            weightEl.textContent = isFirstAdult
                ? "Weight: 1.0 (first member ≥ 14)"
                : "Weight: 0.7 (additional member ≥ 14)";
        } else {
            weightEl.textContent = "Weight: 0.5 (member < 14)";
        }
    });
}

function clearErrors() {
    incomeError.textContent = "";
    membersError.textContent = "";
}

function resetResults() {
    statSize.textContent = "-";
    statMaxIncome.textContent = "-";
    statIncome.textContent = "-";
    resultMessage.textContent = "";

    resultPill.textContent = "Waiting for input";
    resultPill.className = "pill pill-neutral";
}

function updateResults({ size, maxIncomePerPerson, averageIncomePerPerson, eligible }) {
    statSize.textContent = size.toFixed(2);
    statMaxIncome.textContent = formatMoney(maxIncomePerPerson);
    statIncome.textContent = formatMoney(averageIncomePerPerson);

    if (eligible) {
        resultMessage.textContent =
            "Your household is eligible for financial assistance for energy based on this income.";
        resultMessage.className = "message message-eligible";
        resultPill.textContent = "Eligible";
        resultPill.className = "pill pill-eligible";
    } else {
        resultMessage.textContent =
            "Your household is not eligible for financial assistance for energy at this income level.";
        resultMessage.className = "message message-not-eligible";
        resultPill.textContent = "Not eligible";
        resultPill.className = "pill pill-not-eligible";
    }
}

function validateInputs() {
    clearErrors();

    // Parse values (default to 0 or defaults)
    const empRaw = incomeEmploymentInput.value.trim().replace(",", ".");
    const busRaw = incomeBusinessInput.value.trim().replace(",", ".");
    const penRaw = incomePensionInput.value.trim().replace(",", ".");
    const svcRaw = incomeServiceInput.value.trim().replace(",", ".");

    const mTaxRaw = monthsTaxInput.value.trim();
    const mDecRaw = monthsDecisionInput.value.trim();

    const emp = empRaw ? parseFloat(empRaw) : 0;
    const bus = busRaw ? parseFloat(busRaw) : 0;
    const pen = penRaw ? parseFloat(penRaw) : 0;
    const svc = svcRaw ? parseFloat(svcRaw) : 0;

    const mTax = mTaxRaw ? parseFloat(mTaxRaw) : 12;
    const mDec = mDecRaw ? parseFloat(mDecRaw) : 12;

    let hasError = false;

    // Check income validity
    if ([emp, bus, pen, svc].some(val => !Number.isFinite(val) || val < 0)) {
        incomeError.textContent = "Please enter valid non-negative numbers for all income fields.";
        hasError = true;
    }

    // Check months validity
    if (!Number.isFinite(mTax) || mTax <= 0 || !Number.isFinite(mDec) || mDec < 0) {
        incomeError.textContent = "Months must be valid positive numbers (max 12 normally)."; // Not strictly forcing max 12 if user has weird fiscal year but keeping simple
        hasError = true;
    }

    // Check household members
    const ages = getAges();
    const validAges = ages.filter((age) => age !== null);

    if (ages.some((age) => age === null)) {
        membersError.textContent =
            "All household members must have a valid age (> 0 and < 125).";
        hasError = true;
    } else if (!validAges.length) {
        membersError.textContent =
            "Please enter at least one household member with a valid age.";
        hasError = true;
    }

    return {
        hasError,
        incomes: { emp, bus, pen, svc },
        months: { mTax, mDec },
        ages: validAges,
    };
}

function handleCheck() {
    const { hasError, incomes, months, ages } = validateInputs();
    if (hasError) {
        resetResults();
        return;
    }

    const size = computeHouseholdSize(ages);
    if (size <= 0) {
        membersError.textContent =
            "Household size is zero. Please check the ages entered.";
        resetResults();
        return;
    }

    // Calculate Households Total Income
    const { emp, bus, pen, svc } = incomes;
    const { mTax, mDec } = months;

    // Business Income Formula: P_zo = (ZD_zo / 0.866) * K
    // K = min(SZ_t / SZ_zo, 1)

    // Prevent division by zero if monthsTax is 0 (though validated > 0, safe guard)
    const safeTaxMonths = mTax > 0 ? mTax : 12;
    const K = Math.min(mDec / safeTaxMonths, 1);

    const businessComputed = (bus / 0.866) * K;

    // Total Annual Income for the Decision Period
    const totalIncome = emp + businessComputed + pen + svc;

    // Average Monthly Income per Person
    // (Total / 12) / Size
    const monthlyIncome = totalIncome / 12;
    const averageIncomePerPerson = monthlyIncome / size;
    const maxIncomePerPerson = BASE_INCOME_PER_UNIT;
    const eligible = averageIncomePerPerson < maxIncomePerPerson;

    updateResults({ size, maxIncomePerPerson, averageIncomePerPerson, eligible });
}

addMemberBtn.addEventListener("click", () => {
    createMemberRow();
    updateWeightsPreview();
});

checkBtn.addEventListener("click", handleCheck);

// Attach Enter key support to all numeric inputs
const allIncomeInputs = [
    incomeEmploymentInput,
    incomeBusinessInput,
    monthsTaxInput,
    monthsDecisionInput,
    incomePensionInput,
    incomeServiceInput
];

allIncomeInputs.forEach(input => {
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleCheck();
        }
    });

    input.addEventListener("blur", () => {
        // Simple visual feedback on blur could be added here
        const val = parseFloat(input.value.trim().replace(",", "."));
        if (input.value.trim() && (!Number.isFinite(val) || val < 0)) {
            input.classList.add("input-error");
        } else {
            input.classList.remove("input-error");
        }
    });
});

// Initialize with one empty member row
createMemberRow();
updateWeightsPreview();
resetResults();
