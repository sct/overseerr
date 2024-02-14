export enum Permission {
  NONE = 0,
  ADMIN = 2,
  MANAGE_USERS = 8,
  MANAGE_REQUESTS = 16,
  REQUEST = 32,
  VOTE = 64,
  AUTO_APPROVE = 128,
  AUTO_APPROVE_MOVIE = 256,
  AUTO_APPROVE_TV = 512,
  AUTO_APPROVE_MUSIC = 268_435_456,
  REQUEST_4K = 1_024,
  REQUEST_4K_MOVIE = 2_048,
  REQUEST_4K_TV = 4_096,
  REQUEST_ADVANCED = 8_192,
  REQUEST_VIEW = 16_384,
  AUTO_APPROVE_4K = 32_768,
  AUTO_APPROVE_4K_MOVIE = 65_536,
  AUTO_APPROVE_4K_TV = 131_072,
  REQUEST_MOVIE = 262_144,
  REQUEST_TV = 524_288,
  REQUEST_MUSIC = 536_870_912,
  MANAGE_ISSUES = 1_048_576,
  VIEW_ISSUES = 2_097_152,
  CREATE_ISSUES = 4_194_304,
  AUTO_REQUEST = 8_388_608,
  AUTO_REQUEST_MOVIE = 16_777_216,
  AUTO_REQUEST_TV = 33_554_432,
  AUTO_REQUEST_MUSIC = 1_073_741_824,
  RECENT_VIEW = 67_108_864,
  WATCHLIST_VIEW = 134_217_728,
}

export interface PermissionCheckOptions {
  type: 'and' | 'or';
}

/**
 * Takes a Permission and the users permission value and determines
 * if the user has access to the permission provided. If the user has
 * the admin permission, true will always be returned from this check!
 *
 * @param permissions Single permission or array of permissions
 * @param value users current permission value
 * @param options Extra options to control permission check behavior (mainly for arrays)
 */
export const hasPermission = (
  permissions: Permission | Permission[],
  value: number,
  options: PermissionCheckOptions = { type: 'and' }
): boolean => {
  let total = 0;

  // If we are not checking any permissions, bail out and return true
  if (permissions === 0) {
    return true;
  }

  if (Array.isArray(permissions)) {
    if (value & Permission.ADMIN) {
      return true;
    }
    switch (options.type) {
      case 'and':
        return permissions.every((permission) => !!(value & permission));
      case 'or':
        return permissions.some((permission) => !!(value & permission));
    }
  } else {
    total = permissions;
  }

  return !!(value & Permission.ADMIN) || !!(value & total);
};
