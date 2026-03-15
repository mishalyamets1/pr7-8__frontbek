const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

let users = [];
let products = [];
let refreshTokens = [];

const JWT_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

app.use(express.json());

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      console.log('Body:', req.body);
    }
  });
  next();
});

function findUserOr404(username, res) {
  const user = users.find(u => u.username === username);
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return null;
  }
  return user;
}

async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API AUTH',
      version: '1.0.0',
      description: 'Пример API для регистрации/логина и CRUD товаров',
    },
    servers: [
      { url: `http://localhost:${port}`, description: 'Локальный сервер' }
    ],
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, age]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Пользователь создан
 */
app.post('/api/auth/register', async (req, res) => {
  const { username, age, password } = req.body;
  if (!username || !password || age === undefined) {
    return res.status(400).json({ error: 'username, password and age are required' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'username already exists' });
  }
  const newUser = {
    id: nanoid(),
    username: username,
    age: Number(age),
    hashedPassword: await hashPassword(password)
  };
  users.push(newUser);
  const out = { ...newUser };
  delete out.hashedPassword;
  res.status(201).json(out);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Логин пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
  const user = findUserOr404(username, res);
  if (!user) return;
  const isAuthenticated = await verifyPassword(password, user.hashedPassword);
  if (isAuthenticated) return res.status(200).json({ login: true });
  return res.status(401).json({ error: 'not authenticated' });
});

// Products CRUD
app.post('/api/products', (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || price === undefined) return res.status(400).json({ error: 'title and price required' });
  const p = { id: nanoid(), title, category, description, price };
  products.push(p);
  res.status(201).json(p);
});

// --- JWT: issue tokens and protected route ---
function generateAccessToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function generateRefreshToken(user) {
  const token = jwt.sign({ sub: user.id, username: user.username }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  refreshTokens.push(token);
  return token;
}

app.post('/api/auth/login-tokens', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password are required' });
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.hashedPassword);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/login-tokens:
 *   post:
 *     summary: Получить access и refresh токены
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Токены выданы
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 */

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе (защищённый)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *       401:
 *         description: Отсутствует или недействительный токен
 */

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  if (!refreshTokens.includes(refreshToken)) return res.status(401).json({ error: 'Invalid refresh token' });
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить access token с помощью refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Новый access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 */

app.post('/api/auth/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });
  refreshTokens = refreshTokens.filter(t => t !== refreshToken);
  res.status(204).end();
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Разлогиниться (отозвать refresh token)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       204:
 *         description: Успешно
 */

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'product not found' });
  res.json(p);
});

app.put('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'product not found' });
  const { title, category, description, price } = req.body;
  if (title !== undefined) p.title = title;
  if (category !== undefined) p.category = category;
  if (description !== undefined) p.description = description;
  if (price !== undefined) p.price = price;
  res.json(p);
});

app.delete('/api/products/:id', (req, res) => {
  const idx = products.findIndex(x => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'product not found' });
  products.splice(idx, 1);
  res.status(204).end();
});

function tryListen(p, maxAttempts = 5) {
  const server = app.listen(p, () => {
    console.log(`Server listening at http://localhost:${p}`);
    console.log(`Swagger UI: http://localhost:${p}/api-docs`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${p} in use, trying port ${p + 1}...`);
      server.close?.();
      if (maxAttempts > 0) tryListen(p + 1, maxAttempts - 1);
      else {
        console.error('No available ports found, exiting.');
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

tryListen(port);
