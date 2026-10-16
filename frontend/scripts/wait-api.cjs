// Used by `npm run dev`: holds vite back until the API accepts connections, so the page never calls an API that is still starting.
const net = require('net');

const PORT = Number(process.env.PORT) || 5000; // same port vite.config.js proxies /api to
const GIVE_UP_MS = 60000;
const started = Date.now();

const tryOnce = () => {
  const socket = net.connect(PORT, '127.0.0.1');
  socket.once('connect', () => { socket.destroy(); process.exit(0); });
  socket.once('error', () => {
    socket.destroy();
    if (Date.now() - started > GIVE_UP_MS) {
      console.error(`API chưa chạy sau ${GIVE_UP_MS / 1000}s. Xem dòng [api] phía trên để biết lỗi (thường là MongoDB).`);
      process.exit(1);
    }
    setTimeout(tryOnce, 500);
  });
};
tryOnce();
