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
import my              from "../package.json"

/*  parse command-line arguments  */
let argv = yargs
    .usage("Usage: $0 [-h] [-V] [-w] [-C] [-t <title>] [-f <file>] [-- <spec>]")
    .help("h").alias("h", "help").default("h", false)
        .describe("h", "show usage help")
    .boolean("V").alias("V", "version").default("V", false)
        .describe("V", "show program version information")
    .boolean("w").alias("w", "wait").default("w", false)
        .describe("w", "wait after last finished command and do not shutdown automatically")
    .boolean("C").alias("C", "noColor").default("C", false)
        .describe("C", "do not use any colors in output")
    .string("a").nargs("a", 1).alias("a", "activator").default("a", "a")
        .describe("a", "use CTRL+<character> as the prefix to special commands")
    .string("t").nargs("t", 1).alias("t", "title").default("t", "stmux")
        .describe("t", "set title on terminal")
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
else
    spec = fs.readFileSync(argv.file, "utf8")

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
let wins = []
let focused = -1
let terminated = 0
const provision = {
    command (x, y, w, h, node) {
        if (node.type() !== "command")
            throw new Error("invalid AST node (expected \"command\")")

        /*  determine title of terminal  */
        let n = node.childs().find((node) =>
            node.get("name") === "title" && typeof node.get("value") === "string")
        let title = n ? n.get("value") : node.get("cmd")
        title = `( {bold}${title}{/bold} )`

        /*  create XTerm widget  */
        const win = new BlessedXTerm({
            shell:         null,
            args:          [],
            env:           process.env,
            cwd:           process.cwd(),
            ignoreKeys:    [],
            controlKey:    "C-w",
            left:          x,
            top:           y,
            width:         w,
            height:        h,
            label:         title,
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

        /*  determine initial focus  */
        if (node.childs().find((node) => node.get("name") === "focus" && node.get("value") === true)) {
            if (focused >= 0)
                throw new Error("only a single command can be focused")
            focused = wins.length
        }

        /*  handle focus/blur events  */
        win.on("focus", () => {
            let label
            if (win.scrolling)
                label = `{red-fg}${title}{/red-fg}`
            else
                label = `{green-fg}${title}{/green-fg}`
            win.setLabel(label)
            screen.render()
        })
        win.on("blur", () => {
            win.setLabel(title)
            screen.render()
        })

        /*  handle scrolling events  */
        win.on("scrolling-start", () => {
            win.setLabel(`{red-fg}${title}{/red-fg}`)
            screen.render()
        })
        win.on("scrolling-end", () => {
            win.setLabel(`{green-fg}${title}{/green-fg}`)
            screen.render()
        })

        /*  spawn command  */
        let shell = process.env.SHELL || "sh"
        let args  = [ "-c", node.get("cmd") ]
        win.spawn(shell, args)

        /*  handle command termination (and optional restarting)  */
        win.on("exit", (code) => {
            if (code === 0)
                win.write(
                    "\r\n" +
                    chalk.green.inverse(" ..::") +
                    chalk.green.bold.inverse(" PROGRAM TERMINATED ") +
                    chalk.green.inverse("::.. ") +
                    "\r\n\r\n")
            else
                win.write(
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
                    setTimeout(() => win.spawn(shell, args), delayNode.get("value"))
                else
                    win.spawn(shell, args)
            }
            else if (!argv.wait) {
                /*  handle automatic program termination  */
                terminated++
                if (terminated >= wins.length)
                    die()
            }
        })

        /*  place XTerm widget on screen  */
        screen.append(win)
        win.node = node
        wins.push(win)
    },
    split (x, y, w, h, node) {
        if (node.type() !== "split")
            throw new Error("invalid AST node (expected \"split\")")

        /*  provision termonals in a particular direction  */
        let childs = node.childs()
        const divide = (s, l, n) => {
            let SL = []
            let k = Math.floor(l / n)
            if (k === 0)
                throw new Error("too small screen")
            for (let i = 0; i < n; i++) {
                let _s = s + (i * k)
                let _l = (i === (n - 1) ? (l - ((n - 1) * k)) : k)
                SL.push({ s: _s, l: _l })
            }
            return SL
        }
        if (node.get("horizontal") === true) {
            let SL = divide(x, w, childs.length)
            for (let i = 0; i < childs.length; i++)
                provision.any(SL[i].s, y, SL[i].l, h, childs[i])
        }
        else if (node.get("vertical") === true) {
            let SL = divide(y, h, childs.length)
            for (let i = 0; i < childs.length; i++)
                provision.any(x, SL[i].s, w, SL[i].l, childs[i])
        }
    },
    any (x, y, w, h, node) {
        if (node.type() === "split")
            return provision.split(x, y, w, h, node)
        else if (node.type() === "command")
            return provision.command(x, y, w, h, node)
        else
            throw new Error("invalid AST node (expected \"split\" or \"command\")")
    }
}
provision.any(0, 0, screen.width, screen.height, result.ast)

/*  manage initial window focus  */
if (focused === -1)
    focused = 0
wins[focused].focus()

/*  handle keys  */
let prefixMode = 0
screen.on("keypress", (ch, key) => {
    if ((prefixMode === 0 || prefixMode === 2) && key.full === `C-${argv.activator}`) {
        prefixMode = 1
        wins[focused].enableInput(false)
    }
    else if (prefixMode === 1) {
        prefixMode = 2
        if (key.full === argv.activator) {
            let ch = String.fromCharCode(1 + argv.activator.charCodeAt(0) - "a".charCodeAt(0))
            wins[focused].injectInput(ch)
        }
        else if (key.full === "left" || key.full === "right" || key.full === "space") {
            wins[focused].resetScroll()
            if (key.full === "left")
                focused--
            else if (key.full === "right" || key.full === "space")
                focused++
            if (focused < 0)
                focused = wins.length - 1
            if (focused > wins.length - 1)
                focused = 0
            wins[focused].focus()
            screen.render()
        }
        else if (key.full === "k") {
            die()
        }
    }
    else if (prefixMode === 2) {
        wins[focused].enableInput(true)
        prefixMode = 0
    }
})

/*  render Blessed screen initially  */
screen.render()
