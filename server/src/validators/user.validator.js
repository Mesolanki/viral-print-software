/**
 * Valid role names as defined in the database seed
 */
export const VALID_ROLES = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'SALES', 'CASHIER', 'OPERATOR'];

/**
 * Valid user statuses
 */
export const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

/**
 * Validate create-user request body (Admin only)
 */
export const validateCreateUser = (data) => {
  const errors = [];

  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
  }

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
    errors.push({ field: 'username', message: 'Username can only contain letters, numbers and underscores' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  if (!data.confirmPassword || data.confirmPassword !== data.password) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  if (!data.role || !VALID_ROLES.includes(data.role.toUpperCase())) {
    errors.push({
      field: 'role',
      message: `Role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate update-user request body (Admin only)
 * All fields are optional on update
 */
export const validateUpdateUser = (data) => {
  const errors = [];

  if (data.fullName !== undefined) {
    if (typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
      errors.push({ field: 'fullName', message: 'Full name must be at least 2 characters' });
    }
  }

  if (data.username !== undefined) {
    if (typeof data.username !== 'string' || data.username.trim().length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
    } else if (!/^[a-zA-Z0-9_]+$/.test(data.username.trim())) {
      errors.push({ field: 'username', message: 'Username can only contain letters, numbers and underscores' });
    }
  }

  if (data.password !== undefined) {
    if (typeof data.password !== 'string' || data.password.length < 6) {
      errors.push({ field: 'password', message: 'New password must be at least 6 characters' });
    }
    if (data.confirmPassword !== data.password) {
      errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }
  }

  if (data.role !== undefined && !VALID_ROLES.includes(data.role.toUpperCase())) {
    errors.push({
      field: 'role',
      message: `Role must be one of: ${VALID_ROLES.join(', ')}`,
    });
  }

  if (data.status !== undefined && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  return { isValid: errors.length === 0, errors };
};
