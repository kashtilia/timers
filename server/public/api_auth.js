import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db } from "./api_database.js";
import express from "express";

export const router = express.Router();

// Сгенерировать хэш пароля
export const getHash = (s) => crypto.createHash("sha256").update(s).digest("hex");

// Сгенерировать секретный ключ
const generateSecretKey = () => crypto.randomBytes(32).toString("hex");

// Секретный ключ
const secretKey = generateSecretKey();

// Получить токен из заголовков
export const getToken = (req) => req.headers.authorization;

// Сгенерировать токен
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
    },
    secretKey,
    { expiresIn: "10m" }
  );
};

// Верифицировать токен
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};

// Middleware аутентификации
export const authMW = () => async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).send("Пользователь не авторизован");
  }

  const blackListToken = await db.findBlacklistToken(token);

  if (blackListToken) {
    return res.status(401).send("Токен недействителен");
  }

  req.user = verifyToken(token);
  req.token = token;
  next();
};

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUserByUsername(username);

  if (!user || user.password !== getHash(password)) {
    return res.status(403).send("Некорректный логин или пароль");
  }

  const token = generateToken(user);
  return res.cookie("auth_token", token).send();
});

router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.findUserByUsername(username);

  if (user || !username || !password) {
    return res.status(403).send("Пользователь с таким логином уже существует");
  }

  const userId = await db.createUser({
    username,
    password: getHash(password),
  });

  const newUser = await db.findUserById(userId);

  const token = generateToken(newUser);
  return res.cookie("auth_token", token).send();
});

router.get("/logout", authMW(), async (req, res) => {
  if (req.user) {
    await db.addTokenToBlackList(req.token);
    res.clearCookie("auth_token");
  }
  return res.json({test: "test"});
});
