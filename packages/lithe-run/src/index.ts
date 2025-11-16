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
  children, // ignored
  port,
  cors,
}: {
  children?: any;
  port?: number;
  cors?: boolean | CorsOptions;
}): APIJSX.Element {
  return { type: "App", props: { children, port, cors } } as any;
}

interface BackendElement {
  type: string;
  props: Record<string, any>;
}

interface ResponseProps {
  json?: any;
  status?: number;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  redirect?: string;
}

export function Response(props: ResponseProps): BackendElement {
  return { type: "Response", props };
}

export function Middleware({
  use,
}: {
  use: import("./runtime").Middleware | import("./runtime").Middleware[];
}): APIJSX.Element {
  return { type: "Middleware", props: { use } } as any;
}
