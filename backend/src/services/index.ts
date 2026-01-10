// ============================================================================
// Service Layer - Business Logic
// ============================================================================

import { logger } from '../config/logger'
import {
  WeddingRepository,
  UserRoleRepository,
  BudgetRepository,
  ExpenseRepository,
  VendorRepository,
  TaskRepository,
  ChatRepository
} from '../repositories'
import { ApplicationError, ErrorCode } from '../models/responses'

export class WeddingService {
  private repository = new WeddingRepository()

  async getWeddingsByUser(userId: string) {
    logger.info(`Fetching weddings for user: ${userId}`)
    return this.repository.findByBrideOrGroom(userId)
  }

  async getWeddingById(weddingId: string) {
    logger.info(`Fetching wedding: ${weddingId}`)
    const wedding = await this.repository.findById(weddingId)
    if (!wedding) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        'Wedding not found',
        404
      )
    }
    return wedding
  }

  async createWedding(data: any, userId: string) {
    logger.info(`Creating wedding: ${data.wedding_name}`)
    return this.repository.create({
      ...data,
      created_by: userId,
      updated_by: userId,
      offline_sync_at: new Date().toISOString()
    })
  }

  async updateWedding(weddingId: string, data: any, userId: string) {
    logger.info(`Updating wedding: ${weddingId}`)
    return this.repository.update(weddingId, {
      ...data,
      updated_by: userId,
      offline_sync_at: new Date().toISOString()
    })
  }

  async deleteWedding(weddingId: string) {
    logger.info(`Deleting wedding: ${weddingId}`)
    return this.repository.delete(weddingId)
  }

  async archiveWedding(weddingId: string) {
    logger.info(`Archiving wedding: ${weddingId}`)
    return this.repository.update(weddingId, {
      is_archived: true,
      archive_locked_at: new Date().toISOString()
    })
  }
}

export class UserRoleService {
  private repository = new UserRoleRepository()

  async assignRole(weddingId: string, userId: string, role: string, side?: string) {
    logger.info(`Assigning role ${role} to user ${userId} in wedding ${weddingId}`)
    return this.repository.create({
      wedding_id: weddingId,
      user_id: userId,
      role,
      side,
      is_active: true
    })
  }

  async removeRole(weddingId: string, userId: string, role: string) {
    logger.info(`Removing role ${role} from user ${userId}`)
    const { data } = await this.repository.findByWeddingAndUser(weddingId, userId)
    const roleRecord = data.find((r: any) => r.role === role)
    if (roleRecord) {
      await this.repository.delete(roleRecord.id)
    }
  }

  async getUserRoles(weddingId: string, userId: string) {
    const { data } = await this.repository.findByWeddingAndUser(weddingId, userId)
    return data
  }

  async getWeddingTeam(weddingId: string) {
    const { data } = await this.repository.findWeddingUsers(weddingId)
    return data
  }
}

export class BudgetService {
  private budgetRepo = new BudgetRepository()
  private expenseRepo = new ExpenseRepository()

  async createBudget(weddingId: string, data: any, userId: string) {
    logger.info(`Creating budget: ${data.budget_name}`)
    return this.budgetRepo.create({
      wedding_id: weddingId,
      ...data,
      created_by: userId,
      updated_by: userId,
      offline_sync_at: new Date().toISOString()
    })
  }

  async addExpense(budgetId: string, data: any, userId: string) {
    logger.info(`Adding expense to budget: ${budgetId}`)
    return this.expenseRepo.create({
      ...data,
      created_by: userId,
      updated_by: userId,
      offline_sync_at: new Date().toISOString()
    })
  }

  async getBudgetSummary(budgetId: string) {
    const budget = await this.budgetRepo.findById(budgetId)
    if (!budget) {
      throw new ApplicationError(
        ErrorCode.NOT_FOUND,
        'Budget not found',
        404
      )
    }

    const totalSpent = await this.expenseRepo.getTotalSpent(budgetId)
    const remaining = budget.allocated_amount - totalSpent

    return {
      ...budget,
      total_spent: totalSpent,
      remaining_amount: remaining,
      percentage_used: (totalSpent / budget.allocated_amount) * 100
    }
  }

  async getWeddingBudgets(weddingId: string) {
    const { data } = await this.budgetRepo.findByWedding(weddingId)
    return Promise.all(
      data.map((budget: any) => this.getBudgetSummary(budget.id))
    )
  }
}

export class VendorService {
  private repository = new VendorRepository()

  async getVendorsByCategory(weddingId: string, category: string) {
    logger.info(`Fetching vendors for category: ${category}`)
    return this.repository.findByCategory(weddingId, category)
  }

  async shortlistVendor(vendorId: string) {
    logger.info(`Shortlisting vendor: ${vendorId}`)
    return this.repository.update(vendorId, { is_shortlisted: true })
  }

  async assignVendor(vendorId: string, functionId: string) {
    logger.info(`Assigning vendor ${vendorId} to function ${functionId}`)
    return this.repository.update(vendorId, {
      assigned_function_id: functionId,
      is_assigned: true
    })
  }

  async getShortlistedVendors(weddingId: string) {
    return this.repository.findShortlisted(weddingId)
  }
}

export class TaskService {
  private repository = new TaskRepository()

  async createTask(weddingId: string, data: any, userId: string) {
    logger.info(`Creating task: ${data.task_name}`)
    return this.repository.create({
      wedding_id: weddingId,
      ...data,
      created_by: userId,
      updated_by: userId,
      offline_sync_at: new Date().toISOString()
    })
  }

  async updateTaskStatus(taskId: string, status: string) {
    logger.info(`Updating task ${taskId} status to ${status}`)
    return this.repository.update(taskId, { status })
  }

  async getUserTasks(userId: string) {
    return this.repository.findAssignedTo(userId)
  }

  async getWeddingTasks(weddingId: string) {
    const { data } = await this.repository.findByWedding(weddingId)
    return data
  }
}

export class ChatService {
  private repository = new ChatRepository()

  async sendMessage(weddingId: string, data: any, userId: string) {
    logger.info(`Sending message to room: ${data.chat_room}`)
    return this.repository.create({
      wedding_id: weddingId,
      ...data,
      sender_id: userId,
      created_at: new Date().toISOString()
    })
  }

  async getChatHistory(weddingId: string, chatRoom: string, limit: number = 50) {
    logger.info(`Fetching chat history for room: ${chatRoom}`)
    return this.repository.findByRoom(weddingId, chatRoom, limit)
  }
}
