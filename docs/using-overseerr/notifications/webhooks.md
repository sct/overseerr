# Webhooks

Webhooks let you post a custom JSON payload to any endpoint you like. You can also set an authorization header for security purposes.

## Configuration

The following configuration options are available:

### Webhook URL (Required)

The URL you would like to post notifications to. Your JSON will be sent as the body of the request.

### Authorization Header

Custom authorization header. Anything entered for this will be sent as an `Authorization` header.

### Custom JSON Payload (Required)

Design your JSON payload as you see fit. JSON is validated before you can save or test. Overseerr provides several [template variables](./webhooks.md#template-variables) for use in the payload which will be replaced with actual values when the notifications are sent.

You can always reset back to the default custom payload setting by clicking the `Reset to Default JSON Payload` button under the editor.

## Template Variables

### Main

- `{{notification_type}}` The type of notification. (Ex. `MEDIA_PENDING` or `MEDIA_APPROVED`)
- `{{subject}}` The notification subject message. (For request notifications, this is the media title)
- `{{message}}` Notification message body. (For request notifications, this is the media's overview/synopsis)
- `{{image}}` Associated image with the request. (For request notifications, this is the media's poster)

### Notify User

These variables are usually the target user of the notification.

- `{{notifyuser_username}}` Target user's username.
- `{{notifyuser_email}}` Target user's email.
- `{{notifyuser_avatar}}` Target user's avatar.
- `{{notifyuser_settings_discordId}}` Target user's discord ID (if one is set).

### Media

These variables are only included in media related notifications, such as requests.

- `{{media_type}}` Media type. Either `movie` or `tv`.
- `{{media_tmdbid}}` Media's TMDb ID.
- `{{media_imdbid}}` Media's IMDb ID.
- `{{media_tvdbid}}` Media's TVDB ID.
- `{{media_status}}` Media's availability status (e.g., `AVAILABLE` or `PENDING`).
- `{{media_status4k}}` Media's 4K availability status (e.g., `AVAILABLE` or `PENDING`).

### Special Key Variables

These variables must be used as a key in the JSON Payload. (Ex, `"{{extra}}": []`).

- `{{extra}}` This will override the value of the property to be the pre-formatted "extra" array that can come along with certain notifications. Using this variable is _not required_.
- `{{media}}` This will override the value of the property to `null` if there is no media object passed along with the notification.
- `{{request}}` This will override the value of the property to `null` if there is no request object passed along with the notification.
