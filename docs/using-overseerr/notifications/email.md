# Email

{% hint style="info" %}
The following email notification types are sent to _all_ users with the **Manage Requests** permission, as these notification types are intended for application administrators rather than end users:

- Media Requested
- Media Automatically Approved
- Media Failed

On the other hand, the email notification types below are only sent to the user who submitted the request:

- Media Approved (does not include automatic approvals)
- Media Declined
- Media Available

In order for users to receive email notifications, they must have **Enable Notifications** checked in their email notification user settings.
{% endhint %}

## Configuration

### Sender Address

Set this to the email address you would like to appear in the "from" field of the email message.

Depending on your email provider, this may need to be an address you own. For example, Gmail requires this to be your actual email address.

### Sender Name (optional)

Configure a friendly name for the email sender.

### SMTP Host

Set this to the hostname or IP address of your SMTP host/server.

### SMTP Port

Set this to a supported port number for your SMTP host. `465` and `587` are commonly used.

### Enable SSL (optional)

This setting should only be enabled for ports that use [implicit SSL/TLS](https://tools.ietf.org/html/rfc8314) (e.g., port `465` in most cases).

For servers that support [opportunistic TLS/STARTTLS](https://en.wikipedia.org/wiki/Opportunistic_TLS) (typically via port `587`), this setting should **not** be enabled.

### SMTP Username & Password

{% hint style="info" %}
If your account has two-factor authentication enabled, you may need to create an application password instead of using your account password.
{% endhint %}

Configure these values as appropriate to authenticate with your SMTP host.

### PGP Private Key & Password (optional)

Configure these values to enable encrypting and signing of email messages using [OpenPGP](https://www.openpgp.org/). Note that individual users must also have their **PGP public keys** configured in their user settings in order for PGP encryption to be used in messages addressed to them.

When configuring the PGP keys, be sure to keep the entire contents of the key intact. For example, private keys always begin with `-----BEGIN PGP PRIVATE KEY BLOCK-----` and end with `-----END PGP PRIVATE KEY BLOCK-----`.
