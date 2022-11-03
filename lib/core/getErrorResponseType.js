"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorResponseType = exports.serverErrorStatus = exports.clientErrorStatus = void 0;
const tslib_1 = require("tslib");
const typescript_1 = tslib_1.__importStar(require("typescript"));
const openapi3_ts_1 = require("openapi3-ts");
const findCompatibleMediaType_1 = require("./findCompatibleMediaType");
const schemaToTypeAliasDeclaration_1 = require("./schemaToTypeAliasDeclaration");
const case_1 = require("case");
exports.clientErrorStatus = "ClientErrorStatus";
exports.serverErrorStatus = "ServerErrorStatus";
/**
 * Extract types from error responses (4xx + 5xx)
 */
const getErrorResponseType = ({ responses, components, printNodes, }) => {
    const status = Object.keys(responses);
    const responseTypes = Object.entries(responses).reduce((mem, [statusCode, response]) => {
        if (statusCode.startsWith("2"))
            return mem;
        if ((0, openapi3_ts_1.isReferenceObject)(response)) {
            const [hash, topLevel, namespace, name] = response.$ref.split("/");
            if (hash !== "#" || topLevel !== "components") {
                throw new Error("This library only resolve $ref that are include into `#/components/*` for now");
            }
            if (namespace !== "responses") {
                throw new Error("$ref for responses must be on `#/components/responses`");
            }
            return [
                ...mem,
                createStatusDeclaration(statusCode, typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createQualifiedName(typescript_1.factory.createIdentifier("Responses"), typescript_1.factory.createIdentifier((0, case_1.pascal)(name))), undefined), status),
            ];
        }
        const mediaType = (0, findCompatibleMediaType_1.findCompatibleMediaType)(response);
        if (!mediaType || !mediaType.schema)
            return mem;
        return [
            ...mem,
            createStatusDeclaration(statusCode, (0, schemaToTypeAliasDeclaration_1.getType)(mediaType.schema, {
                currentComponent: null,
                openAPIDocument: { components },
            }), status),
        ];
    }, []);
    return typescript_1.factory.createTypeReferenceNode("Fetcher.ErrorWrapper", [
        responseTypes.length === 0
            ? typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.UndefinedKeyword)
            : responseTypes.length === 1
                ? responseTypes[0]
                : typescript_1.factory.createUnionTypeNode(responseTypes),
    ]);
};
exports.getErrorResponseType = getErrorResponseType;
const createStatusDeclaration = (statusCode, type, status) => {
    let statusType = typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(statusCode));
    if (statusCode === "4xx" ||
        (statusCode === "default" && status.includes("5xx"))) {
        const usedClientCode = status.filter((s) => s.startsWith("4") && s !== "4xx");
        if (usedClientCode.length > 0) {
            statusType = typescript_1.factory.createTypeReferenceNode("Exclude", [
                typescript_1.factory.createTypeReferenceNode(exports.clientErrorStatus),
                usedClientCode.length === 1
                    ? typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(usedClientCode[0]))
                    : typescript_1.factory.createUnionTypeNode(usedClientCode.map((code) => typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(code)))),
            ]);
        }
        else {
            statusType = typescript_1.factory.createTypeReferenceNode(exports.clientErrorStatus);
        }
    }
    if (statusCode === "5xx" ||
        (statusCode === "default" && status.includes("4xx"))) {
        const usedServerCode = status.filter((s) => s.startsWith("5") && s !== "5xx");
        if (usedServerCode.length > 0) {
            statusType = typescript_1.factory.createTypeReferenceNode("Exclude", [
                typescript_1.factory.createTypeReferenceNode(exports.serverErrorStatus),
                usedServerCode.length === 1
                    ? typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(usedServerCode[0]))
                    : typescript_1.factory.createUnionTypeNode(usedServerCode.map((code) => typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(code)))),
            ]);
        }
        else {
            statusType = typescript_1.factory.createTypeReferenceNode(exports.serverErrorStatus);
        }
    }
    if (statusCode === "default" &&
        !status.includes("4xx") &&
        !status.includes("5xx")) {
        const otherCodes = status.filter((s) => s !== "default");
        if (otherCodes.length > 0) {
            statusType = typescript_1.factory.createTypeReferenceNode("Exclude", [
                typescript_1.factory.createUnionTypeNode([
                    typescript_1.factory.createTypeReferenceNode(exports.clientErrorStatus),
                    typescript_1.factory.createTypeReferenceNode(exports.serverErrorStatus),
                ]),
                otherCodes.length === 1
                    ? typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(otherCodes[0]))
                    : typescript_1.factory.createUnionTypeNode(otherCodes.map((code) => typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNumericLiteral(code)))),
            ]);
        }
        else {
            statusType = typescript_1.factory.createUnionTypeNode([
                typescript_1.factory.createTypeReferenceNode(exports.clientErrorStatus),
                typescript_1.factory.createTypeReferenceNode(exports.serverErrorStatus),
            ]);
        }
    }
    if (statusCode === "default" &&
        status.includes("4xx") &&
        status.includes("5xx")) {
        statusType = typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.NeverKeyword);
    }
    return typescript_1.factory.createTypeLiteralNode([
        typescript_1.factory.createPropertySignature(undefined, "status", undefined, statusType),
        typescript_1.factory.createPropertySignature(undefined, "payload", undefined, type),
    ]);
};
//# sourceMappingURL=getErrorResponseType.js.map