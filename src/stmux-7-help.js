/*
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

import Blessed from "blessed"

export default class stmuxHelp {
    establishHelp () {
        const helpText = "" +
            `{bold}${this.my.name} ${this.my.version} <${this.my.homepage}>{/bold}\n` +
            `{bold}${this.my.description}{/bold}\n` +
            `Copyright (c) 2017 ${this.my.author.name} <${this.my.author.url}>\n` +
            `Licensed under ${this.my.license} <http://spdx.org/licenses/${this.my.license}.html>\n` +
            "\n" +
            "Global Keys:\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}${this.argv.activator}{/green-fg}{/bold} ................... ` +
                `send CTRL+${this.argv.activator} to focused terminal\n` +
            `CTRL+${this.argv.activator} {bold}{green-fg}BACKSPACE{/green-fg}{/bold} ........... ` +
                "switch focus to previous terminal in sequence\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}SPACE{/green-fg}{/bold} ............... ` +
                "switch focus to next terminal in sequence\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}LEFT{/green-fg}{/bold}/{bold}{green-fg}RIGHT{/green-fg}{/bold}/` +
                "{bold}{green-fg}UP{/green-fg}{/bold}/{bold}{green-fg}DOWN{/green-fg}{/bold} .. " +
                "switch focus to best terminal in direction\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}1{/green-fg}{/bold}/{bold}{green-fg}2{/green-fg}{/bold}/.../` +
                "{bold}{green-fg}9{/green-fg}{/bold} ........... " +
                "switch focus to terminal identified by number\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}n{/green-fg}{/bold} ................... ` +
                "toggle the display of sequence numbers\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}z{/green-fg}{/bold} ................... ` +
                "toggle the zooming of focused terminal\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}v{/green-fg}{/bold} ................... ` +
                "enable scrolling mode on focused terminal\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}l{/green-fg}{/bold} ................... ` +
                "manually force redrawing of entire screen\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}r{/green-fg}{/bold} ................... ` +
                "restart shell command in focused terminal\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}k{/green-fg}{/bold} ................... ` +
                "kill stmux application (and all shell commands)\n" +
            `CTRL+${this.argv.activator} {bold}{green-fg}?{/green-fg}{/bold} ................... ` +
                "show (this) help window\n" +
            ""
        this.helpW = 80
        this.helpH = 22
        this.helpBox = new Blessed.Box({
            left:          Math.floor((this.screenWidth  - this.helpW) / 2),
            top:           Math.floor((this.screenHeight - this.helpH) / 2),
            width:         this.helpW,
            height:        this.helpH,
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
        this.screen.append(this.helpBox)
        this.helpBox.setIndex(100)
    }
}

