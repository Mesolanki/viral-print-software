/**
 * Validate task creation request payload
 */
export const validateCreateTask = (data) => {
  const errors = [];

  if (!data.company_id || isNaN(Number(data.company_id))) {
    errors.push({ field: 'company_id', message: 'Valid company_id is required' });
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Task title is required' });
  }

  if (data.priority && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT' });
  }

  if (data.status && !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Status must be PENDING, IN_PROGRESS, COMPLETED, or CANCELLED' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate task update request payload
 */
export const validateUpdateTask = (data) => {
  const errors = [];

  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
    errors.push({ field: 'title', message: 'Task title cannot be empty' });
  }

  if (data.priority !== undefined && !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(data.priority)) {
    errors.push({ field: 'priority', message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT' });
  }

  if (data.status !== undefined && !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Status must be PENDING, IN_PROGRESS, COMPLETED, or CANCELLED' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate task status update request payload
 */
export const validateUpdateTaskStatus = (data) => {
  const errors = [];

  if (!data.status || !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(data.status)) {
    errors.push({ field: 'status', message: 'Valid status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED) is required' });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
