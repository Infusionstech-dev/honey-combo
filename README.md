# Honey Combo Landing Page

One-page offer page for premium honey nuts and pure honey, with a cash-on-delivery order form.
Built with Node.js + Express. No database: orders are printed in the server terminal only,
and refreshing the page resets the form.

## Run

```bash
npm install
npm start
```

Then open http://localhost:4000. On Windows you can also double-click `start-server.bat`.

Set a different port with the `PORT` environment variable.

## Edit the offer

All prices, products, delivery charges and the WhatsApp number live in `data/offerData.js`.
The server recalculates every order total from these prices, so changing them in the browser has no effect.
Leave `whatsappNumber` empty to hide the WhatsApp section.

## Structure

```
server.js            Express server: serves public/ and the API
data/offerData.js    Products, prices, delivery charges, WhatsApp number
public/              The page (index.html, css, js, images)
```

## API

- `GET /api/offer` returns products, delivery areas and settings.
- `POST /api/orders` validates an order and returns it with an order number.
