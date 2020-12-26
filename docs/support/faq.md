# Frequently Asked Questions

**If you can't find a solution here, please ask on [Discord](https://discord.gg/PkCWJSeCk7). Please do not post questions on the GitHub issues tracker.**

## General

- [I receive 409 or 400 errors when requesting a movie or tv show!](#general-q1)
- [How do I keep Overseerr up-to-date?](#general-q2)
- [How can I access Overseerr outside my home network?](#general-q3)
- [Overseerr is amazing! But it is not translated in my language yet! Can I help with translations?](#general-q4)
- [Where can I find the changelog?](#general-q5)

## User Management

- [Why can't I see all my Plex users?](#user-q1)
- [Can I create local users in Overseerr?](#user-q2)
- [Is is possible to set user roles in Overseerr?](#user-q3)

## Requests

- [Why does a request still say unavailable?](#requests-q1)
- [I approved a requested movie and radarr didn't search for it!](#requests-q2)
- [Help! My request still shows unavailable even though it shows up in plex!?!](#requests-q3)

## Notifications

- [I am getting an SSL error "`routines:ssl3_get_record:wrong`" when sending email notifications to gmail!](#notifications-q1)

### General

#### <a id="general-q1">Q:</a> I receive 409 or 400 errors when requesting a movie or tv show!

**A:** Verify your are running radarr and sonarr v3. Overseerr was developed for v3 and is not currently backward compatible.

#### <a id="general-q2">Q:</a> How do I keep Overseerr up-to-date?

**A:** It is recommended that you you use a 3rd party updating mechanism for docker such as [Ouroboros](https://github.com/pyouroboros/ouroboros) or [Watchtower](https://github.com/containrrr/watchtower)

#### <a id="general-q3">Q:</a> How can I access Overseerr outside my home network?

**A:** The easy and least secure method is to forward an external port (`5055`) on your router to the internal port used by Overseerr (default is TCP `5055`). Visit [Port Forward](http://portforward.com/) for instructions for your particular router. You will then be able to access Overseerr via `http://EXTERNAL-IP-ADDRESS:5055`.

The more advanced and most preferred method (and more secure if you use SSL) is to set up a web server with NGINX/Apache, and use a reverse proxy to access Overseerr. You can lookup many guides on the internet to find out how to do this. There are several reverse proxy config examples located [here](https://github.com/sct/overseerr/wiki/Reverse-Proxy-Examples).

The most secure method, but also the most inconvenient, is to set up a VPN tunnel to your home server, then you can access Overseerr as if it is on a local network via `http://LOCAL-IP-ADDRESS:5055`.

#### <a id="general-q4">Q:</a> Overseerr is amazing! But it is not translated in my language yet! Can I help with translations?

**A:** You sure can! We are using Weblate for translations! Check it out [here](https://hosted.weblate.org/engage/overseerr/). If your language is not listed please open an [enhancement request in issues](https://github.com/sct/overseerr/issues/new/choose).

#### <a id="general-q5">Q:</a> Where can I find the changelog?

**A:** You can find the changelog in the **Settings -> About** page in your instance. You can also find it on github [here](https://github.com/sct/overseerr/releases).

### User Management

#### <a id="user-q1">Q:</a> Why can't I see all my Plex users?

**A:** Navigate to your **User List** in Overseerr and click <kbd>Import Users From Plex</kbd> button.

#### <a id="user-q2">Q:</a> Can I create local users in Overseerr?

**A:** Not at this time. But it is a planned feature!

#### <a id="user-q3">Q:</a> Is is possible to set user roles in Overseerr?

**A:** Unfortunately, this is not possible today. It is planned!

### Requests

#### <a id="requests-q1">Q:</a> Why does a request still say unavailable?

**A:** Availability is based off whether or not it is in Plex only. Currently, there is no state sync with Sonarr and Radarr.

#### <a id="requests-q2">Q:</a> I approved a requested movie and radarr didn't search for it!

**A:** Check your minimum availability in radarr. If an added item does not meet the minimum availability, no search will be performed.

#### <a id="requests-q3">Q:</a> Help! My request still shows unavailable even though it's in Plex!?!

**A:** Overseerr supports the new Plex Movie, Legacy Plex Movie, and the TMDb Movie agent. Please verify that your library is using one of the agents previously listed. If you are changing agents, a full metadata refresh will need to be performed. Caution, this can take a long time depending on how many items you have in your movie library.

### Notifications

#### <a id="notifications-q1">Q:</a> I am getting an SSL error "`routines:ssl3_get_record:wrong`" when sending email notifications to gmail!

**A:** When setting up your gmail settings use port `465` instead of `587`.
