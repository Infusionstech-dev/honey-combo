// Edit prices, products and delivery charges here.
// The server is the only place prices live, so the browser cannot change them.

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

// WhatsApp number for the "যোগাযোগ করুন" section, e.g. '01712345678'.
// Leave it empty ('') to hide that section.
const whatsappNumber = '';

module.exports = { offerProducts, shippingAreas, maxQuantityPerProduct, whatsappNumber };
