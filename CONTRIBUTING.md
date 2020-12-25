# Contributing to Overseerr

All help is welcome and greatly appreciated. If you would like to contribute to the project the steps below can get you started:

## Development

### Tools Required

- HTML/Typescript/Javascript editor of choice. ([VSCode](https://code.visualstudio.com/) is recommended. Upon opening the project, a few extensions will be automatically recommended for install.)
- [NodeJS](https://nodejs.org/en/download/) (Node 12.x.x or higher)
- [Yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/downloads)

### Getting Started

1. [Fork](https://help.github.com/articles/fork-a-repo/) the repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device.
   ```
   git clone https://github.com/YOUR_USERNAME/overseerr.git
   cd overseerr/
   ```
2. Add the remote upstream.

   ```
   git remote add upstream https://github.com/sct/overseerr.git
   ```

3. Create a new branch

   ```
   git checkout -b BRANCH_NAME develop
   ```

   - Its recommended to name the branch something relevant to the feature or fix you are working on.
   - An example of this would be `fix-title-cards` or `feature-new-system`.
   - Bad examples would be `patch` or `bug`.

4. Run development environment

   ```
   yarn
   yarn install
   ```

   - Alternatively you can run using [Docker](https://www.docker.com/) with `docker-compose up -d`. This method does not require installing NodeJS or Yarn on your machine directly.

5. Create your patch and run appropriate tests.

6. Follow the [guidelines](#contributing-code).

7. Should you need to update your fork you can do so by rebasing from upstream.

   ```
   git fetch upstream
   git rebase upstream/develop
   git push origin BRANCH_NAME -f
   ```

### Contributing Code

- If you are taking on an existing bug or feature ticket, please comment on the [GitHub Issue](https://github.com/sct/overseerr/issues) to avoid multiple people working on the same thing.
- All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  - It is okay if you squash your PR down to be a single commit that fits this standard.
  - PRs with commits not following this standard will not be merged.
- Please make meaningful commits, or squash them
- Always rebase your commit to the latest `develop` branch. Do not merge develop into your branch.
- It is your responsibility to keep your branch up to date. It will not be merged unless its rebased off the latest develop branch.
- You can create a Draft pull request early to get feedback on your work.
- Your code must be formatted correctly or the tests will fail.
  - We use Prettier to format our codebase. It should auto run with a git hook, but its recommended to have a Prettier extension installed in your editor and have it format on save.
- If you have questions or need help, you can reach out in [GitHub Discussions](https://github.com/sct/overseerr/discussions) or in our [Discord](https://discord.gg/PkCWJSeCk7).
- Only open pull requests to `develop`. Never `master`. Any PR's opened to master will be closed.

## Translation

We use [Weblate](https://hosted.weblate.org/engage/overseerr/) for our translations so please feel free to contribute to localizing Overseerr!

## Attribution

This contribution guide was inspired by the [Next.js](https://github.com/vercel/next.js) and [Radarr](https://github.com/Radarr/Radarr) contribution guides.
