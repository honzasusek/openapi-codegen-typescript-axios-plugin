/**
 * Helper to create namespace import.
 *
 * @param namespace namespace import identifier
 * @param filename path of the module
 * @returns ts.Node of the import declaration
 */
export declare const createNamespaceImport: (namespace: string, filename: string) => import("typescript").ImportDeclaration;
