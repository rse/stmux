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

import js         from "@eslint/js"
import neostandard from "neostandard"
import tseslint    from "typescript-eslint"
import globals     from "globals"

export default [
    {
        ignores: [ "bin/**", "node_modules/**", "src/**/*.gen.js", "src/**/*.gen.d.ts" ]
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...neostandard({ ts: true, noStyle: true }),
    {
        files: [ "src/**/*.ts" ],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType:  "module",
            globals: {
                ...globals.node
            },
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            }
        },
        rules: {
            /*  modified rules  */
            "indent":                              [ "error", 4, { "SwitchCase": 1 } ],
            "linebreak-style":                     [ "error", "unix" ],
            "semi":                                [ "error", "never" ],
            "operator-linebreak":                  [ "error", "after", { "overrides": { "&&": "before", "||": "before", ":": "before" } } ],
            "brace-style":                         [ "error", "stroustrup", { "allowSingleLine": true } ],
            "quotes":                              [ "error", "double" ],

            /*  disabled rules  */
            "no-multi-spaces":                     "off",
            "no-multiple-empty-lines":             "off",
            "key-spacing":                         "off",
            "object-property-newline":             "off",
            "curly":                               "off",
            "space-in-parens":                     "off",
            "lines-between-class-members":         "off",
            "array-bracket-spacing":               "off",

            /*  TypeScript specific rules  */
            "@typescript-eslint/no-explicit-any":  "off",
            "@typescript-eslint/no-unused-vars":   [ "error", { "argsIgnorePattern": "^_" } ],
            "@typescript-eslint/no-empty-object-type": "off"
        }
    }
]
