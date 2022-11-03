import ts from "typescript";
import { ComponentsObject, ResponsesObject } from "openapi3-ts";
export declare const clientErrorStatus = "ClientErrorStatus";
export declare const serverErrorStatus = "ServerErrorStatus";
/**
 * Extract types from error responses (4xx + 5xx)
 */
export declare const getErrorResponseType: ({ responses, components, printNodes, }: {
    responses: ResponsesObject;
    components?: ComponentsObject | undefined;
    printNodes: (nodes: ts.Node[]) => string;
}) => ts.TypeReferenceNode;
