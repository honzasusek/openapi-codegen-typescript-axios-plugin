"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFetcher = void 0;
const case_1 = require("case");
/**
 * Get fetcher template
 *
 * @param contextPath import the context from another file
 */
const getFetcher = ({ prefix, contextPath, baseUrl, }) => `${contextPath
    ? `import { ${(0, case_1.pascal)(prefix)}Context } from "./${contextPath}";`
    : `export type ${(0, case_1.pascal)(prefix)}FetcherExtraProps = {
      /**
       * You can add some extra props to your generated fetchers.
       * 
       * Note: You need to re-gen after adding the first property to
       * have the \`${(0, case_1.pascal)(prefix)}FetcherExtraProps\` injected in \`${(0, case_1.pascal)(prefix)}Components.ts\`
       **/
    }`}
  import axios from "axios";

const baseUrl = ${baseUrl ? `"${baseUrl}"` : `""; // TODO add your baseUrl`}

export type ErrorWrapper<TError> = 
  | TError
  | { status: "unknown"; payload: string };

export type ${(0, case_1.pascal)(prefix)}FetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
  url: string;
  method: string;
  body?: TBody;
  headers?: THeaders;
  queryParams?: TQueryParams;
  pathParams?: TPathParams;
  signal?: AbortSignal;
} & ${contextPath
    ? `${(0, case_1.pascal)(prefix)}Context["fetcherOptions"];`
    : `${(0, case_1.pascal)(prefix)}FetcherExtraProps`}

export async function ${(0, case_1.camel)(prefix)}fetch<
  TData,
  TError,
  TBody extends {} | undefined | null,
  THeaders extends {},
  TQueryParams extends {},
  TPathParams extends {}
>({
  url,
  method,
  body,
  headers,
  pathParams,
  queryParams,
  signal,
}: ${(0, case_1.pascal)(prefix)}FetcherOptions<
  TBody,
  THeaders,
  TQueryParams,
  TPathParams
>): Promise<TData> {
  return axios({
    method,
    signal,
    data: body,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    baseURL: baseUrl,
    url: \`\${resolveUrl(url, queryParams, pathParams)}\`,
  })
    .then((response) => response.data as TData)
    .catch((error) => {
      throw new Error(error)
    })
}

const resolveUrl = (
  url: string,
  queryParams: Record<string, string> = {},
  pathParams: Record<string, string> = {}
) => {
  let query = new URLSearchParams(queryParams).toString();
  if (query) query = \`?\${query}\`;
  return url.replace(/\\{\\w*\\}/gu, (key) => pathParams[key.slice(1, -1)]) + query;
};
`;
exports.getFetcher = getFetcher;
//# sourceMappingURL=fetcher.js.map