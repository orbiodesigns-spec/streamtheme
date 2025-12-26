require('dotenv').config();
const { db } = require('./config/db');

async function debugSupport() {
    try {
        console.log('--- TABLE SCHEMA ---');
        const [columns] = await db.query("SHOW COLUMNS FROM support_queries");
        console.table(columns);

        console.log('\n--- DATA ---');
        const [rows] = await db.query("SELECT * FROM support_queries");
        console.table(rows);

        // Try a test update
        if (rows.length > 0) {
            const id = rows[0].id;
            console.log(`\nAttempting to update ID ${id} to CLOSED...`);
            await db.query("UPDATE support_queries SET status = 'CLOSED' WHERE id = ?", [id]);
            console.log("Update SUCCESS");

            console.log(`Attempting to update ID ${id} to OPEN...`);
            await db.query("UPDATE support_queries SET status = 'OPEN' WHERE id = ?", [id]);
            console.log("Update SUCCESS");
        } else {
            console.log("No rows to test update on.");
        }

        process.exit(0);

    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
}

debugSupport();
