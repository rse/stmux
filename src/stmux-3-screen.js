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
import which        from "which"
import childProcess from "child_process"
import Blessed      from "blessed"

export default class stmuxScreen {
    establishScreen () {
        /*  Older/ancient Windows console API does not support inverse
            or underline for displaying the emulated cursor, so we have
            to force the use of the special character based "line" cursor.  */
        if (os.platform() === "win32" && !os.release().match(/^10\./))
            this.argv.cursor = "line"

        /*  workaround for trouble under Windows + ConEmu + TERM=cygwin
            (where Blessed needs a hint to work correctly under the "cygwin"
            terminal type and for even better rendering quality we switch to the
            "windows-ansi" terminal type)  */
        if (os.platform() === "win32" && process.env.TERM === "cygwin") {
            process.env.NCURSES_NO_UTF8_ACS = 1
            process.env.TERM = "windows-ansi"
        }

        /*  sanity check to prevent trouble under Windows + MinTTY
            (where Node sees to TTY on stdio because MinTTY does not
            actually emulate a real TTY. The only workaround is to
            use the "winpty" utility and start Node with "winpty node"  */
        if (os.platform() === "win32" && process.env.TERM === "xterm" && !process.stdin.isTTY && !process.stdout.isTTY) {
            let winpty
            try { winpty = which.sync("winpty") }
            catch (ex) {
                this.fatal("under Windows/MinTTY you need the \"winpty\" utility on PATH")
            }
            let child = childProcess.spawnSync(winpty, process.argv, {
                stdio: [ "inherit", "inherit", "inherit" ]
            })
            process.exit(child.status)
        }

        /*  final sanity check for TTY  */
        if (!process.stdin.isTTY || !process.stdout.isTTY)
            this.fatal("we are not attached to a TTY device")

        /*  establish Blessed screen  */
        this.screen = Blessed.screen({
            title:       this.argv.title,
            smartCSR:    true,
            autoPadding: false,
            warnings:    false
        })

        /*  disable cursor  */
        this.screen.program.hideCursor()

        /*  optionally enable mouse event handling  */
        if (this.argv.mouse)
            this.screen.enableMouse()

        /*  determine screen size  */
        this.calcScreenSize()

        /*  handle screen resizing  */
        this.screen.on("resize", () => {
            this.calcScreenSize()
            this.provisionAgain()
            this.helpBox.left = Math.floor((this.screenWidth  - this.helpW) / 2)
            this.helpBox.top  = Math.floor((this.screenHeight - this.helpH) / 2)
            if (this.helpBox.visible)
                this.helpBox.hide()
            this.screen.render()
        })
    }
    calcScreenSize () {
        this.screenWidth  = this.screen.width
        this.screenHeight = this.screen.height
        if (this.screenWidth < 3 || this.screenHeight < 3)
            this.fatal("attached terminal is too small")
        if (os.platform() === "win32" && !os.release().match(/^10\./)) {
            /*  nasty hack for older Windows versions where all types of consoles
                (including ConEmu) scroll by an extra line (which breaks the screen
                rendering) once the right bottom character is rendered. As a workaround
                ensure we are not hitting the right margin on the last line. */
            this.screenWidth--
        }
    }
    renderScreen () {
        this.screen.render()
    }
}

