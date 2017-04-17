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

/*  external requirements  */
import path            from "path"
import fs              from "fs"
import yargs           from "yargs"
import ASTY            from "asty"
import PEG             from "pegjs-otf"
import PEGUtil         from "pegjs-util"
import blessed         from "blessed"
import BlessedXTerm    from "blessed-xterm"
import chalk           from "chalk"
import stripAnsi       from "strip-ansi"
import my              from "../package.json"

/*  parse command-line arguments  */
let argv = yargs
    .usage("Usage: $0 [-h] [-v] [-w] [-a <activator>] [-t <title>] [-f <file>] [-- <spec>]")
    .help("h").alias("h", "help").default("h", false)
        .describe("h", "show usage help")
    .boolean("v").alias("v", "version").default("v", false)
        .describe("v", "show program version information")
    .boolean("w").alias("w", "wait").default("w", false)
        .describe("w", "wait after last finished command and do not shutdown automatically")
    .string("a").nargs("a", 1).alias("a", "activator").default("a", "a")
        .describe("a", "use CTRL+<activator> as the prefix to special commands")
    .string("t").nargs("t", 1).alias("t", "title").default("t", "stmux")
        .describe("t", "set title on terminal")
    .boolean("n").alias("n", "number").default("n", false)
        .describe("n", "show terminal number in terminal title")
    .string("e").nargs("e", 1).alias("e", "error").default("e", "(?:ERROR|Error|error)")
        .describe("e", "observe terminal for errors (global option)")
    .string("f").nargs("f", 1).alias("f", "file").default("f", "-")
        .describe("f", "read specification from configuration file")
    .strict()
    .showHelpOnFail(true)
    .demand(0)
    .parse(process.argv.slice(2))

/*  short-circuit processing of "-V" command-line option  */
if (argv.version) {
    process.stderr.write(my.name + " " + my.version + " <" + my.homepage + ">\n")
    process.stderr.write(my.description + "\n")
    process.stderr.write("Copyright (c) 2017 " + my.author.name + " <" + my.author.url + ">\n")
    process.stderr.write("Licensed under " + my.license + " <http://spdx.org/licenses/" + my.license + ".html>\n")
    process.exit(0)
}

/*  determine specification  */
let spec
if (argv._.length > 0) {
    spec = argv._.map((arg) => {
        if (arg.match(/[\s"]/))
            arg = `"${arg.replace(/"/g, "\\\"")}"`
        return arg
    }).join(" ")
}
else {
    if (argv.file === "-") {
        spec = ""
        process.stdin.setEncoding("utf-8")
        let BUFSIZE = 256
        let buf = Buffer.alloc(BUFSIZE)
        while (true) {
            let bytesRead = 0
            try {
                bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE)
            }
            catch (ex) {
                if (ex.code === "EAGAIN")
                    continue
                else if (ex.code === "EOF")
                    break
                else
                    throw ex
            }
            if (bytesRead === 0)
                break
            spec += buf.toString(null, 0, bytesRead)
        }
    }
    else {
        if (!fs.existsSync(argv.file))
            throw new Error(`cannot find specification file "${argv.file}"`)
        spec = fs.readFileSync(argv.file, "utf8")
    }
}

/*  parse specification into Abstract Syntax Tree (AST)  */
const asty = new ASTY()
const parser = PEG.generateFromFile(path.join(__dirname, "..", "src", "stmux.pegjs"), {
    optimize: "size",
    trace:    false
})
let result = PEGUtil.parse(parser, spec, {
    startRule: "split",
    makeAST: (line, column, offset, args) => {
        return asty.create.apply(asty, args).pos(line, column, offset)
    }
})
if (result.error !== null) {
    process.stderr.write(`${my.name}: ERROR: Parsing Failure:\n` +
        PEGUtil.errorMessage(result.error, true).replace(/^/mg, `${my.name}: ERROR: `) + "\n")
    process.exit(1)
}

/*  establish Blessed screen  */
const screen = blessed.screen({
    title:       argv.title,
    smartCSR:    true,
    autoPadding: false,
    warnings:    false
})

/*  gracefully terminate programm  */
const die = () => {
    screen.destroy()
    process.exit(0)
}

/*  provision Blessed screen layout with Blessed XTerm widgets  */
let terms      = []
let focused    = -1
let zoomed     = -1
let terminated = 0

/*  determine title of terminal  */
const setTerminalTitle = (term) => {
    let n = term.node.childs().find((node) =>
        node.get("name") === "title" && typeof node.get("value") === "string")
    let title = n ? n.get("value") : term.node.get("cmd")
    title = `( {bold}${title}{/bold} )`
    if (argv.number)
        title = `[${term.stmuxNumber}]-${title}`
    if (zoomed !== -1 && zoomed === (term.stmuxNumber - 1))
        title = `${title}-[ZOOMED]`
    if (term.stmuxError)
        title = `${title}-[ERROR]`
    if (term.scrolling)
        title = `{red-fg}${title}{/red-fg}`
    else if (term.stmuxError)
        title = `{yellow-fg}${title}{/yellow-fg}`
    else if (focused !== -1 && focused === (term.stmuxNumber - 1))
        title = `{green-fg}${title}{/green-fg}`
    term.stmuxTitle = title
    term.setLabel(term.stmuxTitle)
}
const provision = {
    command (x, y, w, h, node, initially) {
        if (node.type() !== "command")
            throw new Error("invalid AST node (expected \"command\")")

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
                    scrolling: { border: { fg: "red" } }
                }
            })
            node.term = term
            term.node = node

            /*  place XTerm widget on screen  */
            screen.append(term)
            term.stmuxNumber = terms.length + 1
            terms.push(term)
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
        if (zoomed !== -1 && zoomed === (term.stmuxNumber - 1)) {
            term.left   = 0
            term.top    = 0
            term.width  = screen.width
            term.height = screen.height
            term.setIndex(2)
        }
        else
            term.setIndex(1)

        /*  set terminal title  */
        setTerminalTitle(term)

        /*  determine initial focus  */
        if (initially) {
            if (node.childs().find((node) => node.get("name") === "focus" && node.get("value") === true)) {
                if (focused >= 0)
                    throw new Error("only a single command can be focused")
                focused = terms.length
            }
        }

        /*  handle focus/blur events  */
        if (initially) {
            term.on("focus", () => {
                setTerminalTitle(term)
                screen.render()
            })
            term.on("blur", () => {
                setTerminalTitle(term)
                screen.render()
            })
        }

        /*  handle scrolling events  */
        if (initially) {
            term.on("scrolling-start", () => {
                setTerminalTitle(term)
                screen.render()
            })
            term.on("scrolling-end", () => {
                setTerminalTitle(term)
                screen.render()
            })
        }

        /*  handle beep events  */
        if (initially) {
            term.on("beep", () => {
                /*  pass-through to program  */
                screen.program.output.write("\x07")
            })
        }

        /*  handle error observation  */
        if (initially) {
            term.stmuxUpdate = false
            term.on("update", () => {
                term.stmuxUpdate = true
            })
        }

        /*  spawn command  */
        let shell = process.env.SHELL || "sh"
        let args  = [ "-c", node.get("cmd") ]
        if (initially)
            term.spawn(shell, args)

        /*  handle command termination (and optional restarting)  */
        if (initially) {
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
                if (node.childs().find((node) => node.get("name") === "restart" && node.get("value") === true)) {
                    /*  restart command  */
                    let delayNode = node.childs().find((node) =>
                        node.get("name") === "delay" && typeof node.get("value") === "number")
                    if (delayNode)
                        setTimeout(() => term.spawn(shell, args), delayNode.get("value"))
                    else
                        term.spawn(shell, args)
                }
                else if (!argv.wait) {
                    /*  handle automatic program termination  */
                    terminated++
                    if (terminated >= terms.length)
                        die()
                }
            })
        }
    },
    split (x, y, w, h, node, initially) {
        if (node.type() !== "split")
            throw new Error("invalid AST node (expected \"split\")")

        /*  provision terminals in a particular direction  */
        let childs = node.childs()
        const divide = (s, l, childs) => {
            /*  sanity check situation  */
            let n = childs.length
            if (l < (n * 3))
                throw new Error("terminal too small")
            let k = Math.floor(l / n)
            if (k === 0)
                throw new Error("terminal too small")

            /*  pass 1: calculcate size of explicitly sized terminals  */
            let sizes = []
            for (let i = 0; i < n; i++) {
                sizes[i] = -1
                let sizeNode = childs[i].childs().find((node) =>
                    node.get("name") === "size" && typeof node.get("value") === "string")
                if (sizeNode) {
                    let size = sizeNode.get("value")
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
                provision.any(SL[i].s, y, SL[i].l, h, childs[i], initially)
        }
        else if (node.get("vertical") === true) {
            let SL = divide(y, h, childs)
            for (let i = 0; i < childs.length; i++)
                provision.any(x, SL[i].s, w, SL[i].l, childs[i], initially)
        }
    },
    any (x, y, w, h, node, initially) {
        if (node.type() === "split")
            return provision.split(x, y, w, h, node, initially)
        else if (node.type() === "command")
            return provision.command(x, y, w, h, node, initially)
        else
            throw new Error("invalid AST node (expected \"split\" or \"command\")")
    }
}
provision.any(0, 0, screen.width, screen.height, result.ast, true)

/*  manage initial terminal focus  */
if (focused === -1)
    focused = 0
terms[focused].focus()

/*  provide help window  */
const helpText = "" +
    `{bold}${my.name} ${my.version} <${my.homepage}>{/bold}\n` +
    `{bold}${my.description}{/bold}\n` +
    `Copyright (c) 2017 ${my.author.name} <${my.author.url}>\n` +
    `Licensed under ${my.license} <http://spdx.org/licenses/${my.license}.html>\n` +
    "\n" +
    "Global Keys:\n" +
    `CTRL+${argv.activator} {bold}{green-fg}${argv.activator}{/green-fg}{/bold} ............. ` +
        `send CTRL+${argv.activator} to focused terminal\n` +
    `CTRL+${argv.activator} {bold}{green-fg}LEFT{/green-fg}{/bold} .......... ` +
        "switch focus to previous terminal in sequence\n" +
    `CTRL+${argv.activator} {bold}{green-fg}RIGHT{/green-fg}{/bold}/{bold}{green-fg}SPACE{/green-fg}{/bold} ... ` +
        "switch focus to next terminal in sequence\n" +
    `CTRL+${argv.activator} {bold}{green-fg}1{/green-fg}{/bold}/{bold}{green-fg}2{/green-fg}{/bold}/.../{bold}{green-fg}9{/green-fg}{/bold} ..... ` +
        "switch focus to terminal identified by number\n" +
    `CTRL+${argv.activator} {bold}{green-fg}n{/green-fg}{/bold} ............. ` +
        "toggle the display of sequence numbers\n" +
    `CTRL+${argv.activator} {bold}{green-fg}z{/green-fg}{/bold} ............. ` +
        "toggle the zooming of focused terminal\n" +
    `CTRL+${argv.activator} {bold}{green-fg}v{/green-fg}{/bold} ............. ` +
        "enable visual/scrolling mode on focused terminal\n" +
    `CTRL+${argv.activator} {bold}{green-fg}l{/green-fg}{/bold} ............. ` +
        "manually force redrawing of entire screen\n" +
    `CTRL+${argv.activator} {bold}{green-fg}k{/green-fg}{/bold} ............. ` +
        "kill stmux application (and all shell commands)\n" +
    `CTRL+${argv.activator} {bold}{green-fg}?{/green-fg}{/bold} ............. ` +
        "show (this) help window\n" +
    ""
let helpW = 78
let helpH = 20
const help = new blessed.Box({
    left:          Math.floor((screen.width  - helpW) / 2),
    top:           Math.floor((screen.height - helpH) / 2),
    width:         helpW,
    height:        helpH,
    padding:       1,
    tags:          true,
    border:        "line",
    content:       helpText,
    hidden:        true,
    style: {
        fg:        "default",
        bg:        "default",
        border:    { fg: "default" }
    }
})
screen.append(help)
help.setIndex(100)

/*  handle screen resizing  */
screen.on("resize", () => {
    provision.any(0, 0, screen.width, screen.height, result.ast, false)
    help.left = Math.floor((screen.width  - helpW) / 2)
    help.top  = Math.floor((screen.height - helpH) / 2)
    if (help.visible)
        help.hide()
    screen.render()
})

/*  handle error detection  */
setInterval(() => {
    let dirty = false
    terms.forEach((term) => {
        if (term.stmuxUpdate) {
            term.stmuxUpdate = false

            /*  take screenshot  */
            let screenshot = term.screenshot()
            screenshot = stripAnsi(screenshot)
            let regexp1 = argv.error
            let n = term.node.childs().find((node) =>
                node.get("name") === "error" && typeof node.get("value") === "string")
            let regexp2
            if (n)
                regexp2 = n.get("value")
            if (   (regexp1 && screenshot.match(regexp1))
                || (regexp2 && screenshot.match(regexp2)))
                term.stmuxError = true
            else
                term.stmuxError = false

            /*  determine results  */
            if (term.stmuxError && term.style.border.fg === "default") {
                term.style.border.fg = "yellow"
                dirty = true
            }
            else if (!term.stmuxError && term.style.border.fg === "yellow") {
                term.style.border.fg = "default"
                dirty = true
            }
            if (term.stmuxError && term.style.focus.border.fg === "green") {
                term.style.border.fg = "yellow"
                dirty = true
            }
            else if (!term.stmuxError && term.style.focus.border.fg === "yellow") {
                term.style.border.fg = "green"
                dirty = true
            }
            if (term.stmuxError && !term.stmuxTitle.match(/-\[ERROR\]/)) {
                setTerminalTitle(term)
                dirty = true
            }
            else if (!term.stmuxError && term.stmuxTitle.match(/-\[ERROR\]/)) {
                setTerminalTitle(term)
                dirty = true
            }
        }
    })
    if (dirty)
        screen.render()
}, 500)

/*  handle keys  */
let prefixMode = 0
screen.on("keypress", (ch, key) => {
    if ((prefixMode === 0 || prefixMode === 2) && key.full === `C-${argv.activator}`) {
        /*  enter prefix mode  */
        prefixMode = 1
        terms[focused].enableInput(false)
    }
    else if (prefixMode === 1) {
        /*  handle prefix mode  */
        prefixMode = 2
        if (key.full === argv.activator) {
            /*  handle special prefix activator character  */
            let ch = String.fromCharCode(1 + argv.activator.charCodeAt(0) - "a".charCodeAt(0))
            terms[focused].injectInput(ch)
        }
        else if (zoomed === -1 && (key.full === "left" || key.full === "right" || key.full === "space")) {
            /*  handle terminal focus change (step-by-step)  */
            terms[focused].resetScroll()
            if (key.full === "left")
                focused--
            else if (key.full === "right" || key.full === "space")
                focused++
            if (focused < 0)
                focused = terms.length - 1
            if (focused > terms.length - 1)
                focused = 0
            terms[focused].focus()
            screen.render()
        }
        else if (zoomed === -1 && key.full.match(/^[1-9]$/)) {
            /*  handle terminal focus change (directly)  */
            let n = parseInt(key.full)
            if (n <= terms.length) {
                focused = n - 1
                terms[focused].focus()
                screen.render()
            }
        }
        else if (key.full === "n") {
            /*  handle number toggling  */
            argv.number = !argv.number
            provision.any(0, 0, screen.width, screen.height, result.ast, false)
            terms[focused].focus()
            screen.render()
        }
        else if (key.full === "l") {
            /*  handle manual screen redrawing  */
            provision.any(0, 0, screen.width, screen.height, result.ast, false)
            screen.render()
        }
        else if (key.full === "z") {
            /*  handle zooming  */
            zoomed = (zoomed === -1 ? focused : -1)
            provision.any(0, 0, screen.width, screen.height, result.ast, false)
            terms[focused].focus()
            screen.render()
        }
        else if (key.full === "v") {
            /*  handle scrolling/visual mode  */
            terms[focused].scroll(0)
        }
        else if (key.full === "?") {
            /*  handle help screen toggling  */
            help.show()
            screen.render()
        }
        else if (key.full === "k") {
            /*  kill the program  */
            die()
        }
    }
    else if (prefixMode === 2) {
        /*  leave prefix mode  */
        terms[focused].enableInput(true)
        prefixMode = 0
        if (help.visible) {
            help.hide()
            screen.render()
        }
    }
})

/*  render Blessed screen initially  */
screen.render()
