/*
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2026 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

import os           from "node:os"
import chalk        from "chalk"
import BlessedXTerm from "blessed-xterm"

import type { Constructor, STMUXBase, ASTNode, Terminal } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        /*  initialize a freshly created XTerm widget (event wiring and command spawning)  */
        initializeTerminal (term: Terminal, node: ASTNode): void {
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
                /*  redetermine our view of the current focused terminal  */
                for (let i = 0; i < this.terms.length; i++) {
                    if (this.terms[i].focused) {
                        this.focused = i
                        break
                    }
                }

                /*  in expand mode, re-apply the expansion to the new focus  */
                if (this.expanded)
                    this.provisionAgain()

                /*  repaint focused  */
                this.setTerminalTitle(term)
                this.screen.render()
            })

            /*  handle blur and scrolling events with a plain repaint  */
            for (const event of [ "blur", "scrolling-start", "scrolling-end" ]) {
                term.on(event, () => {
                    this.setTerminalTitle(term)
                    this.screen.render()
                })
            }

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

            /*  initialize termination bookkeeping  */
            term.stmuxExited      = false
            term.stmuxExitCode    = 0
            term.stmuxIgnoreExits = 0

            /*  spawn command  */
            if (os.platform() === "win32") {
                term.stmuxShell = "cmd.exe"
                term.stmuxArgs  = [ "/d", "/s", "/c", node.get("cmd") as string ]
            }
            else {
                term.stmuxShell = "sh"
                term.stmuxArgs  = [ "-c", node.get("cmd") as string ]
            }
            term.spawn(term.stmuxShell, term.stmuxArgs)

            /*  handle command termination (and optional restarting)  */
            term.on("exit", (code: number) => {
                /*  ignore the trailing "exit" event of the old process
                    which was killed during a manual restart  */
                if (term.stmuxIgnoreExits > 0) {
                    term.stmuxIgnoreExits--
                    return
                }

                const color = code === 0 ? chalk.blue : chalk.red
                const label = code === 0 ? " PROGRAM TERMINATED " : ` PROGRAM TERMINATED (code: ${code}) `
                term.write(
                    "\r\n" +
                    color.inverse(" ..::") +
                    color.bold.inverse(label) +
                    color.inverse("::.. ") +
                    "\r\n\r\n")

                /*  handle termination and restarting  */
                if (node.get("restart") === true) {
                    /*  restart command (remember the timer to allow a manual restart to cancel it)  */
                    const delay = Number(node.get("delay") ?? 0)
                    if (delay > 0) {
                        term.stmuxRestartTimer = setTimeout(() => {
                            term.stmuxRestartTimer = undefined
                            term.spawn(term.stmuxShell, term.stmuxArgs)
                        }, delay * 1000)
                    }
                    else
                        term.spawn(term.stmuxShell, term.stmuxArgs)
                }
                else {
                    /*  handle automatic program termination  */
                    term.stmuxExited   = true
                    term.stmuxExitCode = code
                    this.terminated++
                    if (code !== 0)
                        this.terminatedError++
                    if (this.terminated >= this.terms.length) {
                        if (this.argv.wait === "" || (this.argv.wait === "error" && this.terminatedError === 0)) {
                            setTimeout(() => {
                                /*  re-check, as terminals could have been manually restarted meanwhile  */
                                if (this.terminated >= this.terms.length)
                                    this.terminate()
                            }, 2 * 1000)
                        }
                    }
                }
            })
        }

        /*  provision a single terminal for a "command" AST node  */
        provisionCommand (x: number, y: number, w: number, h: number, node: ASTNode, initially: boolean): void {
            if (node.type() !== "command")
                this.fatal("invalid AST node (expected \"command\")")

            /*  determine XTerm widget  */
            let term: Terminal
            if (initially) {
                /*  create XTerm widget  */
                const options: ConstructorParameters<typeof BlessedXTerm>[0] = {
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
                        focus:     { border: { fg: "blue" } },
                        scrolling: { border: { fg: "yellow" } }
                    }
                }
                term = new BlessedXTerm(options) as unknown as Terminal
                node.term = term
                term.node = node

                /*  place XTerm widget on screen  */
                this.screen.append(term)
                term.stmuxNumber = this.terms.length + 1
                this.terms.push(term)
            }
            else {
                /*  reuse XTerm widget  */
                term = node.term!

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

            /*  initially wire up events and spawn the command  */
            if (initially)
                this.initializeTerminal(term, node)
        }

        /*  provision a group of terminals for a "split" AST node  */
        provisionSplit (x: number, y: number, w: number, h: number, node: ASTNode, initially: boolean): void {
            if (node.type() !== "split")
                this.fatal("invalid AST node (expected \"split\")")

            /*  provision terminals in a particular direction  */
            const childs = node.childs()

            /*  determine whether an AST node subtree contains the focused terminal  */
            const containsFocused = (sub: ASTNode): boolean =>
                sub.type() === "command" ?
                    sub.term === this.terms[this.focused]
                    : sub.childs().some((child) => containsFocused(child))

            /*  determine the minimum size of an AST node subtree along an axis
                (8 content columns or 4 content lines plus 2 border cells per terminal)  */
            const minimumSize = (sub: ASTNode, horizontal: boolean): number => {
                if (sub.type() === "command")
                    return (horizontal ? 8 : 4) + 2
                const minima = sub.childs().map((child) => minimumSize(child, horizontal))
                return (sub.get("horizontal") === true) === horizontal ?
                    minima.reduce((sum, min) => sum + min, 0)
                    : Math.max(...minima)
            }

            const divide = (s: number, l: number, items: ASTNode[], horizontal: boolean): { s: number, l: number }[] => {
                /*  sanity check situation  */
                const n = items.length
                if (l < (n * 3))
                    this.fatal("terminal too small")

                /*  passes 1-2 (expand mode): assign every child subtree not
                    containing the focused terminal its minimum size and all
                    remaining space to the containing subtree (falling back
                    to the regular passes if the minimum cannot be honored)  */
                const sizes:    number[]  = []
                const implicit: boolean[] = []
                let expanded = this.expanded && this.focused >= 0
                if (expanded) {
                    const minima = items.map((item) => minimumSize(item, horizontal))
                    const total  = minima.reduce((sum, min) => sum + min, 0)
                    if (l >= total) {
                        for (let i = 0; i < n; i++) {
                            implicit[i] = false
                            sizes[i] = minima[i] + (containsFocused(items[i]) ? l - total : 0)
                        }
                    }
                    else
                        expanded = false
                }
                if (!expanded) {
                    /*  pass 1: calculate size of explicitly sized terminals  */
                    for (let i = 0; i < n; i++) {
                        sizes[i] = -1
                        const spec = items[i].get("size") as string | undefined
                        if (spec) {
                            let size = -1
                            const mRatio   = spec.match(/^(\d+)\/(\d+)$/)
                            const mPercent = spec.match(/^(\d+)%$/)
                            if (/^\d+$/.test(spec))
                                size = parseInt(spec, 10)
                            else if (/^\d+\.\d+$/.test(spec))
                                size = Math.floor(l * parseFloat(spec))
                            else if (mRatio !== null) {
                                const denominator = parseInt(mRatio[2], 10)
                                if (denominator === 0)
                                    this.fatal(`invalid terminal size specification "${spec}" (zero denominator)`)
                                size = Math.floor(l * (parseInt(mRatio[1], 10) / denominator))
                            }
                            else if (mPercent !== null)
                                size = Math.floor(l * (parseInt(mPercent[1], 10) / 100))
                            else
                                this.fatal(`invalid terminal size specification "${spec}"`)
                            if (size < 3)
                                size = 3
                            else if (size > l)
                                size = l
                            sizes[i] = size
                        }
                    }

                    /*  pass 2: calculate size of implicitly sized terminals
                        (dividing the still remaining size among them)  */
                    let m = 0
                    let remaining = l
                    for (let i = 0; i < n; i++) {
                        implicit[i] = (sizes[i] === -1)
                        if (implicit[i])
                            m++
                        else
                            remaining -= sizes[i]
                    }
                    for (let i = 0; i < n; i++) {
                        if (implicit[i]) {
                            let size = Math.floor(remaining / m)
                            if (size < 3)
                                size = 3
                            sizes[i] = size
                        }
                    }
                }

                /*  pass 3: optionally shrink/grow sizes to fit total available size
                    (preferring to adjust implicitly sized terminals)  */
                while (true) {
                    let requested = 0
                    for (let i = 0; i < n; i++)
                        requested += sizes[i]
                    if (requested > l) {
                        let shrink = requested - l
                        const before = shrink
                        for (const preferred of [ true, false ]) {
                            for (let i = 0; i < n && shrink > 0; i++) {
                                if (implicit[i] === preferred && sizes[i] > 3) {
                                    sizes[i]--
                                    shrink--
                                }
                            }
                        }
                        if (shrink === before)
                            this.fatal("terminal too small")
                        continue
                    }
                    else if (requested < l) {
                        let grow = l - requested
                        for (const preferred of [ true, false ]) {
                            for (let i = 0; i < n && grow > 0; i++) {
                                if (implicit[i] === preferred) {
                                    sizes[i]++
                                    grow--
                                }
                            }
                        }
                        continue
                    }
                    break
                }

                /*  pass 4: provide results  */
                const segments: { s: number, l: number }[] = []
                for (let i = 0; i < n; i++) {
                    segments.push({ s, l: sizes[i] })
                    s += sizes[i]
                }
                return segments
            }
            if (node.get("horizontal") === true) {
                const segments = divide(x, w, childs, true)
                for (let i = 0; i < childs.length; i++)
                    this.provision(segments[i].s, y, segments[i].l, h, childs[i], initially)
            }
            else if (node.get("vertical") === true) {
                const segments = divide(y, h, childs, false)
                for (let i = 0; i < childs.length; i++)
                    this.provision(x, segments[i].s, w, segments[i].l, childs[i], initially)
            }
            else
                this.fatal("invalid AST node (expected \"horizontal\" or \"vertical\" split)")
        }

        /*  provision the terminals of an arbitrary AST node  */
        override provision (x: number, y: number, w: number, h: number, node: ASTNode, initially: boolean): void {
            if (node.type() === "split")
                this.provisionSplit(x, y, w, h, node, initially)
            else if (node.type() === "command")
                this.provisionCommand(x, y, w, h, node, initially)
            else
                this.fatal("invalid AST node (expected \"split\" or \"command\")")
        }

        /*  provision all terminals initially  */
        override provisionInitially (): void {
            this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast, true)

            /*  manage initial terminal focus  */
            if (this.focused === -1)
                this.focused = 0
            this.terms[this.focused].focus()
        }

        /*  re-provision all terminals again (after layout changes)  */
        override provisionAgain (): void {
            this.provision(0, 0, this.screenWidth, this.screenHeight, this.ast, false)
        }
    }

