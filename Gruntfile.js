/*
**  stmux -- Simple Terminal Multiplexing for Node Environments
**  Copyright (c) 2017-2018 Ralf S. Engelschall <rse@engelschall.com>
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
module.exports = function (grunt) {
    grunt.loadNpmTasks("grunt-eslint")
    grunt.loadNpmTasks("grunt-babel")
    grunt.loadNpmTasks("grunt-contrib-clean")
    grunt.loadNpmTasks("grunt-contrib-watch")
    grunt.initConfig({
        eslint: {
            options: {
                configFile: "etc/eslint.yaml"
            },
            "stmux": [ "src/**/*.js" ]
        },
        babel: {
            "stmux": {
                files: [
                    {
                        expand: true,
                        cwd:    "src/",
                        src:    [ "*.js" ],
                        dest:   "bin/"
                    }
                ],
                options: {
                    sourceMap: false,
                    presets: [
                        [ "@babel/preset-env", {
                            "targets": {
                                "node": "8.0.0"
                            }
                        } ]
                    ],
                    plugins: [
                        [ "@babel/transform-runtime", {
                            "helpers":     true,
                            "regenerator": false
                        } ]
                    ]
                }
            }
        },
        clean: {
            clean: [ "bin" ],
            distclean: [ "node_modules" ]
        },
        watch: {
            "src": {
                files: [ "src/**/*.js", "tst/**/*.js" ],
                tasks: [ "default" ],
                options: {}
            }
        }
    })
    grunt.registerTask("default", [ "eslint", "babel" ])
    grunt.registerTask("dev",     [ "default", "watch" ])
}

