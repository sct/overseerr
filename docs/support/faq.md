# Frequently Asked Questions

**If you can't find a solution here, please ask on** [**Discord**](https://discord.gg/PkCWJSeCk7)**. Please do not post questions on the GitHub issues tracker.**

## General

### I receive 409 or 400 errors when requesting a movie or tv show!

**A:** Verify your are running radarr and sonarr v3. Overseerr was developed for v3 and is not currently backward compatible.

### How do I keep Overseerr up-to-date?

**A:** It is recommended that you you use a 3rd party updating mechanism for docker such as [Ouroboros](https://github.com/pyouroboros/ouroboros) or [Watchtower](https://github.com/containrrr/watchtower)

### How can I access Overseerr outside my home network?

**A:** The easy and least secure method is to forward an external port \(`5055`\) on your router to the internal port used by Overseerr \(default is TCP `5055`\). Visit [Port Forward](http://portforward.com/) for instructions for your particular router. You will then be able to access Overseerr via `http://EXTERNAL-IP-ADDRESS:5055`.

The more advanced and most preferred method \(and more secure if you use SSL\) is to set up a web server with NGINX/Apache, and use a reverse proxy to access Overseerr. You can lookup many guides on the internet to find out how to do this. There are several reverse proxy config examples located [here](https://github.com/sct/overseerr/wiki/Reverse-Proxy-Examples).

The most secure method, but also the most inconvenient, is to set up a VPN tunnel to your home server, then you can access Overseerr as if it is on a local network via `http://LOCAL-IP-ADDRESS:5055`.

### Overseerr is amazing! But it is not translated in my language yet! Can I help with translations?

**A:** You sure can! We are using Weblate for translations! Check it out [here](https://hosted.weblate.org/engage/overseerr/). If your language is not listed please open an [enhancement request in issues](https://github.com/sct/overseerr/issues/new/choose).

### Where can I find the changelog?

**A:** You can find the changelog in the **Settings -&gt; About** page in your instance. You can also find it on github [here](https://github.com/sct/overseerr/releases).

### Can I make 4K requests?

**A:** 4K requests are not supported just yet but they will be supported in the future!

### Some media is missing from Overseerr that I know is in Plex!

**A:** Overseerr supports the new Plex Movie, Legacy Plex Movie, TheTVDB agent, and the TMDb agent. Please verify that your library is using one of the agents previously listed. If you are changing agents, a full metadata refresh will need to be performed. Caution, this can take a long time depending on how many items you have in your movie library.

**Troubleshooting Steps:**

Check the Overseerr logs for media items that are missing. The logs will contain an error as to why that item could not be matched. One example would be `errorMessage":"SQLITE_CONSTRAINT: NOT NULL`. This means that the TMDb ID is missing for that item.

1. Verify that you are using one of the agents mentioned above.
2. Refresh the metadata for just that item.
3. Run a full scan in Overseerr to see if that item is now matched properly. 
4. If the item is now seen by Overseerr then repeat step 2 for each missing item. If you have a large amount of items missing then a full metadata refresh is recommended for that library. Run a full scan on Overseerr after refreshing all unmached items. 

Perform these steps to verify the media item has a guid Overseerr can match.

1. Go to the media item in Plex and **"Get info"** and click on **"View XML"**.
2. Verify that the media item has the same format of one of the examples below.

**Examples:**

1. TMDB agent `guid="com.plexapp.agents.themoviedb://1705"`
2. The new Plex Movie agent `<Guid id="tmdb://464052"/>`
3. TheTVDB agent `guid="com.plexapp.agents.thetvdb://78874/1/1"`
4. Legacy Plex Movie agent `guid="com.plexapp.agents.imdb://tt0765446"`

## User Management

### Why can't I see all my Plex users?

**A:** Navigate to your **User List** in Overseerr and click Import Users From Plex button.

### Can I create local users in Overseerr?

**A:** Not at this time. But it is a planned feature!

### Is is possible to set user roles in Overseerr?

**A:** Unfortunately, this is not possible today. It is planned!

## Requests

### Why does a request still say unavailable?

**A:** Availability is based off whether or not it is in Plex only. Currently, there is no state sync with Sonarr and Radarr.

### I approved a requested movie and radarr didn't search for it!

**A:** Check your minimum availability in radarr. If an added item does not meet the minimum availability, no search will be performed.

### Help! My request still shows unavailable even though it's in Plex!?!

**A:** Overseerr supports the new Plex Movie, Legacy Plex Movie, and the TMDb Movie agent. Please verify that your library is using one of the agents previously listed. If you are changing agents, a full metadata refresh will need to be performed. Caution, this can take a long time depending on how many items you have in your movie library.

## Notifications

### I am getting "Username and Password not accepted" when sending email notifications to gmail!

**A:** If you have 2-Step Verification enabled on your account you will need to create an app password. More details can be found [here](https://support.google.com/mail/answer/185833).

