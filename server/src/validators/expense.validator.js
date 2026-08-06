// ── Valid payment modes (mirrors the PaymentType enum in schema) ─────────────
export const VALID_PAYMENT_MODES = ['CASH', 'BANK', 'UPI', 'CARD', 'OTHER'];

// ── Helpers ──────────────────────────────────────────────────────────────────
const isBlank     = (v) => !v || String(v).trim().length === 0;
const isValidDate = (v) => !isNaN(Date.parse(v));
const isPositive  = (v) => Number(v) > 0 && isFinite(Number(v));

// ── Category validators ───────────────────────────────────────────────────────

/**
 * Validate create-expense-category request body.
 * Required: name
 * Optional: description
 */
export const validateCreateCategory = (data) => {
  const errors = [];

  if (isBlank(data.name)) {
    errors.push({ field: 'name', message: 'Category name is required' });
  } else if (String(data.name).trim().length > 100) {
    errors.push({ field: 'name', message: 'Category name must not exceed 100 characters' });
  }

  if (data.description !== undefined && String(data.description).length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate update-expense-category request body.
 * All fields optional (partial update), but at least one must be present.
 */
export const validateUpdateCategory = (data) => {
  const errors = [];
  const allowed = ['name', 'description', 'is_active'];
  const provided = allowed.filter((k) => data[k] !== undefined);

  if (provided.length === 0) {
    errors.push({ field: 'body', message: 'At least one field (name, description, is_active) must be provided' });
    return { isValid: false, errors };
  }

  if (data.name !== undefined) {
    if (isBlank(data.name)) {
      errors.push({ field: 'name', message: 'Category name cannot be empty' });
    } else if (String(data.name).trim().length > 100) {
      errors.push({ field: 'name', message: 'Category name must not exceed 100 characters' });
    }
  }

  if (data.description !== undefined && data.description !== null &&
      String(data.description).length > 500) {
    errors.push({ field: 'description', message: 'Description must not exceed 500 characters' });
  }

  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.push({ field: 'is_active', message: 'is_active must be a boolean (true or false)' });
  }

  return { isValid: errors.length === 0, errors };
};

// ── Expense validators ────────────────────────────────────────────────────────

/**
 * Validate create-office-expense request body.
 * Required: category_id, title, amount, expense_date
 * Optional: payment_mode, reference_no, vendor_name, notes, receipt_url
 */
export const validateCreateExpense = (data) => {
  const errors = [];

  // category_id
  if (!data.category_id || !Number.isInteger(Number(data.category_id)) || Number(data.category_id) < 1) {
    errors.push({ field: 'category_id', message: 'A valid category ID is required' });
  }

  // title
  if (isBlank(data.title)) {
    errors.push({ field: 'title', message: 'Expense title / description is required' });
  } else if (String(data.title).trim().length > 255) {
    errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
  }

  // amount
  if (data.amount === undefined || data.amount === null || data.amount === '') {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (!isPositive(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
  } else if (Number(data.amount) > 99999999.99) {
    errors.push({ field: 'amount', message: 'Amount exceeds maximum allowed value' });
  }

  // expense_date
  if (isBlank(data.expense_date)) {
    errors.push({ field: 'expense_date', message: 'Expense date is required' });
  } else if (!isValidDate(data.expense_date)) {
    errors.push({ field: 'expense_date', message: 'Expense date must be a valid date string (ISO 8601)' });
  }

  // payment_mode (optional, defaults to CASH if absent)
  if (data.payment_mode !== undefined && !VALID_PAYMENT_MODES.includes(String(data.payment_mode).toUpperCase())) {
    errors.push({
      field: 'payment_mode',
      message: `payment_mode must be one of: ${VALID_PAYMENT_MODES.join(', ')}`,
    });
  }

  // optional string fields — length guards
  if (data.reference_no && String(data.reference_no).length > 100) {
    errors.push({ field: 'reference_no', message: 'Reference number must not exceed 100 characters' });
  }
  if (data.vendor_name && String(data.vendor_name).length > 150) {
    errors.push({ field: 'vendor_name', message: 'Vendor name must not exceed 150 characters' });
  }
  if (data.notes && String(data.notes).length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must not exceed 1000 characters' });
  }
  if (data.receipt_url && String(data.receipt_url).length > 500) {
    errors.push({ field: 'receipt_url', message: 'Receipt URL must not exceed 500 characters' });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate update-office-expense request body.
 * All fields optional (partial update), but at least one must be present.
 */
export const validateUpdateExpense = (data) => {
  const errors = [];

  const allowed = [
    'category_id', 'title', 'amount', 'payment_mode',
    'expense_date', 'reference_no', 'vendor_name', 'notes', 'receipt_url',
  ];
  const provided = allowed.filter((k) => data[k] !== undefined);

  if (provided.length === 0) {
    errors.push({ field: 'body', message: 'At least one field must be provided for update' });
    return { isValid: false, errors };
  }

  if (data.category_id !== undefined) {
    if (!Number.isInteger(Number(data.category_id)) || Number(data.category_id) < 1) {
      errors.push({ field: 'category_id', message: 'category_id must be a valid positive integer' });
    }
  }

  if (data.title !== undefined) {
    if (isBlank(data.title)) {
      errors.push({ field: 'title', message: 'Title cannot be empty' });
    } else if (String(data.title).trim().length > 255) {
      errors.push({ field: 'title', message: 'Title must not exceed 255 characters' });
    }
  }

  if (data.amount !== undefined) {
    if (!isPositive(data.amount)) {
      errors.push({ field: 'amount', message: 'Amount must be a positive number' });
    } else if (Number(data.amount) > 99999999.99) {
      errors.push({ field: 'amount', message: 'Amount exceeds maximum allowed value' });
    }
  }

  if (data.expense_date !== undefined) {
    if (!isValidDate(data.expense_date)) {
      errors.push({ field: 'expense_date', message: 'expense_date must be a valid date string (ISO 8601)' });
    }
  }

  if (data.payment_mode !== undefined && !VALID_PAYMENT_MODES.includes(String(data.payment_mode).toUpperCase())) {
    errors.push({
      field: 'payment_mode',
      message: `payment_mode must be one of: ${VALID_PAYMENT_MODES.join(', ')}`,
    });
  }

  if (data.reference_no && String(data.reference_no).length > 100) {
    errors.push({ field: 'reference_no', message: 'Reference number must not exceed 100 characters' });
  }
  if (data.vendor_name && String(data.vendor_name).length > 150) {
    errors.push({ field: 'vendor_name', message: 'Vendor name must not exceed 150 characters' });
  }
  if (data.notes && String(data.notes).length > 1000) {
    errors.push({ field: 'notes', message: 'Notes must not exceed 1000 characters' });
  }
  if (data.receipt_url && String(data.receipt_url).length > 500) {
    errors.push({ field: 'receipt_url', message: 'Receipt URL must not exceed 500 characters' });
  }

  return { isValid: errors.length === 0, errors };
};
