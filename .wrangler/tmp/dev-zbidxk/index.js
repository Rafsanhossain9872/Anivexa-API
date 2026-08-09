var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-KjHfqP/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved2) => resolved2 || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = /* @__PURE__ */ Object.create(null);
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      Object.keys(middleware).forEach((m) => {
        if ((method === METHOD_NAME_ALL || method === m) && !middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      });
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          if (!routes[m][path2]) {
            this.#insertPath(m, path2);
            routes[m][path2] = [
              ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
            ];
          }
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = this.#tries = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = /* @__PURE__ */ Object.create(null);
    const handlerData = [];
    [middleware, routes].forEach((r) => {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
          continue;
        }
        const paramAssoc = pathData[1];
        handlerData[pathData[0]] = handlers.map(([h, paramCount]) => {
          const paramIndexMap = /* @__PURE__ */ Object.create(null);
          paramCount -= 1;
          for (; paramCount >= 0; paramCount--) {
            const [key, value] = paramAssoc[paramCount];
            paramIndexMap[key] = value;
          }
          return [h, paramIndexMap];
        });
      }
    });
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (let i = 0, len = handlerData.length; i < len; i++) {
      for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
        const map = handlerData[i][j]?.[1];
        if (!map) {
          continue;
        }
        const keys = Object.keys(map);
        for (let k = 0, len3 = keys.length; k < len3; k++) {
          map[keys[k]] = paramReplacementMap[map[keys[k]]];
        }
      }
    }
    const handlerMap = [];
    for (const i in indexReplacementMap) {
      handlerMap[i] = handlerData[indexReplacementMap[i]];
    }
    return [regexp, handlerMap, staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "QUERY"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set2(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set2, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set2("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set2("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set2("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set2("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set2("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set2("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(",").map((h) => h.trim());
        }
      }
      if (headers?.length) {
        set2("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// core/anilist.js
var __name2 = /* @__PURE__ */ __name((fn, _) => fn, "__name");
var resolved = /* @__PURE__ */ new Map();
var inflight = /* @__PURE__ */ new Map();
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var ARM = "https://arm.haglund.dev/api/v2/ids";
var JIKAN = "https://api.jikan.moe/v4";
var STATUS_MAP = {
  "Currently Airing": "RELEASING",
  "Finished Airing": "FINISHED",
  "Not yet aired": "NOT_YET_RELEASED",
  "On Hiatus": "HIATUS"
};
var AL_STATUS_MAP = {
  RELEASING: "RELEASING",
  FINISHED: "FINISHED",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  CANCELLED: "FINISHED",
  HIATUS: "HIATUS"
};
async function fetchFromAniList(id) {
  const fullQuery = `query($id:Int){Media(id:$id,type:ANIME){id title{english romaji native} status format episodes seasonYear startDate{year} synonyms nextAiringEpisode{episode airingAt timeUntilAiring}}}`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: fullQuery, variables: { id } })
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const json5 = await res.json();
  return json5.data?.Media ?? null;
}
__name(fetchFromAniList, "fetchFromAniList");
async function getMedia(anilistId) {
  const id = Number(anilistId);
  if (resolved.has(id)) return resolved.get(id);
  if (inflight.has(id)) return inflight.get(id);
  const promise = (async () => {
    const arm = await fetch(`${ARM}?source=anilist&id=${id}`, {
      headers: { "User-Agent": UA, "Accept": "application/json" }
    }).then((r) => {
      if (!r.ok) return null;
      return r.json();
    }).catch(() => null);
    const malId = arm?.myanimelist ?? null;
    if (!malId) {
      const al2 = await fetchFromAniList(id);
      if (!al2) throw new Error(`No data found for AniList ID ${id}`);
      const media2 = {
        id,
        idMal: null,
        title: {
          english: al2.title?.english ?? null,
          romaji: al2.title?.romaji ?? null,
          native: al2.title?.native ?? null
        },
        status: AL_STATUS_MAP[al2.status] ?? "RELEASING",
        format: al2.format ?? null,
        episodes: al2.episodes ?? null,
        seasonYear: al2.seasonYear ?? null,
        startDate: al2.startDate ?? null,
        nextAiringEpisode: al2.nextAiringEpisode ?? null,
        synonyms: Array.isArray(al2.synonyms) ? al2.synonyms : []
      };
      resolved.set(id, media2);
      inflight.delete(id);
      return media2;
    }
    const al = await fetchFromAniList(id).catch(() => null);
    let jikan = null;
    for (let attempt = 0; attempt <= 4; attempt++) {
      const r = await fetch(`${JIKAN}/anime/${malId}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.status === 429) {
        const wait = (parseInt(r.headers.get("Retry-After") ?? "1") || 1) * 1e3 + attempt * 500;
        if (attempt < 4) {
          await new Promise((res) => setTimeout(res, wait));
          continue;
        }
        throw new Error(`Jikan 429 for MAL ID ${malId} (exhausted retries)`);
      }
      if (!r.ok) {
        if (al) break;
        throw new Error(`Jikan ${r.status}`);
      }
      jikan = await r.json();
      break;
    }
    const d = jikan?.data ?? null;
    if (!d && al) {
      const media2 = {
        id,
        idMal: malId,
        title: {
          english: al.title?.english ?? null,
          romaji: al.title?.romaji ?? null,
          native: al.title?.native ?? null
        },
        status: AL_STATUS_MAP[al.status] ?? "RELEASING",
        format: al.format ?? null,
        episodes: al.episodes ?? null,
        seasonYear: al.seasonYear ?? null,
        startDate: al.startDate ?? null,
        nextAiringEpisode: al.nextAiringEpisode ?? null,
        synonyms: Array.isArray(al.synonyms) ? al.synonyms : []
      };
      resolved.set(id, media2);
      inflight.delete(id);
      return media2;
    }
    if (!d) throw new Error(`Jikan returned no data for MAL ID ${malId}`);
    const media = {
      id,
      idMal: malId,
      title: {
        english: al?.title?.english ?? d.title_english ?? null,
        romaji: al?.title?.romaji ?? d.title ?? null,
        native: al?.title?.native ?? d.title_japanese ?? null
      },
      status: AL_STATUS_MAP[al?.status] ?? STATUS_MAP[d.status] ?? "RELEASING",
      format: al?.format ?? d.type ?? null,
      episodes: al?.episodes ?? d.episodes ?? null,
      seasonYear: al?.seasonYear ?? d.year ?? null,
      startDate: al?.startDate ?? (d.aired?.from ? { year: new Date(d.aired.from).getFullYear() } : null),
      nextAiringEpisode: al?.nextAiringEpisode ?? null,
      synonyms: [
        ...d.titles?.map((t) => t.title).filter(Boolean) ?? [],
        ...Array.isArray(al?.synonyms) ? al.synonyms : []
      ]
    };
    resolved.set(id, media);
    inflight.delete(id);
    return media;
  })().catch((e) => {
    inflight.delete(id);
    throw e;
  });
  inflight.set(id, promise);
  return promise;
}
__name(getMedia, "getMedia");
__name2(getMedia, "getMedia");
function forgetMedia(anilistId) {
  resolved.delete(Number(anilistId));
}
__name(forgetMedia, "forgetMedia");

// core/mapper.js
var __name3 = /* @__PURE__ */ __name((fn, _) => fn, "__name");
var ARM2 = "https://arm.haglund.dev/api/v2/ids";
var UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
function hashFranchiseId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}
__name(hashFranchiseId, "hashFranchiseId");
__name3(hashFranchiseId, "hashFranchiseId");
async function fetchARM(anilistId) {
  const res = await fetch(`${ARM2}?source=anilist&id=${anilistId}`, {
    headers: { "User-Agent": UA2, "Accept": "application/json" }
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json().catch(() => null);
}
__name(fetchARM, "fetchARM");
__name3(fetchARM, "fetchARM");
async function fetchAniListRelations(anilistId) {
  const q = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id synonyms
      relations {
        edges {
          relationType(version: 2)
          node {
            id type format title { romaji english native }
            relations {
              edges {
                relationType(version: 2)
                node { id type format title { romaji english native } }
              }
            }
          }
        }
      }
    }
  }`;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
    });
    if (!res.ok) return null;
    const json6 = await res.json();
    return json6.data?.Media ?? null;
  } catch {
    return null;
  }
}
__name(fetchAniListRelations, "fetchAniListRelations");
__name3(fetchAniListRelations, "fetchAniListRelations");
async function mapAnimeIds(anilistId) {
  const [arm, media, alRelations] = await Promise.all([
    fetchARM(anilistId),
    getMedia(anilistId).catch(() => null),
    fetchAniListRelations(anilistId)
  ]);
  const malId = arm?.myanimelist ?? null;
  const format = media?.format ?? null;
  const year = media?.seasonYear ?? null;
  const titleEn = media?.title?.english || null;
  const titleRom = media?.title?.romaji || null;
  const synonyms = [...media?.synonyms ?? []];
  if (alRelations?.synonyms) {
    for (const s of alRelations.synonyms) {
      if (!synonyms.includes(s)) synonyms.push(s);
    }
  }
  const franchiseMap = /* @__PURE__ */ new Map();
  if (alRelations?.relations?.edges) {
    for (const e1 of alRelations.relations.edges) {
      if (!franchiseMap.has(e1.node.id)) {
        franchiseMap.set(e1.node.id, {
          relation: e1.relationType,
          anilistId: e1.node.id,
          title: e1.node.title.romaji || e1.node.title.english,
          type: e1.node.type,
          format: e1.node.format
        });
      }
      if (e1.node.relations?.edges) {
        for (const e2 of e1.node.relations.edges) {
          if (e2.node.id === Number(anilistId)) continue;
          if (!franchiseMap.has(e2.node.id)) {
            franchiseMap.set(e2.node.id, {
              relation: e2.relationType,
              anilistId: e2.node.id,
              title: e2.node.title.romaji || e2.node.title.english,
              type: e2.node.type,
              format: e2.node.format
            });
          }
        }
      }
    }
  }
  const thetvdbId = arm?.thetvdb ?? null;
  const themoviedbId = arm?.themoviedb ?? null;
  const imdbId = arm?.imdb ?? null;
  return {
    mappings: {
      id: Number(anilistId),
      title: titleEn || titleRom,
      type: arm?.media ?? null,
      format,
      episodes: media?.episodes ?? null,
      malId,
      aniId: Number(anilistId),
      anidbId: arm?.anidb ?? null,
      animePlanetId: arm?.["anime-planet"] ?? null,
      kitsuId: arm?.kitsu ?? null,
      animeCountdownId: arm?.animecountdown ?? null,
      anisearchId: arm?.anisearch ?? null,
      notifyMoeId: null,
      simklId: arm?.simkl ?? null,
      imdbId,
      themoviedbId,
      thetvdbId,
      livechartId: arm?.livechart ?? null,
      annId: arm?.animenewsnetwork ?? null,
      animescheduleId: null,
      animethemesId: null,
      animefillerlistId: null,
      franchiseAnchor: thetvdbId ? `tvdb:${thetvdbId}` : null,
      franchiseId: thetvdbId ? hashFranchiseId(`tvdb:${thetvdbId}`) : null,
      defaultTvdbSeason: arm?.["thetvdb-season"] != null ? String(arm["thetvdb-season"]) : null,
      tmdbSeason: arm?.["themoviedb-season"] != null ? String(arm["themoviedb-season"]) : null,
      episodeOffset: null,
      tmdbOffset: null,
      malIds: null,
      aniskip: null,
      animefillerlist: null,
      synonyms,
      franchise: Array.from(franchiseMap.values())
    }
  };
}
__name(mapAnimeIds, "mapAnimeIds");
__name3(mapAnimeIds, "mapAnimeIds");

// providers/allmanga.js
var __name4 = /* @__PURE__ */ __name((fn, _) => fn, "__name");
var UA4 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0";
var API = "https://api.allanime.day";
var REFERER = "https://allmanga.to";
var ANIZIP = "https://api.ani.zip/mappings";
var PASSPHRASE = "Xot36i3lK3:v1";
var TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlYjdkMWM0ZTgwMGUzM2FiMmE3Y2I3NDA5YmM4NjQ2YSIsIm5iZiI6MTc3OTUzMDcxOS40MzIsInN1YiI6IjZhMTE3YmRmYTlhNjNlYmFiOWUzYjc4YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Z9pa96oJEyicf6wAoaKGKJd9ldapeiOdktoJd4xcgLo";
var HASHES = {
  episode: "d405d0edd690624b66baba3068e0edc3ac90f1597d898a1ec8db4e5c43c00fec"
};
var HEX_TABLE = {
  "79": "A",
  "7a": "B",
  "7b": "C",
  "7c": "D",
  "7d": "E",
  "7e": "F",
  "7f": "G",
  "70": "H",
  "71": "I",
  "72": "J",
  "73": "K",
  "74": "L",
  "75": "M",
  "76": "N",
  "77": "O",
  "68": "P",
  "69": "Q",
  "6a": "R",
  "6b": "S",
  "6c": "T",
  "6d": "U",
  "6e": "V",
  "6f": "W",
  "60": "X",
  "61": "Y",
  "62": "Z",
  "59": "a",
  "5a": "b",
  "5b": "c",
  "5c": "d",
  "5d": "e",
  "5e": "f",
  "5f": "g",
  "50": "h",
  "51": "i",
  "52": "j",
  "53": "k",
  "54": "l",
  "55": "m",
  "56": "n",
  "57": "o",
  "48": "p",
  "49": "q",
  "4a": "r",
  "4b": "s",
  "4c": "t",
  "4d": "u",
  "4e": "v",
  "4f": "w",
  "40": "x",
  "41": "y",
  "42": "z",
  "08": "0",
  "09": "1",
  "0a": "2",
  "0b": "3",
  "0c": "4",
  "0d": "5",
  "0e": "6",
  "0f": "7",
  "00": "8",
  "01": "9",
  "15": "-",
  "16": ".",
  "67": "_",
  "46": "~",
  "02": ":",
  "17": "/",
  "07": "?",
  "1b": "#",
  "63": "[",
  "65": "]",
  "78": "@",
  "19": "!",
  "1c": "$",
  "1e": "&",
  "10": "(",
  "11": ")",
  "12": "*",
  "13": "+",
  "14": ",",
  "03": ";",
  "05": "=",
  "1d": "%"
};
var _aesKey = null;
async function getAESKey() {
  if (_aesKey) return _aesKey;
  const raw2 = new TextEncoder().encode(PASSPHRASE);
  const hash = await crypto.subtle.digest("SHA-256", raw2);
  _aesKey = await crypto.subtle.importKey("raw", hash, { name: "AES-CTR" }, false, ["decrypt"]);
  return _aesKey;
}
__name(getAESKey, "getAESKey");
__name4(getAESKey, "getAESKey");
async function decryptTobeparsed(b64) {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv12 = buf.slice(1, 13);
  const counter = new Uint8Array(16);
  counter.set(iv12, 0);
  counter[12] = 0;
  counter[13] = 0;
  counter[14] = 0;
  counter[15] = 2;
  const ctLen = buf.length - 13 - 16;
  const ciphertext = buf.slice(13, 13 + ctLen);
  const key = await getAESKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CTR", counter, length: 32 },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plain);
}
__name(decryptTobeparsed, "decryptTobeparsed");
__name4(decryptTobeparsed, "decryptTobeparsed");
function decodeHexUrl(hex) {
  let out = "";
  for (let i = 0; i < hex.length; i += 2) {
    const pair = hex.substring(i, i + 2).toLowerCase();
    out += HEX_TABLE[pair] ?? pair;
  }
  return out;
}
__name(decodeHexUrl, "decodeHexUrl");
__name4(decodeHexUrl, "decodeHexUrl");
function hexToBytes(hex) {
  const c = hex.replace(/[^0-9a-f]/gi, "");
  const b = new Uint8Array(c.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(c.slice(i * 2, i * 2 + 2), 16);
  return b;
}
__name(hexToBytes, "hexToBytes");
__name4(hexToBytes, "hexToBytes");
async function aesDecrypt(hex) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode("kiemtienmua911ca"),
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: new TextEncoder().encode("1234567890oiuytr") },
    key,
    hexToBytes(hex)
  );
  return new TextDecoder().decode(plain);
}
__name(aesDecrypt, "aesDecrypt");
__name4(aesDecrypt, "aesDecrypt");
async function extractMp4(id) {
  try {
    const r = await fetch(`https://www.mp4upload.com/embed-${id}.html`, {
      headers: { "User-Agent": UA4, Referer: "https://allanime.to/" }
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m = h.match(/player\.src\s*\(\s*\{[^}]*\bsrc\s*:\s*"([^"]+)"/) || h.match(/"file"\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/) || h.match(/\bsrc\s*:\s*"(https?:[^"]+\.mp4[^"]*)"/);
    return m?.[1]?.replace(/\\/g, "") || null;
  } catch {
    return null;
  }
}
__name(extractMp4, "extractMp4");
__name4(extractMp4, "extractMp4");
async function extractUns(id) {
  try {
    const base = "https://allanime.uns.bio";
    const r = await fetch(`${base}/api/v1/video?id=${id}&w=1280&h=720&r=`, {
      headers: { "User-Agent": UA4, Referer: `${base}/#${id}`, Origin: base }
    });
    if (!r.ok) return null;
    const hex = (await r.text()).trim();
    if (!hex || !/^[0-9a-f]+$/i.test(hex)) return null;
    const p = JSON.parse(await aesDecrypt(hex));
    return p.source || p.cf || null;
  } catch {
    return null;
  }
}
__name(extractUns, "extractUns");
__name4(extractUns, "extractUns");
async function extractOk(id) {
  try {
    const r = await fetch(`https://ok.ru/videoembed/${id}`, {
      headers: { "User-Agent": UA4, Referer: "https://ok.ru/" }
    });
    if (!r.ok) return null;
    const h = await r.text();
    const m = h.match(/ondemandHls\\&quot;:\\&quot;(https?:\/\/.*?)\\&quot;/);
    if (!m) return null;
    return m[1].replace(/\\u0026/g, "&");
  } catch {
    return null;
  }
}
__name(extractOk, "extractOk");
__name4(extractOk, "extractOk");
async function extractStreamSB(id) {
  try {
    const baseHeaders = {
      "User-Agent": UA4,
      "Referer": "https://allmanga.to/",
      "watchsb": "streamsb",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9"
    };
    const r1 = await fetch(`https://streamsb.net/api/v1/video?id=${id}`, { headers: baseHeaders });
    const sid = (r1.headers.get("set-cookie") || "").match(/sid=([^;]+)/)?.[1] ?? "";
    const html1 = await r1.text();
    const m = html1.match(/window\.location\.replace\('([^']+)'\)/);
    if (!m) return null;
    const r2 = await fetch(m[1], {
      headers: { ...baseHeaders, "Cookie": `sid=${sid}`, "Referer": `https://streamsb.net/e/${id}.html` }
    });
    if (!r2.ok) return null;
    const ct = r2.headers.get("content-type") ?? "";
    if (!ct.includes("json")) return null;
    const data = await r2.json();
    return data?.stream_data?.file ?? data?.data?.file ?? null;
  } catch {
    return null;
  }
}
__name(extractStreamSB, "extractStreamSB");
__name4(extractStreamSB, "extractStreamSB");
async function extractStreamlare(id) {
  try {
    const r = await fetch("https://streamlare.com/api/video/stream/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA4,
        "Referer": "https://streamlare.com/",
        "Origin": "https://streamlare.com",
        "Accept": "application/json, */*"
      },
      body: JSON.stringify({ id })
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.data?.file ?? null;
  } catch {
    return null;
  }
}
__name(extractStreamlare, "extractStreamlare");
__name4(extractStreamlare, "extractStreamlare");
function embedMediaType(url) {
  if (!url) return null;
  if (url.includes(".m3u8")) return "hls";
  if (url.includes(".mp4")) return "mp4";
  return "direct";
}
__name(embedMediaType, "embedMediaType");
__name4(embedMediaType, "embedMediaType");
async function apiFetch(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA4, "Referer": REFERER, "Origin": REFERER }
  });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`API ${res.status}`);
    _e.rawBody = _raw;
    throw _e;
  }
  const json6 = await res.json();
  if (json6?.data?.tobeparsed) {
    const decrypted = await decryptTobeparsed(json6.data.tobeparsed);
    json6.data = JSON.parse(decrypted);
  }
  return json6.data;
}
__name(apiFetch, "apiFetch");
__name4(apiFetch, "apiFetch");
function buildApiUrl(variables, hash) {
  const v = encodeURIComponent(JSON.stringify(variables));
  const e = encodeURIComponent(JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }));
  return `${API}/api?variables=${v}&extensions=${e}`;
}
__name(buildApiUrl, "buildApiUrl");
__name4(buildApiUrl, "buildApiUrl");
async function apiPost(query, variables) {
  const res = await fetch(`${API}/api`, {
    method: "POST",
    headers: {
      "User-Agent": UA4,
      "Referer": REFERER,
      "Origin": REFERER,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ variables, query })
  });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`API POST ${res.status}`);
    _e.rawBody = _raw;
    throw _e;
  }
  const json6 = await res.json();
  if (json6?.data?.tobeparsed) {
    const decrypted = await decryptTobeparsed(json6.data.tobeparsed);
    json6.data = JSON.parse(decrypted);
  }
  return json6.data;
}
__name(apiPost, "apiPost");
__name4(apiPost, "apiPost");
async function searchAllAnime(query, mode = "sub") {
  const gql = `query($search:SearchInput $limit:Int $page:Int $translationType:VaildTranslationTypeEnumType $countryOrigin:VaildCountryOriginEnumType){shows(search:$search limit:$limit page:$page translationType:$translationType countryOrigin:$countryOrigin){edges{_id name englishName nativeName availableEpisodes availableEpisodesDetail aniListId __typename}}}`;
  const data = await apiPost(gql, {
    search: { allowAdult: false, allowUnknown: false, query },
    limit: 40,
    page: 1,
    translationType: mode,
    countryOrigin: "ALL"
  });
  return data?.shows?.edges ?? [];
}
__name(searchAllAnime, "searchAllAnime");
__name4(searchAllAnime, "searchAllAnime");
async function getEpisodeSources(showId, epNum, audio = "sub") {
  const url = buildApiUrl(
    { showId, translationType: audio, episodeString: String(epNum) },
    HASHES.episode
  );
  const data = await apiFetch(url);
  return data?.episode ?? null;
}
__name(getEpisodeSources, "getEpisodeSources");
__name4(getEpisodeSources, "getEpisodeSources");
async function fetchAniZip(anilistId) {
  const res = await fetch(`${ANIZIP}?anilist_id=${anilistId}`);
  if (!res.ok) return null;
  return res.json();
}
__name(fetchAniZip, "fetchAniZip");
__name4(fetchAniZip, "fetchAniZip");
function normalize(s) {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}
__name(normalize, "normalize");
__name4(normalize, "normalize");
function extractYear(title2) {
  if (!title2) return null;
  const m = title2.match(/\b(19\d{2}|20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}
__name(extractYear, "extractYear");
__name4(extractYear, "extractYear");
function findBestMatch(results, titles, targetYear, targetId) {
  const normalizedTitles = titles.map(normalize).filter(Boolean);
  let bestShow = null;
  let maxScore = -Infinity;
  for (const r of results) {
    if (targetId && r.aniListId && String(r.aniListId) === String(targetId)) {
      return r;
    }
    const names = [r.name, r.englishName, r.nativeName].map(normalize).filter(Boolean);
    let nameScore = 0;
    let isExact = false;
    for (const n of names) {
      if (normalizedTitles.includes(n)) {
        nameScore = 100;
        isExact = true;
        break;
      }
    }
    if (!isExact) {
      let maxFuzzy = 0;
      for (const rName of names) {
        for (const t of normalizedTitles) {
          if (t.includes(rName) || rName.includes(t)) {
            const score = Math.min(rName.length, t.length);
            const lengthPenalty = Math.abs(rName.length - t.length) * 0.1;
            const finalFuzzy = score - lengthPenalty;
            if (finalFuzzy > maxFuzzy) maxFuzzy = finalFuzzy;
          }
        }
      }
      nameScore = maxFuzzy;
    }
    let yearScore = 0;
    const rYear = extractYear(r.name) || extractYear(r.englishName) || extractYear(r.nativeName);
    if (targetYear && rYear) {
      yearScore = rYear === targetYear ? 50 : -200;
    }
    const totalScore = nameScore + yearScore;
    if (totalScore > maxScore) {
      maxScore = totalScore;
      bestShow = r;
    }
  }
  return bestShow || results[0];
}
__name(findBestMatch, "findBestMatch");
__name4(findBestMatch, "findBestMatch");
async function fetchAniListMedia(anilistId) {
  try {
    const q = "query ($id: Int) { Media (id: $id, type: ANIME) { seasonYear startDate { year } title { romaji english native } } }";
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": UA4,
        "Origin": "https://anilist.co"
      },
      body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
    });
    if (!res.ok) return null;
    const json6 = await res.json();
    return json6.data?.Media ?? null;
  } catch (e) {
    console.error("AniList titles fetch failed:", e);
    return null;
  }
}
__name(fetchAniListMedia, "fetchAniListMedia");
__name4(fetchAniListMedia, "fetchAniListMedia");
async function resolveAllAnimeId(anilistId, ctx = {}) {
  const [anizipRes, alMedia] = await Promise.all([
    ctx.anizip ? Promise.resolve(ctx.anizip) : fetchAniZip(anilistId).catch(() => ({})),
    ctx.media ? Promise.resolve({
      title: ctx.media.title,
      seasonYear: ctx.media.seasonYear,
      startDate: ctx.media.startDate
    }) : fetchAniListMedia(anilistId).catch(() => null)
  ]);
  const anizip = anizipRes || {};
  let titlesToTry = [];
  if (anizip.titles) {
    titlesToTry = [
      anizip.titles.en,
      anizip.titles.ja,
      anizip.titles["x-jat"],
      ...Object.values(anizip.titles)
    ].filter(Boolean);
  }
  if (alMedia?.title) {
    const alTitles = [alMedia.title.english, alMedia.title.romaji, alMedia.title.native].filter(Boolean);
    titlesToTry = [.../* @__PURE__ */ new Set([...alTitles, ...titlesToTry])];
  }
  if (!titlesToTry.length && anizip.mappings) {
    const apId = anizip.mappings.animeplanet_id;
    if (apId) {
      const cleanApTitle = apId.split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      titlesToTry = [cleanApTitle];
    }
  }
  if (!titlesToTry.length) {
    throw new Error(`Could not resolve titles for AniList ID: ${anilistId}`);
  }
  const targetYear = alMedia?.seasonYear || alMedia?.startDate?.year || null;
  let allResults = [];
  for (const title2 of titlesToTry.slice(0, 3)) {
    const results = await searchAllAnime(title2, "sub");
    allResults.push(...results);
  }
  const seen = /* @__PURE__ */ new Set();
  allResults = allResults.filter((r) => {
    if (seen.has(r._id)) return false;
    seen.add(r._id);
    return true;
  });
  if (!allResults.length) {
    throw new Error(`No AllAnime match for "${titlesToTry[0]}"`);
  }
  const match2 = findBestMatch(allResults, titlesToTry, targetYear, anilistId);
  return { showId: match2._id, show: match2, anizip };
}
__name(resolveAllAnimeId, "resolveAllAnimeId");
__name4(resolveAllAnimeId, "resolveAllAnimeId");
async function fetchAniListFull(anilistId) {
  const q = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      synonyms
      format
      episodes
      seasonYear
      startDate { year }
      type
      relations {
        edges { relationType(version: 2) node { id type format title { romaji english native } } }
      }
    }
  }`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA4, "Origin": "https://anilist.co" },
    body: JSON.stringify({ query: q, variables: { id: Number(anilistId) } })
  });
  if (!res.ok) throw new Error("AniList fetch failed");
  const json6 = await res.json();
  return json6.data?.Media;
}
__name(fetchAniListFull, "fetchAniListFull");
__name4(fetchAniListFull, "fetchAniListFull");
async function fetchKitsuId(malId) {
  if (!malId) return null;
  try {
    const res = await fetch(`https://kitsu.io/api/edge/mappings?filter[externalSite]=myanimelist/anime&filter[externalId]=${malId}`);
    const json6 = await res.json();
    const mapping = json6.data?.[0];
    if (mapping && mapping.relationships?.item?.links?.related) {
      const itemRes = await fetch(mapping.relationships.item.links.related);
      const itemJson = await itemRes.json();
      return itemJson.data?.id ? Number(itemJson.data.id) : null;
    }
  } catch (e) {
    console.error("Kitsu Error:", e);
  }
  return null;
}
__name(fetchKitsuId, "fetchKitsuId");
__name4(fetchKitsuId, "fetchKitsuId");
async function fetchTMDB(titles, year, format) {
  let tmdbType = format === "MOVIE" || format === "OVA" || format === "SPECIAL" ? "movie" : "tv";
  let result = null;
  for (const title2 of titles) {
    if (!title2) continue;
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/${tmdbType}?query=${encodeURIComponent(title2)}&first_air_date_year=${year}&year=${year}`;
      const res = await fetch(searchUrl, {
        headers: { "Authorization": `Bearer ${TMDB_TOKEN}`, "Accept": "application/json" }
      });
      const json6 = await res.json();
      if (json6.results && json6.results.length > 0) {
        result = json6.results[0];
        break;
      }
    } catch (e) {
      console.error("TMDB Search Error:", e);
    }
  }
  if (!result) return { themoviedbId: null, imdbId: null, thetvdbId: null };
  let externalIds = {};
  try {
    const extUrl = `https://api.themoviedb.org/3/${tmdbType}/${result.id}/external_ids`;
    const extRes = await fetch(extUrl, {
      headers: { "Authorization": `Bearer ${TMDB_TOKEN}`, "Accept": "application/json" }
    });
    externalIds = await extRes.json();
  } catch (e) {
    console.error("TMDB External IDs Error:", e);
  }
  return {
    themoviedbId: result.id,
    imdbId: externalIds.imdb_id || null,
    thetvdbId: externalIds.tvdb_id || null
  };
}
__name(fetchTMDB, "fetchTMDB");
__name4(fetchTMDB, "fetchTMDB");
async function handleMap(anilistId) {
  const al = await fetchAniListFull(anilistId);
  if (!al) throw new Error("AniList entry not found");
  const year = al.seasonYear || al.startDate?.year;
  const titlesToSearch = [al.title.english, al.title.romaji, al.title.native].filter(Boolean);
  const [kitsuId, tmdbData] = await Promise.all([
    fetchKitsuId(al.idMal),
    fetchTMDB(titlesToSearch, year, al.format)
  ]);
  return {
    mappings: {
      id: Number(anilistId),
      title: al.title.english || al.title.romaji,
      type: al.type,
      format: al.format,
      episodes: al.episodes,
      malId: al.idMal,
      aniId: Number(anilistId),
      anidbId: null,
      animePlanetId: null,
      kitsuId,
      imdbId: tmdbData.imdbId,
      themoviedbId: tmdbData.themoviedbId,
      thetvdbId: tmdbData.thetvdbId,
      livechartId: null,
      annId: null,
      synonyms: al.synonyms || [],
      franchise: al.relations?.edges?.map((e) => ({
        relation: e.relationType,
        id: e.node.id,
        title: e.node.title.romaji || e.node.title.english,
        type: e.node.type,
        format: e.node.format
      })) || []
    }
  };
}
__name(handleMap, "handleMap");
__name4(handleMap, "handleMap");
async function handleEpisodes2(anilistId) {
  const { showId, show, anizip } = await resolveAllAnimeId(anilistId);
  const epDetail = show.availableEpisodesDetail || {};
  const subEps = (epDetail.sub || []).map(Number).sort((a, b) => a - b);
  const dubEps = (epDetail.dub || []).map(Number).sort((a, b) => a - b);
  const buildEpList = __name4((nums, audio) => nums.map((n) => {
    const meta = anizip.episodes?.[String(n)] ?? {};
    return {
      id: `watch/allmanga/${anilistId}/${audio}/allmanga-${n}`,
      number: n,
      title: meta.title?.en || meta.title?.["x-jat"] || `Episode ${n}`,
      duration: meta.runtime ?? meta.length ?? 0,
      audio,
      filler: meta.filler ?? false,
      uncensored: false,
      description: meta.overview || meta.summary || "",
      image: meta.image || anizip.images?.cover || "",
      airDate: meta.airdate || meta.aired || ""
    };
  }), "buildEpList");
  return {
    anilistId: Number(anilistId),
    allAnimeId: showId,
    title: show.englishName || show.name,
    sub: buildEpList(subEps, "sub"),
    dub: buildEpList(dubEps, "dub")
  };
}
__name(handleEpisodes2, "handleEpisodes2");
__name4(handleEpisodes2, "handleEpisodes");
async function handleWatch2(anilistId, audio, epNum) {
  const { showId, anizip } = await resolveAllAnimeId(anilistId);
  const episode = await getEpisodeSources(showId, epNum, audio);
  if (!episode) throw new Error("Episode not found");
  const sources = await Promise.all((episode.sourceUrls || []).map(async (src) => {
    let url = src.sourceUrl;
    if (url && url.startsWith("--")) url = decodeHexUrl(url.slice(2));
    if (url && url.startsWith("/apivtwo/clock")) {
      url = "https://allanime.day" + url.replace("/clock", "/clock.json");
    }
    let extractedUrl = null;
    const name = src.sourceName || "";
    if (url?.includes("mp4upload.com")) {
      const m = url.match(/embed-([a-zA-Z0-9]+)\.html/);
      if (m?.[1]) extractedUrl = await extractMp4(m[1]);
    } else if (url?.includes("allanime.uns.bio")) {
      const id = url.split("#").pop();
      if (id && id.length > 2) extractedUrl = await extractUns(id);
    } else if (url?.includes("ok.ru")) {
      const id = url.split("/").pop();
      if (id) extractedUrl = await extractOk(id);
    } else if (url?.includes("streamsb.net")) {
      const m = url.match(/\/(?:e\/|embed-)([a-zA-Z0-9]+)(?:\.html)?/);
      if (m?.[1]) extractedUrl = await extractStreamSB(m[1]);
    } else if (url?.includes("streamlare.com")) {
      const m = url.match(/\/e\/([a-zA-Z0-9]+)/);
      if (m?.[1]) extractedUrl = await extractStreamlare(m[1]);
    }
    return {
      name,
      url,
      extractedUrl,
      extractedType: embedMediaType(extractedUrl),
      type: src.type,
      priority: src.priority,
      headers: {
        "Referer": "https://allmanga.to",
        "User-Agent": UA4
      },
      downloads: src.downloads || null
    };
  }));
  sources.sort((a, b) => b.priority - a.priority);
  const epMeta = anizip?.episodes?.[String(epNum)] ?? {};
  const intro = epMeta.intro ?? null;
  const outro = epMeta.outro ?? null;
  return {
    anilistId: Number(anilistId),
    allAnimeId: showId,
    episode: Number(epNum),
    audio,
    intro,
    outro,
    sources
  };
}
__name(handleWatch2, "handleWatch2");
__name4(handleWatch2, "handleWatch");
function json2(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
}
__name(json2, "json2");
__name4(json2, "json");
function matchRoute(pathname) {
  let m = pathname.match(/^\/episodes\/(\d+)\/?$/);
  if (m) return { handler: "episodes", anilistId: m[1] };
  m = pathname.match(/^\/watch\/allmanga\/(\d+)\/(sub|dub)\/allmanga-(\d+)\/?$/);
  if (m) return { handler: "watch", anilistId: m[1], audio: m[2], ep: m[3] };
  m = pathname.match(/^\/map\/(\d+)\/?$/);
  if (m) return { handler: "map", anilistId: m[1] };
  return null;
}
__name(matchRoute, "matchRoute");
__name4(matchRoute, "matchRoute");
var allmanga_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const route = matchRoute(url.pathname);
    if (!route) {
      return json2({
        error: "Not found",
        routes: [
          "GET /episodes/:anilistId",
          "GET /watch/allmanga/:anilistId/:audio/allmanga-:ep",
          "GET /map/:anilistId"
        ]
      }, 404);
    }
    try {
      if (route.handler === "map") {
        const data = await handleMap(route.anilistId);
        return json2(data);
      }
      if (route.handler === "episodes") {
        const data = await handleEpisodes2(route.anilistId);
        return json2(data);
      }
      if (route.handler === "watch") {
        const data = await handleWatch2(route.anilistId, route.audio, route.ep);
        return json2(data);
      }
    } catch (err) {
      return json2({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};
async function getEpisodes2(anilistId, ctx = {}) {
  const { showId, show, anizip } = await resolveAllAnimeId(anilistId, ctx);
  const epDetail = show.availableEpisodesDetail || {};
  const subEps = (epDetail.sub || []).map(Number).sort((a, b) => a - b);
  const dubEps = (epDetail.dub || []).map(Number).sort((a, b) => a - b);
  const buildList = __name4((nums, audio) => nums.map((n) => {
    const meta = anizip.episodes?.[String(n)] ?? {};
    return {
      id: `watch/allmanga/${anilistId}/${audio}/allmanga-${n}`,
      number: n,
      title: meta.title?.en || meta.title?.["x-jat"] || null,
      duration: meta.runtime ?? meta.length ?? 0,
      audio,
      filler: meta.filler ?? false,
      uncensored: false,
      description: meta.overview || meta.summary || null,
      image: meta.image || anizip.images?.cover || null,
      airDate: meta.airdate || meta.aired || null
    };
  }), "buildList");
  return {
    meta: {
      id: showId,
      title: show.englishName || show.name
    },
    episodes: {
      sub: buildList(subEps, "sub"),
      dub: buildList(dubEps, "dub"),
      raw: []
    }
  };
}
__name(getEpisodes2, "getEpisodes2");
__name4(getEpisodes2, "getEpisodes");
var allmanga_default2 = allmanga_default;

// core/smartcache.js
var _CACHE_ENABLED = false;
var UPSTASH_REDIS_REST_URL = "YOUR_UPSTASH_REDIS_REST_URL";
var UPSTASH_REDIS_REST_TOKEN = "YOUR_UPSTASH_REDIS_REST_TOKEN";
var REDIS_ENABLED = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
function encodeEntry(entry) {
  return JSON.stringify(entry, (_, value) => value === Infinity ? "__Infinity__" : value);
}
__name(encodeEntry, "encodeEntry");
function decodeEntry(raw2) {
  return JSON.parse(raw2, (_, value) => value === "__Infinity__" ? Infinity : value);
}
__name(decodeEntry, "decodeEntry");
async function redisCommand(command) {
  if (!REDIS_ENABLED || typeof fetch !== "function") return null;
  const res = await fetch(UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  }).catch(() => null);
  if (!res?.ok) return null;
  const json5 = await res.json().catch(() => null);
  return json5?.result ?? null;
}
__name(redisCommand, "redisCommand");
async function redisWrite(key, entry) {
  if (!REDIS_ENABLED) return;
  const value = encodeEntry(entry);
  if (Number.isFinite(entry.ttl) && entry.ttl > 0) {
    await redisCommand(["SET", key, value, "PX", Math.ceil(entry.ttl)]);
    return;
  }
  await redisCommand(["SET", key, value]);
}
__name(redisWrite, "redisWrite");
var diskRead = /* @__PURE__ */ __name(() => null, "diskRead");
var diskWrite = /* @__PURE__ */ __name(() => {
}, "diskWrite");
var diskDel = /* @__PURE__ */ __name(() => {
}, "diskDel");
var MAX_MEM = 800;
var mem = /* @__PURE__ */ new Map();
function evict() {
  if (mem.size <= MAX_MEM) return;
  const drop = mem.size - MAX_MEM;
  let n = 0;
  for (const k of mem.keys()) {
    if (n++ >= drop) break;
    mem.delete(k);
  }
}
__name(evict, "evict");
function get(key) {
  if (!_CACHE_ENABLED) return null;
  let e = mem.get(key);
  if (e) return e;
  e = diskRead(key);
  if (!e) return null;
  mem.set(key, e);
  evict();
  return e;
}
__name(get, "get");
async function getAsync(key) {
  if (!_CACHE_ENABLED) return null;
  let e = get(key);
  if (e) return e;
  const raw2 = await redisCommand(["GET", key]);
  if (!raw2) return null;
  try {
    e = typeof raw2 === "string" ? decodeEntry(raw2) : raw2;
    if (!isFresh(e)) {
      await delAsync(key);
      return null;
    }
    mem.set(key, e);
    evict();
    diskWrite(key, e);
    return e;
  } catch {
    return null;
  }
}
__name(getAsync, "getAsync");
function setLocal(key, data, ttlMs, refreshAfterMs) {
  const now = Date.now();
  const entry = {
    data,
    cachedAt: now,
    ttl: ttlMs,
    refreshAfter: refreshAfterMs ?? ttlMs,
    expiresAt: now + ttlMs
  };
  mem.delete(key);
  mem.set(key, entry);
  evict();
  diskWrite(key, entry);
  return entry;
}
__name(setLocal, "setLocal");
function set(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  redisWrite(key, entry).catch(() => {
  });
  return entry;
}
__name(set, "set");
async function setAsync(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  await redisWrite(key, entry);
  return entry;
}
__name(setAsync, "setAsync");
function isFresh(entry) {
  return entry !== null && entry !== void 0 && Date.now() < entry.expiresAt;
}
__name(isFresh, "isFresh");
function needsRefresh(entry) {
  return !entry || Date.now() - entry.cachedAt > entry.refreshAfter;
}
__name(needsRefresh, "needsRefresh");
function delLocal(key) {
  mem.delete(key);
  diskDel(key);
}
__name(delLocal, "delLocal");
async function delAsync(key) {
  delLocal(key);
  await redisCommand(["DEL", key]);
}
__name(delAsync, "delAsync");
function delByPrefix(prefix) {
  for (const k of [...mem.keys()]) {
    if (k.startsWith(prefix)) mem.delete(k);
  }
}
__name(delByPrefix, "delByPrefix");
async function delByPrefixAsync(prefix) {
  delByPrefix(prefix);
  const keys = await redisCommand(["KEYS", `${prefix}*`]);
  if (Array.isArray(keys) && keys.length) {
    await redisCommand(["DEL", ...keys]);
  }
}
__name(delByPrefixAsync, "delByPrefixAsync");
var MIN = 6e4;
var HOUR = 60 * MIN;
var DAY = 24 * HOUR;
function episodeTTL(status) {
  switch (status) {
    case "FINISHED":
      return [7 * DAY, Infinity];
    case "RELEASING":
      return [2 * HOUR, 15 * MIN];
    case "HIATUS":
      return [6 * HOUR, 60 * MIN];
    case "NOT_YET_RELEASED":
      return [30 * MIN, 15 * MIN];
    default:
      return [HOUR, 15 * MIN];
  }
}
__name(episodeTTL, "episodeTTL");
function jikanPageTTL(isLastPage, status) {
  if (!isLastPage || status === "FINISHED") return [7 * DAY, Infinity];
  switch (status) {
    case "RELEASING":
      return [2 * HOUR, 15 * MIN];
    case "HIATUS":
      return [6 * HOUR, 60 * MIN];
    case "NOT_YET_RELEASED":
      return [30 * MIN, 15 * MIN];
    default:
      return [2 * HOUR, 15 * MIN];
  }
}
__name(jikanPageTTL, "jikanPageTTL");
function mapTTL(status) {
  return status === "FINISHED" ? 30 * DAY : 12 * HOUR;
}
__name(mapTTL, "mapTTL");
var WATCH_TTL = 3 * HOUR;
var SHOW_IDENTITY_TTL = 24 * HOUR;
var THIRTY_DAYS = 30 * DAY;

// core/new-provider-utils.js
var UA3 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var RELATION_FRAGMENT = `edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes relations{edges{relationType(version:2) node{id type episodes}}}}}}}}}}}`;
async function fetchHtml(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA3,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      ...headers
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}
__name(fetchHtml, "fetchHtml");
function decodeEntities(s = "") {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
__name(decodeEntities, "decodeEntities");
function stripTags(html = "") {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}
__name(stripTags, "stripTags");
function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return m ? decodeEntities(m[1]) : "";
}
__name(attr, "attr");
function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
__name(norm, "norm");
function diceCoeff(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;
  const bigrams = /* @__PURE__ */ new Map();
  for (let i = 0; i < na.length - 1; i++) {
    const bg2 = na.slice(i, i + 2);
    bigrams.set(bg2, (bigrams.get(bg2) ?? 0) + 1);
  }
  let hits = 0;
  for (let i = 0; i < nb.length - 1; i++) {
    const bg2 = nb.slice(i, i + 2);
    const count = bigrams.get(bg2) ?? 0;
    if (count > 0) {
      hits++;
      bigrams.set(bg2, count - 1);
    }
  }
  return 2 * hits / (na.length + nb.length - 2);
}
__name(diceCoeff, "diceCoeff");
function titleScore(query, candidate, slug) {
  const base = Math.max(diceCoeff(query, candidate), diceCoeff(query, slug.replace(/-/g, " ")));
  const queryFirstNum = norm(query).match(/\d+/)?.[0] ?? "";
  const slugFirstNum = slug.match(/\d+/)?.[0] ?? "";
  if (queryFirstNum && slugFirstNum && queryFirstNum !== slugFirstNum) return base * 0.65;
  if (queryFirstNum && !slugFirstNum) return base * 0.65;
  if (!queryFirstNum && slugFirstNum) {
    const n = parseInt(slugFirstNum);
    if (n > 1 && n < 1900) return base * (1 - 0.06 * (n - 1));
  }
  const isMovieQuery = /\b(movie|film|the movie)\b/i.test(query);
  const isMovieMatch = /\b(movie|film)\b/i.test(candidate) || /movie|film/.test(slug);
  if (isMovieQuery && !isMovieMatch) return base * 0.4;
  const qLen = norm(query).length;
  const sLen = norm(slug.replace(/-/g, " ")).length;
  return sLen > qLen * 1.6 + 4 ? base * 0.8 : base;
}
__name(titleScore, "titleScore");
function buildSearchQueries(title) {
  const queries = /* @__PURE__ */ new Set([title]);
  const words = title.trim().split(/\s+/);
  if (words.length > 4) queries.add(words.slice(0, 4).join(" "));
  if (words.length > 3) queries.add(words.slice(0, 3).join(" "));
  const stripped = title.replace(/\bseason\s*\d+\b/gi, "").replace(/\bpart\s*\d+\b/gi, "").replace(/\b\d+rd\b|\b\d+th\b|\b\d+st\b|\b\d+nd\b/gi, "").replace(/\s+/g, " ").trim();
  if (stripped && stripped !== title) queries.add(stripped);
  return [...queries].filter((q) => q.length >= 3);
}
__name(buildSearchQueries, "buildSearchQueries");
async function findTopSlugs(titles, searchFn3, n = 6) {
  const allCandidates = /* @__PURE__ */ new Map();
  const searchQueries2 = /* @__PURE__ */ new Set();
  for (const title of titles.slice(0, 4)) {
    for (const q of buildSearchQueries(title)) searchQueries2.add(q);
  }
  await Promise.all([...searchQueries2].map(async (q) => {
    try {
      const results = await searchFn3(q);
      for (const r of results) if (!allCandidates.has(r.slug)) allCandidates.set(r.slug, r.text);
    } catch {
    }
  }));
  const scored = [];
  for (const [slug, text] of allCandidates) {
    let best = 0;
    for (const title of titles.slice(0, 2)) best = Math.max(best, titleScore(title, text, slug));
    if (best >= 0.5) scored.push({ slug, title: text, score: best });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}
__name(findTopSlugs, "findTopSlugs");
async function anilistQuery(query, variables) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json5 = await res.json();
  if (json5.errors?.length) throw new Error(`AniList: ${json5.errors[0].message}`);
  return json5.data;
}
__name(anilistQuery, "anilistQuery");
function computePrequelOffset(relations, depth = 0) {
  if (!relations || depth > 5) return 0;
  const prequelEdge = relations.edges?.find(
    (e) => e.relationType === "PREQUEL" && e.node.type === "ANIME" && (e.node.episodes ?? 0) >= 5
  );
  if (!prequelEdge) return 0;
  return (prequelEdge.node.episodes ?? 0) + computePrequelOffset(prequelEdge.node.relations, depth + 1);
}
__name(computePrequelOffset, "computePrequelOffset");
async function getPrequelOffset(anilistId) {
  const key = `np-offset:${anilistId}`;
  const entry = get(key);
  if (isFresh(entry)) return entry.data;
  const data = await anilistQuery(
    `query($id:Int){Media(id:$id,type:ANIME){relations{${RELATION_FRAGMENT}}}}`,
    { id: Number(anilistId) }
  );
  const offset = computePrequelOffset(data?.Media?.relations);
  set(key, offset, SHOW_IDENTITY_TTL);
  return offset;
}
__name(getPrequelOffset, "getPrequelOffset");
function buildTitles(media, anizip) {
  return [
    media?.title?.english,
    media?.title?.romaji,
    media?.title?.native,
    ...media?.synonyms ?? [],
    anizip?.titles?.en,
    anizip?.titles?.["x-jat"],
    anizip?.titles?.ja
  ].filter(Boolean);
}
__name(buildTitles, "buildTitles");
function expectedCount(media, anizip, jikanEps) {
  const counts = [
    media?.episodes,
    ...Object.keys(anizip?.episodes ?? {}).map(Number).filter(Number.isFinite),
    ...(jikanEps ?? []).map((e) => e.mal_id).filter(Number.isFinite)
  ].filter((n) => Number.isFinite(n) && n > 0);
  return counts.length ? Math.max(...counts) : null;
}
__name(expectedCount, "expectedCount");
function episodeMeta(n, ctx) {
  const az = ctx.anizip?.episodes?.[String(n)] ?? {};
  const jk = (ctx.jikanEps ?? []).find((e) => Number(e.mal_id) === Number(n));
  const runtime = az.runtime ?? az.length ?? null;
  return {
    title: jk?.title ?? az.title?.en ?? az.title?.["x-jat"] ?? null,
    duration: runtime ? runtime * 60 : null,
    filler: jk?.filler ?? az.filler ?? false,
    uncensored: false,
    description: az.overview ?? az.summary ?? null,
    image: az.image ?? ctx.anizip?.images?.cover ?? null,
    airDate: jk?.aired ?? az.airdate ?? az.aired ?? null
  };
}
__name(episodeMeta, "episodeMeta");
function selectSeries(candidates, scrapeSeries5, expected, status, offset, options = {}) {
  return Promise.all(candidates.map(async (candidate) => {
    const episodes = await scrapeSeries5(candidate.slug);
    const max = Math.max(0, ...episodes.map((e) => e.number));
    const localHits = expected ? episodes.filter((e) => e.number >= 1 && e.number <= expected).length : episodes.length;
    const offsetHits = expected && offset ? episodes.filter((e) => e.number > offset && e.number <= offset + expected).length : 0;
    const mode = offsetHits > localHits ? "offset" : "local";
    const hits = Math.max(localHits, offsetHits);
    let countScore = 1;
    if (expected && expected >= 6) {
      const needed = status === "FINISHED" ? Math.ceil(expected * 0.9) : Math.max(1, expected - 3);
      countScore = hits >= needed ? 1 : hits / needed;
    }
    return { ...candidate, episodes, max, mode, score: candidate.score * 0.7 + countScore * 0.3 };
  })).then((results) => {
    const minScore = options.minScore ?? 0.65;
    const viable = results.filter((r) => r.episodes.length && r.score >= minScore).sort((a, b) => b.score - a.score);
    if (!viable.length) return null;
    return viable[0];
  });
}
__name(selectSeries, "selectSeries");
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    }
  });
}
__name(json, "json");

// providers/reanime.js
var __name5 = /* @__PURE__ */ __name((fn, _) => fn, "__name");
var BASE = "https://reanime.to";
var FLIX = "https://flixcloud.cc";
var ANIZIP2 = "https://api.ani.zip/mappings";
var UA5 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var H = { "User-Agent": UA5, Accept: "application/json, */*" };
var enc = new TextEncoder();
var dec = new TextDecoder();
async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", typeof s === "string" ? enc.encode(s) : s);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256hex, "sha256hex");
__name5(sha256hex, "sha256hex");
function b64toU8(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(b64toU8, "b64toU8");
__name5(b64toU8, "b64toU8");
async function deriveFields(seed) {
  let e = seed;
  for (let i = 0; i < 3; i++) e = await sha256hex(e + i);
  let l = e;
  for (let i = 0; i < 3; i++) l = await sha256hex(l + i);
  return {
    keyField: "kf_" + e.substring(8, 16),
    ivField: "ivf_" + e.substring(16, 24),
    containerName: "cd_" + e.substring(24, 32),
    arrayName: "ad_" + e.substring(32, 40),
    objectName: "od_" + e.substring(40, 48),
    tokenField: e.substring(48, 64) + "_" + e.substring(56, 64),
    keyFrag2Field: l.substring(0, 16) + "_" + l.substring(16, 24)
  };
}
__name(deriveFields, "deriveFields");
__name5(deriveFields, "deriveFields");
function extractSsrObj(html) {
  const m = html.match(/\{type:"data",data:(\{)/);
  if (!m) throw new Error("SSR data block not found");
  let depth = 0;
  const start = html.indexOf("{", m.index + m[0].length - 1);
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      if (--depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error("SSR brace matching failed");
}
__name(extractSsrObj, "extractSsrObj");
__name5(extractSsrObj, "extractSsrObj");
function parseJsLiteral(src) {
  let i = 0;
  function ws() {
    while (i < src.length && /\s/.test(src[i])) i++;
  }
  __name(ws, "ws");
  __name5(ws, "ws");
  function parseValue() {
    ws();
    if (src[i] === "{") return parseObject();
    if (src[i] === "[") return parseArray();
    if (src[i] === '"') return parseDStr();
    if (src[i] === "'") return parseSStr();
    if (src.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (src.startsWith("false", i)) {
      i += 5;
      return false;
    }
    if (src.startsWith("null", i)) {
      i += 4;
      return null;
    }
    if (src.startsWith("undefined", i)) {
      i += 9;
      return null;
    }
    if (src.startsWith("!0", i)) {
      i += 2;
      return true;
    }
    if (src.startsWith("!1", i)) {
      i += 2;
      return false;
    }
    const m = src.slice(i).match(/^-?[\d.]+([eE][+-]?\d+)?/);
    if (m) {
      i += m[0].length;
      return parseFloat(m[0]);
    }
    throw new Error(`JS parse error at pos ${i}: ...${src.slice(i, i + 20)}`);
  }
  __name(parseValue, "parseValue");
  __name5(parseValue, "parseValue");
  function parseDStr() {
    let r = "";
    i++;
    while (i < src.length && src[i] !== '"') {
      if (src[i] === "\\") {
        i++;
        const e = { n: "\n", t: "       ", r: "\r", '"': '"', "\\": "\\" };
        r += e[src[i]] ?? src[i];
        i++;
      } else r += src[i++];
    }
    i++;
    return r;
  }
  __name(parseDStr, "parseDStr");
  __name5(parseDStr, "parseDStr");
  function parseSStr() {
    let r = "";
    i++;
    while (i < src.length && src[i] !== "'") {
      if (src[i] === "\\") {
        i++;
        r += src[i] === "'" ? "'" : { n: "\n", t: "     ", r: "\r", "\\": "\\" }[src[i]] ?? src[i];
        i++;
      } else r += src[i++];
    }
    i++;
    return r;
  }
  __name(parseSStr, "parseSStr");
  __name5(parseSStr, "parseSStr");
  function parseKey() {
    ws();
    if (src[i] === '"') return parseDStr();
    if (src[i] === "'") return parseSStr();
    const m = src.slice(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (m) {
      i += m[0].length;
      return m[0];
    }
    throw new Error(`Bad key at pos ${i}: ${src.slice(i, i + 20)}`);
  }
  __name(parseKey, "parseKey");
  __name5(parseKey, "parseKey");
  function parseObject() {
    const obj = {};
    i++;
    ws();
    while (i < src.length && src[i] !== "}") {
      if (src[i] === ",") {
        i++;
        ws();
        continue;
      }
      const k = parseKey();
      ws();
      i++;
      obj[k] = parseValue();
      ws();
    }
    i++;
    return obj;
  }
  __name(parseObject, "parseObject");
  __name5(parseObject, "parseObject");
  function parseArray() {
    const arr = [];
    i++;
    ws();
    while (i < src.length && src[i] !== "]") {
      if (src[i] === ",") {
        i++;
        ws();
        continue;
      }
      arr.push(parseValue());
      ws();
    }
    i++;
    return arr;
  }
  __name(parseArray, "parseArray");
  __name5(parseArray, "parseArray");
  return parseValue();
}
__name(parseJsLiteral, "parseJsLiteral");
__name5(parseJsLiteral, "parseJsLiteral");
function parseWasmDecrypt(wasmBytes) {
  const b = wasmBytes;
  let pos = 8;
  while (pos < b.length) {
    const secId = b[pos++];
    let sz = 0, sh = 0, by;
    do {
      by = b[pos++];
      sz |= (by & 127) << sh;
      sh += 7;
    } while (by & 128);
    if (secId === 10) {
      pos++;
      let sbs = 0, sh2 = 0, by2;
      do {
        by2 = b[pos++];
        sbs |= (by2 & 127) << sh2;
        sh2 += 7;
      } while (by2 & 128);
      pos += sbs;
      break;
    }
    pos += sz;
  }
  let rbs = 0, sh3 = 0, by3;
  do {
    by3 = b[pos++];
    rbs |= (by3 & 127) << sh3;
    sh3 += 7;
  } while (by3 & 128);
  const r = b.slice(pos, pos + rbs);
  function leb(arr, i) {
    let v = 0, s = 0, b2;
    do {
      b2 = arr[i++];
      v |= (b2 & 127) << s;
      s += 7;
    } while (b2 & 128);
    return [v, i];
  }
  __name(leb, "leb");
  __name5(leb, "leb");
  const XOR_END = [32, 2, 32, 5, 106, 45, 0, 0, 115, 33, 6];
  let txStart = -1;
  outer: for (let i = 0; i < r.length - XOR_END.length; i++) {
    for (let j = 0; j < XOR_END.length; j++) if (r[i + j] !== XOR_END[j]) continue outer;
    txStart = i + XOR_END.length;
    break;
  }
  if (txStart < 0) throw new Error("WASM: transform start not found");
  let txEnd = -1, step = 36;
  for (let i = txStart; i < r.length - 4; i++) {
    if (r[i] === 32 && r[i + 1] === 5 && r[i + 2] === 65) {
      const [val, ni] = leb(r, i + 3);
      if (r[ni] === 108) {
        txEnd = i;
        step = val;
        break;
      }
    }
  }
  if (txEnd < 0) throw new Error("WASM: keystream not found");
  const code = r.slice(txStart, txEnd);
  function transform(inputByte) {
    let local6 = inputByte & 255;
    const stk = [];
    let i = 0;
    while (i < code.length) {
      const op = code[i++];
      if (op === 32) {
        const [idx, ni] = leb(code, i);
        i = ni;
        stk.push(idx === 6 ? local6 : 0);
      } else if (op === 33) {
        const [idx, ni] = leb(code, i);
        i = ni;
        const v = stk.pop();
        if (idx === 6) local6 = v & 255;
      } else if (op === 65) {
        const [v, ni] = leb(code, i);
        i = ni;
        stk.push(v);
      } else if (op === 106) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push(a + b2 & 255);
      } else if (op === 107) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push(a - b2 + 256 & 255);
      } else if (op === 113) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push(a & b2 & 255);
      } else if (op === 114) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push((a | b2) & 255);
      } else if (op === 115) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push((a ^ b2) & 255);
      } else if (op === 116) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push(a << (b2 & 7) & 255);
      } else if (op === 118) {
        const b2 = stk.pop(), a = stk.pop();
        stk.push(a >>> (b2 & 7) & 255);
      }
    }
    return local6;
  }
  __name(transform, "transform");
  __name5(transform, "transform");
  return { step, transform };
}
__name(parseWasmDecrypt, "parseWasmDecrypt");
__name5(parseWasmDecrypt, "parseWasmDecrypt");
function runDecrypt(wasmBytes, frag1, kf2, T, seedInt) {
  const { step, transform } = parseWasmDecrypt(wasmBytes);
  const out = new Uint8Array(frag1.length);
  for (let i = 0; i < frag1.length; i++) {
    const c = (frag1[i] ^ kf2[i] ^ T[i]) & 255;
    out[i] = transform(c) ^ i * step + seedInt & 255;
  }
  return out;
}
__name(runDecrypt, "runDecrypt");
__name5(runDecrypt, "runDecrypt");
async function decryptEmbed(html) {
  const raw2 = extractSsrObj(html);
  const data = parseJsLiteral(raw2);
  const seed = data.obfuscation_seed;
  if (!seed) {
    const e = new Error("obfuscation_seed missing");
    e.debug = { topKeys: Object.keys(data).slice(0, 20) };
    throw e;
  }
  const fields = await deriveFields(seed);
  const ocd = data.obfuscated_crypto_data;
  if (!ocd) {
    const e = new Error("obfuscated_crypto_data missing");
    e.debug = { fields, topKeys: Object.keys(data).slice(0, 20) };
    throw e;
  }
  const container = ocd[fields.containerName];
  if (!container) {
    const e = new Error(`containerName "${fields.containerName}" not in ocd`);
    e.debug = { fields, ocdKeys: Object.keys(ocd).slice(0, 10) };
    throw e;
  }
  const arr = container[fields.arrayName];
  if (!arr) {
    const e = new Error(`arrayName "${fields.arrayName}" not in container`);
    e.debug = { fields, containerKeys: Object.keys(container).slice(0, 10) };
    throw e;
  }
  const obj = arr[0][fields.objectName];
  if (!obj) {
    const e = new Error(`objectName "${fields.objectName}" not in arr[0]`);
    e.debug = { fields, arr0Keys: Object.keys(arr[0]).slice(0, 10) };
    throw e;
  }
  const frag1 = b64toU8(obj[fields.keyField]);
  const iv = b64toU8(obj[fields.ivField]);
  const kf2raw = data[fields.keyFrag2Field];
  if (!kf2raw) {
    const e = new Error(`kf2 field "${fields.keyFrag2Field}" not in data`);
    e.debug = { fields, topKeys: Object.keys(data).slice(0, 20) };
    throw e;
  }
  const kf2 = b64toU8(kf2raw);
  const token = data[fields.tokenField];
  if (!token) {
    const e = new Error(`tokenField "${fields.tokenField}" missing`);
    e.debug = { fields, topKeys: Object.keys(data).slice(0, 20) };
    throw e;
  }
  const tokData = await fetch(`${FLIX}/api/m3u8/${token}`, { headers: { ...H, Referer: `${BASE}/` } }).then(async (r) => {
    if (!r.ok) {
      const _raw = await r.text().catch(() => null);
      const _e = new Error(`Token API ${r.status}`);
      _e.rawBody = _raw;
      throw _e;
    }
    return r.json();
  });
  const vidKey = (await sha256hex(token + "vid")).substring(0, 10);
  const keyKey = (await sha256hex(token + "key")).substring(0, 10);
  const v_bytes = b64toU8(tokData[vidKey]);
  const T_bytes = b64toU8(tokData[keyKey]);
  if (!v_bytes.length || !T_bytes.length) {
    const e = new Error(`Token fields missing. vidKey="${vidKey}" keyKey="${keyKey}"`);
    e.debug = { tokKeys: Object.keys(tokData).slice(0, 10) };
    throw e;
  }
  const seedInt = parseInt(seed.substring(0, 8), 16);
  const wPayload = b64toU8(data.w_payload ?? "");
  if (!wPayload.length) throw new Error("w_payload missing from embed data");
  let wasmOut;
  try {
    wasmOut = runDecrypt(wPayload, frag1, kf2, T_bytes, seedInt);
  } catch (pe) {
    pe.wasmHex = Array.from(wPayload).map((b) => b.toString(16).padStart(2, "0")).join("");
    throw pe;
  }
  const keyMat = await crypto.subtle.importKey("raw", wasmOut, { name: "PBKDF2" }, false, ["deriveBits"]);
  const derived = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(seed), iterations: 1e3, hash: "SHA-256" },
    keyMat,
    256
  ));
  for (let i = 0; i < 32; i++) derived[i] ^= seed.charCodeAt(i % seed.length);
  const aesKeyBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", derived));
  const aesKey = await crypto.subtle.importKey("raw", aesKeyBytes, { name: "AES-CBC" }, false, ["decrypt"]);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-CBC", iv }, aesKey, v_bytes);
  } catch (err) {
    err.debug = {
      seedInt: "0x" + seedInt.toString(16),
      frag1Len: frag1.length,
      kf2Len: kf2.length,
      T_bytesLen: T_bytes.length,
      ivLen: iv.length,
      v_bytesLen: v_bytes.length,
      wPayloadLen: wPayload.length,
      wasmOutHex: Array.from(wasmOut).map((b) => b.toString(16).padStart(2, "0")).join("")
    };
    throw err;
  }
  const url = dec.decode(plain).trim().replace(/\0+$/, "");
  if (!url.startsWith("http")) throw new Error(`Unexpected decrypted value: ${url.substring(0, 60)}`);
  return {
    url,
    subtitles: data.subtitles ?? [],
    thumbnails_vtt: data.thumbnails_vtt ?? null,
    video_title: data.video_title ?? null,
    intro_chapter: data.intro_chapter ?? null,
    outro_chapter: data.outro_chapter ?? null,
    video_id: data.video_id ?? null
  };
}
__name(decryptEmbed, "decryptEmbed");
__name5(decryptEmbed, "decryptEmbed");
async function searchReanime(query) {
  const data = await fetch(`${BASE}/api/v1/search?${new URLSearchParams({ q: query, limit: 10 })}`, { headers: H }).then(async (r) => {
    const _raw = await r.text();
    if (!r.ok) {
      const _e = new Error(`reanime search ${r.status}`);
      _e.rawBody = _raw;
      throw _e;
    }
    try {
      return JSON.parse(_raw);
    } catch (_pe) {
      _pe.rawBody = _raw;
      throw _pe;
    }
  });
  return Array.isArray(data?.results) ? data.results : [];
}
__name(searchReanime, "searchReanime");
__name5(searchReanime, "searchReanime");
async function fetchAnimeDetail(animeId) {
  const res = await fetch(`${BASE}/api/v1/anime/${animeId}`, { headers: H });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}
__name(fetchAnimeDetail, "fetchAnimeDetail");
__name5(fetchAnimeDetail, "fetchAnimeDetail");
function extractAnilistIdFromCover(coverImage) {
  const urls2 = [coverImage?.extra_large, coverImage?.large, coverImage?.medium].filter(Boolean);
  for (const url of urls2) {
    const m = url.match(/anilist\.co\/.*\/bx(\d+)-/);
    if (m) return Number(m[1]);
  }
  return null;
}
__name(extractAnilistIdFromCover, "extractAnilistIdFromCover");
__name5(extractAnilistIdFromCover, "extractAnilistIdFromCover");
async function resolveSeries(anilistId, ctx = {}) {
  const cacheKey = `np:reanime:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const malId = media?.idMal ?? null;
  const queries = buildTitles(media, ctx.anizip).slice(0, 5);
  const candidates = /* @__PURE__ */ new Map();
  await Promise.all(queries.map(async (q) => {
    for (const r of await searchReanime(q).catch(() => [])) {
      if (r?.anime_id && !candidates.has(r.anime_id)) candidates.set(r.anime_id, r);
    }
  }));
  for (const [id, r] of candidates) {
    const coverId = extractAnilistIdFromCover(r.cover_image);
    if (coverId && coverId === Number(anilistId)) {
      const data = {
        animeId: id,
        title: r.title?.english || r.title?.romaji || id,
        anilistId: Number(anilistId),
        malId: null,
        subbed: Number.isFinite(r.subbed) ? r.subbed : null,
        dubbed: Number.isFinite(r.dubbed) ? r.dubbed : null,
        episodesCount: Number.isFinite(r.episodes) ? r.episodes : null,
        matchType: "cover_image",
        matchScore: 1
      };
      set(cacheKey, data, SHOW_IDENTITY_TTL);
      return data;
    }
  }
  const needsDetail = [...candidates.keys()].filter(
    (id) => extractAnilistIdFromCover(candidates.get(id)?.cover_image) === null
  );
  const details = await Promise.all(
    needsDetail.map(async (id) => ({ id, detail: await fetchAnimeDetail(id).catch(() => null) }))
  );
  for (const { id, detail } of details) {
    if (detail?.anilist_id && Number(detail.anilist_id) === Number(anilistId)) {
      const data = {
        animeId: id,
        title: detail.title?.english || detail.title?.romaji || candidates.get(id)?.title?.english || id,
        anilistId: Number(anilistId),
        malId: detail.mal_id || null,
        subbed: Number.isFinite(detail.subbed) ? detail.subbed : null,
        dubbed: Number.isFinite(detail.dubbed) ? detail.dubbed : null,
        episodesCount: Number.isFinite(detail.episodes) ? detail.episodes : null,
        matchType: "anilist",
        matchScore: 1
      };
      set(cacheKey, data, SHOW_IDENTITY_TTL);
      return data;
    }
  }
  if (malId) {
    for (const { id, detail } of details) {
      const detailMal = detail?.mal_id;
      if (detailMal && Number(detailMal) === Number(malId)) {
        const data = {
          animeId: id,
          title: detail.title?.english || detail.title?.romaji || id,
          anilistId: Number(anilistId),
          malId: Number(detailMal),
          subbed: Number.isFinite(detail.subbed) ? detail.subbed : null,
          dubbed: Number.isFinite(detail.dubbed) ? detail.dubbed : null,
          episodesCount: Number.isFinite(detail.episodes) ? detail.episodes : null,
          matchType: "mal",
          matchScore: 0.9
        };
        set(cacheKey, data, SHOW_IDENTITY_TTL);
        return data;
      }
    }
  }
  throw new Error(`No confirmed reanime match for AniList ${anilistId}`);
}
__name(resolveSeries, "resolveSeries");
__name5(resolveSeries, "resolveSeries");
async function fetchEpisodesList(animeId, limit = 2e3) {
  const data = await fetch(`${BASE}/api/v1/anime/${animeId}/episodes?${new URLSearchParams({ limit })}`, { headers: H }).then(async (r) => {
    const _raw = await r.text();
    if (!r.ok) {
      const _e = new Error(`reanime episodes ${r.status}`);
      _e.rawBody = _raw;
      throw _e;
    }
    try {
      return JSON.parse(_raw);
    } catch (_pe) {
      _pe.rawBody = _raw;
      throw _pe;
    }
  });
  return Array.isArray(data?.data) ? data.data : [];
}
__name(fetchEpisodesList, "fetchEpisodesList");
__name5(fetchEpisodesList, "fetchEpisodesList");
async function fetchAnizip(anilistId) {
  return fetch(`${ANIZIP2}?anilist_id=${anilistId}`).then((r) => r.json()).catch(() => null);
}
__name(fetchAnizip, "fetchAnizip");
__name5(fetchAnizip, "fetchAnizip");
function mergeEpisode(anilistId, ep, meta, audio) {
  const number = ep.episode_number;
  return {
    id: `watch/reanime/${anilistId}/${audio}/reanime-${number}`,
    number,
    title: meta?.title?.en || meta?.title?.["x-jat"] || ep.title || `Episode ${number}`,
    titleJapanese: meta?.title?.ja || ep.title_japanese || null,
    titleRomanji: meta?.title?.["x-jat"] || ep.title_romanji || null,
    image: meta?.image || ep.thumbnail || null,
    airDate: meta?.airdate || ep.aired || null,
    duration: meta?.runtime ? meta.runtime * 60 : ep.duration ? ep.duration * 60 : null,
    score: null,
    filler: ep.is_filler ?? meta?.filler ?? false,
    recap: ep.is_recap ?? false,
    description: meta?.overview || ep.description || null,
    audio
  };
}
__name(mergeEpisode, "mergeEpisode");
__name5(mergeEpisode, "mergeEpisode");
function json3(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
__name(json3, "json3");
__name5(json3, "json");
async function handleEpisodes3(anilistId, url) {
  const series = await resolveSeries(anilistId);
  const [reanimeEps, anizip] = await Promise.all([
    fetchEpisodesList(series.animeId),
    fetchAnizip(anilistId)
  ]);
  if (!reanimeEps.length) return json3({ error: `No reanime episodes found for AniList ID ${anilistId} (slug ${series.animeId})` }, 404);
  const episodes = reanimeEps.map((ep) => {
    const meta = anizip?.episodes?.[String(ep.episode_number)] ?? null;
    return mergeEpisode(anilistId, ep, meta, "sub");
  }).sort((a, b) => a.number - b.number);
  return json3({
    anime: series.title,
    anilistId: Number(anilistId),
    malId: series.malId,
    animeId: series.animeId,
    episodes,
    pagination: { currentPage: 1, lastPage: 1, hasNextPage: false }
  });
}
__name(handleEpisodes3, "handleEpisodes3");
__name5(handleEpisodes3, "handleEpisodes");
async function resolveStream3(anilistId, audio, ep) {
  const series = await resolveSeries(anilistId);
  const title2 = series.title;
  const slug = series.animeId;
  const order = { "HD-2": 0, "HD-1": 1 };
  const byPrio = /* @__PURE__ */ __name((arr) => arr.slice().sort((a, b) => (order[a.serverName] ?? 9) - (order[b.serverName] ?? 9)), "byPrio");
  const [watchRes, flixRes] = await Promise.allSettled([
    fetch(`${BASE}/api/watch/${slug}/${ep}`, { headers: H }).then(async (r) => {
      const _raw = await r.text();
      if (!r.ok) {
        const _e = new Error(`watch ${r.status}`);
        _e.rawBody = _raw;
        throw _e;
      }
      try {
        return JSON.parse(_raw);
      } catch (_pe) {
        _pe.rawBody = _raw;
        throw _pe;
      }
    }),
    fetch(`${BASE}/api/flix/${anilistId}/${ep}`, { headers: H }).then(async (r) => {
      const _raw = await r.text();
      if (!r.ok) {
        const _e = new Error(`flix ${r.status}`);
        _e.rawBody = _raw;
        throw _e;
      }
      try {
        return JSON.parse(_raw);
      } catch (_pe) {
        _pe.rawBody = _raw;
        throw _pe;
      }
    })
  ]);
  const watchData = watchRes.status === "fulfilled" ? watchRes.value : null;
  const flixData = flixRes.status === "fulfilled" ? flixRes.value : null;
  const links = [...watchData?.episode_links ?? []];
  if (flixData?.success && flixData?.servers) {
    const seen = new Set(links.map((s) => s["$id"]));
    for (const s of flixData.servers) {
      if (!seen.has(s["$id"])) links.push(s);
    }
  }
  const audioTypes = audio === "sub" ? ["sub", "s-sub"] : ["dub", "s-dub"];
  const servers = byPrio(links.filter((s) => audioTypes.includes(s.dataType)));
  if (!servers.length) throw Object.assign(new Error(`No ${audio} servers for "${title2}" ep ${ep}`), { status: 404 });
  const embedRes = await fetch(servers[0].dataLink, { headers: { ...H, Referer: `${BASE}/` } });
  if (!embedRes.ok) throw Object.assign(new Error(`Embed fetch failed: ${embedRes.status}`), { status: 502 });
  const stream = await decryptEmbed(await embedRes.text());
  return { title: title2, slug, watchData, stream, server: servers[0].serverName, servers };
}
__name(resolveStream3, "resolveStream3");
__name5(resolveStream3, "resolveStream");
async function handleWatch3(anilistId, audio, epNum, origin) {
  if (audio !== "sub" && audio !== "dub") return json3({ error: "audio must be sub or dub" }, 400);
  const ep = parseInt(epNum);
  if (isNaN(ep)) return json3({ error: `Invalid episode: ${epNum}` }, 400);
  let resolved2;
  try {
    resolved2 = await resolveStream3(anilistId, audio, ep);
  } catch (e) {
    return json3({ error: e.message, "Raw-ERROR": e.rawBody ?? null, stack: e.stack }, e.status ?? 500);
  }
  const { title: title2, slug, watchData, stream, server, servers } = resolved2;
  const redirectUrl = `${origin}/stream/reanime/${anilistId}/${audio}/${ep}`;
  return json3({
    anime: title2,
    slug,
    ep,
    audio,
    server,
    stream_url: stream.url,
    redirect_url: redirectUrl,
    streams: [
      { url: stream.url, type: "hls" },
      { url: redirectUrl, type: "hls-redirect" },
      ...servers.map((s) => ({ url: s.dataLink, type: "embed", server: s.serverName }))
    ],
    subtitles: stream.subtitles,
    thumbnails_vtt: stream.thumbnails_vtt,
    video_title: stream.video_title,
    intro: stream.intro_chapter,
    outro: stream.outro_chapter,
    intro_start: watchData?.intro_start ?? null,
    intro_end: watchData?.intro_end ?? null,
    outro_start: watchData?.outro_start ?? null,
    outro_end: watchData?.outro_end ?? null,
    allServers: servers.map((s) => ({ name: s.serverName, type: s.dataType, embed: s.dataLink }))
  });
}
__name(handleWatch3, "handleWatch3");
__name5(handleWatch3, "handleWatch");
async function handleStream3(anilistId, audio, epNum) {
  if (audio !== "sub" && audio !== "dub") return json3({ error: "audio must be sub or dub" }, 400);
  const ep = parseInt(epNum);
  if (isNaN(ep)) return json3({ error: `Invalid episode: ${epNum}` }, 400);
  let resolved2;
  try {
    resolved2 = await resolveStream3(anilistId, audio, ep);
  } catch (e) {
    return json3({ error: e.message, "Raw-ERROR": e.rawBody ?? null, stack: e.stack }, e.status ?? 500);
  }
  return new Response(null, {
    status: 302,
    headers: {
      "Location": resolved2.stream.url,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}
__name(handleStream3, "handleStream3");
__name5(handleStream3, "handleStream");
async function handleProxy3(url) {
  const target = url.searchParams.get("url");
  const referer = url.searchParams.get("referer") ?? `${FLIX}/`;
  if (!target) return json3({ error: "Missing required ?url= param" }, 400);
  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return json3({ error: "Invalid url param" }, 400);
  }
  const upstream = await fetch(target, {
    headers: {
      "User-Agent": UA5,
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": referer,
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "cross-site"
    }
  });
  const ct = upstream.headers.get("Content-Type") ?? "";
  const isM3U8 = ct.includes("mpegurl") || ct.includes("x-mpegurl") || targetUrl.pathname.endsWith(".m3u8") || targetUrl.pathname.endsWith(".m3u");
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" };
  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status, headers: { "Content-Type": ct || "text/plain", ...corsHeaders } });
  }
  if (isM3U8) {
    const text = await upstream.text();
    const rewritten = rewriteM3U8(text, target, url.origin);
    return new Response(rewritten, { status: 200, headers: { "Content-Type": "application/vnd.apple.mpegurl", ...corsHeaders } });
  }
  return new Response(upstream.body, { status: upstream.status, headers: { "Content-Type": ct || "application/octet-stream", ...corsHeaders } });
}
__name(handleProxy3, "handleProxy3");
__name5(handleProxy3, "handleProxy");
var reanime_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      let m;
      if (path === "/healthz") return json3({ status: "ok", provider: "reanime" });
      if (path === "/proxy") return await handleProxy3(url);
      m = path.match(/^\/episodes\/(\d+)$/);
      if (m) return await handleEpisodes3(m[1], url);
      m = path.match(/^\/watch\/(\d+)\/(sub|dub)\/(\d+)$/);
      if (m) return await handleWatch3(m[1], m[2], m[3], url.origin);
      m = path.match(/^\/stream\/(\d+)\/(sub|dub)\/(\d+)$/);
      if (m) return await handleStream3(m[1], m[2], m[3]);
      return json3({ error: "Not found", routes: ["GET /episodes/:anilistId", "GET /watch/:anilistId/sub|dub/:ep", "GET /stream/:anilistId/sub|dub/:ep", "GET /proxy?url=&referer="] }, 404);
    } catch (err) {
      return json3({ error: err.message, "Raw-ERROR": err.rawBody ?? null, ...err.debug ? { debug: err.debug } : {}, stack: err.stack }, 500);
    }
  }
};
async function getEpisodes3(anilistId, ctx = {}) {
  const series = await resolveSeries(anilistId, ctx);
  const anizip = ctx.anizip !== void 0 ? ctx.anizip : await fetchAnizip(anilistId);
  const reanimeEps = await fetchEpisodesList(series.animeId);
  if (!reanimeEps.length) throw new Error(`No reanime episodes found for AniList ${anilistId} (slug ${series.animeId})`);
  const hasSub = series.subbed == null || series.subbed > 0;
  const dubCount = series.dubbed ?? 0;
  const sub = [], dub = [];
  for (const ep of reanimeEps) {
    const meta = anizip?.episodes?.[String(ep.episode_number)] ?? null;
    if (hasSub) sub.push(mergeEpisode(anilistId, ep, meta, "sub"));
    if (dubCount > 0 && ep.episode_number <= dubCount) dub.push(mergeEpisode(anilistId, ep, meta, "dub"));
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: { title: series.title, malId: series.malId, animeId: series.animeId },
    episodes: { sub, dub }
  };
}
__name(getEpisodes3, "getEpisodes3");
__name5(getEpisodes3, "getEpisodes");
var reanime_default2 = reanime_default;

// providers/anikoto.js
var ANIKOTO = "https://anikototv.to";
var MAPPER = "https://mapper.nekostream.site/api/mal";
var ANIZIP3 = "https://api.ani.zip/mappings";
var SPOOF_REF = "https://hianimes.re/";
var UA6 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var LANG_MAP = {
  en: "en",
  english: "en",
  ja: "ja",
  japanese: "ja",
  fr: "fr",
  french: "fr",
  de: "de",
  german: "de",
  es: "es",
  spanish: "es",
  pt: "pt",
  portuguese: "pt"
};
function normalize2(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
__name(normalize2, "normalize");
async function httpGet(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA6, Accept: "text/html,*/*", ...headers } });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`HTTP ${res.status} fetching ${url}`);
    _e.rawBody = _raw;
    throw _e;
  }
  return res.text();
}
__name(httpGet, "httpGet");
async function getJSON(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA6, Accept: "application/json,*/*", ...headers } });
  if (!res.ok) {
    const _raw = await res.text().catch(() => null);
    const _e = new Error(`HTTP ${res.status} fetching ${url}`);
    _e.rawBody = _raw;
    throw _e;
  }
  return res.json();
}
__name(getJSON, "getJSON");
var MODIFIERS = [
  "ova",
  "movie",
  "special",
  "specials",
  "tales",
  "journal",
  "part",
  "season",
  "kanwa",
  "spin-off",
  "theatre"
];
function scoreCandidate(cand, primaryEn, primaryRom, synonyms) {
  let score = 0;
  const candNameNorm = normalize2(cand.name);
  const candJpNorm = normalize2(cand.jp);
  const candSlugNorm = normalize2(cand.slug);
  const normEn = normalize2(primaryEn);
  const normRom = normalize2(primaryRom);
  if (normEn && candNameNorm === normEn) score += 1e3;
  if (normRom && candNameNorm === normRom) score += 900;
  if (normRom && candJpNorm === normRom) score += 800;
  const targetText = `${primaryEn || ""} ${primaryRom || ""} ${(synonyms || []).join(" ")}`.toLowerCase();
  for (const mod of MODIFIERS) {
    const candHasMod = candNameNorm.includes(mod) || candSlugNorm.includes(mod);
    const targetHasMod = targetText.includes(mod);
    if (candHasMod && !targetHasMod) {
      score -= 300;
    }
  }
  for (const t of [primaryEn, primaryRom, ...synonyms || []]) {
    const normT = normalize2(t);
    if (!normT || normT.length < 3) continue;
    if (candNameNorm === normT) score += 200;
    else if (candNameNorm.startsWith(normT) || normT.startsWith(candNameNorm)) score += 80;
    else if (candNameNorm.includes(normT) || normT.includes(candNameNorm)) score += 40;
    if (candJpNorm && candJpNorm === normT) score += 100;
  }
  const lengthDiff = Math.abs(candNameNorm.length - (normEn || normRom || "").length);
  score -= lengthDiff * 2;
  return score;
}
__name(scoreCandidate, "scoreCandidate");
async function searchAnikoto(query) {
  const searchHtml = await httpGet(`${ANIKOTO}/filter?keyword=${encodeURIComponent(query)}`, { Referer: `${ANIKOTO}/` });
  const candidates = [];
  const re = /<a\s+class="name d-title"\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*data-jp="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(searchHtml)) !== null) {
    const slug = m[1];
    const jp = m[2].trim();
    const name = m[3].replace(/<[^>]*>/g, "").trim();
    candidates.push({ slug, name, jp });
  }
  if (!candidates.length) {
    const reFallback = /<a\s+href="https:\/\/anikototv\.to\/watch\/([^"/]+)(?:\/ep-\d+)?"[^>]*>([\s\S]*?)<\/a>/g;
    while ((m = reFallback.exec(searchHtml)) !== null) {
      candidates.push({ slug: m[1], name: m[1], jp: "" });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return candidates.filter((c) => {
    if (seen.has(c.slug)) return false;
    seen.add(c.slug);
    return true;
  });
}
__name(searchAnikoto, "searchAnikoto");
async function findAnikotoShow(media) {
  const primaryEn = media.title?.english;
  const primaryRom = media.title?.romaji;
  const synonyms = media.synonyms || [];
  const keywords = [...new Set([primaryEn, primaryRom, ...synonyms].filter(Boolean))];
  const allCandidatesMap = /* @__PURE__ */ new Map();
  for (const k of keywords.slice(0, 5)) {
    const res = await searchAnikoto(k).catch(() => []);
    for (const c of res) {
      allCandidatesMap.set(c.slug, c);
    }
  }
  const candidates = Array.from(allCandidatesMap.values());
  if (!candidates.length) {
    throw new Error(`No results found on Anikoto for: ${primaryEn || primaryRom}`);
  }
  const scored = candidates.map((c) => ({
    ...c,
    score: scoreCandidate(c, primaryEn, primaryRom, synonyms)
  })).sort((a, b) => b.score - a.score);
  const chosen = scored[0];
  const watchHtml = await httpGet(`${ANIKOTO}/watch/${chosen.slug}`, { Referer: `${ANIKOTO}/` });
  const showIdMatch = watchHtml.match(/data-id="(\d+)"/);
  if (!showIdMatch) throw new Error(`Could not find show ID for slug: ${chosen.slug}`);
  return { slug: chosen.slug, showId: showIdMatch[1], title: chosen.name };
}
__name(findAnikotoShow, "findAnikotoShow");
function mapTrack(t, source) {
  const label = t.label ?? "";
  const langKey = label.toLowerCase().split(" ")[0];
  return {
    url: t.file,
    label: label || "English",
    srclang: LANG_MAP[langKey] ?? "en",
    default: t.default ?? false,
    source
  };
}
__name(mapTrack, "mapTrack");
async function extractEmbedSource(embedUrl) {
  try {
    const pageHtml = await httpGet(embedUrl, { Referer: SPOOF_REF, "Accept-Language": "en-US,en;q=0.9" });
    const m = pageHtml.match(/data-id="([^"]*)"/);
    if (!m?.[1]) return null;
    const fileId = m[1];
    const origin = new URL(embedUrl).origin;
    const data = await getJSON(`${origin}/stream/getSources?id=${fileId}&id=${fileId}`, { Referer: `${origin}/`, "X-Requested-With": "XMLHttpRequest" });
    return { fileId, data, origin };
  } catch (e) {
    return null;
  }
}
__name(extractEmbedSource, "extractEmbedSource");
async function getEpisodes(anilistId, ctx = {}) {
  const media = ctx.media || await getMedia(anilistId);
  if (!media) throw new Error(`Could not resolve media for AniList ID: ${anilistId}`);
  const [show, anizipRes] = await Promise.all([
    findAnikotoShow(media),
    ctx.anizip ? Promise.resolve(ctx.anizip) : getJSON(`${ANIZIP3}?anilist_id=${anilistId}`).catch(() => null)
  ]);
  const listJson = await getJSON(`${ANIKOTO}/ajax/episode/list/${show.showId}`, {
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${ANIKOTO}/watch/${show.slug}`
  });
  const html = listJson.result || "";
  const sub = [];
  const dub = [];
  let firstMal = media.idMal || null;
  const re = /<a\s+[^>]*data-id="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const inner = m[2];
    const getAttr = /* @__PURE__ */ __name((attr2) => {
      const x = tag.match(new RegExp(`data-${attr2}="([^"]*)"`));
      return x ? x[1] : "";
    }, "getAttr");
    const numStr = getAttr("num");
    if (!numStr) continue;
    const num = parseInt(numStr);
    const hasSub = getAttr("sub") === "1";
    const hasDub = getAttr("dub") === "1";
    const malAttr = getAttr("mal");
    if (!firstMal && malAttr) firstMal = parseInt(malAttr);
    const titleMatch = inner.match(/<span class="d-title"[^>]*>([\s\S]*?)<\/span>/);
    const parsedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "").trim() : "";
    const epTitle = parsedTitle || `Episode ${num}`;
    const azEp = anizipRes?.episodes?.[String(num)] ?? {};
    const img = azEp.image || null;
    const desc = azEp.overview || azEp.summary || null;
    const airDate = azEp.airDate || azEp.airdate || null;
    const base = {
      number: num,
      title: epTitle,
      duration: null,
      filler: false,
      uncensored: false,
      description: desc,
      image: img,
      airDate
    };
    if (hasSub) {
      sub.push({
        id: `watch/anikoto/${anilistId}/sub/anikoto-${num}`,
        ...base,
        audio: "sub"
      });
    }
    if (hasDub) {
      dub.push({
        id: `watch/anikoto/${anilistId}/dub/anikoto-${num}`,
        ...base,
        audio: "dub"
      });
    }
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: {
      title: show.title,
      slug: show.slug,
      malId: firstMal,
      source: "anikoto"
    },
    episodes: { sub, dub }
  };
}
__name(getEpisodes, "getEpisodes");
async function handleWatch(anilistId, audio, epNum, ctx = {}) {
  if (audio !== "sub" && audio !== "dub") {
    return jsonResponse({ error: "audio must be sub or dub" }, 400);
  }
  const media = ctx.media || await getMedia(anilistId);
  if (!media) {
    return jsonResponse({ error: `Could not resolve media for AniList ID: ${anilistId}` }, 400);
  }
  const show = await findAnikotoShow(media);
  const listJson = await getJSON(`${ANIKOTO}/ajax/episode/list/${show.showId}`, {
    "X-Requested-With": "XMLHttpRequest",
    Referer: `${ANIKOTO}/watch/${show.slug}`
  });
  const html = listJson.result || "";
  let targetEp = null;
  const re = /<a\s+[^>]*data-id="([^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const getAttr = /* @__PURE__ */ __name((attr2) => {
      const x = tag.match(new RegExp(`data-${attr2}="([^"]*)"`));
      return x ? x[1] : "";
    }, "getAttr");
    if (parseInt(getAttr("num")) === epNum) {
      targetEp = {
        ids: getAttr("ids"),
        mal: getAttr("mal"),
        slug: getAttr("slug"),
        timestamp: getAttr("timestamp")
      };
      break;
    }
  }
  if (!targetEp?.ids) {
    return jsonResponse({ error: `Episode ${epNum} not found for show: ${show.title}` }, 404);
  }
  const malIdNum = media.idMal || (targetEp.mal ? parseInt(targetEp.mal) : null);
  const [serverDataRes, mapperRes] = await Promise.allSettled([
    getJSON(`${ANIKOTO}/ajax/server/list?servers=${encodeURIComponent(targetEp.ids)}`, {
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${ANIKOTO}/`
    }),
    targetEp.mal && targetEp.slug && targetEp.timestamp ? getJSON(`${MAPPER}/${targetEp.mal}/${targetEp.slug}/${targetEp.timestamp}`, { Referer: `${ANIKOTO}/` }) : Promise.resolve(null)
  ]);
  const serverData = serverDataRes.status === "fulfilled" ? serverDataRes.value : null;
  const mapperData = mapperRes.status === "fulfilled" ? mapperRes.value : null;
  const serverHtml = serverData?.result || "";
  const serverItems = [];
  const downloadItems = [];
  const typeRe = /<div class="type" data-type="([^"]+)">([\s\S]*?)<\/ul>\s*<\/div>/g;
  let typeM;
  while ((typeM = typeRe.exec(serverHtml)) !== null) {
    const typeName = typeM[1];
    for (const li of typeM[2].matchAll(/<li\s+([^>]*data-link-id[^>]*)>([\s\S]*?)<\/li>/g)) {
      const linkId = li[1].match(/data-link-id="([^"]+)"/)?.[1];
      const name = li[2].replace(/<[^>]+>/g, "").trim();
      if (!linkId) continue;
      if (typeName === "dl" || name.toLowerCase().includes("download") || name.toLowerCase().includes("kiwi")) {
        downloadItems.push({ linkId, name });
      } else if (typeName === audio) {
        serverItems.push({ linkId, name });
      }
    }
  }
  if (mapperData) {
    for (const [sKey, sObj] of Object.entries(mapperData)) {
      if (sKey === "status") continue;
      const cleanName = sKey.replace(/[-_]+$/, "").trim();
      if (sObj?.[audio]?.url) {
        serverItems.push({ linkId: sObj[audio].url, name: cleanName });
      }
      if (sObj?.[audio]?.download) {
        for (const [dLabel, dUrl] of Object.entries(sObj[audio].download)) {
          if (dUrl && typeof dUrl === "string") {
            downloadItems.push({ url: dUrl, name: cleanName });
          }
        }
      }
    }
  }
  const streams = [];
  const subtitles = [];
  const downloads = [];
  const serverSeen = /* @__PURE__ */ new Set();
  const subSeen = /* @__PURE__ */ new Set();
  const dlSeen = /* @__PURE__ */ new Set();
  for (const item of serverItems) {
    if (serverSeen.has(item.name)) continue;
    serverSeen.add(item.name);
    const resolved2 = item.linkId.startsWith("http") ? { result: { url: item.linkId } } : await getJSON(`${ANIKOTO}/ajax/server?get=${encodeURIComponent(item.linkId)}`, {
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${ANIKOTO}/`
    }).catch(() => null);
    const embedUrl = resolved2?.result?.url;
    if (!embedUrl) continue;
    let serverIntro = { start: 0, end: 0 };
    let serverOutro = { start: 0, end: 0 };
    if (resolved2?.result?.skip_data?.intro?.length === 2) {
      const [s, e] = resolved2.result.skip_data.intro;
      if (s || e) serverIntro = { start: Number(s) || 0, end: Number(e) || 0 };
    }
    if (resolved2?.result?.skip_data?.outro?.length === 2) {
      const [s, e] = resolved2.result.skip_data.outro;
      if (s || e) serverOutro = { start: Number(s) || 0, end: Number(e) || 0 };
    }
    let hlsUrl = null;
    if (embedUrl.includes("#aHR0c")) {
      const b64 = embedUrl.split("#")[1];
      try {
        const decodedUrl = atob(b64);
        if (decodedUrl.includes(".m3u8")) {
          hlsUrl = decodedUrl;
        }
      } catch (e) {
      }
    }
    const extracted = await extractEmbedSource(embedUrl);
    const itemSubs = [];
    if (extracted?.data?.sources?.file) {
      hlsUrl = extracted.data.sources.file;
      for (const t of extracted.data.tracks ?? []) {
        const mapped = mapTrack(t, item.name);
        itemSubs.push(mapped);
        if (!subSeen.has(mapped.url)) {
          subSeen.add(mapped.url);
          subtitles.push(mapped);
        }
      }
      if (extracted.data.intro?.start || extracted.data.intro?.end) {
        serverIntro = { start: Number(extracted.data.intro.start) || 0, end: Number(extracted.data.intro.end) || 0 };
      }
      if (extracted.data.outro?.start || extracted.data.outro?.end) {
        serverOutro = { start: Number(extracted.data.outro.start) || 0, end: Number(extracted.data.outro.end) || 0 };
      }
    }
    if (hlsUrl) {
      const streamObj = {
        url: hlsUrl,
        type: "hls",
        server: item.name,
        embedUrl,
        referer: extracted?.origin ? `${extracted.origin}/` : `${new URL(embedUrl).origin}/`,
        subtitles: itemSubs,
        priority: 5,
        isActive: streams.length === 0
      };
      if (serverIntro.start || serverIntro.end) streamObj.intro = serverIntro;
      if (serverOutro.start || serverOutro.end) streamObj.outro = serverOutro;
      streams.push(streamObj);
    } else {
      const streamObj = {
        url: embedUrl,
        type: "embed",
        server: item.name,
        referer: `${new URL(embedUrl).origin}/`,
        priority: 4,
        isActive: streams.length === 0
      };
      if (serverIntro.start || serverIntro.end) streamObj.intro = serverIntro;
      if (serverOutro.start || serverOutro.end) streamObj.outro = serverOutro;
      streams.push(streamObj);
    }
  }
  for (const dl of downloadItems) {
    let dlUrl = dl.url;
    if (!dlUrl && dl.linkId) {
      const resolved2 = await getJSON(`${ANIKOTO}/ajax/server?get=${encodeURIComponent(dl.linkId)}`, {
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${ANIKOTO}/`
      }).catch(() => null);
      dlUrl = resolved2?.result?.url;
    }
    if (dlUrl && !dlSeen.has(dlUrl)) {
      dlSeen.add(dlUrl);
      downloads.push({
        url: dlUrl,
        label: dl.name
      });
    }
  }
  return jsonResponse({
    anilistId: parseInt(anilistId),
    malId: malIdNum,
    episode: epNum,
    audio,
    streams,
    subtitles,
    downloads,
    headers: {
      "User-Agent": UA6,
      "Referer": streams[0]?.referer || "https://anikototv.to/"
    }
  });
}
__name(handleWatch, "handleWatch");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
__name(jsonResponse, "jsonResponse");
var anikoto_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    try {
      let m = path.match(/^\/watch\/anikoto\/(\d+)\/(sub|dub)\/anikoto-(\d+)\/?$/);
      if (m) return await handleWatch(m[1], m[2], parseInt(m[3]));
      m = path.match(/^\/episodes\/anikoto\/(\d+)\/?$/);
      if (m) {
        const data = await getEpisodes(parseInt(m[1]));
        return jsonResponse(data);
      }
      return jsonResponse({ error: "Not found" }, 404);
    } catch (err) {
      return jsonResponse({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// providers/animegg.js
var BASE2 = "https://www.animegg.org";
async function search(query) {
  const html = await fetchHtml(`${BASE2}/search/?q=${encodeURIComponent(query)}`);
  const results = [];
  for (const m of html.matchAll(/<a\b[^>]*class=["'][^"']*\bmse\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)) {
    const tag = m[0].match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = attr(tag, "href");
    const slug = href.match(/^\/series\/([^/?#]+)/)?.[1];
    if (!slug) continue;
    const strong = m[0].match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1];
    results.push({ slug, text: strong ? stripTags(strong) : slug.replace(/-/g, " ") });
  }
  return results;
}
__name(search, "search");
async function scrapeSeries(slug) {
  const html = await fetchHtml(`${BASE2}/series/${slug}`);
  const episodes = [];
  for (const m of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const block = m[1];
    if (!/\banm_det_pop\b/.test(block)) continue;
    const link = block.match(/<a\b[^>]*class=["'][^"']*anm_det_pop[^"']*["'][^>]*>/i)?.[0] ?? "";
    const href = attr(link, "href").replace(/#.*$/, "").replace(/^\//, "");
    const strong = stripTags(block.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? "");
    const rangeMatch = strong.match(/(\d+)-(\d+)\s*$/);
    const numMatch = rangeMatch || strong.match(/(\d+)\s*$/);
    if (!numMatch || !href) continue;
    const number = parseInt(numMatch[1]);
    const title = stripTags(block.match(/<i\b[^>]*class=["'][^"']*anititle[^"']*["'][^>]*>([\s\S]*?)<\/i>/i)?.[1] ?? "") || strong;
    const audio = [];
    if (/\bbtn-subbed\b/.test(block)) audio.push("sub");
    if (/\bbtn-dubbed\b/.test(block)) audio.push("dub");
    episodes.push({ number, title, epSlug: href, hasSub: audio.includes("sub"), hasDub: audio.includes("dub") });
  }
  episodes.sort((a, b) => a.number - b.number);
  const seen = /* @__PURE__ */ new Set();
  return episodes.filter((e) => seen.has(e.number) ? false : (seen.add(e.number), true));
}
__name(scrapeSeries, "scrapeSeries");
async function scrapeEmbed(embedId) {
  const html = await fetchHtml(`${BASE2}/embed/${embedId}`, { Referer: BASE2 });
  const m = html.match(/var\s+videoSources\s*=\s*(\[[\s\S]*?\]);/);
  if (!m) return [];
  let parsed = [];
  try {
    const asJson = m[1].replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":').replace(/:\s*'([^']*)'/g, ': "$1"');
    parsed = JSON.parse(asJson);
  } catch {
    return [];
  }
  return parsed.map((s) => {
    let backup = null;
    if (s.bk) {
      try {
        backup = decodeURIComponent(atob(s.bk));
      } catch {
        backup = null;
      }
    }
    return {
      quality: s.label || "unknown",
      url: s.file ? s.file.startsWith("http") ? s.file : `${BASE2}${s.file}` : "",
      backup
    };
  }).filter((s) => s.url);
}
__name(scrapeEmbed, "scrapeEmbed");
async function scrapeEpisodeWatch(epSlug, audio) {
  const html = await fetchHtml(`${BASE2}/${epSlug}`, { Referer: BASE2 });
  const title = stripTags(html.match(/<div\b[^>]*class=["'][^"']*info[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "");
  const tabs = [];
  for (const m of html.matchAll(/<a\b[^>]*data-toggle=["']tab["'][^>]*>/gi)) {
    const tag = m[0];
    const embedId = attr(tag, "data-id");
    const server = attr(tag, "data-mirror") || "AnimeGG";
    const version = attr(tag, "data-version") || "subbed";
    if (!embedId) continue;
    const normalized = version.startsWith("dub") ? "dub" : "sub";
    if (audio === "all" || normalized === audio) {
      tabs.push({ embedId, embedUrl: `${BASE2}/embed/${embedId}`, server, normalized });
    }
  }
  const results = await Promise.allSettled(tabs.map(async (tab, i) => {
    const sources = await scrapeEmbed(tab.embedId);
    const streams = sources.map((s, j) => ({
      url: s.url,
      type: s.url.includes(".m3u8") ? "hls" : "mp4",
      quality: s.quality,
      backup: s.backup,
      audio: tab.normalized,
      server: tab.server,
      embed: tab.embedUrl,
      referer: `${new URL(tab.embedUrl).origin}/`,
      priority: tabs.length - i,
      isActive: i === 0 && j === 0
    }));
    streams.push({
      url: tab.embedUrl,
      type: "embed",
      audio: tab.normalized,
      server: `${tab.server}-embed`,
      referer: `${new URL(tab.embedUrl).origin}/`,
      priority: 1,
      isActive: false
    });
    return streams;
  }));
  return { title, streams: results.flatMap((r) => r.status === "fulfilled" ? r.value : []) };
}
__name(scrapeEpisodeWatch, "scrapeEpisodeWatch");
async function searchFn(query) {
  const r1 = await search(query);
  const compact = query.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 4 && compact.toLowerCase() !== query.toLowerCase()) {
    try {
      const r2 = await search(compact);
      const seen = new Set(r1.map((r) => r.slug));
      r2.forEach((r) => {
        if (!seen.has(r.slug)) r1.push(r);
      });
    } catch {
    }
  }
  return r1;
}
__name(searchFn, "searchFn");
async function resolveSeries2(anilistId, ctx = {}) {
  const cacheKey = `np:animegg:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const candidates = await findTopSlugs(titles, searchFn);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = await getPrequelOffset(anilistId).catch(() => 0);
  const isSingleMovie = String(media?.format ?? "").toUpperCase() === "MOVIE" || expected === 1;
  const selected = await selectSeries(candidates, scrapeSeries, expected, media?.status, offset, {
    minScore: isSingleMovie ? 0.9 : 0.65
  });
  if (!selected) throw new Error(`AnimeGG match not found for AniList ${anilistId}`);
  const data = { slug: selected.slug, title: selected.title, mode: selected.mode, offset, score: selected.score };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}
__name(resolveSeries2, "resolveSeries");
function buildEpisodeLists(anilistId, series, providerEpisodes, ctx, expected) {
  const sub = [], dub = [];
  for (const src of providerEpisodes) {
    const number = series.mode === "offset" ? src.number - series.offset : src.number;
    if (number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? src.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: src.number
    };
    if (src.hasSub) sub.push({ ...base, id: `watch/animegg/${anilistId}/sub/animegg-${number}`, audio: "sub" });
    if (src.hasDub) dub.push({ ...base, id: `watch/animegg/${anilistId}/dub/animegg-${number}`, audio: "dub" });
  }
  return { sub, dub };
}
__name(buildEpisodeLists, "buildEpisodeLists");
async function getEpisodes4(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries2(anilistId, localCtx);
  const episodes = await scrapeSeries(series.slug);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "animegg",
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0
    },
    episodes: buildEpisodeLists(anilistId, series, episodes, localCtx, expected)
  };
}
__name(getEpisodes4, "getEpisodes");
async function handleWatch4(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries2(anilistId, ctx);
  const providerEp = series.mode === "offset" ? Number(epNum) + series.offset : Number(epNum);
  const episodes = await scrapeSeries(series.slug);
  const ep = episodes.find((e) => e.number === providerEp);
  if (!ep) return json({ error: `AnimeGG episode ${providerEp} not found` }, 404);
  const watch = await scrapeEpisodeWatch(ep.epSlug, audio);
  return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, title: watch.title, streams: watch.streams });
}
__name(handleWatch4, "handleWatch");
var animegg_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/animegg\/(\d+)\/(sub|dub)\/animegg-(\d+)\/?$/);
      if (m) return await handleWatch4(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};

// providers/anineko.js
var BASE3 = "https://anineko.to";
async function search2(query) {
  const html = await fetchHtml(`${BASE3}/browser?keyword=${encodeURIComponent(query)}`);
  const results = [];
  for (const m of html.matchAll(/<a\b[^>]*class=["'][^"']*nv-anime-thumb[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)) {
    const tag = m[0].match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = attr(tag, "href");
    const slug = href.match(/\/watch\/([^/?#]+)/)?.[1];
    if (!slug) continue;
    const titleMatch = m[0].match(/<(?:h3|[^>]+class=["'][^"']*nv-anime-title[^"']*["'][^>]*)>([\s\S]*?)<\/(?:h3|[^>]+)>/i);
    results.push({ slug, text: titleMatch ? stripTags(titleMatch[1]) : slug.replace(/-/g, " ") });
  }
  return results;
}
__name(search2, "search");
async function scrapeSeries2(slug) {
  const html = await fetchHtml(`${BASE3}/watch/${slug}`);
  const episodes = [];
  for (const m of html.matchAll(/<article\b[^>]*class=["'][^"']*nv-info-episode-item[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const block = m[1];
    const link = block.match(/<a\b[^>]*class=["'][^"']*nv-info-episode-main[^"']*["'][^>]*>/i)?.[0] ?? "";
    const href = attr(link, "href");
    const num = Number(href.match(/\/ep-(\d+)/)?.[1]);
    if (!Number.isFinite(num)) continue;
    const title = stripTags(block.match(/<a\b[^>]*class=["'][^"']*nv-info-episode-main[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? "");
    const badges = [...block.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)].map((b) => stripTags(b[1]).toLowerCase());
    episodes.push({
      number: num,
      title: title || `Episode ${num}`,
      epSlug: `ep-${num}`,
      hasSub: badges.includes("sub"),
      hasDub: badges.includes("dub")
    });
  }
  episodes.sort((a, b) => a.number - b.number);
  const seen = /* @__PURE__ */ new Set();
  return episodes.filter((e) => seen.has(e.number) ? false : (seen.add(e.number), true));
}
__name(scrapeSeries2, "scrapeSeries");
async function extractHls(embedUrl) {
  const html = await fetchHtml(embedUrl, { Referer: `${BASE3}/` }).catch(() => "");
  const patterns = [
    /const\s+src\s*=\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
    /file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\/master\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}
__name(extractHls, "extractHls");
async function scrapeEpisodeWatch2(seriesSlug, epSlug, audio) {
  const html = await fetchHtml(`${BASE3}/watch/${seriesSlug}/${epSlug}`, { Referer: `${BASE3}/watch/${seriesSlug}` });
  const byAudio = { sub: [], dub: [] };
  for (const panel of html.matchAll(/<div\b[^>]*class=["'][^"']*nv-server-grid[^"']*["'][^>]*data-id=["']([^"']+)["'][^>]*>([\s\S]*?)(?=<div\b[^>]*class=["'][^"']*nv-server-grid|$)/gi)) {
    const rawAudio = panel[1].toLowerCase();
    const panelAudio = rawAudio.includes("dub") ? "dub" : "sub";
    for (const btn of panel[2].matchAll(/data-video=["']([^"']+)["']/gi)) byAudio[panelAudio].push(decodeEntities(btn[1]));
  }
  const audios = audio === "all" ? ["sub", "dub"] : [audio];
  const streams = [];
  await Promise.all(audios.map(async (aud) => {
    const embeds = byAudio[aud] ?? [];
    const resolved2 = await Promise.all(embeds.map(async (embed, i) => {
      const hls = await extractHls(embed);
      return {
        url: hls ?? embed,
        type: hls ? "hls" : "embed",
        embed,
        audio: aud,
        server: "AniNeko",
        priority: embeds.length - i,
        referer: `${new URL(embed).origin}/`,
        isActive: i === 0
      };
    }));
    streams.push(...resolved2);
  }));
  return streams;
}
__name(scrapeEpisodeWatch2, "scrapeEpisodeWatch");
async function resolveSeries3(anilistId, ctx = {}) {
  const cacheKey = `np:anineko:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const candidates = await findTopSlugs(titles, search2);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = await getPrequelOffset(anilistId).catch(() => 0);
  const selected = await selectSeries(candidates, scrapeSeries2, expected, media?.status, offset);
  if (!selected) throw new Error(`AniNeko match not found for AniList ${anilistId}`);
  const data = { slug: selected.slug, title: selected.title, mode: selected.mode, offset, score: selected.score };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}
__name(resolveSeries3, "resolveSeries");
function buildEpisodeLists2(anilistId, series, providerEpisodes, ctx, expected) {
  const sub = [], dub = [];
  for (const src of providerEpisodes) {
    const number = series.mode === "offset" ? src.number - series.offset : src.number;
    if (number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? src.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: src.number
    };
    if (src.hasSub) sub.push({ id: `watch/anineko/${anilistId}/sub/anineko-${number}`, ...base, audio: "sub" });
    if (src.hasDub) dub.push({ id: `watch/anineko/${anilistId}/dub/anineko-${number}`, ...base, audio: "dub" });
  }
  return { sub, dub };
}
__name(buildEpisodeLists2, "buildEpisodeLists");
async function getEpisodes5(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries3(anilistId, localCtx);
  const episodes = await scrapeSeries2(series.slug);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "anineko",
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0
    },
    episodes: buildEpisodeLists2(anilistId, series, episodes, localCtx, expected)
  };
}
__name(getEpisodes5, "getEpisodes");
async function handleWatch5(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries3(anilistId, ctx);
  const providerEp = series.mode === "offset" ? Number(epNum) + series.offset : Number(epNum);
  const streams = await scrapeEpisodeWatch2(series.slug, `ep-${providerEp}`, audio);
  return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, streams });
}
__name(handleWatch5, "handleWatch");
var anineko_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/anineko\/(\d+)\/(sub|dub)\/anineko-(\d+)\/?$/);
      if (m) return await handleWatch5(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};

// providers/anidbapp.js
var BASE4 = "https://anidb.app";
var UA7 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
var NAV_HEADERS = [
  "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language: en-US,en;q=0.9",
  'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-mobile: ?0",
  'sec-ch-ua-platform: "Windows"',
  "sec-fetch-dest: document",
  "sec-fetch-mode: navigate",
  "sec-fetch-site: none",
  "sec-fetch-user: ?1",
  "upgrade-insecure-requests: 1"
];
var XHR_HEADERS = [
  "Accept: application/json, text/html, */*;q=0.8",
  "Accept-Language: en-US,en;q=0.9",
  'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-mobile: ?0",
  'sec-ch-ua-platform: "Windows"',
  "sec-fetch-dest: empty",
  "sec-fetch-mode: cors",
  "sec-fetch-site: same-origin",
  "X-Requested-With: XMLHttpRequest"
];
var cookieStore = "";
async function curlFetch(url, headersArray, extraArgs = []) {
  const headers = new Headers();
  headers.set("User-Agent", UA7);
  if (cookieStore) headers.set("Cookie", cookieStore);
  for (const h of headersArray) {
    const split = h.indexOf(":");
    if (split > 0) {
      headers.set(h.slice(0, split).trim(), h.slice(split + 1).trim());
    }
  }
  const res = await fetch(url, { headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookieStore = setCookie;
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} fetching ${url}`);
    err.rawBody = await res.text();
    throw err;
  }
  return await res.text();
}
__name(curlFetch, "curlFetch");
async function fetchAnidbHtml(url, referer) {
  const headers = referer ? [...NAV_HEADERS, `Referer: ${referer}`] : NAV_HEADERS;
  return curlFetch(url, headers);
}
__name(fetchAnidbHtml, "fetchAnidbHtml");
async function fetchXhr(url, referer) {
  const headers = referer ? [...XHR_HEADERS, `Referer: ${referer}`] : XHR_HEADERS;
  return curlFetch(url, headers);
}
__name(fetchXhr, "fetchXhr");
async function fetchJson(url, referer) {
  const text = await fetchXhr(url, referer);
  return JSON.parse(text);
}
__name(fetchJson, "fetchJson");
async function search3(query) {
  const html = await fetchXhr(`${BASE4}/search/suggestions?q=${encodeURIComponent(query)}`, `${BASE4}/home`).catch(() => "");
  const results = [];
  for (const m of html.matchAll(/<a\b[^>]*data-search-item\b[^>]*>[\s\S]*?<\/a>/gi)) {
    const tag = m[0].match(/<a\b[^>]*>/i)?.[0] ?? "";
    const href = attr(tag, "href");
    const path = href.startsWith("http") ? new URL(href).pathname : href;
    const slug = path.match(/^\/anime\/([^/?#]+)/)?.[1];
    if (!slug) continue;
    const title = stripTags(m[0].match(/<p\b[^>]*class=["'][^"']*text-sm[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const meta = stripTags(m[0].match(/<p\b[^>]*class=["'][^"']*text-xs[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
    const siteId = Number(slug.match(/-(\d+)$/)?.[1]);
    results.push({ slug, title: title || slug.replace(/-/g, " "), meta, siteId });
  }
  if (results.length) return results;
  const browseHtml = await fetchAnidbHtml(`${BASE4}/browse?q=${encodeURIComponent(query)}`, `${BASE4}/home`).catch(() => "");
  const seen = /* @__PURE__ */ new Set();
  for (const m of browseHtml.matchAll(/<a\b[^>]*href=["'](?:https:\/\/anidb\.app)?\/anime\/([^"']+)["'][^>]*class=["'][^"']*\banime-card\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)) {
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    const title = stripTags(m[0].match(/title=["']([^"']+)["']/i)?.[1] ?? "") || stripTags(m[0].match(/alt=["']([^"']+)["']/i)?.[1] ?? "") || slug.replace(/-/g, " ");
    const siteId = Number(slug.match(/-(\d+)$/)?.[1]);
    results.push({ slug, title, meta: "", siteId });
  }
  return results;
}
__name(search3, "search");
function parseExternalIds(html) {
  return {
    anilistId: Number(html.match(/https:\/\/anilist\.co\/anime\/(\d+)/i)?.[1]) || null,
    malId: Number(html.match(/https:\/\/myanimelist\.net\/anime\/(\d+)/i)?.[1]) || null,
    anidbId: Number(html.match(/https:\/\/anidb\.net\/anime\/(\d+)/i)?.[1]) || null,
    kitsuId: Number(html.match(/https:\/\/kitsu\.app\/anime\/(\d+)/i)?.[1]) || null
  };
}
__name(parseExternalIds, "parseExternalIds");
function parsePageTitle(html) {
  return stripTags(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
}
__name(parsePageTitle, "parsePageTitle");
function searchQueries(media, anizip) {
  const titles = buildTitles(media, anizip);
  const out = /* @__PURE__ */ new Set();
  for (const title of titles.slice(0, 5)) {
    out.add(title);
    const words = title.trim().split(/\s+/);
    if (words.length > 4) out.add(words.slice(0, 4).join(" "));
  }
  return [...out].filter((q) => q.length >= 2);
}
__name(searchQueries, "searchQueries");
async function resolveSeries4(anilistId, ctx = {}) {
  const cacheKey = `np:anidbapp:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const queries = searchQueries(media, ctx.anizip);
  const candidates = /* @__PURE__ */ new Map();
  await Promise.all(queries.map(async (q) => {
    for (const r of await search3(q).catch(() => [])) {
      if (!candidates.has(r.slug)) candidates.set(r.slug, r);
    }
  }));
  for (const candidate of candidates.values()) {
    const html = await fetchAnidbHtml(`${BASE4}/anime/${candidate.slug}`, `${BASE4}/home`).catch(() => "");
    if (!html) continue;
    const ids = parseExternalIds(html);
    if (ids.anilistId !== Number(anilistId)) continue;
    const data = {
      slug: candidate.slug,
      siteId: candidate.siteId || Number(candidate.slug.match(/-(\d+)$/)?.[1]),
      title: parsePageTitle(html) || candidate.title,
      matchType: "anilist",
      matchScore: 1,
      ...ids
    };
    set(cacheKey, data, SHOW_IDENTITY_TTL);
    return data;
  }
  const malId = media?.idMal ?? null;
  if (malId) {
    for (const candidate of candidates.values()) {
      const html = await fetchAnidbHtml(`${BASE4}/anime/${candidate.slug}`, `${BASE4}/home`).catch(() => "");
      if (!html) continue;
      const ids = parseExternalIds(html);
      if (ids.anilistId || ids.malId !== Number(malId)) continue;
      const data = {
        slug: candidate.slug,
        siteId: candidate.siteId || Number(candidate.slug.match(/-(\d+)$/)?.[1]),
        title: parsePageTitle(html) || candidate.title,
        matchType: "mal",
        matchScore: 0.9,
        ...ids
      };
      set(cacheKey, data, SHOW_IDENTITY_TTL);
      return data;
    }
  }
  throw new Error(`AniDB.app match not found for AniList ${anilistId}`);
}
__name(resolveSeries4, "resolveSeries");
async function fetchProviderEpisodes(siteId) {
  const data = await fetchJson(`${BASE4}/api/frontend/anime/${siteId}/episodes`, `${BASE4}/anime/${siteId}`);
  return Array.isArray(data.episodes) ? data.episodes : [];
}
__name(fetchProviderEpisodes, "fetchProviderEpisodes");
function inferOffset(providerEpisodes, expected) {
  const nums = providerEpisodes.map((e) => Number(e.number)).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length || !expected) return 0;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (min > expected) return min - 1;
  if (min > 1 && max - min + 1 >= expected) return min - 1;
  return 0;
}
__name(inferOffset, "inferOffset");
async function fetchLanguages(episodeId, seriesSlug) {
  const data = await fetchJson(`${BASE4}/api/frontend/episode/${episodeId}/languages`, `${BASE4}/anime/${seriesSlug}`).catch(() => null);
  return Array.isArray(data?.languages) ? data.languages : [];
}
__name(fetchLanguages, "fetchLanguages");
function hasLanguage(languages, audio) {
  return Boolean(languageForAudio(languages, audio)?.embed_url);
}
__name(hasLanguage, "hasLanguage");
function buildEpisodeLists3(anilistId, providerEpisodes, ctx, expected, offset, availability) {
  const sub = [];
  const dub = [];
  for (const src of providerEpisodes) {
    const sourceNumber = Number(src.number);
    const number = sourceNumber - offset;
    if (!Number.isFinite(number) || number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: src.filler ?? meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber,
      sourceId: src.id
    };
    if (availability.hasSub) sub.push({ ...base, id: `watch/anidbapp/${anilistId}/sub/anidbapp-${number}`, audio: "sub" });
    if (availability.hasDub) dub.push({ ...base, id: `watch/anidbapp/${anilistId}/dub/anidbapp-${number}`, audio: "dub" });
  }
  return { sub, dub };
}
__name(buildEpisodeLists3, "buildEpisodeLists");
function languageForAudio(languages, audio) {
  const preferred = audio === "sub" ? ["jpn", "ja", "japanese"] : ["eng", "en", "english"];
  return languages.find((l) => preferred.includes(String(l.code ?? "").toLowerCase())) ?? languages.find((l) => preferred.includes(String(l.name ?? "").toLowerCase())) ?? null;
}
__name(languageForAudio, "languageForAudio");
function extractHls2(html) {
  const patterns = [
    /file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
    /sources\s*:\s*\[\s*\{[^}]*file\s*:\s*["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\/master\.m3u8[^"']*)["']/i,
    /["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) return decodeEntities(m[1]);
  }
  return null;
}
__name(extractHls2, "extractHls");
async function streamsForEmbed(embedUrl, audio, language) {
  const html = await fetchAnidbHtml(embedUrl, { Referer: `${BASE4}/` }).catch(() => "");
  const hls = html ? extractHls2(html) : null;
  const streams = [];
  if (hls) {
    streams.push({
      url: hls,
      type: "hls",
      audio,
      language: language.code,
      server: "AniDB.app",
      embed: embedUrl,
      referer: `${new URL(embedUrl).origin}/`,
      priority: 5,
      isActive: true
    });
  }
  streams.push({
    url: embedUrl,
    type: "embed",
    audio,
    language: language.code,
    server: "AniDB.app-embed",
    referer: `${BASE4}/`,
    priority: 4,
    isActive: !hls
  });
  return streams;
}
__name(streamsForEmbed, "streamsForEmbed");
async function getEpisodes6(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries4(anilistId, localCtx);
  const episodes = await fetchProviderEpisodes(series.siteId);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = inferOffset(episodes, expected);
  const sampleLanguages = episodes[0]?.id ? await fetchLanguages(episodes[0].id, series.slug) : [];
  const availability = {
    hasSub: hasLanguage(sampleLanguages, "sub") || !sampleLanguages.length,
    hasDub: hasLanguage(sampleLanguages, "dub")
  };
  return {
    meta: {
      id: series.slug,
      siteId: series.siteId,
      title: series.title,
      source: "anidbapp",
      matchScore: series.matchScore,
      matchType: series.matchType,
      anilistId: series.anilistId,
      malId: series.malId,
      numbering: offset ? "offset" : "local",
      episodeOffset: offset
    },
    episodes: buildEpisodeLists3(anilistId, episodes, localCtx, expected, offset, availability)
  };
}
__name(getEpisodes6, "getEpisodes");
async function handleWatch6(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries4(anilistId, ctx);
  const episodes = await fetchProviderEpisodes(series.siteId);
  const media = ctx.media ?? await getMedia(anilistId).catch(() => null);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = inferOffset(episodes, expected);
  const providerEp = Number(epNum) + offset;
  const episode = episodes.find((e) => Number(e.number) === providerEp);
  if (!episode) return json({ error: `AniDB.app episode ${epNum} not found` }, 404);
  const languages = await fetchLanguages(episode.id, series.slug);
  const language = languageForAudio(languages, audio);
  if (!language?.embed_url) {
    return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, streams: [] });
  }
  const embedUrl = decodeEntities(language.embed_url);
  const streams = await streamsForEmbed(embedUrl, audio, language);
  return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, language: language.code, streams });
}
__name(handleWatch6, "handleWatch");
var anidbapp_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/anidbapp\/(\d+)\/(sub|dub)\/anidbapp-(\d+)\/?$/);
      if (m) return await handleWatch6(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};

// providers/2dhive.js
async function getMalId(anilistId, ctx) {
  const idMal = ctx?.media?.idMal ?? (await getMedia(anilistId)).idMal;
  if (!idMal) throw new Error(`2dhive: no MAL ID found for AniList ${anilistId}`);
  return idMal;
}
__name(getMalId, "getMalId");
var BASE5 = "https://2dhive.com";
var UA8 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
async function fetchPage(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA8 } });
  if (!res.ok) throw new Error(`2dhive ${res.status}: ${url}`);
  return res.text();
}
__name(fetchPage, "fetchPage");
function extractPlayerProps(html) {
  const idx = html.indexOf("prefetchedHls");
  if (idx === -1) return null;
  const propsIdx = html.lastIndexOf('props="', idx);
  if (propsIdx === -1) return null;
  const valueIdx = propsIdx + 7;
  const endIdx = html.indexOf('"', valueIdx);
  if (endIdx === -1) return null;
  const raw2 = html.slice(valueIdx, endIdx).replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  try {
    return JSON.parse(raw2);
  } catch {
    return null;
  }
}
__name(extractPlayerProps, "extractPlayerProps");
function astroDecode(v) {
  if (!Array.isArray(v)) return v;
  const [type, data] = v;
  if (type === 0) {
    if (data === null || typeof data !== "object" || Array.isArray(data)) return data;
    return Object.fromEntries(Object.entries(data).map(([k, val]) => [k, astroDecode(val)]));
  }
  if (type === 1) return Array.isArray(data) ? data.map(astroDecode) : data;
  return data;
}
__name(astroDecode, "astroDecode");
function decodeProps(raw2) {
  return Object.fromEntries(Object.entries(raw2).map(([k, v]) => [k, astroDecode(v)]));
}
__name(decodeProps, "decodeProps");
function parseEpisodeNums(html, malId) {
  const re = new RegExp(`/episode\\?anime=${malId}&(?:amp;)?ep_num=(\\d+)`, "gi");
  const nums = /* @__PURE__ */ new Set();
  for (const m of html.matchAll(re)) nums.add(Number(m[1]));
  return [...nums].sort((a, b) => a - b);
}
__name(parseEpisodeNums, "parseEpisodeNums");
async function fetchEpisodePage(malId, epNum) {
  const html = await fetchPage(`${BASE5}/episode?anime=${malId}&ep_num=${epNum}`);
  const rawProps = extractPlayerProps(html);
  if (!rawProps) throw new Error(`2dhive: no player props for mal ${malId} ep${epNum}`);
  return decodeProps(rawProps);
}
__name(fetchEpisodePage, "fetchEpisodePage");
async function getEpisodes7(anilistId, ctx = {}) {
  const malId = await getMalId(anilistId, ctx);
  const animeHtml = await fetchPage(`${BASE5}/anime?anime=${malId}`);
  const epNums = parseEpisodeNums(animeHtml, malId);
  if (!epNums.length) throw new Error(`2dhive: no episodes found for AniList ${anilistId} (MAL ${malId})`);
  const props = await fetchEpisodePage(malId, epNums[0]);
  const hasDub = Boolean(props.prefetchedHls?.dub?.content);
  const expected = expectedCount(ctx.media, ctx.anizip, ctx.jikanEps);
  const sub = [], dub = [];
  for (const num of epNums) {
    if (expected && num > expected) continue;
    const meta = episodeMeta(num, ctx);
    const base = {
      number: num,
      title: meta.title ?? `Episode ${num}`,
      duration: meta.duration ?? null,
      filler: meta.filler ?? false,
      uncensored: meta.uncensored ?? false,
      description: meta.description ?? null,
      image: meta.image ?? null,
      airDate: meta.airDate ?? null
    };
    sub.push({ id: `watch/2dhive/${anilistId}/sub/2dhive-${num}`, ...base, audio: "sub" });
    if (hasDub) dub.push({ id: `watch/2dhive/${anilistId}/dub/2dhive-${num}`, ...base, audio: "dub" });
  }
  return {
    meta: {
      id: String(anilistId),
      source: "2dhive",
      matchScore: 1,
      numbering: "standard",
      episodeOffset: 0
    },
    episodes: { sub, dub }
  };
}
__name(getEpisodes7, "getEpisodes");
async function handleWatch7(anilistId, audio, epNum) {
  const malId = await getMalId(anilistId);
  const referer = `${BASE5}/episode?anime=${malId}&ep_num=${epNum}`;
  const fileKey = `${malId}_${epNum}_${audio}`;
  const [propsResult, hiAnimeResult, dlContent] = await Promise.allSettled([
    fetchEpisodePage(malId, epNum),
    audio !== "dub" ? fetch(`${BASE5}/api/hianime?mal_id=${malId}&ep_num=${epNum}`, {
      headers: { "User-Agent": UA8, "Referer": referer }
    }).then((r) => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
    fetchDownloadHls(malId, audio, epNum)
  ]);
  const streams = [];
  const props = propsResult.status === "fulfilled" ? propsResult.value : null;
  if (props) {
    const hlsContent = audio === "dub" ? props.prefetchedHls?.dub?.content : props.prefetchedHls?.sub?.content;
    if (hlsContent) {
      streams.push({
        server: audio === "dub" ? "HLS DUB" : "HLS SUB",
        url: `/stream/2dhive/${anilistId}/${audio}/${epNum}`
      });
    }
    const rawServers = Array.isArray(props.servers) ? props.servers : [];
    const hadfreeEntries = rawServers.filter(
      (s) => s.server_name === "HAdfree" && Boolean(s.dub) === (audio === "dub") && s.slug
    );
    const hadfreeResults = await Promise.allSettled(
      hadfreeEntries.map(
        (entry) => fetch(`${BASE5}/api/hadfree?slug=${encodeURIComponent(entry.slug)}`, {
          headers: { "User-Agent": UA8, "Referer": referer }
        }).then((r) => r.ok ? r.json() : null).catch(() => null)
      )
    );
    for (const r of hadfreeResults) {
      if (r.status === "fulfilled" && r.value?.streamUrl) {
        streams.push({ server: "HAdfree", url: r.value.streamUrl });
      }
    }
  }
  streams.push({
    server: audio === "dub" ? "MegaPlay Dub" : "MegaPlay Sub",
    url: `https://megaplay.buzz/stream/mal/${malId}/${epNum}/${audio === "dub" ? "dub" : "sub"}`,
    type: "embed"
  });
  const hiAnime = hiAnimeResult.status === "fulfilled" ? hiAnimeResult.value : null;
  if (hiAnime?.m3u8) {
    const entry = { server: "hiAnime", url: hiAnime.m3u8 };
    if (hiAnime.subtitle) entry.subtitle = hiAnime.subtitle;
    streams.push(entry);
  }
  if (dlContent.status === "fulfilled" && dlContent.value) {
    streams.push({
      server: "Download",
      url: `/stream/2dhive/download/${anilistId}/${audio}/${epNum}`
    });
  }
  return json({ anilistId: Number(anilistId), episode: Number(epNum), audio, streams });
}
__name(handleWatch7, "handleWatch");
async function fetchDownloadHls(malId, audio, epNum) {
  const fileKey = `${malId}_${epNum}_${audio}`;
  try {
    const res = await fetch(`${BASE5}/download?file=${encodeURIComponent(fileKey)}`, {
      headers: {
        "User-Agent": UA8,
        "Referer": `${BASE5}/episode?anime=${malId}&ep_num=${epNum}`
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/downloadPayload\s*=\s*(\{.*?\});/s);
    if (!m) return null;
    const payload = JSON.parse(m[1]);
    return payload.hlsContent || null;
  } catch {
    return null;
  }
}
__name(fetchDownloadHls, "fetchDownloadHls");
async function handleDownloadStream(anilistId, audio, epNum) {
  const malId = await getMalId(anilistId);
  const content = await fetchDownloadHls(malId, audio, epNum);
  if (!content) {
    return new Response(JSON.stringify({ error: "No download stream found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleDownloadStream, "handleDownloadStream");
async function handleStream(anilistId, audio, epNum) {
  const malId = await getMalId(anilistId);
  const props = await fetchEpisodePage(malId, epNum);
  const content = audio === "dub" ? props.prefetchedHls?.dub?.content : props.prefetchedHls?.sub?.content;
  if (!content) {
    return new Response(JSON.stringify({ error: "No HLS stream found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleStream, "handleStream");
var dhive_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      let m = path.match(/^\/watch\/2dhive\/(\d+)\/(sub|dub)\/2dhive-(\d+)\/?$/);
      if (m) return await handleWatch7(m[1], m[2], m[3]);
      m = path.match(/^\/stream\/2dhive\/(\d+)\/(sub|dub)\/(\d+)\/?$/);
      if (m) return await handleStream(m[1], m[2], m[3]);
      m = path.match(/^\/stream\/2dhive\/download\/(\d+)\/(sub|dub)\/(\d+)\/?$/);
      if (m) return await handleDownloadStream(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// providers/animenosub.js
import crypto2 from "node:crypto";
import { Buffer as Buffer2 } from "node:buffer";
var BASE6 = "https://animenosub.to";
var UA9 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36";
function b64u(buf) {
  return Buffer2.from(buf).toString("base64url");
}
__name(b64u, "b64u");
function b64uDec(s) {
  return Buffer2.from(s, "base64url");
}
__name(b64uDec, "b64uDec");
var _be = 512;
var _lt = _be - 1;
var _dr = 2;
var _lr = 2654435761;
var _hr = 2246822519;
var _rot = /* @__PURE__ */ __name((t, e) => (t << e | t >>> 32 - e) >>> 0, "_rot");
var _mul = /* @__PURE__ */ __name((t, e) => Math.imul(t, e) >>> 0, "_mul");
function _mix(t) {
  t[0] = t[0] + t[1] >>> 0;
  t[3] = _rot(t[3] ^ t[0], 16);
  t[2] = t[2] + t[3] >>> 0;
  t[1] = _rot(t[1] ^ t[2], 12);
  t[0] = t[0] + t[1] >>> 0;
  t[3] = _rot(t[3] ^ t[0], 8);
  t[2] = t[2] + t[3] >>> 0;
  t[1] = _rot(t[1] ^ t[2], 7);
}
__name(_mix, "_mix");
function _hash(t) {
  const e = new Uint32Array([1779033703, 3144134277, 1013904242, 2773480762]);
  for (let i = 0; i < t.length; i++) {
    e[0] = e[0] + t[i] >>> 0;
    e[0] = _rot(e[0], 7);
    _mix(e);
  }
  for (let i = 0; i < 8; i++) _mix(e);
  const r = new Uint32Array(_be);
  for (let i = 0; i < _be; i++) {
    _mix(e);
    r[i] = (e[0] ^ e[2]) >>> 0;
  }
  for (let i = 0; i < _dr; i++) {
    for (let s = 0; s < _be; s++) {
      const a = r[s] & _lt;
      let c = r[s] + r[a] >>> 0;
      c = _rot(c, 13);
      c = (c ^ _mul(r[s + 1 & _lt], _lr)) >>> 0;
      r[s] = c;
      e[0] = (e[0] ^ c) >>> 0;
      _mix(e);
    }
  }
  const n = new Uint32Array(8), o = _be / 8;
  for (let i = 0; i < 8; i++) {
    _mix(e);
    let s = e[0];
    const a = i * o;
    for (let c = 0; c < o; c++) {
      const d = r[a + c];
      s = s + d >>> 0;
      s = _rot(s, 5);
      s = (s ^ _mul(d, _hr)) >>> 0;
    }
    n[i] = (s ^ e[2]) >>> 0;
  }
  return n;
}
__name(_hash, "_hash");
function _latin1Bytes(t) {
  const e = new Uint8Array(t.length);
  for (let r = 0; r < t.length; r++) e[r] = t.charCodeAt(r) & 255;
  return e;
}
__name(_latin1Bytes, "_latin1Bytes");
function _leadingZeros(t) {
  let e = 0;
  for (let r = 0; r < t.length; r++) {
    const n = t[r];
    if (n === 0) {
      e += 32;
      continue;
    }
    return e + Math.clz32(n);
  }
  return e;
}
__name(_leadingZeros, "_leadingZeros");
function solvePoW(nonce, difficulty) {
  const prefix = nonce + ":";
  for (let s = 0; ; s++) {
    if (_leadingZeros(_hash(_latin1Bytes(prefix + s))) >= difficulty) return String(s);
  }
}
__name(solvePoW, "solvePoW");
async function resolveByse(embedUrl) {
  const code = embedUrl.match(/\/e\/([a-z0-9]+)/i)?.[1];
  if (!code) throw new Error(`Cannot extract Byse code from ${embedUrl}`);
  const det = await (await fetch(`https://bysesayeveum.com/api/videos/${code}/embed/details`, {
    headers: { "User-Agent": UA9, "Referer": embedUrl }
  })).json();
  const frameUrl = det.embed_frame_url;
  const frameBase = new URL(frameUrl).origin;
  const ch = await (await fetch(`${frameBase}/api/videos/access/challenge`, {
    method: "POST",
    headers: { "Content-Length": "0", "Origin": frameBase, "Referer": frameUrl, "User-Agent": UA9 }
  })).json();
  const keyPair = await crypto2.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
  const pubJwk = await crypto2.subtle.exportKey("jwk", keyPair.publicKey);
  const sig = await crypto2.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keyPair.privateKey, new TextEncoder().encode(ch.nonce));
  const att = await (await fetch(`${frameBase}/api/videos/access/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": UA9 },
    body: JSON.stringify({ nonce: ch.nonce, challenge_id: ch.challenge_id, public_key: pubJwk, signature: b64u(sig) })
  })).json();
  const viewerId = att.viewer_id, deviceId = att.device_id, fpToken = att.token, confidence = att.confidence;
  const cookieStr = `byse_viewer_id=${viewerId}; byse_device_id=${deviceId}`;
  const fingerprint = { token: fpToken, viewer_id: viewerId, device_id: deviceId, confidence };
  const cap = await (await fetch(`${frameBase}/api/videos/${code}/embed/captcha`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": UA9, "Cookie": cookieStr, "X-Embed-Parent": embedUrl },
    body: "{}"
  })).json();
  const solution = solvePoW(cap.pow_nonce, cap.pow_difficulty);
  const ver = await (await fetch(`${frameBase}/api/videos/${code}/embed/captcha/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": UA9, "Cookie": cookieStr, "X-Embed-Parent": embedUrl },
    body: JSON.stringify({ pow_token: cap.pow_token, solution, fingerprint })
  })).json();
  const pbData = await (await fetch(`${frameBase}/api/videos/${code}/embed/playback`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": frameBase, "Referer": frameUrl, "User-Agent": UA9, "Cookie": cookieStr, "X-Captcha-Token": ver.token, "X-Embed-Parent": embedUrl },
    body: JSON.stringify({ fingerprint })
  })).json();
  const pb = pbData.playback;
  const keyBytes = Buffer2.concat(pb.key_parts.filter((k) => b64uDec(k).length === 16).map((k) => b64uDec(k)));
  const aesKey = await crypto2.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const dec2 = await crypto2.subtle.decrypt({ name: "AES-GCM", iv: b64uDec(pb.iv) }, aesKey, b64uDec(pb.payload));
  const playback = JSON.parse(new TextDecoder().decode(dec2));
  return playback.sources.map((s) => s.url);
}
__name(resolveByse, "resolveByse");
var NOVA_KEY = Buffer2.from("6b69656d7469656e6d75613931316361", "hex");
var NOVA_IV = Buffer2.from("313233343536373839306f6975797472", "hex");
async function resolveNova(embedUrl) {
  const id = embedUrl.match(/upn\.one\/#([A-Za-z0-9]+)/i)?.[1];
  if (!id) throw new Error(`Cannot extract Nova id from ${embedUrl}`);
  const res = await fetch(`https://nova.upn.one/api/v1/video?id=${id}&w=1920&h=1080&r=`, {
    headers: { "User-Agent": UA9, "Referer": "https://nova.upn.one/" }
  });
  if (!res.ok) throw new Error(`Nova fetch HTTP ${res.status}`);
  const hex = (await res.text()).trim();
  const decipher = crypto2.createDecipheriv("aes-128-cbc", NOVA_KEY, NOVA_IV);
  const decrypted = Buffer2.concat([decipher.update(Buffer2.from(hex, "hex")), decipher.final()]);
  const data = JSON.parse(decrypted.toString("utf8"));
  const m3u8 = data.cf ?? data.source;
  if (!m3u8) throw new Error("Nova response missing m3u8 url");
  return [m3u8];
}
__name(resolveNova, "resolveNova");
async function resolveVidmoly(embedUrl) {
  const url = embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl;
  const res = await fetch(url, {
    headers: { "User-Agent": UA9, "Referer": `${BASE6}/` },
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`Vidmoly fetch HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/sources:\s*\[\s*\{\s*file:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/);
  if (!m) throw new Error("Vidmoly m3u8 not found in embed HTML");
  return [m[1]];
}
__name(resolveVidmoly, "resolveVidmoly");
async function search4(query) {
  const res = await fetch(`${BASE6}/wp-admin/admin-ajax.php`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
      Origin: BASE6,
      Referer: `${BASE6}/`
    },
    body: `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
  });
  if (!res.ok) throw new Error(`animenosub search HTTP ${res.status}`);
  const data = await res.json();
  const results = [];
  for (const item of data?.anime?.[0]?.all ?? []) {
    const slug = item.post_link?.match(/\/anime\/([^/]+)\/?$/)?.[1];
    if (!slug) continue;
    results.push({ slug, text: item.post_title ?? slug.replace(/-/g, " ") });
  }
  return results;
}
__name(search4, "search");
async function scrapeSeries3(slug) {
  const html = await fetchHtml(`${BASE6}/anime/${slug}/`, { Referer: BASE6 });
  const isSlugDub = /-dub$/.test(slug) || /(?:^|[-\s])dub(?:$|[-\s])/i.test(slug);
  const episodes = [];
  const seen = /* @__PURE__ */ new Set();
  const listRe = /<li\b[^>]*data-index="\d+"[^>]*>[\s\S]*?<a\s+href="(https?:\/\/animenosub\.to\/[^"]+)"[\s\S]*?<div\s+class="epl-num">([^<]+)<\/div>/gi;
  for (const m of html.matchAll(listRe)) {
    const epUrl = decodeEntities(m[1]);
    const label = m[2].trim();
    let number;
    if (/^movie$/i.test(label)) {
      number = 1;
    } else {
      const n = parseFloat(label);
      number = Number.isFinite(n) && n >= 1 ? Math.round(n) : null;
    }
    if (number === null || seen.has(number)) continue;
    seen.add(number);
    const isDub2 = isSlugDub || /-dub(?:$|\/)/.test(epUrl);
    episodes.push({ number, title: /^movie$/i.test(label) ? "Movie" : `Episode ${number}`, epUrl, hasSub: !isDub2, hasDub: isDub2 });
  }
  episodes.sort((a, b) => a.number - b.number);
  return episodes;
}
__name(scrapeSeries3, "scrapeSeries");
async function scrapeEmbeds(epUrl) {
  const html = await fetchHtml(epUrl, { Referer: `${BASE6}/` });
  const streams = [];
  for (const m of html.matchAll(/<option\s+value="([A-Za-z0-9+/=]+)"\s+data-index="\d+"[^>]*>([^<]+)<\/option>/gi)) {
    const b64 = m[1];
    const serverName = m[2].trim();
    if (!serverName || /select video server/i.test(serverName)) continue;
    let embedUrl = null;
    try {
      const decoded = atob(b64);
      embedUrl = decoded.match(/src=["']([^"']+)["']/i)?.[1] ?? null;
    } catch {
      continue;
    }
    if (!embedUrl) continue;
    const embedOrigin = (() => {
      try {
        const u = new URL(embedUrl.startsWith("//") ? `https:${embedUrl}` : embedUrl);
        return `${u.protocol}//${u.host}/`;
      } catch {
        return epUrl;
      }
    })();
    streams.push({
      url: embedUrl,
      type: "embed",
      server: serverName,
      referer: embedOrigin,
      priority: streams.length === 0 ? 2 : 1,
      isActive: streams.length === 0
    });
  }
  if (streams.length === 0) {
    for (const m of html.matchAll(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
      const src = m[1];
      if (/vidmoly|vtbe|streamtape|dood|filemoon|upn\.one|bysesa/i.test(src)) {
        const embedOrigin = (() => {
          try {
            const u = new URL(src.startsWith("//") ? `https:${src}` : src);
            return `${u.protocol}//${u.host}/`;
          } catch {
            return epUrl;
          }
        })();
        streams.push({ url: src, type: "embed", server: "Direct", referer: embedOrigin, priority: 2, isActive: true });
        break;
      }
    }
  }
  return streams;
}
__name(scrapeEmbeds, "scrapeEmbeds");
async function resolveSeries5(anilistId, ctx = {}) {
  const cacheKey = `np:animenosub:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const candidates = await findTopSlugs(titles, search4);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = await getPrequelOffset(anilistId).catch(() => 0);
  const selected = await selectSeries(candidates, scrapeSeries3, expected, media?.status, offset);
  if (!selected) throw new Error(`animenosub match not found for AniList ${anilistId}`);
  const data = { slug: selected.slug, title: selected.title, mode: selected.mode, offset, score: selected.score };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}
__name(resolveSeries5, "resolveSeries");
function buildEpisodeLists4(anilistId, series, providerEpisodes, ctx, expected) {
  const sub = [], dub = [];
  for (const src of providerEpisodes) {
    const number = series.mode === "offset" ? src.number - series.offset : src.number;
    if (number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? src.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: src.number
    };
    if (src.hasSub) sub.push({ ...base, id: `watch/animenosub/${anilistId}/sub/animenosub-${number}`, audio: "sub" });
    if (src.hasDub) dub.push({ ...base, id: `watch/animenosub/${anilistId}/dub/animenosub-${number}`, audio: "dub" });
  }
  return { sub, dub };
}
__name(buildEpisodeLists4, "buildEpisodeLists");
async function getEpisodes8(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries5(anilistId, localCtx);
  const episodes = await scrapeSeries3(series.slug);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "animenosub",
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0
    },
    episodes: buildEpisodeLists4(anilistId, series, episodes, localCtx, expected)
  };
}
__name(getEpisodes8, "getEpisodes");
async function withRetry(fn, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (_) {
      if (i === attempts - 1) return null;
    }
  }
  return null;
}
__name(withRetry, "withRetry");
function isByse(url) {
  return /bysesayeveum\.com\/e\//i.test(url);
}
__name(isByse, "isByse");
function isVidmoly(url) {
  return /vidmoly\.(net|biz|to)/i.test(url);
}
__name(isVidmoly, "isVidmoly");
function isNova(url) {
  return /upn\.one/i.test(url);
}
__name(isNova, "isNova");
async function handleWatch8(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries5(anilistId, ctx);
  const providerEp = series.mode === "offset" ? Number(epNum) + series.offset : Number(epNum);
  const episodes = await scrapeSeries3(series.slug);
  const ep = episodes.find((e) => e.number === providerEp && (audio === "dub" ? e.hasDub : e.hasSub)) ?? episodes.find((e) => e.number === providerEp);
  if (!ep) throw new Error(`animenosub episode ${providerEp} not found`);
  const embeds = await scrapeEmbeds(ep.epUrl);
  const resolvable = embeds.filter((s) => isByse(s.url) || isVidmoly(s.url) || isNova(s.url));
  const resolvedList = await Promise.all(resolvable.map((s) => {
    if (isByse(s.url)) return withRetry(() => resolveByse(s.url));
    if (isVidmoly(s.url)) return withRetry(() => resolveVidmoly(s.url));
    if (isNova(s.url)) return withRetry(() => resolveNova(s.url));
  }));
  const resolvedMap = new Map(resolvable.map((s, i) => [s.url, resolvedList[i]]));
  const streams = [];
  for (const stream of embeds) {
    const m3u8Urls = resolvedMap.get(stream.url);
    if (m3u8Urls) {
      const referer = isVidmoly(stream.url) ? "https://vidmoly.biz/" : isNova(stream.url) ? "https://nova.upn.one/" : "https://bysesayeveum.com/";
      for (const m3u8 of m3u8Urls) {
        streams.push({
          url: m3u8,
          type: "hls",
          server: stream.server,
          referer,
          priority: stream.priority,
          isActive: stream.isActive
        });
      }
    }
    streams.push(stream);
  }
  return json({ anilistId: Number(anilistId), episode: Number(epNum), providerEpisode: providerEp, audio, streams });
}
__name(handleWatch8, "handleWatch");
var animenosub_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/animenosub\/(\d+)\/(sub|dub)\/animenosub-(\d+)\/?$/);
      if (m) return await handleWatch8(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};

// providers/anizone.js
var BASE7 = "https://anizone.to";
function scoreCandidate2(query, candidate, slug) {
  const base = Math.max(diceCoeff(query, candidate), diceCoeff(query, slug.replace(/-/g, " ")));
  const isMovieQuery = /\b(movie|film|the movie)\b/i.test(query);
  const isMovieMatch = /\b(movie|film)\b/i.test(candidate) || /movie|film/.test(slug);
  if (isMovieQuery && !isMovieMatch) return base * 0.4;
  const qLen = norm(query).length;
  const sLen = norm(slug.replace(/-/g, " ")).length;
  return sLen > qLen * 1.6 + 4 ? base * 0.8 : base;
}
__name(scoreCandidate2, "scoreCandidate");
function buildSearchQueries2(title) {
  const queries = /* @__PURE__ */ new Set([title]);
  const words = title.trim().split(/\s+/);
  if (words.length > 4) queries.add(words.slice(0, 4).join(" "));
  if (words.length > 3) queries.add(words.slice(0, 3).join(" "));
  const stripped = title.replace(/\bseason\s*\d+\b/gi, "").replace(/\bpart\s*\d+\b/gi, "").replace(/\b\d+rd\b|\b\d+th\b|\b\d+st\b|\b\d+nd\b/gi, "").replace(/\s+/g, " ").trim();
  if (stripped && stripped !== title) queries.add(stripped);
  return [...queries].filter((q) => q.length >= 3);
}
__name(buildSearchQueries2, "buildSearchQueries");
async function findCandidates(titles, searchFn3, n = 6) {
  const allCandidates = /* @__PURE__ */ new Map();
  const searchQueries2 = /* @__PURE__ */ new Set();
  for (const title of titles.slice(0, 4)) {
    for (const q of buildSearchQueries2(title)) searchQueries2.add(q);
  }
  await Promise.all([...searchQueries2].map(async (q) => {
    try {
      const results = await searchFn3(q);
      for (const r of results) if (!allCandidates.has(r.slug)) allCandidates.set(r.slug, r.text);
    } catch {
    }
  }));
  const scored = [];
  for (const [slug, text] of allCandidates) {
    let best = 0;
    for (const title of titles.slice(0, 2)) best = Math.max(best, scoreCandidate2(title, text, slug));
    if (best >= 0.5) scored.push({ slug, title: text, score: best });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, n);
}
__name(findCandidates, "findCandidates");
function processJsonArg(raw2) {
  const PH = "U";
  let s = raw2.replace(/\\\\u([0-9a-fA-F]{4})/g, `${PH}$1`);
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  s = s.replace(/\x01U\x01([0-9a-fA-F]{4})/g, "\\u$1");
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
__name(processJsonArg, "processJsonArg");
function pickTitle(titles) {
  return titles["1"] || titles["5"] || titles["8"] || Object.values(titles)[0] || "";
}
__name(pickTitle, "pickTitle");
function extractSlug(ctx) {
  const m = ctx.match(/href="(?:https:\/\/anizone\.to)?\/anime\/([a-z0-9-]+)"/);
  return m ? m[1] : null;
}
__name(extractSlug, "extractSlug");
function extractJsonArg(xdata, key) {
  const re = new RegExp(`${key}:\\s*JSON\\.parse\\('((?:[^'\\\\]|\\\\.)*)'\\)`);
  const m = xdata.match(re);
  return m ? m[1] : null;
}
__name(extractJsonArg, "extractJsonArg");
async function search5(query) {
  const html = await fetchHtml(`${BASE7}/anime?search=${encodeURIComponent(query)}`);
  const results = [];
  const xdataRe = /x-data="(\{[^"]*anmTitles[^"]*\})"/g;
  let m;
  while ((m = xdataRe.exec(html)) !== null) {
    const ctxStart = Math.max(0, m.index - 300);
    const ctxEnd = Math.min(html.length, m.index + m[0].length + 800);
    const ctx = html.slice(ctxStart, ctxEnd);
    const slug = extractSlug(ctx);
    if (!slug) continue;
    const xdata = decodeEntities(m[1]);
    const raw2 = extractJsonArg(xdata, "anmTitles");
    if (!raw2) continue;
    const titles = processJsonArg(raw2);
    const title = pickTitle(titles);
    if (title) results.push({ slug, text: title });
  }
  return results;
}
__name(search5, "search");
async function scrapeSeries4(slug) {
  const html = await fetchHtml(`${BASE7}/anime/${slug}`);
  const episodes = [];
  const xdataRe = /x-data="(\{[^"]*epsTitles[^"]*\})"/g;
  let m;
  while ((m = xdataRe.exec(html)) !== null) {
    const ctxStart = Math.max(0, m.index - 400);
    const ctxEnd = Math.min(html.length, m.index + m[0].length + 800);
    const ctx = html.slice(ctxStart, ctxEnd);
    const numMatch = ctx.match(/href="(?:https:\/\/anizone\.to)?\/anime\/[a-z0-9-]+\/(\d+)"/);
    if (!numMatch) continue;
    const num = Number(numMatch[1]);
    if (!Number.isFinite(num) || num < 1) continue;
    const xdata = decodeEntities(m[1]);
    const raw2 = extractJsonArg(xdata, "epsTitles");
    let title = `Episode ${num}`;
    if (raw2) {
      const titles = processJsonArg(raw2);
      title = pickTitle(titles) || title;
    }
    episodes.push({ number: num, title, hasSub: true, hasDub: false });
  }
  const seen = /* @__PURE__ */ new Set();
  return episodes.filter((e) => seen.has(e.number) ? false : (seen.add(e.number), true)).sort((a, b) => a.number - b.number);
}
__name(scrapeSeries4, "scrapeSeries");
async function scrapeWatch(slug, episodeNum) {
  const html = await fetchHtml(`${BASE7}/anime/${slug}/${episodeNum}`);
  const hlsMatch = html.match(/<media-player[^>]+src="([^"]+\.m3u8[^"]*)"/i);
  const hls = hlsMatch ? decodeEntities(hlsMatch[1]) : null;
  const subtitles = [];
  const trackRe = /<track\b([^>]*)>/gi;
  let t;
  while ((t = trackRe.exec(html)) !== null) {
    const attrs = t[1];
    const kind = attrs.match(/kind="([^"]*)"/i)?.[1] ?? "";
    if (kind !== "subtitles") continue;
    const src = attrs.match(/src=["']?([^\s"'>]+)["']?/i)?.[1] ?? "";
    const label = attrs.match(/label="([^"]*)"/i)?.[1] ?? "";
    const srclang = attrs.match(/srclang="([^"]*)"/i)?.[1] ?? "";
    const dataType = attrs.match(/data-type="([^"]*)"/i)?.[1] ?? "vtt";
    const isDefault = /\bdefault\b/.test(attrs);
    if (src) subtitles.push({ url: decodeEntities(src), label, srclang, format: dataType, default: isDefault });
  }
  const storyboardMatch = html.match(/thumbnails="([^"]+\.vtt[^"]*)"/i);
  const storyboard = storyboardMatch ? decodeEntities(storyboardMatch[1]) : null;
  const chaptersMatch = html.match(/<track\b[^>]*kind="chapters"[^>]*src=["']?([^\s"'>]+)["']?/i);
  const chapters = chaptersMatch ? decodeEntities(chaptersMatch[1]) : null;
  return { hls, subtitles, storyboard, chapters };
}
__name(scrapeWatch, "scrapeWatch");
async function searchFn2(query) {
  const r1 = await search5(query);
  const compact = query.split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 4 && compact.toLowerCase() !== query.toLowerCase()) {
    try {
      const r2 = await search5(compact);
      const seen = new Set(r1.map((r) => r.slug));
      r2.forEach((r) => {
        if (!seen.has(r.slug)) r1.push(r);
      });
    } catch {
    }
  }
  return r1;
}
__name(searchFn2, "searchFn");
async function resolveSeries6(anilistId, ctx = {}) {
  const cacheKey = `np:anizone:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  let candidates = await findCandidates(titles, searchFn2);
  const seasonYear = media?.seasonYear;
  if (seasonYear && candidates.some((c) => /\(\d{4}\)/.test(c.title))) {
    candidates = candidates.map((c) => {
      const m = c.title.match(/\((\d{4})\)/);
      if (m) {
        return parseInt(m[1]) === seasonYear ? { ...c, score: Math.min(1, c.score * 1.3) } : { ...c, score: c.score * 0.5 };
      }
      return { ...c, score: c.score * 0.65 };
    }).sort((a, b) => b.score - a.score);
  }
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const offset = await getPrequelOffset(anilistId).catch(() => 0);
  const selected = await selectSeries(candidates, scrapeSeries4, expected, media?.status, offset);
  if (!selected) throw new Error(`AniZone match not found for AniList ${anilistId}`);
  const data = { slug: selected.slug, title: selected.title, mode: selected.mode, offset, score: selected.score };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}
__name(resolveSeries6, "resolveSeries");
function buildEpisodeLists5(anilistId, series, providerEpisodes, ctx, expected) {
  const sub = [], dub = [];
  for (const src of providerEpisodes) {
    const number = series.mode === "offset" ? src.number - series.offset : src.number;
    if (number < 1) continue;
    if (expected && number > expected) continue;
    const meta = episodeMeta(number, ctx);
    const base = {
      number,
      title: meta.title ?? src.title ?? `Episode ${number}`,
      duration: meta.duration,
      filler: meta.filler,
      uncensored: meta.uncensored,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate,
      sourceNumber: src.number
    };
    if (src.hasSub) sub.push({ id: `watch/anizone/${anilistId}/sub/anizone-${number}`, ...base, audio: "sub" });
    if (src.hasDub) dub.push({ id: `watch/anizone/${anilistId}/dub/anizone-${number}`, ...base, audio: "dub" });
  }
  return { sub, dub };
}
__name(buildEpisodeLists5, "buildEpisodeLists");
async function getEpisodes9(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries6(anilistId, localCtx);
  const episodes = await scrapeSeries4(series.slug);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "anizone",
      matchScore: Number(series.score.toFixed(3)),
      numbering: series.mode,
      episodeOffset: series.mode === "offset" ? series.offset : 0
    },
    episodes: buildEpisodeLists5(anilistId, series, episodes, localCtx, expected)
  };
}
__name(getEpisodes9, "getEpisodes");
async function handleWatch9(anilistId, audio, epNum, ctx = {}) {
  const series = await resolveSeries6(anilistId, ctx);
  const providerEp = series.mode === "offset" ? Number(epNum) + series.offset : Number(epNum);
  const watch = await scrapeWatch(series.slug, providerEp);
  if (!watch.hls) throw new Error(`No HLS stream found for AniZone episode ${providerEp}`);
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    providerEpisode: providerEp,
    audio,
    streams: [{
      url: watch.hls,
      type: "hls",
      server: "AniZone",
      subtitles: watch.subtitles,
      storyboard: watch.storyboard,
      chapters: watch.chapters,
      priority: 1,
      isActive: true
    }]
  });
}
__name(handleWatch9, "handleWatch");
var anizone_default = {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "*" } });
    }
    try {
      const m = url.pathname.match(/^\/watch\/anizone\/(\d+)\/(sub|dub)\/anizone-(\d+)\/?$/);
      if (m) return await handleWatch9(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, "Raw-ERROR": err.rawBody ?? null, stack: err.stack }, 500);
    }
  }
};

// providers/anibd.js
var BASE8 = "https://epeng.animeapps.top";
var UA10 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
async function fetchJson2(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA10, Accept: "application/json" } });
  if (!res.ok) throw new Error(`anibd ${res.status}: ${url}`);
  return res.json();
}
__name(fetchJson2, "fetchJson");
async function fetchHtml2(url, referer) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA10,
      Accept: "text/html,application/xhtml+xml",
      ...referer ? { Referer: referer } : {}
    }
  });
  if (!res.ok) throw new Error(`anibd ${res.status}: ${url}`);
  return res.text();
}
__name(fetchHtml2, "fetchHtml");
async function fetchServers(anilistId) {
  const data = await fetchJson2(`${BASE8}/api2.php?epid=${anilistId}`);
  return Array.isArray(data) ? data : [];
}
__name(fetchServers, "fetchServers");
async function fetchPlayerLinks(providerLink) {
  const data = await fetchJson2(`${BASE8}/apilink.php?data=${encodeURIComponent(providerLink)}`);
  return Array.isArray(data) ? data : [];
}
__name(fetchPlayerLinks, "fetchPlayerLinks");
function extractVideoUrl(html, origin) {
  const m = html.match(/videoUrl\s*:\s*"([^"]+)"/);
  if (!m) return null;
  const raw2 = m[1];
  if (/^https?:\/\//i.test(raw2)) return raw2;
  return `${origin}${raw2.startsWith("/") ? "" : "/"}${raw2}`;
}
__name(extractVideoUrl, "extractVideoUrl");
async function resolvePlayerStream(playerLink) {
  const origin = new URL(playerLink).origin;
  const referer = `${origin}/`;
  const html = await fetchHtml2(playerLink, referer);
  const hls = extractVideoUrl(html, origin);
  if (!hls) throw new Error(`anibd: no videoUrl found at ${playerLink}`);
  return { hls, referer };
}
__name(resolvePlayerStream, "resolvePlayerStream");
function audioFromServerName(name = "") {
  return /dub/i.test(name) ? "dub" : "sub";
}
__name(audioFromServerName, "audioFromServerName");
function buildEpisodeLists6(anilistId, groups, ctx, expected) {
  const sub = [];
  const dub = [];
  const seenSub = /* @__PURE__ */ new Set();
  const seenDub = /* @__PURE__ */ new Set();
  for (const group of groups) {
    const audio = audioFromServerName(group.server_name);
    for (const ep of group.server_data ?? []) {
      const number = Number(ep.name ?? ep.slug);
      if (!Number.isFinite(number) || number < 1) continue;
      if (expected && number > expected) continue;
      const bucket = audio === "dub" ? dub : sub;
      const seen = audio === "dub" ? seenDub : seenSub;
      if (seen.has(number)) continue;
      seen.add(number);
      const meta = episodeMeta(number, ctx);
      bucket.push({
        id: `watch/anibd/${anilistId}/${audio}/anibd-${number}`,
        number,
        title: meta.title ?? `Episode ${number}`,
        duration: meta.duration,
        filler: meta.filler,
        uncensored: meta.uncensored,
        description: meta.description,
        image: meta.image,
        airDate: meta.airDate,
        sourceLink: ep.link,
        audio
      });
    }
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return { sub, dub };
}
__name(buildEpisodeLists6, "buildEpisodeLists");
async function getEpisodes10(anilistId, ctx = {}) {
  const groups = await fetchServers(anilistId);
  if (!groups.length) throw new Error(`anibd: no episodes found for AniList ${anilistId}`);
  const expected = expectedCount(ctx.media, ctx.anizip, ctx.jikanEps);
  return {
    meta: {
      id: String(anilistId),
      source: "anibd",
      matchScore: 1,
      numbering: "standard",
      episodeOffset: 0
    },
    episodes: buildEpisodeLists6(anilistId, groups, ctx, expected)
  };
}
__name(getEpisodes10, "getEpisodes");
async function findEpisodeLink(anilistId, audio, epNum) {
  const groups = await fetchServers(anilistId);
  for (const group of groups) {
    if (audioFromServerName(group.server_name) !== audio) continue;
    for (const ep of group.server_data ?? []) {
      if (Number(ep.name ?? ep.slug) === Number(epNum)) return ep.link;
    }
  }
  return null;
}
__name(findEpisodeLink, "findEpisodeLink");
async function handleWatch10(anilistId, audio, epNum) {
  const providerLink = await findEpisodeLink(anilistId, audio, epNum);
  if (!providerLink) return json({ error: `anibd episode ${epNum} not found` }, 404);
  const servers = await fetchPlayerLinks(providerLink);
  const streams = [];
  let activeAssigned = false;
  for (const entry of servers) {
    if (!entry?.link) continue;
    try {
      const { hls, referer } = await resolvePlayerStream(entry.link);
      streams.push({
        url: hls,
        type: "hls",
        server: entry.server ?? "AniBD",
        referer,
        priority: activeAssigned ? 4 : 5,
        isActive: !activeAssigned
      });
      activeAssigned = true;
    } catch {
      streams.push({
        url: entry.link,
        type: "embed",
        server: entry.server ?? "AniBD",
        referer: `${new URL(entry.link).origin}/`,
        priority: 1,
        isActive: false
      });
    }
  }
  return json({ anilistId: Number(anilistId), episode: Number(epNum), audio, streams });
}
__name(handleWatch10, "handleWatch");
var anibd_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/anibd\/(\d+)\/(sub|dub)\/anibd-(\d+)\/?$/);
      if (m) return await handleWatch10(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// providers/senshi.js
var BASE9 = "https://senshi.live";
var UA11 = "Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0";
var H2 = { "User-Agent": UA11, "Referer": `${BASE9}/` };
async function fetchEpisodeList(malId) {
  const res = await fetch(`${BASE9}/episodes/${malId}`, { headers: H2 });
  if (!res.ok) throw new Error(`Senshi episodes ${res.status} (MAL ${malId})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
__name(fetchEpisodeList, "fetchEpisodeList");
async function fetchEmbeds(malId, epNum) {
  const res = await fetch(`${BASE9}/episode-embeds/${malId}/${epNum}`, { headers: H2 });
  if (!res.ok) throw new Error(`Senshi embeds ${res.status} (MAL ${malId} ep ${epNum})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
__name(fetchEmbeds, "fetchEmbeds");
async function resolveMalId(anilistId) {
  const cacheKey = `np:senshi:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = await getMedia(anilistId);
  if (!media?.idMal) throw new Error(`Senshi: no MAL ID found for AniList ${anilistId}`);
  set(cacheKey, media.idMal, SHOW_IDENTITY_TTL);
  return media.idMal;
}
__name(resolveMalId, "resolveMalId");
function isDub(status) {
  return (status ?? "").toLowerCase() === "dub";
}
__name(isDub, "isDub");
async function getEpisodes11(anilistId, ctx = {}) {
  const malId = await resolveMalId(anilistId);
  const items = await fetchEpisodeList(malId);
  if (!items.length) {
    throw new Error(`Senshi: no episodes for AniList ${anilistId} (MAL ${malId})`);
  }
  let hasDub = false;
  try {
    const probe = await fetchEmbeds(malId, 1);
    hasDub = probe.some((e) => isDub(e.status));
  } catch {
  }
  const sub = [];
  const dub = [];
  for (const item of items) {
    const num = item.ep_id;
    const meta = episodeMeta(num, ctx);
    const title = item.ep_title || meta.title || `Episode ${num}`;
    const duration = meta.duration;
    const filler = item.ep_filler || meta.filler || false;
    const recap = item.ep_recap || false;
    const description = meta.description;
    const image = meta.image;
    const airDate = meta.airDate;
    sub.push({
      id: `watch/senshi/${anilistId}/sub/senshi-${num}`,
      number: num,
      title,
      duration,
      audio: "sub",
      filler,
      recap,
      uncensored: false,
      description,
      image,
      airDate
    });
    if (hasDub) {
      dub.push({
        id: `watch/senshi/${anilistId}/dub/senshi-${num}`,
        number: num,
        title,
        duration,
        audio: "dub",
        filler,
        recap,
        uncensored: false,
        description,
        image,
        airDate
      });
    }
  }
  sub.sort((a, b) => a.number - b.number);
  dub.sort((a, b) => a.number - b.number);
  return {
    meta: {
      title: ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "senshi"
    },
    episodes: { sub, dub }
  };
}
__name(getEpisodes11, "getEpisodes");
async function handleWatch11(anilistId, audio, epNum) {
  const malId = await resolveMalId(anilistId);
  const embeds = await fetchEmbeds(malId, epNum);
  if (!embeds.length) {
    return json({ error: `Senshi: no sources for episode ${epNum}` }, 404);
  }
  const wantDub = audio === "dub";
  const source = embeds.find((e) => wantDub ? isDub(e.status) : !isDub(e.status));
  if (!source) {
    return json({ error: `Senshi: no ${audio} source for episode ${epNum}` }, 404);
  }
  const list = await fetchEpisodeList(malId).catch(() => []);
  const epItem = list.find((item) => Number(item.ep_id) === Number(epNum));
  const intro = {
    start: epItem?.intro_start ?? 0,
    end: epItem?.intro_end ?? 0
  };
  const outro = {
    start: epItem?.outro_start ?? 0,
    end: epItem?.outro_end ?? 0
  };
  const streams = [];
  const downloads = [];
  if (source.url) {
    streams.push({
      url: source.url,
      type: "hls",
      server: "Senshi",
      referer: `${BASE9}/`,
      priority: 5,
      isActive: true
    });
  }
  if (source.server2) {
    streams.push({
      url: source.server2,
      type: "embed",
      server: "StreamNin",
      referer: `${BASE9}/`,
      priority: 3,
      isActive: false
    });
  }
  if (source.serverFM) {
    streams.push({
      url: source.serverFM,
      type: "embed",
      server: "FileMoon",
      referer: `${BASE9}/`,
      priority: 2,
      isActive: false
    });
  }
  if (source.download) {
    downloads.push({ url: source.download, label: "Download" });
  }
  return json({
    anilistId: Number(anilistId),
    malId,
    episode: Number(epNum),
    audio,
    intro,
    outro,
    streams,
    downloads,
    headers: H2
  });
}
__name(handleWatch11, "handleWatch");
var senshi_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/senshi\/(\d+)\/(sub|dub)\/senshi-(\d+)\/?$/);
      if (m) return await handleWatch11(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// providers/kickassanime.js
var BASE10 = "https://kaa.lt";
var HLS_BASE = "https://hls.krussdomi.com/manifest";
var UA12 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var H3 = { "User-Agent": UA12, Accept: "application/json" };
async function kaaSearch(query) {
  const res = await fetch(`${BASE10}/api/fsearch`, {
    method: "POST",
    headers: { ...H3, "Content-Type": "application/json" },
    body: JSON.stringify({ page: 1, query })
  });
  if (!res.ok) throw new Error(`kaa fsearch HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.result) ? data.result : [];
}
__name(kaaSearch, "kaaSearch");
async function kaaShowInfo(showSlug) {
  const res = await fetch(`${BASE10}/api/show/${showSlug}`, { headers: H3 });
  if (!res.ok) throw new Error(`kaa show HTTP ${res.status}: ${showSlug}`);
  return res.json();
}
__name(kaaShowInfo, "kaaShowInfo");
async function kaaEpisodePage(showSlug, ep) {
  const res = await fetch(
    `${BASE10}/api/show/${showSlug}/episodes?ep=${ep}&lang=ja-JP`,
    { headers: H3 }
  );
  if (!res.ok) throw new Error(`kaa episodes HTTP ${res.status}`);
  return res.json();
}
__name(kaaEpisodePage, "kaaEpisodePage");
async function kaaAllEpisodes(showSlug) {
  const first = await kaaEpisodePage(showSlug, 1);
  const pages = Array.isArray(first.pages) ? first.pages : [];
  const all = Array.isArray(first.result) ? [...first.result] : [];
  if (pages.length > 1) {
    const rest = await Promise.all(
      pages.slice(1).map(async (pg) => {
        const startEp = pg.eps?.[0];
        if (!startEp) return [];
        const d = await kaaEpisodePage(showSlug, startEp);
        return Array.isArray(d.result) ? d.result : [];
      })
    );
    for (const batch of rest) all.push(...batch);
  }
  return all;
}
__name(kaaAllEpisodes, "kaaAllEpisodes");
async function kaaEpisodeServers(showSlug, fullEpSlug) {
  const res = await fetch(
    `${BASE10}/api/show/${showSlug}/episode/${fullEpSlug}`,
    { headers: H3 }
  );
  if (!res.ok) throw new Error(`kaa episode servers HTTP ${res.status}`);
  return res.json();
}
__name(kaaEpisodeServers, "kaaEpisodeServers");
function buildKaaQueries(titles) {
  const queries = /* @__PURE__ */ new Set();
  for (const title of titles.slice(0, 4)) {
    if (/[\u3000-\u9fff\u4e00-\u9faf]/.test(title)) continue;
    const clean = title.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean || clean.length < 3) continue;
    const words = clean.split(" ").filter(Boolean);
    if (words.length <= 3) {
      queries.add(clean);
    } else {
      queries.add(words.slice(0, 2).join(" "));
      queries.add(words.slice(0, 3).join(" "));
    }
  }
  return [...queries];
}
__name(buildKaaQueries, "buildKaaQueries");
function scoreCandidate3(candidate, titles, seasonYear, anilistFormat) {
  const titleEn = candidate.title_en || "";
  const titleJp = candidate.title || "";
  const kaaYear = Number(candidate.year);
  const kaaType = (candidate.type || "").toLowerCase();
  let base = 0;
  for (const t of titles.slice(0, 3)) {
    if (/[\u3000-\u9fff\u4e00-\u9faf]/.test(t)) continue;
    base = Math.max(base, diceCoeff(t, titleEn), diceCoeff(t, titleJp));
  }
  let yearMult = 1;
  if (seasonYear && kaaYear) {
    const diff = Math.abs(Number(seasonYear) - kaaYear);
    if (diff === 0) yearMult = 1.2;
    else if (diff === 1) yearMult = 0.8;
    else yearMult = 0.5;
  }
  let typeMult = 1;
  const af = (anilistFormat || "").toUpperCase();
  if (af === "MOVIE" && kaaType !== "movie") typeMult = 0.25;
  else if (af !== "MOVIE" && kaaType === "movie") typeMult = 0.25;
  else if ((af === "OVA" || af === "ONA" || af === "SPECIAL") && kaaType === "tv") typeMult = 0.5;
  else if (af === "TV" && (kaaType === "ova" || kaaType === "special")) typeMult = 0.5;
  return Math.min(1, base * yearMult) * typeMult;
}
__name(scoreCandidate3, "scoreCandidate");
async function resolveSeries7(anilistId, ctx = {}) {
  const cacheKey = `np:kaa:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = ctx.media ?? await getMedia(anilistId);
  const titles = buildTitles(media, ctx.anizip);
  const queries = buildKaaQueries(titles);
  const seasonYear = media?.seasonYear;
  const format = media?.format;
  if (!queries.length) throw new Error(`KAA: no usable search queries for AniList ${anilistId}`);
  const allCandidates = /* @__PURE__ */ new Map();
  await Promise.all(
    queries.map(async (q) => {
      try {
        const results = await kaaSearch(q);
        for (const r of results) {
          if (!allCandidates.has(r.slug)) allCandidates.set(r.slug, r);
        }
      } catch {
      }
    })
  );
  if (!allCandidates.size) throw new Error(`KAA: no search results for AniList ${anilistId}`);
  const scored = [];
  for (const [, candidate] of allCandidates) {
    const score = scoreCandidate3(candidate, titles, seasonYear, format);
    if (score >= 0.5) {
      scored.push({
        slug: candidate.slug,
        title: candidate.title_en || candidate.title,
        locales: Array.isArray(candidate.locales) ? candidate.locales : [],
        score
      });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) {
    throw new Error(`KAA: no confident match for AniList ${anilistId}`);
  }
  const best = scored[0];
  if (best.score < 0.6) {
    throw new Error(
      `KAA: low confidence match for AniList ${anilistId} \u2014 best "${best.slug}" score ${best.score.toFixed(3)}`
    );
  }
  const data = {
    slug: best.slug,
    title: best.title,
    locales: best.locales,
    score: best.score
  };
  set(cacheKey, data, SHOW_IDENTITY_TTL);
  return data;
}
__name(resolveSeries7, "resolveSeries");
async function buildEpMap(showSlug, showInfo) {
  if (showInfo?.type === "movie") {
    const m = (showInfo.watch_uri || "").match(/\/(ep-(\d+)-([a-f0-9]+))$/i);
    if (m) return [{ number: 1, fullSlug: m[1] }];
    return [];
  }
  const episodes = await kaaAllEpisodes(showSlug);
  return episodes.map((e) => ({
    number: e.episode_number,
    fullSlug: `ep-${e.episode_number}-${e.slug}`,
    title: e.title,
    duration: e.duration_ms ? Math.round(e.duration_ms / 1e3) : null
  }));
}
__name(buildEpMap, "buildEpMap");
async function getEpisodes12(anilistId, ctx = {}) {
  const media = ctx.media ?? await getMedia(anilistId);
  const localCtx = { ...ctx, media };
  const series = await resolveSeries7(anilistId, localCtx);
  const showInfo = await kaaShowInfo(series.slug);
  const locales = Array.isArray(showInfo.locales) ? showInfo.locales : series.locales;
  const hasDub = locales.includes("en-US");
  const epMap = await buildEpMap(series.slug, showInfo);
  if (!epMap.length) throw new Error(`KAA: no episodes found for AniList ${anilistId} (slug: ${series.slug})`);
  const expected = expectedCount(media, ctx.anizip, ctx.jikanEps);
  const sub = [];
  const dub = [];
  for (const ep of epMap) {
    const num = ep.number;
    if (!Number.isFinite(num) || num < 1) continue;
    if (expected && num > expected) continue;
    const meta = episodeMeta(num, localCtx);
    const base = {
      number: num,
      title: meta.title ?? ep.title ?? `Episode ${num}`,
      duration: meta.duration ?? ep.duration,
      filler: meta.filler,
      uncensored: false,
      description: meta.description,
      image: meta.image,
      airDate: meta.airDate
    };
    sub.push({ id: `watch/kaa/${anilistId}/sub/kaa-${num}`, ...base, audio: "sub" });
    if (hasDub) {
      dub.push({ id: `watch/kaa/${anilistId}/dub/kaa-${num}`, ...base, audio: "dub" });
    }
  }
  return {
    meta: {
      id: series.slug,
      title: series.title,
      source: "kaa",
      matchScore: Number(series.score.toFixed(3))
    },
    episodes: { sub, dub }
  };
}
__name(getEpisodes12, "getEpisodes");
async function handleWatch12(anilistId, audio, epNum) {
  const series = await resolveSeries7(anilistId);
  const showInfo = await kaaShowInfo(series.slug);
  const locales = Array.isArray(showInfo.locales) ? showInfo.locales : series.locales;
  if (audio === "dub" && !locales.includes("en-US")) {
    return json({ error: `KAA: no English dub for AniList ${anilistId}` }, 404);
  }
  const epMap = await buildEpMap(series.slug, showInfo);
  const ep = epMap.find((e) => e.number === Number(epNum));
  if (!ep) {
    return json({ error: `KAA: episode ${epNum} not found for AniList ${anilistId}` }, 404);
  }
  const episodeData = await kaaEpisodeServers(series.slug, ep.fullSlug);
  const servers = Array.isArray(episodeData.servers) ? episodeData.servers : [];
  if (!servers.length) {
    return json({ error: `KAA: no streams for episode ${epNum} (AniList ${anilistId})` }, 404);
  }
  const streams = [];
  for (const s of servers) {
    if (!s.src) continue;
    const m = s.src.match(/[?&]id=([^&]+)/);
    if (!m) continue;
    streams.push({
      url: `${HLS_BASE}/${m[1]}/master.m3u8`,
      type: "hls",
      server: s.name || "KAA",
      headers: { Referer: "https://krussdomi.com/" },
      priority: 1,
      isActive: true
    });
  }
  if (!streams.length) {
    return json({ error: `KAA: could not resolve stream for episode ${epNum}` }, 404);
  }
  return json({
    anilistId: Number(anilistId),
    episode: Number(epNum),
    audio,
    streams
  });
}
__name(handleWatch12, "handleWatch");
var kickassanime_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/kaa\/(\d+)\/(sub|dub)\/kaa-(\d+)\/?$/);
      if (m) return await handleWatch12(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// providers/animedunya.js
var BASE11 = "https://anime-dunya.com";
async function resolveMalId2(anilistId) {
  const cacheKey = `np:animedunya:${anilistId}`;
  const cached = get(cacheKey);
  if (isFresh(cached)) return cached.data;
  const media = await getMedia(anilistId);
  if (!media?.idMal) throw new Error("AnimeDunya: no MAL ID found");
  set(cacheKey, media.idMal, SHOW_IDENTITY_TTL);
  return media.idMal;
}
__name(resolveMalId2, "resolveMalId");
async function fetchHtml3(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    return null;
  }
}
__name(fetchHtml3, "fetchHtml");
function extractEpisodesList(html) {
  const match2 = html.match(/\\?"episodes\\?":\s*\[/);
  if (!match2) return [];
  const idx = match2.index;
  const matchLen = match2[0].length;
  let braceCount = 1;
  let result = "[";
  for (let i = idx + matchLen; i < html.length; i++) {
    const char = html[i];
    if (char === "[") braceCount++;
    else if (char === "]") braceCount--;
    result += char;
    if (braceCount === 0) break;
  }
  try {
    const cleanStr = result.replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return JSON.parse(cleanStr);
  } catch (e) {
    return [];
  }
}
__name(extractEpisodesList, "extractEpisodesList");
function extractStream(html) {
  const match2 = html.match(/\\?"stream\\?":\s*/);
  if (!match2) return null;
  const idx = match2.index;
  const matchLen = match2[0].length;
  let braceCount = 0;
  let started = false;
  let result = "";
  for (let i = idx + matchLen; i < html.length; i++) {
    const char = html[i];
    if (char === "{") {
      braceCount++;
      started = true;
    } else if (char === "}") {
      braceCount--;
    }
    if (started) {
      result += char;
      if (braceCount === 0) break;
    }
  }
  try {
    const cleanStr = result.replace(/\\u0026/g, "&").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return JSON.parse(cleanStr);
  } catch (e) {
    const sourceMatch = html.match(/"source"\s*:\s*"([^"]+)"/);
    if (sourceMatch) {
      return { source: sourceMatch[1].replace(/\\/g, "") };
    }
    return null;
  }
}
__name(extractStream, "extractStream");
async function getEpisodes13(anilistId, ctx = {}) {
  const malId = await resolveMalId2(anilistId);
  const html = await fetchHtml3(`${BASE11}/en/anime/${malId}`);
  if (!html) throw new Error("AnimeDunya: episodes fetch failed");
  let cdnBase = "https://cdn.anime-dunya.com/thumbnail/";
  let cdnExt = "small.jpg";
  const thumbMatch = html.match(/(https?:\/\/[^\s"'`<>]+?\/thumbnail\/)([a-zA-Z0-9]+?)\/((?:small|large)\.jpg)/);
  if (thumbMatch) {
    cdnBase = thumbMatch[1];
    cdnExt = thumbMatch[3];
  }
  const episodes = extractEpisodesList(html);
  const watchable = episodes.filter((ep) => ep.streamId !== null && ep.streamId !== void 0);
  const sub = [];
  for (const ep of watchable) {
    const epNum = ep.episodeNumber;
    const meta = episodeMeta(epNum, ctx);
    const customTitle = Array.isArray(ep.translations) ? ep.translations.find((t) => t.language === "en")?.title : ep.translations?.title;
    sub.push({
      id: `watch/animedunya/${anilistId}/sub/animedunya-${epNum}`,
      number: epNum,
      title: customTitle || meta.title || `Episode ${epNum}`,
      duration: meta.duration,
      audio: "sub",
      filler: ep.filler || meta.filler || false,
      uncensored: false,
      description: meta.description,
      image: ep.streamId ? `${cdnBase}${ep.streamId}/${cdnExt}` : meta.image,
      airDate: meta.airDate
    });
  }
  sub.sort((a, b) => a.number - b.number);
  return {
    meta: {
      title: ctx.media?.title?.english ?? ctx.media?.title?.romaji ?? null,
      malId,
      source: "animedunya"
    },
    episodes: { sub, dub: [] }
  };
}
__name(getEpisodes13, "getEpisodes");
async function handleWatch13(anilistId, audio, epNum) {
  const malId = await resolveMalId2(anilistId);
  const html = await fetchHtml3(`${BASE11}/en/play/${malId}/${epNum}`);
  if (!html) return json({ error: "AnimeDunya watch fetch failed" }, 500);
  const streamData = extractStream(html);
  if (!streamData || !streamData.source) {
    return json({ error: "AnimeDunya: stream source not found" }, 404);
  }
  const subtitles = (streamData.subtitles || []).map((s) => ({
    url: s.src,
    label: s.label,
    srclang: s.srclang,
    default: s.default || false
  }));
  const streams = [{
    url: streamData.source,
    type: "hls",
    server: "AnimeDunya",
    referer: `${BASE11}/`,
    subtitles,
    priority: 5,
    isActive: true
  }];
  return json({
    anilistId: Number(anilistId),
    malId,
    episode: Number(epNum),
    audio,
    streams
  });
}
__name(handleWatch13, "handleWatch");
var animedunya_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }
    const url = new URL(request.url);
    try {
      const m = url.pathname.match(/^\/watch\/animedunya\/(\d+)\/(sub|dub)\/animedunya-(\d+)\/?$/);
      if (m) return await handleWatch13(m[1], m[2], m[3]);
      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message, stack: err.stack }, 500);
    }
  }
};

// core/episode-strategy.js
var JIKAN2 = "https://api.jikan.moe/v4";
var UA13 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var inflight2 = /* @__PURE__ */ new Map();
var bgRunning = /* @__PURE__ */ new Set();
function dedupe(key, fn) {
  if (inflight2.has(key)) return inflight2.get(key);
  const p = Promise.resolve().then(fn).finally(() => inflight2.delete(key));
  inflight2.set(key, p);
  return p;
}
__name(dedupe, "dedupe");
function bg(key, fn) {
  if (bgRunning.has(key)) return;
  bgRunning.add(key);
  Promise.resolve().then(fn).catch((e) => console.error(`[bg:${key}]`, e.message)).finally(() => bgRunning.delete(key));
}
__name(bg, "bg");
async function jikanPage(malId, pageNum, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(
      `${JIKAN2}/anime/${malId}/episodes?page=${pageNum}`,
      { headers: { "User-Agent": UA13, Accept: "application/json" } }
    ).catch(() => null);
    if (!res) return null;
    if (res.status === 429) {
      const wait = (parseInt(res.headers.get("Retry-After") ?? "1") || 1) * 1e3 + attempt * 600;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      return null;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
}
__name(jikanPage, "jikanPage");
function fetchAllJikanWithCache(malId, status) {
  return dedupe(`jikan:${malId}`, () => _jikanAll(malId, status));
}
__name(fetchAllJikanWithCache, "fetchAllJikanWithCache");
async function _jikanAll(malId, status) {
  const metaKey = `jm:${malId}`;
  const meta = await getAsync(metaKey);
  const isFinished = status === "FINISHED";
  const mustCheckTotal = !isFinished && (!meta || needsRefresh(meta));
  let lastPage = meta?.data?.lastPage ?? null;
  if (mustCheckTotal || !lastPage) {
    const p1 = await jikanPage(malId, 1);
    if (!p1 && !lastPage) return [];
    if (!p1 && lastPage) return _buildPages(malId, lastPage, status);
    const newLast = p1.pagination?.last_visible_page ?? 1;
    const isP1Last = newLast === 1;
    const [p1ttl, p1ref] = jikanPageTTL(isP1Last, status);
    await setAsync(`jp:${malId}:1`, p1.data ?? [], p1ttl, p1ref);
    if (lastPage && newLast > lastPage) {
      const [stableTtl] = jikanPageTTL(false, "FINISHED");
      const oldLastEntry = await getAsync(`jp:${malId}:${lastPage}`);
      if (oldLastEntry) await setAsync(`jp:${malId}:${lastPage}`, oldLastEntry.data, stableTtl, Infinity);
      await Promise.all(
        Array.from({ length: newLast - lastPage }, (_, i) => {
          const pn = lastPage + 1 + i;
          const isLast = pn === newLast;
          return jikanPage(malId, pn).then((pd) => {
            const [t, r] = jikanPageTTL(isLast, status);
            return setAsync(`jp:${malId}:${pn}`, pd?.data ?? [], t, r);
          });
        })
      );
    }
    const [mttl, mref] = episodeTTL(status);
    await setAsync(metaKey, { lastPage: newLast }, mttl, mref);
    lastPage = newLast;
  }
  return _buildPages(malId, lastPage, status);
}
__name(_jikanAll, "_jikanAll");
async function _buildPages(malId, lastPage, status) {
  const pages = await Promise.all(
    Array.from({ length: lastPage }, (_, i) => i + 1).map(async (pn) => {
      const key = `jp:${malId}:${pn}`;
      const isLast = pn === lastPage;
      const entry = await getAsync(key);
      if (isFresh(entry)) {
        if (isLast && status === "RELEASING" && needsRefresh(entry)) {
          bg(key, async () => {
            const pd2 = await jikanPage(malId, pn);
            if (pd2) {
              const [t2, r2] = jikanPageTTL(true, status);
              await setAsync(key, pd2.data ?? [], t2, r2);
            }
          });
        }
        return entry.data;
      }
      const pd = await jikanPage(malId, pn);
      const data = pd?.data ?? [];
      const [t, r] = jikanPageTTL(isLast, status);
      await setAsync(key, data, t, r);
      return data;
    })
  );
  return pages.flat();
}
__name(_buildPages, "_buildPages");
async function withCache(key, status, fetchFn) {
  const [ttl, refreshAfter] = episodeTTL(status);
  const entry = await getAsync(key);
  if (isFresh(entry)) {
    if (needsRefresh(entry)) {
      bg(key, async () => {
        const data2 = await fetchFn();
        await setAsync(key, data2, ttl, refreshAfter);
      });
    }
    return entry.data;
  }
  const data = await fetchFn();
  await setAsync(key, data, ttl, refreshAfter);
  return data;
}
__name(withCache, "withCache");
async function safe(label, fn) {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    console.error(`[ep:${label}]`, e.message);
    return { ok: false, error: e.message, stack: e.stack };
  }
}
__name(safe, "safe");
var PROVIDER_ALIASES = {
  allmanga: "allmanga",
  reanime: "reanime",
  anikoto: "anikoto",
  animegg: "animegg",
  anineko: "anineko",
  anidbapp: "anidbapp",
  "2dhive": "2dhive",
  animenosub: "animenosub",
  anizone: "anizone",
  anibd: "anibd",
  senshi: "senshi",
  kaa: "kaa",
  animedunya: "animedunya"
};
function resolveProviders(rawNames) {
  const resolved2 = /* @__PURE__ */ new Set();
  const unknown = [];
  for (const raw2 of rawNames) {
    const name = PROVIDER_ALIASES[raw2.toLowerCase()];
    if (name) resolved2.add(name);
    else unknown.push(raw2);
  }
  return { resolved: resolved2, unknown };
}
__name(resolveProviders, "resolveProviders");
function providerFns(anilistId, status, ctx) {
  return {
    allmanga: /* @__PURE__ */ __name(() => withCache(`epv:manga:${anilistId}`, status, () => getEpisodes2(anilistId, ctx)), "allmanga"),
    reanime: /* @__PURE__ */ __name(() => withCache(`epv:reanime:${anilistId}`, status, () => getEpisodes3(anilistId, ctx)), "reanime"),
    anikoto: /* @__PURE__ */ __name(() => withCache(`epv:anikoto:${anilistId}`, status, () => getEpisodes(anilistId, ctx)), "anikoto"),
    animegg: /* @__PURE__ */ __name(() => withCache(`epv:animegg:${anilistId}`, status, () => getEpisodes4(anilistId, ctx)), "animegg"),
    anineko: /* @__PURE__ */ __name(() => withCache(`epv:anineko:${anilistId}`, status, () => getEpisodes5(anilistId, ctx)), "anineko"),
    anidbapp: /* @__PURE__ */ __name(() => withCache(`epv:anidbapp:${anilistId}`, status, () => getEpisodes6(anilistId, ctx)), "anidbapp"),
    "2dhive": /* @__PURE__ */ __name(() => withCache(`epv:2dhive:${anilistId}`, status, () => getEpisodes7(anilistId, ctx)), "2dhive"),
    animenosub: /* @__PURE__ */ __name(() => withCache(`epv:animenosub:${anilistId}`, status, () => getEpisodes8(anilistId, ctx)), "animenosub"),
    anizone: /* @__PURE__ */ __name(() => withCache(`epv:anizone:${anilistId}`, status, () => getEpisodes9(anilistId, ctx)), "anizone"),
    anibd: /* @__PURE__ */ __name(() => withCache(`epv:anibd:${anilistId}`, status, () => getEpisodes10(anilistId, ctx)), "anibd"),
    senshi: /* @__PURE__ */ __name(() => withCache(`epv:senshi:${anilistId}`, status, () => getEpisodes11(anilistId, ctx)), "senshi"),
    kaa: /* @__PURE__ */ __name(() => withCache(`epv:kaa:${anilistId}`, status, () => getEpisodes12(anilistId, ctx)), "kaa"),
    animedunya: /* @__PURE__ */ __name(() => withCache(`epv:animedunya:${anilistId}`, status, () => getEpisodes13(anilistId, ctx)), "animedunya")
  };
}
__name(providerFns, "providerFns");
async function buildFilteredEpisodesWithCache(anilistId, providers, media, anizip) {
  const status = media?.status ?? "RELEASING";
  const malId = media?.idMal ?? null;
  const jikanEps = malId ? await fetchAllJikanWithCache(malId, status).catch(() => null) : null;
  const ctx = { media, anizip, jikanEps, maxPages: void 0 };
  const fns = providerFns(anilistId, status, ctx);
  const pairs = await Promise.all(
    [...providers].map(async (name) => {
      const result = await safe(name, fns[name]);
      return [name, result.ok ? result.data : { error: result.error, stack: result.stack }];
    })
  );
  return Object.fromEntries(pairs);
}
__name(buildFilteredEpisodesWithCache, "buildFilteredEpisodesWithCache");
async function buildEpisodesWithCache(anilistId, media, anizip) {
  const status = media?.status ?? "RELEASING";
  const malId = media?.idMal ?? null;
  const jikanEps = malId ? await fetchAllJikanWithCache(malId, status).catch(() => null) : null;
  const ctx = { media, anizip, jikanEps, maxPages: void 0 };
  const [manga, reanime, anikoto, animegg, anineko, anidbapp, dhive, animenosub, anizone, anibd, senshi, kaa, animedunya] = await Promise.all([
    safe("allmanga", () => withCache(`epv:manga:${anilistId}`, status, () => getEpisodes2(anilistId, ctx))),
    safe("reanime", () => withCache(`epv:reanime:${anilistId}`, status, () => getEpisodes3(anilistId, ctx))),
    safe("anikoto", () => withCache(`epv:anikoto:${anilistId}`, status, () => getEpisodes(anilistId, ctx))),
    safe("animegg", () => withCache(`epv:animegg:${anilistId}`, status, () => getEpisodes4(anilistId, ctx))),
    safe("anineko", () => withCache(`epv:anineko:${anilistId}`, status, () => getEpisodes5(anilistId, ctx))),
    safe("anidbapp", () => withCache(`epv:anidbapp:${anilistId}`, status, () => getEpisodes6(anilistId, ctx))),
    safe("2dhive", () => withCache(`epv:2dhive:${anilistId}`, status, () => getEpisodes7(anilistId, ctx))),
    safe("animenosub", () => withCache(`epv:animenosub:${anilistId}`, status, () => getEpisodes8(anilistId, ctx))),
    safe("anizone", () => withCache(`epv:anizone:${anilistId}`, status, () => getEpisodes9(anilistId, ctx))),
    safe("anibd", () => withCache(`epv:anibd:${anilistId}`, status, () => getEpisodes10(anilistId, ctx))),
    safe("senshi", () => withCache(`epv:senshi:${anilistId}`, status, () => getEpisodes11(anilistId, ctx))),
    safe("kaa", () => withCache(`epv:kaa:${anilistId}`, status, () => getEpisodes12(anilistId, ctx))),
    safe("animedunya", () => withCache(`epv:animedunya:${anilistId}`, status, () => getEpisodes13(anilistId, ctx)))
  ]);
  return {
    allmanga: manga.ok ? manga.data : { error: manga.error, stack: manga.stack },
    reanime: reanime.ok ? reanime.data : { error: reanime.error, stack: reanime.stack },
    anikoto: anikoto.ok ? anikoto.data : { error: anikoto.error, stack: anikoto.stack },
    animegg: animegg.ok ? animegg.data : { error: animegg.error, stack: animegg.stack },
    anineko: anineko.ok ? anineko.data : { error: anineko.error, stack: anineko.stack },
    anidbapp: anidbapp.ok ? anidbapp.data : { error: anidbapp.error, stack: anidbapp.stack },
    "2dhive": dhive.ok ? dhive.data : { error: dhive.error, stack: dhive.stack },
    animenosub: animenosub.ok ? animenosub.data : { error: animenosub.error, stack: animenosub.stack },
    anizone: anizone.ok ? anizone.data : { error: anizone.error, stack: anizone.stack },
    anibd: anibd.ok ? anibd.data : { error: anibd.error, stack: anibd.stack },
    senshi: senshi.ok ? senshi.data : { error: senshi.error, stack: senshi.stack },
    kaa: kaa.ok ? kaa.data : { error: kaa.error, stack: kaa.stack },
    animedunya: animedunya.ok ? animedunya.data : { error: animedunya.error, stack: animedunya.stack }
  };
}
__name(buildEpisodesWithCache, "buildEpisodesWithCache");

// core/episode-cache.js
var ANIZIP4 = "https://api.ani.zip/mappings";
var MIN2 = 6e4;
var HOUR2 = 60 * MIN2;
var DAY2 = 24 * HOUR2;
var FULL_TTL = 30 * DAY2;
var NORMAL_PROBE_INTERVAL = 15 * MIN2;
var AIRING_PROBE_INTERVAL = 5 * MIN2;
var AIRING_EARLY_WINDOW = 10 * MIN2;
var AIRING_FAST_WINDOW = 6 * HOUR2;
var refreshing = /* @__PURE__ */ new Set();
function runBackground(env, promise) {
  const waitUntil = env?.context?.waitUntil ?? env?.waitUntil;
  if (typeof waitUntil === "function") waitUntil.call(env.context ?? env, promise);
  else promise.catch(() => {
  });
}
__name(runBackground, "runBackground");
function latestEpisodeFromResponse(data) {
  let max = 0;
  for (const provider of Object.values(data ?? {})) {
    const episodes = provider?.episodes;
    if (!episodes || typeof episodes !== "object") continue;
    for (const list of Object.values(episodes)) {
      if (!Array.isArray(list)) continue;
      for (const ep of list) {
        const n = Number(ep?.number);
        if (Number.isFinite(n) && n > max) max = n;
      }
    }
  }
  return max || null;
}
__name(latestEpisodeFromResponse, "latestEpisodeFromResponse");
function hasCurrentProviders(data) {
  return data && Object.prototype.hasOwnProperty.call(data, "anidbapp") && Object.prototype.hasOwnProperty.call(data, "anizone");
}
__name(hasCurrentProviders, "hasCurrentProviders");
function latestEpisodeFromAniZip(anizip) {
  const nums = Object.keys(anizip?.episodes ?? {}).map(Number).filter(Number.isFinite);
  return nums.length ? Math.max(...nums) : null;
}
__name(latestEpisodeFromAniZip, "latestEpisodeFromAniZip");
function resolveShared(anilistId, freshMedia = false) {
  if (freshMedia) forgetMedia(anilistId);
  return Promise.all([
    getMedia(anilistId).catch(() => null),
    fetch(`${ANIZIP4}?anilist_id=${anilistId}`).then((r) => r.json()).catch(() => null)
  ]);
}
__name(resolveShared, "resolveShared");
async function clearProviderCache(anilistId, media) {
  for (const p of ["pahe", "manga", "reanime", "anikoto", "animegg", "anineko", "anidbapp", "2dhive", "anizone"]) {
    await delAsync(`epv:${p}:${anilistId}`);
  }
  if (media?.idMal) {
    await delAsync(`jm:${media.idMal}`);
    await delByPrefixAsync(`jp:${media.idMal}:`);
  }
}
__name(clearProviderCache, "clearProviderCache");
async function buildResponse(anilistId, media, anizip, forceRefresh = false) {
  if (forceRefresh) await clearProviderCache(anilistId, media);
  const [providerResult, mappingResult] = await Promise.all([
    buildEpisodesWithCache(anilistId, media, anizip),
    mapAnimeIds(anilistId).catch(() => null)
  ]);
  return {
    page: 1,
    type: "all",
    mappings: mappingResult?.mappings ?? null,
    ...providerResult
  };
}
__name(buildResponse, "buildResponse");
function probeInterval(state) {
  const airMs = state?.nextAiringAt ? state.nextAiringAt * 1e3 : null;
  if (!airMs) return NORMAL_PROBE_INTERVAL;
  const now = Date.now();
  return now >= airMs - AIRING_EARLY_WINDOW && now <= airMs + AIRING_FAST_WINDOW ? AIRING_PROBE_INTERVAL : NORMAL_PROBE_INTERVAL;
}
__name(probeInterval, "probeInterval");
function shouldRebuild(entry, media, anizip) {
  if ((media?.status ?? "RELEASING") === "FINISHED") return false;
  const cachedLatest = latestEpisodeFromResponse(entry?.data) ?? 0;
  const knownLatest = Math.max(
    latestEpisodeFromAniZip(anizip) ?? 0,
    Number(media?.episodes) || 0
  );
  if (knownLatest > cachedLatest) return true;
  const next = media?.nextAiringEpisode;
  if (next?.episode && cachedLatest >= Number(next.episode)) return false;
  if (next?.airingAt) {
    const airMs = Number(next.airingAt) * 1e3;
    const now = Date.now();
    if (now < airMs - AIRING_EARLY_WINDOW) return false;
    if (now <= airMs + AIRING_FAST_WINDOW) return true;
  }
  return needsRefresh(entry);
}
__name(shouldRebuild, "shouldRebuild");
function writeSyncState(anilistId, state, ttl = FULL_TTL) {
  set(`sync:${anilistId}`, state, ttl, NORMAL_PROBE_INTERVAL);
}
__name(writeSyncState, "writeSyncState");
function scheduleRefresh(anilistId, entry, env) {
  const key = `ep-bg:${anilistId}`;
  if (refreshing.has(key)) return;
  const syncKey = `sync:${anilistId}`;
  const oldState = get(syncKey)?.data;
  const now = Date.now();
  if (oldState?.lastProbeAt && now - oldState.lastProbeAt < probeInterval(oldState)) return;
  refreshing.add(key);
  writeSyncState(anilistId, { ...oldState, lastProbeAt: now, syncing: true });
  const task = (async () => {
    const [media, anizip] = await resolveShared(anilistId, true);
    const cachedLatest = latestEpisodeFromResponse(entry?.data);
    const next = media?.nextAiringEpisode ?? null;
    if (!shouldRebuild(entry, media, anizip)) {
      writeSyncState(anilistId, {
        lastProbeAt: Date.now(),
        lastSyncAt: oldState?.lastSyncAt ?? null,
        latestEpisode: cachedLatest,
        nextEpisode: next?.episode ?? null,
        nextAiringAt: next?.airingAt ?? null,
        syncing: false
      });
      return;
    }
    const result = await buildResponse(anilistId, media, anizip, true);
    const latestEpisode = latestEpisodeFromResponse(result);
    await setAsync(`episodes:${anilistId}`, result, FULL_TTL, NORMAL_PROBE_INTERVAL);
    writeSyncState(anilistId, {
      lastProbeAt: Date.now(),
      lastSyncAt: Date.now(),
      latestEpisode,
      nextEpisode: next?.episode ?? null,
      nextAiringAt: next?.airingAt ?? null,
      syncing: false
    });
  })().catch((e) => {
    console.error(`[ep-bg:${anilistId}]`, e.message);
    writeSyncState(anilistId, {
      ...oldState,
      lastProbeAt: Date.now(),
      syncing: false,
      error: e.message
    }, HOUR2);
  }).finally(() => refreshing.delete(key));
  runBackground(env, task);
}
__name(scheduleRefresh, "scheduleRefresh");
async function getEpisodesResponse(anilistId, env) {
  const cacheKey = `episodes:${anilistId}`;
  const entry = await getAsync(cacheKey);
  if (entry && hasCurrentProviders(entry.data)) {
    scheduleRefresh(anilistId, entry, env);
    return entry.data;
  }
  const [media, anizip] = await resolveShared(anilistId);
  const result = await buildResponse(anilistId, media, anizip);
  await setAsync(cacheKey, result, FULL_TTL, NORMAL_PROBE_INTERVAL);
  writeSyncState(anilistId, {
    lastProbeAt: Date.now(),
    lastSyncAt: Date.now(),
    latestEpisode: latestEpisodeFromResponse(result),
    nextEpisode: media?.nextAiringEpisode?.episode ?? null,
    nextAiringAt: media?.nextAiringEpisode?.airingAt ?? null,
    syncing: false
  });
  return result;
}
__name(getEpisodesResponse, "getEpisodesResponse");
async function getFilteredEpisodesResponse(anilistId, providers, includeMap) {
  const [media, anizip] = await resolveShared(anilistId);
  const [providerResult, mappingResult] = await Promise.all([
    buildFilteredEpisodesWithCache(anilistId, providers, media, anizip),
    includeMap ? mapAnimeIds(anilistId).catch(() => null) : Promise.resolve(null)
  ]);
  return {
    page: 1,
    type: "filtered",
    ...includeMap ? { mappings: mappingResult?.mappings ?? null } : {},
    ...providerResult
  };
}
__name(getFilteredEpisodesResponse, "getFilteredEpisodesResponse");

// index.js
var app = new Hono2();
app.use("*", cors({
  origin: "*",
  allowHeaders: ["*"],
  allowMethods: ["GET", "OPTIONS"]
}));
function json4(c, data, status = 200) {
  c.header("Cache-Control", "public, max-age=300");
  return c.json(data, status);
}
__name(json4, "json");
function rewriteRequest(request, newPath) {
  const u = new URL(request.url);
  u.pathname = newPath;
  return new Request(u.toString(), { method: request.method, headers: request.headers });
}
__name(rewriteRequest, "rewriteRequest");
var watchInflight = /* @__PURE__ */ new Map();
async function cachedWatch(c, cacheKey, handlerFn) {
  const entry = await getAsync(cacheKey);
  if (entry && isFresh(entry)) return json4(c, entry.data);
  if (watchInflight.has(cacheKey)) {
    await watchInflight.get(cacheKey).catch(() => {
    });
    const warm = await getAsync(cacheKey);
    if (warm && isFresh(warm)) return json4(c, warm.data);
    const res = await handlerFn();
    c.header("Cache-Control", "public, max-age=300");
    return new Response(res.body, res);
  }
  const promise = (async () => {
    const response = await handlerFn();
    if (response.status === 200) {
      try {
        const data = await response.clone().json();
        await setAsync(cacheKey, data, WATCH_TTL);
      } catch {
      }
    }
    return response;
  })();
  watchInflight.set(cacheKey, promise);
  try {
    const res = await promise;
    c.header("Cache-Control", "public, max-age=300");
    return new Response(res.body, res);
  } finally {
    watchInflight.delete(cacheKey);
  }
}
__name(cachedWatch, "cachedWatch");
app.get("/map/:anilistId", async (c) => {
  const anilistId = c.req.param("anilistId");
  const cacheKey = `map:${anilistId}`;
  const entry = await getAsync(cacheKey);
  if (entry && isFresh(entry)) return json4(c, entry.data);
  try {
    const [data, media] = await Promise.all([
      mapAnimeIds(anilistId),
      getMedia(anilistId).catch(() => null)
    ]);
    await setAsync(cacheKey, data, mapTTL(media?.status ?? "RELEASING"));
    return json4(c, data);
  } catch (e) {
    if (entry) return json4(c, entry.data);
    return json4(c, { error: e.message }, 500);
  }
});
app.get("/episodes/:anilistId{[0-9]+}", async (c) => {
  const anilistId = c.req.param("anilistId");
  try {
    return json4(c, await getEpisodesResponse(anilistId, c.env));
  } catch (e) {
    return json4(c, { error: e.message }, 500);
  }
});
app.get("/episodes/*", async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  const m = path.match(/^\/episodes\/((?:[\w-]+\/)+)(\d+)\/?$/i);
  if (m) {
    const rawNames = m[1].replace(/\/$/, "").split("/");
    const anilistId = m[2];
    const includeMap = url.searchParams.get("map") !== "false";
    const { resolved: resolved2, unknown } = resolveProviders(rawNames);
    if (resolved2.size === 0) {
      return json4(c, { error: "No valid providers specified", unknown }, 400);
    }
    try {
      const data = await getFilteredEpisodesResponse(anilistId, resolved2, includeMap);
      if (unknown.length) data._unknownProviders = unknown;
      return json4(c, data);
    } catch (e) {
      return json4(c, { error: e.message }, 500);
    }
  }
  return c.notFound();
});
app.get("/watch/allmanga/:id/:audio/allmanga-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:manga:${id}:${audio}:${ep}`, () => allmanga_default2.fetch(c.req.raw));
});
app.get("/watch/reanime/:id/:audio/reanime-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:reanime:${id}:${audio}:${ep}`, () => reanime_default2.fetch(rewriteRequest(c.req.raw, `/watch/${id}/${audio}/${ep}`)));
});
app.get("/stream/reanime/:id/:audio/:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return reanime_default2.fetch(rewriteRequest(c.req.raw, `/stream/${id}/${audio}/${ep}`));
});
app.get("/watch/anikoto/:id/:audio/anikoto-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anikoto:${id}:${audio}:${ep}`, () => anikoto_default.fetch(c.req.raw));
});
app.get("/watch/animegg/:id/:audio/animegg-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animegg:${id}:${audio}:${ep}`, () => animegg_default.fetch(c.req.raw));
});
app.get("/watch/anineko/:id/:audio/anineko-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anineko:${id}:${audio}:${ep}`, () => anineko_default.fetch(c.req.raw));
});
app.get("/watch/anidbapp/:id/:audio/anidbapp-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anidbapp:${id}:${audio}:${ep}`, () => anidbapp_default.fetch(c.req.raw));
});
app.get("/watch/2dhive/:id/:audio/2dhive-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:2dhive:${id}:${audio}:${ep}`, () => dhive_default.fetch(c.req.raw));
});
app.get("/watch/animenosub/:id/:audio/animenosub-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animenosub:${id}:${audio}:${ep}`, () => animenosub_default.fetch(c.req.raw));
});
app.get("/watch/anizone/:id/:audio/anizone-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anizone:${id}:${audio}:${ep}`, () => anizone_default.fetch(c.req.raw));
});
app.get("/watch/anibd/:id/:audio/anibd-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anibd:${id}:${audio}:${ep}`, () => anibd_default.fetch(c.req.raw));
});
app.get("/watch/senshi/:id/:audio/senshi-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:senshi:${id}:${audio}:${ep}`, () => senshi_default.fetch(c.req.raw));
});
app.get("/watch/kaa/:id/:audio/kaa-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:kaa:${id}:${audio}:${ep}`, () => kickassanime_default.fetch(c.req.raw));
});
app.get("/watch/animedunya/:id/:audio/animedunya-:ep", async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animedunya:${id}:${audio}:${ep}`, () => animedunya_default.fetch(c.req.raw));
});
app.get("/stream/2dhive/:id/:audio/:ep", async (c) => {
  return dhive_default.fetch(c.req.raw);
});
app.get("/stream/2dhive/download/:id/:audio/:ep", async (c) => {
  return dhive_default.fetch(c.req.raw);
});
app.get("/", (c) => {
  return json4(c, {
    name: "Anivexa API 2.1 (Hono Edition)",
    cache: _CACHE_ENABLED,
    providers: [
      "allmanga",
      "reanime",
      "anikoto",
      "animegg",
      "anineko",
      "anidbapp",
      "2dhive",
      "animenosub",
      "anizone",
      "anibd",
      "senshi",
      "kaa",
      "animedunya"
    ],
    routes: [
      "/map/:anilistId",
      "/episodes/:anilistId",
      "/episodes/:provider[/:provider...]/:anilistId?map=true|false",
      "/watch/allmanga/:id/sub|dub/allmanga-:ep",
      "/watch/reanime/:id/sub|dub/reanime-:ep",
      "/stream/reanime/:id/sub|dub/:ep",
      "/watch/anikoto/:id/sub|dub/anikoto-:ep",
      "/watch/animegg/:id/sub|dub/animegg-:ep",
      "/watch/anineko/:id/sub|dub/anineko-:ep",
      "/watch/anidbapp/:id/sub|dub/anidbapp-:ep",
      "/watch/2dhive/:id/sub|dub/2dhive-:ep",
      "/stream/2dhive/:id/sub|dub/:ep",
      "/stream/2dhive/download/:id/sub|dub/:ep",
      "/watch/animenosub/:id/sub|dub/animenosub-:ep",
      "/watch/anizone/:id/sub|dub/anizone-:ep",
      "/watch/anibd/:id/sub|dub/anibd-:ep",
      "/watch/senshi/:id/sub|dub/senshi-:ep",
      "/watch/kaa/:id/sub|dub/kaa-:ep",
      "/watch/animedunya/:id/sub|dub/animedunya-:ep"
    ]
  });
});
var index_default = app;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-KjHfqP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-KjHfqP/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
