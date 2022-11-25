"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContext = void 0;
const case_1 = require("case");
const getContext = (prefix, componentsFile) => `import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
  import { createContext, useContext as useReactContext } from 'react'
  import { QueryOperation } from './${componentsFile}';
  
  export const ${(0, case_1.pascal)(prefix)}fetcherContextDefaultValue = {
    fetcherOptions: {},
    queryOptions: {},
    queryKeyFn: (operation: QueryOperation) => {
      const queryKey: unknown[] = hasPathParams(operation)
        ? operation.path
            .split("/")
            .filter(Boolean)
            .map((i) => resolvePathParam(i, operation.variables.pathParams))
        : operation.path.split("/").filter(Boolean);

      if (hasQueryParams(operation)) {
        queryKey.push(operation.variables.queryParams);
      }

      if (hasBody(operation)) {
        queryKey.push(operation.variables.body);
      }

      return queryKey;
    }
  }

  export const ${(0, case_1.pascal)(prefix)}FetcherContext = createContext(${(0, case_1.pascal)(prefix)}fetcherContextDefaultValue)

  export type ${(0, case_1.pascal)(prefix)}Context = {
    fetcherOptions: {
      baseURL?: string
      /**
       * Headers to inject in the fetcher
       */
      headers?: {
        Authorization?: string
      }
      /**
       * Query params to inject in the fetcher
       */
      queryParams?: {};
    };
    queryOptions: {
      /**
       * Set this to \`false\` to disable automatic refetching when the query mounts or changes query keys.
       * Defaults to \`true\`.
       */
      enabled?: boolean;
    };
    /**
     * Query key manager.
     */
    queryKeyFn: (operation: QueryOperation) => QueryKey;
  };
  
  /**
   * Context injected into every react-query hook wrappers
   * 
   * @param queryOptions options from the useQuery wrapper
   */
   export function use${(0, case_1.pascal)(prefix)}Context<
   TQueryFnData = unknown,
   TError = unknown,
   TData = TQueryFnData,
   TQueryKey extends QueryKey = QueryKey
 >(
   _queryOptions?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
 ): ${(0, case_1.pascal)(prefix)}Context {
    return useReactContext(${(0, case_1.pascal)(prefix)}FetcherContext)
  };

  // Helpers
  const resolvePathParam = (
    key: string,
    pathParams: Record<string, string>
  ) => {
    if (key.startsWith("{") && key.endsWith("}")) {
      return pathParams[key.slice(1, -1)];
    }
    return key;
  };

  const hasPathParams = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { pathParams: Record<string, string> };
  } => Boolean((operation.variables as any).pathParams);

  const hasBody = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { body: Record<string, unknown> };
  } => Boolean((operation.variables as any).body);

  const hasQueryParams = (
    operation: QueryOperation
  ): operation is QueryOperation & {
    variables: { queryParams: Record<string, unknown> };
  } => Boolean((operation.variables as any).queryParams);
  `;
exports.getContext = getContext;
//# sourceMappingURL=context.js.map