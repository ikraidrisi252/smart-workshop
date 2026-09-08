const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'backend');

// 1. UPDATE SCHEMA
const schemaPath = path.join(baseDir, 'database/schema.js');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('inventory = pgTable')) {
  schemaContent += `
export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  quantity: integer('quantity').notNull().default(0),
  reorderLevel: integer('reorder_level').notNull().default(5),
  location: text('location'),
  unitCost: integer('unit_cost').default(0),
  createdAt: timestamp('created_at').defaultNow()
});

export const maintenance_jobs = pgTable('maintenance_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  assetId: uuid('asset_id').references(() => assets.id),
  technicianId: uuid('technician_id').references(() => users.id),
  status: text('status').notNull().default('Pending'), // Pending, In Progress, QA, Completed
  description: text('description').notNull(),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow()
});

export const procurement_orders = pgTable('procurement_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorName: text('vendor_name').notNull(),
  item: text('item').notNull(),
  quantity: integer('quantity').notNull(),
  status: text('status').notNull().default('Requested'), // Requested, Approved, Ordered, Received
  totalCost: integer('total_cost').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
`;
  fs.writeFileSync(schemaPath, schemaContent);
}

const files = {
  // REPOSITORIES
  'repositories/inventoryRepository.js': `import { db } from '../database/index.js';
import { inventory } from '../database/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const findAll = async () => {
  return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
};

export const create = async (data) => {
  const sku = 'SKU-' + uuidv4().split('-')[0].toUpperCase();
  const [newItem] = await db.insert(inventory).values({ ...data, sku }).returning();
  return newItem;
};
`,
  'repositories/maintenanceRepository.js': `import { db } from '../database/index.js';
import { maintenance_jobs, assets, users } from '../database/schema.js';
import { eq, desc } from 'drizzle-orm';

export const findAll = async () => {
  return await db.select({
    id: maintenance_jobs.id,
    status: maintenance_jobs.status,
    description: maintenance_jobs.description,
    startDate: maintenance_jobs.startDate,
    assetName: assets.name,
    assetQr: assets.qrCode,
    technicianName: users.fullName
  })
  .from(maintenance_jobs)
  .leftJoin(assets, eq(maintenance_jobs.assetId, assets.id))
  .leftJoin(users, eq(maintenance_jobs.technicianId, users.id))
  .orderBy(desc(maintenance_jobs.createdAt));
};

export const create = async (data) => {
  const [job] = await db.insert(maintenance_jobs).values(data).returning();
  return job;
};
`,
  'repositories/procurementRepository.js': `import { db } from '../database/index.js';
import { procurement_orders } from '../database/schema.js';
import { desc } from 'drizzle-orm';

export const findAll = async () => {
  return await db.select().from(procurement_orders).orderBy(desc(procurement_orders.createdAt));
};

export const create = async (data) => {
  const [order] = await db.insert(procurement_orders).values(data).returning();
  return order;
};
`,

  // SERVICES
  'services/inventoryService.js': `import * as repo from '../repositories/inventoryRepository.js';
export const getAll = () => repo.findAll();
export const add = (data) => repo.create(data);
`,
  'services/maintenanceService.js': `import * as repo from '../repositories/maintenanceRepository.js';
export const getAll = () => repo.findAll();
export const add = (data) => repo.create(data);
`,
  'services/procurementService.js': `import * as repo from '../repositories/procurementRepository.js';
export const getAll = () => repo.findAll();
export const add = (data) => repo.create(data);
`,

  // CONTROLLERS
  'controllers/inventoryController.js': `import * as service from '../services/inventoryService.js';
export const getAll = async (req, res, next) => {
  try { res.json({ inventory: await service.getAll() }); } catch (e) { next(e); }
};
export const add = async (req, res, next) => {
  try { res.status(201).json({ item: await service.add(req.body) }); } catch (e) { next(e); }
};
`,
  'controllers/maintenanceController.js': `import * as service from '../services/maintenanceService.js';
export const getAll = async (req, res, next) => {
  try { res.json({ jobs: await service.getAll() }); } catch (e) { next(e); }
};
export const add = async (req, res, next) => {
  try { res.status(201).json({ job: await service.add(req.body) }); } catch (e) { next(e); }
};
`,
  'controllers/procurementController.js': `import * as service from '../services/procurementService.js';
export const getAll = async (req, res, next) => {
  try { res.json({ orders: await service.getAll() }); } catch (e) { next(e); }
};
export const add = async (req, res, next) => {
  try { res.status(201).json({ order: await service.add(req.body) }); } catch (e) { next(e); }
};
`,

  // ROUTES
  'routes/inventoryRoutes.js': `import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/inventoryController.js';
const router = express.Router();
router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.add);
export default router;
`,
  'routes/maintenanceRoutes.js': `import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/maintenanceController.js';
const router = express.Router();
router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.add);
export default router;
`,
  'routes/procurementRoutes.js': `import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/procurementController.js';
const router = express.Router();
router.use(requireAuth);
router.get('/', ctrl.getAll);
router.post('/', ctrl.add);
export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Backend core APIs generated.');
