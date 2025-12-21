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
  REQUEST_4K = 1024,
  REQUEST_4K_MOVIE = 2048,
  REQUEST_4K_TV = 4096,
  REQUEST_ADVANCED = 8192,
  REQUEST_VIEW = 16384,
  AUTO_APPROVE_4K = 32768,
  AUTO_APPROVE_4K_MOVIE = 65536,
  AUTO_APPROVE_4K_TV = 131072,
  REQUEST_MOVIE = 262144,
  REQUEST_TV = 524288,
  MANAGE_ISSUES = 1048576,
  VIEW_ISSUES = 2097152,
  CREATE_ISSUES = 4194304,
  AUTO_REQUEST = 8388608,
  AUTO_REQUEST_MOVIE = 16777216,
  AUTO_REQUEST_TV = 33554432,
  RECENT_VIEW = 67108864,
  WATCHLIST_VIEW = 134217728,
}

export interface PermissionCheckOptions {
  type: 'and' | 'or';
}

function isAutoApprovePermission(perm: Permission): boolean {
  return (
    perm === Permission.AUTO_APPROVE ||
    perm === Permission.AUTO_APPROVE_MOVIE ||
    perm === Permission.AUTO_APPROVE_TV ||
    perm === Permission.AUTO_APPROVE_4K ||
    perm === Permission.AUTO_APPROVE_4K_MOVIE ||
    perm === Permission.AUTO_APPROVE_4K_TV
  );
}

export const hasPermission = (
  permissions: Permission | Permission[],
  userPermissionValue: number,
  options: PermissionCheckOptions = { type: 'and' }
): boolean => {
  // 1) Normalize permissions to an array
  const requiredPermissions: Permission[] = Array.isArray(permissions)
    ? permissions
    : [permissions];

  // 2) If we're not checking any permissions at all, return true
  if (requiredPermissions.length === 0) {
    return true;
  }

  // 3) If it’s an array of permissions, handle "and"/"or"
  if (Array.isArray(permissions)) {
    // Check if this array includes ANY auto-approve permission
    const includesAutoApprove = requiredPermissions.some((perm) =>
      isAutoApprovePermission(perm)
    );

    if (!includesAutoApprove && userPermissionValue & Permission.ADMIN) {
      // If there's NO auto-approve permission in the list, then
      // "admin = true" as usual
      return true;
    }

    // Otherwise, we do the normal bit checks for each required permission
    switch (options.type) {
      case 'and':
        // "and": user must have *all* required permissions
        return requiredPermissions.every(
          (perm) => !!(userPermissionValue & perm)
        );
      case 'or':
        // "or": user must have at least one required permission
        return requiredPermissions.some(
          (perm) => !!(userPermissionValue & perm)
        );
    }
  }

  // 4) If it's a single permission (not an array)
  const singlePerm = requiredPermissions[0];
  // If it's NOT an auto-approve permission, let admin pass automatically
  if (
    !isAutoApprovePermission(singlePerm) &&
    userPermissionValue & Permission.ADMIN
  ) {
    return true;
  }

  // Otherwise, must explicitly match the permission bit
  return !!(userPermissionValue & singlePerm);
};
