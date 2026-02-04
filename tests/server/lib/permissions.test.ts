import { hasPermission, Permission } from '@server/lib/permissions';
import { describe, expect, it } from 'vitest';

describe('Permission Enum', () => {
  it('should have correct bitwise values for all permissions', () => {
    expect(Permission.NONE).toBe(0);
    expect(Permission.ADMIN).toBe(2);
    expect(Permission.MANAGE_USERS).toBe(8);
    expect(Permission.MANAGE_REQUESTS).toBe(16);
    expect(Permission.REQUEST).toBe(32);
    expect(Permission.VOTE).toBe(64);
    expect(Permission.AUTO_APPROVE).toBe(128);
    expect(Permission.AUTO_APPROVE_MOVIE).toBe(256);
    expect(Permission.AUTO_APPROVE_TV).toBe(512);
    expect(Permission.REQUEST_4K).toBe(1024);
    expect(Permission.REQUEST_4K_MOVIE).toBe(2048);
    expect(Permission.REQUEST_4K_TV).toBe(4096);
    expect(Permission.REQUEST_ADVANCED).toBe(8192);
    expect(Permission.REQUEST_VIEW).toBe(16384);
    expect(Permission.AUTO_APPROVE_4K).toBe(32768);
    expect(Permission.AUTO_APPROVE_4K_MOVIE).toBe(65536);
    expect(Permission.AUTO_APPROVE_4K_TV).toBe(131072);
    expect(Permission.REQUEST_MOVIE).toBe(262144);
    expect(Permission.REQUEST_TV).toBe(524288);
    expect(Permission.MANAGE_ISSUES).toBe(1048576);
    expect(Permission.VIEW_ISSUES).toBe(2097152);
    expect(Permission.CREATE_ISSUES).toBe(4194304);
    expect(Permission.AUTO_REQUEST).toBe(8388608);
    expect(Permission.AUTO_REQUEST_MOVIE).toBe(16777216);
    expect(Permission.AUTO_REQUEST_TV).toBe(33554432);
    expect(Permission.RECENT_VIEW).toBe(67108864);
    expect(Permission.WATCHLIST_VIEW).toBe(134217728);
  });

  it('should have unique values for each permission', () => {
    const permissions = Object.values(Permission).filter(
      (v) => typeof v === 'number'
    ) as number[];
    const uniquePermissions = [...new Set(permissions)];
    expect(permissions.length).toBe(uniquePermissions.length);
  });
});

describe('hasPermission', () => {
  describe('single permission checks', () => {
    it('should return true when user has exact permission', () => {
      expect(hasPermission(Permission.REQUEST, Permission.REQUEST)).toBe(true);
      expect(hasPermission(Permission.VOTE, Permission.VOTE)).toBe(true);
      expect(
        hasPermission(Permission.MANAGE_USERS, Permission.MANAGE_USERS)
      ).toBe(true);
    });

    it('should return false when user lacks the permission', () => {
      expect(hasPermission(Permission.REQUEST, Permission.NONE)).toBe(false);
      expect(hasPermission(Permission.MANAGE_USERS, Permission.REQUEST)).toBe(
        false
      );
      expect(hasPermission(Permission.ADMIN, Permission.REQUEST)).toBe(false);
    });

    it('should return true for any permission when user is admin', () => {
      expect(hasPermission(Permission.REQUEST, Permission.ADMIN)).toBe(true);
      expect(hasPermission(Permission.MANAGE_USERS, Permission.ADMIN)).toBe(
        true
      );
      expect(hasPermission(Permission.MANAGE_REQUESTS, Permission.ADMIN)).toBe(
        true
      );
      expect(hasPermission(Permission.AUTO_APPROVE, Permission.ADMIN)).toBe(
        true
      );
      expect(hasPermission(Permission.REQUEST_4K, Permission.ADMIN)).toBe(true);
    });

    it('should return true for Permission.NONE regardless of user permissions', () => {
      expect(hasPermission(Permission.NONE, Permission.NONE)).toBe(true);
      expect(hasPermission(Permission.NONE, Permission.REQUEST)).toBe(true);
      expect(hasPermission(Permission.NONE, Permission.ADMIN)).toBe(true);
    });

    it('should handle combined permission values correctly', () => {
      const combinedPermissions = Permission.REQUEST | Permission.VOTE;
      expect(hasPermission(Permission.REQUEST, combinedPermissions)).toBe(true);
      expect(hasPermission(Permission.VOTE, combinedPermissions)).toBe(true);
      expect(hasPermission(Permission.MANAGE_USERS, combinedPermissions)).toBe(
        false
      );
    });
  });

  describe('array permission checks with AND logic (default)', () => {
    it('should return true when user has all permissions', () => {
      const userPermissions =
        Permission.REQUEST | Permission.VOTE | Permission.REQUEST_VIEW;
      expect(
        hasPermission([Permission.REQUEST, Permission.VOTE], userPermissions)
      ).toBe(true);
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.VOTE, Permission.REQUEST_VIEW],
          userPermissions
        )
      ).toBe(true);
    });

    it('should return false when user lacks any permission', () => {
      const userPermissions = Permission.REQUEST | Permission.VOTE;
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS],
          userPermissions
        )
      ).toBe(false);
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.VOTE, Permission.ADMIN],
          userPermissions
        )
      ).toBe(false);
    });

    it('should return true for admin regardless of permissions array', () => {
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS, Permission.VOTE],
          Permission.ADMIN
        )
      ).toBe(true);
      expect(
        hasPermission(
          [
            Permission.AUTO_APPROVE,
            Permission.REQUEST_4K,
            Permission.MANAGE_REQUESTS,
          ],
          Permission.ADMIN
        )
      ).toBe(true);
    });

    it('should handle explicit AND type option', () => {
      const userPermissions = Permission.REQUEST | Permission.VOTE;
      expect(
        hasPermission([Permission.REQUEST, Permission.VOTE], userPermissions, {
          type: 'and',
        })
      ).toBe(true);
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS],
          userPermissions,
          { type: 'and' }
        )
      ).toBe(false);
    });
  });

  describe('array permission checks with OR logic', () => {
    it('should return true when user has at least one permission', () => {
      const userPermissions = Permission.REQUEST;
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS],
          userPermissions,
          { type: 'or' }
        )
      ).toBe(true);
      expect(
        hasPermission([Permission.REQUEST, Permission.VOTE], userPermissions, {
          type: 'or',
        })
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', () => {
      const userPermissions = Permission.VOTE;
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS],
          userPermissions,
          { type: 'or' }
        )
      ).toBe(false);
    });

    it('should return true for admin with OR logic', () => {
      expect(
        hasPermission(
          [Permission.REQUEST, Permission.MANAGE_USERS],
          Permission.ADMIN,
          { type: 'or' }
        )
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty permission array', () => {
      // Empty array with AND logic - every() returns true for empty arrays
      expect(hasPermission([], Permission.REQUEST, { type: 'and' })).toBe(true);
      // Empty array with OR logic - some() returns false for empty arrays
      expect(hasPermission([], Permission.REQUEST, { type: 'or' })).toBe(false);
    });

    it('should handle permission value of 0 (NONE)', () => {
      expect(hasPermission(Permission.REQUEST, 0)).toBe(false);
      expect(hasPermission(Permission.ADMIN, 0)).toBe(false);
    });

    it('should handle admin combined with other permissions', () => {
      const adminWithOthers = Permission.ADMIN | Permission.REQUEST;
      expect(hasPermission(Permission.MANAGE_USERS, adminWithOthers)).toBe(
        true
      );
      expect(hasPermission(Permission.AUTO_APPROVE, adminWithOthers)).toBe(
        true
      );
    });

    it('should correctly handle all request-related permissions', () => {
      const requestUser =
        Permission.REQUEST |
        Permission.REQUEST_MOVIE |
        Permission.REQUEST_TV |
        Permission.REQUEST_4K;

      expect(hasPermission(Permission.REQUEST, requestUser)).toBe(true);
      expect(hasPermission(Permission.REQUEST_MOVIE, requestUser)).toBe(true);
      expect(hasPermission(Permission.REQUEST_TV, requestUser)).toBe(true);
      expect(hasPermission(Permission.REQUEST_4K, requestUser)).toBe(true);
      expect(hasPermission(Permission.REQUEST_4K_MOVIE, requestUser)).toBe(
        false
      );
      expect(hasPermission(Permission.REQUEST_4K_TV, requestUser)).toBe(false);
    });

    it('should correctly handle all auto-approve permissions', () => {
      const autoApproveUser =
        Permission.AUTO_APPROVE |
        Permission.AUTO_APPROVE_MOVIE |
        Permission.AUTO_APPROVE_TV;

      expect(hasPermission(Permission.AUTO_APPROVE, autoApproveUser)).toBe(
        true
      );
      expect(
        hasPermission(Permission.AUTO_APPROVE_MOVIE, autoApproveUser)
      ).toBe(true);
      expect(hasPermission(Permission.AUTO_APPROVE_TV, autoApproveUser)).toBe(
        true
      );
      expect(hasPermission(Permission.AUTO_APPROVE_4K, autoApproveUser)).toBe(
        false
      );
    });

    it('should correctly handle issue-related permissions', () => {
      const issueUser =
        Permission.VIEW_ISSUES |
        Permission.CREATE_ISSUES |
        Permission.MANAGE_ISSUES;

      expect(hasPermission(Permission.VIEW_ISSUES, issueUser)).toBe(true);
      expect(hasPermission(Permission.CREATE_ISSUES, issueUser)).toBe(true);
      expect(hasPermission(Permission.MANAGE_ISSUES, issueUser)).toBe(true);
    });

    it('should handle auto-request permissions', () => {
      const autoRequestUser =
        Permission.AUTO_REQUEST |
        Permission.AUTO_REQUEST_MOVIE |
        Permission.AUTO_REQUEST_TV;

      expect(hasPermission(Permission.AUTO_REQUEST, autoRequestUser)).toBe(
        true
      );
      expect(
        hasPermission(Permission.AUTO_REQUEST_MOVIE, autoRequestUser)
      ).toBe(true);
      expect(hasPermission(Permission.AUTO_REQUEST_TV, autoRequestUser)).toBe(
        true
      );
    });

    it('should handle view permissions', () => {
      const viewUser =
        Permission.REQUEST_VIEW |
        Permission.RECENT_VIEW |
        Permission.WATCHLIST_VIEW;

      expect(hasPermission(Permission.REQUEST_VIEW, viewUser)).toBe(true);
      expect(hasPermission(Permission.RECENT_VIEW, viewUser)).toBe(true);
      expect(hasPermission(Permission.WATCHLIST_VIEW, viewUser)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should allow regular user to make requests', () => {
      const regularUser = Permission.REQUEST | Permission.VOTE;
      expect(hasPermission(Permission.REQUEST, regularUser)).toBe(true);
      expect(hasPermission(Permission.VOTE, regularUser)).toBe(true);
      expect(hasPermission(Permission.MANAGE_REQUESTS, regularUser)).toBe(
        false
      );
    });

    it('should allow request manager to approve requests', () => {
      const requestManager = Permission.MANAGE_REQUESTS | Permission.REQUEST;
      expect(hasPermission(Permission.MANAGE_REQUESTS, requestManager)).toBe(
        true
      );
      expect(hasPermission(Permission.MANAGE_USERS, requestManager)).toBe(
        false
      );
    });

    it('should allow user manager to manage users but not requests', () => {
      const userManager = Permission.MANAGE_USERS;
      expect(hasPermission(Permission.MANAGE_USERS, userManager)).toBe(true);
      expect(hasPermission(Permission.MANAGE_REQUESTS, userManager)).toBe(
        false
      );
    });

    it('should allow power user with 4K and auto-approve', () => {
      const powerUser =
        Permission.REQUEST |
        Permission.REQUEST_4K |
        Permission.AUTO_APPROVE |
        Permission.AUTO_APPROVE_4K;

      expect(hasPermission(Permission.REQUEST, powerUser)).toBe(true);
      expect(hasPermission(Permission.REQUEST_4K, powerUser)).toBe(true);
      expect(hasPermission(Permission.AUTO_APPROVE, powerUser)).toBe(true);
      expect(hasPermission(Permission.AUTO_APPROVE_4K, powerUser)).toBe(true);
      expect(hasPermission(Permission.MANAGE_USERS, powerUser)).toBe(false);
    });

    it('should check if user can view and create issues', () => {
      const issueReporter = Permission.VIEW_ISSUES | Permission.CREATE_ISSUES;
      expect(
        hasPermission(
          [Permission.VIEW_ISSUES, Permission.CREATE_ISSUES],
          issueReporter
        )
      ).toBe(true);
      expect(hasPermission(Permission.MANAGE_ISSUES, issueReporter)).toBe(
        false
      );
    });

    it('should verify admin has all permissions', () => {
      const allPermissions = [
        Permission.MANAGE_USERS,
        Permission.MANAGE_REQUESTS,
        Permission.REQUEST,
        Permission.VOTE,
        Permission.AUTO_APPROVE,
        Permission.REQUEST_4K,
        Permission.MANAGE_ISSUES,
        Permission.VIEW_ISSUES,
        Permission.CREATE_ISSUES,
        Permission.AUTO_REQUEST,
        Permission.RECENT_VIEW,
        Permission.WATCHLIST_VIEW,
      ];

      allPermissions.forEach((perm) => {
        expect(hasPermission(perm, Permission.ADMIN)).toBe(true);
      });
    });
  });
});
