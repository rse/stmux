
stmux
=====

**Simple Terminal Multiplexing for Node Environments**

<p/>
<img src="https://nodei.co/npm/stmux.png?downloads=true&stars=true" alt=""/>

<p/>
<img src="https://david-dm.org/rse/stmux.png" alt=""/>

Abstract
--------

This is a simple terminal multiplexing utility for Node.js
environments. It is inspired by the awesome and unreachable
[tmux](https://tmux.github.io/) native Unix utility. It is intended
to provide a just very tiny subset of the original functionality,
but instead in a portable way for bare Node.js environments. It's
only nasty dependency is the essential native Node.js module
[node-pty](https://github.com/Tyriar/node-pty). As a consequence this
utility can be installed via just NPM and without any surrounding Unix
environments (like CygWin under Windows, etc).

Intention
---------

This utility is primarily intended to be used for within a
`package.json` `script` to side-by-side run various NPM scripts in a
Node.js build-time environment. For more sophisticated use-cases please
stick with [tmux](https://tmux.github.io/), of course.

A sample `package.json` entry would be:

```
{
    ...
    "devDependencies": {
        "stmux": "*"
    },
    "scripts": {
        "dev": "stmux -- [ [ 'cd ui && npm build:watch' .. 'cd sv && npm build:watch' ] : [ 'bash' .. 'cd sv && npm start' ] ]"
    }
}
```

Example
-------

The following command...

```
$ stmux -w -- [ [ bash .. vi ] : mc ]
```

...leads to the following result:

![stmux usage](screenshot.png)

Installation
------------

```
$ npm install -g stmux
```

Usage
-----

The following command line arguments are supported:

```
$ stmux [-h] [-V] [-w] [-a <activator>] [-t <title>] [-f <file>] [-- <spec>]
```

- `-h`, `--help`<br/>
  Show usage help.
- `-V`, `--version`<br/>
  Show program version information.
- `-w`, `--wait`<br/>
  Wait after last finished command and do not shutdown automatically.
- `-a <activator>`, `--activator <activator>`<br/>
  Use `CTRL+<activator>` as the prefix to special commands.
  The default activator character is `a`.
- `-t <title>`, `--title <title>`<br/>
  Set title on terminal. The default title is `stmux`.
- `-f <file>`, `--file <file>`<br/>
  Read specification from configuration file. The
  default is to use the specification in the command line arguments.

The following grammar describes the specification:

```
spec      ::= "[" directive (":"  directive)* "]"  /* vertical   split */
            | "[" directive (".." directive)* "]"  /* horizontal split */

directive ::= spec                                 /* RECURSION */
            | option* string                       /* shell command */

option    ::= ("-f" | "--focus")                   /* focus terminal initially */
            | ("-r" | "--restart")                 /* restart command automatically */
            | ("-d" | "--delay") number            /* delay <number> seconds on restart */
            | ("-t" | "--title") string            /* set title of terminal */
```

The following run-time keystrokes are supported:

- `CTRL`+*activator* *activator*:<br/>
  Send the `CTRL`+*activator* key-sequence to terminal.
- `CTRL`+*activator* `LEFT`:<br/>
  Switch the focus to the previous terminal.
- `CTRL`+*activator* `RIGHT`/`SPACE`:<br/>
  Switch the focus to the next terminal.
- `CTRL`+*activator* `v`:<br/>
  Switch the focused terminal into visual scrolling mode.
  Use `PAGEUP`/`PAGEDOWN` during this mode. Any other
  key leaves this mode again.
- `CTRL`+*activator* `k`:<br/>
  Kill the program manually.

License
-------

Copyright (c) 2017 Ralf S. Engelschall (http://engelschall.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

