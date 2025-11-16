export {
  serve,
  useRoute,
  useSetContext,
  useContext,
  type Middleware as MiddlewareFunction,
} from "./runtime";

import type { CorsOptions } from "cors";

namespace APIJSX {
  export interface Element {
    type: string;
    props: any;
  }
}

export type JSXElement = APIJSX.Element;

export function App({
  children,
  port,
  cors,
}: {
  children?: any;
  port?: number;
  cors?: boolean | CorsOptions;
}): APIJSX.Element {
  return { type: "App", props: { children, port, cors } } as any;
}

interface ResponseProps {
  json?: any;
  status?: number;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  redirect?: string;
}

export function Response(props: ResponseProps): APIJSX.Element {
  return { type: "Response", props } as any;
}

export function Middleware({
  use,
}: {
  use: import("./runtime").Middleware | import("./runtime").Middleware[];
}): APIJSX.Element {
  return { type: "Middleware", props: { use } } as any;
}

interface JSONProps {
  data: any;
  status?: number;
  headers?: Record<string, string>;
}

export function JSON({ data, status, headers }: JSONProps): APIJSX.Element {
  return Response({ json: data, status, headers });
}

interface TextProps {
  text: string;
  status?: number;
  headers?: Record<string, string>;
}

export function Text({ text, status, headers }: TextProps): APIJSX.Element {
  return Response({ text, status, headers });
}

interface HTMLProps {
  html: string;
  status?: number;
  headers?: Record<string, string>;
}

export function HTML({ html, status, headers }: HTMLProps): APIJSX.Element {
  return Response({ html, status, headers });
}

interface RedirectProps {
  to: string;
  status?: number;
}

export function Redirect({ to, status = 302 }: RedirectProps): APIJSX.Element {
  return Response({ redirect: to, status });
}

export function Ok(data: any) {
  return JSON({ data, status: 200 });
}

export function NotFound(message?: string) {
  return JSON({ data: { error: message ?? "Not Found" }, status: 404 });
}
