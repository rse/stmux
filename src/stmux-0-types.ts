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

import type { Widgets }    from "blessed"
import type XTerm          from "blessed-xterm"
import type { CursorType } from "blessed-xterm"

/*  the generic mixin constructor type  */
export type Constructor<T = object> = new (...args: any[]) => T

/*  the AST node (structurally compatible with ASTY nodes)  */
export interface ASTNode {
    type (): string
    get (name: string): unknown
    childs (): ASTNode[]
    term?: Terminal
}

/*  the package meta information  */
export interface PackageInfo {
    name:        string
    version:     string
    description: string
    homepage:    string
    license:     string
    author:      { name: string, email: string, url: string }
}

/*  the parsed command-line options  */
export interface Options {
    _:         (string | number)[]
    help:      boolean
    version:   boolean
    wait:      string
    activator: string
    title:     string
    cursor:    CursorType
    number:    boolean
    error:     string
    method:    string
    mouse:     boolean
    file:      string
    [ key: string ]: unknown
}

/*  an error detection pattern  */
export interface ErrorPattern {
    negate: boolean
    regexp: RegExp
}

/*  the terminal widget, extended with the stmux-specific bookkeeping  */
export interface Terminal extends Omit<XTerm, "position" | "screenshot"> {
    position:            WidgetPosition
    screenshot           (xi?: number, xl?: number, yi?: number, yl?: number): string
    focused:             boolean
    node:                ASTNode
    stmuxNumber:         number
    stmuxTitle:          string
    stmuxError:          boolean
    stmuxUpdate:         boolean
    stmuxExited:         boolean
    stmuxExitCode:       number
    stmuxIgnoreExits:    number
    stmuxShell:          string
    stmuxArgs:           string[]
    stmuxRestartTimer?:  ReturnType<typeof setTimeout>
    stmuxErrorPatterns:  ErrorPattern[]
}

/*  the effective position of a widget
    (the "@types/blessed" "Position" lacks "width"/"height",
    although Blessed provides them at run-time)  */
export interface WidgetPosition {
    left:   number
    top:    number
    width:  number
    height: number
}

/*  the side of a terminal border  */
export type BorderSide = "left" | "right" | "top" | "bottom"

/*  a terminal border descriptor  */
export interface Border {
    x1:   number
    x2:   number
    y1:   number
    y2:   number
    side: BorderSide
}

/*  the shared contract which every mixin may rely upon  */
export interface STMUXBase {
    my:              PackageInfo
    argv:            Options
    spec:            string
    ast:             ASTNode
    screen:          Widgets.Screen
    helpBox:         Widgets.BoxElement
    helpW:           number
    helpH:           number
    screenWidth:     number
    screenHeight:    number
    terms:           Terminal[]
    focused:         number
    zoomed:          number
    terminated:      number
    terminatedError: number
    terminating:     boolean

    /*  provided by the root class  */
    fatal (msg: string): never
    terminate (): void

    /*  provided by the individual mixins  */
    parseOptions (): void
    parseSpec (): void
    establishScreen (): void
    calcScreenSize (): void
    renderScreen (): void
    setTerminalTitle (term: Terminal): void
    provision (x: number, y: number, w: number, h: number, node: ASTNode, initially: boolean): void
    provisionInitially (): void
    provisionAgain (): void
    border (term: Terminal, side: BorderSide): Border
    touches (a1: number, a2: number, b1: number, b2: number): number
    establishHelp (): void
    handleErrors (): void
    handleKeys (): void
}

