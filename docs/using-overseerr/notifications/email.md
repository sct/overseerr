# Email

{% hint style="info" %}
**Media Requested**, **Media Automatically Approved**, and **Media Failed** email notifications are sent to _all_ users with the **Manage Requests** permission, as these notification types are intended for application administrators rather than end users.

**Media Approved**, **Media Declined**, and **Media Available** email notifications are sent to the user who submitted the request.
{% endhint %}

## Configuration

## Sender Address (required)

Set this to the email address you would like to appear in the "from" field of the email message.

## Sender Name (optional)

Configure a friendly name for the email sender.

## SMTP Host

Set this to the hostname or IP address of your SMTP host/server.

## SMTP Port

Set this to a supported port number for your SMTP host. `465` and `587` are commonly used.

## Enable SSL (optional)

If using an SMTP serves which supports [STARTTLS](https://en.wikipedia.org/wiki/Opportunistic_TLS), this should **not** be enabled. If you configured the SMTP port as `587`, you should leave this unchecked in most cases.

This setting should only be enabled to establish secure connections for hosts which do not support STARTTLS.

## SMTP Username & Password

Configure these values as appropriate to authenticate with your SMTP host.

## PGP Private Key & Password (optional)

Configure these values to enable encrypting and signing of email messages using [OpenPGP](https://www.openpgp.org/). Note that individual users must also have their PGP public keys enabled in their user settings in order for PGP encryption to be used.
