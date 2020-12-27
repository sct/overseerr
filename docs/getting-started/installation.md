# Installation

{% hint style="danger" %}
Overseerr is currently under very heavy, rapid development and things are likely to break often. We need all the help we can get to find bugs and get them fixed to hit a more stable release. If you would like to help test the bleeding edge, please use the image **`sctx/overseerr:develop`** instead! 
{% endhint %}

{% hint style="info" %}
After running Overseerr for the first time, configure it by visiting the web UI at `http://[address]:5055` and completing the setup steps.
{% endhint %}

## Docker

{% tabs %}
{% tab title="Basic" %}
```bash
docker run -d \
  -e LOG_LEVEL=info \
  -e TZ=Asia/Tokyo \
  -p 5055:5055 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  sctx/overseerr
```
{% endtab %}

{% tab title="UID/GID" %}
```
docker run -d \
  --user=[ user | user:group | uid | uid:gid | user:gid | uid:group ] \
  -e LOG_LEVEL=info \
  -e TZ=Asia/Tokyo \
  -p 5055:5055 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
   sctx/overseerr
```
{% endtab %}

{% tab title="Manual Update" %}
```
# Stop the Overseerr container
docker stop overseerr

# Remove the Overseerr container
docker rm overseerr

# Pull the latest update
docker pull sctx/overseerr

# Run the Overseerr container with the same parameters as before
docker run -d ...
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
Use a 3rd party updating mechanism such as [Watchtower](https://github.com/containrrr/watchtower) or [Ouroboros](https://github.com/pyouroboros/ouroboros) to keep Overseerr up-to-date automatically.
{% endhint %}

## Unraid

1. Ensure you have the **Community Applications** plugin installed.
2. Inside the **Communtiy Applications** app store, search for **Overseerr**.
3. Click the **Install Button**.
4. On the following **Add Container** screen, make changes to the **Host Port** and **Host Path 1**\(Appdata\) as needed.
5. Click apply and access "Overseerr" at your `<ServerIP:HostPort>` in a web browser.

## Windows

Please refer to the [docker for windows documentation](https://docs.docker.com/docker-for-windows/) for installation.

{% hint style="danger" %}
**WSL2 will need to be installed to prevent DB corruption! Please see** [**Docker Desktop WSL 2 backend**](https://docs.docker.com/docker-for-windows/wsl/) **on how to enable WSL2. The command below will only work with WSL2 installed! Details below.**
{% endhint %}

```bash
docker run -d -e LOG_LEVEL=info -e TZ=Asia/Tokyo -p 5055:5055 -v "/your/path/here:/app/config" --restart unless-stopped sctx/overseerr
```

{% hint style="info" %}
Docker on Windows works differently than it does on Linux; it uses a VM to run a stripped-down Linux and then runs docker within that. The volume mounts are exposed to the docker in this VM via SMB mounts. While this is fine for media, it is unacceptable for the `/app/config` directory because SMB does not support file locking. This will eventually corrupt your database which can lead to slow behavior and crashes. If you must run in docker on Windows, you should put the `/app/config` directory mount inside the VM and not on the Windows host. It's worth noting that this warning also extends to other containers which use SQLite databases.
{% endhint %}

## ArchLinux \(Third party\)

Built from tag \(master\): [https://aur.archlinux.org/packages/overseerr/](https://aur.archlinux.org/packages/overseerr/)  
Built from latest \(develop\): [aur.archlinux.org/packages/overseerr-git](https://aur.archlinux.org/packages/overseerr-git/)  
**To install these just use your favorite AUR package manager:**

```bash
yay -S overseer
```

