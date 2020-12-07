<p align="center">
<img src="https://i.imgur.com/TMoEG7g.png" alt="Overseerr">
</p>
<p align="center">
<img src="https://github.com/sct/overseerr/workflows/Overseerr%20CI/badge.svg" alt="Overseerr CI">
<img src="https://img.shields.io/discord/783137440809746482" alt="Discord">
<img src="https://img.shields.io/docker/pulls/sctx/overseerr" alt="Docker pulls">
<img src="https://hosted.weblate.org/widgets/overseerr/-/overseerr-frontend/svg-badge.svg" alt="Translation">
</p>

**Overseerr** is a tool for managing requests for your media library. It integrates with existing services such as **Sonarr** and **Radarr**!

## Current Features

- Full Plex integration. Login and manage user access with Plex!
- Integrates easily with your existing services. Currently Overseerr supports Sonarr and Radarr. More in the future!
- Syncs to your Plex library to know what titles you already have.
- Complex request system that allows users to request individual seasons or movies in a friendly, easy to use UI.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests.
- Mobile friendly design, for when you need to approve requests on the go!

## In Development

- Full request page that gives you more refined control and details.
- Actor page with movies/shows they have been in.
- Ability to sync users from your Plex with Overseerr.

## Planned Features

- A more advanced notification system supporting a lot more apps such as slack/telegram/etc.

## Preview

<img src="https://i.imgur.com/Mjbyruv.png">

## Support

- You can reach us for support on [Discord](https://discord.gg/ySfaEUcQ).
- Bugs can be opened with an issue on [Github](https://github.com/sct/overseerr/issues).

## API Documentation

- Coming soon

## Contribution

You can develop Overseer entirely in docker. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed before continuing.

1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.
2. Run `docker-compose up -d` to start the server.
3. Access the container at http://localhost:3000

That's it!
