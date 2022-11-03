"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.print = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const sourceFile = typescript_1.default.createSourceFile("index.ts", "", typescript_1.default.ScriptTarget.Latest);
const printer = typescript_1.default.createPrinter({
    newLine: typescript_1.default.NewLineKind.LineFeed,
    removeComments: false,
});
/**
 * Print a typescript node
 */
const print = (node) => printer.printNode(typescript_1.default.EmitHint.Unspecified, node, sourceFile);
exports.print = print;
//# sourceMappingURL=testUtils.js.map