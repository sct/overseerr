# Users

## Owner Account

The user account created during Overseerr setup is the "Owner" account, which cannot be deleted or modified by other users. This account's credentials are used to authenticate with Plex.

## Adding Users

There are currently two methods to add users to Overseerr: importing Plex users and creating "local users." All new users are created with the [default permissions](../settings/README.md#default-user-permissions) defined in **Settings &rarr; Users**.

### Importing Users from Plex

Clicking the **Import Users from Plex** button on the **User List** page will fetch the list of users with access to the Plex server from [plex.tv](https://www.plex.tv/), and add them to Overseerr automatically.

Importing Plex users is not required, however. Any user with access to the Plex server can log in to Overseerr even if they have not been imported, and will be assigned the configured [default permissions](../settings/README.md#default-user-permissions) upon their first login.

### Creating Local Users

If you would like to grant Overseerr access to a user who doesn't have their own Plex account and/or access to the Plex server, you can manually add them by clicking the **Create Local User** button.

#### Email Address

Enter a valid email address at which the user can receive messages pertaining to their account and other notifications. The email address currently cannot be modified after the account is created.

#### Automatically Generate Password

If [email notifications](../notifications/email.md) have been configured and enabled, Overseerr can automatically generate a password for the new user.

### Password

If you would prefer to manually configure a password, enter a password here that is a minimum of 8 characters.

## Editing Users

From the **User List**, you can click the **Edit** button to modify a particular user's settings.

You can also click the check boxes and click the **Bulk Edit** button to set user permissions for multiple users at once.

### Display Name

You can optionally set a "friendly name" for any user. This name will be used in lieu of their Plex username (for users imported from Plex) or their email address (for manually-created local users).

### Password

All "local users" are assigned passwords upon creation, but users imported from Plex can also optionally configure passwords to enable sign-in using their email address.

Passwords must be a minimum of 8 characters long.

### Permissions

Users cannot modify their own permissions. Users with the **Manage Settings** permission can manage permissions of other users, except those of users with the **Admin** permission.

## Deleting Users

When users are deleted, all of their data and request history is also cleared from the database.
