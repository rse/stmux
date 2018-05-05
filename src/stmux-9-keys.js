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

import Blessed from "blessed"

export default class stmuxKeys {
    handleKeys () {
        /*  handle keys  */
        let prefixMode = 0
        this.screen.on("keypress", (ch, key) => {
            if ((prefixMode === 0 || prefixMode === 2) && key.full === `C-${this.argv.activator}`) {
                /*  enter prefix mode  */
                prefixMode = 1
                this.terms[this.focused].enableInput(false)
            }
            else if (prefixMode === 1) {
                /*  handle prefix mode  */
                prefixMode = 2
                if (key.full === this.argv.activator) {
                    /*  handle special prefix activator character  */
                    let ch = String.fromCharCode(1 + this.argv.activator.charCodeAt(0) - "a".charCodeAt(0))
                    this.terms[this.focused].injectInput(ch)
                }
                else if (this.zoomed === -1 && key.full === "backspace") {
                    /*  handle terminal focus change (step-by-step, sequenced)  */
                    this.terms[this.focused].resetScroll()
                    this.focused--
                    if (this.focused < 0)
                        this.focused = this.terms.length - 1
                    this.terms[this.focused].focus()
                    this.screen.render()
                }
                else if (this.zoomed === -1 && key.full === "space") {
                    /*  handle terminal focus change (step-by-step, sequenced)  */
                    this.terms[this.focused].resetScroll()
                    this.focused++
                    if (this.focused > this.terms.length - 1)
                        this.focused = 0
                    this.terms[this.focused].focus()
                    this.screen.render()
                }
                else if (   this.zoomed === -1
                         && (   key.full === "left"
                             || key.full === "right"
                             || key.full === "up"
                             || key.full === "down" )) {
                    /*  handle terminal focus change (step-by-step, directional)  */

                    /*  determine border of focused terminal where we want to logically break through  */
                    let leave, enteron
                    if (key.full === "left") {
                        leave = this.border(this.terms[this.focused], "left")
                        enteron = "right"
                    }
                    else if (key.full === "right") {
                        leave = this.border(this.terms[this.focused], "right")
                        enteron = "left"
                    }
                    else if (key.full === "up") {
                        leave = this.border(this.terms[this.focused], "top")
                        enteron = "bottom"
                    }
                    else if (key.full === "down") {
                        leave = this.border(this.terms[this.focused], "bottom")
                        enteron = "top"
                    }

                    /*  find the touchpoints of terminals with our border  */
                    let touchpoints = []
                    for (let i = 0; i < this.terms.length; i++) {
                        if (i === this.focused)
                            touchpoints[i] = { i, touches: 0 }
                        else {
                            let enter = this.border(this.terms[i], enteron)
                            if ((enteron === "left"   && enter.x1 === (leave.x1 + 1))
                                || (enteron === "right"  && enter.x1 === (leave.x1 - 1)))
                                touchpoints[i] = { i, touches: this.touches(leave.y1, leave.y2, enter.y1, enter.y2) }
                            else if ((enteron === "top"    && enter.y1 === (leave.y1 + 1))
                                || (enteron === "bottom" && enter.y1 === (leave.y1 - 1)))
                                touchpoints[i] = { i, touches: this.touches(leave.x1, leave.x2, enter.x1, enter.x2) }
                            else
                                touchpoints[i] = { i, touches: 0 }
                        }
                    }

                    /*  determine best matching terminal  */
                    let bestMatch = touchpoints.sort((t1, t2) => t2.touches - t1.touches)[0]

                    /*  switch to best matching one  */
                    if (bestMatch.touches > 0) {
                        this.terms[this.focused].resetScroll()
                        this.focused = bestMatch.i
                        this.terms[this.focused].focus()
                        this.screen.render()
                    }
                }
                else if (this.zoomed === -1 && key.full.match(/^[1-9]$/)) {
                    /*  handle terminal focus change (directly)  */
                    let n = parseInt(key.full)
                    if (n <= this.terms.length) {
                        this.focused = n - 1
                        this.terms[this.focused].focus()
                        this.screen.render()
                    }
                }
                else if (key.full === "n") {
                    /*  handle number toggling  */
                    this.argv.number = !this.argv.number
                    this.provisionAgain()
                    this.terms[this.focused].focus()
                    this.screen.render()
                }
                else if (key.full === "l") {
                    /*  handle manual screen redrawing
                        (by forcing Blessed to redraw everything
                        via temporarily opening a dummy box)  */
                    this.provisionAgain()
                    this.dummyBox = new Blessed.Box({
                        left:     0,
                        top:      0,
                        width:    this.screenWidth,
                        height:   this.screenHeight,
                        content:  ""
                    })
                    this.screen.append(this.dummyBox)
                    this.screen.render()
                    this.screen.remove(this.dummyBox)
                    this.screen.render()
                }
                else if (key.full === "z") {
                    /*  handle zooming  */
                    this.zoomed = (this.zoomed === -1 ? this.focused : -1)
                    this.provisionAgain()
                    this.terms[this.focused].focus()
                    this.screen.render()
                }
                else if (key.full === "v") {
                    /*  handle scrolling/visual mode  */
                    this.terms[this.focused].scroll(0)
                }
                else if (key.full === "r") {
                    /*  handle manual restarting  */
                    this.terms[this.focused].terminate()
                    this.terms[this.focused].spawn(this.terms[this.focused].stmuxShell, this.terms[this.focused].stmuxArgs)
                    this.terminated--
                }
                else if (key.full === "?") {
                    /*  handle help screen toggling  */
                    this.helpBox.show()
                    this.screen.render()
                }
                else if (key.full === "k") {
                    /*  kill the program  */
                    this.terminate()
                }
            }
            else if (prefixMode === 2) {
                /*  leave prefix mode  */
                this.terms[this.focused].enableInput(true)
                prefixMode = 0
                if (this.helpBox.visible) {
                    this.helpBox.hide()
                    this.screen.render()
                }
            }
        })

        /*  handle mouse  */
        if (this.argv.mouse) {
            this.terms.forEach((term) => {
                term.on("wheeldown", (...args) => {
                    /*  on-the-fly start scrolling  */
                    if (!term.scrolling)
                        term.scroll(0)

                    /*  scroll 10% downwards  */
                    let n = Math.max(1, Math.floor(term.height * 0.10))
                    term.scroll(+n)

                    /*  reset/stop scrolling once we reached the end (again)  */
                    if (Math.ceil(term.getScrollPerc()) === 100)
                        term.resetScroll()
                })
                term.on("wheelup", (...args) => {
                    /*  on-the-fly start scrolling  */
                    if (!term.scrolling)
                        term.scroll(0)

                    /*  scroll 10% upwards  */
                    let n = Math.max(1, Math.floor(term.height * 0.10))
                    term.scroll(-n)

                    /*  reset/stop scrolling once we reached the end (again)  */
                    if (Math.ceil(term.getScrollPerc()) === 100)
                        term.resetScroll()
                })
            })
        }
    }
}

