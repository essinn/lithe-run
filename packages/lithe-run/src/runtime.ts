import express, { Request, Response as ExRes, RequestHandler } from "express";
import { watch } from "fs";
import cors from "cors";
import { join, resolve } from "path";
import { readdirSync, existsSync } from "fs";
import { ReactNode } from "react";

let routeContext: {
  req: Request;
  res: ExRes;
  params: any;
  query: any;
  body: any;
  middlewareContext: Map<string, any>;
} | null = null;

const globalContext = new Map<string, any>();

export function useRoute() {
  if (!routeContext) throw new Error("useRoute must be used inside a handler");
  return routeContext;
}
export function useBody() {
  return useRoute().body;
}
export function useParam(name: string) {
  return useRoute().params[name];
}
export function useQuery() {
  return useRoute().query as any;
}
export function useSetContext(key: string, value: any) {
  const map = routeContext ? routeContext.middlewareContext : globalContext;
  map.set(key, value);
}
export function useContext(key: string) {
  if (routeContext) {
    return routeContext.middlewareContext.get(key) ?? globalContext.get(key);
  }
  return globalContext.get(key);
}

export type Middleware = (req: Request, next: () => any) => any;

const ROUTES_ROOT = resolve("api"); // change dir here
let appConfig: { port?: number; cors?: cors.CorsOptions } = {};

/* ----------  file-system walker  ---------- */
interface DiscoveredRoute {
  method: string;
  expressPath: string;
  file: string;
}
const discoveredRoutes: DiscoveredRoute[] = [];

function toExpressPath(filePath: string): string {
  return (
    "/" +
    filePath
      .replace(/\[\.{3}.+\]/g, "*")
      .replace(/\[(.+?)\]/g, ":$1")
      .split("/")
      .filter(Boolean)
      .join("/")
  );
}

function walk(dir: string, urlPrefix = ""): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, join(urlPrefix, entry.name));
    } else if (entry.name === "route.ts" || entry.name === "route.js") {
      const apiSlice = join(urlPrefix, "route").replace(/\\/g, "/");
      discoveredRoutes.push({
        method: "PLACEHOLDER",
        expressPath: toExpressPath(apiSlice.replace(/\/route$/, "")),
        file: full,
      });
    }
  }
}

export function serve(rootElement: ReactNode) {
  if (rootElement && typeof rootElement === "object") {
    const props = (rootElement as any).props || {};
    appConfig.port = props.port || 6969;
    appConfig.cors = props.cors;
  }

  discoveredRoutes.length = 0;
  if (existsSync(ROUTES_ROOT)) walk(ROUTES_ROOT);

  const app = express();
  app.use(express.json());
  if (typeof appConfig.cors === "boolean" && appConfig.cors) {
    app.use(cors({}));
  } else if (appConfig.cors) {
    app.use(cors(appConfig.cors));
  }

  const makeHandler =
    (verb: string, routeFile: string): RequestHandler =>
    async (req, res) => {
      routeContext = {
        req,
        res,
        params: req.params,
        query: req.query,
        body: req.body,
        middlewareContext: new Map(),
      };
      try {
        delete require.cache[routeFile];
        const mod = require(routeFile);
        const handler = mod[verb];
        if (typeof handler !== "function") {
          return res.status(405).json({ error: `Method ${verb} not exported` });
        }
        const output = await handler(req);
        if (!output || output.type !== "Response") {
          return res
            .status(500)
            .json({ error: "Handler must return <Response />" });
        }

        const props = output.props ?? {};
        const status = props.status ?? 200;

        res.status(status);

        if (props.redirect) return res.redirect(props.redirect);

        if (props.headers)
          Object.entries(props.headers).forEach(([k, v]) =>
            res.set(k, v as string | string[] | undefined)
          );

        if (props.json !== undefined) return res.json(props.json);

        if (props.message !== undefined)
          return res.json({ message: props.message });

        if (props.text) return res.type("text").send(props.text);

        if (props.html) return res.type("html").send(props.html);

        return res.send(props.text ?? props.html ?? "");
      } catch (e) {
        console.error(e);
        if (!res.headersSent)
          res.status(500).json({ error: "Internal server error" });
      } finally {
        routeContext = null;
      }
    };

  const byPath: Record<string, string[]> = {};
  for (const r of discoveredRoutes) {
    const verbs = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
      "HEAD",
      "ALL",
    ];
    for (const v of verbs) {
      const mod = require(r.file);
      if (typeof mod[v] !== "function") continue;
      (byPath[r.expressPath] ??= []).push(v);
      const registrar = (app as any)[v.toLowerCase()];
      registrar(r.expressPath, makeHandler(v, r.file));
    }
  }

  /* 405 / 404 */
  app.use((req, res, next) => {
    const allowed = byPath[req.path];
    if (allowed && !allowed.includes(req.method)) {
      res.set("Allow", allowed.join(", "));
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    next();
  });
  app.use((req, res) =>
    res.status(404).json({ error: "Not Found", path: req.path })
  );

  // start server
  const port = appConfig.port || 6969;
  const server = app.listen(port, () => {
    console.log(`🚀 Lithe server up on http://localhost:${port}`);
  });

  /* hot reload */
  if (process.env.NODE_ENV !== "production") {
    watch(ROUTES_ROOT, { recursive: true }, (evt, file) => {
      if (file?.endsWith(".ts") || file?.endsWith(".js")) {
        console.log(`🔄 ${file} changed – restarting…`);
        server.close(() => process.exit(0));
      }
    });
  }
  return server;
}
