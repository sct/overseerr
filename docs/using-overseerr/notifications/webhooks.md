# Webhooks

The webhook notification agent in Overseerr allows you to send custom JSON payloads to any specified endpoint when certain notification events occur. This is useful for integrating with third-party services, automating workflows, or triggering external processes based on activity within Overseerr.

## Configuration

### Webhook URL

Specify the URL where notifications should be sent. The JSON payload will be included in the body of the HTTP request.

### Authorization Header (Optional)

{% hint style="info" %}
This is typically not required. Please refer to your webhook provider's documentation for details on whether authentication is needed.
{% endhint %}

If required, an authorization value can be included in the request's `Authorization` header.

### JSON Payload

You can customize the JSON payload to match your needs. Overseerr supports several [template variables](#template-variables), which will be dynamically replaced with relevant data when a notification is triggered.

## Template Variables

### General Variables

| Variable                | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `{{notification_type}}` | The type of notification (e.g., `MEDIA_PENDING`, `ISSUE_COMMENT`)                                               |
| `{{event}}`             | A descriptive label for the notification event                                                                  |
| `{{subject}}`           | The subject of the notification (typically the media title)                                                     |
| `{{message}}`           | The body of the notification message (e.g., media overview for requests, issue description for issues)         |
| `{{image}}`             | The associated image (typically the media poster)                                                              |

### Notify User Variables

These variables contain information about the recipient of the notification.

| Variable                                 | Description                                               |
| ---------------------------------------- | --------------------------------------------------------- |
| `{{notifyuser_username}}`                | The recipient's username                                  |
| `{{notifyuser_email}}`                   | The recipient's email address                            |
| `{{notifyuser_avatar}}`                  | The recipient's avatar URL                               |
| `{{notifyuser_settings_discordId}}`      | The recipient's Discord ID (if set)                      |
| `{{notifyuser_settings_telegramChatId}}` | The recipient's Telegram Chat ID (if set)                |

{% hint style="info" %}
The `notifyuser` variables are not defined for certain request notification types intended for administrators:
- Request Pending Approval
- Request Automatically Approved
- Request Processing Failed

However, for these notifications, the `notifyuser` variables will be replaced with the requesting user's information:
- Request Approved
- Request Declined
- Request Available

If you need to reference the requesting user's details, use the variables from the [Request](#request) section below.
{% endhint %}

### Special Variables

Some variables represent entire objects and must be included as JSON keys (e.g., `"{{extra}}": []`).

| Variable      | Description                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `{{media}}`   | The media object related to the notification                                                        |
| `{{request}}` | The request object associated with the notification                                                 |
| `{{issue}}`   | The issue object related to the notification                                                        |
| `{{comment}}` | The comment object associated with the issue notification                                          |
| `{{extra}}`   | Additional data for certain notifications (e.g., season/episode numbers for TV show notifications) |

#### Media Variables

The `{{media}}` variable will be `null` if no media object is associated with the notification.

| Variable             | Description                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `{{media_type}}`     | The media type (`movie` or `tv`)                                                             |
| `{{media_tmdbid}}`   | The media's TMDB ID                                                                          |
| `{{media_tvdbid}}`   | The media's TheTVDB ID                                                                       |
| `{{media_status}}`   | The media's availability status (`UNKNOWN`, `PENDING`, `PROCESSING`, `PARTIALLY_AVAILABLE`, or `AVAILABLE`)    |
| `{{media_status4k}}` | The 4K availability status (`UNKNOWN`, `PENDING`, `PROCESSING`, `PARTIALLY_AVAILABLE`, or `AVAILABLE`) |

#### Request Variables

The `{{request}}` variable will be `null` if there is no request-related notification.

| Variable                                  | Description                                |
| ----------------------------------------- | ------------------------------------------ |
| `{{request_id}}`                          | The ID of the request                     |
| `{{requestedBy_username}}`                | The username of the requesting user       |
| `{{requestedBy_email}}`                   | The email address of the requesting user  |
| `{{requestedBy_avatar}}`                  | The avatar URL of the requesting user     |
| `{{requestedBy_settings_discordId}}`      | The Discord ID of the requesting user (if set)  |
| `{{requestedBy_settings_telegramChatId}}` | The Telegram Chat ID of the requesting user (if set) |

#### Issue Variables

The `{{issue}}` variable will be `null` if no issue is associated with the notification.

| Variable                                 | Description                               |
| ---------------------------------------- | ----------------------------------------- |
| `{{issue_id}}`                           | The ID of the issue                      |
| `{{reportedBy_username}}`                | The username of the reporting user       |
| `{{reportedBy_email}}`                   | The email of the reporting user          |
| `{{reportedBy_avatar}}`                  | The avatar URL of the reporting user     |
| `{{reportedBy_settings_discordId}}`      | The Discord ID of the reporting user (if set)  |
| `{{reportedBy_settings_telegramChatId}}` | The Telegram Chat ID of the reporting user (if set) |

#### Comment Variables

The `{{comment}}` variable will be `null` if there is no comment-related notification.

| Variable                                  | Description                               |
| ----------------------------------------- | ----------------------------------------- |
| `{{comment_message}}`                     | The content of the comment               |
| `{{commentedBy_username}}`                | The username of the commenter            |
| `{{commentedBy_email}}`                   | The email address of the commenter       |
| `{{commentedBy_avatar}}`                  | The avatar URL of the commenter          |
| `{{commentedBy_settings_discordId}}`      | The Discord ID of the commenter (if set) |
| `{{commentedBy_settings_telegramChatId}}` | The Telegram Chat ID of the commenter (if set) |

## Testing Webhooks

To ensure your webhook configuration is working correctly, you can use tools like:

- **[Beeceptor](https://beeceptor.com/)** – Quickly test and debug webhook requests by setting up a mock endpoint.
- **[Webhook.site](https://webhook.site/)** – Capture and inspect HTTP requests for debugging purposes.

These tools help verify that Overseerr is sending the correct data and allow you to adjust your payloads accordingly.
