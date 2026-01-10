// ============================================================================
// Repository Layer - Database Access Pattern
// ============================================================================

import { supabaseAdmin } from '../config/supabase'
import { logger } from '../config/logger'

export abstract class BaseRepository<T> {
  protected tableName: string = ''

  async findById(id: string): Promise<T | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data || null
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by id: ${error}`)
      throw error
    }
  }

  async findAll(filters?: Record<string, any>, limit?: number, offset?: number): Promise<{ data: T[]; total: number }> {
    try {
      let query = supabaseAdmin.from(this.tableName).select('*', { count: 'exact' })

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      if (limit) {
        query = query.limit(limit)
      }
      if (offset) {
        query = query.range(offset, offset + (limit || 20) - 1)
      }

      const { data, error, count } = await query

      if (error) throw error
      return { data: data || [], total: count || 0 }
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}: ${error}`)
      throw error
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .insert([data])
        .select()
        .single()

      if (error) throw error
      return result
    } catch (error) {
      logger.error(`Error creating ${this.tableName}: ${error}`)
      throw error
    }
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await supabaseAdmin
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    } catch (error) {
      logger.error(`Error updating ${this.tableName}: ${error}`)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      logger.error(`Error deleting from ${this.tableName}: ${error}`)
      throw error
    }
  }

  async findByWedding(weddingId: string, limit?: number, offset?: number): Promise<{ data: T[]; total: number }> {
    return this.findAll({ wedding_id: weddingId }, limit, offset)
  }
}

// Specific Repository Implementations
export class WeddingRepository extends BaseRepository<any> {
  protected tableName = 'weddings'

  async findByBrideOrGroom(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .or(`bride_id.eq.${userId},groom_id.eq.${userId}`)

      if (error) throw error
      return data || []
    } catch (error) {
      logger.error(`Error finding weddings by user: ${error}`)
      throw error
    }
  }
}

export class UserRoleRepository extends BaseRepository<any> {
  protected tableName = 'user_roles'

  async findByWeddingAndUser(weddingId: string, userId: string): Promise<{ data: any[]; total: number }> {
    return this.findAll({ wedding_id: weddingId, user_id: userId })
  }

  async findWeddingUsers(weddingId: string): Promise<{ data: any[]; total: number }> {
    return this.findAll({ wedding_id: weddingId })
  }
}

export class BudgetRepository extends BaseRepository<any> {
  protected tableName = 'budgets'

  async findByVisibility(weddingId: string, visibility: string): Promise<any[]> {
    const { data } = await this.findAll({ wedding_id: weddingId, visibility_scope: visibility })
    return data
  }
}

export class ExpenseRepository extends BaseRepository<any> {
  protected tableName = 'expenses'

  async findByBudget(budgetId: string): Promise<any[]> {
    const { data } = await this.findAll({ budget_id: budgetId })
    return data
  }

  async getTotalSpent(budgetId: string): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('amount')
        .eq('budget_id', budgetId)
        .eq('status', 'paid')

      if (error) throw error
      return data?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
    } catch (error) {
      logger.error(`Error calculating total spent: ${error}`)
      throw error
    }
  }
}

export class VendorRepository extends BaseRepository<any> {
  protected tableName = 'vendors'

  async findByCategory(weddingId: string, category: string): Promise<any[]> {
    const { data } = await this.findAll({ wedding_id: weddingId, category })
    return data
  }

  async findShortlisted(weddingId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('is_shortlisted', true)
    return data || []
  }
}

export class MenuRepository extends BaseRepository<any> {
  protected tableName = 'menus'

  async findByFunction(functionId: string): Promise<any[]> {
    const { data } = await this.findAll({ function_id: functionId })
    return data
  }
}

export class TaskRepository extends BaseRepository<any> {
  protected tableName = 'tasks'

  async findByStatus(weddingId: string, status: string): Promise<any[]> {
    const { data } = await this.findAll({ wedding_id: weddingId, status })
    return data
  }

  async findAssignedTo(userId: string): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq('assigned_to', userId)
    return data || []
  }
}

export class ChatRepository extends BaseRepository<any> {
  protected tableName = 'chats'

  async findByRoom(weddingId: string, chatRoom: string, limit: number = 50): Promise<any[]> {
    const { data } = await supabaseAdmin
      .from(this.tableName)
      .select('*')
      .eq('wedding_id', weddingId)
      .eq('chat_room', chatRoom)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data || []
  }
}
