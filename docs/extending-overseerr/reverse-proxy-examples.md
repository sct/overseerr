# Reverse Proxy Examples

{% hint style="warning" %}
Base URLs cannot be configured in Overseerr. With this limitation, only subdomain configurations are supported.
{% endhint %}

## LE/SWAG

### Subdomain

A sample is bundled in SWAG. This page is still the only source of truth, so the sample is not guaranteed to be up to date. If you catch an inconsistency, report it to the linuxserver team, or do a pull-request against the proxy-confs repository to update the sample.

Rename the sample file `overseerr.subdomain.conf.sample` to `overseerr.subdomain.conf` in the `proxy-confs`folder, or create `overseerr.subdomain.conf` in the same folder with the example below. 

Example Configuration:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name overseerr.*;

    include /config/nginx/ssl.conf;

    client_max_body_size 0;

    location / {

        include /config/nginx/proxy.conf;
        resolver 127.0.0.11 valid=30s;
        set $upstream_app overseerr;
        set $upstream_port 5055;
        set $upstream_proto http;
        proxy_pass $upstream_proto://$upstream_app:$upstream_port;

    }

}
```

## Traefik \(v2\)

Add the labels to the Overseerr service in your `docker-compose` file. A basic example for a `docker-compose` file using Traefik can be found [here](https://doc.traefik.io/traefik/user-guides/docker-compose/basic-example/).

### Subdomain

Example Configuration:

```text
labels:
  - "traefik.enable=true"
  ## HTTP Routers
  - "traefik.http.routers.overseerr-rtr.entrypoints=https"
  - "traefik.http.routers.overseerr-rtr.rule=Host(`overseerr.domain.com`)"
  - "traefik.http.routers.overseerr-rtr.tls=true"
  ## HTTP Services
  - "traefik.http.routers.overseerr-rtr.service=overseerr-svc"
  - "traefik.http.services.overseerr-svc.loadbalancer.server.port=5055"
```

## LE/NGINX

### Subdomain

Take the configuration below and place it in `/etc/nginx/sites-available/overseerr.example.com.conf`.

Create a symlink to `/etc/nginx/sites-enabled`:

```text
sudo ln -s /etc/nginx/sites-available/overseerr.example.com.conf /etc/nginx/sites-enabled/overseerr.example.com.conf
```

Test the configuration:

```text
sudo nginx -t
```

Reload your configuration for NGINX:

```text
sudo systemctl reload nginx
```

Example Configuration:

```text
server {
    listen 80;
    server_name overseerr.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name overseerr.example.com;

    ssl_certificate /etc/letsencrypt/live/overseerr.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/overseerr.example.com/privkey.pem;

    proxy_set_header Referer $http_referer;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Real-Port $remote_port;
    proxy_set_header X-Forwarded-Host $host:$remote_port;
    proxy_set_header X-Forwarded-Server $host;
    proxy_set_header X-Forwarded-Port $remote_port;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Ssl on;
    real_ip_header CF-Connecting-IP;
    # Control the behavior of the Referer header (Referrer-Policy)
    add_header Referrer-Policy "no-referrer";
    # HTTP Strict Transport Security
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    # Reduce XSS risks (Content-Security-Policy) - uncomment to use and add URLs whenever necessary
    # add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://plex.tv; style-src 'self' 'unsafe-inline' https://rsms.me/inter/inter.css; script-src 'self'; img-src 'self' data: https://plex.tv https://assets.plex.tv https://gravatar.com https://i2.wp.com https://image.tmdb.org; font-src 'self' https://rsms.me/inter/font-files/" always;
    # Prevent some categories of XSS attacks (X-XSS-Protection)
    add_header X-XSS-Protection "1; mode=block" always;
    # Provide clickjacking protection (X-Frame-Options)
    add_header X-Frame-Options "SAMEORIGIN" always;
    # Prevent Sniff Mimetype (X-Content-Type-Options)
    add_header X-Content-Type-Options "nosniff" always;

    access_log /var/log/nginx/overseerr.example.com-access.log;
    error_log /var/log/nginx/overseerr.example.com-error.log;

    location / {
        proxy_pass http://127.0.0.1:5055;
    }
}
```

