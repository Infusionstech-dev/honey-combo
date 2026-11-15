// Nexora Foods landing page (browser side).
// Products, prices and delivery charges come from the Node.js server (/api/offer).
// The cart lives in memory only: refreshing the page resets the form and the cart.

let offerProducts = [];
let shippingAreas = [];
let maxQuantityPerProduct = 20;

// ---- Page state (memory only) ----
const cartQuantities = {};
let selectedShippingAreaId = '';
let isOfferLoaded = false;
// The combo is pre-selected so the order form never starts empty.
const preselectedProductId = 'combo';

// ---- Helpers ----
const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function toBanglaNumber(number) {
  return String(number).replace(/\d/g, (digit) => banglaDigits[digit]);
}

function formatTaka(amount) {
  return '৳' + toBanglaNumber(amount.toLocaleString('en-IN'));
}

// Accept Bangla digits typed into the phone field too.
function toEnglishDigits(text) {
  return text.replace(/[০-৯]/g, (digit) => banglaDigits.indexOf(digit));
}

function findProduct(productId) {
  return offerProducts.find((product) => product.id === productId);
}

function getSelectedShippingArea() {
  return shippingAreas.find((area) => area.id === selectedShippingAreaId);
}

function getCartItems() {
  return offerProducts
    .filter((product) => cartQuantities[product.id] > 0)
    .map((product) => ({ product, quantity: cartQuantities[product.id], lineTotal: product.price * cartQuantities[product.id] }));
}

function getOrderTotals() {
  const cartItems = getCartItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingCharge = cartItems.length > 0 ? getSelectedShippingArea().charge : 0;
  return { cartItems, subtotal, shippingCharge, grandTotal: subtotal + shippingCharge };
}

// ---- Elements ----
const productPickGrid = document.getElementById('productPickGrid');
const shippingOptions = document.getElementById('shippingOptions');
const summaryRows = document.getElementById('summaryRows');
const summarySubtotal = document.getElementById('summarySubtotal');
const summaryShipping = document.getElementById('summaryShipping');
const summaryTotal = document.getElementById('summaryTotal');
const buttonTotal = document.getElementById('buttonTotal');
const productError = document.getElementById('productError');
const orderForm = document.getElementById('orderForm');
const customerNameInput = document.getElementById('customerName');
const customerPhoneInput = document.getElementById('customerPhone');
const customerAddressInput = document.getElementById('customerAddress');
const successModal = document.getElementById('successModal');
const closeModalButton = document.getElementById('closeModalButton');

// Payment elements
const bkashOption = document.getElementById('bkashOption');
const bkashBox = document.getElementById('bkashBox');
const bkashAmount = document.getElementById('bkashAmount');
const transactionIdInput = document.getElementById('transactionId');
let isBkashEnabled = false;

function getSelectedPaymentMethod() {
  const checkedRadio = orderForm.querySelector('input[name="paymentMethod"]:checked');
  return checkedRadio ? checkedRadio.value : 'cashOnDelivery';
}

// ---- Product picker cards ----
function renderProductPickers() {
  productPickGrid.innerHTML = offerProducts.map((product) => `
    <div class="pick-card" data-product-id="${product.id}">
      <label class="pick-check">
        <input type="checkbox" data-action="toggle" aria-label="${product.name} বাছাই করুন">
      </label>
      <img src="${product.image}" alt="" width="72" height="72">
      <div class="pick-info">
        <p class="pick-name">${product.name}</p>
        <p class="pick-weight">${product.weight}</p>
        <p class="pick-price">${product.oldPrice ? `<del>${formatTaka(product.oldPrice)}</del> ` : ''}${formatTaka(product.price)}</p>
        <div class="qty-stepper">
          <button type="button" data-action="decrease" aria-label="${product.name} কমান">−</button>
          <span class="qty-value" aria-live="polite">০</span>
          <button type="button" data-action="increase" aria-label="${product.name} বাড়ান">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderShippingOptions() {
  shippingOptions.innerHTML = shippingAreas.map((area) => `
    <label class="radio-row shipping-row">
      <input type="radio" name="shippingArea" value="${area.id}" ${area.id === selectedShippingAreaId ? 'checked' : ''}>
      <span>${area.label}</span>
      <b>${formatTaka(area.charge)}</b>
    </label>
  `).join('');
}

// Refresh every part of the page that depends on the cart.
function updateOrderView() {
  offerProducts.forEach((product) => {
    const pickCard = productPickGrid.querySelector(`[data-product-id="${product.id}"]`);
    const quantity = cartQuantities[product.id];
    pickCard.classList.toggle('is-selected', quantity > 0);
    pickCard.querySelector('[data-action="toggle"]').checked = quantity > 0;
    pickCard.querySelector('.qty-value').textContent = toBanglaNumber(quantity);
    pickCard.querySelector('[data-action="decrease"]').disabled = quantity === 0;
    pickCard.querySelector('[data-action="increase"]').disabled = quantity >= maxQuantityPerProduct;
  });

  const { cartItems, subtotal, shippingCharge, grandTotal } = getOrderTotals();

  summaryRows.innerHTML = cartItems.length === 0
    ? '<tr><td colspan="2" class="summary-empty">কোনো পণ্য বাছাই করা হয়নি</td></tr>'
    : cartItems.map((item) => `
        <tr>
          <td><span class="summary-product"><img src="${item.product.image}" alt="" width="40" height="40">${item.product.name} × ${toBanglaNumber(item.quantity)}</span></td>
          <td>${formatTaka(item.lineTotal)}</td>
        </tr>
      `).join('');

  summarySubtotal.textContent = formatTaka(subtotal);
  summaryShipping.textContent = formatTaka(shippingCharge);
  summaryTotal.textContent = formatTaka(grandTotal);
  buttonTotal.textContent = formatTaka(grandTotal);
  bkashAmount.textContent = formatTaka(grandTotal);

  if (cartItems.length > 0) productError.hidden = true;
}

function setProductQuantity(productId, newQuantity) {
  cartQuantities[productId] = Math.min(Math.max(newQuantity, 0), maxQuantityPerProduct);
  updateOrderView();
}

productPickGrid.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  if (!actionTarget) return;
  const productId = actionTarget.closest('.pick-card').dataset.productId;
  const currentQuantity = cartQuantities[productId];

  if (actionTarget.dataset.action === 'increase') setProductQuantity(productId, currentQuantity + 1);
  if (actionTarget.dataset.action === 'decrease') setProductQuantity(productId, currentQuantity - 1);
  if (actionTarget.dataset.action === 'toggle') setProductQuantity(productId, actionTarget.checked ? 1 : 0);
});

shippingOptions.addEventListener('change', (event) => {
  if (event.target.name === 'shippingArea') {
    selectedShippingAreaId = event.target.value;
    updateOrderView();
  }
});

// Show the bKash "Send Money" box only while the bKash option is selected.
orderForm.addEventListener('change', (event) => {
  if (event.target.name !== 'paymentMethod') return;
  const bkashSelected = getSelectedPaymentMethod() === 'bkash';
  bkashBox.hidden = !bkashSelected;
  if (!bkashSelected) showFieldError(transactionIdInput, false);
});

// ---- Validation ----
function showFieldError(inputElement, hasError) {
  const errorMessage = inputElement.closest('.field').querySelector('.field-error');
  errorMessage.hidden = !hasError;
  inputElement.classList.toggle('has-error', hasError);
  inputElement.setAttribute('aria-invalid', hasError ? 'true' : 'false');
  return !hasError;
}

function getCleanPhoneNumber() {
  return toEnglishDigits(customerPhoneInput.value).replace(/[\s-]/g, '').replace(/^\+?88/, '');
}

function validateOrderForm() {
  const isNameValid = showFieldError(customerNameInput, customerNameInput.value.trim().length < 2);
  const isPhoneValid = showFieldError(customerPhoneInput, !/^01[3-9]\d{8}$/.test(getCleanPhoneNumber()));
  const isAddressValid = showFieldError(customerAddressInput, customerAddressInput.value.trim().length < 5);
  const hasProducts = getCartItems().length > 0;
  productError.hidden = hasProducts;

  // When paying by bKash, a valid Transaction ID is required.
  const payingWithBkash = getSelectedPaymentMethod() === 'bkash';
  const isTransactionIdValid = !payingWithBkash
    || showFieldError(transactionIdInput, !/^[a-zA-Z0-9]{8,12}$/.test(transactionIdInput.value.trim()));

  if (!hasProducts) {
    productPickGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    const firstInvalidInput = [customerNameInput, customerPhoneInput, customerAddressInput, payingWithBkash ? transactionIdInput : null]
      .find((input) => input && input.classList.contains('has-error'));
    if (firstInvalidInput) firstInvalidInput.focus();
  }
  return isNameValid && isPhoneValid && isAddressValid && isTransactionIdValid && hasProducts;
}

// Clear an error as soon as the customer fixes that field.
[customerNameInput, customerPhoneInput, customerAddressInput, transactionIdInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input.classList.contains('has-error')) showFieldError(input, false);
  });
});

// ---- Submit: send the order to the Node.js server ----
const submitOrderButton = document.getElementById('submitOrderButton');
const submitErrorMessage = document.getElementById('submitErrorMessage');
const fieldInputsByName = { customerName: customerNameInput, customerPhone: customerPhoneInput, customerAddress: customerAddressInput, transactionId: transactionIdInput };

function showSubmitError(messageText) {
  submitErrorMessage.textContent = messageText;
  submitErrorMessage.hidden = !messageText;
}

function showOrderConfirmation(placedOrder) {
  document.getElementById('successMessage').textContent =
    `অর্ডার নং #${toBanglaNumber(placedOrder.orderNumber)}। ${placedOrder.customerName}, আমাদের প্রতিনিধি শীঘ্রই ${toBanglaNumber(placedOrder.customerPhone)} নাম্বারে কল করে অর্ডার নিশ্চিত করবেন।`;

  const successItems = document.getElementById('successItems');
  successItems.replaceChildren();
  const confirmationRows = placedOrder.items.map((item) => [`${item.name} × ${toBanglaNumber(item.quantity)}`, formatTaka(item.lineTotal)]);
  confirmationRows.push([`ডেলিভারি (${placedOrder.shippingArea.label})`, formatTaka(placedOrder.shippingArea.charge)]);
  confirmationRows.push(['পেমেন্ট', placedOrder.payment.label]);
  if (placedOrder.payment.transactionId) {
    confirmationRows.push(['TrxID', placedOrder.payment.transactionId]);
  }
  confirmationRows.forEach(([rowLabel, rowValue]) => {
    const rowItem = document.createElement('li');
    const labelText = document.createElement('span');
    const amountText = document.createElement('b');
    labelText.textContent = rowLabel;
    amountText.textContent = rowValue;
    rowItem.append(labelText, amountText);
    successItems.append(rowItem);
  });
  document.getElementById('successTotal').textContent = formatTaka(placedOrder.grandTotal);

  successModal.hidden = false;
  closeModalButton.focus();
}

orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showSubmitError('');
  if (!isOfferLoaded || !validateOrderForm()) return;

  const orderRequest = {
    customerName: customerNameInput.value.trim(),
    customerPhone: getCleanPhoneNumber(),
    customerAddress: customerAddressInput.value.trim(),
    shippingAreaId: selectedShippingAreaId,
    items: getCartItems().map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    paymentMethod: getSelectedPaymentMethod(),
    transactionId: transactionIdInput.value.trim(),
  };

  const buttonOriginalHtml = submitOrderButton.innerHTML;
  submitOrderButton.disabled = true;
  submitOrderButton.textContent = 'অর্ডার পাঠানো হচ্ছে...';

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderRequest),
    });
    const responseData = await response.json();

    if (!response.ok) {
      const fieldErrors = responseData.fieldErrors || {};
      Object.entries(fieldInputsByName).forEach(([fieldName, inputElement]) => {
        if (fieldErrors[fieldName]) showFieldError(inputElement, true);
      });
      showSubmitError(fieldErrors.items || fieldErrors.shippingArea || fieldErrors.paymentMethod || fieldErrors.transactionId || responseData.message || 'অর্ডার পাঠানো যায়নি।');
      return;
    }

    showOrderConfirmation(responseData.order);
  } catch {
    showSubmitError('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট চেক করে আবার চেষ্টা করুন।');
  } finally {
    submitOrderButton.disabled = false;
    submitOrderButton.innerHTML = buttonOriginalHtml;
    updateOrderView();
  }
});

function closeSuccessModal() {
  successModal.hidden = true;
}

closeModalButton.addEventListener('click', closeSuccessModal);
successModal.addEventListener('click', (event) => {
  if (event.target === successModal) closeSuccessModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !successModal.hidden) closeSuccessModal();
});

// ---- Start: load products and delivery charges from the server ----
async function loadOffer() {
  try {
    const response = await fetch('/api/offer');
    if (!response.ok) throw new Error('Offer request failed');
    const offerData = await response.json();

    offerProducts = offerData.offerProducts;
    shippingAreas = offerData.shippingAreas;
    maxQuantityPerProduct = offerData.maxQuantityPerProduct;
    offerProducts.forEach((product) => { cartQuantities[product.id] = product.id === preselectedProductId ? 1 : 0; });
    selectedShippingAreaId = shippingAreas[0].id;
    isOfferLoaded = true;

    renderProductPickers();
    renderShippingOptions();
    updateOrderView();
    showWhatsappSection(offerData.whatsappNumber);
    enableBkashOption(offerData.bkash);
  } catch {
    productPickGrid.innerHTML = '<p class="load-error">পণ্যের তথ্য লোড করা যায়নি। পেজটি রিফ্রেশ করুন।</p>';
  }
}

// ---- bKash "Send Money" option (shown only when the server has a bKash number) ----
function enableBkashOption(bkashSettings) {
  if (!bkashSettings || !bkashSettings.number) return;
  isBkashEnabled = true;
  document.getElementById('bkashNumberText').textContent = bkashSettings.number;
  document.getElementById('bkashAccountType').textContent = bkashSettings.accountType === 'Merchant' ? 'Merchant' : 'Personal';
  bkashOption.hidden = false;
}

// ---- WhatsApp contact section (hidden when no number is set on the server) ----
function showWhatsappSection(whatsappNumber) {
  const localPhoneNumber = String(whatsappNumber || '').replace(/\D/g, '').replace(/^88/, '');
  if (!/^01\d{9}$/.test(localPhoneNumber)) return;

  const whatsappMessage = 'আসসালামু আলাইকুম, আমি হানি নাটস / মধু অফারটি অর্ডার করতে চাই।';
  document.getElementById('whatsappNumberText').textContent =
    `+৮৮০ ${toBanglaNumber(localPhoneNumber.slice(1, 5))}-${toBanglaNumber(localPhoneNumber.slice(5))}`;
  document.getElementById('whatsappButton').href =
    `https://wa.me/88${localPhoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  document.getElementById('whatsappSection').hidden = false;
}

// ---- Offer countdown: counts down to midnight, then starts again for the next day ----
const countdownHours = document.getElementById('countdownHours');
const countdownMinutes = document.getElementById('countdownMinutes');
const countdownSeconds = document.getElementById('countdownSeconds');

function padTwoDigits(number) {
  return toBanglaNumber(String(number).padStart(2, '0'));
}

function updateCountdown() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  const secondsLeft = Math.max(0, Math.floor((nextMidnight - now) / 1000));

  countdownHours.textContent = padTwoDigits(Math.floor(secondsLeft / 3600));
  countdownMinutes.textContent = padTwoDigits(Math.floor((secondsLeft % 3600) / 60));
  countdownSeconds.textContent = padTwoDigits(secondsLeft % 60);
}

updateCountdown();
setInterval(updateCountdown, 1000);

loadOffer();

// Some browsers refill typed text after a refresh; clear it so a refresh always starts fresh.
window.addEventListener('pageshow', () => {
  [customerNameInput, customerPhoneInput, customerAddressInput, transactionIdInput].forEach((input) => { input.value = ''; });
});
