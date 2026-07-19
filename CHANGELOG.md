
CHANGELOG
=========

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
- BUGFIX [code]: quote backslashes when converting arguments to a specification
- BUGFIX [code]: fix the usage string of the command-line interface
- BUGFIX [code]: avoid negative values and division by zero in size calculations
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

1.8.11 (2025-05-28)
-------------------

(see Git history)

1.x.x (2015-XX-XX)
------------------

(see Git history)

