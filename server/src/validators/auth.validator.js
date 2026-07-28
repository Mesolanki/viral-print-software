/**
 * Validate login request body
 */
export const validateLogin = (data) => {
  const errors = [];

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate change-password request body
 */
export const validateChangePassword = (data) => {
  const errors = [];

  if (!data.oldPassword || data.oldPassword.length === 0) {
    errors.push({ field: 'oldPassword', message: 'Current password is required' });
  }

  if (!data.newPassword || data.newPassword.length < 6) {
    errors.push({ field: 'newPassword', message: 'New password must be at least 6 characters' });
  }

  if (!data.confirmPassword || data.confirmPassword !== data.newPassword) {
    errors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate register request body
 */
export const validateRegister = (data) => {
  const errors = [];

  if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length === 0) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  }

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
  }

  return { isValid: errors.length === 0, errors };
};

