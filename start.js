const { spawn } = require('child_process');
const path = require('path');

// Використовуємо PORT змінну від Railway
const port = process.env.PORT || 8080;

// Запускаємо serve з правильним портом
const serve = spawn('npx', ['serve', '.', '-s', '-l', port.toString()], {
    stdio: 'inherit',
    shell: true
});

serve.on('error', (error) => {
    process.exit(1);
});

serve.on('exit', (code) => {
    process.exit(code);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    serve.kill('SIGTERM');
});

process.on('SIGINT', () => {
    serve.kill('SIGINT');
});
