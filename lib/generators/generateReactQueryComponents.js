"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReactQueryComponents = void 0;
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
const generateReactQueryComponents = async (context, config) => {
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
    const contextTypeName = `${c.pascal(filenamePrefix)}Context`;
    const contextHookName = `use${c.pascal(filenamePrefix)}Context`;
    const nodes = [];
    const keyManagerItems = [];
    const fetcherFilename = formatFilename(filenamePrefix + "-fetcher");
    const utilsFilename = formatFilename(filenamePrefix + "-utils");
    const contextFilename = formatFilename(filenamePrefix + "-context");
    if (!context.existsFile(`${fetcherFilename}.ts`)) {
        context.writeFile(`${fetcherFilename}.ts`, (0, fetcher_1.getFetcher)({
            prefix: filenamePrefix,
            contextPath: contextFilename,
            baseUrl: (0, lodash_1.get)(context.openAPIDocument, "servers.0.url"),
        }));
    }
    // Generate `useQuery` & `useMutation`
    const operationIds = [];
    Object.entries(context.openAPIDocument.paths).forEach(([route, verbs]) => {
        Object.entries(verbs).forEach(([verb, operation]) => {
            if (!(0, isVerb_1.isVerb)(verb) || !(0, isOperationObject_1.isOperationObject)(operation))
                return;
            const operationId = c.camel(operation.operationId);
            if (operationIds.includes(operationId)) {
                throw new Error(`The operationId "${operation.operationId}" is duplicated in your schema definition!`);
            }
            operationIds.push(operationId);
            const { dataType, errorType, requestBodyType, pathParamsType, variablesType, queryParamsType, headersType, declarationNodes, } = (0, getOperationTypes_1.getOperationTypes)({
                openAPIDocument: context.openAPIDocument,
                operation,
                operationId,
                printNodes,
                injectedHeaders: config.injectedHeaders,
                pathParameters: verbs.parameters,
                variablesExtraPropsType: typescript_1.factory.createIndexedAccessTypeNode(typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier(contextTypeName), undefined), typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral("fetcherOptions"))),
            });
            nodes.push(...declarationNodes);
            const operationFetcherFnName = `fetch${c.pascal(operationId)}`;
            const component = operation["x-openapi-codegen-component"] ||
                (verb === "get" ? "useQuery" : "useMutate");
            if (!["useQuery", "useMutate"].includes(component)) {
                throw new Error(`[x-openapi-codegen-component] Invalid value for ${operation.operationId} operation
          Valid options: "useMutate", "useQuery"`);
            }
            if (component === "useQuery") {
                keyManagerItems.push(typescript_1.factory.createTypeLiteralNode([
                    typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("path"), undefined, typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral(route))),
                    typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("operationId"), undefined, typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral(operationId))),
                    typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("variables"), undefined, variablesType),
                ]));
            }
            nodes.push(...(0, createOperationFetcherFnNodes_1.createOperationFetcherFnNodes)({
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
                name: operationFetcherFnName,
            }), ...(component === "useQuery"
                ? createQueryHook({
                    operationFetcherFnName,
                    operation,
                    dataType,
                    errorType,
                    variablesType,
                    contextHookName,
                    name: `use${c.pascal(operationId)}`,
                    operationId,
                    url: route,
                })
                : createMutationHook({
                    operationFetcherFnName,
                    operation,
                    dataType,
                    errorType,
                    variablesType,
                    contextHookName,
                    name: `use${c.pascal(operationId)}`,
                })));
        });
    });
    if (operationIds.length === 0) {
        console.log(`⚠️ You don't have any operation with "operationId" defined!`);
    }
    const queryKeyManager = typescript_1.factory.createTypeAliasDeclaration([typescript_1.factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], "QueryOperation", undefined, keyManagerItems.length > 0
        ? typescript_1.factory.createUnionTypeNode(keyManagerItems)
        : typescript_1.factory.createTypeLiteralNode([
            typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("path"), undefined, typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.StringKeyword)),
            typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("operationId"), undefined, typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.NeverKeyword)),
            typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier("variables"), undefined, typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.UnknownKeyword)),
        ]));
    const { nodes: usedImportsNodes, keys: usedImportsKeys } = (0, getUsedImports_1.getUsedImports)(nodes, {
        ...config.schemasFiles,
        utils: utilsFilename,
    });
    if (usedImportsKeys.includes("utils")) {
        await context.writeFile(`${utilsFilename}.ts`, (0, utils_1.getUtils)());
    }
    await context.writeFile(filename + ".ts", printNodes([
        (0, createWatermark_1.createWatermark)(context.openAPIDocument.info),
        createReactQueryImport(),
        (0, createNamedImport_1.createNamedImport)([contextHookName, contextTypeName], `./${contextFilename}`),
        (0, createNamespaceImport_1.createNamespaceImport)("Fetcher", `./${fetcherFilename}`),
        (0, createNamedImport_1.createNamedImport)(fetcherFn, `./${fetcherFilename}`),
        ...usedImportsNodes,
        ...nodes,
        queryKeyManager,
    ]));
};
exports.generateReactQueryComponents = generateReactQueryComponents;
const createMutationHook = ({ operationFetcherFnName, contextHookName, dataType, errorType, variablesType, name, operation, }) => {
    const nodes = [];
    if (operation.description) {
        nodes.push(typescript_1.factory.createJSDocComment(operation.description.trim(), []));
    }
    nodes.push(typescript_1.factory.createVariableStatement([typescript_1.factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], typescript_1.factory.createVariableDeclarationList([
        typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(name), undefined, undefined, typescript_1.factory.createArrowFunction(undefined, undefined, [
            typescript_1.factory.createParameterDeclaration(undefined, undefined, typescript_1.factory.createIdentifier("options"), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier("Omit"), [
                typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createQualifiedName(typescript_1.factory.createIdentifier("reactQuery"), typescript_1.factory.createIdentifier("UseMutationOptions")), [dataType, errorType, variablesType]),
                typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral("mutationFn")),
            ]), undefined),
        ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createBlock([
            typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                typescript_1.factory.createVariableDeclaration(typescript_1.factory.createObjectBindingPattern([
                    typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier("fetcherOptions"), undefined),
                ]), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier(contextHookName), undefined, [])),
            ], typescript_1.default.NodeFlags.Const)),
            typescript_1.factory.createReturnStatement(typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier("reactQuery"), typescript_1.factory.createIdentifier("useMutation")), [dataType, errorType, variablesType], [
                typescript_1.factory.createArrowFunction(undefined, undefined, [
                    typescript_1.factory.createParameterDeclaration(undefined, undefined, typescript_1.factory.createIdentifier("variables"), undefined, variablesType, undefined),
                ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier(operationFetcherFnName), undefined, [
                    typescript_1.factory.createObjectLiteralExpression([
                        typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("fetcherOptions")),
                        typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("variables")),
                    ], false),
                ])),
                typescript_1.factory.createIdentifier("options"),
            ])),
        ], true))),
    ], typescript_1.default.NodeFlags.Const)));
    return nodes;
};
const createQueryHook = ({ operationFetcherFnName, contextHookName, dataType, errorType, variablesType, name, operationId, operation, url, }) => {
    const nodes = [];
    if (operation.description) {
        nodes.push(typescript_1.factory.createJSDocComment(operation.description.trim(), []));
    }
    nodes.push(typescript_1.factory.createVariableStatement([typescript_1.factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], typescript_1.factory.createVariableDeclarationList([
        typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(name), undefined, undefined, typescript_1.factory.createArrowFunction(undefined, [
            typescript_1.factory.createTypeParameterDeclaration(undefined, "TData", undefined, dataType),
        ], [
            typescript_1.factory.createParameterDeclaration(undefined, undefined, typescript_1.factory.createIdentifier("variables"), undefined, variablesType),
            typescript_1.factory.createParameterDeclaration(undefined, undefined, typescript_1.factory.createIdentifier("options"), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), createUseQueryOptionsType(dataType, errorType)),
        ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createBlock([
            typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                typescript_1.factory.createVariableDeclaration(typescript_1.factory.createObjectBindingPattern([
                    typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier("fetcherOptions"), undefined),
                    typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier("queryOptions"), undefined),
                    typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier("queryKeyFn"), undefined),
                ]), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier(contextHookName), undefined, [typescript_1.factory.createIdentifier("options")])),
            ], typescript_1.default.NodeFlags.Const)),
            typescript_1.factory.createReturnStatement(typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier("reactQuery"), typescript_1.factory.createIdentifier("useQuery")), [
                dataType,
                errorType,
                typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier("TData"), []),
            ], [
                typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier("queryKeyFn"), undefined, [
                    typescript_1.factory.createObjectLiteralExpression([
                        typescript_1.factory.createPropertyAssignment("path", typescript_1.factory.createStringLiteral(url)),
                        typescript_1.factory.createPropertyAssignment("operationId", typescript_1.factory.createStringLiteral(operationId)),
                        typescript_1.factory.createShorthandPropertyAssignment(typescript_1.factory.createIdentifier("variables")),
                    ]),
                ]),
                typescript_1.factory.createArrowFunction(undefined, undefined, [
                    typescript_1.factory.createParameterDeclaration(undefined, undefined, typescript_1.factory.createObjectBindingPattern([
                        typescript_1.factory.createBindingElement(undefined, undefined, "signal"),
                    ])),
                ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier(operationFetcherFnName), undefined, [
                    typescript_1.factory.createObjectLiteralExpression([
                        typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("fetcherOptions")),
                        typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("variables")),
                    ], false),
                    typescript_1.factory.createIdentifier("signal"),
                ])),
                typescript_1.factory.createObjectLiteralExpression([
                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("options")),
                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier("queryOptions")),
                ], true),
            ])),
        ]))),
    ], typescript_1.default.NodeFlags.Const)));
    return nodes;
};
const createUseQueryOptionsType = (dataType, errorType) => typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier("Omit"), [
    typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createQualifiedName(typescript_1.factory.createIdentifier("reactQuery"), typescript_1.factory.createIdentifier("UseQueryOptions")), [
        dataType,
        errorType,
        typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier("TData"), []),
    ]),
    typescript_1.factory.createUnionTypeNode([
        typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral("queryKey")),
        typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral("queryFn")),
    ]),
]);
const createReactQueryImport = () => typescript_1.factory.createImportDeclaration(undefined, typescript_1.factory.createImportClause(false, undefined, typescript_1.factory.createNamespaceImport(typescript_1.factory.createIdentifier("reactQuery"))), typescript_1.factory.createStringLiteral("@tanstack/react-query"), undefined);
//# sourceMappingURL=generateReactQueryComponents.js.map