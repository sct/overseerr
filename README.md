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
<a href="#contributors-"><img alt="All Contributors" src="https://img.shields.io/badge/all_contributors-26-orange.svg"/></a>
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
- 4K requests (Includes multi-radarr/sonarr management for media)

## Planned Features

- More notification types.
- Issues system. This will allow users to report issues with content on your media server.
- Local user system (for those who don't use Plex).
- Compatibility APIs (to work with existing tools in your system).

## Getting Started

Check out our documenation for steps on how to install and run Overseerr:

https://docs.overseerr.dev/getting-started/installation

## Running Overseerr

Currently, Overseerr is only distributed through Docker images. If you have Docker, you can run Overseerr as per:

```
docker run -d \
  -e LOG_LEVEL=info \
  -e TZ=Asia/Tokyo \
  -p 5055:5055 \
  -v /path/to/appdata/config:/app/config \
  --restart unless-stopped \
  sctx/overseerr
```

After running Overseerr for the first time, configure it by visiting the web UI at http://[address]:5055 and completing the setup steps.

⚠️ Overseerr is currently under very heavy, rapid development and things are likely to break often. We need all the help we can get to find bugs and get them fixed to hit a more stable release. If you would like to help test the bleeding edge, please use the image **sctx/overseerr:develop** instead! ⚠️

## Preview

<img src="https://i.imgur.com/Mjbyruv.png">

## Support

- Check out the [Overseerr Documentation](https://docs.overseerr.dev/) before asking for help. Your question might already be in the [FAQ](https://docs.overseerr.dev/support/faq).
- You can get support on [Discord](https://discord.gg/PkCWJSeCk7).
- You can ask questions in the Help category of our [GitHub Discussions](https://github.com/sct/overseerr/discussions).
- Bugs/Feature Requests can be opened via a [GitHub issue](https://github.com/sct/overseerr/issues).

## API Documentation

Full API documentation will soon be published automatically and available outside of running the app. Currently, you can access the API docs by running Overseerr locally and visiting http://localhost:5055/api-docs

## Community

You can ask questions, share ideas, and more in [GitHub Discussions](https://github.com/sct/overseerr/discussions).

If you would like to chat with community members you can join the [Overseerr Discord](https://discord.gg/PkCWJSeCk7).

Our [Code of Conduct](https://github.com/sct/overseerr/blob/develop/CODE_OF_CONDUCT.md) applies to all Overseerr community channels.

## Contributing

You can help build Overseerr too! Check out our [Contribution Guide](https://github.com/sct/overseerr/blob/develop/CONTRIBUTING.md) to get started.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

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
    <td align="center"><a href="https://github.com/darknessgp"><img src="https://avatars0.githubusercontent.com/u/1521243?v=4" width="100px;" alt=""/><br /><sub><b>darknessgp</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=darknessgp" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/saltydk"><img src="https://avatars1.githubusercontent.com/u/6587950?v=4" width="100px;" alt=""/><br /><sub><b>salty</b></sub></a><br /><a href="#infra-saltydk" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/Shutruk"><img src="https://avatars2.githubusercontent.com/u/9198633?v=4" width="100px;" alt=""/><br /><sub><b>Shutruk</b></sub></a><br /><a href="#translation-Shutruk" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/krystiancharubin"><img src="https://avatars2.githubusercontent.com/u/17775600?v=4" width="100px;" alt=""/><br /><sub><b>Krystian Charubin</b></sub></a><br /><a href="#design-krystiancharubin" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/kieron"><img src="https://avatars2.githubusercontent.com/u/8655212?v=4" width="100px;" alt=""/><br /><sub><b>Kieron Boswell</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=kieron" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/samwiseg0"><img src="https://avatars1.githubusercontent.com/u/2241731?v=4" width="100px;" alt=""/><br /><sub><b>samwiseg0</b></sub></a><br /><a href="#question-samwiseg0" title="Answering Questions">💬</a> <a href="#infra-samwiseg0" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ecelebi29"><img src="https://avatars2.githubusercontent.com/u/8337120?v=4" width="100px;" alt=""/><br /><sub><b>ecelebi29</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=ecelebi29" title="Code">💻</a> <a href="https://github.com/sct/overseerr/commits?author=ecelebi29" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/mmozeiko"><img src="https://avatars3.githubusercontent.com/u/1665010?v=4" width="100px;" alt=""/><br /><sub><b>Mārtiņš Možeiko</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=mmozeiko" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mazzetta86"><img src="https://avatars2.githubusercontent.com/u/45591560?v=4" width="100px;" alt=""/><br /><sub><b>mazzetta86</b></sub></a><br /><a href="#translation-mazzetta86" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/Panzer1119"><img src="https://avatars1.githubusercontent.com/u/23016343?v=4" width="100px;" alt=""/><br /><sub><b>Paul Hagedorn</b></sub></a><br /><a href="#translation-Panzer1119" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/Shagon94"><img src="https://avatars3.githubusercontent.com/u/9140783?v=4" width="100px;" alt=""/><br /><sub><b>Shagon94</b></sub></a><br /><a href="#translation-Shagon94" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/sebstrgg"><img src="https://avatars3.githubusercontent.com/u/27026694?v=4" width="100px;" alt=""/><br /><sub><b>sebstrgg</b></sub></a><br /><a href="#translation-sebstrgg" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/danshilm"><img src="https://avatars2.githubusercontent.com/u/20923978?v=4" width="100px;" alt=""/><br /><sub><b>Danshil Mungur</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=danshilm" title="Code">💻</a> <a href="https://github.com/sct/overseerr/commits?author=danshilm" title="Documentation">📖</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/doob187"><img src="https://avatars1.githubusercontent.com/u/60312740?v=4" width="100px;" alt=""/><br /><sub><b>doob187</b></sub></a><br /><a href="#infra-doob187" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/johnpyp"><img src="https://avatars2.githubusercontent.com/u/20625636?v=4" width="100px;" alt=""/><br /><sub><b>johnpyp</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=johnpyp" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ankarhem"><img src="https://avatars1.githubusercontent.com/u/14110063?v=4" width="100px;" alt=""/><br /><sub><b>Jakob Ankarhem</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=ankarhem" title="Documentation">📖</a> <a href="https://github.com/sct/overseerr/commits?author=ankarhem" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jayesh100"><img src="https://avatars1.githubusercontent.com/u/8022175?v=4" width="100px;" alt=""/><br /><sub><b>Jayesh</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=jayesh100" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/flying-sausages"><img src="https://avatars1.githubusercontent.com/u/23618693?v=4" width="100px;" alt=""/><br /><sub><b>flying-sausages</b></sub></a><br /><a href="https://github.com/sct/overseerr/commits?author=flying-sausages" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
