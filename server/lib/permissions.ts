export enum Permission {
  NONE = 0,
  ADMIN = 2,
  MANAGE_SETTINGS = 4,
  MANAGE_USERS = 8,
  MANAGE_REQUESTS = 16,
  REQUEST = 32,
  VOTE = 64,
  AUTO_APPROVE = 128,
  AUTO_APPROVE_MOVIE = 256,
  AUTO_APPROVE_TV = 512,
  REQUEST_4K = 1024,
  REQUEST_4K_MOVIE = 2048,
  REQUEST_4K_TV = 4096,
  REQUEST_ADVANCED = 8192,
}

/**
 * Takes a Permission and the users permission value and determines
 * if the user has access to the permission provided. If the user has
 * the admin permission, true will always be returned from this check!
 *
 * @param permissions Single permission or array of permissions
 * @param value users current permission value
 */
export const hasPermission = (
  permissions: Permission | Permission[],
  value: number
): boolean => {
  let total = 0;

  // If we are not checking any permissions, bail out and return true
  if (permissions === 0) {
    return true;
  }

  if (Array.isArray(permissions)) {
    // Combine all permission values into one
    total = permissions.reduce((a, v) => a + v, 0);
  } else {
    total = permissions;
  }

  return !!(value & Permission.ADMIN) || !!(value & total);
};
