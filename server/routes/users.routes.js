const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const Razorpay = require('razorpay');
const { sendTrialStartedEmail, sendSubscriptionActivatedEmail } = require('../utils/emailService');

function log(message, type = 'INFO') {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// NEW: Check Global Access (Protected)
router.get('/access-status', verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // Check active subscription
        const [subs] = await db.query('SELECT * FROM subscriptions WHERE user_id = ? AND status = "ACTIVE" AND expiry_date > NOW()', [userId]);
        const hasActiveSub = subs.length > 0;

        // Check trial
        const [users] = await db.query('SELECT trial_expiry, trial_used FROM users WHERE id = ?', [userId]);
        const hasTrial = users[0].trial_expiry && new Date(users[0].trial_expiry) > new Date();

        res.json({
            hasAccess: hasActiveSub || hasTrial,
            accessType: hasActiveSub ? 'SUBSCRIPTION' : (hasTrial ? 'TRIAL' : 'NONE'),
            expiry: hasActiveSub ? subs[0].expiry_date : (hasTrial ? users[0].trial_expiry : null),
            trialUsed: users[0].trial_used
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3b. START TRIAL
// 3b. START TRIAL
router.post('/trial/start', verifyToken, async (req, res) => {
    const userId = req.user.id;
    log(`[TRIAL] Request from User ID: ${userId}`, 'DEBUG');
    try {
        const [users] = await db.query('SELECT full_name, email, trial_used, trial_expiry FROM users WHERE id = ?', [userId]);
        log(`[TRIAL] User State: ${JSON.stringify(users[0])}`, 'DEBUG');

        if (users[0].trial_used) {
            log(`[TRIAL] Failed: Trial already used`, 'WARN');
            return res.status(400).json({ error: 'Trial already used' });
        }

        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 24);

        await db.query('UPDATE users SET trial_used = TRUE, trial_expiry = ? WHERE id = ?', [expiry, userId]);
        log(`[TRIAL] Success: Activated until ${expiry}`, 'INFO');

        // Send Email
        await sendTrialStartedEmail(users[0].email, users[0].full_name, expiry);

        res.json({ success: true, expiry: expiry.toISOString() });
    } catch (err) {
        log(`[TRIAL] Error: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// 7. CREATE PAYMENT ORDER
router.post('/payment/create-order', verifyToken, async (req, res) => {
    const { planId, customerPhone } = req.body;
    log(`[PAYMENT] Create Order for Plan: ${planId}, User: ${req.user.id}`, 'DEBUG');

    try {
        const [plans] = await db.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
        if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
        const plan = plans[0];

        // Ensure amount is in Paise
        const amountPaise = Math.round(parseFloat(plan.price) * 100);

        const options = {
            amount: amountPaise,
            currency: "INR",
            receipt: `rcpt_${req.user.id}_${Date.now()}`,
            notes: { userId: req.user.id.toString(), planId, email: req.user.email }
        };

        const order = await razorpay.orders.create(options);
        log(`[PAYMENT] Order Created: ${order.id} Amount: ${order.amount}`, 'INFO');

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            contact: customerPhone,
            email: req.user.email,
            planId: planId
        });
    } catch (err) {
        log(`[PAYMENT] Create Error: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// 8. VERIFY PAYMENT
// 8. VERIFY PAYMENT
router.post('/payment/verify', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
    log(`[PAYMENT] Verify Request: ${razorpay_order_id}`, 'DEBUG');

    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = require('crypto')
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            log(`[PAYMENT] Signature Mismatch! Expected: ${expectedSignature}, Got: ${razorpay_signature}`, 'ERROR');
            return res.status(400).json({ status: 'FAILED', message: 'Invalid Signature' });
        }

        const [plans] = await db.query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
        const plan = plans[0];
        const now = new Date();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + plan.duration_months);
        const publicToken = require('crypto').randomUUID();

        await db.query(`
            INSERT INTO subscriptions (user_id, layout_id, plan_id, start_date, expiry_date, price_paid, order_id, payment_id, status, public_token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
        `, [req.user.id, 'master-standard', planId, now, expiry, plan.price, razorpay_order_id, razorpay_payment_id, publicToken]);

        log(`[PAYMENT] Subscription Activated for User ${req.user.id}`, 'INFO');

        // Fetch User Info for Email
        const [users] = await db.query('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
        if (users.length > 0) {
            await sendSubscriptionActivatedEmail(users[0].email, users[0].full_name, plan.name, expiry, plan.price);
        }

        res.json({ status: 'SUCCESS', message: 'Subscription Activated!' });
    } catch (err) {
        log(`[PAYMENT] Verify Error: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// --- THEME CONFIG (Saving edits) ---
router.post('/purchases/config', verifyToken, async (req, res) => {
    const { layoutId, config } = req.body;
    const userId = req.user.id;

    try {
        // Use UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
        // Check if layout exists first in user_layout unique key
        let [rows] = await db.query(
            "SELECT id FROM theme_customizations WHERE user_id = ? AND layout_id = ?",
            [userId, layoutId]
        );

        if (rows.length > 0) {
            await db.query(
                "UPDATE theme_customizations SET config = ? WHERE id = ?",
                [JSON.stringify(config), rows[0].id]
            );
        } else {
            // Need a public token
            const publicToken = require('crypto').randomUUID();
            await db.query(
                "INSERT INTO theme_customizations (user_id, layout_id, config, public_token) VALUES (?, ?, ?, ?)",
                [userId, layoutId, JSON.stringify(config), publicToken]
            );
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. CREATE PRODUCT ORDER
router.post('/payment/create-product-order', verifyToken, async (req, res) => {
    const { productId, contact } = req.body;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (products.length === 0) return res.status(404).json({ error: 'Product not found' });
        const product = products[0];

        // Ensure amount is in Paise
        const amountPaise = Math.round(parseFloat(product.price) * 100);

        const options = {
            amount: amountPaise,
            currency: "INR",
            receipt: `prod_${req.user.id}_${Date.now()}`,
            notes: { userId: req.user.id.toString(), productId: productId.toString(), type: 'product' }
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            contact: contact,
            email: req.user.email,
            productId: productId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. VERIFY PRODUCT PAYMENT
router.post('/payment/verify-product', verifyToken, async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, productId } = req.body;
    try {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = require('crypto')
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ status: 'FAILED', message: 'Invalid Signature' });
        }

        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        const product = products[0];

        // Record Purchase
        await db.query(`
            INSERT INTO product_purchases (user_id, product_id, transaction_id, price_paid)
            VALUES (?, ?, ?, ?)
        `, [req.user.id, productId, razorpay_payment_id, product.price]);

        // Return the secure link
        res.json({
            status: 'SUCCESS',
            message: 'Purchase Successful!',
            fileUrl: product.file_url
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
