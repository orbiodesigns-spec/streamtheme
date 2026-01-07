const readline = require('readline');
const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in Node 18+

// Configuration
const API_URL = 'http://localhost:5000/api';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Himanshu@k9311995415';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
    console.log("--- StreamTheme Layout Registration ---");

    // 1. Login as Admin
    console.log("Authenticating...");
    try {
        const loginRes = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS })
        });

        if (!loginRes.ok) throw new Error("Admin login failed");
        const { token } = await loginRes.json();
        console.log("Authentication successful.\n");

        // 2. Get Layout Details
        const id = await ask("Enter Layout ID (e.g., 'galaxy-theme'): ");
        if (!id) throw new Error("ID is required");

        const name = await ask("Enter Layout Name (e.g., 'Galaxy Theme'): ");
        if (!name) throw new Error("Name is required");

        const priceInput = await ask("Enter Base Price (INR) [Default: 0]: ");
        const base_price = parseFloat(priceInput) || 0;

        const desc = await ask("Enter Description (Optional): ");

        // 3. Register Layout
        console.log("\nRegistering layout...");
        const res = await fetch(`${API_URL}/admin/layouts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id,
                name,
                base_price,
                description: desc,
                thumbnail_url: null // Can be updated later via Admin Panel
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to register layout");
        }

        console.log(`\n✅ Success! Layout '${name}' (${id}) registered.`);
        console.log("Restart your dashboard if you don't see it immediately.");

    } catch (err) {
        console.error("\n❌ Error:", err.message);
    } finally {
        rl.close();
    }
}

main();
