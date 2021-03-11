# Contributing to Overseerr

All help is welcome and greatly appreciated! If you would like to contribute to the project, the following instructions should get you started...

## Development

### Tools Required

- HTML/Typescript/Javascript editor
  - [VSCode](https://code.visualstudio.com/) is recommended. Upon opening the project, a few extensions will be automatically recommended for install.
- [NodeJS](https://nodejs.org/en/download/) (Node 14.x or higher)
- [Yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/downloads)

### Getting Started

1. [Fork](https://help.github.com/articles/fork-a-repo/) the repository to your own GitHub account and [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device:

   ```bash
   git clone https://github.com/YOUR_USERNAME/overseerr.git
   cd overseerr/
   ```

2. Add the remote `upstream`:

   ```bash
   git remote add upstream https://github.com/sct/overseerr.git
   ```

3. Create a new branch:

   ```bash
   git checkout -b BRANCH_NAME develop
   ```

   - It is recommended to give your branch a meaningful name, relevant to the feature or fix you are working on.
     - Good examples:
       - `docs-docker`
       - `feature-new-system`
       - `fix-title-cards`
     - Bad examples:
       - `bug`
       - `docs`
       - `feature`
       - `fix`
       - `patch`

4. Run the development environment:

   ```bash
   yarn
   yarn dev
   ```

   - Alternatively, you can use [Docker](https://www.docker.com/) with `docker-compose up -d`. This method does not require installing NodeJS or Yarn on your machine directly.

5. Create your patch and test your changes.

   - Be sure to follow both the [code](#contributing-code) and [UI text](#ui-text-style) guidelines.
   - Should you need to update your fork, you can do so by rebasing from `upstream`:
     ```bash
     git fetch upstream
     git rebase upstream/develop
     git push origin BRANCH_NAME -f
     ```

### Contributing Code

- If you are taking on an existing bug or feature ticket, please comment on the [issue](https://github.com/sct/overseerr/issues) to avoid multiple people working on the same thing.
- All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  - It is okay to squash your pull request down into a single commit that fits this standard.
  - Pull requests with commits not following this standard will **not** be merged.
- Please make meaningful commits, or squash them.
- Always rebase your commit to the latest `develop` branch. Do **not** merge `develop` into your branch.
- It is your responsibility to keep your branch up-to-date. Your work will **not** be merged unless it is rebased off the latest `develop` branch.
- You can create a "draft" pull request early to get feedback on your work.
- Your code **must** be formatted correctly, or the tests will fail.
  - We use Prettier to format our code base. It should automatically run with a Git hook, but it is recommended to have the Prettier extension installed in your editor and format on save.
- If you have questions or need help, you can reach out via [Discussions](https://github.com/sct/overseerr/discussions) or our [Discord server](https://discord.gg/PkCWJSeCk7).
- Only open pull requests to `develop`, never `master`! Any pull requests opened to `master` will be closed.

### UI Text Style

When adding new UI text, please try to adhere to the following guidelines:

1. Be concise and clear, and use as few words as possible to make your point.
2. Use the Oxford comma where appropriate.
3. Use the appropriate Unicode characters for ellipses, arrows, and other special characters/symbols.
4. Capitalize proper nouns, such as Plex, Radarr, Sonarr, Telegram, Slack, Pushover, etc. Be sure to also use the official capitalization for any abbreviations; e.g., TMDb and IMDb have a lowercase 'b', whereas TheTVDB has a capital 'B'.
5. Title case headings, button text, and form labels. Note that verbs such as "is" should be capitalized, whereas prepositions like "from" should be lowercase (unless as the first or last word of the string, in which case they are also capitalized).
6. Capitalize the first word in validation error messages, dropdowns, and form "tips." These strings should not end in punctuation.
7. Ensure that toast notification strings are complete sentences ending in punctuation.
8. If an additional description or "tip" is required for a form field, it should be styled using the global CSS class `label-tip`.
9. In full sentences, abbreviations like "info" or "auto" should not be used in place of full words, unless referencing the name/label of a specific setting or option which has an abbreviation in its name.
10. Do your best to check for spelling errors and grammatical mistakes.
11. Do not misspell "Overseerr."

## Translation

We use [Weblate](https://hosted.weblate.org/engage/overseerr/) for our translations, and your help with localizing Overseerr would be greatly appreciated! If your language is not listed below, please [open a feature request](https://github.com/sct/overseerr/issues/new/choose).

<a href="https://hosted.weblate.org/engage/overseerr/"><img src="https://hosted.weblate.org/widgets/overseerr/-/overseerr-frontend/multi-auto.svg" alt="Translation status" /></a>

## Attribution

This contribution guide was inspired by the [Next.js](https://github.com/vercel/next.js) and [Radarr](https://github.com/Radarr/Radarr) contribution guides.
