export {
  serve,
  useRoute,
  useSetContext,
  useContext,
  type Middleware as MiddlewareFunction,
} from "./runtime";

import type { CorsOptions } from "cors";
import React from "react";

export function App({
  children,
  port,
  cors,
}: {
  children?: any;
  port?: number;
  cors?: boolean | CorsOptions;
}): React.ReactElement {
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

export function Response(props: ResponseProps): React.ReactElement {
  return { type: "Response", props } as any;
}

export function Middleware({
  use,
}: {
  use: import("./runtime").Middleware | import("./runtime").Middleware[];
}): React.ReactElement {
  return { type: "Middleware", props: { use } } as any;
}

interface JSONProps {
  data: any;
  status?: number;
  headers?: Record<string, string>;
}

export function JSON({ data, status, headers }: JSONProps): React.ReactElement {
  return Response({ json: data, status, headers });
}

interface TextProps {
  text: string;
  status?: number;
  headers?: Record<string, string>;
}

export function Text({ text, status, headers }: TextProps): React.ReactElement {
  return Response({ text, status, headers });
}

interface HTMLProps {
  html: string;
  status?: number;
  headers?: Record<string, string>;
}

export function HTML({ html, status, headers }: HTMLProps): React.ReactElement {
  return Response({ html, status, headers });
}

interface RedirectProps {
  to: string;
  status?: number;
}

export function Redirect({
  to,
  status = 302,
}: RedirectProps): React.ReactElement {
  return Response({ redirect: to, status });
}

export function Ok(data: any) {
  return JSON({ data, status: 200 });
}

export function NotFound(message?: string) {
  return JSON({ data: { error: message ?? "Not Found" }, status: 404 });
}
