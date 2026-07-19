#!/usr/bin/env node
/*!
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

import stmuxInfo       from "./stmux-0-info.js"
import stmuxOptions    from "./stmux-1-options.js"
import stmuxParser     from "./stmux-2-parser.js"
import stmuxScreen     from "./stmux-3-screen.js"
import stmuxTitle      from "./stmux-4-title.js"
import stmuxTerminal   from "./stmux-5-terminal.js"
import stmuxBorder     from "./stmux-6-border.js"
import stmuxHelp       from "./stmux-7-help.js"
import stmuxErrors     from "./stmux-8-errors.js"
import stmuxKeys       from "./stmux-9-keys.js"

import type {
    Constructor, STMUXBase, PackageInfo, Options, ASTNode, Terminal, Border, BorderSide
} from "./stmux-0-types.js"

import type { Widgets } from "blessed"

/*  the root class providing the shared state and the fundamental operations  */
class STMUXRoot implements STMUXBase {
    my!:            PackageInfo
    argv!:          Options
    spec!:          string
    ast!:           ASTNode
    screen!:        Widgets.Screen
    helpBox!:       Widgets.BoxElement
    dummyBox!:      Widgets.BoxElement
    helpW           = 0
    helpH           = 0
    screenWidth     = 0
    screenHeight    = 0
    terms:          Terminal[] = []
    focused         = -1
    zoomed          = -1
    terminated      = 0
    terminatedError = 0
    terminating     = false

    /*  emit a fatal error and terminate the program  */
    fatal (msg: string): never {
        this.screen?.destroy()
        process.stderr.write(`${this.my.name}: ERROR: ${msg}\n`)
        process.exit(1)
    }

    /*  gracefully terminate the program (idempotent)  */
    terminate (): void {
        if (this.terminating)
            return
        this.terminating = true
        this.terms.forEach((t) => t.terminate())
        setTimeout(() => {
            this.screen?.destroy()
            process.exit(this.terminatedError > 0 ? 1 : 0)
        }, 50)
    }

    /*  the operations provided by the individual mixins
        (these placeholders must never run -- a reachable call
        means the corresponding mixin was not aggregated)  */
    parseOptions (): void { this.unaggregated("parseOptions") }
    parseSpec (): void { this.unaggregated("parseSpec") }
    establishScreen (): void { this.unaggregated("establishScreen") }
    calcScreenSize (): void { this.unaggregated("calcScreenSize") }
    renderScreen (): void { this.unaggregated("renderScreen") }
    setTerminalTitle (_term: Terminal): void { this.unaggregated("setTerminalTitle") }
    provision (_x: number, _y: number, _w: number, _h: number, _node: ASTNode, _initially: boolean): void { this.unaggregated("provision") }
    provisionInitially (): void { this.unaggregated("provisionInitially") }
    provisionAgain (): void { this.unaggregated("provisionAgain") }
    border (_term: Terminal, _side: BorderSide): Border { this.unaggregated("border") }
    touches (_a1: number, _a2: number, _b1: number, _b2: number): number { this.unaggregated("touches") }
    establishHelp (): void { this.unaggregated("establishHelp") }
    handleErrors (): void { this.unaggregated("handleErrors") }
    handleKeys (): void { this.unaggregated("handleKeys") }

    /*  report a mixin operation which was not aggregated  */
    unaggregated (op: string): never {
        throw new Error(`internal error: operation "${op}" not provided by any mixin`)
    }
}

/*  aggregate the individual mixins onto the root class  */
type Mixin = (Base: Constructor<STMUXBase>) => Constructor<STMUXBase>

const STMUXAggregated = ([
    stmuxInfo,
    stmuxOptions,
    stmuxParser,
    stmuxScreen,
    stmuxTitle,
    stmuxTerminal,
    stmuxBorder,
    stmuxHelp,
    stmuxErrors,
    stmuxKeys
] as Mixin[]).reduce((Base, mixin) => mixin(Base), STMUXRoot as Constructor<STMUXBase>)

/*  the aggregated application class  */
class STMUX extends STMUXAggregated {
    main (): void {
        this.parseOptions()
        this.parseSpec()
        this.establishScreen()
        this.provisionInitially()
        this.establishHelp()
        this.handleErrors()
        this.handleKeys()
        this.renderScreen()
    }
}

const stmux = new STMUX()
const onFatal = (err: unknown) => {
    stmux.fatal(err instanceof Error ? err.message : String(err))
}
process.on("uncaughtException", onFatal)
process.on("unhandledRejection", onFatal)
try {
    stmux.main()
}
catch (err: unknown) {
    onFatal(err)
}

