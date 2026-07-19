/*
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2024 Dr. Ralf S. Engelschall <rse@engelschall.com>
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

/* global module: true */
/* global require: true */
module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-eslint")
    grunt.loadNpmTasks("grunt-contrib-clean")
    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.loadNpmTasks("grunt-shell")
    grunt.initConfig({
        eslint: {
            options: {
                overrideConfigFile: "eslint.config.mjs",
                warnIgnored:        false
            },
            "stmux": [ "src/**/*.ts" ]
        },
        shell: {
            "peggy": {
                command: "peggy --format es --allowed-start-rules split --dts " +
                    "-o src/stmux-2-parser.gen.js src/stmux-2-parser.pegjs"
            },
            "tsc": {
                command: "tsc --project tsconfig.json"
            },
            "dist": {
                /*  place the generated parser beside the compiled sources
                    and make the command-line interface executable  */
                command: "cp src/stmux-2-parser.gen.js bin/stmux-2-parser.gen.js && " +
                    "chmod a+x bin/stmux.js"
            }
        },
        clean: {
            clean:     [ "bin", "src/stmux-2-parser.gen.js", "src/stmux-2-parser.gen.d.ts" ],
            distclean: [ "node_modules" ]
        },
        watch: {
            "src": {
                files: [ "src/**/*.ts", "src/**/*.pegjs" ],
                tasks: [ "default" ],
                options: {}
            }
        }
    })
    grunt.registerTask("default", [ "shell:peggy", "eslint", "shell:tsc", "shell:dist" ])
    grunt.registerTask("dev",     [ "default", "watch" ])
}
