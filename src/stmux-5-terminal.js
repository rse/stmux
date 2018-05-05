/*
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2018 Ralf S. Engelschall <rse@engelschall.com>
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

import os           from "os"
import chalk        from "chalk"
import BlessedXTerm from "blessed-xterm"

export default class stmuxTerminal {
    initializer () {
        this.terms           = []
        this.focused         = -1
        this.zoomed          = -1
        this.terminated      = 0
        this.terminatedError = 0
    }
    provisionCommand (x, y, w, h, node, initially) {
        if (node.type() !== "command")
            this.fatal("invalid AST node (expected \"command\")")

        /*  determine XTerm widget  */
        let term
        if (initially) {
            /*  create XTerm widget  */
            term = new BlessedXTerm({
                left:          x,
                top:           y,
                width:         w,
                height:        h,
                shell:         null,
                args:          [],
                env:           process.env,
                cwd:           process.cwd(),
                cursorType:    this.argv.cursor,
                cursorBlink:   true,
                ignoreKeys:    [],
                controlKey:    "none",
                fg:            "normal",
                tags:          true,
                border:        "line",
                scrollback:    1000,
                style: {
                    fg:        "default",
                    bg:        "default",
                    border:    { fg: "default" },
                    focus:     { border: { fg: "green" } },
                    scrolling: { border: { fg: "yellow" } }
                }
            })
            node.term = term
            term.node = node

            /*  place XTerm widget on screen  */
            this.screen.append(term)
            term.stmuxNumber = this.terms.length + 1
            this.terms.push(term)
        }
        else {
            /*  reuse XTerm widget  */
            term = node.term

            /*  reconfigure size and position  */
            term.left   = x
            term.top    = y
            term.width  = w
            term.height = h
        }

        /*  determine zoom  */
        if (this.zoomed !== -1 && this.zoomed === (term.stmuxNumber - 1)) {
            term.left   = 0
            term.top    = 0
            term.width  = this.screenWidth
            term.height = this.screenHeight
            term.setIndex(2)
        }
        else
            term.setIndex(1)

        /*  set terminal title  */
        this.setTerminalTitle(term)

        /*  some initial initializations  */
        if (initially) {
            /*  optionally enable mouse event handling  */
            if (this.argv.mouse)
                term.enableMouse()

            /*  determine initial focus  */
            if (node.get("focus") === true) {
                if (this.focused >= 0)
                    this.fatal("only a single command can be focused")
                this.focused = this.terms.length - 1
            }

            /*  handle focus/blur events  */
            term.on("focus", () => {
                this.setTerminalTitle(term)
                this.screen.render()
            })
            term.on("blur", () => {
                this.setTerminalTitle(term)
                this.screen.render()
            })

            /*  handle scrolling events  */
            term.on("scrolling-start", () => {
                this.setTerminalTitle(term)
                this.screen.render()
            })
            term.on("scrolling-end", () => {
                this.setTerminalTitle(term)
                this.screen.render()
            })

            /*  handle beep events  */
            term.on("beep", () => {
                /*  pass-through to program  */
                this.screen.program.output.write("\x07")
            })

            /*  handle error observation  */
            term.stmuxUpdate = false
            term.on("update", () => {
                term.stmuxUpdate = true
            })

            /*  spawn command  */
            if (os.platform() === "win32") {
                term.stmuxShell = "cmd.exe"
                term.stmuxArgs  = [ "/d", "/s", "/c", node.get("cmd") ]
            }
            else {
                term.stmuxShell = "sh"
                term.stmuxArgs  = [ "-c", node.get("cmd") ]
            }
            term.spawn(term.stmuxShell, term.stmuxArgs)

            /*  handle command termination (and optional restarting)  */
            term.on("exit", (code) => {
                if (code === 0)
                    term.write(
                        "\r\n" +
                        chalk.green.inverse(" ..::") +
                        chalk.green.bold.inverse(" PROGRAM TERMINATED ") +
                        chalk.green.inverse("::.. ") +
                        "\r\n\r\n")
                else
                    term.write(
                        "\r\n" +
                        chalk.red.inverse(" ..::") +
                        chalk.red.bold.inverse(` PROGRAM TERMINATED (code: ${code}) `) +
                        chalk.red.inverse("::.. ") +
                        "\r\n\r\n")

                /*  handle termination and restarting  */
                if (node.get("restart") === true) {
                    /*  restart command  */
                    let delay = node.get("delay")
                    if (delay > 0)
                        setTimeout(() => term.spawn(term.stmuxShell, term.stmuxArgs), delay)
                    else
                        term.spawn(term.stmuxShell, term.stmuxArgs)
                }
                else {
                    /*  handle automatic program termination  */
                    this.terminated++
                    if (code !== 0)
                        this.terminatedError++
                    if (this.terminated >= this.terms.length) {
                        if (this.argv.wait === "" || (this.argv.wait === "error" && this.terminatedError === 0))
                            setTimeout(() => this.terminate(), 2 * 1000)
                    }
                }
            })
        }
    }
    provisionSplit (x, y, w, h, node, initially) {
        if (node.type() !== "split")
            this.fatal("invalid AST node (expected \"split\")")

        /*  provision terminals in a particular direction  */
        let childs = node.childs()
        const divide = (s, l, childs) => {
            /*  sanity check situation  */
            let n = childs.length
            if (l < (n * 3))
                this.fatal("terminal too small")
            let k = Math.floor(l / n)
            if (k === 0)
                this.fatal("terminal too small")

            /*  pass 1: calculate size of explicitly sized terminals  */
            let sizes = []
            for (let i = 0; i < n; i++) {
                sizes[i] = -1
                let size = childs[i].get("size")
                if (size) {
                    let m
                    if (size.match(/^\d+$/))
                        size = parseInt(size)
                    else if (size.match(/^\d+\.\d+$/))
                        size = Math.floor(l * parseFloat(size))
                    else if ((m = size.match(/^(\d+)\/(\d+)$/)))
                        size = Math.floor(l * (parseInt(m[1]) / parseInt(m[2])))
                    else if ((m = size.match(/^(\d+)%$/)))
                        size = Math.floor(l * (parseInt(m[1]) / 100))
                    if (size < 3)
                        size = 3
                    else if (size > l)
                        size = l
                    sizes[i] = size
                }
            }

            /*  pass 2: calculate size of implicitly sized terminals  */
            for (let i = 0; i < n; i++) {
                if (sizes[i] === -1) {
                    let size = Math.floor(l / n)
                    if (size < 3)
                        size = 3
                    sizes[i] = size
                }
            }

            /*  pass 3: optionally shrink/grow sizes to fit total available size  */
            while (true) {
                let requested = 0
                for (let i = 0; i < n; i++)
                    requested += sizes[i]
                if (requested > l) {
                    let shrink = requested - l
                    for (let i = 0; i < n && shrink > 0; i++) {
                        if (sizes[i] > 3) {
                            sizes[i]--
                            shrink--
                        }
                    }
                    continue
                }
                else if (requested < l) {
                    let grow = l - requested
                    for (let i = 0; i < n && grow > 0; i++) {
                        sizes[i]++
                        grow--
                    }
                    continue
                }
                break
            }

            /*  pass 4: provide results  */
            let SL = []
            for (let i = 0; i < n; i++) {
                SL.push({ s: s, l: sizes[i] })
                s += sizes[i]
            }
            return SL
        }
        if (node.get("horizontal") === true) {
            let SL = divide(x, w, childs)
            for (let i = 0; i < childs.length; i++)
                this.provision(SL[i].s, y, SL[i].l, h, childs[i], initially)
        }
        else if (node.get("vertical") === true) {
            let SL = divide(y, h, childs)
            for (let i = 0; i < childs.length; i++)
                this.provision(x, SL[i].s, w, SL[i].l, childs[i], initially)
        }
    }
    provision (x, y, w, h, node, initially) {
        if (node.type() === "split")
            return this.provisionSplit(x, y, w, h, node, initially)
        else if (node.type() === "command")
            return this.provisionCommand(x, y, w, h, node, initially)
        else
            this.fatal("invalid AST node (expected \"split\" or \"command\")")
    }
    provisionInitially () {
        this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast, true)

        /*  manage initial terminal focus  */
        if (this.focused === -1)
            this.focused = 0
        this.terms[this.focused].focus()
    }
    provisionAgain () {
        this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast, false)
    }
}

