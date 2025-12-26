const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// 14. ADMIN LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }

        const admin = rows[0];

        const match = await bcrypt.compare(password, admin.password_hash);

        if (match) {
            const token = jwt.sign({ role: 'admin', id: admin.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Invalid admin credentials' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. ADMIN STATS
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [userRows] = await db.query('SELECT COUNT(*) as count FROM users');
        const [subRows] = await db.query('SELECT COUNT(*) as count FROM subscriptions WHERE expiry_date > NOW()');
        const [revRows] = await db.query('SELECT SUM(price_paid) as total FROM subscriptions');
        const [recentUsers] = await db.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');

        res.json({
            totalUsers: userRows[0].count,
            activeSubs: subRows[0].count,
            totalRevenue: revRows[0].total || 0,
            recentUsers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. ADMIN USERS LIST
router.get('/users', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query(`
        SELECT
        u.id, u.full_name, u.email, u.phone_number, u.age, u.password_hash, u.created_at, u.is_active,
            (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id) as purchase_count,
            (SELECT SUM(price_paid) FROM subscriptions s WHERE s.user_id = u.id) as total_spent,
            (SELECT p.name FROM subscriptions s JOIN subscription_plans p ON s.plan_id = p.id WHERE s.user_id = u.id AND s.expiry_date > NOW() ORDER BY s.expiry_date DESC LIMIT 1) as active_plan,
            (SELECT s.expiry_date FROM subscriptions s WHERE s.user_id = u.id AND s.expiry_date > NOW() ORDER BY s.expiry_date DESC LIMIT 1) as plan_expiry
            FROM users u
            ORDER BY u.created_at DESC
    `);
        res.json(users);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: err.message });
    }
});

// 11. ADMIN DELETE USER
router.delete('/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM subscriptions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM transactions WHERE user_id = ?', [id]);
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 12. ADMIN ADD USER
router.post('/users', verifyToken, async (req, res) => {
    const { name, email, password, phone, age } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password_hash, phone_number, age) VALUES (?, ?, ?, ?, ?)',
            [name, email, hash, phone, age]
        );
        res.json({ id: result.insertId, message: 'User created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 13. ADMIN TRANSACTIONS
router.get('/transactions', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.order_id, t.amount, t.status, t.created_at, u.full_name as user_name, u.email as user_email 
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 14. ADMIN: BLOCK/UNBLOCK USER
router.put('/users/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body; // Expect boolean
    try {
        await db.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive, id]);
        res.json({ success: true, message: `User ${isActive ? 'unblocked' : 'blocked'}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 15. ADMIN: UPDATE PASSWORD
router.put('/users/:id/password', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    try {
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 16. ADMIN: GET USER SUBSCRIPTIONS
router.get('/users/:id/subscriptions', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [subs] = await db.query('SELECT * FROM subscriptions WHERE user_id = ?', [id]);
        res.json(subs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 17. ADMIN: GRANT SUBSCRIPTION (FREE)
router.post('/users/:id/subscription', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { layoutId, months } = req.body; // months defaults to 1 if not sent
    try {
        const startDate = new Date();
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + (months || 1));

        await db.query(
            `INSERT INTO subscriptions(user_id, layout_id, plan_id, start_date, expiry_date, price_paid, public_token)
VALUES(?, ?, 'gift', ?, ?, 0, UUID())`,
            [id, layoutId, startDate, expiryDate]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 18. ADMIN: EXTEND SUBSCRIPTION
router.put('/users/:id/subscription', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { subId, months } = req.body;
    try {
        await db.query(
            `UPDATE subscriptions SET expiry_date = DATE_ADD(expiry_date, INTERVAL ? MONTH) WHERE id = ? AND user_id = ? `,
            [months || 1, subId, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 18b. ADMIN: REVOKE SUBSCRIPTION
router.put('/users/:id/subscription/revoke', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query(
            "UPDATE subscriptions SET status = 'EXPIRED', expiry_date = NOW() WHERE user_id = ? AND status = 'ACTIVE' AND expiry_date > NOW()",
            [id]
        );
        res.json({ success: true, message: "Subscription revoked" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 19. ADMIN: GET COUPONS
router.get('/coupons', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, l.name as layout_name 
            FROM coupons c 
            LEFT JOIN layouts l ON c.layout_id = l.id 
            ORDER BY c.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 20. ADMIN: CREATE COUPON
router.post('/coupons', verifyToken, async (req, res) => {
    const { code, discount_type, discount_value, description, layout_id } = req.body;
    try {
        await db.query(
            `INSERT INTO coupons(code, discount_type, discount_value, description, layout_id)
VALUES(?, ?, ?, ?, ?)`,
            [code, discount_type, discount_value, description, layout_id || null]
        );
        res.json({ success: true, message: 'Coupon created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 21. ADMIN: DELETE COUPON
router.delete('/coupons/:code', verifyToken, async (req, res) => {
    const { code } = req.params;
    try {
        await db.query('DELETE FROM coupons WHERE code = ?', [code]);
        res.json({ success: true, message: 'Coupon deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// 22a. ADMIN: GET ALL LAYOUTS
router.get('/layouts', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM layouts ORDER BY id");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 22. ADMIN: UPDATE LAYOUT
router.put('/layouts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { base_price, price_1mo, price_3mo, price_6mo, price_1yr, is_active, thumbnail_url } = req.body;

    // Build dynamic query
    let fields = [];
    let values = [];

    if (base_price !== undefined) {
        fields.push("base_price = ?");
        values.push(base_price);
    }
    // New Price Columns
    if (price_1mo !== undefined) { fields.push("price_1mo = ?"); values.push(price_1mo); }
    if (price_3mo !== undefined) { fields.push("price_3mo = ?"); values.push(price_3mo); }
    if (price_6mo !== undefined) { fields.push("price_6mo = ?"); values.push(price_6mo); }
    if (price_1yr !== undefined) { fields.push("price_1yr = ?"); values.push(price_1yr); }

    if (is_active !== undefined) {
        fields.push("is_active = ?");
        values.push(is_active ? 1 : 0); // Force to integer 1/0
    }

    if (thumbnail_url !== undefined) {
        fields.push("thumbnail_url = ?");
        values.push(thumbnail_url);
    }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    try {
        const sql = `UPDATE layouts SET ${fields.join(', ')} WHERE id = ? `;
        await db.query(sql, values);
        res.json({ success: true, message: 'Layout updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 23. ADMIN: CREATE LAYOUT
router.post('/layouts', verifyToken, async (req, res) => {
    const { id, name, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url } = req.body;

    if (!id || !name || base_price === undefined) {
        return res.status(400).json({ error: "Missing required fields (id, name, base_price)" });
    }

    // Default other prices if not provided (fallback logic)
    const p1 = price_1mo || base_price * 1;
    const p3 = price_3mo || base_price * 2.5;
    const p6 = price_6mo || base_price * 4.5;
    const p12 = price_1yr || base_price * 8;

    try {
        await db.query(
            `INSERT INTO layouts(id, name, base_price, price_1mo, price_3mo, price_6mo, price_1yr, thumbnail_url, is_active)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [id, name, base_price, p1, p3, p6, p12, thumbnail_url || null]
        );
        res.json({ success: true, message: 'Layout created' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Layout ID already exists" });
        }
        res.status(500).json({ error: err.message });
    }
});


// 19. ADMIN: MANAGE SUPPORT QUERIES
// Get all queries
router.get('/support', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM support_queries ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Status
router.put('/support/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query("UPDATE support_queries SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Support Query
router.delete('/support/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM support_queries WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 24. ADMIN: PRODUCT MANAGEMENT
router.get('/products', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM products ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/products', verifyToken, async (req, res) => {
    const { name, description, price, file_url, file_type, thumbnail_url, is_active } = req.body;
    try {
        await db.query(
            "INSERT INTO products (name, description, price, file_url, file_type, thumbnail_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [name, description, price, file_url, file_type, thumbnail_url, is_active ? 1 : 0]
        );
        res.json({ success: true, message: 'Product created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/products/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, file_url, file_type, thumbnail_url, is_active } = req.body;

    // Dynamic Update
    let fields = [];
    let values = [];
    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (price !== undefined) { fields.push("price = ?"); values.push(price); }
    if (file_url !== undefined) { fields.push("file_url = ?"); values.push(file_url); }
    if (file_type !== undefined) { fields.push("file_type = ?"); values.push(file_type); }
    if (thumbnail_url !== undefined) { fields.push("thumbnail_url = ?"); values.push(thumbnail_url); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    try {
        await db.query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
        res.json({ success: true, message: 'Product updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/products/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM products WHERE id = ?", [id]);
        res.json({ success: true, message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 25. ADMIN: MANAGE PLANS
router.get('/plans', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM subscription_plans ORDER BY display_order");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/plans/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, duration_months, is_active } = req.body;

    let fields = [];
    let values = [];

    if (name !== undefined) { fields.push("name = ?"); values.push(name); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (price !== undefined) { fields.push("price = ?"); values.push(price); }
    if (duration_months !== undefined) { fields.push("duration_months = ?"); values.push(duration_months); }
    if (is_active !== undefined) { fields.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(id);

    try {
        await db.query(`UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = ?`, values);
        res.json({ success: true, message: 'Plan updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
