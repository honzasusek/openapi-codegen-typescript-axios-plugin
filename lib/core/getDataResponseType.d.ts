import ts from "typescript";
import { ComponentsObject, ResponsesObject } from "openapi3-ts";
/**
 * Extract types from success responses (2xx)
 */
export declare const getDataResponseType: ({ responses, components, printNodes, }: {
    responses: ResponsesObject;
    components?: ComponentsObject | undefined;
    printNodes: (nodes: ts.Node[]) => string;
}) => ts.TypeNode;
