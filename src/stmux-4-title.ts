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

import type { Constructor, STMUXBase, Terminal } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        /*  determine title of terminal  */
        override setTerminalTitle (term: Terminal): void {
            const isFocused = this.focused !== -1 && this.focused === (term.stmuxNumber - 1)
            let title = String(term.node.get("title") ?? term.node.get("cmd") ?? "")

            /*  escape the Blessed tag meta-characters "{" and "}", as the
                title is later rendered with Blessed tag processing enabled  */
            title = Blessed.escape(title)
            title = `{bold}${title}{/bold}`
            if (this.argv.number)
                title = `${isFocused ? "●" : "○"} ${term.stmuxNumber} ${title}`
            if (this.zoomed !== -1 && this.zoomed === (term.stmuxNumber - 1))
                title = `${title}-[ZOOMED]`
            const isError = term.stmuxError
            if (isError)
                title = `${title}-[ERROR]`

            /*  render in inverse video with angle caps
                (the caps are outside the inverse span, so their foreground
                matches the inverse background and forms pointed block ends)  */
            title = `◀{inverse} ${title} {/inverse}▶`

            /*  colorize by precedence: scrolling > error > focused  */
            if (term.scrolling)
                title = `{yellow-fg}${title}{/yellow-fg}`
            else if (isError)
                title = `{red-fg}${title}{/red-fg}`
            else if (isFocused)
                title = `{blue-fg}${title}{/blue-fg}`
            term.stmuxTitle = title
            term.setLabel(term.stmuxTitle)
        }
    }

