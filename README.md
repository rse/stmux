
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
environments (like CygWin under Windows, etc). It is primarily
intended to be used for side-by-side running various tools
in a Node.js build environment. For more sophisticated use-cases
please stick with [tmux](https://tmux.github.io/), of course.

Example
-------

![stmux usage](screenshot.png)

Installation
------------

```
$ npm install -g stmux
```

Usage
-----

```
$ stmux [-h] [-V] [-q] [-n] [-C] [-m <name>] [-f <file>] [-r <url>] [-g] [<pattern> ...]
```

- `-h`, `--help`<br/>
  Show usage help.
- `-V`, `--version`<br/>
  Show program version information.

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

