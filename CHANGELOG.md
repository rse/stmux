
CHANGELOG
=========

2.1.1 (unreleased)
------------------

- BUGFIX [code]: escape Blessed tag meta-characters in terminal titles to no longer crash on commands containing curly braces (issue #26)

2.1.0 (2026-07-19)
------------------

- FEATURE [code]: add "CTRL+a e" for toggling the expand mode of the focused terminal
- FEATURE [code, infr]: add Unix manual page stmux(1), linted and rendered via markdownlint and remark
- FEATURE [code, docs]: add option -U/--full-unicode for optionally enabling full Unicode rendering
- IMPROVEMENT [code]: render terminal titles in inverse video with angle caps and focus indicator
- IMPROVEMENT [code]: switch the regular highlighting color of titles and borders from green to blue
- IMPROVEMENT [othr]: align the README usage documentation with the current command-line interface
- UPDATE [infr]: upgrade NPM dependencies
- CLEANUP [infr]: vertically align fields in package.json

2.0.0 (2026-07-19)
------------------

- FEATURE [code]: support fractional sizes in terminal size specifications
- IMPROVEMENT [code]: catch errors on JSON, RegExp, file reading and parsing
- IMPROVEMENT [code]: improve error handling and destroy screen on fatal errors
- IMPROVEMENT [code]: be more robust in terminal termination handling
- IMPROVEMENT [code]: make auto-restart handling of terminated commands more robust
- IMPROVEMENT [code]: validate the activator key and use strict option value choices
- IMPROVEMENT [code]: improve typing of border sides, options and sizes, avoid "any"
- IMPROVEMENT [code]: ensure that the mixins are actually applied
- IMPROVEMENT [code]: add radix to parseInt calls to be strict
- IMPROVEMENT [code]: improve performance in error highlighting, parsing and options
- IMPROVEMENT [code]: perform a small wait before repeating a terminated command
- IMPROVEMENT [code]: do not hard-code the length of the help text
- BUGFIX [code]: divide only the remaining size among implicitly sized terminals
- BUGFIX [code]: adjust only the focus border on error state changes
- BUGFIX [code]: avoid infinite spin when shrinking terminals to fit
- BUGFIX [code]: reject invalid terminal size specifications
- BUGFIX [code]: match boolean options only on word boundaries when parsing
- BUGFIX [code]: ensure the terminal size is not checked too early
- BUGFIX [code]: detect invalid split directions in the AST
- BUGFIX [code]: do not allow an empty command in the specification
- BUGFIX [code]: do not convert an already converted delay value
- BUGFIX [code]: treat the terminal wait delay as seconds, not milliseconds
- BUGFIX [code]: use correct fallback operator for terminal title
- BUGFIX [code]: perform program termination only once and fix its book keeping
- BUGFIX [code]: fix off-by-one error in the border calculation
- BUGFIX [code]: honor signals from winpty and detect winpty failures
- BUGFIX [code]: treat only pre-10 Windows versions as legacy consoles
- BUGFIX [code]: correctly read UTF-8 encoded input from stdin
- BUGFIX [code]: write version information to stdout instead of stderr
- BUGFIX [code]: keep the help window visible after unzooming a terminal
- BUGFIX [code]: reset scroll state when switching terminals with focus keys
- BUGFIX [code]: unescape single quotes within double-quoted strings
- BUGFIX [code]: correctly quote arguments when converting them to a specification
- BUGFIX [code]: fix the usage string of the command-line interface
- BUGFIX [code]: avoid negative values and division by zero in size calculations
- BUGFIX [code]: do not swallow the next exit event when manually restarting an already exited command
- BUGFIX [code]: do not get stuck in scrolling mode when wheel-scrolling an empty scrollback
- BUGFIX [code]: correctly clear and swap the error notification states of terminals
- BUGFIX [othr]: fix spelling and grammar issues in the README document
- UPDATE [infr]: use ES2024 as the TypeScript target and library
- UPDATE [code]: use HTTPS URLs in the help text
- CLEANUP [code]: simplify code, remove redundancies and dead code in all modules
- CLEANUP [code]: use RegExp test instead of String match when not capturing
- CLEANUP [code]: use setFront instead of magic setIndex values for the help window
- CLEANUP [code]: move terminal initialization into a dedicated function
- CLEANUP [code]: factor out the Windows 10 check
- CLEANUP [code]: generate version output with template literals
- CLEANUP [code]: improve naming, comments and identifier camel-casing
- CLEANUP [code, othr]: fix spelling and update year in copyright messages
- REFACTOR [code, docs, infr, othr]: migrate from Grunt to @rse/stx
- REFACTOR [code, docs, infr, othr]: migrate from JavaScript to TypeScript

1.8.11 (2025-05-18)
-------------------

- UPDATE [infr]: upgrade dependencies

1.8.10 (2024-09-15)
-------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [infr]: align fields in package.json

1.8.9 (2024-06-07)
------------------

- BUGFIX [infr]: make NPM happy again

1.8.8 (2024-06-07)
------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [code, othr]: update year in all copyright messages

1.8.7 (2023-04-25)
------------------

- UPDATE [infr]: upgrade dependencies

1.8.6 (2023-04-25)
------------------

- IMPROVEMENT [code]: terminate the program more cleanly
- UPDATE [infr]: upgrade dependencies
- CLEANUP [code, othr]: update year in all copyright messages
- CLEANUP [code]: fix code style

1.8.5 (2022-12-22)
------------------

- UPDATE [infr]: upgrade dependencies

1.8.4 (2022-05-25)
------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [infr]: reduce the ESLint configuration and make ESLint happy again
- CLEANUP [othr]: remove manual node-gyp installation hint from the README document

1.8.3 (2021-11-06)
------------------

- IMPROVEMENT [code]: try to gracefully kill child processes on CTRL+a k
- IMPROVEMENT [othr]: be more explicit that the activator key is a prefix
- BUGFIX [code]: fix encoding on reading the specification from stdin
- BUGFIX [code]: ensure the zoomed terminal is always in front of the others
- UPDATE [infr]: upgrade dependencies
- CLEANUP [code]: fix copyright message

1.8.2 (2021-11-04)
------------------

- BUGFIX [othr]: add missing commas in the README document
- BUGFIX [infr]: fix Gruntfile
- UPDATE [infr]: upgrade dependencies

1.8.1 (2021-01-09)
------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [code, othr]: update year in all copyright messages

1.8.0 (2019-12-22)
------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [code]: make ESLint happy again

1.7.1 (2019-06-16)
------------------

- UPDATE [infr]: upgrade dependencies

1.7.0 (2019-06-15)
------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [code, othr]: update year in all copyright messages

1.6.1 (2018-12-23)
------------------

- UPDATE [infr]: upgrade dependencies

1.6.0 (2018-12-22)
------------------

- IMPROVEMENT [othr]: add WSL instructions and reword the install section of the README document
- BUGFIX [code]: fix internal view of the current focused terminal
- UPDATE [infr]: upgrade dependencies and move to the newer Babel toolchain
- CLEANUP [othr]: cleanup documentation

1.5.5 (2018-06-24)
------------------

- UPDATE [infr]: upgrade dependencies

1.5.4 (2018-05-11)
------------------

- UPDATE [infr]: upgrade dependencies

1.5.3 (2018-05-11)
------------------

- UPDATE [infr]: upgrade dependencies

1.5.2 (2018-05-11)
------------------

- UPDATE [infr]: upgrade dependencies

1.5.1 (2018-05-05)
------------------

- CLEANUP [code, othr]: update year in all copyright messages

1.5.0 (2018-05-05)
------------------

- UPDATE [infr]: change the build requirements

1.4.20 (2018-05-05)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.19 (2017-12-03)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.18 (2017-07-27)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.17 (2017-07-12)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.16 (2017-07-12)
-------------------

- BUGFIX [infr]: make NPM 5 happy again

1.4.15 (2017-07-12)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.14 (2017-07-08)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.13 (2017-06-24)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.12 (2017-06-15)
-------------------

- UPDATE [infr]: upgrade dependencies
- CLEANUP [code]: make the linter happy again

1.4.11 (2017-06-04)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.10 (2017-05-25)
-------------------

- UPDATE [infr]: upgrade dependencies

1.4.9 (2017-05-21)
------------------

- UPDATE [infr]: upgrade dependencies

1.4.8 (2017-05-07)
------------------

- UPDATE [infr]: upgrade dependencies

1.4.7 (2017-05-07)
------------------

- UPDATE [infr]: upgrade dependencies

1.4.6 (2017-05-01)
------------------

- IMPROVEMENT [infr]: switch to a dedicated build task

1.4.5 (2017-05-01)
------------------

- BUGFIX [infr]: circumvent the NPM 4/5 prepublish script problem

1.4.4 (2017-04-30)
------------------

- BUGFIX [othr]: fix URLs in the README document

1.4.3 (2017-04-30)
------------------

- IMPROVEMENT [code]: force cursor hiding
- BUGFIX [code]: fix manual screen redrawing functionality
- BUGFIX [othr]: document that the -s usage needs "--" to not break

1.4.2 (2017-04-29)
------------------

- CLEANUP [code]: add numbers to source files for better sorting

1.4.1 (2017-04-29)
------------------

- FEATURE [code]: provide optional mouse event handling
- UPDATE [infr]: upgrade dependencies
- CLEANUP [infr]: do not use mouse by default in the test case

1.4.0 (2017-04-22)
------------------

- IMPROVEMENT [code]: do not auto-close for manually restarted commands
- CLEANUP [code]: consistently use the fatal() method
- CLEANUP [code]: use "terminal" instead of "layout" as the name
- CLEANUP [code]: do not duplicate the version information
- CLEANUP [infr]: move eslint.yaml out of sight
- REFACTOR [code]: major source code refactoring for better maintainability

1.3.2 (2017-04-21)
------------------

- CLEANUP [othr]: move screenshots into the etc directory

1.3.1 (2017-04-21)
------------------

- IMPROVEMENT [othr]: improve documentation and provide two new screenshots
- CLEANUP [code]: cleanup source code

1.3.0 (2017-04-21)
------------------

- FEATURE [code]: add support for beep and system notification methods on errors

1.2.1 (2017-04-21)
------------------

- FEATURE [code]: allow switching to the previous terminal with BACKSPACE

1.2.0 (2017-04-21)
------------------

- FEATURE [code]: support regexp negation for error detection
- FEATURE [code]: allow directional terminal switching with full cursor keys
- BUGFIX [code]: fix regexp matching and switch line matching to single lines
- CLEANUP [code]: wrap long lines

1.1.4 (2017-04-19)
------------------

- IMPROVEMENT [othr]: improve documentation

1.1.3 (2017-04-19)
------------------

- BUGFIX [code]: fix the --focus option

1.1.2 (2017-04-19)
------------------

- IMPROVEMENT [code]: wait a little bit on auto-termination to allow reading the screen output

1.1.1 (2017-04-19)
------------------

- IMPROVEMENT [code]: allow waiting only in case an error occurred
- BUGFIX [code]: fix typo

1.1.0 (2017-04-19)
------------------

- FEATURE [code]: allow manual restarting of the shell command in the focused terminal

1.0.10 (2017-04-19)
-------------------

- BUGFIX [code]: fix window resizing
- BUGFIX [code]: force line cursor on ancient Windows versions

1.0.9 (2017-04-19)
------------------

- UPDATE [infr]: upgrade dependencies

1.0.8 (2017-04-19)
------------------

- FEATURE [code]: support setting the cursor type
- BUGFIX [code]: apply a hack to get stmux working under ancient Windows versions
- BUGFIX [code]: add missing newlines in output
- UPDATE [infr]: upgrade dependencies

1.0.7 (2017-04-19)
------------------

- BUGFIX [code]: adjust the point in time of the terminal fixups in processing

1.0.6 (2017-04-19)
------------------

- BUGFIX [code]: move terminal fixups to the front of the processing

1.0.5 (2017-04-19)
------------------

- BUGFIX [code]: add workarounds for the ConEmu and MinTTY terminals under Windows
- BUGFIX [code]: use switch /d also for cmd.exe as Node does internally
- UPDATE [infr]: add dependency
- CLEANUP [code]: make the linter happy

1.0.4 (2017-04-19)
------------------

- BUGFIX [code]: ignore the SHELL environment variable entirely

1.0.3 (2017-04-19)
------------------

- UPDATE [infr]: upgrade dependencies

1.0.2 (2017-04-19)
------------------

- FEATURE [code]: try to support Windows

1.0.1 (2017-04-17)
------------------

- UPDATE [infr]: upgrade dependencies

1.0.0 (2017-04-17)
------------------

- UPDATE [infr]: upgrade dependencies

0.9.x (2017-04-XX)
------------------

(see Git history)

