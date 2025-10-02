const { spawn } = require('child_process');
const path = require('path');

// Використовуємо PORT змінну від Railway
const port = process.env.PORT || 8080;

console.log(`🚀 Starting Photo Filter WASM on port ${port}`);
console.log(`🔍 Railway PORT env:`, process.env.PORT);
console.log(`📋 All env vars:`, Object.keys(process.env).filter(k => k.includes('PORT')));

// Запускаємо serve з правильним портом
const serve = spawn('npx', ['serve', '.', '-s', '-l', port.toString()], {
    stdio: 'inherit',
    shell: true
});

serve.on('error', (error) => {
    console.error('❌ Failed to start serve:', error);
    process.exit(1);
});

serve.on('exit', (code) => {
    console.log(`📤 Serve exited with code ${code}`);
    process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    serve.kill('SIGTERM');
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully');
    serve.kill('SIGINT');
});
