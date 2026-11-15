// Nexora Foods landing page server (Node.js + Express).
// No database: orders are only printed in this terminal and kept nowhere.

const path = require('path');
const express = require('express');
const { offerProducts, shippingAreas, maxQuantityPerProduct, whatsappNumber } = require('./data/offerData');

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// The page asks for products and delivery charges from here.
app.get('/api/offer', (request, response) => {
  response.json({ offerProducts, shippingAreas, maxQuantityPerProduct, whatsappNumber });
});

const bangladeshMobilePattern = /^01[3-9]\d{8}$/;
const banglaDigits = '০১২৩৪৫৬৭৮৯';

function cleanPhoneNumber(phoneText) {
  return String(phoneText)
    .replace(/[০-৯]/g, (digit) => banglaDigits.indexOf(digit))
    .replace(/[\s-]/g, '')
    .replace(/^\+?88/, '');
}

function cleanText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

// Check the order and work out the total again on the server,
// using the server's own prices (never the prices the browser sent).
function validateOrder(orderRequest) {
  const fieldErrors = {};
  const customerName = cleanText(orderRequest.customerName, 80);
  const customerPhone = cleanPhoneNumber(cleanText(orderRequest.customerPhone, 20));
  const customerAddress = cleanText(orderRequest.customerAddress, 300);

  if (customerName.length < 2) fieldErrors.customerName = 'নাম লিখুন।';
  if (!bangladeshMobilePattern.test(customerPhone)) fieldErrors.customerPhone = 'সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।';
  if (customerAddress.length < 5) fieldErrors.customerAddress = 'ঠিকানা লিখুন।';

  const shippingArea = shippingAreas.find((area) => area.id === orderRequest.shippingAreaId);
  if (!shippingArea) fieldErrors.shippingArea = 'ডেলিভারি এলাকা বাছাই করুন।';

  const requestedItems = Array.isArray(orderRequest.items) ? orderRequest.items : [];
  const orderItems = [];
  for (const requestedItem of requestedItems) {
    const product = offerProducts.find((offerProduct) => offerProduct.id === requestedItem?.productId);
    const quantity = Number(requestedItem?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantityPerProduct) {
      fieldErrors.items = 'পণ্যের তথ্য সঠিক নয়।';
      break;
    }
    if (orderItems.some((item) => item.productId === product.id)) continue;
    orderItems.push({ productId: product.id, name: product.name, quantity, unitPrice: product.price, lineTotal: product.price * quantity });
  }
  if (orderItems.length === 0 && !fieldErrors.items) fieldErrors.items = 'অন্তত একটি পণ্য বাছাই করুন।';

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  return {
    order: {
      customerName,
      customerPhone,
      customerAddress,
      items: orderItems,
      shippingArea: { id: shippingArea.id, label: shippingArea.label, charge: shippingArea.charge },
      subtotal,
      grandTotal: subtotal + shippingArea.charge,
      paymentMethod: 'ক্যাশ অন ডেলিভারি',
    },
  };
}

let nextOrderNumber = 1001; // resets every time the server restarts (no database)

app.post('/api/orders', (request, response) => {
  const { order, fieldErrors } = validateOrder(request.body || {});
  if (fieldErrors) return response.status(400).json({ message: 'অর্ডারের তথ্য ঠিক করুন।', fieldErrors });

  const placedOrder = { orderNumber: nextOrderNumber++, placedAt: new Date().toISOString(), ...order };
  console.log('\n=== New order ===');
  console.log(JSON.stringify(placedOrder, null, 2));
  return response.status(201).json({ order: placedOrder });
});

// Unknown API routes and broken JSON get a clear answer instead of an HTML page.
app.use('/api', (request, response) => response.status(404).json({ message: 'Not found' }));
app.use((error, request, response, next) => {
  if (error.type === 'entity.parse.failed') return response.status(400).json({ message: 'Invalid request' });
  console.error(error);
  return response.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন।' });
});

app.listen(port, () => {
  console.log(`Nexora Foods landing page running at http://localhost:${port}`);
});
