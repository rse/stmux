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

import notifier  from "node-notifier"
import stripAnsi from "strip-ansi"

import type { Constructor, STMUXBase, Terminal, ErrorPattern } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        override handleErrors (): void {
            /*  determine error patterns  */
            const parseErrorPatterns = (spec: string): ErrorPattern[] => {
                const result: ErrorPattern[] = []
                let patterns: string | undefined = spec
                while (patterns) {
                    const parts: RegExpMatchArray | null = patterns.match(/^((?:\\,|.)+?)(?:,(.+))?$/)
                    if (parts === null)
                        break
                    let pattern = parts[1]
                    const rest: string | undefined = parts[2]
                    const m = pattern.match(/^!(.+)$/)
                    let negate = false
                    if (m) {
                        negate = true
                        pattern = m[1]
                    }
                    try {
                        result.push({ negate, regexp: new RegExp(pattern) })
                    }
                    catch (ex: unknown) {
                        const msg = ex instanceof Error ? ex.message : String(ex)
                        this.fatal(`invalid error pattern "${pattern}": ${msg}`)
                    }
                    patterns = rest
                }
                return result
            }
            const globalErrorPatterns = parseErrorPatterns(this.argv.error)
            this.terms.forEach((term) => {
                const patterns = term.node.get("error") as string | undefined
                term.stmuxErrorPatterns = patterns ? parseErrorPatterns(patterns) : []
                term.stmuxError = false
            })

            /*  match a line against error patterns  */
            const matches = (line: string, patterns: ErrorPattern[]) =>
                patterns.every((pattern) => pattern.regexp.test(line) !== pattern.negate)

            /*  handle error detection  */
            let notifyLocked = false
            const notifyStateOld: string[] = []
            const notifyStateNew: string[] = []
            this.terms.forEach((term) => {
                notifyStateOld[term.stmuxNumber - 1] = ""
                notifyStateNew[term.stmuxNumber - 1] = ""
            })
            setInterval(() => {
                let dirty = false
                const notify: Terminal[] = []
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
                    const lines = screenshot.split(/\r?\n/)

                    /*  match errors in screenshot  */
                    term.stmuxError = lines.some((line) =>
                        (globalErrorPatterns.length > 0 && matches(line, globalErrorPatterns))
                        || (term.stmuxErrorPatterns.length > 0 && matches(line, term.stmuxErrorPatterns)))

                    /*  record notification state  */
                    if (term.stmuxError) {
                        notifyStateNew[term.stmuxNumber - 1] = screenshot
                        notify.push(term)
                    }
                    else {
                        notifyStateNew[term.stmuxNumber - 1] = ""
                        notifyStateOld[term.stmuxNumber - 1] = ""
                    }

                    /*  determine and record screen updates  */
                    const style = term.style as { border: { fg: string }, focus: { border: { fg: string } } }
                    const swapColor = (border: { fg: string }, normal: string, error: string) => {
                        if (term.stmuxError && border.fg === normal) {
                            border.fg = error
                            dirty = true
                        }
                        else if (!term.stmuxError && border.fg === error) {
                            border.fg = normal
                            dirty = true
                        }
                    }
                    swapColor(style.border,       "default", "red")
                    swapColor(style.focus.border, "green",   "red")
                    if (   ( term.stmuxError && !(/-\[ERROR\]/.test(term.stmuxTitle)))
                        || (!term.stmuxError &&  (/-\[ERROR\]/.test(term.stmuxTitle)))) {
                        this.setTerminalTitle(term)
                        dirty = true
                    }
                })

                /*  update screen  */
                if (dirty)
                    this.screen.render()

                /*  raise notification  */
                if (this.argv.method !== "" && notify.length > 0 && !notifyLocked) {
                    const stateChanged = notifyStateNew.some((state, i) => state !== notifyStateOld[i])
                    if (stateChanged) {
                        /*  determine message  */
                        const plural = notify.length > 1 ? "s" : ""
                        const notifyMsg = `${this.my.name}: ERROR situation${plural} ` +
                            `detected in terminal${plural} ` +
                            notify.map((term) => "#" + term.stmuxNumber).join(", ")

                        /*  determine method(s)  */
                        const methods = new Set(this.argv.method.split(","))

                        /*  send notification(s)  */
                        if (methods.has("beep"))
                            this.screen.program.output.write("\x07")
                        if (methods.has("system")) {
                            notifier.notify({
                                title:   `${this.my.name}: Detected new ERROR situation${plural}`,
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

