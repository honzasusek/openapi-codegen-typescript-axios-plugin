"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsedImports = void 0;
const tslib_1 = require("tslib");
const case_1 = require("case");
const lodash_1 = require("lodash");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const createNamedImport_1 = require("./createNamedImport");
const createNamespaceImport_1 = require("./createNamespaceImport");
const getErrorResponseType_1 = require("./getErrorResponseType");
/**
 * Generate the needed imports regarding the generated nodes usage.
 *
 * @param nodes generated nodes
 * @param files files path for dependencies
 */
const getUsedImports = (nodes, files) => {
    const imports = {
        parameters: {
            type: "namespace",
            used: false,
            namespace: "Parameters",
            from: files.parameters,
        },
        schemas: {
            type: "namespace",
            used: false,
            namespace: "Schemas",
            from: files.schemas,
        },
        requestBodies: {
            type: "namespace",
            used: false,
            namespace: "RequestBodies",
            from: files.requestBodies,
        },
        responses: {
            type: "namespace",
            used: false,
            namespace: "Responses",
            from: files.responses,
        },
        utils: {
            type: "named",
            used: false,
            from: files.utils,
            imports: new Set(),
        },
    };
    const visitor = (node) => {
        if (typescript_1.default.isQualifiedName(node)) {
            // We can’t use `node.left.getText()` because the node is not compiled (no internal `text` property)
            const text = (0, case_1.camel)((0, lodash_1.get)(node.left, "escapedText", ""));
            if (text in imports) {
                imports[text].used = true;
            }
        }
        if (imports.utils.type === "named" && typescript_1.default.isTypeReferenceNode(node)) {
            if ((0, lodash_1.get)(node.typeName, "escapedText", "") === getErrorResponseType_1.clientErrorStatus) {
                imports.utils.used = true;
                imports.utils.imports.add(getErrorResponseType_1.clientErrorStatus);
            }
            if ((0, lodash_1.get)(node.typeName, "escapedText", "") === getErrorResponseType_1.serverErrorStatus) {
                imports.utils.used = true;
                imports.utils.imports.add(getErrorResponseType_1.serverErrorStatus);
            }
        }
        return node.forEachChild(visitor);
    };
    typescript_1.default.visitNodes(typescript_1.factory.createNodeArray(nodes), visitor);
    const usedImports = Object.entries(imports).filter(([_key, i]) => i.used);
    return {
        keys: usedImports.map(([key]) => key),
        nodes: usedImports.map(([_key, i]) => {
            if (i.type === "namespace") {
                return (0, createNamespaceImport_1.createNamespaceImport)(i.namespace, `./${i.from}`);
            }
            else {
                return (0, createNamedImport_1.createNamedImport)(Array.from(i.imports.values()), `./${i.from}`, true);
            }
        }),
    };
};
exports.getUsedImports = getUsedImports;
//# sourceMappingURL=getUsedImports.js.map