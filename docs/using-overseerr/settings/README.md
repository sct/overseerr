# Settings

## General

### API Key

This is your Overseerr API key, which can be used to integrate Overseerr with third-party applications. Do **not** share this key publicly, as it can be used to gain administrator access!

If you need to generate a new API key for any reason, simply click the button to the right of the text box.

### Application Title

If you aren't a huge fan of the name "Overseerr" and would like to display something different to your users, you can customize the application title!

### Application URL

Set this to the externally-accessible URL of your Overseerr instance. If configured, [notifications](../notifications/README.md) will include links!

### Enable Proxy Support

If you have Overseerr behind a [reverse proxy](../../extending-overseerr/reverse-proxy-examples.md), enable this setting to allow Overseerr to correctly register client IP addresses. For details, please see the [Express documentation](http://expressjs.com/en/guide/behind-proxies.html).

This setting is disabled by default.

### Enable CSRF Protection

{% hint style="danger" %}
DO NOT ENABLE THIS SETTING UNLESS YOU UNDERSTAND WHAT YOU ARE DOING!
{% endhint %}

CSRF stands for **Cross-Site Request Forgery**. When this setting is enabled, all external API access that alters Overseerr application data is blocked.

If you do not use Overseerr integrations with third-party applications to add/modify/delete requests or users, you can consider enabling this setting to protect against malicious attacks.

One caveat, however, is that **HTTPS is required**, meaning that once this setting is enabled, you will no longer be able to access your Overseerr instance over HTTP (including using an IP address and port number).

If you enable this setting and find yourself unable to access Overseerr, you can disable the setting by modifying `settings.json` in `/app/config`.

This setting is disabled by default.

### Enable Image Caching

{% hint style="danger" %}
This feature is experimental. Enable it at your own risk!
{% endhint %}

When enabled, all images (including media posters from TMDb) will be cached locally on your server. Images will also be optimized for client devices; i.e., if you access Overseerr using a mobile device, smaller versions will be served compared to when accessing Overseerr on desktop.

Note that this feature requires and will use a significant amount of disk space!

This setting is disabled by default.

### Discover Region & Discover Language

These settings filter content shown on the "Discover" home page based on regional availability and original language, respectively. Users can override these global settings by configuring these same options in their user settings.

### Hide Available Media

When enabled, media which is already available will not appear on the "Discover" home page, or in the "Recommended" or "Similar" categories or other links on media detail pages.

Available media will still appear in search results, however, so it is possible to locate and view hidden items by searching for them by title.

### Allow Partial Series Requests

When enabled, users will be able to submit requests for specific seasons of TV series. If disabled, users will only be able to submit requests for all unavailable seasons.

This setting is enabled by default.

## Users

### Enable Local User Sign-In

When enabled, users who have configured passwords will be allowed to sign in using their email address.

When disabled, Plex OAuth becomes the only sign-in option, and any "local users" you have created will not be able to sign in to Overseerr.

This setting is enabled by default.

### Default User Permissions

Select the permissions you would like new users to have by default. It is important to set these, as any user with access to your Plex server will be able to log in to Overseerr, and they will be granted the permissions you select here.

## Plex

This section of the documentation is not yet complete. Please check back later!

## Services

This section of the documentation is not yet complete. Please check back later!

## Notifications

Please see [Notifications](../notifications/README.md) for details on configuring and enabling notifications.

## Jobs & Cache

Overseerr performs certain maintenance tasks as regularly-scheduled jobs, but they can also be manually triggered on this page.

Overseerr also caches requests to external API endpoints to optimize performance and avoid making unnecessary API calls. If necessary, the cache for any particular endpoint can be cleared by clicking the "Flush Cache" button.
