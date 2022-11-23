import { camel, pascal } from "case";

/**
 * Get fetcher template
 *
 * @param contextPath import the context from another file
 */
export const getFetcher = ({
  prefix,
  contextPath,
  baseUrl,
}: {
  prefix: string;
  contextPath?: string;
  baseUrl?: string;
}) =>
  `${
    contextPath
      ? `import { ${pascal(prefix)}Context } from "./${contextPath}";`
      : `export type ${pascal(prefix)}FetcherExtraProps = {
      /**
       * You can add some extra props to your generated fetchers.
       * 
       * Note: You need to re-gen after adding the first property to
       * have the \`${pascal(prefix)}FetcherExtraProps\` injected in \`${pascal(
          prefix
        )}Components.ts\`
       **/
    }`
  }
  import axios from "axios";

const baseUrl = ${baseUrl ? `"${baseUrl}"` : `""; // TODO add your baseUrl`}

export type ErrorWrapper<TError> = 
  | TError
  | { status: "unknown"; payload: string };

export type ${pascal(
    prefix
  )}FetcherOptions<TBody, THeaders, TQueryParams, TPathParams> = {
  url: string;
  method: string;
  body?: TBody;
  headers?: THeaders;
  queryParams?: TQueryParams;
  pathParams?: TPathParams;
  signal?: AbortSignal;
} & ${
    contextPath
      ? `${pascal(prefix)}Context["fetcherOptions"];`
      : `${pascal(prefix)}FetcherExtraProps`
  }

export async function ${camel(prefix)}fetch<
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
}: ${pascal(prefix)}FetcherOptions<
  TBody,
  THeaders,
  TQueryParams,
  TPathParams
>): Promise<TData> {
  try {
    const response = await axios({
      method,
      signal,
      data: { body },
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      baseURL: baseUrl,
      url: \`\${resolveUrl(url, queryParams, pathParams)}\`,
    })
    
    if (response.status !== 200) {
      let error: ErrorWrapper<TError>;

      try {
        error = response.data
      } catch (e) {
        error = {
          status: "unknown" as const,
          payload:
            e instanceof Error
              ? \`Unexpected error (\${e.message})\`
              : "Unexpected error"
        };
      }

      throw new Error((error as { payload: string }).payload);
    }

    if (response.headers['content-type']?.includes('json')) {
      return response.data;
    } else {

      // if it is not a json response, assume it is a blob and cast it to TData
      return await response.data as unknown as TData;
      
    }
  } catch (e) {
    throw new Error(e instanceof Error ? \`Network error (\${e.message})\` : 'Network error')
  }
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
