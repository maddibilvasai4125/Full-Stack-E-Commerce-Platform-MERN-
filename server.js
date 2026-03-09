/**
 * ============================================================
 * BREW-N-FILL® | Full-Stack E-Commerce Platform (MERN)
 * Smart E-Commerce: Streamlined Online Shopping with AI
 * ============================================================
 * Main Express.js Server Entry Point
 * ============================================================
 */

require('dotenv').config();

const express    = require('express');
const path       = require('path');
const bodyParser = require('body-parser');
const cors       = require('cors');
const mongoose   = require('mongoose');
const twilio     = require('twilio');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brew-n-fill', {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ─────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS, images)
const staticDir = path.join(__dirname, 'static');
app.use(express.static(staticDir));

// ─────────────────────────────────────────
// Twilio SMS Client
// ─────────────────────────────────────────
const twilioClient       = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber  = process.env.TWILIO_PHONE_NUMBER  || '+12514188416';
const businessPhone      = process.env.BUSINESS_PHONE_NUMBER || '+918125268128';

// ─────────────────────────────────────────
// Root Route — Serve Landing Page
// ─────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// ─────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────

/**
 * GET /products
 * Returns the full product catalog as JSON.
 * In production, this is fetched from MongoDB.
 */
app.get('/products', async (req, res) => {
    try {
        const fs       = require('fs');
        const filePath = path.join(__dirname, 'product.json');

        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            return res.json(data);
        }

        // Fallback: seed data
        const productsData = [
            { id: 1,  name: 'Premium Arabica Blend',      price: 499, image: 'img/c1.png', category: 'blend',   description: 'Rich, smooth medium roast with caramel notes.' },
            { id: 2,  name: 'Cold Brew Concentrate',       price: 349, image: 'img/c2.png', category: 'cold',    description: 'Bold and refreshing cold brew, ready to dilute.' },
            { id: 3,  name: 'Signature Espresso Roast',    price: 599, image: 'img/c3.png', category: 'espresso',description: 'Dark, intense roast with a velvety crema.' },
            { id: 4,  name: 'Single Origin Ethiopia',      price: 749, image: 'img/c4.png', category: 'origin',  description: 'Fruity and floral, light roast from Yirgacheffe.' },
            { id: 5,  name: 'Instant Coffee Powder 200g',  price: 199, image: 'img/c5.png', category: 'instant', description: 'Premium instant blend for quick, quality cups.' },
            { id: 6,  name: 'Decaf Mountain Blend',        price: 449, image: 'img/c6.png', category: 'decaf',   description: 'All the flavour, none of the caffeine.' },
            { id: 7,  name: 'French Press Dark Roast',     price: 399, image: 'img/c7.png', category: 'blend',   description: 'Bold and full-bodied, perfect for French press.' },
            { id: 8,  name: 'Brew-n-Fill Gift Box',        price: 999, image: 'img/c8.png', category: 'gift',    description: 'Curated selection of 4 premium blends, beautifully packed.' },
        ];
        res.json(productsData);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ error: 'Failed to load products.' });
    }
});

// ─────────────────────────────────────────
// FRANCHISE ENQUIRY ROUTE
// ─────────────────────────────────────────

/**
 * POST /franchise-enquiry
 * Receives franchise form data and sends SMS to business owner via Twilio.
 */
app.post('/franchise-enquiry', async (req, res) => {
    const { name, email, phone, datetime, message } = req.body;

    // Basic validation
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const smsBody = `
🏪 New Franchise Enquiry — BREW-N-FILL®
━━━━━━━━━━━━━━━━━━━━━
Name    : ${name}
Email   : ${email || 'N/A'}
Phone   : ${phone}
Date    : ${datetime || 'Not specified'}
Message : ${message || 'No message provided'}
━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    try {
        const msg = await twilioClient.messages.create({
            body: smsBody,
            from: twilioPhoneNumber,
            to:   businessPhone,
        });
        console.log(`📱 Franchise SMS sent: ${msg.sid}`);
        res.json({ success: true, message: 'Enquiry received! We will contact you within 24 hours.' });
    } catch (err) {
        console.error('❌ Twilio SMS error:', err.message);
        // Still acknowledge the form submission
        res.json({ success: true, message: 'Enquiry received! We will contact you shortly.' });
    }
});

// ─────────────────────────────────────────
// RAZORPAY PAYMENT ROUTES
// ─────────────────────────────────────────

/**
 * POST /create-order
 * Creates a Razorpay order for the given cart total.
 */
app.post('/create-order', async (req, res) => {
    try {
        const Razorpay  = require('razorpay');
        const razorpay  = new Razorpay({
            key_id:     process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const { amount, currency = 'INR' } = req.body;

        const options = {
            amount:   Math.round(amount * 100), // Convert to paise
            currency: currency,
            receipt:  `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log(`💳 Razorpay order created: ${order.id}`);
        res.json(order);
    } catch (err) {
        console.error('❌ Razorpay error:', err.message);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
});

/**
 * POST /verify-payment
 * Verifies Razorpay payment signature after checkout.
 */
app.post('/verify-payment', (req, res) => {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    if (generatedSignature === razorpay_signature) {
        console.log(`✅ Payment verified: ${razorpay_payment_id}`);
        res.json({ success: true, message: 'Payment verified successfully.' });
    } else {
        res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }
});

// ─────────────────────────────────────────
// WATSON AI CHATBOT PROXY ROUTE
// ─────────────────────────────────────────

/**
 * POST /chat
 * Proxies user messages to IBM Watson Assistant and returns the reply.
 * Also triggers Flask sentiment analysis.
 */
app.post('/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    try {
        const AssistantV2    = require('ibm-watson/assistant/v2');
        const { IamAuthenticator } = require('ibm-watson/auth');
        const axios          = require('axios');

        const assistant = new AssistantV2({
            version:       '2023-06-15',
            authenticator: new IamAuthenticator({ apikey: process.env.WATSON_API_KEY }),
            serviceUrl:    process.env.WATSON_SERVICE_URL,
        });

        // Get or create Watson session
        let session = sessionId;
        if (!session) {
            const s = await assistant.createSession({ assistantId: process.env.WATSON_ASSISTANT_ID });
            session = s.result.session_id;
        }

        // Send message to Watson
        const watsonResponse = await assistant.message({
            assistantId: process.env.WATSON_ASSISTANT_ID,
            sessionId:   session,
            input: { message_type: 'text', text: message },
        });

        const reply = watsonResponse.result.output.generic
            .filter(r => r.response_type === 'text')
            .map(r => r.text)
            .join('\n');

        // Async: Analyze sentiment via Flask (non-blocking)
        let sentiment = 'neutral';
        try {
            const flaskRes = await axios.post(
                `${process.env.FLASK_SERVICE_URL || 'http://localhost:5000'}/analyze-sentiment`,
                { message },
                { timeout: 3000 }
            );
            sentiment = flaskRes.data.sentiment;
        } catch (_) { /* Flask optional */ }

        res.json({ reply, sessionId: session, sentiment });

    } catch (err) {
        console.error('❌ Watson error:', err.message);
        res.status(500).json({ error: 'Chatbot unavailable. Please try again.' });
    }
});

// ─────────────────────────────────────────
// CUSTOMER SUPPORT TICKETING
// ─────────────────────────────────────────

// In-memory store (replace with MongoDB Ticket model in production)
let tickets = [];
let ticketCounter = 1000;

/**
 * POST /tickets
 * Creates a new support ticket.
 */
app.post('/tickets', (req, res) => {
    const { name, email, phone, category, priority, description } = req.body;

    const ticket = {
        ticketId:    `TKT-${Date.now()}-${ticketCounter++}`,
        customer:    { name, email, phone },
        category:    category || 'general',
        priority:    priority || 'medium',
        status:      'open',
        description,
        createdAt:   new Date().toISOString(),
        resolvedAt:  null,
    };

    tickets.push(ticket);
    console.log(`🎫 Ticket created: ${ticket.ticketId}`);

    // Notify business via SMS for high/urgent tickets
    if (['high', 'urgent'].includes(priority)) {
        twilioClient.messages.create({
            body: `🚨 ${priority.toUpperCase()} Support Ticket: ${ticket.ticketId}\nFrom: ${name} (${phone})\nCategory: ${category}\n"${description?.substring(0, 80)}..."`,
            from: twilioPhoneNumber,
            to:   businessPhone,
        }).catch(err => console.error('Ticket SMS error:', err.message));
    }

    res.json({ success: true, ticket });
});

/**
 * GET /tickets
 * Returns all tickets (admin use).
 */
app.get('/tickets', (req, res) => {
    res.json(tickets);
});

/**
 * PATCH /tickets/:id
 * Updates ticket status.
 */
app.patch('/tickets/:id', (req, res) => {
    const { status } = req.body;
    const ticket = tickets.find(t => t.ticketId === req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    ticket.status     = status;
    ticket.resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
    res.json({ success: true, ticket });
});

// ─────────────────────────────────────────
// WHATSAPP ORDER WEBHOOK (Twilio)
// ─────────────────────────────────────────

/**
 * POST /whatsapp-webhook
 * Receives incoming WhatsApp messages from Twilio.
 * Routes through Watson and handles order intents.
 */
app.post('/whatsapp-webhook', async (req, res) => {
    const twiml       = new twilio.twiml.MessagingResponse();
    const incomingMsg = req.body.Body?.trim() || '';
    const from        = req.body.From;

    console.log(`📱 WhatsApp message from ${from}: "${incomingMsg}"`);

    // Simple keyword routing (extend with Watson for full NLU)
    let reply = 'Welcome to BREW-N-FILL® ☕ Reply with:\n1️⃣ ORDER — to place an order\n2️⃣ TRACK — to track your order\n3️⃣ MENU — to see our products\n4️⃣ HELP — for support';

    const msg = incomingMsg.toLowerCase();
    if (msg.includes('menu') || msg === '3') {
        reply = '☕ BREW-N-FILL® Menu:\n\n1. Premium Arabica Blend — ₹499\n2. Cold Brew Concentrate — ₹349\n3. Signature Espresso Roast — ₹599\n4. Single Origin Ethiopia — ₹749\n\nReply with the number to order!';
    } else if (msg.includes('order') || msg === '1') {
        reply = '🛒 Great! Visit our website to place your order:\n👉 https://brew-n-fill.com/products\n\nOr tell me what you want to order!';
    } else if (msg.includes('track') || msg === '2') {
        reply = '📦 To track your order, please share your Order ID (e.g., BNF-12345).';
    } else if (msg.includes('help') || msg === '4') {
        reply = '🆘 Our team is here to help!\nCall us: +91 8125268128\nEmail: contact@brew-n-fill.com\nHours: Mon–Sat 9AM–9PM';
    }

    twiml.message(reply);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// ─────────────────────────────────────────
// NEWSLETTER SUBSCRIPTION
// ─────────────────────────────────────────
const subscribers = [];

app.post('/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required.' });
    if (!subscribers.includes(email)) subscribers.push(email);
    console.log(`📧 New subscriber: ${email}`);
    res.json({ success: true, message: 'Subscribed! Thank you for joining BREW-N-FILL®.' });
});

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status:    'ok',
        service:   'BREW-N-FILL® E-Commerce API',
        timestamp: new Date().toISOString(),
        uptime:    `${Math.floor(process.uptime())}s`,
    });
});

// ─────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

// ─────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
});

// ─────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║  ☕ BREW-N-FILL® E-Commerce Server       ║
║  🚀 Running on http://localhost:${PORT}     ║
║  📦 Environment: ${process.env.NODE_ENV || 'development'}           ║
╚══════════════════════════════════════════╝
    `);
});

module.exports = app;
