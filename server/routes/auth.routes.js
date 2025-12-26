const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { sendVerificationEmail } = require('../utils/emailService');
const { verifyToken } = require('../middleware/authMiddleware');

function log(message, type = 'INFO') {
    console.log(`[${new Date().toISOString()}] [${type}] ${message}`);
}

// 2. REGISTER
router.post('/register', async (req, res) => {
    const { name, email, password, phone, age } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

        const hash = await bcrypt.hash(password, 10);
        const verificationToken = require('crypto').randomUUID();

        await db.query(
            'INSERT INTO users (full_name, email, password_hash, phone_number, age, verification_token, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, hash, phone, age, verificationToken, false]
        );

        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationToken);

        if (!emailSent) {
            log(`Warning: User registered but email failed to send: ${email}`, 'WARN');
        }

        res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2b. VERIFY EMAIL
router.post('/verify', async (req, res) => {
    const { token } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE verification_token = ?', [token]);
        if (users.length === 0) return res.status(400).json({ error: 'Invalid token' });

        await db.query('UPDATE users SET is_email_verified = TRUE, verification_token = NULL WHERE id = ?', [users[0].id]);
        res.json({ success: true, message: 'Email verified successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        if (!user.is_email_verified) {
            return res.status(403).json({ error: 'Email not verified. Please check your inbox.' });
        }

        // Check active subscription
        const [subs] = await db.query('SELECT * FROM subscriptions WHERE user_id = ? AND status = "ACTIVE" AND expiry_date > NOW()', [user.id]);
        const hasActiveSub = subs.length > 0;

        // Check trial
        const hasTrial = user.trial_expiry && new Date(user.trial_expiry) > new Date();

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Set Cookie (30 Days)
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
        });

        res.json({
            id: user.id.toString(),
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            hasAccess: hasActiveSub || hasTrial,
            accessType: hasActiveSub ? 'SUBSCRIPTION' : (hasTrial ? 'TRIAL' : 'NONE'),
            trialUsed: user.trial_used,
            token
        });

    } catch (err) {
        log(`Login Failed: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// 3a. GET ME (Refresh Profile)
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];

        // Get Subscriptions
        const [subs] = await db.query(`
            SELECT s.*, p.name as layoutName, p.description as layoutDescription 
            FROM subscriptions s 
            LEFT JOIN layouts p ON s.layout_id = p.id
            WHERE s.user_id = ? AND s.status = 'ACTIVE'
        `, [user.id]);

        // Get Theme Configs
        // Get Theme Configs
        const [configs] = await db.query('SELECT * FROM theme_customizations WHERE user_id = ?', [user.id]);

        let purchases = subs.map(sub => {
            // Relaxed matching: Find ANY config for this layout, priority to matching token
            const config = configs.find(c => c.layout_id === sub.layout_id && c.public_token === sub.public_token) ||
                configs.find(c => c.layout_id === sub.layout_id);

            return {
                layoutId: sub.layout_id || 'master-standard',
                purchaseDate: sub.start_date,
                expiryDate: sub.expiry_date,
                durationLabel: sub.plan_id,
                pricePaid: sub.price_paid,
                publicToken: sub.public_token,
                savedThemeConfig: config ? config.config : null
            };
        });

        // Inject Trial Access if Active
        const hasTrial = user.trial_expiry && new Date(user.trial_expiry) > new Date();
        if (hasTrial) {
            const trialLayoutId = 'master-standard';
            // Check if already covered by sub
            const hasSub = purchases.some(p => p.layoutId === trialLayoutId);

            if (!hasSub) {
                const config = configs.find(c => c.layout_id === trialLayoutId);
                purchases.push({
                    layoutId: trialLayoutId,
                    purchaseDate: new Date(), // Now
                    expiryDate: user.trial_expiry,
                    durationLabel: 'trial',
                    pricePaid: 0,
                    publicToken: config ? config.public_token : null, // Uses theme token if saved
                    savedThemeConfig: config ? config.config : null
                });
            }
        }

        res.json({
            id: user.id.toString(),
            name: user.full_name,
            email: user.email,
            phone: user.phone_number,
            age: user.age,
            purchases: purchases
        });

    } catch (err) {
        log(`GetMe Failed: ${err.message}`, 'ERROR');
        res.status(500).json({ error: err.message });
    }
});

// 4. UPDATE PROFILE
router.put('/profile', verifyToken, async (req, res) => {
    const { name, phone, age } = req.body;
    try {
        await db.query(
            "UPDATE users SET full_name = ?, phone_number = ?, age = ? WHERE id = ?",
            [name, phone, age, req.user.id]
        );
        res.json({ success: true, message: "Profile updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});

// 6. FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = users[0];
        const resetToken = require('crypto').randomUUID();
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1); // 1 Hour

        await db.query('UPDATE users SET password_reset_token = ?, password_reset_expiry = ? WHERE id = ?', [resetToken, expiry, user.id]);

        await require('../utils/emailService').sendPasswordResetEmail(email, resetToken);

        res.json({ success: true, message: 'Password reset email sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expiry > NOW()', [token]);
        if (users.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

        const user = users[0];
        const hash = await bcrypt.hash(newPassword, 10);

        await db.query('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expiry = NULL WHERE id = ?', [hash, user.id]);

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
