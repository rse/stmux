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

import type { Constructor, STMUXBase, Terminal, Border, BorderSide } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        /*  determine border of terminal  */
        override border (term: Terminal, side: BorderSide): Border {
            const { left, top, width, height } = term.position
            if (side === "left" || side === "right") {
                const x = (side === "left" ? left : left + width - 1)
                return { x1: x, x2: x, y1: top, y2: top + height - 1, side }
            }
            else {
                const y = (side === "top" ? top : top + height - 1)
                return { x1: left, x2: left + width - 1, y1: y, y2: y, side }
            }
        }

        /*  find touches  */
        override touches (a1: number, a2: number, b1: number, b2: number): number {
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
                return b2 - b1 + 1
            /*   +--a--+
                +---b---+  */
            else if (b1 <= a1 && a2 <= b2)
                return a2 - a1 + 1
            /*     +--a--+
                +--b--+   */
            else if (b1 < a1 && b2 <= a2)
                return b2 - a1 + 1
            /*  +--a--+
                   +--b--+   */
            else if (a1 <= b1 && b2 > a2)
                return a2 - b1 + 1
            /*  actually cannot happen!?  */
            else
                return 0
        }
    }

