## [1.19.1](https://github.com/sct/overseerr/compare/v1.19.0...v1.19.1) (2021-02-06)


### Bug Fixes

* **ui:** Fix webhook URL validation regex ([#864](https://github.com/sct/overseerr/issues/864)) ([726f62b](https://github.com/sct/overseerr/commit/726f62b9b69b5078e718f129e26abdf358f5cb06))

# [1.19.0](https://github.com/sct/overseerr/compare/v1.18.0...v1.19.0) (2021-02-05)


### Bug Fixes

* **api:** filter out adult content from combined credits ([3052f12](https://github.com/sct/overseerr/commit/3052f12c91b3ce86128324e3698fff61bbce3f2a))
* **cache:** use formatted numbers for displaying cache counts ([6c437c5](https://github.com/sct/overseerr/commit/6c437c515fc01b9fe4461968875e23542bae7542))
* **email:** make image a link to the action url in request template ([ee0a7bd](https://github.com/sct/overseerr/commit/ee0a7bd8c0b3a79c292b0abceb2f780f3889e49f)), closes [#834](https://github.com/sct/overseerr/issues/834)
* **frontend:** add github sponsor link to about page ([7c192d5](https://github.com/sct/overseerr/commit/7c192d54f422a5f2b55750535d2382e313f1d011))
* **frontend:** correctly show 4k download tracker activity ([a7314f8](https://github.com/sct/overseerr/commit/a7314f876ea528fdec0fb0a2adaa36a01afcdf38))
* **frontend:** fix possible division by zero in download status ([#839](https://github.com/sct/overseerr/issues/839)) ([c97c96a](https://github.com/sct/overseerr/commit/c97c96a30c50db7735f06c6d2d2f6193fb7da55e))
* **frontend:** match request button color on titlecards to other request buttons ([5b39911](https://github.com/sct/overseerr/commit/5b39911e024513fab7a62948e653cee08fd166c7))
* **frontend:** set 4k status on RequestItem when request is for 4k ([a3b00c3](https://github.com/sct/overseerr/commit/a3b00c3458b868506d4158fb24f0369fa5daefc5))
* **frontend:** use consistent spinner style on TitleCard/Plex Presets ([cf7ebc4](https://github.com/sct/overseerr/commit/cf7ebc488db33725444c428b4244d780ab9d123b))
* **html:** th elements should be nested under tr, not directly under thead ([#801](https://github.com/sct/overseerr/issues/801)) ([6e9ac27](https://github.com/sct/overseerr/commit/6e9ac275e19d56de8c7a366db970c7321f26fc8a))
* **lang:** Add missing source strings & remove local user sign-in setting tip ([#828](https://github.com/sct/overseerr/issues/828)) ([c0769d4](https://github.com/sct/overseerr/commit/c0769d4f8f2bad88e4638d8c3cbcc0414b3ef6fb))
* **lang:** Edit English language strings ([#820](https://github.com/sct/overseerr/issues/820)) ([f54df21](https://github.com/sct/overseerr/commit/f54df214af86d90ea8d7cfcd4e39022215c3568c))
* **lang:** translate language names & change zh-Hant language code to zh-TW ([#793](https://github.com/sct/overseerr/issues/793)) ([3c5ae36](https://github.com/sct/overseerr/commit/3c5ae360fd179d794a78cc918fe97a09216ca6b2))
* **notif/ui:** Use custom application title in notifications & sign-in page ([#849](https://github.com/sct/overseerr/issues/849)) ([38c76b5](https://github.com/sct/overseerr/commit/38c76b55e0039c489cb6a4a0a298aa6385406db4))
* **radarr:** correctly set requested status after sending to radarr (with auto approve) ([ec44841](https://github.com/sct/overseerr/commit/ec448413569ddc2f24bb856d29084169979f9f05))
* **sonarr-sync:** sonarr sync will no longer set shows with no episodes to partially available ([d20bd53](https://github.com/sct/overseerr/commit/d20bd530edaadc5887b0361358da80153e36505c)), closes [#796](https://github.com/sct/overseerr/issues/796)
* **ui:** Add additional URL & email input validation ([#843](https://github.com/sct/overseerr/issues/843)) ([3f9bfeb](https://github.com/sct/overseerr/commit/3f9bfeb01a67b2b587c7548b02ee826722e65c0f))
* **ui:** Don't display empty dropdown when no trailer available ([#804](https://github.com/sct/overseerr/issues/804)) ([95c2a21](https://github.com/sct/overseerr/commit/95c2a2169799d96413b47ab24506b330435643eb))
* **ui:** dont show bulk edit options on user list if there is only one user ([b658ddf](https://github.com/sct/overseerr/commit/b658ddf5cf61b2bb9b93cb1a4ca716cd75e18bb4))
* **ui:** Dynamically generate path to config in warning message ([#851](https://github.com/sct/overseerr/issues/851)) ([b531a64](https://github.com/sct/overseerr/commit/b531a642f601f4ef9bf39c2f5915402157e55372))
* **ui:** fix tables extending outside viewport in mobile formats ([e270999](https://github.com/sct/overseerr/commit/e270999745f97c2860f6a5b84e897dc6da8d6001))
* **ui:** Hide 'Mark 4k as Available' button if 4k not enabled ([#833](https://github.com/sct/overseerr/issues/833)) ([e4a50c3](https://github.com/sct/overseerr/commit/e4a50c33f105b440243885d72a9e96595a525447))
* **ui:** Limit max width of forms & lists ([#845](https://github.com/sct/overseerr/issues/845)) ([b9d14a9](https://github.com/sct/overseerr/commit/b9d14a9fd0f3c94d8267755147a87fe3b77fa2c3))
* **ui:** prevent names from getting squished in AdvancedRequester user selector ([06e9411](https://github.com/sct/overseerr/commit/06e941171a1d019fbb178624167c026f6df5271c))
* **ui:** remove yup validation from display name on user edit page ([63d7e2b](https://github.com/sct/overseerr/commit/63d7e2b39858fcb1cc0819a680eebccded7f4451))
* **ui:** Restore original port input size ([#814](https://github.com/sct/overseerr/issues/814)) ([1ccafc0](https://github.com/sct/overseerr/commit/1ccafc0ebd368d798f9571b83910336efa317e37))
* **ui:** show request as option even if there are no radarr/sonarr servers ([b116281](https://github.com/sct/overseerr/commit/b116281196c264b4ec35b07f1b4ffa717e50ade5))
* **ui:** uniform-size checkboxes, vertically-aligned form labels, and fixes for other UI imperfections/inconsistencies ([#737](https://github.com/sct/overseerr/issues/737)) ([e34fbf7](https://github.com/sct/overseerr/commit/e34fbf72fda34d69b9f25563fa81f88b3c20912a))
* **ui:** Use minimum char validation message ([#850](https://github.com/sct/overseerr/issues/850)) ([7456bea](https://github.com/sct/overseerr/commit/7456bea2ae600a28cb933278ffb310b63a474d6a))
* **ui:** validate application url and service external urls ([026795d](https://github.com/sct/overseerr/commit/026795d4c940cb4797d3e68089456a4c3defbb21))
* **ui:** when PersonCard has no profilePath, correctly position name/role content ([3ffd5ab](https://github.com/sct/overseerr/commit/3ffd5ab0ee8ffa63199d1428e37206f9b59fb7a5))


### Features

* **cache:** add cache table and flush cache option to settings ([996bd9f](https://github.com/sct/overseerr/commit/996bd9f14ed0f56767892c169b071be4f0f628d0))
* **cache:** external API cache ([#786](https://github.com/sct/overseerr/issues/786)) ([20289b5](https://github.com/sct/overseerr/commit/20289b5960a93545cdff9331a1a7b613f382e702))
* **docker:** Check for /app/config volume mount during setup ([#826](https://github.com/sct/overseerr/issues/826)) ([1e5f88f](https://github.com/sct/overseerr/commit/1e5f88f462b0c69db5f6ab8e0249a5905bc6952a))
* **frontend:** add TheTVDB external link ([#800](https://github.com/sct/overseerr/issues/800)) ([72cffd7](https://github.com/sct/overseerr/commit/72cffd74a75984ba98c456c0ec006ec378a8dcec))
* **lang:** add support for Hungarian language ([cfacb15](https://github.com/sct/overseerr/commit/cfacb151b52d08e19d2fcd603fb4bbcd78707cdf))
* **lang:** translations update from Weblate ([#791](https://github.com/sct/overseerr/issues/791)) ([42295e0](https://github.com/sct/overseerr/commit/42295e076a7579b226d57407a20cb0ba044e9ec1))
* **lang:** translations update from Weblate ([#819](https://github.com/sct/overseerr/issues/819)) ([9e5e4c2](https://github.com/sct/overseerr/commit/9e5e4c22f5b25df96f47875d599ed8685791382a))
* **lang:** translations update from Weblate ([#841](https://github.com/sct/overseerr/issues/841)) ([e4f9b8a](https://github.com/sct/overseerr/commit/e4f9b8a9848f3af00e86fc7108c823ed0584609f))
* **lang:** translations update from Weblate ([#852](https://github.com/sct/overseerr/issues/852)) ([c5be00e](https://github.com/sct/overseerr/commit/c5be00eebfd2b0e65295edbe282cbba22fffa660))
* **ui:** Add local login setting ([#817](https://github.com/sct/overseerr/issues/817)) ([9d0d5b8](https://github.com/sct/overseerr/commit/9d0d5b86aae025e4647bb664c6412d42192e2fe7))
* **ui:** added next airing date to TV Shows ([#842](https://github.com/sct/overseerr/issues/842)) ([4eae02a](https://github.com/sct/overseerr/commit/4eae02a7e14e377fd69ddd4a43774cb7e3d1855b))
* new permission to allow users to see other users requests ([033ba9d](https://github.com/sct/overseerr/commit/033ba9d41bddf6dc1c4512d8404f747e57923bca)), closes [#840](https://github.com/sct/overseerr/issues/840)
* request as another user ([59150f9](https://github.com/sct/overseerr/commit/59150f955f7003672ef19eb9d37156e93b79c97d))
* **tv:** show cast for the entire show instead of only the last season ([#778](https://github.com/sct/overseerr/issues/778)) ([b239598](https://github.com/sct/overseerr/commit/b239598e64d33b78dc5d7972878840149aff360a)), closes [#775](https://github.com/sct/overseerr/issues/775)
* **ui:** Add custom title functionality ([#825](https://github.com/sct/overseerr/issues/825)) ([35c6bfc](https://github.com/sct/overseerr/commit/35c6bfc0216bf879353b3ee546b439a06c8e6121))

# [1.18.0](https://github.com/sct/overseerr/compare/v1.17.2...v1.18.0) (2021-01-30)


### Bug Fixes

* **api:** prevent duplicate movie requests ([421f4c1](https://github.com/sct/overseerr/commit/421f4c17f0f206bbe7bfcbf2819014b8c7f55b6a)), closes [#705](https://github.com/sct/overseerr/issues/705)
* **build:** fix sqlite3 build error ([#691](https://github.com/sct/overseerr/issues/691)) ([3a1f6d5](https://github.com/sct/overseerr/commit/3a1f6d5706c8fc100e88425f3d89a26a0325af79))
* **frontend:** add poster not found image to request card and request list item ([ae9a1b3](https://github.com/sct/overseerr/commit/ae9a1b3e940ac2abf6e842d91f458daab3dd0f0d))
* **frontend:** add poster not found image to tv details page ([0b05545](https://github.com/sct/overseerr/commit/0b055458d0ddbfd4c87ebf9b0562f161fa3445a3))
* **frontend:** dont show external links unless slug is set ([946bd2d](https://github.com/sct/overseerr/commit/946bd2db5ecde0748b2e9bc5edfe7ca6000ec3d5))
* **frontend:** fix server name position on plex settings page ([86efcd8](https://github.com/sct/overseerr/commit/86efcd82c34ad6490f2899ebf6f84cdd1bffc498))
* **frontend:** fixed mismatched rounded sizing on new login ([5e352c2](https://github.com/sct/overseerr/commit/5e352c201fc2f731ca5f713ecb6901527ef354da)), closes [#721](https://github.com/sct/overseerr/issues/721)
* **ip logging:** add env var for proxy to fix ip logging on failed logins ([#756](https://github.com/sct/overseerr/issues/756)) ([9342a40](https://github.com/sct/overseerr/commit/9342a40bbc03f7fdda23e3876b3a4a81ea8532c0))
* **lang:** add missing i18n strings for notification settings ([2f75c4c](https://github.com/sct/overseerr/commit/2f75c4c6aed42a15bb47d3652272de8f852ec79f))
* **notifications:** only send a single notification when standard media becomes available ([b5fd1d5](https://github.com/sct/overseerr/commit/b5fd1d520cd2a7be6e6356a25129e93af1caf542)), closes [#770](https://github.com/sct/overseerr/issues/770)
* **permissions:** use default user permissions when creating a local user ([#713](https://github.com/sct/overseerr/issues/713)) ([660ada0](https://github.com/sct/overseerr/commit/660ada0b2025eb2c06d9054fd0a7b5a632af6af2))
* **radarr:** fix request bug which made it unable to be added to radarr ([#760](https://github.com/sct/overseerr/issues/760)) ([45a2779](https://github.com/sct/overseerr/commit/45a277964b0c39346d7216873812e0ebe505cb79))
* **radarr:** return the updated data when updating radarr request ([#765](https://github.com/sct/overseerr/issues/765)) ([0c6d478](https://github.com/sct/overseerr/commit/0c6d4780c355ffe1a951268fb6949491d435bbf1))
* **requests:** handle when tvdbid is null ([#657](https://github.com/sct/overseerr/issues/657)) ([2da0da8](https://github.com/sct/overseerr/commit/2da0da826ae1d73467bc8a671fda7cc5ca1f14c9))
* **sonarr-sync:** correctly set series with no seasons to requested status ([3812989](https://github.com/sct/overseerr/commit/3812989a1ce1e07d4af09149008043a6e2e94060)), closes [#762](https://github.com/sct/overseerr/issues/762)
* **sync:** do not update series status if already available and no new seasons ([136d874](https://github.com/sct/overseerr/commit/136d874cba37babf9c0670844b002871710e6d99)), closes [#777](https://github.com/sct/overseerr/issues/777)
* **ui:** Capitalization, punctuation, and grammar inconsistences & errors ([#731](https://github.com/sct/overseerr/issues/731)) ([f05d4a0](https://github.com/sct/overseerr/commit/f05d4a0d0b42905fcaee49b2471bb1f4ee77fffe))
* lookup movie by imdbid if tmdbid does not exits for plex movie agent ([#711](https://github.com/sct/overseerr/issues/711)) ([e972288](https://github.com/sct/overseerr/commit/e97228899a5936b2525c8060abfa14b5ce31658d))
* show recently added series even if they are not complete ([d0c830e](https://github.com/sct/overseerr/commit/d0c830e80d389f9e0f48a9b83659331f54630d03))


### Features

* **lang:** translated using Weblate (Dutch) ([059995e](https://github.com/sct/overseerr/commit/059995e0ef3370a3192bd386fa6875ca0f58690a))
* **lang:** translated using Weblate (French) ([4789583](https://github.com/sct/overseerr/commit/4789583d66305ac7b3d393659b2f3604c0acc576))
* **lang:** translations update from Weblate ([#727](https://github.com/sct/overseerr/issues/727)) ([71875ef](https://github.com/sct/overseerr/commit/71875efb48246dbb0139ad15a4261a5661fcfe17))
* **lang:** update languages and fix merge conflict ([083a74a](https://github.com/sct/overseerr/commit/083a74a686d202cce5775bf9752caaa9a626cf45))
* **ui:** Move PROXY setting to UI ([#782](https://github.com/sct/overseerr/issues/782)) ([f1dd5e7](https://github.com/sct/overseerr/commit/f1dd5e7e12c1f602449c4769173dbce71e3569d0))
* add manual availability buttons to manage slideover ([67f8aef](https://github.com/sct/overseerr/commit/67f8aef00d98c834b60cb6152ccd5cb7b5709d12)), closes [#672](https://github.com/sct/overseerr/issues/672)
* **media:** add link to the item on plex ([#735](https://github.com/sct/overseerr/issues/735)) ([1d7150c](https://github.com/sct/overseerr/commit/1d7150c24ec5ad347093889bfceab61b664900d5))
* Radarr & Sonarr Sync ([#734](https://github.com/sct/overseerr/issues/734)) ([ec5fb83](https://github.com/sct/overseerr/commit/ec5fb836785855eb4846fd33b49faeb94c40506a))
* **frontend:** add option to hide all available items from discovery ([#699](https://github.com/sct/overseerr/issues/699)) ([6c1742e](https://github.com/sct/overseerr/commit/6c1742e94ccfc6c13cf1d25fd9e893ee1f431aae))
* **lang:** add support for Portuguese (Portugal) language ([e044146](https://github.com/sct/overseerr/commit/e044146aa55109a1eccfde9650b26beb0d5ec9a6))
* **lang:** translated using Weblate (Dutch) ([6d0f7d4](https://github.com/sct/overseerr/commit/6d0f7d4b50370c420c1017f32d48313074543743))
* **lang:** translated using Weblate (Italian) ([9aa5c12](https://github.com/sct/overseerr/commit/9aa5c121644518c1fbb308a487c26d8998bb5a36))
* **lang:** translated using Weblate (Portuguese (Portugal)) ([f001fb3](https://github.com/sct/overseerr/commit/f001fb3b33d4fb749acb70c45b8a55a5bbef570c))
* **lang:** translated using Weblate (Spanish) ([4f94d22](https://github.com/sct/overseerr/commit/4f94d227fc3096bcb8a1e5cf12fe9222d6c6b711))
* **login:** add request ip to the failed request log ([#714](https://github.com/sct/overseerr/issues/714)) ([2d31ea9](https://github.com/sct/overseerr/commit/2d31ea940ac0a1a84d2150743798b41ff6490317))
* **users:** add editable usernames ([#715](https://github.com/sct/overseerr/issues/715)) ([20ca3f2](https://github.com/sct/overseerr/commit/20ca3f2f5fcf4a9eb0d6a8be671bb4fb1f5e6178))
* pre-populate server info from plex.tv API ([#563](https://github.com/sct/overseerr/issues/563)) ([82ac76b](https://github.com/sct/overseerr/commit/82ac76b0540ba1133cb5384744d2499c2488a4e8))
* **auth:** Add optional CSRF protection ([#697](https://github.com/sct/overseerr/issues/697)) ([6e25891](https://github.com/sct/overseerr/commit/6e2589178b99f8f32f0ded9a7cfd9921c33e9b60))
* ability to edit user settings in bulk ([#597](https://github.com/sct/overseerr/issues/597)) ([4b0241c](https://github.com/sct/overseerr/commit/4b0241c3b34d4229f928c21defb10a1c051264d1))
* **lang:** translated using Weblate (English) ([9bb11af](https://github.com/sct/overseerr/commit/9bb11afc6b4a109ae1e14d41c9fe2b71f19c470a))
* **lang:** translated using Weblate (German) ([c2a3e8e](https://github.com/sct/overseerr/commit/c2a3e8ed5243925dce991ec7995ae831702dbc7b))
* **lang:** translated using Weblate (Portuguese (Brazil)) ([32f4916](https://github.com/sct/overseerr/commit/32f4916c4a926097f31ed472aee031536b847bb7))
* **lang:** translated using Weblate (Portuguese (Brazil)) ([98570c9](https://github.com/sct/overseerr/commit/98570c920e4904a594bb7464161b985094958f84))
* **notifications:** add option to send notifications for auto-approved requests ([21db367](https://github.com/sct/overseerr/commit/21db3676d1464b63384b04c0c2926cb2a6252e9b)), closes [#267](https://github.com/sct/overseerr/issues/267)

## [1.17.2](https://github.com/sct/overseerr/compare/v1.17.1...v1.17.2) (2021-01-20)


### Bug Fixes

* **requests:** allow declined season requests to be re-requested ([e1032ff](https://github.com/sct/overseerr/commit/e1032ff5dfac4a8c9d4da9cf2788c19822343ad9)), closes [#690](https://github.com/sct/overseerr/issues/690)
* **requests:** update requests to approved when parent media is set as available ([78444a9](https://github.com/sct/overseerr/commit/78444a9e643829823162389dee60cca70da56bff)), closes [#688](https://github.com/sct/overseerr/issues/688)

## [1.17.1](https://github.com/sct/overseerr/compare/v1.17.0...v1.17.1) (2021-01-19)


### Bug Fixes

* **frontend:** show auto approval on series request modal only with correct permissions ([8927c6d](https://github.com/sct/overseerr/commit/8927c6d2e39dbda2b1121095a7273f5cab1c9b74)), closes [#687](https://github.com/sct/overseerr/issues/687)

# [1.17.0](https://github.com/sct/overseerr/compare/v1.16.0...v1.17.0) (2021-01-19)


### Bug Fixes

* **api:** improve rottentomatoes rating matching for movies ([7db62ab](https://github.com/sct/overseerr/commit/7db62ab824eefc42e6db16e42d52f4266b136f82)), closes [#494](https://github.com/sct/overseerr/issues/494)
* **build:** remove cross import from client to server for UserType ([23624bd](https://github.com/sct/overseerr/commit/23624bd144af5df4c31995b68ce48105b95b20f6))
* **frontend:** clarify which fields are required in radarr/sonarr modals ([860d71e](https://github.com/sct/overseerr/commit/860d71ed69a69a1a3f74b79290ef471e04f57a6b)), closes [#575](https://github.com/sct/overseerr/issues/575)
* **frontend:** do not show failed media status on request list for declined requests ([00944b1](https://github.com/sct/overseerr/commit/00944b1ec2db8ddc5742448f6448f7364c473a98)), closes [#664](https://github.com/sct/overseerr/issues/664)
* **frontend:** fix button styling on details page on small screen sizes ([d9e0c90](https://github.com/sct/overseerr/commit/d9e0c90e76d80aef0c67318e00e997804805f46e))
* **frontend:** fix request button height ([a262727](https://github.com/sct/overseerr/commit/a2627270784bdef8644875fa5c5a7349a0b7fd81))
* **frontend:** request dropdown menu now properly shows up over collection button ([b491be1](https://github.com/sct/overseerr/commit/b491be1b1e7f6aa588274230e695e4c5302b961e))
* **frontend:** show correct request status on request cards for 4k requests ([1aa0005](https://github.com/sct/overseerr/commit/1aa0005b4298fc1af9c1d0bf1f357738c0fa2673))
* **lang:** add missing see more i18n string for SeeMoreCard ([d9919ab](https://github.com/sct/overseerr/commit/d9919abb8998d28558ddec35b8e60ab2af75d5b7))
* **lang:** change email auth user/pass strings to SMTP Username/Password ([a77a2aa](https://github.com/sct/overseerr/commit/a77a2aa3ebb1be353d534db5b07647ac26c60e15))
* **notifications:** correctly compare seasons before sending series notifications ([f17fa2a](https://github.com/sct/overseerr/commit/f17fa2a2db8144bac89936f588627e8dd37bf54a))
* **notifications:** only send one available notification for standard media ([fc6f7cc](https://github.com/sct/overseerr/commit/fc6f7ccea586165a30022b6d5554911c66ece6df))
* **notifications:** send media declined email ([eb6fc8a](https://github.com/sct/overseerr/commit/eb6fc8a19099469794d471db0b48a258c2866633)), closes [#679](https://github.com/sct/overseerr/issues/679)
* **plex-sync:** improve plex sync error handling. add session id to fix stuck runs ([a740b07](https://github.com/sct/overseerr/commit/a740b07f06f892b72a651b928af28ce71cb495ee))
* **plex-sync:** store plex added date and sort recently added by it ([d688a96](https://github.com/sct/overseerr/commit/d688a967596afcba9799b8133089bebb5add27cf))
* **requests:** select the correct radarr/sonarr server when sending request to service ([e0d9f89](https://github.com/sct/overseerr/commit/e0d9f891e797c3839f976b75a871903b6f2e55f1))
* **server:** support absolute paths for CONFIG_DIRECTORY ([51d8fba](https://github.com/sct/overseerr/commit/51d8fba9162b9e148a35ced69e7e035438c8b0f1))
* **user edit:** fix user edit not being able to be saved ([#651](https://github.com/sct/overseerr/issues/651)) ([b04d00e](https://github.com/sct/overseerr/commit/b04d00ef509d6f13c1f9677b3f318331782c0086))


### Features

* **api:** /request/count endpoint ([#682](https://github.com/sct/overseerr/issues/682)) ([192cfd8](https://github.com/sct/overseerr/commit/192cfd8a8ea9ab942d5bb265d42050917a2f5a04))
* **frontend:** add see more card to media sliders ([587e8db](https://github.com/sct/overseerr/commit/587e8db15e9c19b4c58406e3e4215d8bf87d8762))
* **frontend:** add template variable help button to custom webhook settings page ([29c5bc4](https://github.com/sct/overseerr/commit/29c5bc40975e7ab0a2e08bb77294f164f0c60769))
* **lang:** add support for Chinese (Traditional) language ([686c4f7](https://github.com/sct/overseerr/commit/686c4f71bf930625af082ac5e14dc5f79f5c42eb))
* **lang:** Translations update from Weblate ([#604](https://github.com/sct/overseerr/issues/604)) ([801e765](https://github.com/sct/overseerr/commit/801e76524d6ea0887249f1630402e9c3a3430b44))
* **login:** add local users functionality ([#591](https://github.com/sct/overseerr/issues/591)) ([492e19d](https://github.com/sct/overseerr/commit/492e19df4014e67dc6a2de5903a33c25e13fcf45))
* **notifications:** add notification for declined requests ([2f97f61](https://github.com/sct/overseerr/commit/2f97f61a6e8846975774aa16950a39ada2b1a016)), closes [#663](https://github.com/sct/overseerr/issues/663)
* **notifications:** Webhook Notifications ([#632](https://github.com/sct/overseerr/issues/632)) ([a7cc7c5](https://github.com/sct/overseerr/commit/a7cc7c59753dd9649b2ec37eb9d46fe4fa8e1e1c))
* **requests:** Request Overrides & Request Editing ([#653](https://github.com/sct/overseerr/issues/653)) ([bdb3372](https://github.com/sct/overseerr/commit/bdb33722e6df09dd6d8caa36b104b61c6b8dc00d))
* **server:** add CONFIG_DIRECTORY env var to control config directory location ([fa8f112](https://github.com/sct/overseerr/commit/fa8f112c31ccb5ee6244f776bc97e76d81958539))
* 4K Requests ([#559](https://github.com/sct/overseerr/issues/559)) ([6b2df24](https://github.com/sct/overseerr/commit/6b2df24a2e8f96dd2277a814d7e02015d1f80cdc))
* map AniDB IDs from Hama agent to tvdb/tmdb/imdb IDs ([#538](https://github.com/sct/overseerr/issues/538)) ([0600ac7](https://github.com/sct/overseerr/commit/0600ac7c3a1bc0cdd906634d5f77ea3e99b10e94)), closes [#453](https://github.com/sct/overseerr/issues/453)


### Reverts

* **deps:** revert back to next@10.0.3 until sharp optional dependency bug is fixed ([7962964](https://github.com/sct/overseerr/commit/79629645aacc1a042919834da79bff0c1f69c9d6))

# [1.16.0](https://github.com/sct/overseerr/compare/v1.15.0...v1.16.0) (2021-01-07)


### Bug Fixes

* **frontend:** adjust titlecard badge styling ([effc809](https://github.com/sct/overseerr/commit/effc80977a4ed732092254248f82363e52233171))
* **frontend:** apply same titlecard hover effect to personcard ([67f2b57](https://github.com/sct/overseerr/commit/67f2b57f00216ded3b34965629d6fdd2f16bc25f))
* **frontend:** only animate titlecard when showDetail is true ([0ab4c3c](https://github.com/sct/overseerr/commit/0ab4c3c36fe2c1ded142b6931111516f7f990a41))
* **frontend:** use hardware acceleration for titlecard scale ([88810bf](https://github.com/sct/overseerr/commit/88810bf0a4ef74299f6541b60fa91cea3610f99c))
* **plex-sync:** do not run plex sync if no admin exists ([493d82b](https://github.com/sct/overseerr/commit/493d82b6b066d77609cf66e005fd1f1472b8e011))


### Features

* **lang:** translations update from Weblate ([#495](https://github.com/sct/overseerr/issues/495)) ([b04eda6](https://github.com/sct/overseerr/commit/b04eda6c8a3bfcaa2a14b8a29612fdf690c9fba0))
* **lang:** Translations update from Weblate ([#580](https://github.com/sct/overseerr/issues/580)) ([2bfe0f2](https://github.com/sct/overseerr/commit/2bfe0f2bf66956763ab26d5c54f26e6c456f59f7))
* **notifications:** add pushover integration ([#574](https://github.com/sct/overseerr/issues/574)) ([ee5d018](https://github.com/sct/overseerr/commit/ee5d0181fc9a673b27aefd1d09b0a78c3d2e4f55))

# [1.15.0](https://github.com/sct/overseerr/compare/v1.14.1...v1.15.0) (2021-01-04)


### Bug Fixes

* **api:** return 202 when same seasons are requested again ([5c84702](https://github.com/sct/overseerr/commit/5c847026aad79fcac4d020786ded9f867696c226))
* **build:** fixes build to include commit tag for app build step ([289864a](https://github.com/sct/overseerr/commit/289864af1a995ce04834bf8a220cc238e1954d19))
* **docs:** fix typo in build instructions ([#503](https://github.com/sct/overseerr/issues/503)) ([2b27a71](https://github.com/sct/overseerr/commit/2b27a715b07c27200ba1e5e9623629a34389276d))
* **frontend:** add i18n for request text on titlecard ([a524b9c](https://github.com/sct/overseerr/commit/a524b9c4c8968f6823d33eb270dc26069fe4a725))
* **frontend:** add localized strings for status checker ([2dcda39](https://github.com/sct/overseerr/commit/2dcda39d40d820419e098bd6f1101eb820e5b42d))
* **frontend:** center text in movie auto-approve modal on small screens ([#510](https://github.com/sct/overseerr/issues/510)) ([1438b08](https://github.com/sct/overseerr/commit/1438b08cf0b358d79c6688c64be99f1718ec2d23)), closes [#507](https://github.com/sct/overseerr/issues/507)
* **frontend:** change titlecard to only have a request button ([b5a3a7a](https://github.com/sct/overseerr/commit/b5a3a7a89fcaf86dd794dc419711677b53646577))
* **frontend:** combine duplicate credits on a persons detail page ([d188f6f](https://github.com/sct/overseerr/commit/d188f6ffadff1564c47d5f33138e35498bed29fd)), closes [#504](https://github.com/sct/overseerr/issues/504)
* **frontend:** disable pointer-events on titlecard badges ([ce06879](https://github.com/sct/overseerr/commit/ce0687922a94588b3492e8ddf2e84f54dd1a0d4e))
* **frontend:** fix count of requests in request list ([f124d73](https://github.com/sct/overseerr/commit/f124d732a2911abdccb5abc11471efe61cc20f7a))
* **frontend:** fix sliders overflowing on firefox ([67ac9e0](https://github.com/sct/overseerr/commit/67ac9e075f0ca1cfe7e4766d9168815d7ab600fa)), closes [#566](https://github.com/sct/overseerr/issues/566)
* **frontend:** full season request modal fits on a smaller mobile UI ([#535](https://github.com/sct/overseerr/issues/535)) ([12db7a0](https://github.com/sct/overseerr/commit/12db7a065ad566b47d46de4b949343290894f153))
* **frontend:** handle currentLibrary possibly being null on first manual sync ([93b57a7](https://github.com/sct/overseerr/commit/93b57a76f10a823615ca11ff59f523b67aa30fad))
* **frontend:** increase titlecard status badge size on larger screens ([ba106c4](https://github.com/sct/overseerr/commit/ba106c447d76db2f9ac70a60c5b38cc60ab554fe))
* **frontend:** search clear button now correctly triggers routing ([343f466](https://github.com/sct/overseerr/commit/343f466788abc308b91a414ef61bba816ac8875c))
* **frontend:** set locale cookie expiration to be much longer ([fae4818](https://github.com/sct/overseerr/commit/fae481895736eab81d52eb93788beb00669fb355))
* **frontend:** show movie/series badges always ([8cbf39a](https://github.com/sct/overseerr/commit/8cbf39a9d12eaee7720fa4721c350c1ef9dee856))
* **frontend:** update login/setup images ([058fb65](https://github.com/sct/overseerr/commit/058fb65495baa08a0bd4c9e0aef320c6fc7d017b))
* **holiday:** remove special holiday slider ([8c09033](https://github.com/sct/overseerr/commit/8c0903393cf2cb2a929ba70a8ab6ddcc4cba0574))
* correctly deal with tmdb id duplicates between movies/series ([721ed9a](https://github.com/sct/overseerr/commit/721ed9a93087a57ae749388bddcacf26022e3df6)), closes [#526](https://github.com/sct/overseerr/issues/526)
* use new commit tag file for app version as well ([d00e470](https://github.com/sct/overseerr/commit/d00e470b55327489b49d770144b7cfdb24045be6))


### Features

* **email:** add sendername to email notification ([#506](https://github.com/sct/overseerr/issues/506)) ([0185bb1](https://github.com/sct/overseerr/commit/0185bb1a7084c1faeb61fb1c63e34e26732711c8))
* **frontend:** add clear-field-icon to search field ([#498](https://github.com/sct/overseerr/issues/498)) ([7434a26](https://github.com/sct/overseerr/commit/7434a26f76b5e9f74918f3e1a34443d20ecfcbe4))
* **frontend:** add documentation link to about page ([c034496](https://github.com/sct/overseerr/commit/c034496f557a031aed35cd28dc7221d8cdf36643))
* **frontend:** add telegram integration ([#491](https://github.com/sct/overseerr/issues/491)) ([c8d4d67](https://github.com/sct/overseerr/commit/c8d4d674f412082ad9e9da09abd79660365cf728))
* **frontend:** filter/sorting for request list ([5add44c](https://github.com/sct/overseerr/commit/5add44cfb0379aa6fed7c3b867230292feacc684)), closes [#431](https://github.com/sct/overseerr/issues/431)
* **notifications:** control notifcation types per agent ([8af6a1f](https://github.com/sct/overseerr/commit/8af6a1f566769c583af7dd9e18d162717835b7cc)), closes [#513](https://github.com/sct/overseerr/issues/513)
* status checker to prompt users to reload their frontend when app version changes ([75a4264](https://github.com/sct/overseerr/commit/75a426437a4182e21da13684066966dd5bf8fc5e))

## [1.14.1](https://github.com/sct/overseerr/compare/v1.14.0...v1.14.1) (2021-01-02)


### Bug Fixes

* **holiday:** remove special holiday slider ([22f2037](https://github.com/sct/overseerr/commit/22f2037ea6c5a0ba2ffa4d69f2b7cf42bdcf8575))

# [1.14.0](https://github.com/sct/overseerr/compare/v1.13.0...v1.14.0) (2020-12-25)


### Bug Fixes

* **frontend:** add margin to ButtonWithDropdown component on movie/tv details page ([06fc98b](https://github.com/sct/overseerr/commit/06fc98b6b958221fa180f57f702c348f15b31f1c))
* **frontend:** correctly position title card hover section ([#486](https://github.com/sct/overseerr/issues/486)) ([4b7af86](https://github.com/sct/overseerr/commit/4b7af86111a0300e1a137f23fa4ad1639fa55feb))
* **frontend:** fix missing styles for alert component ([de3d288](https://github.com/sct/overseerr/commit/de3d288949b60d3a3af889d69a62bea2bc799ed7))
* **frontend:** fix mobile dropdown in notifications settings ([6353cda](https://github.com/sct/overseerr/commit/6353cda5825f442dd539886c7b9ba437edf27ac4))
* **frontend:** fix scaling titlecard content position ([bd94740](https://github.com/sct/overseerr/commit/bd947409e6e8ff313011b77adc76ccd5f9112c78))
* **frontend:** improve flex header on movie/tv details page ([d7b1c28](https://github.com/sct/overseerr/commit/d7b1c2840690c144ebf29a360defcbd6fdb21354))
* **frontend:** invalid dom-nesting title card fix ([#482](https://github.com/sct/overseerr/issues/482)) ([f2ebba7](https://github.com/sct/overseerr/commit/f2ebba7b1df775d33d2af6abc3ee2c9de5f2e57a)), closes [#476](https://github.com/sct/overseerr/issues/476)
* **frontend:** remove vote permission for now ([5d06a34](https://github.com/sct/overseerr/commit/5d06a347311bd10c05d8f58068ca7104e265dcca))
* **frontend:** sort person detail credits by tmdb votes ([17518db](https://github.com/sct/overseerr/commit/17518dbe7f545100770a892d03d1f8508adc3650))
* **frontend:** status badge Unavailable renamed to Requested ([ed94a0f](https://github.com/sct/overseerr/commit/ed94a0f335c59de526dd812aea7616313fe002fd)), closes [#374](https://github.com/sct/overseerr/issues/374)
* **frontend:** update titlecard status badge to new requested colors ([8f292d5](https://github.com/sct/overseerr/commit/8f292d538b937ea133175089979ef02599f6fef4))
* **logs:** rotate logs on a daily basis instead of incrementing log filename ([395cbb2](https://github.com/sct/overseerr/commit/395cbb2be6c62f1d7573593e49a93615eaf22853))
* improve apple-touch-icon and android app icons ([329a814](https://github.com/sct/overseerr/commit/329a814a8fb791122266c0b04b05848c71d68ba1))


### Features

* **lang:** translations update from Weblate ([#479](https://github.com/sct/overseerr/issues/479)) ([c8c74b0](https://github.com/sct/overseerr/commit/c8c74b0ae54fcc524aa8b2edf5a5c5e5db6c1638))
* **notifications:** add slack notification agent ([1163e81](https://github.com/sct/overseerr/commit/1163e81adc7da1e8334155ebee5b4672a22143db)), closes [#365](https://github.com/sct/overseerr/issues/365)
* add collections ([#484](https://github.com/sct/overseerr/issues/484)) ([a333a09](https://github.com/sct/overseerr/commit/a333a095820ce3f10857026ba4770a2fffeed7cb)), closes [#418](https://github.com/sct/overseerr/issues/418)
* add separate auto approve permissions for Movies/Series ([4809257](https://github.com/sct/overseerr/commit/480925781691de456abc427fbbba161be11a3a8a)), closes [#268](https://github.com/sct/overseerr/issues/268)
* simple failed request handling ([#474](https://github.com/sct/overseerr/issues/474)) ([02969d5](https://github.com/sct/overseerr/commit/02969d5426245062a2f53475d83c4a8639632c9d))
* YouTube Movie/TV Trailers ([#454](https://github.com/sct/overseerr/issues/454)) ([e88dc83](https://github.com/sct/overseerr/commit/e88dc83aeba0475e3ad421d5ab130cea4fc9a806))

# [1.13.0](https://github.com/sct/overseerr/compare/v1.12.1...v1.13.0) (2020-12-23)


### Bug Fixes

* **api:** correctly return firstAirDate for series in search endpoints ([32b4c99](https://github.com/sct/overseerr/commit/32b4c99950659d9e1da2ffa93c22383c54d0d904)), closes [#462](https://github.com/sct/overseerr/issues/462)
* **email:** correctly log errors when emails fail to send ([0980fa5](https://github.com/sct/overseerr/commit/0980fa54f9fc3bdfae6c57fa5a20ce3b2a88a677))
* **frontend:** added new Radarr v3 logo ([#471](https://github.com/sct/overseerr/issues/471)) ([3bbc716](https://github.com/sct/overseerr/commit/3bbc716434dc04bfe6b55de9898eb2c0ecb03baa))
* **frontend:** approve and decline button (in manage panel) will now fit on mobile ([#441](https://github.com/sct/overseerr/issues/441)) ([66ef72d](https://github.com/sct/overseerr/commit/66ef72dd42912d83ea8f86aabb75fbee547f8de9))
* **frontend:** filter out undefined backdrop paths for person details page ([2e0e4d5](https://github.com/sct/overseerr/commit/2e0e4d5129ed4912415f61eb8d1da41e88ddcaff))
* **frontend:** show backdrops instead of posters for new person detail design ([9f5f920](https://github.com/sct/overseerr/commit/9f5f920c23007363aa7f53ebef0b61236d4f53ea))
* clarify full sync runs every 24 hours ([0c8a180](https://github.com/sct/overseerr/commit/0c8a180189b2610bab2fa977d458743d8a60343e))
* **plex-sync:** match correct tmdb format for movies ([4205e32](https://github.com/sct/overseerr/commit/4205e32ae71bc18c07209f1c82e6af1cb5f01335))


### Features

* **email:** option to allow self signed certificates ([6898357](https://github.com/sct/overseerr/commit/6898357b13a6aa53a55709ea95819c2b3df6784c))
* **frontend:** adjust person details design and add improved truncate ([1fb7ea7](https://github.com/sct/overseerr/commit/1fb7ea72589d2908ae80a2a688881d4eb3c050e5))
* **frontend:** first air date added to TV details page ([#470](https://github.com/sct/overseerr/issues/470)) ([a7db01f](https://github.com/sct/overseerr/commit/a7db01fba483ca633a6eb9d39eb085ab9939d4d2))
* **lang:** translations update from Weblate ([#410](https://github.com/sct/overseerr/issues/410)) ([941fe19](https://github.com/sct/overseerr/commit/941fe1990454439cf05b48ef92bd3493432f8ed8))
* **logs:** rotate log files if they reach 20MB in size ([22002ab](https://github.com/sct/overseerr/commit/22002ab4c76aace2bb202ac58da605b7a6f75d6d)), closes [#438](https://github.com/sct/overseerr/issues/438)
* **notifications:** include direct links to media in notifications ([659fa50](https://github.com/sct/overseerr/commit/659fa505f0db32262ad0041cddb4daea893e6d65)), closes [#437](https://github.com/sct/overseerr/issues/437)
* **plex-sync:** add support for hama guid's ([ffe9e19](https://github.com/sct/overseerr/commit/ffe9e19c3b99de6af1185900e292da641ff44320)), closes [#453](https://github.com/sct/overseerr/issues/453)

## [1.12.1](https://github.com/sct/overseerr/compare/v1.12.0...v1.12.1) (2020-12-22)


### Bug Fixes

* **migration:** fixes issue migrating away from the unique imdbId constraint ([69fd7a5](https://github.com/sct/overseerr/commit/69fd7a5511215674a5c22ba48627f221da900229))

# [1.12.0](https://github.com/sct/overseerr/compare/v1.11.0...v1.12.0) (2020-12-22)


### Bug Fixes

* **api:** fix cross-imported type crashing build ([f35dae5](https://github.com/sct/overseerr/commit/f35dae56a583a5545375318fa5be994ae1f2557f))
* **api:** prevent checking first admin account for plex server access ([22006e9](https://github.com/sct/overseerr/commit/22006e9dbde82609440f89bde9a40887b4742682))
* **frontend:** add name, short_name and start_url to manifest ([#424](https://github.com/sct/overseerr/issues/424)) ([c6836e0](https://github.com/sct/overseerr/commit/c6836e02c810e8adb12c3a4b110f9604cf5b7b81))
* **frontend:** adjust person card layout to deal with overflowing content ([4891298](https://github.com/sct/overseerr/commit/48912988915ae40606a900a6f1dd23fc25ed567f)), closes [#416](https://github.com/sct/overseerr/issues/416)
* **frontend:** allow more special characters in search input ([5deb64a](https://github.com/sct/overseerr/commit/5deb64a87fd70e97da27a025ad11fb8ace0e0b57)), closes [#430](https://github.com/sct/overseerr/issues/430)
* **logs:** improve logging when adding to sonarr/radarr ([4b50522](https://github.com/sct/overseerr/commit/4b505223b881a750007e3fbc7d4bcb9677d4d412))
* only run migrations in production ([ab9cef3](https://github.com/sct/overseerr/commit/ab9cef3624b5db1ec03507553a69d33b87857e29))
* **notifications:** always update the media table when seasons become available ([0916b58](https://github.com/sct/overseerr/commit/0916b58594a00db98c6701fdcaee4f3c3e08904e))
* **plex-sync:** fixes processing movies using TMDB agent ([764db94](https://github.com/sct/overseerr/commit/764db94f1bd7866309684d5bd56033b21cbc2e0c)), closes [#363](https://github.com/sct/overseerr/issues/363)


### Features

* **frontend:** add crew related movies/shows to person details page ([12127a7](https://github.com/sct/overseerr/commit/12127a77633f0e92ae88cbafd49581296f559c33))
* **frontend:** add full crew page for movies/shows ([604ba2a](https://github.com/sct/overseerr/commit/604ba2a92f1d59489e7fc6dfc011347f8595c123))
* default user permissions added to settings ([e7ee85c](https://github.com/sct/overseerr/commit/e7ee85c29b5d25c6bff58717eae5e62de4dcef0c)), closes [#388](https://github.com/sct/overseerr/issues/388)
* import users from plex ([#428](https://github.com/sct/overseerr/issues/428)) ([7e8f361](https://github.com/sct/overseerr/commit/7e8f361af711001cfc4dcc06a384b76f9846f90f)), closes [#281](https://github.com/sct/overseerr/issues/281)
* **frontend:** add prioritized crew under overview ([6753d9d](https://github.com/sct/overseerr/commit/6753d9daaafb18672f14fd86f2c1675dcec39b13)), closes [#406](https://github.com/sct/overseerr/issues/406)
* **notifications:** added ability to send test notifications ([44a3054](https://github.com/sct/overseerr/commit/44a305426f3e9829c167a4a73095d0d248641f47)), closes [#309](https://github.com/sct/overseerr/issues/309)


### Reverts

* **deps:** revert react-use-clipboard to 1.0.2 ([7083ddf](https://github.com/sct/overseerr/commit/7083ddf18121716e3442acab3506c395fdc351ac))

# [1.11.0](https://github.com/sct/overseerr/compare/v1.10.0...v1.11.0) (2020-12-20)


### Features

* **frontend:** add language picker to setup/login ([ff2ab29](https://github.com/sct/overseerr/commit/ff2ab29491a80c421525b9a394d6fbbf54914dc2))
* **frontend:** add support overseerr block to about page ([c128898](https://github.com/sct/overseerr/commit/c128898206d6cbb482de4d8dca53f70b87e4911a))
* **frontend:** releases added to about page ([b7f5739](https://github.com/sct/overseerr/commit/b7f573903500cc8a62e39afd787bc1da8c09d88b)), closes [#303](https://github.com/sct/overseerr/issues/303)
* **lang:** add support for Italian, Portuguese (Brazil) and Serbian ([108dfc4](https://github.com/sct/overseerr/commit/108dfc4afd31388cb6c9e07deccd168ade8b1574))
* **lang:** add support for swedish language ([c9fe6cb](https://github.com/sct/overseerr/commit/c9fe6cb0b7ea984d8e4e1cb3f284935c9da7cc2b))
* **lang:** translations update from Weblate ([#400](https://github.com/sct/overseerr/issues/400)) ([1bd0e64](https://github.com/sct/overseerr/commit/1bd0e646e313ddf77ef331e818e03401fbf64a72))
* **lang:** translations update from Weblate ([#403](https://github.com/sct/overseerr/issues/403)) ([3778ad8](https://github.com/sct/overseerr/commit/3778ad829c0897de178212b3bde4c0d3b5089161))

# [1.10.0](https://github.com/sct/overseerr/compare/v1.9.1...v1.10.0) (2020-12-19)


### Bug Fixes

* **email:** fix link to Overseerr in email templates ([816fec1](https://github.com/sct/overseerr/commit/816fec1a83a53edb3b65c3e5e7d0e6e1bd49726d)), closes [#392](https://github.com/sct/overseerr/issues/392)
* **frontend:** adjust padding of search box so placeholder text fits on mobile ([3601d44](https://github.com/sct/overseerr/commit/3601d442db32d3f98f7b050365c11ea8ef9bc4ae)), closes [#393](https://github.com/sct/overseerr/issues/393)
* **frontend:** changed request block for slideover on mobile UI ([#387](https://github.com/sct/overseerr/issues/387)) ([549567a](https://github.com/sct/overseerr/commit/549567a7e9db01933546d9970fc06f17218dfab1))
* **frontend:** hide Request More button if all current seasons are available ([2a4dd52](https://github.com/sct/overseerr/commit/2a4dd52275007e48f946c3b9e29f1d78da57bdaa)), closes [#343](https://github.com/sct/overseerr/issues/343)
* **frontend:** try not to render broken rottentomatoes data ([a0c5608](https://github.com/sct/overseerr/commit/a0c5608aa0b6c7a4294300589efa9a662163ce48))


### Features

* **lang:** translations update from Weblate ([#391](https://github.com/sct/overseerr/issues/391)) ([5f71fb7](https://github.com/sct/overseerr/commit/5f71fb7ee280714275d2ac045c472fcdddd5a2ea))
* add missing tzdata package to image ([53bede6](https://github.com/sct/overseerr/commit/53bede692d4f0e940dededa63015fe1908129914)), closes [#394](https://github.com/sct/overseerr/issues/394)
* **frontend:** add external links to movie and tv detail pages ([a0024a0](https://github.com/sct/overseerr/commit/a0024a0cbe717d78f53413bb78644c829f143c4d))
* **lang:** translations update from Weblate ([#380](https://github.com/sct/overseerr/issues/380)) ([8408e19](https://github.com/sct/overseerr/commit/8408e19568b2f239c57e11e2946c75f193d1c22e))

## [1.9.1](https://github.com/sct/overseerr/compare/v1.9.0...v1.9.1) (2020-12-18)


### Bug Fixes

* change default internal port to 5055 ([#389](https://github.com/sct/overseerr/issues/389)) ([5e5ba40](https://github.com/sct/overseerr/commit/5e5ba4050563f07bff367d2fb31ed7e7fca4291e))

# [1.9.0](https://github.com/sct/overseerr/compare/v1.8.0...v1.9.0) (2020-12-18)


### Features

* api key regeneration ([6beac73](https://github.com/sct/overseerr/commit/6beac736efcf7b9102e02e43b75d91a9a158cd22))
* **api:** add movie keyword search ([f88c4a6](https://github.com/sct/overseerr/commit/f88c4a6d4a49f8f3451ba6c85153677f33b7f5f6))
* **frontend:** add studio/networks to movie/tv details ([4b6ad8a](https://github.com/sct/overseerr/commit/4b6ad8a3871957db4192b603abf38404250cea5d)), closes [#370](https://github.com/sct/overseerr/issues/370)
* **frontend:** added user deletion to the user list ([727fa06](https://github.com/sct/overseerr/commit/727fa06c18febb2a97ca219cc6bf0277ff462acd)), closes [#348](https://github.com/sct/overseerr/issues/348)
* **holiday:** special seasonal slider added to discover :) ([908f635](https://github.com/sct/overseerr/commit/908f63557ca03a1da8b16809ffa2c3acd782d94e))
* allow to listen server on specific host interface ([#381](https://github.com/sct/overseerr/issues/381)) ([086183b](https://github.com/sct/overseerr/commit/086183b5636aa8d075d01fe59492c3eab0d1345b)), closes [#273](https://github.com/sct/overseerr/issues/273)
* anime profile support ([#384](https://github.com/sct/overseerr/issues/384)) ([0972f40](https://github.com/sct/overseerr/commit/0972f40a4e1fb3b5f02b07ae46b997d71aab9bfb)), closes [#266](https://github.com/sct/overseerr/issues/266)

# [1.8.0](https://github.com/sct/overseerr/compare/v1.7.0...v1.8.0) (2020-12-17)


### Features

* **lang:** translations update from Weblate ([#336](https://github.com/sct/overseerr/issues/336)) ([ee84f74](https://github.com/sct/overseerr/commit/ee84f74f8a3558875b41daa539f42d00b949898a))

# [1.7.0](https://github.com/sct/overseerr/compare/v1.6.0...v1.7.0) (2020-12-17)


### Bug Fixes

* **email:** do not pass auth object to transport if no auth data present ([d5eb4d8](https://github.com/sct/overseerr/commit/d5eb4d8d438a159266b2de66b6bcdd9440a0c8ef)), closes [#312](https://github.com/sct/overseerr/issues/312)
* **frontend:** add http/https prefix to hostname fields for plex/radarr/sonarr ([ce0266f](https://github.com/sct/overseerr/commit/ce0266f74ea3979b291ff962271a928682892788)), closes [#357](https://github.com/sct/overseerr/issues/357)
* **frontend:** clarify that radarr/sonnarr servers must be tested before profiles/folders appear ([fc12ab8](https://github.com/sct/overseerr/commit/fc12ab84d9482eb3a11f117f8cab6fd48a9401cd)), closes [#326](https://github.com/sct/overseerr/issues/326) [#328](https://github.com/sct/overseerr/issues/328)
* **frontend:** correctly show an unauthorized error when a user fails to login ([18925de](https://github.com/sct/overseerr/commit/18925decafdac518f52a354c594cc378d2529022)), closes [#322](https://github.com/sct/overseerr/issues/322)
* **frontend:** fix tv shows failing to open when firstAirDate is undefined ([c21fa5b](https://github.com/sct/overseerr/commit/c21fa5b5350abdd8e03c077fde7246fa398e176e)), closes [#347](https://github.com/sct/overseerr/issues/347)
* **frontend:** make minimum availability required for Radarr servers ([2fe53ec](https://github.com/sct/overseerr/commit/2fe53ec5a8534e75c7d0cef31a8b46065111e0a7)), closes [#345](https://github.com/sct/overseerr/issues/345)
* **plex-sync:** bundle duplicate ratingKeys to speed up recently added sync ([67146c3](https://github.com/sct/overseerr/commit/67146c33ef7f28d520ba2c50b32673d43f4525c8)), closes [#360](https://github.com/sct/overseerr/issues/360)
* **sonarr.ts, mediarequest.ts:** add missing seasonFolder option ([#358](https://github.com/sct/overseerr/issues/358)) ([e9c899c](https://github.com/sct/overseerr/commit/e9c899ce419d149dde2ad9a0f7d5a2f2545b3ebf))


### Features

* **frontend:** show alert when there are no default radarr/sonarr servers ([0d088e0](https://github.com/sct/overseerr/commit/0d088e085e68d39455fda21d1fd08ebcaef2c06b)), closes [#344](https://github.com/sct/overseerr/issues/344)

# [1.6.0](https://github.com/sct/overseerr/compare/v1.5.0...v1.6.0) (2020-12-16)


### Bug Fixes

* **api:** accept the api key to perform actions on the api with X-API-Key header ([33f8831](https://github.com/sct/overseerr/commit/33f8831e880dc7fd3f69d951246cada5c6c0ffe7))
* **api:** filter out libraries that do not have any metadata agent or are not movie/show ([01c179f](https://github.com/sct/overseerr/commit/01c179f762e686a1e5a3d4dab3a5bea53425b575))
* **api:** only run recently added sync on enabled libraries ([e08fa35](https://github.com/sct/overseerr/commit/e08fa35548bb8644afa8df3124e6f9cc3a2c8f4a)), closes [#259](https://github.com/sct/overseerr/issues/259)
* **api:** set plex libraries to disabled if the name changes ([675060b](https://github.com/sct/overseerr/commit/675060bcdf23acbfd4de2900a65f95e74f4966a5)), closes [#324](https://github.com/sct/overseerr/issues/324)
* **frontend:** adds a tip to plex setup to clarify that syncing runs in the background ([df4ac83](https://github.com/sct/overseerr/commit/df4ac8361f82971ee845f3be217408a9123a0bf3)), closes [#325](https://github.com/sct/overseerr/issues/325)
* **frontend:** aligned movie and tv details ([#331](https://github.com/sct/overseerr/issues/331)) ([db0a5c4](https://github.com/sct/overseerr/commit/db0a5c44f678e76eee7f5582381016306d1f46a2))
* **frontend:** close sidebar when clicking outside ([#333](https://github.com/sct/overseerr/issues/333)) ([6d7907e](https://github.com/sct/overseerr/commit/6d7907e844a909993d185759d660632f55aeaa35))
* spelling mistake on the word 'requested' fixed ([#319](https://github.com/sct/overseerr/issues/319)) ([961d110](https://github.com/sct/overseerr/commit/961d1107208069a6fc820a1ba97ffda7336677cb))


### Features

* add version to startup logs ([2948f93](https://github.com/sct/overseerr/commit/2948f9360eb484d1d6c0740a840135ca97e7240a))
* **frontend:** temporary logs page to clear up confusion about it 404ing ([d9788c4](https://github.com/sct/overseerr/commit/d9788c4aa9f87e2eda3f7e3f1adc985f16039552)), closes [#272](https://github.com/sct/overseerr/issues/272)
* **lang:** add support for Spanish language ([6cd2049](https://github.com/sct/overseerr/commit/6cd20491d2a0ceb995c4744eeb92a6e2f57a4893))
* **lang:** Translations update from Weblate ([#291](https://github.com/sct/overseerr/issues/291)) ([fddbb3c](https://github.com/sct/overseerr/commit/fddbb3cdfe3d50b2835c248556139c769dc2b805))

# [1.5.0](https://github.com/sct/overseerr/compare/v1.4.0...v1.5.0) (2020-12-15)


### Bug Fixes

* **api:** require package.json directly so typescript doesnt compile it into dist folder ([b9faa64](https://github.com/sct/overseerr/commit/b9faa6486b35aa865019aa8af9d307531054bc1d))
* **frontend:** add validation for Radarr/Sonarr server name ([b5988f9](https://github.com/sct/overseerr/commit/b5988f9a5ff274e97f208c2726abe76c22c858ee))
* **frontend:** only show alpha notice to admins ([ff61895](https://github.com/sct/overseerr/commit/ff618956b5d9cf933d867ea979b612c3d8a6f30b))
* add support for ssl when connecting to plex ([3ba09d0](https://github.com/sct/overseerr/commit/3ba09d07eb0367c41603cd55e7ff41c66fb641c4)), closes [#275](https://github.com/sct/overseerr/issues/275)
* **services:** improve logging for when Radarr movie already exists ([#285](https://github.com/sct/overseerr/issues/285)) ([f998873](https://github.com/sct/overseerr/commit/f998873fc5669a547901f2733c9c785d744d27ca)), closes [#260](https://github.com/sct/overseerr/issues/260)


### Features

* **lang:** add i18n strings for new about page ([900827b](https://github.com/sct/overseerr/commit/900827be97845688e4bea72a8c5d9611a3e9d069))
* about page initial version ([3f2a04c](https://github.com/sct/overseerr/commit/3f2a04c881bf06b73a952181fa463af84454b0dd))

# [1.4.0](https://github.com/sct/overseerr/compare/v1.3.2...v1.4.0) (2020-12-15)


### Bug Fixes

* changing parameter name to use correct 'port' [#276](https://github.com/sct/overseerr/issues/276) ([#277](https://github.com/sct/overseerr/issues/277)) ([6d08b10](https://github.com/sct/overseerr/commit/6d08b108200177ca3068c852e60a0df75ce2232a))
* **services:** include radarr/sonarr baseUrl when adding media ([78af1a3](https://github.com/sct/overseerr/commit/78af1a3e6d00a5645a05e7bf3cf56a59439b6cc9))


### Features

* **lang:** Translations update from Weblate ([#240](https://github.com/sct/overseerr/issues/240)) ([e17c637](https://github.com/sct/overseerr/commit/e17c63748362b6a480693e003ef5eec614dcec43))

## [1.3.2](https://github.com/sct/overseerr/compare/v1.3.1...v1.3.2) (2020-12-14)


### Bug Fixes

* **frontend:** convert plex port to a number before posting to the api ([8cb05c4](https://github.com/sct/overseerr/commit/8cb05c413a15a4b74e37ece5e24367d115995b32))
* **frontend:** converts email smtp port to a number before posting to the api ([2098a2d](https://github.com/sct/overseerr/commit/2098a2d3d2981fd2ae54392aec3ef81327f2858e)), closes [#251](https://github.com/sct/overseerr/issues/251)
* **frontend:** encode special characters in search input to prevent crashing router ([15013d6](https://github.com/sct/overseerr/commit/15013d6c5dbff15704c7c30d261d68a265e7f2d7)), closes [#252](https://github.com/sct/overseerr/issues/252)
* **plex sync:** catch errors that occur during processMovie ([edbbccf](https://github.com/sct/overseerr/commit/edbbccf3ae623430294f1a5c3fd2728dbd42e555)), closes [#244](https://github.com/sct/overseerr/issues/244) [#246](https://github.com/sct/overseerr/issues/246) [#250](https://github.com/sct/overseerr/issues/250)
* **services:** improve logging for adding movies to Radarr ([6c1ee83](https://github.com/sct/overseerr/commit/6c1ee830a183f89bb1fe96a181a7d61684e23b22))
* **services:** radarr/sonarr will use the correct default server ([0658b79](https://github.com/sct/overseerr/commit/0658b7943e1ab25816db9da34d4c9ea808d9203d))

## [1.3.1](https://github.com/sct/overseerr/compare/v1.3.0...v1.3.1) (2020-12-14)


### Bug Fixes

* **frontend:** also convert activeProfileId to a number for radarr/sonarr submissions ([7bf924f](https://github.com/sct/overseerr/commit/7bf924f7e94a0e0834f41b4ec067ed277c652766))
* **frontend:** also convert ports to numbers when saving radarr/sonarr servers ([c53dc3b](https://github.com/sct/overseerr/commit/c53dc3b15da522c6e6ab76bbc9d15008a8a9fb9d))
* **frontend:** new radarr/sonarr ports will be converted to a number before posting ([92c9001](https://github.com/sct/overseerr/commit/92c9001c9d1f2cbd272a5897ea1157d2cadbce2d))

# [1.3.0](https://github.com/sct/overseerr/compare/v1.2.0...v1.3.0) (2020-12-14)


### Bug Fixes

* **api:** correctly generate clientId on first startup ([5f09e83](https://github.com/sct/overseerr/commit/5f09e83ed870336638d3e9d94fcf55ead928e737))


### Features

* **frontend:** add full cast page for movies and series ([051f1b3](https://github.com/sct/overseerr/commit/051f1b3e899bf749e632743e5c8d45a02b621998))
* **lang:** translated using Weblate (Dutch) ([1ab3a4b](https://github.com/sct/overseerr/commit/1ab3a4b80a081d7e4a201f1290cd270ed5b38ac7))
* **lang:** translated using Weblate (English) ([0949c9b](https://github.com/sct/overseerr/commit/0949c9b334b3a4b6c342517a157a9e2b7596f2f0))
* **lang:** translated using Weblate (French) ([f943701](https://github.com/sct/overseerr/commit/f943701e13c7f0de5a711302597858cc898b16e2))
* **lang:** translated using Weblate (French) ([30d04ce](https://github.com/sct/overseerr/commit/30d04ce35adc21070cce37ab10384154afda191b))
* **lang:** translated using Weblate (German) ([7bf9add](https://github.com/sct/overseerr/commit/7bf9addd13a707aac23b64ef3f1733e491d40a4e))
* **lang:** translated using Weblate (German) ([b6e60a4](https://github.com/sct/overseerr/commit/b6e60a412b30907aea751a4cf1ce0cc8230f9814))
* **lang:** translated using Weblate (Japanese) ([08e968f](https://github.com/sct/overseerr/commit/08e968fd0097ec7b2a65de064ed5b07e7c49ef39))
* **lang:** translated using Weblate (Norwegian Bokmål) ([83efb0e](https://github.com/sct/overseerr/commit/83efb0e3d4d96b6a2d2ebdd85d36c9d78c1717b2))
* **lang:** translated using Weblate (Russian) ([0d8e0d0](https://github.com/sct/overseerr/commit/0d8e0d0352f72fdb65ee8f054371eae08c39fe33))

# [1.2.0](https://github.com/sct/overseerr/compare/v1.1.0...v1.2.0) (2020-12-11)


### Bug Fixes

* **frontend:** person cards now show correctly in ListView's ([ccb9855](https://github.com/sct/overseerr/commit/ccb98553f104c1aebd33796b7090cc9bbe964bd7))
* **frontend:** properly remove site overlay when closing modals ([3fa7ff9](https://github.com/sct/overseerr/commit/3fa7ff9858d14d132151f3329164d55d74638f53))
* **frontend:** switch to using Transition component for modals ([b16fbaf](https://github.com/sct/overseerr/commit/b16fbafa1f3d5e105c0a4ba6f1d66aa064019636)), closes [#220](https://github.com/sct/overseerr/issues/220)
* fix missing personid in Discover ([d8060af](https://github.com/sct/overseerr/commit/d8060afe02574337f51b88cab0a0f824976ac721))
* missing personId in ListView component ([6502feb](https://github.com/sct/overseerr/commit/6502feb1a5be3c6daab33230814fe74632c87f7e))
* **frontend:** update overflow issues with seasons + email ([#217](https://github.com/sct/overseerr/issues/217)) ([2d0afb2](https://github.com/sct/overseerr/commit/2d0afb29d37798a626e3f182571ccce43d80063c)), closes [#216](https://github.com/sct/overseerr/issues/216)
* **lang:** fix missing i18n string for agent enabled in email notification page ([42788ad](https://github.com/sct/overseerr/commit/42788adb75f7d23e68327688b1c542dd047e9609))


### Features

* **lang:** update language files ([8cd067b](https://github.com/sct/overseerr/commit/8cd067b6e9df1a3c8f4056789436a31177703986))
* person details page ([d6eb3ae](https://github.com/sct/overseerr/commit/d6eb3ae64ef46bd62145010d3029e272676487c3))
* **lang:** add nb-NO and de language support to app ([d38b28d](https://github.com/sct/overseerr/commit/d38b28d2061b38366989ff412957a5dee5766c6f))
* **lang:** add support for dutch language ([df94db0](https://github.com/sct/overseerr/commit/df94db050bf68a925118e0ce865d27178b702f9e))
* **lang:** add support for russian languge ([8d8e750](https://github.com/sct/overseerr/commit/8d8e7509826514eebc859374d2e1ab212cc442d1))
* **lang:** added translation using Weblate (Russian) ([887f5dd](https://github.com/sct/overseerr/commit/887f5dd487b61676029652d99cbc5b40213aa22e))
* **lang:** translated using Weblate (French) ([30a8934](https://github.com/sct/overseerr/commit/30a8934626fa2d47e95b5925d7e4227a0d0aa728))
* **lang:** translated using Weblate (German) ([44dbb74](https://github.com/sct/overseerr/commit/44dbb745b6216ce19fab4740520785c6414cf367))
* **lang:** translated using Weblate (Japanese) ([a494507](https://github.com/sct/overseerr/commit/a494507dfeafb0cfd2bd66fb01138522e0e80737))
* **lang:** translated using Weblate (Russian) ([86cadb8](https://github.com/sct/overseerr/commit/86cadb8283fcab8745b4c09f8429fd9e46708813))
* **lang:** translations update from Weblate ([#201](https://github.com/sct/overseerr/issues/201)) ([b0c663b](https://github.com/sct/overseerr/commit/b0c663baccd994e234b4d41d86486c3af4906344))

# [1.1.0](https://github.com/sct/overseerr/compare/v1.0.0...v1.1.0) (2020-12-08)


### Bug Fixes

* fix a few misc unused imports and useless assignments/conditionals ([8e6daf7](https://github.com/sct/overseerr/commit/8e6daf7bd271ce5bebf4a00f5bb1144bd6b60aa5))
* **frontend:** dont show delete button in request list for users without correct permission ([83fde46](https://github.com/sct/overseerr/commit/83fde46a59c6f1910806a6106b5526b8adbc386c))
* **frontend:** push updated i18n locale files ([b4002d7](https://github.com/sct/overseerr/commit/b4002d71323a04e7991198cedc263660e872df8d))


### Features

* generate real api key ([a839370](https://github.com/sct/overseerr/commit/a8393707fec85a9262af5ba8c03d205190b2235b))
* **frontend:** add i18n strings for request list and request item ([6c4022f](https://github.com/sct/overseerr/commit/6c4022fb236583ad20d4c4c6693c1339e165b4af))
* **frontend:** initial version of the requests page (no filtering/sorting) ([1ba027b](https://github.com/sct/overseerr/commit/1ba027b4357e078c3f177d9d07208049f0c1ce65))
* **frontend:** only load request/tmdb cards when in the browser view ([2d51efd](https://github.com/sct/overseerr/commit/2d51efd71612ec969b83c62d6aa0dac6df9391a3))

# 1.0.0 (2020-12-06)


### Bug Fixes

* **api:** fix scheduling for plex full sync (maybe) ([7287a6a](https://github.com/sct/overseerr/commit/7287a6a95703b23acc0c4f6eb3beb9ec2295e33f))
* **frontend:** always show request modal option for tv ([2b46268](https://github.com/sct/overseerr/commit/2b462688243531b4be620a942f59defd4e0534d0))
* **frontend:** canceled movie request should set parent movie status back to unknown ([#198](https://github.com/sct/overseerr/issues/198)) ([139871f](https://github.com/sct/overseerr/commit/139871f218812a15f742aa66408db12704e0b9b5))
* **frontend:** close request modals when complete ([85ae499](https://github.com/sct/overseerr/commit/85ae4998f0ba8d4869b9b244f2c440b9df1310d2))
* **frontend:** dont show runtime if there is no runtime data ([e0c39ae](https://github.com/sct/overseerr/commit/e0c39aeca119b822f2a54ff05a97f91780ddd052))
* **frontend:** fix missing data for request modal title i18n ([a56fd16](https://github.com/sct/overseerr/commit/a56fd16ab6638d4649fe9f8b9d75e7cae7742f73))
* **frontend:** fix missing import for ReactNode type in Slider ([b26a234](https://github.com/sct/overseerr/commit/b26a2347e7b0f7ff8720a204d9faefd501ba886c))
* **frontend:** fix modal design and rename some text for adding servers ([46d99b0](https://github.com/sct/overseerr/commit/46d99b02b1c992c7b8dde2150217ed9ce326b7a5))
* **frontend:** fix opening popups on safari ([364d9d1](https://github.com/sct/overseerr/commit/364d9d105ca3690fcd5f635485d7c025353bb9f1))
* **frontend:** fix request card placeholder sizes for mobile ([ef62c67](https://github.com/sct/overseerr/commit/ef62c67480ed52d753ea6db8205f035b2e9da272))
* **frontend:** show a badge on requestcard for partially available status ([59056c4](https://github.com/sct/overseerr/commit/59056c44f942a37df536ff947b5faccc27f32246))
* dont cross import SyncStatus type ([e032e38](https://github.com/sct/overseerr/commit/e032e385a5253d215490255c676f42ee48f39428))
* fix type import from server side crashing build process ([89be56d](https://github.com/sct/overseerr/commit/89be56d8403ebc60c411e7cb357593edd9c79bb2))
* **frontend:** fix title detail background image to be centered ([b92f64f](https://github.com/sct/overseerr/commit/b92f64fa6e167bc89168d8f5c0f2eb12efa0b6f0))
* **frontend:** fixed similar/recommendations showing when empty ([#180](https://github.com/sct/overseerr/issues/180)) ([a3ca9b4](https://github.com/sct/overseerr/commit/a3ca9b40c552e6cc5effc2f57f7562ff6f723e42))
* **frontend:** have tvDetail use the new RequestModal ([6aca826](https://github.com/sct/overseerr/commit/6aca82607b97d4a4ad74e2ea843d52fba4689e6a))
* **frontend:** reinitalize plex form after data loads ([97e3036](https://github.com/sct/overseerr/commit/97e30367fb5d2d27efc42c1d76b0d051b6f1da76))
* **frontend:** remove requestId from tilecard request modal component ([61b6152](https://github.com/sct/overseerr/commit/61b6152e8915c99585b944756a61d33b8c8a0307))
* **frontend:** run initial props for children components after getting the user ([fdf9f38](https://github.com/sct/overseerr/commit/fdf9f38776b6d4c08b3505c03b354639cebb011f))
* **frontend:** when there were no results in the list view, it would call fetch more infinitely ([c0ce87b](https://github.com/sct/overseerr/commit/c0ce87b6f65bf0ab1301c7ca61090d779709529f))
* fixed an issue with eslint-prettier on windows ([#32](https://github.com/sct/overseerr/issues/32)) ([b673ea1](https://github.com/sct/overseerr/commit/b673ea1b18ca0f432996bb9e4e5d148af0247170))
* fixes next.js build to not include server files ([de8ee9b](https://github.com/sct/overseerr/commit/de8ee9ba85e0160b0b472cab44f92c01796efec8))


### Features

* add migration for delete cascades on season requests/seasons ([c688cf6](https://github.com/sct/overseerr/commit/c688cf60c710f0cf0b2da5ba6b0c18a2d137e7f9))
* **api:** email notification agent ([0962392](https://github.com/sct/overseerr/commit/0962392e3930c7fdcb3164b9143cc8faca38bdfa))
* **frontend:** add french language file ([cd6d8a8](https://github.com/sct/overseerr/commit/cd6d8a8216e7ae183b046d26cd22f3c1dc1d2b35))
* **frontend:** add translatable strings for request card ([0d2f360](https://github.com/sct/overseerr/commit/0d2f360c22cd9bb50ae04f00a25e5fcc6c21bcdd))
* **frontend:** added more localized strings ([659a601](https://github.com/sct/overseerr/commit/659a6018777718f7a90141307678d8dadcfd77f8))
* actually include email templates in built server files ([a28a8b3](https://github.com/sct/overseerr/commit/a28a8b37b0afc79583e4a7191a91f73ff6d3adad))
* add application url config to main settings ui ([a359672](https://github.com/sct/overseerr/commit/a359672ebafffef742858814f0faa918e0341aa3))
* add filtering for requests api ([cb9ae25](https://github.com/sct/overseerr/commit/cb9ae25d94f21e97113dfea3ca45c7002089e344))
* add trending to discover page ([ff8b9d8](https://github.com/sct/overseerr/commit/ff8b9d8e7ed228a153c2da4d237f7a4f99a79321))
* force setup if app is not initialized ([a99705f](https://github.com/sct/overseerr/commit/a99705f6a5674b436ae28cbc558f4ee6e99ac910))
* initial user list (no edit/delete yet) and job schedules ([24a0423](https://github.com/sct/overseerr/commit/24a0423f3b14303cfb0e83aef6e9e3bb273c5ba9))
* manage series slideover added (and approve/decline/delete hooked up) ([236c4e5](https://github.com/sct/overseerr/commit/236c4e5e6126d2424a4badc08b7f7e6d1d70f401))
* media delete option in manage media slideover ([250f484](https://github.com/sct/overseerr/commit/250f48492c95d74e40d95d3f026d2952157bc6e1))
* other email notifications for approved/available ([0d73d88](https://github.com/sct/overseerr/commit/0d73d88f35b03e993f305873dc72672003c7d9e5))
* radarr edit/create modal/backend functionality ([c4ac357](https://github.com/sct/overseerr/commit/c4ac357ef4cdd7a2c610260db46a4f0c325cd785))
* season creation migration ([978f92a](https://github.com/sct/overseerr/commit/978f92a1c589ac404a3cb1103a68a8a5ffb0dd7d))
* sonarr edit/delete modal ([3204326](https://github.com/sct/overseerr/commit/320432657e6ccf4d255238098e03590f28267bdb))
* throw 404 when movie/tv show doesnt exist ([0601b44](https://github.com/sct/overseerr/commit/0601b446873e2eaf042044dd6a995b713586b0cc))
* **api:** sonarr api wrapper / send to sonarr ([9385592](https://github.com/sct/overseerr/commit/9385592362eeba1dba05c5aa8fc7a2de1d054d74))
* **frontend:** add header styling to movie/tv recommendation and similar list views ([f5f2545](https://github.com/sct/overseerr/commit/f5f2545520a43daa23e1276d24ff60d794ebbc6e))
* **frontend:** add links to detail pages from new request card ([6ad3384](https://github.com/sct/overseerr/commit/6ad3384a78f7bcb03f409cce8b35cc61d634d6b2))
* **frontend:** new design for request card ([93738e1](https://github.com/sct/overseerr/commit/93738e154c41fd11d5c6cf3d35573daf54ead471))
* **frontend:** update favicon ([886389a](https://github.com/sct/overseerr/commit/886389a361da54c616da3bdfeee9a85e9d12bcf3))
* notification framework ([d8e542e](https://github.com/sct/overseerr/commit/d8e542e5fe2ed76dcb20fb6dfc5f59430cd4245d))
* notifications for media_available and media_approved ([a6c5e65](https://github.com/sct/overseerr/commit/a6c5e65bbfc196545471e99fe2e5b7194f9dd387))
* rotten tomatoes scores on movie/tv details pages ([1694f60](https://github.com/sct/overseerr/commit/1694f60e8aa475ceeb7f170a783ec0ba70bd4bce))
* upcoming movies on discover ([67290dd](https://github.com/sct/overseerr/commit/67290dd502571a22dcf8559ac07f42e855275bd0))
* upcoming/trending list views and larger title cards ([94eaaf9](https://github.com/sct/overseerr/commit/94eaaf96b4302a832c52ccb72009b3593452c779))
* upgrade tailwindcss to 2.0.1 ([fb5c791](https://github.com/sct/overseerr/commit/fb5c791b0b6b7593a472bf01713999a001f92dc7))
* user edit functionality (managing permissions) ([185ac26](https://github.com/sct/overseerr/commit/185ac2648fd21c4bf9692ac5ac055e9c740065ca))
* **api:** plex tv sync and recently added sync ([1390cc1](https://github.com/sct/overseerr/commit/1390cc1f130bb3975996e84b12ac833f55f2f753))
* **frontend:** allow permission check for showing nav items ([0b239f0](https://github.com/sct/overseerr/commit/0b239f0bdfb1394897bce5c50b0d112abfbb4ad7))
* **frontend:** alpha notice ([33da7e9](https://github.com/sct/overseerr/commit/33da7e9df3a2546b0f208bd3b1d1f268e343cead))
* **frontend:** buttonWithDropdown component added (no hookups yet) ([4975841](https://github.com/sct/overseerr/commit/4975841b5d4ba4ed1ba8cacaa5a063eeb3b8c311))
* **frontend:** cancel movie request modal ([1f9cbbf](https://github.com/sct/overseerr/commit/1f9cbbfdf1ac98e54de5b8777c52c7bfc69c7e20))
* **frontend:** improved settings menu design for mobile ([16221a4](https://github.com/sct/overseerr/commit/16221a46a7d57c77f53aa0186263aa27267d9863))
* **frontend:** initial Settings design ([8742da0](https://github.com/sct/overseerr/commit/8742da0ebb92d2f78309a998de0f67e788e14376))
* **frontend:** plex library scan ([1bc3f7b](https://github.com/sct/overseerr/commit/1bc3f7be4b07211563a1e254c28ce51e1bc337a2))
* **frontend:** plex settings page ([47714b6](https://github.com/sct/overseerr/commit/47714b698cf4351c1ee38bdf0b672d9f0baed03a))
* **frontend:** radarr delete modal ([877a518](https://github.com/sct/overseerr/commit/877a5184158fb4aa371fa2ea2107032543c9aa37))
* **frontend:** recently added on discover ([06dc606](https://github.com/sct/overseerr/commit/06dc606bcfeb50b7be1c35ac180c10738bade458))
* **frontend:** slideover initial work ([14b9cb6](https://github.com/sct/overseerr/commit/14b9cb610c0dcfef939ebec328f371e1cdfb689d))
* tv request modal status hookup ([5f8114f](https://github.com/sct/overseerr/commit/5f8114f730b067eb710704952824057e7b5b8fbf))
* **.editorconfig:** add .editorconfig ([b982066](https://github.com/sct/overseerr/commit/b982066327525156f8dd0d32818d3fe7cb28f9c8))
* **api:** add external ids to movie/tv response ([4aa7431](https://github.com/sct/overseerr/commit/4aa74319e0adcc19041239e57a00bc40fb127826))
* **api:** add movie details endpoint ([b176148](https://github.com/sct/overseerr/commit/b1761484cb2861329763d51a868f37dd3098760d))
* **api:** add tmdb discover api wrapper ([#67](https://github.com/sct/overseerr/issues/67)) ([839448f](https://github.com/sct/overseerr/commit/839448fcc8cc14ea83092af82e2ba3d0d92c9b73))
* **api:** allow plex logins from users who have access to the server ([5147140](https://github.com/sct/overseerr/commit/514714071dfe4be04e607fe6412f5b3f0ef74dd4))
* **api:** decouple media requests from media info ([8577db1](https://github.com/sct/overseerr/commit/8577db1be16f099d92c6649bbfb15f15e09a2f73))
* **api:** discover endpoint for movie/tv ([#73](https://github.com/sct/overseerr/issues/73)) ([258bb93](https://github.com/sct/overseerr/commit/258bb93be2acc2ca32eaaefb617a5c326c5943ba))
* **api:** initial implementation of the auth system ([#30](https://github.com/sct/overseerr/issues/30)) ([5343f35](https://github.com/sct/overseerr/commit/5343f35e5b572fe366a8712b24bd735de30e6170))
* **api:** plex Sync (Movies) ([1be8b18](https://github.com/sct/overseerr/commit/1be8b183617c3a44ab8d4454a64b43dfe1d877fe))
* **api:** public settings route ([#57](https://github.com/sct/overseerr/issues/57)) ([c0166e7](https://github.com/sct/overseerr/commit/c0166e7ecb5df110a4167f33338ed6406bf47f41))
* **api:** radarr api wrapper / send to radarr when requests approved ([#93](https://github.com/sct/overseerr/issues/93)) ([48d62c3](https://github.com/sct/overseerr/commit/48d62c3178488d0d51831155ddd35cc31867db2b))
* **api:** request api ([#80](https://github.com/sct/overseerr/issues/80)) ([f4c2c47](https://github.com/sct/overseerr/commit/f4c2c47e569e7faea7f99664966cb98b321ce952))
* **api:** tmdb api wrapper / multi search route ([#62](https://github.com/sct/overseerr/issues/62)) ([c702c17](https://github.com/sct/overseerr/commit/c702c17cee00a52b23f685206e2d5d0c2eddf5a2))
* **api:** tmdb trending api wrapper ([#68](https://github.com/sct/overseerr/issues/68)) ([ba34e54](https://github.com/sct/overseerr/commit/ba34e54d77d142d211df58d6ce9f53b6e673e004))
* **api:** tv details endpoint ([a3beeed](https://github.com/sct/overseerr/commit/a3beeede7e72e99c7595673a27e38611ca4bb0cd))
* **api:** validate plex when settings are saved ([8f6247d](https://github.com/sct/overseerr/commit/8f6247d82160704a3cfb76262696957b27641e87))
* **api-user:** add basic User Entity and basic routing to fetch all users ([d902ef7](https://github.com/sct/overseerr/commit/d902ef72770712f2f71f33c09bca9ba99a30fc64))
* **components/plexloginbutton:** added PlexLoginButton ([0abf743](https://github.com/sct/overseerr/commit/0abf743b17c664b58da18bdbf176f4a55ddc4179))
* **extensions.json:** added recommended extensions for VSCode ([5dc9b51](https://github.com/sct/overseerr/commit/5dc9b510b8049516ad889c9d76a2f84daa0d2718))
* **frontend:** add cancel request modal for titlecards ([f22f8c5](https://github.com/sct/overseerr/commit/f22f8c5d734be5cc0b1dcca869458a7321cd43a2))
* **frontend:** approve/decline request well added to movie detail ([8f21358](https://github.com/sct/overseerr/commit/8f21358f797ed55923d90ba43acf1126856e9dfd))
* **frontend:** basic discover page (only movies) ([#74](https://github.com/sct/overseerr/issues/74)) ([bbfe349](https://github.com/sct/overseerr/commit/bbfe349b52d308620796b37aaf986a0ed1ff0006))
* **frontend:** design updates for responsive titlecards ([31809d9](https://github.com/sct/overseerr/commit/31809d952c8bafde3f63e2c1d952cc013149940e))
* **frontend:** discover tv/movies full page ([be0003a](https://github.com/sct/overseerr/commit/be0003a85dc4e91799e85019aeb1110bd524a026))
* **frontend:** initial search functionality ([#78](https://github.com/sct/overseerr/issues/78)) ([342d1a3](https://github.com/sct/overseerr/commit/342d1a3c75b32b172a51ca7d82fdfde8510abedf))
* **frontend:** loading spinner ([de84658](https://github.com/sct/overseerr/commit/de84658b48985e24b0f92a1690387f6d59d0bc16))
* **frontend:** logo updates ([5a43ec5](https://github.com/sct/overseerr/commit/5a43ec5405855deb244e8085484a9d2b743caba6))
* **frontend:** modal component and basic request hookup ([#91](https://github.com/sct/overseerr/issues/91)) ([626099a](https://github.com/sct/overseerr/commit/626099a2c98fb30d0cb53d8ccf79a6bf75a00059))
* **frontend:** new dashboard concept ([#82](https://github.com/sct/overseerr/issues/82)) ([eae38bb](https://github.com/sct/overseerr/commit/eae38bb9ec8588856f319387d2f262d7ee3f7e9c))
* **frontend:** refresh indicator for titlecards / toasts ([4638fae](https://github.com/sct/overseerr/commit/4638fae336edc62a539796b3f55277a238683603))
* **frontend:** request card / recent requests ([371e433](https://github.com/sct/overseerr/commit/371e43356d2c057e52368c32ffe2af1744311d91))
* **frontend:** title detail (movie) initial version ([73ce24a](https://github.com/sct/overseerr/commit/73ce24a37bda3713e8cedc44e1ed065bdbc4ee4f))
* **frontend/api:** beginning of new request modal ([2bf7e10](https://github.com/sct/overseerr/commit/2bf7e10e32718b36799be2feb0a7f9ff54d85744))
* **frontend/api:** cast included with movie request and cast list on detail page ([04252f8](https://github.com/sct/overseerr/commit/04252f88bbdf51949923586feda582f86ac668ce))
* **frontend/api:** i18n support ([9131254](https://github.com/sct/overseerr/commit/9131254f3371f12a17de44b6fa8f9bfb0e5c002e))
* **frontend/api:** movie recommendations/similar request and frontend detail page update ([6398e36](https://github.com/sct/overseerr/commit/6398e3645a1e4ddbb9de9f4fda0a0659b4cac4d0))
* **frontend/api:** tv details page ([02cbb5b](https://github.com/sct/overseerr/commit/02cbb5b030a3af5d62ab6c4cafdd4d800b4f61f4))
* **frontend/api:** tv request modal (no status. only request) ([608b966](https://github.com/sct/overseerr/commit/608b96600a926adf16331b36e77789afa5d67069))
* logout route/sign out button ([#54](https://github.com/sct/overseerr/issues/54)) ([cb9098f](https://github.com/sct/overseerr/commit/cb9098f457f79b71734959fd924b6c72ca77d61d))
* user avatars from plex ([#53](https://github.com/sct/overseerr/issues/53)) ([e6349c1](https://github.com/sct/overseerr/commit/e6349c13a0eb0489289aa7663fcc64fa7d2906e6))
* **layout:** created Layout component ([1f497e8](https://github.com/sct/overseerr/commit/1f497e8913146ceb9748d667e638141b2ca4612a))
* **login component/route:** add: Login Component and Route ([6e47be2](https://github.com/sct/overseerr/commit/6e47be2fa865bcd51582ce30ebee6fd820c5f9dd))
* **login route conditional:** on login route, do not display layout ([7d179ae](https://github.com/sct/overseerr/commit/7d179ae3b42d8ffae5e1b6e266038793260f1bbe))
* **pass pageprops to loginpage:** pass page props to loginPage ([1597188](https://github.com/sct/overseerr/commit/159718891fb363001c650ac8b7e1446a1520ce4a))
* **plex/utils:** added Plex OAuth class ([72f9624](https://github.com/sct/overseerr/commit/72f9624f1db721fe0324b7be9f0f811d2ae02389))
* bootstrap the basic app structure ([89a6017](https://github.com/sct/overseerr/commit/89a6017c7f6f7637fe249ac0d667a652f44e02bb))
