# Notifications

Overseerr already supports a good number of notification agents, such as **Discord**, **Slack** and **Pushover**. New agents are always considered for development, if there is enough demand for it.

## Currently supported notification agents

- Discord
- Email
- Pushbullet
- Pushover
- Slack
- Telegram
- [Webhooks](./webhooks.md)

## Setting up notifications

Configuring your notifications is _very simple_. First, you will need to visit the **Settings** page and click **Notifications** in the menu. This will present you with all of the currently available notification agents. Click on each one individually to configure them.

You must configure which type of notifications you want to send _per agent_. If no types are selected, you will not receive any notifications!

Some agents may have specific configuration gotchas that will be covered in each notification agents documentation page.

{% hint style="danger" %}
Currently, you will **not receive notifications** for any auto-approved requests. However, you will still receive a notification when the media becomes available.
{% endhint %}

## Requesting new notification agents

If we do not currently support a notification agent you would like, feel free to request it on [GitHub](https://github.com/sct/overseerr/issues). However, please be sure to search first and confirm that there is not already an existing request for the agent!
