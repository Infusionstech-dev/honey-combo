// Nexora Foods landing page.
// Everything lives in memory only: no database, no localStorage.
// Refreshing the page resets the form and the cart.

// ---- Edit prices, products and delivery charges here ----
const offerProducts = [
  { id: 'honeyNuts', name: 'প্রিমিয়াম হানি নাটস', weight: '৭৫০ গ্রাম', price: 980, image: 'images/honey-nuts.jpg' },
  { id: 'honey', name: 'খাঁটি মধু', weight: '১ কেজি', price: 600, image: 'images/honey.jpg' },
  { id: 'combo', name: 'হানি নাটস + মধু কম্বো', weight: '৭৫০ গ্রাম + ১ কেজি', price: 1500, oldPrice: 1580, image: 'images/combo.jpg' },
];

const shippingAreas = [
  { id: 'insideDhaka', label: 'ঢাকার ভিতরে', charge: 70 },
  { id: 'outsideDhaka', label: 'ঢাকার বাইরে', charge: 130 },
];

const maxQuantityPerProduct = 20;

// ---- Page state (memory only) ----
// The combo is pre-selected so the order form never starts empty.
const cartQuantities = { honeyNuts: 0, honey: 0, combo: 1 };
let selectedShippingAreaId = shippingAreas[0].id;

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

// "Order" buttons on the offer cards pick that product (if not already) and scroll to the form.
document.querySelectorAll('[data-pick-product]').forEach((offerButton) => {
  offerButton.addEventListener('click', () => {
    const productId = offerButton.dataset.pickProduct;
    if (cartQuantities[productId] === 0) setProductQuantity(productId, 1);
  });
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

  if (!hasProducts) {
    productPickGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    const firstInvalidInput = [customerNameInput, customerPhoneInput, customerAddressInput].find((input) => input.classList.contains('has-error'));
    if (firstInvalidInput) firstInvalidInput.focus();
  }
  return isNameValid && isPhoneValid && isAddressValid && hasProducts;
}

// Clear an error as soon as the customer fixes that field.
[customerNameInput, customerPhoneInput, customerAddressInput].forEach((input) => {
  input.addEventListener('input', () => {
    if (input.classList.contains('has-error')) showFieldError(input, false);
  });
});

// ---- Submit (no server: just show the confirmation) ----
orderForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateOrderForm()) return;

  const { cartItems, grandTotal } = getOrderTotals();
  const shippingArea = getSelectedShippingArea();

  document.getElementById('successMessage').textContent =
    `${customerNameInput.value.trim()}, আমাদের প্রতিনিধি শীঘ্রই ${toBanglaNumber(getCleanPhoneNumber())} নাম্বারে কল করে অর্ডার নিশ্চিত করবেন।`;
  document.getElementById('successItems').innerHTML = cartItems
    .map((item) => `<li><span>${item.product.name} × ${toBanglaNumber(item.quantity)}</span><b>${formatTaka(item.lineTotal)}</b></li>`)
    .join('') + `<li><span>ডেলিভারি (${shippingArea.label})</span><b>${formatTaka(shippingArea.charge)}</b></li>`;
  document.getElementById('successTotal').textContent = formatTaka(grandTotal);

  successModal.hidden = false;
  closeModalButton.focus();
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

// ---- Start ----
renderProductPickers();
renderShippingOptions();
updateOrderView();

// Some browsers refill typed text after a refresh; clear it so a refresh always starts fresh.
window.addEventListener('pageshow', () => {
  [customerNameInput, customerPhoneInput, customerAddressInput].forEach((input) => { input.value = ''; });
});
