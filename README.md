# TetraChan #
A multiplatform and multilanguage dictionary lookup program. Popup dictionaries for the web browser, discord bot, etc.

You can see this in action

This readme will mostly be to keep track of things.

# Current Status #
Branches
* Discord bot (node app)
    * Jisho
    * CC-CEDICT
    * Oxford English Dictionary
    * Goo, currently WIP
        * Have yet to figure out how I want to go about parsing an HTML document (JSDom perhaps)
* Plugin (WebExtensions)
    * Had, Popup, Options, Templating sort of half implemented and working but then started on making a build environment and discord bot
    * Haven't yet refactored code to work with webpack build environment
    * Problems with local dictionaries
        * Storage limits for browser extensions. Then questionable if we can maintain of persistence between sessions.
        * May want to load into memory, etc.
        * HTML5's FileReader API, SQLite, IndexedDB
        * Interfacing with pre-installed Rikaichan dictionaries (which are just JMDict). May have issue with WebExtensions vs XUL incompatibility.
    * Also can't use OED's API, may want to parse HTML instead. Or use Longman.
* Plugin-alternative Website Hosted (Good for demos)
    * ./test/httpsserver.js is the stripped down of a the node fetcher that was intended my attempts at understanding how this works
* Plugin-alternative Website
    * Going to use express for the general case since bandwidth load is on user. I believe Express handles all the redirection etc.
* Mobile App
    * Not started
    * May want to consider [Progressive Web App](https://en.wikipedia.org/wiki/Progressive_web_app) approach


# Important To Do Items and Research #
* Bot hosting
* Handle all the requests that this meta project will produce with same node application
* Support for CC-CANTO
* Support for classical Weiblo
* Support for classical Ctext
* Support for Stardict format
* Sanseido search from Rikaisama?
* Support for EPWING
    * Huge massive headache, but would really like to have support for Dajirin, etc.
    * Almost all solutions based on 
    * Zero-epwing by foosoft lists out all the problems with this format and necessary research into the format

# Lexicon Structure #
See ./src/core/lexicon.js for the structure inside the code.

This localized API/interface for this project for how the words are stored. Used to santize the output of the many dictionaries into a standard format. Will be using the semicolon ';' as the separator for entries that are still a single entry, see the example.

At the moment there is are three sublevels to the lexicon
1. Lexicon (Dictionary)
    * A query for a dictionary would return a lexicon
2. Lexeme (may change to 'Headword' as Oxford uses it)
    * Same words but written differently
    * character varients
    * eg. 見る/観る would listed a single lexeme
3. Classes (Part of Speech)
4. Senses (Definition)

An example: [source](http://jisho.org/search/%E3%81%82%E3%81%A8)
* \[Lexicon Level\] Only single object created per request
* Query Jisho.org for あと
    * \[Lexeme level\] stores reading, ipa, alternative readings, etc. at this level
    * 後
        * \[Class level\]
        * Noun; No-adjective
            * \[Sense level\] Also can exclude a list of examples per definition
            * 1.behind; rear
            * 2.after; later
            * 3.after one's death
            * 4.reaminder; the rest
            * 5.descedant; successor; heir
        * Adverbial noun
            * 1.descendant; successor; heir
            * 2.also; in addition
        * Noun; No-adjective
            * 1.past; previous
    * 跡, examples of alternative forms are 迹、痕、址. Currently calling these allographes.
    * ...


## Conceptual notes ##
This varies on two major points from how Oxford structures how words are handled.
* Under 'Headwords' (Lexeme level as I have it) there are is an additional level of called 'entries' in its API. Haven't yet found a word that has several entries. So I just assume they all fall under the same headword (ie. more part of speech entries per headword)
* Under senses, there are sub-senses. Not really sure why these are significant but I just add all sub-senses as a sense themselves. May want to add them as a single sense separated by semicolons.


May also want implement a switch to alternate between accounts to get around free limitation (or not cause that's not very nice).

# Links that will be useful later on #
https://www.reddit.com/r/discordapp/comments/4zy6o4/what_udptcp_ports_do_i_need_to_open_for_discord/