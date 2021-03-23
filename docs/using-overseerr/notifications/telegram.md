# Telegram

{% hint style="info" %}
All notification types will be sent to the chat ID configured in your Overseerr application settings.

If a user has configured a chat ID and has **Enable Notifications** checked in their Telegram notification user settings as well, they will be sent the following notification types for requests which they submit:

- Media Approved (does not include automatic approvals)
- Media Declined
- Media Available

{% endhint %}

## Configuration

{% hint style="info" %}
In order to configure Telegram notifications, you first need to [create a bot](https://telegram.me/BotFather).

Bots **cannot** initiate conversations with users, users must have your bot added to a conversation in order to receive notifications.
{% endhint %}

### Bot Username (optional)

If this value is configured, a link will be displayed in notification user settings to allow users to easily start a conversation with your bot.

This username should end with `_bot`, and the `@` prefix should be omitted.

### Bot Authentication Token

At the end of the bot creation process, [@BotFather](https://telegram.me/botfather) will provide an authentication token.

### Chat ID

To obtain your chat ID, simply create a new chat, add [@get_id_bot](https://telegram.me/get_id_bot), and issue the `/my_id` command.

### Send Silently (optional)

Instagram allows you to enable silent notifications. Those will present a pop-up to the user, but will not make any sound. That's a per user configuration.
