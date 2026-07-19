
# stmux(1) -- Simple Terminal Multiplexing for Node Environments

## SYNOPSIS

`stmux`
\[`-h`|`--help`\]
\[`-v`|`--version`\]
\[`-w`|`--wait` *when*\]
\[`-a`|`--activator` *activator*\]
\[`-t`|`--title` *title*\]
\[`-c`|`--cursor` *cursor*\]
\[`-n`|`--number`\]
\[`-e`|`--error` *regexp*\[`,`...\]\]
\[`-m`|`--method` *methods*\]
\[`-M`|`--mouse`\]
\[`-f`|`--file` *file*\]
\[`--` *spec*\]

## DESCRIPTION

**stmux** is a simple terminal multiplexing utility for Node.js
environments. It is inspired by the awesome and unreachable `tmux`(1)
native Unix utility. The **stmux** utility is intended to provide just a
very tiny subset of the original `tmux`(1) functionality, but in a
portable way for bare Node.js environments and with some special
features for application build environments. Most notably, **stmux**
has a build-time error detection and notification feature, can
automatically restart terminated commands, and can automatically close
or wait after all spawned commands have successfully or unsuccessfully
terminated.

This utility is primarily intended to be used from within a
`package.json` `script` to easily side-by-side run various NPM-based
commands in a Node.js build-time environment.

## OPTIONS

The following command-line options and arguments exist to the `stmux`(1) command:

- \[`-h`|`--help`\]:
  Show program usage information only.

- \[`-v`|`--version`\]:
  Show program version information only.

- \[`-w`|`--wait` *when*\]:
  Wait after last finished command (and do not shut down automatically),
  either if any command terminated with an `error` or just `always`.

- \[`-a`|`--activator` *activator*\]:
  Use `CTRL`+*activator* as the prefix to special commands.
  The activator has to be a single lowercase letter.
  The default activator character is `a`. For instance, for the
  default activator case, opening the help window requires you to
  press `CTRL+a` (and release it again) and then (separately) press `?`.

- \[`-t`|`--title` *title*\]:
  Set title on terminal. The default title is `stmux`.

- \[`-c`|`--cursor` *cursor*\]:
  Set type of cursor to `block` (default), `underline` or `line`.

- \[`-n`|`--number`\]:
  Show terminal number (and a focus indicator) in terminal title.

- \[`-e`|`--error` *regexp*\[`,`...\]\]:
  Observe terminal lines for errors (global option).
  One or more regular expressions can be specified and have to match on
  a single line. If a regular expression is preceded with the prefix
  `!`, it is required that it does not match.
  The default is `(?:ERROR|Error|error)`.

- \[`-m`|`--method` *methods*\]:
  In case of detected errors, use the comma-separated
  list of methods to perform user notification. The default
  is no extra notification (just the terminal annotation).
  Possible methods are `beep` and `system`.

- \[`-M`|`--mouse`\]:
  Enable mouse event handling. This enables the focus switching
  by left mouse click, the scrolling with mouse wheel and
  sends down mouse events to the terminal as mouse key sequences.

- \[`-f`|`--file` *file*\]:
  Read specification *spec* from a configuration file. The
  default is to use the specification inside the command line arguments
  or (alternatively) to read the specification from `stdin`.

- \[`--` *spec*\]:
  The specification of the terminal multiplexing layout
  and the shell commands to spawn. See **SPECIFICATION** below.

## SPECIFICATION

The following PEG-style grammar loosely describes the specification
*spec*. For exact details see the real PEG grammar of **stmux** in its
source file `stmux-2-parser.pegjs`.

```txt
spec      ::= "[" directive (":"  directive)* "]"  /* vertical   split */
            | "[" directive (".." directive)* "]"  /* horizontal split */

directive ::= option* spec                         /* RECURSION */
            | option* string                       /* shell command */

option    ::= ("-f" | "--focus")                   /* focus terminal initially */
            | ("-r" | "--restart")                 /* restart command automatically */
            | ("-d" | "--delay") number            /* delay <number> seconds on restart */
            | ("-t" | "--title") string            /* set title of terminal */
            | ("-s" | "--size") size               /* request a size on terminal */
            | ("-e" | "--error") regexp            /* observe terminal for errors (local option) */

size      ::= /^\d+$/                              /* fixed character size */
            | /^\d+\.\d+$/                         /* total size factor */
            | /^\d+\/\d+$/                         /* total size fraction */
            | /^\d+%$/                             /* total size percentage */
```

## KEYSTROKES

The following keystrokes are supported under run-time:

- `CTRL`+*activator* *activator*:
  Send the `CTRL`+*activator* key-sequence to the focused terminal.

- `CTRL`+*activator* `BACKSPACE`:
  Switch the focus to the previous terminal in sequence.

- `CTRL`+*activator* `SPACE`:
  Switch the focus to the next terminal in sequence.

- `CTRL`+*activator* `LEFT`/`RIGHT`/`UP`/`DOWN`:
  Switch the focus to the best matching terminal in a direction.

- `CTRL`+*activator* `1`/`2`/.../`9`:
  Directly switch to a particular terminal.

- `CTRL`+*activator* `n`:
  Toggle showing/hiding of terminal numbers.

- `CTRL`+*activator* `z`:
  Toggle the zooming of focused terminal. While a terminal
  is zoomed, the focus switching keys are disabled.

- `CTRL`+*activator* `e`:
  Toggle the expanding of focused terminal. While enabled, the focused
  terminal is expanded and all other terminals stay visible, but are
  shrunk to their minimum size.

- `CTRL`+*activator* `v`:
  Switch the focused terminal into visual/scrolling mode.
  Use `PAGEUP`/`PAGEDOWN` during this mode to scroll up/down.
  Any other key leaves this mode.

- `CTRL`+*activator* `l`:
  Relayout the screen.

- `CTRL`+*activator* `r`:
  Restart the program in the focused terminal.

- `CTRL`+*activator* `k`:
  Kill the application and all shell commands in all terminals.

- `CTRL`+*activator* `?`:
  Show help window.

## EXAMPLES

The following command leads to a terminal multiplexing environment,
where GNU bash, Vim and Midnight Commander are running side-by-side
inside their own XTerm emulating terminal widget:

```sh
$ stmux -- [ [ -s 1/3 bash .. vim ] : mc ]
```

The following specifications illustrate the resulting terminal
multiplexing layouts:

- `stmux [ A ]`:

    ```txt
    +-----------+
    |           |
    |     A     |
    |           |
    +-----------+
    ```

- `stmux [ A .. B ]`:

    ```txt
    +-----+-----+
    |     |     |
    |  A  |  B  |
    |     |     |
    +-----+-----+
    ```

- `stmux [ A : B ]`:

    ```txt
    +-----------+
    |     A     |
    +-----------+
    |     B     |
    +-----------+
    ```

- `stmux [ [ A .. B ] : C ]`:

    ```txt
    +-----+-----+
    |  A  |  B  |
    +-----+-----+
    |     C     |
    +-----------+
    ```

- `stmux [ [ A : B ] .. C ]`:

    ```txt
    +-----+-----+
    |  A  |     |
    +-----+  C  |
    |  B  |     |
    +-----+-----+
    ```

- `stmux [ [ A : B ] .. [ C : D ] ]`:

    ```txt
    +-----+-----+
    |  A  |  C  |
    +-----+-----+
    |  B  |  D  |
    +-----+-----+
    ```

- `stmux [ [ A .. B ] : [ C .. D ] ]`:

    ```txt
    +-----+-----+
    |  A  |  B  |
    +-----+-----+
    |  C  |  D  |
    +-----+-----+
    ```

- `stmux -- [ [ -s 1/3 A .. B ] : [ C .. -s 1/3 D ] ]`:

    ```txt
    +---+-------+
    | A |    B  |
    +---+---+---+
    |    C  | D |
    +-------+---+
    ```

The following sample `package.json` entries from a top-level NPM-based
project allow one on `npm run dev` to conveniently run the commands of
two sub-projects. First, the build-time of the frontend user interface
(UI) project. Second, the build-time of the backend server (SV)
project. Third, the run-time of the backend server project.

```js
{
    ...
    "dependencies": {
        "stmux":      "*"
    },
    "scripts": {
        ...
        "dev":        "stmux -w always -e ERROR -m beep,system -- [ [ \"npm run dev:ui\" .. \"npm run dev:sv\" ] : -s 1/3 -f \"npm start\" ]",
        "dev:ui":     "cd ui && npm run build:watch",
        "dev:sv":     "cd sv && npm run build:watch"
    }
}
```

## SEE ALSO

`tmux`(1), `node`(1), `npm`(1).

## HISTORY

`stmux`(1) was developed in April 2017 to support the convenient
side-by-side execution of long-running commands in Node.js application
build environments, without requiring a native terminal multiplexer
like `tmux`(1) or `screen`(1).

## AUTHOR

Dr. Ralf S. Engelschall <rse@engelschall.com>
