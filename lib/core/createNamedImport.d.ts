/**
 * Helper to create named imports.
 *
 * @param fnName functions to imports
 * @param filename path of the module
 * @param isTypeOnly whether fnName are used as types only
 * @returns ts.Node of the import declaration
 */
export declare const createNamedImport: (fnName: string | string[], filename: string, isTypeOnly?: boolean) => import("typescript").ImportDeclaration;
