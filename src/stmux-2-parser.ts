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

import ASTY from "asty"

import * as parser from "./stmux-2-parser.gen.js"

import type { Constructor, STMUXBase, ASTNode } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        override parseSpec (): void {
            /*  parse specification into Abstract Syntax Tree (AST)  */
            const asty = new ASTY()
            try {
                this.ast = parser.parse(this.spec, {
                    grammarSource: "specification",
                    startRule:     "split",
                    asty
                }) as ASTNode
            }
            catch (ex: unknown) {
                /*  provide a source-excerpt annotated error message  */
                let message: string
                if (ex instanceof parser.SyntaxError)
                    message = ex.format([ { source: "specification", text: this.spec } ])
                else
                    message = ex instanceof Error ? ex.message : String(ex)
                this.fatal("parsing failure:\n" +
                    message.replace(/^/mg, `${this.my.name}: ERROR: `) + "\n")
            }
        }
    }

