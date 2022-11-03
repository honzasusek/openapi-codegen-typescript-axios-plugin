"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFetchers = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const c = tslib_1.__importStar(require("case"));
const lodash_1 = require("lodash");
const getUsedImports_1 = require("../core/getUsedImports");
const createWatermark_1 = require("../core/createWatermark");
const createOperationFetcherFnNodes_1 = require("../core/createOperationFetcherFnNodes");
const isVerb_1 = require("../core/isVerb");
const isOperationObject_1 = require("../core/isOperationObject");
const getOperationTypes_1 = require("../core/getOperationTypes");
const createNamedImport_1 = require("../core/createNamedImport");
const fetcher_1 = require("../templates/fetcher");
const utils_1 = require("../templates/utils");
const createNamespaceImport_1 = require("../core/createNamespaceImport");
const generateFetchers = async (context, config) => {
    const sourceFile = typescript_1.default.createSourceFile("index.ts", "", typescript_1.default.ScriptTarget.Latest);
    const printer = typescript_1.default.createPrinter({
        newLine: typescript_1.default.NewLineKind.LineFeed,
        removeComments: false,
    });
    const printNodes = (nodes) => nodes
        .map((node, i, nodes) => {
        return (printer.printNode(typescript_1.default.EmitHint.Unspecified, node, sourceFile) +
            (typescript_1.default.isJSDoc(node) ||
                (typescript_1.default.isImportDeclaration(node) &&
                    nodes[i + 1] &&
                    typescript_1.default.isImportDeclaration(nodes[i + 1]))
                ? ""
                : "\n"));
    })
        .join("\n");
    const filenamePrefix = c.snake(config.filenamePrefix ?? context.openAPIDocument.info.title) + "-";
    const formatFilename = config.filenameCase ? c[config.filenameCase] : c.camel;
    const filename = formatFilename(filenamePrefix + "-components");
    const fetcherFn = c.camel(`${filenamePrefix}-fetch`);
    const nodes = [];
    const fetcherImports = [fetcherFn];
    const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
    const utilsFilename = formatFilename(filenamePrefix + "-utils");
    const fetcherExtraPropsTypeName = `${c.pascal(filenamePrefix)}FetcherExtraProps`;
    let variablesExtraPropsType = typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.VoidKeyword);
    if (!context.existsFile(`${fetcherFilename}.ts`)) {
        context.writeFile(`${fetcherFilename}.ts`, (0, fetcher_1.getFetcher)({
            prefix: filenamePrefix,
            baseUrl: (0, lodash_1.get)(context.openAPIDocument, "servers.0.url"),
        }));
    }
    else {
        const fetcherSourceText = await context.readFile(`${fetcherFilename}.ts`);
        const fetcherSourceFile = typescript_1.default.createSourceFile(`${fetcherFilename}.ts`, fetcherSourceText, typescript_1.default.ScriptTarget.Latest);
        // Lookup for {prefix}FetcherExtraProps declaration
        typescript_1.default.forEachChild(fetcherSourceFile, (node) => {
            if (typescript_1.default.isTypeAliasDeclaration(node) &&
                node.name.escapedText === fetcherExtraPropsTypeName &&
                typescript_1.default.isTypeLiteralNode(node.type) &&
                node.type.members.length > 0) {
                // Use the type of defined
                variablesExtraPropsType = typescript_1.factory.createTypeReferenceNode(fetcherExtraPropsTypeName);
                fetcherImports.push(fetcherExtraPropsTypeName);
            }
        });
    }
    const operationIds = [];
    const operationByTags = {};
    Object.entries(context.openAPIDocument.paths).forEach(([route, verbs]) => {
        Object.entries(verbs).forEach(([verb, operation]) => {
            if (!(0, isVerb_1.isVerb)(verb) || !(0, isOperationObject_1.isOperationObject)(operation))
                return;
            const operationId = c.camel(operation.operationId);
            if (operationIds.includes(operationId)) {
                throw new Error(`The operationId "${operation.operationId}" is duplicated in your schema definition!`);
            }
            operationIds.push(operationId);
            operation.tags?.forEach((tag) => {
                if (!operationByTags[tag])
                    operationByTags[tag] = [];
                operationByTags[tag].push(operationId);
            });
            const { dataType, errorType, requestBodyType, pathParamsType, variablesType, queryParamsType, headersType, declarationNodes, } = (0, getOperationTypes_1.getOperationTypes)({
                openAPIDocument: context.openAPIDocument,
                operation,
                operationId,
                printNodes,
                injectedHeaders: config.injectedHeaders,
                pathParameters: verbs.parameters,
                variablesExtraPropsType,
            });
            nodes.push(...declarationNodes, ...(0, createOperationFetcherFnNodes_1.createOperationFetcherFnNodes)({
                dataType,
                errorType,
                requestBodyType,
                pathParamsType,
                variablesType,
                queryParamsType,
                headersType,
                operation,
                fetcherFn,
                url: route,
                verb,
                name: operationId,
            }));
        });
    });
    if (operationIds.length === 0) {
        console.log(`⚠️ You don't have any operation with "operationId" defined!`);
    }
    if (Object.keys(operationByTags).length > 0) {
        nodes.push(typescript_1.factory.createVariableStatement([typescript_1.factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier("operationsByTag"), undefined, undefined, typescript_1.factory.createObjectLiteralExpression(Object.entries(operationByTags).map(([tag, operationIds]) => {
                return typescript_1.factory.createPropertyAssignment(typescript_1.factory.createStringLiteral(c.camel(tag)), typescript_1.factory.createObjectLiteralExpression(operationIds.map((operationId) => typescript_1.factory.createShorthandPropertyAssignment(operationId))));
            }))),
        ], typescript_1.default.NodeFlags.Const)));
    }
    const { nodes: usedImportsNodes, keys: usedImportsKeys } = (0, getUsedImports_1.getUsedImports)(nodes, {
        ...config.schemasFiles,
        utils: utilsFilename,
    });
    if (usedImportsKeys.includes("utils")) {
        await context.writeFile(`${utilsFilename}.ts`, (0, utils_1.getUtils)());
    }
    await context.writeFile(filename + ".ts", printNodes([
        (0, createWatermark_1.createWatermark)(context.openAPIDocument.info),
        (0, createNamespaceImport_1.createNamespaceImport)("Fetcher", `./${fetcherFilename}`),
        (0, createNamedImport_1.createNamedImport)(fetcherImports, `./${fetcherFilename}`),
        ...usedImportsNodes,
        ...nodes,
    ]));
};
exports.generateFetchers = generateFetchers;
//# sourceMappingURL=generateFetchers.js.map