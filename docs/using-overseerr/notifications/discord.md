# Discord

{% hint style="info" %}
The following notification types will mention _all_ users with the **Manage Requests** permission, as these notification types are intended for application administrators rather than end users:

- Media Requested
- Media Automatically Approved
- Media Failed

On the other hand, the notification types below will only mention the user who submitted the request:

- Media Approved (does not include automatic approvals)
- Media Declined
- Media Available

In order for users to be mentioned in Discord notifications, they must have their [Discord user ID](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) configured and **Enable Mentions** checked in their Discord notification user settings.
{% endhint %}

## Configuration

{% hint style="info" %}
To configure Discord notifications, you first need to [create a webhook](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks).
{% endhint %}

### Bot Username (optional)

If you would like to override the name you configured for your bot in Discord, you may set this value to whatever you like!

### Bot Avatar URL (optional)

Similar to the bot username, you can override the avatar for your bot.

### Webhook URL

You can find the webhook URL in the Discord application, at **Server Settings &rarr; Integrations &rarr; Webhooks**.
