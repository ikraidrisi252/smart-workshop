const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'backend');

// 1. UPDATE SCHEMA
const schemaPath = path.join(baseDir, 'database/schema.js');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('assets = pgTable')) {
  schemaContent += `
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  qrCode: text('qr_code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  status: text('status').notNull().default('Available'), // Available, Under Repair, Testing, Completed, Out of Service
  lastMaintenance: timestamp('last_maintenance'),
  createdAt: timestamp('created_at').defaultNow()
});
`;
  fs.writeFileSync(schemaPath, schemaContent);
}

const files = {
  // VALIDATOR
  'validators/assetValidator.js': `import { z } from 'zod';
export const createAssetSchema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
  departmentId: z.string().uuid().optional().nullable(),
  status: z.enum(['Available', 'Under Repair', 'Testing', 'Completed', 'Out of Service']).optional()
});
export const updateAssetSchema = createAssetSchema.partial();
`,
  // REPOSITORY
  'repositories/assetRepository.js': `import { db } from '../database/index.js';
import { assets, departments } from '../database/schema.js';
import { eq, like, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const findAll = async () => {
  return await db.select({
    id: assets.id,
    qrCode: assets.qrCode,
    name: assets.name,
    type: assets.type,
    status: assets.status,
    department: departments.name
  })
  .from(assets)
  .leftJoin(departments, eq(assets.departmentId, departments.id))
  .orderBy(desc(assets.createdAt));
};

export const create = async (data) => {
  const qrCode = 'QR-' + uuidv4().split('-')[0].toUpperCase();
  const [newAsset] = await db.insert(assets).values({ ...data, qrCode }).returning();
  return newAsset;
};

export const deleteById = async (id) => {
  await db.delete(assets).where(eq(assets.id, id));
  return true;
};

export const getDashboardMetrics = async () => {
  const res = await db.execute(sql\`
    SELECT 
      COUNT(*) as "totalAssets",
      COUNT(CASE WHEN status = 'Under Repair' THEN 1 END) as "underRepair",
      COUNT(CASE WHEN status = 'Completed' THEN 1 END) as "completed"
    FROM assets
  \`);
  return res.rows[0];
};
`,
  // SERVICE
  'services/assetService.js': `import * as assetRepo from '../repositories/assetRepository.js';

export const getAllAssets = async () => {
  return await assetRepo.findAll();
};

export const registerAsset = async (data) => {
  return await assetRepo.create(data);
};

export const deleteAsset = async (id) => {
  return await assetRepo.deleteById(id);
};

export const getMetrics = async () => {
  return await assetRepo.getDashboardMetrics();
};
`,
  // CONTROLLERS
  'controllers/assetController.js': `import * as assetService from '../services/assetService.js';

export const getAll = async (req, res, next) => {
  try {
    const assets = await assetService.getAllAssets();
    res.json({ assets });
  } catch (err) { next(err); }
};

export const register = async (req, res, next) => {
  try {
    const newAsset = await assetService.registerAsset(req.body);
    res.status(201).json({ asset: newAsset });
  } catch (err) { next(err); }
};

export const remove = async (req, res, next) => {
  try {
    await assetService.deleteAsset(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};
`,
  'controllers/dashboardController.js': `import * as assetService from '../services/assetService.js';

export const getMetrics = async (req, res, next) => {
  try {
    const metrics = await assetService.getMetrics();
    // Provide some mock values for inventory and technicians to fulfill UI requirements for now
    res.json({
      ...metrics,
      totalInventory: 1420,
      lowStock: 12,
      activeTechnicians: 18,
      pendingMaintenance: metrics.underRepair || 0
    });
  } catch (err) { next(err); }
};
`,
  // ROUTES
  'routes/assetRoutes.js': `import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createAssetSchema } from '../validators/assetValidator.js';
import * as assetController from '../controllers/assetController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', assetController.getAll);
router.post('/', requireRole(['ADMIN']), validate(createAssetSchema), assetController.register);
router.delete('/:id', requireRole(['ADMIN']), assetController.remove);

export default router;
`,
  'routes/dashboardRoutes.js': `import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();
router.use(requireAuth);

router.get('/metrics', dashboardController.getMetrics);

export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Backend assets API generated.');
