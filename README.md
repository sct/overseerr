<p align="center">
<img src="https://i.imgur.com/TMoEG7g.png" alt="Overseerr">
</p>
<p align="center">
<img src="https://github.com/sct/overseerr/workflows/Overseerr%20Release/badge.svg?branch=master" alt="Overseerr Release" />
<img src="https://github.com/sct/overseerr/workflows/Overseerr%20CI/badge.svg" alt="Overseerr CI">
</p>
<p align="center">
<a href="https://discord.gg/PkCWJSeCk7">
<img src="https://img.shields.io/discord/783137440809746482" alt="Discord">
</a>
<img src="https://img.shields.io/docker/pulls/sctx/overseerr" alt="Docker pulls">
<a href="https://hosted.weblate.org/engage/overseerr/">
<img src="https://hosted.weblate.org/widgets/overseerr/-/overseerr-frontend/svg-badge.svg" alt="Translation status" />
</a>
<a href="https://lgtm.com/projects/g/sct/overseerr/context:javascript"><img alt="Language grade: JavaScript" src="https://img.shields.io/lgtm/grade/javascript/g/sct/overseerr.svg?logo=lgtm&logoWidth=18"/></a>
<img alt="GitHub" src="https://img.shields.io/github/license/sct/overseerr">
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
<a href="#contributors-"><img alt="All Contributors" src="https://img.shields.io/badge/all_contributors-8-orange.svg"/></a>
<!-- ALL-CONTRIBUTORS-BADGE:END -->
</p>

**Overseerr** is a free and open source software application for managing requests for your media library. It integrates with your existing services such as **Sonarr**, **Radarr** and **Plex**!

## Current Features

- Full Plex integration. Login and manage user access with Plex!
- Integrates easily with your existing services. Currently Overseerr supports Sonarr and Radarr. More to come!
- Syncs to your Plex library to know what titles you already have.
- Complex request system allowing users to request individual seasons or movies in a friendly, easy to use UI.
- Incredibly simple request management UI. Don't dig through the app to simply approve recent requests.
- Granular permission system
- Mobile friendly design, for when you need to approve requests on the go!

## In Development

- User profiles.
- User settings page (to give users the ability to modify their Overseerr experience to their liking).
- Version update notifications in-app.
- 4K requests (Includes multi-radarr/sonarr management for media)

## Planned Features

- More notification types (Slack/Telegram/etc.).
- Issues system. This will allow users to report issues with content on your media server.
- Local user system (for those who don't use Plex).
- Compatiblity APIs (to work with existing tools in your system).

## Running Overseerr

Currently, Overseerr is only distributed through Docker images. If you have Docker, you can run Overseerr as per:

```
docker run -d \
  -e LOG_LEVEL=info \
  -e TZ=Asia/Tokyo \
  -p 5055:3000 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  sctx/overseerr
```

After running Overseerr for the first time, configure it by visiting the web UI at http://[address]:5055 and completing the setup steps.

⚠️ Overseerr is currently under very heavy, rapid development and things are likely to break often. We need all the help we can get to find bugs and get them fixed to hit a more stable release. If you would like to help test the bleeding edge, please use the image **sctx/overseerr:develop** instead! ⚠️

## Preview

<img src="https://i.imgur.com/Mjbyruv.png">

## Support

- You can get support on [Discord](https://discord.gg/PkCWJSeCk7).
- You can ask questions in the Help category of our [GitHub Discussions](https://github.com/sct/overseerr/discussions).
- Bugs/Feature Requests can be opened via a [GitHub issue](https://github.com/sct/overseerr/issues).

## API Documentation

Full API documentation will soon be published automatically and available outside of running the app. Currently, you can access the API docs by running Overseerr locally and visiting http://localhost:3000/api-docs

## Community

You can ask questions, share ideas, and more in [GitHub Discussions](https://github.com/sct/overseerr/discussions).

If you would like to chat with community members you can join the [Overseerr Discord](https://discord.gg/PkCWJSeCk7).

Our [Code of Conduct](https://github.com/sct/overseerr/blob/develop/CODE_OF_CONDUCT.md) applies to all Overseerr community channels.

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://sct.dev"><img src="https://avatars1.githubusercontent.com/u/234213?v=4" width="100px;" alt=""/><br /><sub><b>sct</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=sct" title="Code">💻</a> <a href="#design-sct" title="Design">🎨</a> <a href="#ideas-sct" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/azoitos"><img src="https://avatars2.githubusercontent.com/u/26529049?v=4" width="100px;" alt=""/><br /><sub><b>Alex Zoitos</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=azoitos" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/OwsleyJr"><img src="https://avatars3.githubusercontent.com/u/8635678?v=4" width="100px;" alt=""/><br /><sub><b>Brandon Cohen</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=OwsleyJr" title="Code">💻</a> <a href="https://github.com/sct/overseerr/commits?author=OwsleyJr" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Ahreluth"><img src="https://avatars2.githubusercontent.com/u/75682440?v=4" width="100px;" alt=""/><br /><sub><b>Ahreluth</b></sub></a><br /><a href="#translation-Ahreluth" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/KovalevArtem"><img src="https://avatars0.githubusercontent.com/u/36500228?v=4" width="100px;" alt=""/><br /><sub><b>KovalevArtem</b></sub></a><br /><a href="#translation-KovalevArtem" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/GiyomuWeb"><img src="https://avatars0.githubusercontent.com/u/62489209?v=4" width="100px;" alt=""/><br /><sub><b>GiyomuWeb</b></sub></a><br /><a href="#translation-GiyomuWeb" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/angrycuban13"><img src="https://avatars3.githubusercontent.com/u/39564898?v=4" width="100px;" alt=""/><br /><sub><b>Angry Cuban</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=angrycuban13" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/jvennik"><img src="https://avatars3.githubusercontent.com/u/6672637?v=4" width="100px;" alt=""/><br /><sub><b>jvennik</b></sub></a><br /><a href="#translation-jvennik" title="Translation">🌍</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

## Contributing

You can help build Overseerr too! Check out our [Contribution Guide](https://github.com/sct/overseerr/blob/develop/CONTRIBUTING.md) to get started.
