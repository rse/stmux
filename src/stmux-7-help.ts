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

import Blessed from "blessed"

import type { Constructor, STMUXBase } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        override establishHelp (): void {
            /*  render a single help entry from key label(s) and description  */
            const emphasize = (label: string) =>
                label === "..." ? label : `{bold}{green-fg}${label}{/green-fg}{/bold}`
            const keys = (labels: string, description: string) =>
                `CTRL+${this.argv.activator} ` +
                labels.split("/").map(emphasize).join("/") +
                ` ${".".repeat(Math.max(1, 20 - labels.length))} ${description}\n`

            /*  assemble the help window content  */
            const helpText =
                `{bold}${this.my.name} ${this.my.version} <${this.my.homepage}>{/bold}\n` +
                `{bold}${this.my.description}{/bold}\n` +
                `Copyright (c) 2017-2026 ${this.my.author.name} <${this.my.author.url}>\n` +
                `Licensed under ${this.my.license} <https://spdx.org/licenses/${this.my.license}.html>\n` +
                "\n" +
                "Global Keys:\n" +
                keys(this.argv.activator, `send CTRL+${this.argv.activator} to focused terminal`) +
                keys("BACKSPACE",          "switch focus to previous terminal in sequence") +
                keys("SPACE",              "switch focus to next terminal in sequence") +
                keys("LEFT/RIGHT/UP/DOWN", "switch focus to best terminal in direction") +
                keys("1/2/.../9",          "switch focus to terminal identified by number") +
                keys("n",                  "toggle the display of sequence numbers") +
                keys("z",                  "toggle the zooming of focused terminal") +
                keys("v",                  "enable scrolling mode on focused terminal") +
                keys("l",                  "manually force redrawing of entire screen") +
                keys("r",                  "restart shell command in focused terminal") +
                keys("k",                  "kill stmux application (and all shell commands)") +
                keys("?",                  "show (this) help window")

            /*  create the help window  */
            this.helpW = 80
            this.helpH = helpText.replace(/\n$/, "").split("\n").length + 4
            this.helpBox = Blessed.box({
                left:          Math.max(0, Math.floor((this.screenWidth  - this.helpW) / 2)),
                top:           Math.max(0, Math.floor((this.screenHeight - this.helpH) / 2)),
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

