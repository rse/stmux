#!/usr/bin/env node
/*!
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017 Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import aggregation     from "aggregation/es6"

import stmuxInfo       from "./stmux-info"
import stmuxOptions    from "./stmux-options"
import stmuxParser     from "./stmux-parser"
import stmuxScreen     from "./stmux-screen"
import stmuxTitle      from "./stmux-title"
import stmuxTerminal   from "./stmux-terminal"
import stmuxBorder     from "./stmux-border"
import stmuxHelp       from "./stmux-help"
import stmuxErrors     from "./stmux-errors"
import stmuxKeys       from "./stmux-keys"

class STMUX extends aggregation(
    stmuxInfo,
    stmuxOptions,
    stmuxParser,
    stmuxScreen,
    stmuxTitle,
    stmuxTerminal,
    stmuxBorder,
    stmuxHelp,
    stmuxErrors,
    stmuxKeys
) {
    main () {
        this.parseOptions()
        this.parseSpec()
        this.establishScreen()
        this.provisionInitially()
        this.establishHelp()
        this.handleErrors()
        this.handleKeys()
        this.renderScreen()
    }
    fatal (msg) {
        process.stderr.write(`${this.my.name}: ERROR: ${msg}\n`)
        process.exit(1)
    }
    terminate () {
        this.screen.destroy()
        process.exit(0)
    }
}

let stmux = new STMUX()
stmux.main()

