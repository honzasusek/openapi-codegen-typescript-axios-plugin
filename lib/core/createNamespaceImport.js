"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNamespaceImport = void 0;
const typescript_1 = require("typescript");
/**
 * Helper to create namespace import.
 *
 * @param namespace namespace import identifier
 * @param filename path of the module
 * @returns ts.Node of the import declaration
 */
const createNamespaceImport = (namespace, filename) => typescript_1.factory.createImportDeclaration(undefined, typescript_1.factory.createImportClause(true, undefined, typescript_1.factory.createNamespaceImport(typescript_1.factory.createIdentifier(namespace))), typescript_1.factory.createStringLiteral(filename), undefined);
exports.createNamespaceImport = createNamespaceImport;
//# sourceMappingURL=createNamespaceImport.js.map