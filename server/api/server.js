import express from "express";
import { db } from "./api_database.js";
import http from "http";
import compression from 'compression';
import helmet from 'helmet';
import { WebSocketServer } from "ws";
import { router as routerAuth, getToken, verifyToken } from "./api_auth.js";
import { router as routerTimers } from "./api_timers.js";
import crypto from "crypto";

const app = express();
const generateNonce = () => crypto.randomBytes(16).toString('base64');
const nonce = generateNonce();

app.use(compression());
app.use(helmet());

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}'; script-src-elem 'self' https://vercel.live 'nonce-${nonce}';`,
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const server = http.createServer(app);

const wss = new WebSocketServer({
  clientTracking: false,
  noServer: true,
});

const clients = new Map();

app.use("/", routerAuth);
app.use("/", routerTimers);

// Событие запроса смены (апгрейда) протокола соединения на веб-сокет
server.on("upgrade", async (req, socket, head) => {
  const token = getToken(req);
  let user;

  if (token) {
    const blackListToken = await db.findBlacklistToken(token);
    if (!blackListToken) user = verifyToken(token);
  }

  if (!user) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  req.user = user;
  req.token = token;

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// Отправить список таймеров по веб-сокету
export const wsSendTimers = async (title, userId, isActive) => {
  const timers = await db.getTimers(userId, isActive);

  for (const ws of clients.values()) {
    ws.send(JSON.stringify({ title, timers }));
  }
};

// Событие соединения по веб-сокету
wss.on("connection", async (ws, req) => {
  const { user } = req;
  clients.set(user.id, ws);

  ws.on("close", () => {
    clients.delete(user.id);
  });

  await wsSendTimers("all_timers", user.id);

  setInterval(() => wsSendTimers("active_timers", user.id, true), 1000);
});

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`);
});
