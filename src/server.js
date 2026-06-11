require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');
const pool = require('./config/db');

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await pool.end();
      console.log('Database pool closed');
    } catch (err) {
      console.error('Error closing database pool:', err);
    }

    process.exit(0);
  });

  // Force exit if connections don't drain within 10 s
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
