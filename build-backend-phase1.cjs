const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'backend');

const files = {
  // SCHEMA REFINEMENT
  'database/schema.js': `import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // ADMIN, TECHNICIAN
});

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  roleId: integer('role_id').references(() => roles.id).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});
`,
  // LOGGER
  'utils/logger.js': `import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return \`[\${timestamp}] \${level}: \${message}\`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), logFormat)
  }));
}

export default logger;
`,
  // VALIDATION MIDDLEWARE
  'middleware/validate.js': `export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
  }
};
`,
  // ERROR MIDDLEWARE
  'middleware/errorMiddleware.js': `import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(\`\${err.status || 500} - \${err.message} - \${req.originalUrl} - \${req.method} - \${req.ip}\`);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation Error', details: err.errors });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
};
`,
  // VALIDATORS
  'validators/authValidator.js': `import { z } from 'zod';
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
`,
  'validators/userValidator.js': `import { z } from 'zod';
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  roleId: z.number().int(),
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional()
});
export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  fullName: z.string().min(2).optional(),
  roleId: z.number().int().optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional()
});
`,
  'validators/departmentValidator.js': `import { z } from 'zod';
export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name required'),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});
export const updateDepartmentSchema = createDepartmentSchema.partial();
`,
  // REPOSITORIES
  'repositories/userRepository.js': `import { db } from '../database/index.js';
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export const findUserByEmail = async (email) => {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
};
export const findUserById = async (id) => {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
};
export const findAllUsers = async () => {
  return await db.select({
    id: users.id, email: users.email, fullName: users.fullName, roleId: users.roleId, departmentId: users.departmentId, isActive: users.isActive
  }).from(users);
};
export const createUser = async (data) => {
  const result = await db.insert(users).values(data).returning();
  return result[0];
};
export const updateUser = async (id, data) => {
  const result = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return result[0];
};
export const deleteUser = async (id) => {
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result[0];
};
`,
  'repositories/departmentRepository.js': `import { db } from '../database/index.js';
import { departments } from '../database/schema.js';
import { eq } from 'drizzle-orm';

export const findAllDepartments = async () => await db.select().from(departments);
export const findDepartmentById = async (id) => {
  const result = await db.select().from(departments).where(eq(departments.id, id));
  return result[0];
};
export const createDepartment = async (data) => {
  const result = await db.insert(departments).values(data).returning();
  return result[0];
};
export const updateDepartment = async (id, data) => {
  const result = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
  return result[0];
};
export const deleteDepartment = async (id) => {
  const result = await db.delete(departments).where(eq(departments.id, id)).returning();
  return result[0];
};
`,
  // SERVICES
  'services/authService.js': `import bcrypt from 'bcryptjs';
import { findUserByEmail } from '../repositories/userRepository.js';
import { generateTokens } from '../utils/jwtUtils.js';

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials or inactive user');
    err.status = 401;
    throw err;
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Assign string role based on integer ID for RBAC simplicity
  const roleName = user.roleId === 1 ? 'ADMIN' : 'TECHNICIAN'; 
  const tokens = generateTokens({ id: user.id, roleName, email: user.email });
  
  return { 
    user: { id: user.id, email: user.email, fullName: user.fullName, role: roleName }, 
    tokens 
  };
};
`,
  'services/userService.js': `import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/userRepository.js';

export const getAllUsers = async () => await userRepo.findAllUsers();
export const getUserById = async (id) => {
  const user = await userRepo.findUserById(id);
  if (!user) throw { status: 404, message: 'User not found' };
  return { id: user.id, email: user.email, fullName: user.fullName, roleId: user.roleId, departmentId: user.departmentId, isActive: user.isActive };
};
export const createUser = async (data) => {
  const existing = await userRepo.findUserByEmail(data.email);
  if (existing) throw { status: 409, message: 'Email already exists' };
  
  const passwordHash = await bcrypt.hash(data.password, 10);
  const newUser = await userRepo.createUser({ ...data, passwordHash });
  delete newUser.passwordHash;
  return newUser;
};
export const updateUser = async (id, data) => {
  if (data.email) {
    const existing = await userRepo.findUserByEmail(data.email);
    if (existing && existing.id !== id) throw { status: 409, message: 'Email already in use' };
  }
  const updated = await userRepo.updateUser(id, data);
  if (!updated) throw { status: 404, message: 'User not found' };
  delete updated.passwordHash;
  return updated;
};
export const deleteUser = async (id) => {
  const deleted = await userRepo.deleteUser(id);
  if (!deleted) throw { status: 404, message: 'User not found' };
  return { success: true };
};
`,
  'services/departmentService.js': `import * as deptRepo from '../repositories/departmentRepository.js';

export const getAllDepartments = async () => await deptRepo.findAllDepartments();
export const getDepartmentById = async (id) => {
  const dept = await deptRepo.findDepartmentById(id);
  if (!dept) throw { status: 404, message: 'Department not found' };
  return dept;
};
export const createDepartment = async (data) => await deptRepo.createDepartment(data);
export const updateDepartment = async (id, data) => {
  const dept = await deptRepo.updateDepartment(id, data);
  if (!dept) throw { status: 404, message: 'Department not found' };
  return dept;
};
export const deleteDepartment = async (id) => {
  const dept = await deptRepo.deleteDepartment(id);
  if (!dept) throw { status: 404, message: 'Department not found' };
  return { success: true };
};
`,
  // CONTROLLERS
  'controllers/authController.js': `import * as authService from '../services/authService.js';
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (err) { next(err); }
};
`,
  'controllers/userController.js': `import * as userService from '../services/userService.js';
export const getUsers = async (req, res, next) => { try { res.json(await userService.getAllUsers()); } catch (e) { next(e); } };
export const getUserById = async (req, res, next) => { try { res.json(await userService.getUserById(req.params.id)); } catch (e) { next(e); } };
export const createUser = async (req, res, next) => { try { res.status(201).json(await userService.createUser(req.body)); } catch (e) { next(e); } };
export const updateUser = async (req, res, next) => { try { res.json(await userService.updateUser(req.params.id, req.body)); } catch (e) { next(e); } };
export const deleteUser = async (req, res, next) => { try { res.json(await userService.deleteUser(req.params.id)); } catch (e) { next(e); } };
`,
  'controllers/departmentController.js': `import * as deptService from '../services/departmentService.js';
export const getDepartments = async (req, res, next) => { try { res.json(await deptService.getAllDepartments()); } catch (e) { next(e); } };
export const getDepartmentById = async (req, res, next) => { try { res.json(await deptService.getDepartmentById(req.params.id)); } catch (e) { next(e); } };
export const createDepartment = async (req, res, next) => { try { res.status(201).json(await deptService.createDepartment(req.body)); } catch (e) { next(e); } };
export const updateDepartment = async (req, res, next) => { try { res.json(await deptService.updateDepartment(req.params.id, req.body)); } catch (e) { next(e); } };
export const deleteDepartment = async (req, res, next) => { try { res.json(await deptService.deleteDepartment(req.params.id)); } catch (e) { next(e); } };
`,
  // ROUTES
  'routes/userRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/userValidator.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);
export default router;
`,
  'routes/departmentRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../validators/departmentValidator.js';
import * as deptController from '../controllers/departmentController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', deptController.getDepartments);
router.get('/:id', deptController.getDepartmentById);
router.post('/', requireRole(['ADMIN']), validate(createDepartmentSchema), deptController.createDepartment);
router.put('/:id', requireRole(['ADMIN']), validate(updateDepartmentSchema), deptController.updateDepartment);
router.delete('/:id', requireRole(['ADMIN']), deptController.deleteDepartment);
export default router;
`,
  'routes/authRoutes.js': `import express from 'express';
import { login } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidator.js';

const router = express.Router();
router.post('/login', validate(loginSchema), login);
export default router;
`,
  // SERVER.JS
  'server.js': `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });
app.use('/api/auth', limiter);

app.use(express.json());
// Connect Morgan to Winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(\`Server running on http://localhost:\${PORT}\`);
});
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Backend Phase 1 generated.');
