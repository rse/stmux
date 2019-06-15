/*
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2019 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

import notifier  from "node-notifier"
import stripAnsi from "strip-ansi"

export default class stmuxErrors {
    handleErrors () {
        /*  determine error patterns  */
        const parseErrorPatterns = (patterns) => {
            let result = []
            while (patterns) {
                let [ , pattern, rest ] = patterns.match(/^((?:\\,|.)+?)(?:,(.+))?$/)
                let m = pattern.match(/^!(.+)$/)
                let negate = false
                if (m) {
                    negate = true
                    pattern = m[1]
                }
                result.push({ negate, regexp: new RegExp(pattern) })
                patterns = rest
            }
            return result
        }
        let globalErrorPatterns = parseErrorPatterns(this.argv.error)
        this.terms.forEach((term) => {
            let patterns = term.node.get("error")
            term.stmuxErrorPatterns = patterns ? parseErrorPatterns(patterns) : []
            term.stmuxError = false
        })

        /*  handle error detection  */
        let notifyLocked = false
        let notifyStateOld = []
        let notifyStateNew = []
        this.terms.forEach((term) => {
            notifyStateOld[term.stmuxNumber - 1] = ""
            notifyStateNew[term.stmuxNumber - 1] = ""
        })
        setInterval(() => {
            let dirty = false
            let notify = []
            this.terms.forEach((term) => {
                /*  act only if an update exists  */
                if (!term.stmuxUpdate)
                    return
                term.stmuxUpdate = false

                /*  short-circuit processing  */
                if (   globalErrorPatterns.length     === 0
                    && term.stmuxErrorPatterns.length === 0)
                    return

                /*  take screenshot  */
                let screenshot = term.screenshot()
                screenshot = stripAnsi(screenshot)
                let lines = screenshot.split(/\r?\n/)

                /*  match errors in screenshot  */
                const matches = (string, patterns) => {
                    for (let i = 0; i < patterns.length; i++) {
                        let matched = patterns[i].regexp.test(string)
                        if (!(   ( matched && !patterns[i].negate)
                              || (!matched &&  patterns[i].negate)))
                            return false
                    }
                    return true
                }
                term.stmuxError = false
                for (let i = 0; i < lines.length; i++) {
                    if (   (globalErrorPatterns.length     > 0 && matches(lines[i], globalErrorPatterns))
                        || (term.stmuxErrorPatterns.length > 0 && matches(lines[i], term.stmuxErrorPatterns))) {
                        term.stmuxError = true
                        break
                    }
                }

                /*  record notification state  */
                if (term.stmuxError) {
                    notifyStateNew[term.stmuxNumber - 1] = screenshot
                    notify.push(term)
                }
                else
                    notifyStateNew[term.stmuxNumber - 1] = ""

                /*  determine and record screen updates  */
                if (term.stmuxError && term.style.border.fg === "default") {
                    term.style.border.fg = "red"
                    dirty = true
                }
                else if (!term.stmuxError && term.style.border.fg === "red") {
                    term.style.border.fg = "default"
                    dirty = true
                }
                if (term.stmuxError && term.style.focus.border.fg === "green") {
                    term.style.border.fg = "red"
                    dirty = true
                }
                else if (!term.stmuxError && term.style.focus.border.fg === "red") {
                    term.style.border.fg = "green"
                    dirty = true
                }
                if (term.stmuxError && !term.stmuxTitle.match(/-\[ERROR\]/)) {
                    this.setTerminalTitle(term)
                    dirty = true
                }
                else if (!term.stmuxError && term.stmuxTitle.match(/-\[ERROR\]/)) {
                    this.setTerminalTitle(term)
                    dirty = true
                }
            })

            /*  update screen  */
            if (dirty)
                this.screen.render()

            /*  raise notification  */
            if (this.argv.method !== "" && notify.length > 0 && !notifyLocked) {
                let stateOld = notifyStateOld.reduce((a, v) => a + v, "")
                let stateNew = notifyStateNew.reduce((a, v) => a + v, "")
                if (stateOld !== stateNew) {
                    /*  determine message  */
                    let notifyMsg = `${this.my.name}: ERROR situation${notify.length > 1 ? "s" : ""} ` +
                        `detected in terminal${notify.length > 1 ? "s" : ""} ` +
                        notify.map((term) => "#" + term.stmuxNumber).join(", ")

                    /*  determine method(s)  */
                    let methods = {}
                    this.argv.method.split(",").forEach((method) => { methods[method] = true })

                    /*  send notification(s)  */
                    if (methods.beep)
                        this.screen.program.output.write("\x07")
                    if (methods.system) {
                        notifier.notify({
                            title:   `${this.my.name}: Detected new ERROR situation${notify.length > 1 ? "s" : ""}`,
                            message: notifyMsg,
                            wait:    false
                        })
                    }

                    /*  swap notification state  */
                    this.terms.forEach((term) => {
                        notifyStateOld[term.stmuxNumber - 1] = notifyStateNew[term.stmuxNumber - 1]
                        notifyStateNew[term.stmuxNumber - 1] = ""
                    })

                    /*  lock notification for some time to not bug the user too much  */
                    notifyLocked = true
                    setTimeout(() => {
                        notifyLocked = false
                    }, 5 * 1000)
                }
            }
        }, 500)
    }
}

