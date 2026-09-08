const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'backend');

// Helper to remove directory recursively
function rmDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file, index) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        rmDir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

// Clean old src if exists
rmDir(path.join(baseDir, 'src'));

const dirs = [
  'config',
  'controllers',
  'database',
  'logs',
  'middleware',
  'models',
  'repositories',
  'routes',
  'services',
  'uploads/assets',
  'uploads/documents',
  'utils',
  'validators'
];

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

const files = {
  'package.json': `{
  "name": "smart-workshop-backend",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.31.2",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.12.0",
    "qrcode": "^1.5.3",
    "winston": "^3.13.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "drizzle-kit": "^0.22.8"
  }
}`,
  'drizzle.config.js': `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './database/schema.js',
  out: './database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/smart_workshop',
  },
});`,
  '.env': `PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/smart_workshop
JWT_SECRET=super-secret-key-123
JWT_REFRESH_SECRET=super-refresh-key-456
NODE_ENV=development
`,
  'database/index.js': `import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
`,
  'database/schema.js': `import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

// --- USERS & RBAC ---
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // 'ADMIN', 'TECHNICIAN', 'MANAGER'
  permissions: jsonb('permissions')
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  department: text('department'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// --- ASSETS & QR ---
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetTag: text('asset_tag').notNull().unique(), // e.g. TATRA-ERG-102
  name: text('name').notNull(),
  category: text('category').notNull(),
  department: text('department').notNull(),
  status: text('status').notNull(), // 'Operational', 'In Repair'
  qrCodeId: uuid('qr_code_id').defaultRandom().unique(),
  lastMaintainedAt: timestamp('last_maintained_at'),
  nextMaintenanceAt: timestamp('next_maintenance_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// --- INVENTORY ---
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  availableQty: integer('available_qty').notNull().default(0),
  minLevel: integer('min_level').notNull().default(5),
  location: text('location'),
  unitCost: integer('unit_cost'), // in cents/paise
  createdAt: timestamp('created_at').defaultNow()
});

// --- MAINTENANCE ---
export const maintenanceJobs = pgTable('maintenance_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobNumber: text('job_number').notNull().unique(),
  assetId: uuid('asset_id').references(() => assets.id).notNull(),
  technicianId: uuid('technician_id').references(() => users.id),
  priority: text('priority').notNull(),
  status: text('status').notNull(), // 'Pending', 'In Progress', 'QA', 'Completed'
  issueDescription: text('issue_description').notNull(),
  qaApprovedBy: uuid('qa_approved_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

// --- PROCUREMENT ---
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  poNumber: text('po_number').notNull().unique(),
  vendorId: uuid('vendor_id'),
  totalValue: integer('total_value'),
  status: text('status').notNull(), // 'Draft', 'Dispatched', 'Delivered'
  expectedDelivery: timestamp('expected_delivery'),
  createdAt: timestamp('created_at').defaultNow()
});
`,
  'utils/jwtUtils.js': `import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateTokens = (user) => {
  const payload = { id: user.id, role: user.roleName, email: user.email };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
`,
  'middleware/authMiddleware.js': `import { verifyAccessToken } from '../utils/jwtUtils.js';

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};
`,
  'middleware/errorMiddleware.js': `export const errorHandler = (err, req, res, next) => {
  console.error('[Error]:', err.message);
  
  // Zod Validation Error handling
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation Error', details: err.errors });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
`,
  'validators/authValidator.js': `import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
`,
  'controllers/authController.js': `import { loginSchema } from '../validators/authValidator.js';

export const login = async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);
    // TODO: DB lookup, bcrypt verify, generate Tokens
    res.json({ message: 'Login successful (shell)', user: validated.email });
  } catch (err) {
    next(err);
  }
};
`,
  'routes/authRoutes.js': `import express from 'express';
import { login } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);
// POST /api/auth/refresh
router.post('/refresh', (req, res) => res.json({ message: 'Refresh token (shell)' }));
// POST /api/auth/logout
router.post('/logout', (req, res) => res.json({ message: 'Logout (shell)' }));

export default router;
`,
  'routes/assetRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => res.json({ message: 'GET all assets' }));
router.get('/:id', (req, res) => res.json({ message: 'GET single asset' }));
router.post('/', requireRole(['ADMIN']), (req, res) => res.json({ message: 'POST create asset' }));
router.put('/:id', requireRole(['ADMIN']), (req, res) => res.json({ message: 'PUT update asset' }));
router.delete('/:id', requireRole(['ADMIN']), (req, res) => res.json({ message: 'DELETE asset' }));

export default router;
`,
  'routes/inventoryRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => res.json({ message: 'GET all inventory' }));
router.post('/issue', requireRole(['ADMIN', 'TECHNICIAN']), (req, res) => res.json({ message: 'POST issue part' }));
router.post('/return', requireRole(['ADMIN', 'TECHNICIAN']), (req, res) => res.json({ message: 'POST return part' }));

export default router;
`,
  'routes/maintenanceRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', (req, res) => res.json({ message: 'GET all jobs' }));
router.get('/:id', (req, res) => res.json({ message: 'GET single job details' }));
router.post('/', requireRole(['ADMIN']), (req, res) => res.json({ message: 'POST create ticket' }));
router.put('/:id/status', requireRole(['ADMIN', 'TECHNICIAN']), (req, res) => res.json({ message: 'PUT update job status' }));

export default router;
`,
  'routes/procurementRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN'])); // All procurement is admin-only

router.get('/prs', (req, res) => res.json({ message: 'GET purchase requests' }));
router.post('/prs', (req, res) => res.json({ message: 'POST create purchase request' }));
router.get('/pos', (req, res) => res.json({ message: 'GET purchase orders' }));
router.get('/vendors', (req, res) => res.json({ message: 'GET vendors' }));

export default router;
`,
  'server.js': `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use(limiter);

// Parsing & Logging
app.use(express.json());
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/procurement', procurementRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Workshop Enterprise API is healthy' });
});

// Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(\`Enterprise Backend running on http://localhost:\${PORT}\`);
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  fs.writeFileSync(fullPath, content);
}

console.log('Enterprise Backend structure generated successfully.');
