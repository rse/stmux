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

export default class stmuxTitle {
    /*  determine title of terminal  */
    setTerminalTitle (term) {
        let title = term.node.get("title") || term.node.get("cmd")
        title = `( {bold}${title}{/bold} )`
        if (this.argv.number)
            title = `[${term.stmuxNumber}]-${title}`
        if (this.zoomed !== -1 && this.zoomed === (term.stmuxNumber - 1))
            title = `${title}-[ZOOMED]`
        if (term.stmuxError)
            title = `${title}-[ERROR]`
        if (term.scrolling)
            title = `{yellow-fg}${title}{/yellow-fg}`
        else if (term.stmuxError)
            title = `{red-fg}${title}{/red-fg}`
        else if (this.focused !== -1 && this.focused === (term.stmuxNumber - 1))
            title = `{green-fg}${title}{/green-fg}`
        term.stmuxTitle = title
        term.setLabel(term.stmuxTitle)
    }
}

