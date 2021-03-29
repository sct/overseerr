# Requests

## Non-4K Requests

To allow users to request non-4K content on Overseerr, they need to have the **Request** permission. If there are no users showing up in the user list, try [importing your users from Plex](../users/README.md#) first.

## 4K Requests

For users to be able to request 4K content:

- A 4K Sonarr/Radarr server needs to be added and selected as a default 4K server.
- Those users need to have the **Request 4K** permission.

## Viewing Download Status

To be able to view the download status of a media item, a user needs to have the **Manage Requests** permission. There are plans for a separate permission to only view the download status without giving a user the **Manage Requests** permission; see [issue #994](https://github.com/sct/overseerr/issues/994) for more details and updates.

## Editing Requests

Users with the **Manage Requests** permission can edit a request before approving it. However, note that it is not possible to edit a request from another user with the **Auto-Approve** permission since the request will have already been sent to the specified Sonarr/Radarr server.

## Deleting Requests

When a request is deleted, the media item will still be present in the Sonarr/Radarr server that was specified if it was already accepted. Also note that deleting a user will delete all requests associated with that user.

## Requesting as Another User

A user with the **Manage Requests** permission can request content on behalf of another user. When doing so, if that user has a quota in effect, the request will count against that quota. The quota of the user will also be shown in the request modal when making the request.
