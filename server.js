const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const menuPath = path.join(__dirname, 'data', 'menu.json');

// In-memory order store (resets on restart — fine for a lab/demo)
const orders = [];
let orderCounter = 1000;

// GET /api/menu - returns the full menu
app.get('/api/menu', (req, res) => {
  fs.readFile(menuPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Could not load menu' });
    res.json(JSON.parse(data));
  });
});

// POST /api/orders - place an order
// body: { items: [{id, name, price, qty}], customer: {name, address, phone}, total }
app.post('/api/orders', (req, res) => {
  const { items, customer, total } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }
  if (!customer || !customer.name || !customer.address || !customer.phone) {
    return res.status(400).json({ error: 'Missing customer details' });
  }

  const orderId = `EW-${orderCounter++}`;
  const order = {
    orderId,
    items,
    customer,
    total,
    status: 'confirmed',
    placedAt: new Date().toISOString(),
    etaMinutes: 28 + Math.floor(Math.random() * 12)
  };

  orders.push(order);
  res.status(201).json(order);
});

// GET /api/orders/:id - look up an order (handy for testing)
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.orderId === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

app.listen(PORT, () => {
  console.log(`Ember & Wok server running at http://localhost:${PORT}`);
});
