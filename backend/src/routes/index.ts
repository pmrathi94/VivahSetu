import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard, weddingAccessGuard } from '../middleware/rbac';

// Import all controllers
import * as authController from '../controllers/auth.controller';
import * as weddingsController from '../controllers/weddings.controller';
import * as functionsController from '../controllers/functions.controller';
import * as guestsController from '../controllers/guests.controller';
import * as expensesController from '../controllers/expenses.controller';
import * as chatController from '../controllers/chat.controller';
import * as mediaController from '../controllers/media.controller';
import vendorsRouter from '../controllers/vendors.controller';
import mediaStudioRouter from '../controllers/media-studio.controller';
import analyticsRouter from '../controllers/analytics.controller';
import timelineRouter from '../controllers/timeline.controller';
import workflowsRouter from '../controllers/workflows.controller';

const router = Router();

// Health check
router.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Auth Routes (Public)
router.post('/auth/signup', authController.signupController);
router.post('/auth/login', authController.loginController);
router.post('/auth/logout', authMiddleware, authController.logoutController);

// Wedding Routes (Protected)
router.post('/weddings', authMiddleware, weddingsController.createWeddingController);
router.get('/weddings', authMiddleware, weddingsController.getWeddingsController);
router.get('/weddings/:id', authMiddleware, weddingsController.getWeddingByIdController);
router.put('/weddings/:id', authMiddleware, weddingsController.updateWeddingController);
router.delete('/weddings/:id', authMiddleware, weddingsController.deleteWeddingController);

// Functions Routes (Protected)
router.post('/functions', authMiddleware, functionsController.createFunctionController);
router.get('/functions', authMiddleware, functionsController.getFunctionsController);
router.put('/functions/:id', authMiddleware, functionsController.updateFunctionController);
router.delete('/functions/:id', authMiddleware, functionsController.deleteFunctionController);

// Guests Routes (Protected)
router.post('/guests', authMiddleware, guestsController.createGuestController);
router.get('/guests', authMiddleware, guestsController.getGuestsController);
router.put('/guests/:id', authMiddleware, guestsController.updateGuestController);
router.delete('/guests/:id', authMiddleware, guestsController.deleteGuestController);

// Expenses Routes (Protected)
router.post('/expenses', authMiddleware, expensesController.createExpenseController);
router.get('/expenses', authMiddleware, expensesController.getExpensesController);
router.put('/expenses/:id', authMiddleware, expensesController.updateExpenseController);
router.delete('/expenses/:id', authMiddleware, expensesController.deleteExpenseController);
router.get('/expenses/summary', authMiddleware, expensesController.getBudgetSummaryController);

// Chat Routes (Protected)
router.post('/chat', authMiddleware, chatController.sendMessageController);
router.get('/chat', authMiddleware, chatController.getMessagesController);
router.delete('/chat/:id', authMiddleware, chatController.deleteMessageController);

// Media Routes (Protected)
router.post('/media/upload', authMiddleware, mediaController.uploadMediaController);
router.get('/media', authMiddleware, mediaController.getMediaController);
router.delete('/media/:id', authMiddleware, mediaController.deleteMediaController);

// ============================================================================
// NEW COMPREHENSIVE FEATURE ROUTES (ENTERPRISE FEATURES)
// ============================================================================

// Vendors & Location Routes
router.use('/weddings', authMiddleware, weddingAccessGuard, vendorsRouter);

// Media Studio Routes (with versioning, watermarking, screenshot prevention)
router.use('/weddings', authMiddleware, weddingAccessGuard, mediaStudioRouter);

// Analytics Dashboard Routes (budget, functions, RSVP, packing, comprehensive dashboard)
router.use('/weddings', authMiddleware, weddingAccessGuard, analyticsRouter);

// Timeline & Notifications Routes (countdown, emergency alerts, reminders)
router.use('/weddings', authMiddleware, weddingAccessGuard, timelineRouter);

// Packing, AI, & Post-Wedding Workflows Routes (GDPR-safe AI, export/delete)
router.use('/weddings', authMiddleware, weddingAccessGuard, workflowsRouter);

// ============================================================================
// ADDITIONAL ENTERPRISE ENDPOINTS
// ============================================================================

// Role & Permission Management (Admin only)
router.get('/admin/roles', 
  authMiddleware, 
  roleGuard(['app_owner']), 
  async (req: Request, res: Response) => {
    // Fetch all roles
    res.json({ message: 'Roles endpoint' });
  }
);

// RSVP Management
router.post('/weddings/:wedding_id/rsvp', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'RSVP creation endpoint' });
});

router.get('/weddings/:wedding_id/rsvp', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'RSVP list endpoint' });
});

// Theme Management (Dynamic per wedding)
router.post('/weddings/:wedding_id/themes', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Theme creation endpoint' });
});

router.get('/weddings/:wedding_id/themes', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Theme list endpoint' });
});

// Surprise Planning Routes (Family Admin only)
router.post('/weddings/:wedding_id/surprise', 
  authMiddleware, 
  roleGuard(['family_admin']), 
  async (req: Request, res: Response) => {
    res.json({ message: 'Surprise planning endpoint' });
  }
);

// Multi-Language Support
router.put('/weddings/:wedding_id/language', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Language setting endpoint' });
});

// Accessibility Routes
router.put('/users/preferences/accessibility', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Accessibility preferences endpoint' });
});

// Audit Logs (Admin/User only)
router.get('/weddings/:wedding_id/audit-logs', 
  authMiddleware, 
  roleGuard(['app_owner', 'customer_admin', 'bride_groom']), 
  async (req: Request, res: Response) => {
    res.json({ message: 'Audit logs endpoint' });
  }
);

// Global Search across modules
router.get('/weddings/:wedding_id/search', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Global search endpoint' });
});

// Prebuilt Checklists
router.get('/checklists/indian-wedding', authMiddleware, async (req: Request, res: Response) => {
  res.json({ message: 'Prebuilt checklists endpoint' });
});

export default router;
