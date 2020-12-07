<p align="center">
<img src="https://i.imgur.com/TMoEG7g.png" alt="Overseerr">
</p>
<p align="center">
<img src="https://github.com/sct/overseerr/workflows/Overseerr%20CI/badge.svg" alt="Overseerr CI">
<a href="https://discord.gg/ySfaEUcQ">
<img src="https://img.shields.io/discord/783137440809746482" alt="Discord">
</a>
<img src="https://img.shields.io/docker/pulls/sctx/overseerr" alt="Docker pulls">
<a href="https://hosted.weblate.org/engage/overseerr/">
<img src="https://hosted.weblate.org/widgets/overseerr/-/overseerr-frontend/svg-badge.svg" alt="Translation status" />
</a>
</p>

**Overseerr** is a tool for managing requests for your media library. It integrates with existing services such as **Sonarr** and **Radarr**!

## Current Features

- Full Plex integration. Login and manage user access with Plex!
- Integrates easily with your existing services. Currently Overseerr supports Sonarr and Radarr. More in the future!
- Syncs to your Plex library to know what titles you already have.
- Complex request system that allows users to request individual seasons or movies in a friendly, easy to use UI.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests.
- Granular permissions system
- Mobile friendly design, for when you need to approve requests on the go!

## In Development

- User profiles
- User settings page to give users the ability to modify their Overseerr experience to their liking
- Version update notifications in-app

## Planned Features

- More notification types (Slack/Telegram/etc)
- Issues system. This will allow users to report issues with content on your media server.
- Local user system (for those who do not use Plex)
- Compatiblity APIs to work with existing tools in your system

## Running Overseerr

Currently, the only distribution of Overseerr is through Docker images. If you have Docker, you can run Overseerr with the following command:

```
docker run -d \
  -e LOG_LEVEL=info \
  -e TZ=Asia/Tokyo \
  -p 5055:3000 \
  -v /path/to/appdata/config:/config \
  --restart unless-stopped \
  sctx/overseer
```

After running Overseerr for the first time, visit the web UI at http://[address]:5055 and complete the setup steps to configure Overseerr.

⚠️ Overseerr is currently under very heavy, rapid development and things are likely to break often. We need all the help we can get to find bugs and get them fixed to hit a more stable release. If you would like to help test the bleeding edge, please use the image **sctx/overseerr:develop** instead! ⚠️

## Preview

<img src="https://i.imgur.com/Mjbyruv.png">

## Support

- You can reach us for support on [Discord](https://discord.gg/ySfaEUcQ).
- Bugs can be opened with an issue on [Github](https://github.com/sct/overseerr/issues).

## API Documentation

Full API documentation will soon be published automatically and available outside of running the app. But currently, you can access the api docs by running Overseerr locally and visiting http://localhost:3000/api-docs

## Contribution

Anyone is welcome to contribute to Docker and pull requests are greatly appreciated! Contributors will be recognized in the future on this very README.

### Developing Overseerr

You can develop Overseer entirely in docker. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed before continuing.

1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop) installed.
2. Run `docker-compose up -d` to start the server.
3. Access the container at http://localhost:3000

If Docker isn't your jam, you can always run Overseer with the following yarn commands:

```
yarn
yarn dev
```

You will need NodeJS installed. Once it's built and running, access it locally at http://localhost:3000 just like Docker.

### Translation

We use [Weblate](https://hosted.weblate.org/engage/overseerr/) for our translations so please feel free to contribute to localizing Overseerr!
