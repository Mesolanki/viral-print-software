import { prisma } from '../config/database.js';

// ─── Shared include shape for a full expense record ─────────────────────────
const expenseInclude = {
  category: {
    select: { id: true, name: true, description: true },
  },
  recorder: {
    select: { id: true, full_name: true, username: true },
  },
};

// ─── Shared include shape for a category ────────────────────────────────────
const categoryInclude = {
  _count: { select: { expenses: true } },
};

export const expenseRepository = {
  // ── Categories ────────────────────────────────────────────────────────────

  /**
   * List all expense categories for a company.
   * @param {number} companyId
   * @param {boolean|undefined} onlyActive  If true, only return is_active=true rows.
   */
  async findAllCategories(companyId, onlyActive = false) {
    return await prisma.expenseCategory.findMany({
      where: {
        company_id: companyId,
        ...(onlyActive ? { is_active: true } : {}),
      },
      include: categoryInclude,
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Find a single category by ID (company-scoped).
   * @param {number} id
   * @param {number} companyId
   */
  async findCategoryById(id, companyId) {
    return await prisma.expenseCategory.findFirst({
      where: { id: Number(id), company_id: companyId },
      include: categoryInclude,
    });
  },

  /**
   * Find a category by name (for uniqueness check).
   * @param {string} name
   * @param {number} companyId
   * @param {number|undefined} excludeId  ID to exclude (for update uniqueness checks).
   */
  async findCategoryByName(name, companyId, excludeId) {
    return await prisma.expenseCategory.findFirst({
      where: {
        company_id: companyId,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: Number(excludeId) } } : {}),
      },
    });
  },

  /**
   * Create a new expense category.
   * @param {object} data
   */
  async createCategory(data) {
    return await prisma.expenseCategory.create({
      data,
      include: categoryInclude,
    });
  },

  /**
   * Update an existing expense category.
   * @param {number} id
   * @param {object} data
   */
  async updateCategory(id, data) {
    return await prisma.expenseCategory.update({
      where: { id: Number(id) },
      data,
      include: categoryInclude,
    });
  },

  /**
   * Delete an expense category by ID.
   * @param {number} id
   */
  async deleteCategory(id) {
    return await prisma.expenseCategory.delete({
      where: { id: Number(id) },
    });
  },

  // ── Office Expenses ───────────────────────────────────────────────────────

  /**
   * Find expenses with filters + pagination.
   * @param {number} companyId
   * @param {object} filters  { category_id, payment_mode, from, to }
   * @param {object} pagination  { page, limit }
   */
  async findMany(companyId, filters = {}, pagination = {}) {
    const { category_id, payment_mode, from, to } = filters;
    const page  = Math.max(1, Number(pagination.page)  || 1);
    const limit = Math.min(200, Math.max(1, Number(pagination.limit) || 50));
    const skip  = (page - 1) * limit;

    const where = {
      company_id: companyId,
      ...(category_id   ? { category_id: Number(category_id) } : {}),
      ...(payment_mode  ? { payment_mode }                     : {}),
      ...(from || to
        ? {
            expense_date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to)   } : {}),
            },
          }
        : {}),
    };

    const [expenses, total] = await prisma.$transaction([
      prisma.officeExpense.findMany({
        where,
        include: expenseInclude,
        orderBy: [{ expense_date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.officeExpense.count({ where }),
    ]);

    return { expenses, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Find a single expense by ID (company-scoped).
   * @param {number} id
   * @param {number} companyId
   */
  async findById(id, companyId) {
    return await prisma.officeExpense.findFirst({
      where: { id: Number(id), company_id: companyId },
      include: expenseInclude,
    });
  },

  /**
   * Create a new expense record.
   * @param {object} data
   */
  async create(data) {
    return await prisma.officeExpense.create({
      data,
      include: expenseInclude,
    });
  },

  /**
   * Update an existing expense record.
   * @param {number} id
   * @param {object} data
   */
  async update(id, data) {
    return await prisma.officeExpense.update({
      where: { id: Number(id) },
      data,
      include: expenseInclude,
    });
  },

  /**
   * Delete an expense record by ID.
   * @param {number} id
   */
  async delete(id) {
    return await prisma.officeExpense.delete({
      where: { id: Number(id) },
    });
  },

  /**
   * Aggregate totals for summary / dashboard widgets.
   * Returns total amount grouped by category and by payment_mode.
   * @param {number} companyId
   * @param {object} filters  { from, to, category_id }
   */
  async getSummary(companyId, filters = {}) {
    const { from, to, category_id } = filters;

    const where = {
      company_id: companyId,
      ...(category_id ? { category_id: Number(category_id) } : {}),
      ...(from || to
        ? {
            expense_date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to   ? { lte: new Date(to)   } : {}),
            },
          }
        : {}),
    };

    const [byCategory, byPaymentMode, grandTotal] = await prisma.$transaction([
      prisma.officeExpense.groupBy({
        by: ['category_id'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.officeExpense.groupBy({
        by: ['payment_mode'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.officeExpense.aggregate({
        where,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    return { byCategory, byPaymentMode, grandTotal };
  },
};
