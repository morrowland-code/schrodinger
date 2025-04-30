require('dotenv').config();
const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/images', express.static('images')); // Serve images from /images

let session = null;

// LOGIN
app.post('/login', async (req, res) => {
  const users = JSON.parse(fs.readFileSync('users.json'));
  const user = users.find(u => u.username === req.body.username);
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    session = user;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// LOGOUT
app.post('/logout', (req, res) => {
  session = null;
  res.end();
});

// SESSION STATUS
app.get('/session', (req, res) => {
  if (session) {
    const { password, ...safeSession } = session;
    res.json(safeSession);
  } else {
    res.json({});
  }
});

// SAVE CART
app.post('/save-cart', (req, res) => {
  fs.writeFileSync('cart.json', JSON.stringify(req.body));
  res.end();
});

// ADD ORDER (simulate customer)
app.post('/add-order', (req, res) => {
  if (!session) return res.status(401).send("Unauthorized");

  const newOrder = {
    id: Math.floor(Math.random() * 10000),
    amount: Math.floor(Math.random() * 100) + 50
  };
  session.orders.push(newOrder);
  session.balance += newOrder.amount;
  res.end();
});

// SAVE PRODUCT
app.post('/add-product', (req, res) => {
  const products = JSON.parse(fs.readFileSync('products.json'));
  products.push(req.body);
  fs.writeFileSync('products.json', JSON.stringify(products));
  res.end();
});

// LOAD PRODUCTS
app.get('/products', (req, res) => {
  const products = JSON.parse(fs.readFileSync('products.json'));
  res.json(products);
});

// GET ORDERS
app.get('/get-orders', (req, res) => {
  const allUsers = JSON.parse(fs.readFileSync('users.json'));
  const orders = [];
  for (const user of allUsers) {
    for (const order of user.orders) {
      orders.push({
        name: user.username,
        email: user.username + "@email.com",
        address: "Unknown",
        amount: order.amount
      });
    }
  }
  res.json(orders);
});

// STRIPE CHECKOUT
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
app.post('/create-checkout-session', async (req, res) => {
  const cart = JSON.parse(fs.readFileSync('cart.json'));
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: 1
    })),
    success_url: req.headers.origin + '/success.html',
    cancel_url: req.headers.origin + '/cancel.html'
  });
  res.json({ id: session.id });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));