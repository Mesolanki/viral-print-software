/**
 * Validation checks for user registration payload
 */
export const validateRegister = (data) => {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
  }
  
  if (!data.username || typeof data.username !== 'string' || data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
  }
  
  if (!data.companyName || typeof data.companyName !== 'string' || data.companyName.trim().length < 2) {
    errors.push({ field: 'companyName', message: 'Company name must be at least 2 characters long' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validation checks for login payload
 */
export const validateLogin = (data) => {
  const errors = [];

  if (!data.username || typeof data.username !== 'string' || data.username.trim().length === 0) {
    errors.push({ field: 'username', message: 'Username is required' });
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
