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

import fs    from "node:fs"
import yargs from "yargs"

import type { Constructor, STMUXBase, Options } from "./stmux-0-types.js"

export default <T extends Constructor<STMUXBase>>(Base: T) =>
    class extends Base {
        override parseOptions (): void {
            /*  parse command-line arguments  */
            this.argv = yargs()
                .usage("Usage: $0 [-h] [-v] [-w <when>] [-a <activator>] [-t <title>] [-c <cursor>] [-n] [-e <regexp>] [-m <method>] [-M] [-U] [-f <file>] [-- <spec>]")
                .help("h").alias("h", "help").default("h", false)
                .describe("h", "show usage help")
                /*  disable the built-in version handling of yargs, as we
                    emit our own, more extensive version information below  */
                .version(false)
                .boolean("v").alias("v", "version").default("v", false)
                .describe("v", "show program version information")
                .string("w").nargs("w", 1).alias("w", "wait").default("w", "")
                .choices("w", [ "", "error", "always" ])
                .describe("w", "wait after last finished command (on \"error\" or \"always\")")
                .string("a").nargs("a", 1).alias("a", "activator").default("a", "a")
                .describe("a", "use CTRL+<activator> as the prefix to special commands")
                .string("t").nargs("t", 1).alias("t", "title").default("t", "stmux")
                .describe("t", "set title on terminal")
                .string("c").nargs("c", 1).alias("c", "cursor").default("c", "block")
                .choices("c", [ "block", "underline", "line" ])
                .describe("c", "set type of cursor (block, underline or line)")
                .boolean("n").alias("n", "number").default("n", false)
                .describe("n", "show terminal number in terminal title")
                .string("e").nargs("e", 1).alias("e", "error").default("e", "(?:ERROR|Error|error)")
                .describe("e", "observe terminal for errors (global option)")
                .string("m").nargs("m", 1).alias("m", "method").default("m", "")
                .describe("m", "notification method(s) in case an error was detected")
                .boolean("M").alias("M", "mouse").default("M", false)
                .describe("M", "enable mouse event handling")
                .boolean("U").alias("U", "full-unicode").default("U", false)
                .describe("U", "enable full Unicode handling (wide, combining and surrogate characters)")
                .string("f").nargs("f", 1).alias("f", "file").default("f", "-")
                .describe("f", "read specification from configuration file")
                .strict()
                .showHelpOnFail(true)
                .demandCommand(0)
                .parseSync(process.argv.slice(2)) as unknown as Options

            /*  short-circuit processing of "-v" command-line option  */
            if (this.argv.version) {
                process.stdout.write(`${this.my.name} ${this.my.version} <${this.my.homepage}>\n`)
                process.stdout.write(`${this.my.description}\n`)
                process.stdout.write(`Copyright (c) 2017-2026 ${this.my.author.name} <${this.my.author.url}>\n`)
                process.stdout.write(`Licensed under ${this.my.license} <https://spdx.org/licenses/${this.my.license}.html>\n`)
                process.exit(0)
            }

            /*  sanity check activator character  */
            if (!/^[a-z]$/.test(this.argv.activator))
                this.fatal(`invalid activator character "${this.argv.activator}" (expected a single lowercase letter)`)

            /*  determine specification  */
            if (this.argv._.length > 0) {
                /*  via command-line arguments  */
                this.spec = this.argv._.map((arg) => {
                    const str = String(arg)

                    /*  determine whether a token is directly acceptable to the
                        specification grammar (as a structural token, an inner
                        option token, a numeric literal or a bareword) and
                        hence has to be passed through without re-quoting  */
                    const acceptable = (s: string) =>
                        /^(?:\[|\]|:|\.\.)$/.test(s)
                        || /^(?:-[frdtse]|--(?:focus|restart|delay|title|size|error))$/.test(s)
                        || /^[+-]?(?:0b[01]+|0o[0-7]+|0x[0-9a-fA-F]+|[0-9]*\.[0-9]+(?:[eE][+-]?[0-9]+)?|[0-9]+)$/.test(s)
                        || /^[^\r\n\t\v\f [\]:.\-"'\\]+$/.test(s)
                    const quoted = (s: string) =>
                        `"${s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`

                    /*  for the "--option=value" form re-quote just the value  */
                    const m = /^(--(?:delay|title|size|error)=)(.*)$/.exec(str)
                    if (m !== null)
                        return acceptable(m[2]) ? str : m[1] + quoted(m[2])
                    return acceptable(str) ? str : quoted(str)
                }).join(" ")
            }
            else {
                if (this.argv.file === "-") {
                    /*  via stdin  */
                    const chunks: Buffer[] = []
                    const BUFSIZE = 256
                    const buf = Buffer.alloc(BUFSIZE)
                    const sleeper = new Int32Array(new SharedArrayBuffer(4))
                    while (true) {
                        let bytesRead = 0
                        try {
                            bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, null)
                        }
                        catch (ex: unknown) {
                            const err = ex as NodeJS.ErrnoException
                            if (err.code === "EAGAIN") {
                                /*  throttle the retry to avoid a busy-wait spin  */
                                Atomics.wait(sleeper, 0, 0, 10)
                                continue
                            }
                            else if (err.code === "EOF")
                                break
                            else
                                throw ex
                        }
                        if (bytesRead === 0)
                            break
                        chunks.push(Buffer.from(buf.subarray(0, bytesRead)))
                    }
                    this.spec = Buffer.concat(chunks).toString("utf8")
                }
                else {
                    /*  via file  */
                    try {
                        this.spec = fs.readFileSync(this.argv.file, "utf8")
                    }
                    catch (ex: unknown) {
                        const msg = ex instanceof Error ? ex.message : String(ex)
                        this.fatal(`cannot read specification file "${this.argv.file}": ${msg}`)
                    }
                }
            }
        }
    }

