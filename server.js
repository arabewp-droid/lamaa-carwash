'use strict';

const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.disable('x-powered-by');
app.set('trust proxy', true);

// Basic security headers (no extra dependency)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use(express.json({ limit: '20kb' }));

// Static assets — long cache for media, short for HTML
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (/\.(mp4|webm|jpg|jpeg|png|webp|svg|woff2?)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000');
      } else if (/\.(css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// Booking requests (kept in memory; connect a database or email service later)
const bookings = [];
const PACKAGES = ['express', 'premium', 'ceramic', 'interior', 'mobile'];

app.post('/api/booking', (req, res) => {
  const { name, phone, service, date, time, notes } = req.body || {};
  const errors = {};

  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').replace(/[\s-]/g, '');

  if (cleanName.length < 2 || cleanName.length > 80) errors.name = 'يرجى إدخال الاسم';
  if (!/^(\+?9665|05)\d{8}$/.test(cleanPhone)) errors.phone = 'رقم الجوال غير صحيح (مثال: 05XXXXXXXX)';
  if (!PACKAGES.includes(service)) errors.service = 'يرجى اختيار الخدمة';
  if (!date || Number.isNaN(Date.parse(date))) errors.date = 'يرجى اختيار التاريخ';
  if (!time) errors.time = 'يرجى اختيار الوقت';

  if (Object.keys(errors).length) {
    return res.status(400).json({ ok: false, errors });
  }

  const booking = {
    id: 'LM-' + Date.now().toString(36).toUpperCase(),
    name: cleanName,
    phone: cleanPhone,
    service,
    date,
    time: String(time).slice(0, 10),
    notes: String(notes || '').slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  if (bookings.length > 500) bookings.shift();
  console.log('[booking]', booking.id, booking.service, booking.date, booking.time);

  return res.status(201).json({ ok: true, id: booking.id });
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Lamaa car wash site running on port ${PORT}`);
});
