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

export default class stmuxBorder {
    /*  determine border of terminal  */
    border (term, side) {
        let x1, x2, y1, y2
        if (side === "left" || side === "right") {
            y1 = term.position.top
            y2 = y1 + term.position.height - 1
            if (side === "left")
                x1 = term.position.left
            else
                x1 = term.position.left + term.position.width - 1
            x2 = x1
        }
        else if (side === "top" || side === "bottom") {
            x1 = term.position.left
            x2 = x1 + term.position.width - 1
            if (side === "top")
                y1 = term.position.top
            else
                y1 = term.position.top + term.position.height - 1
            y2 = y1
        }
        return { x1, x2, y1, y2, side }
    }

    /*  find touches  */
    touches (a1, a2, b1, b2) {
        /*  +--a--+
                    +--b--+  */
        if (a2 < b1)
            return 0
        /*          +--a--+
            +--b--+  */
        else if (a1 > b2)
            return 0
        /*  +---a---+
             +--b--+   */
        else if (a1 <= b1 && b2 <= a2)
            return b2 - b1
        /*   +--a--+
            +---b---+  */
        else if (b1 <= a1 && a2 <= b2)
            return a2 - a1
        /*     +--a--+
            +--b--+   */
        else if (b1 < a1 && b2 <= a2)
            return b2 - a1
        /*  +--a--+
               +--b--+   */
        else if (a1 <= b1 && b2 > a2)
            return a2 - b1
        /*  actually cannot happen!?  */
        else
            return 0
    }
}

