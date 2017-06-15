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

import fs    from "fs"
import yargs from "yargs"

export default class stmuxOptions {
    parseOptions () {
        /*  parse command-line arguments  */
        this.argv = yargs
            .usage("Usage: $0 [-h] [-v] [-w] [-a <activator>] [-t <title>] [-f <file>] [-- <spec>]")
            .help("h").alias("h", "help").default("h", false)
            .describe("h", "show usage help")
            .boolean("v").alias("v", "version").default("v", false)
            .describe("v", "show program version information")
            .string("w").nargs("w", 1).alias("w", "wait").default("w", "")
            .describe("w", "wait after last finished command (on \"error\" or \"always\")")
            .string("a").nargs("a", 1).alias("a", "activator").default("a", "a")
            .describe("a", "use CTRL+<activator> as the prefix to special commands")
            .string("t").nargs("t", 1).alias("t", "title").default("t", "stmux")
            .describe("t", "set title on terminal")
            .string("c").nargs("c", 1).alias("c", "cursor").default("c", "block")
            .describe("c", "set type of cursor (block, underline or line)")
            .boolean("n").alias("n", "number").default("n", false)
            .describe("n", "show terminal number in terminal title")
            .string("e").nargs("e", 1).alias("e", "error").default("e", "(?:ERROR|Error|error)")
            .describe("e", "observe terminal for errors (global option)")
            .string("m").nargs("m", 1).alias("m", "method").default("m", "")
            .describe("m", "notification method(s) in case an error was detected")
            .boolean("M").alias("M", "mouse").default("M", false)
            .describe("M", "enable mouse event handling")
            .string("f").nargs("f", 1).alias("f", "file").default("f", "-")
            .describe("f", "read specification from configuration file")
            .strict()
            .showHelpOnFail(true)
            .demand(0)
            .parse(process.argv.slice(2))

        /*  short-circuit processing of "-V" command-line option  */
        if (this.argv.version) {
            process.stderr.write(this.my.name + " " + this.my.version + " <" + this.my.homepage + ">\n")
            process.stderr.write(this.my.description + "\n")
            process.stderr.write("Copyright (c) 2017 " + this.my.author.name + " <" + this.my.author.url + ">\n")
            process.stderr.write("Licensed under " + this.my.license + " <http://spdx.org/licenses/" + this.my.license + ".html>\n")
            process.exit(0)
        }

        /*  determine specification  */
        if (this.argv._.length > 0) {
            /*  via command-line arguments  */
            this.spec = this.argv._.map((arg) => {
                if (arg.match(/[\s"]/))
                    arg = `"${arg.replace(/"/g, "\\\"")}"`
                return arg
            }).join(" ")
        }
        else {
            if (this.argv.file === "-") {
                /*  via stdin  */
                this.spec = ""
                process.stdin.setEncoding("utf-8")
                let BUFSIZE = 256
                let buf = Buffer.alloc(BUFSIZE)
                while (true) {
                    let bytesRead = 0
                    try {
                        bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE)
                    }
                    catch (ex) {
                        if (ex.code === "EAGAIN")
                            continue
                        else if (ex.code === "EOF")
                            break
                        else
                            throw ex
                    }
                    if (bytesRead === 0)
                        break
                    this.spec += buf.toString(null, 0, bytesRead)
                }
            }
            else {
                /*  via file  */
                if (!fs.existsSync(this.argv.file))
                    this.fatal(`cannot find specification file "${this.argv.file}"`)
                this.spec = fs.readFileSync(this.argv.file, "utf8")
            }
        }
    }
}

