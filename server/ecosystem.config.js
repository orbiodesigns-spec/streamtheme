module.exports = {
    apps: [{
        name: "server",
        script: "./server.js",
        instances: 1, // 1 CPU = 1 Instance
        exec_mode: "fork",
        node_args: "--max-old-space-size=350", // Optimize V8 for low memory
        // 1GB RAM Total. Give buffer for OS/MySQL. 
        // Restart if it leaks over 400M to prevent system crash.
        max_memory_restart: "400M",
        env: {
            NODE_ENV: "production",
            DB_CONN_LIMIT: 5 // Explicitly set low connection limit
        }
    }]
};
