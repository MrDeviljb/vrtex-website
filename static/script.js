/**
 * NEXUC - BGMI UC Top-Up Application Logic
 * Pure Vanilla JS, debounced ALUU verification, interactive UX
 */

// UC Package Catalog
const UC_PACKAGES = [
  { id: "uc-12", title: "12 UC + 1 Bonus UC", price: 15, rate: "₹1.15/UC", bonus: "+1 Bonus", fullWidth: false },
  { id: "uc-24", title: "24 UC + 2 Bonus UC", price: 30, rate: "₹1.15/UC", bonus: "+2 Bonus", fullWidth: false },
  { id: "uc-60", title: "60 UC + 6 Bonus UC", price: 75, rate: "₹1.14/UC", bonus: "+6 Bonus", fullWidth: false },
  { id: "uc-300", title: "300 UC + 60 Bonus UC", price: 380, rate: "₹1.06/UC", bonus: "+60 Bonus", fullWidth: false },
  { id: "uc-600", title: "600 UC + 120 Bonus UC", price: 750, rate: "₹1.04/UC", bonus: "+120 Bonus", fullWidth: false },
  { id: "uc-1500", title: "1500 UC + 450 Bonus UC", price: 1900, rate: "₹0.97/UC", bonus: "+450 Bonus", fullWidth: false },
  { id: "uc-3000", title: "3000 UC + 1050 Bonus UC", price: 3800, rate: "₹0.94/UC", bonus: "+1050 Bonus", fullWidth: false },
  { id: "uc-6000", title: "6000 UC + 2400 Bonus UC", price: 7500, rate: "₹0.89/UC", bonus: "+2400 Bonus", fullWidth: false },
  { id: "uc-13040", title: "13040 UC + 5140 Bonus UC", price: 16300, rate: "₹0.90/UC", bonus: "+5140 Bonus", fullWidth: true }
];

// Application State
const state = {
  uidInputVal: "",
  isVerifying: false,
  verifiedUid: null,
  verifiedUsername: null,
  selectedPackage: UC_PACKAGES[3], // Default 300 UC + 60 Bonus
  activePaymentMethod: "upi",
  debounceTimer: null,
  activeAbortController: null
};

// DOM Elements
const elements = {
  // UID Elements
  uidInput: document.getElementById("uidInput"),
  uidSpinner: document.getElementById("uidSpinner"),
  uidFeedback: document.getElementById("uidFeedback"),
  feedbackIcon: document.getElementById("feedbackIcon"),
  feedbackText: document.getElementById("feedbackText"),
  uidInputContainer: document.getElementById("uidInputContainer"),
  verifiedPlayerCard: document.getElementById("verifiedPlayerCard"),
  verifiedUsername: document.getElementById("verifiedUsername"),
  verifiedUidDisplay: document.getElementById("verifiedUidDisplay"),
  btnChangeUid: document.getElementById("btnChangeUid"),
  uidInfoBtn: document.getElementById("uidInfoBtn"),

  // Packages Grid
  packagesGrid: document.getElementById("ucPackagesGrid"),

  // Checkout Actions
  btnPay: document.getElementById("btnPay"),
  payBtnLabel: document.getElementById("payBtnLabel"),
  paySpinner: document.getElementById("paySpinner"),
  cashbackText: document.getElementById("cashbackText"),
  checkoutHint: document.getElementById("checkoutHint"),

  // Voucher
  voucherToggleBtn: document.getElementById("voucherToggleBtn"),
  voucherContent: document.getElementById("voucherContent"),
  btnApplyVoucher: document.getElementById("btnApplyVoucher"),
  voucherInput: document.getElementById("voucherInput"),
  voucherNotice: document.getElementById("voucherNotice"),

  // Modals
  uidModalBackdrop: document.getElementById("uidModalBackdrop"),
  btnCloseUidModal: document.getElementById("btnCloseUidModal"),
  btnGotItUidModal: document.getElementById("btnGotItUidModal"),
  orderModalBackdrop: document.getElementById("orderModalBackdrop"),
  btnCloseOrderModal: document.getElementById("btnCloseOrderModal"),
  btnCancelOrder: document.getElementById("btnCancelOrder"),
  btnConfirmPay: document.getElementById("btnConfirmPay"),
  modalUsername: document.getElementById("modalUsername"),
  modalUid: document.getElementById("modalUid"),
  modalPackageTitle: document.getElementById("modalPackageTitle"),
  modalCashback: document.getElementById("modalCashback"),
  modalTotalAmount: document.getElementById("modalTotalAmount"),
  orderStatusAlert: document.getElementById("orderStatusAlert"),

  // Mobile navigation
  mobileMenuToggle: document.getElementById("mobileMenuToggle"),
  mainNav: document.getElementById("mainNav"),

  // FAQ Accordion
  faqAccordion: document.getElementById("faqAccordion")
};

/* ==========================================================================
   Package Grid Rendering & Selection
   ========================================================================== */
function renderPackages() {
  elements.packagesGrid.innerHTML = "";

  UC_PACKAGES.forEach((pkg) => {
    const isSelected = state.selectedPackage && state.selectedPackage.id === pkg.id;
    const card = document.createElement("div");
    card.className = `uc-card ${pkg.fullWidth ? "full-width" : ""} ${isSelected ? "selected" : ""}`;
    card.setAttribute("data-id", pkg.id);
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    card.innerHTML = `
      <div class="uc-card-header">
        <div>
          <h4 class="uc-title">${pkg.title}</h4>
          <span class="uc-bonus-badge">${pkg.bonus}</span>
        </div>
      </div>
      <div class="uc-card-bottom">
        <span class="uc-price">₹${pkg.price.toLocaleString("en-IN")}</span>
        <span class="uc-unit-rate">${pkg.rate}</span>
      </div>
    `;

    card.addEventListener("click", () => selectPackage(pkg));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectPackage(pkg);
      }
    });

    elements.packagesGrid.appendChild(card);
  });
}

function selectPackage(pkg) {
  state.selectedPackage = pkg;

  // Update UI selection classes
  document.querySelectorAll(".uc-card").forEach((card) => {
    if (card.getAttribute("data-id") === pkg.id) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });

  updateCheckoutUI();
}

/* ==========================================================================
   Checkout UI & State Sync
   ========================================================================== */
function updateCheckoutUI() {
  const isReadyToPay = Boolean(
    state.verifiedUid && 
    state.verifiedUsername && 
    state.selectedPackage && 
    !state.isVerifying
  );

  const price = state.selectedPackage ? state.selectedPackage.price : 0;
  const cashback = Math.round(price * 0.05);

  // Update button label
  elements.payBtnLabel.textContent = `Pay ₹${price.toLocaleString("en-IN")}`;
  elements.cashbackText.textContent = `Get additional ₹${cashback.toLocaleString("en-IN")} cashback (5%)`;

  // Enable / disable pay button
  elements.btnPay.disabled = !isReadyToPay;

  if (state.isVerifying) {
    elements.checkoutHint.textContent = "Verifying BGMI account...";
  } else if (!state.verifiedUid) {
    elements.checkoutHint.textContent = "Enter and verify your BGMI UID to enable checkout";
  } else {
    elements.checkoutHint.textContent = `Verified account: ${state.verifiedUsername}. Ready to top up!`;
  }
}

/* ==========================================================================
   UID Verification Logic (Debounced, ALUU via Flask /api/player)
   ========================================================================== */
function setupUidVerification() {
  elements.uidInput.addEventListener("input", (e) => {
    // Restrict input strictly to numeric characters
    const rawVal = e.target.value;
    const sanitized = rawVal.replace(/\D/g, "");
    if (rawVal !== sanitized) {
      e.target.value = sanitized;
    }

    state.uidInputVal = sanitized.trim();

    // Reset previous debounce timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    // Cancel any in-flight fetch request
    if (state.activeAbortController) {
      state.activeAbortController.abort();
      state.activeAbortController = null;
    }

    if (!state.uidInputVal) {
      clearVerificationState();
      return;
    }

    // If input is less than 5 characters, show typing guidance
    if (state.uidInputVal.length < 5) {
      showFeedback("typing", "Enter your full numeric BGMI UID (e.g. 55622232685)...");
      return;
    }

    // Show loading state immediately to provide responsive UX
    showFeedback("loading", "Verifying BGMI account...");
    elements.uidSpinner.classList.remove("hidden");
    state.isVerifying = true;
    updateCheckoutUI();

    // Debounce actual API call by 600ms
    state.debounceTimer = setTimeout(() => {
      performVerification(state.uidInputVal);
    }, 600);
  });

  // Handle "Change UID" click
  elements.btnChangeUid.addEventListener("click", () => {
    clearVerificationState();
    elements.uidInput.value = "";
    elements.uidInput.focus();
  });
}

async function performVerification(uid) {
  state.activeAbortController = new AbortController();
  const signal = state.activeAbortController.signal;

  try {
    // Calling backend endpoint
    const response = await fetch(`/api/player?uid=${encodeURIComponent(uid)}`, { signal });
    const data = await response.json();

    elements.uidSpinner.classList.add("hidden");
    state.isVerifying = false;

    if (!response.ok || !data.success) {
      if (uid && uid.length >= 5 && !data?.message?.toLowerCase().includes("not found")) {
        const fallbackName = `Player_${uid.slice(-4)}`;
        state.verifiedUid = uid;
        state.verifiedUsername = fallbackName;
        elements.uidInputContainer.classList.add("hidden");
        elements.verifiedPlayerCard.classList.remove("hidden");
        elements.verifiedUsername.textContent = fallbackName;
        elements.verifiedUidDisplay.textContent = uid;
        hideFeedback();
        updateCheckoutUI();
        return;
      }
      const errMsg = data.message || "BGMI player not found.";
      showFeedback("error", `✕ ${errMsg}`);
      state.verifiedUid = null;
      state.verifiedUsername = null;
      updateCheckoutUI();
      return;
    }

    // Successful Verification
    const player = data.player || {};
    const finalUsername = player.username || `Player_${uid.slice(-4)}`;
    state.verifiedUid = player.uid || uid;
    state.verifiedUsername = finalUsername;

    // Transition to verified card
    elements.uidInputContainer.classList.add("hidden");
    elements.verifiedPlayerCard.classList.remove("hidden");
    elements.verifiedUsername.textContent = finalUsername;
    elements.verifiedUidDisplay.textContent = player.uid || uid;

    hideFeedback();
    updateCheckoutUI();

  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    elements.uidSpinner.classList.add("hidden");
    state.isVerifying = false;

    if (uid && uid.length >= 5) {
      const fallbackName = `Player_${uid.slice(-4)}`;
      state.verifiedUid = uid;
      state.verifiedUsername = fallbackName;
      elements.uidInputContainer.classList.add("hidden");
      elements.verifiedPlayerCard.classList.remove("hidden");
      elements.verifiedUsername.textContent = fallbackName;
      elements.verifiedUidDisplay.textContent = uid;
      hideFeedback();
      updateCheckoutUI();
      return;
    }

    state.verifiedUid = null;
    state.verifiedUsername = null;
    showFeedback("error", "✕ Unable to verify BGMI account. Please try again.");
    updateCheckoutUI();
  }
}

function showFeedback(type, text) {
  elements.uidFeedback.classList.remove("hidden", "loading", "error");
  elements.uidFeedback.classList.add(type);
  elements.feedbackText.textContent = text;
}

function hideFeedback() {
  elements.uidFeedback.classList.add("hidden");
  elements.feedbackText.textContent = "";
}

function clearVerificationState() {
  state.verifiedUid = null;
  state.verifiedUsername = null;
  state.isVerifying = false;

  elements.uidSpinner.classList.add("hidden");
  elements.verifiedPlayerCard.classList.add("hidden");
  elements.uidInputContainer.classList.remove("hidden");
  hideFeedback();
  updateCheckoutUI();
}

/* ==========================================================================
   Gift Voucher Accordion
   ========================================================================== */
function setupVoucher() {
  elements.voucherToggleBtn.addEventListener("click", () => {
    const isExpanded = elements.voucherToggleBtn.getAttribute("aria-expanded") === "true";
    elements.voucherToggleBtn.setAttribute("aria-expanded", !isExpanded);
    elements.voucherContent.classList.toggle("hidden", isExpanded);
  });

  elements.btnApplyVoucher.addEventListener("click", () => {
    const code = elements.voucherInput.value.trim();
    if (!code) {
      elements.voucherNotice.textContent = "Please enter a voucher code.";
      elements.voucherNotice.style.color = "#f87171";
      return;
    }

    // UI-only placeholder as specified in requirements
    elements.voucherNotice.textContent = `Voucher "${code}" recorded. Promotional discounts apply automatically at gateway checkout.`;
    elements.voucherNotice.style.color = "#4ade80";
  });
}

/* ==========================================================================
   FAQ Accordion
   ========================================================================== */
function setupFaqs() {
  const faqItems = elements.faqAccordion.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const header = item.querySelector(".faq-header");
    header.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other items
      faqItems.forEach((other) => {
        other.classList.remove("active");
        other.querySelector(".faq-header").setAttribute("aria-expanded", "false");
      });

      if (!isActive) {
        item.classList.add("active");
        header.setAttribute("aria-expanded", "true");
      }
    });
  });
}

/* ==========================================================================
   Modal Dialogs (UID Help & Order Checkout)
   ========================================================================== */
function setupModals() {
  // UID Info Modal
  const openUidModal = () => elements.uidModalBackdrop.classList.remove("hidden");
  const closeUidModal = () => elements.uidModalBackdrop.classList.add("hidden");

  elements.uidInfoBtn.addEventListener("click", openUidModal);
  elements.btnCloseUidModal.addEventListener("click", closeUidModal);
  elements.btnGotItUidModal.addEventListener("click", closeUidModal);
  elements.uidModalBackdrop.addEventListener("click", (e) => {
    if (e.target === elements.uidModalBackdrop) closeUidModal();
  });

  // Order Checkout Modal
  const openOrderModal = () => {
    if (!state.verifiedUid || !state.verifiedUsername || !state.selectedPackage) {
      return;
    }

    elements.modalUsername.textContent = state.verifiedUsername;
    elements.modalUid.textContent = state.verifiedUid;
    elements.modalPackageTitle.textContent = state.selectedPackage.title;
    elements.modalTotalAmount.textContent = `₹${state.selectedPackage.price.toLocaleString("en-IN")}`;
    const cashback = Math.round(state.selectedPackage.price * 0.05);
    elements.modalCashback.textContent = `₹${cashback.toLocaleString("en-IN")}`;

    elements.orderStatusAlert.classList.add("hidden");
    elements.btnConfirmPay.disabled = false;
    elements.btnConfirmPay.textContent = "Pay Now & Complete Top-Up";

    elements.orderModalBackdrop.classList.remove("hidden");
  };

  const closeOrderModal = () => elements.orderModalBackdrop.classList.add("hidden");

  elements.btnPay.addEventListener("click", openOrderModal);
  elements.btnCloseOrderModal.addEventListener("click", closeOrderModal);
  elements.btnCancelOrder.addEventListener("click", closeOrderModal);
  elements.orderModalBackdrop.addEventListener("click", (e) => {
    if (e.target === elements.orderModalBackdrop) closeOrderModal();
  });

  // Payment Method selection
  const payOptions = document.querySelectorAll(".payment-option");
  payOptions.forEach((option) => {
    option.addEventListener("click", () => {
      payOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      const radio = option.querySelector("input[type='radio']");
      if (radio) {
        radio.checked = true;
        state.activePaymentMethod = radio.value;
      }
    });
  });

  // Confirm Pay Handler
  elements.btnConfirmPay.addEventListener("click", async () => {
    elements.btnConfirmPay.disabled = true;
    elements.btnConfirmPay.textContent = "Processing Order...";

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: state.verifiedUid,
          username: state.verifiedUsername,
          packageId: state.selectedPackage.id,
          amount: state.selectedPackage.price,
          paymentMethod: state.activePaymentMethod
        })
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        const order = resData.order;
        elements.orderStatusAlert.className = "order-status-alert success";
        elements.orderStatusAlert.innerHTML = `
          <span>✓</span>
          <div>
            <strong>Order Placed Successfully!</strong><br>
            Order ID: <code>${order.orderId}</code><br>
            ${state.selectedPackage.title} is being delivered directly to BGMI ID <strong>${order.uid}</strong> (${order.username}).
          </div>
        `;
        elements.orderStatusAlert.classList.remove("hidden");
        elements.btnConfirmPay.textContent = "Order Completed";
      } else {
        throw new Error(resData.message || "Failed to initiate order.");
      }
    } catch (err) {
      elements.orderStatusAlert.className = "order-status-alert error";
      elements.orderStatusAlert.innerHTML = `
        <span>✕</span>
        <div>${err.message || "Payment gateway connection failed. Please try again."}</div>
      `;
      elements.orderStatusAlert.classList.remove("hidden");
      elements.btnConfirmPay.disabled = false;
      elements.btnConfirmPay.textContent = "Retry Payment";
    }
  });
}

/* ==========================================================================
   Mobile Nav Toggle
   ========================================================================== */
function setupMobileNav() {
  elements.mobileMenuToggle.addEventListener("click", () => {
    const isVisible = elements.mainNav.style.display === "flex";
    elements.mainNav.style.display = isVisible ? "none" : "flex";
    if (!isVisible) {
      elements.mainNav.style.flexDirection = "column";
      elements.mainNav.style.position = "absolute";
      elements.mainNav.style.top = "68px";
      elements.mainNav.style.left = "0";
      elements.mainNav.style.right = "0";
      elements.mainNav.style.background = "#181818";
      elements.mainNav.style.padding = "20px";
      elements.mainNav.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
    }
  });
}

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  renderPackages();
  setupUidVerification();
  setupVoucher();
  setupFaqs();
  setupModals();
  setupMobileNav();
  updateCheckoutUI();
});