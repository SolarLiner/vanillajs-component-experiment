export abstract class Component<E extends HTMLElement> {
  private readonly binds: Map<HTMLElement, Map<keyof HTMLElement, () => void>>;

  protected constructor(public readonly root: E) {
    this.binds = new Map();
    this.$nextTick(this.setupEvents.bind(this));
  }

  /* --- Event hooks --- */

  postSetup() {}

  preUpdate() {}

  postUpdate() {}

  preDisconnect() {}

  $nextTick(fn: () => void, ...args: any[]) {
    setTimeout(fn, 0, ...args);
  }

  private setupEvents() {
    console.time("setupEvents");
    const stack: HTMLElement[] = [this.root];
    while (stack.length > 0) {
      const el = stack.pop();
      stack.push(...ofType(HTMLElement, Array.prototype.slice.call(el.children)));

      for (const a in el.dataset) {
        const attr = pascalCase(a);
        if (attr.startsWith("value-")) {
          const tgtAttr = attr.slice(6);
          if (!isAttribute(tgtAttr)) continue;
          if (!this.binds.has(el)) {
            this.binds.set(el, new Map());
          }
          const b = this.binds.get(el);
          b.set(
            tgtAttr,
            () =>
              (el.attributes[tgtAttr] = createFunctionWithContext(el.dataset[a], this, {
                $el: el,
              }))
          );
        } else if (attr.startsWith("bind-")) {
          const tgtAttr = attr.slice(5);
          if (!isAttribute(tgtAttr)) continue;
          el.addEventListener("input", () => {
            this[el.dataset[a]] = el[tgtAttr];
            this.update();
          });
        } else if (attr.startsWith("on-")) {
          const tgtEvent = camelCase(attr.slice(2));
          if (!isEventKey(tgtEvent)) continue;
          el.addEventListener(tgtEvent, ($event) => {
            createFunctionWithContext(el.dataset[a], this, { $event, $el: el });
            this.update();
          });
        } else if (attr === "text") {
          if (!this.binds.has(el)) this.binds.set(el, new Map());
          const b = this.binds.get(el);
          const fn: () => string = createFunctionWithContext(el.dataset.text, this, {
            $el: el,
          });
          b.set("innerText", () => (el.innerText = fn()));
        } else if (attr === "html") {
          if (!this.binds.has(el)) this.binds.set(el, new Map());
          const b = this.binds.get(el);
          const fn: () => string = createFunctionWithContext(el.dataset.text, this, {
            $el: el,
          });
          b.set("innerHTML", () => (el.innerHTML = fn()));
        } else {
          if (!this.binds.has(el)) this.binds.set(el, new Map());
          const b = this.binds.get(el);
          const fn: () => any = createFunctionWithContext(el.dataset[a], this, { $el: el });
          b.set(attr as any, () => {
            let r = fn();
            if(typeof r === "boolean") {
              if(r) el.setAttribute(attr, "");
              else el.removeAttribute(attr);
            } else {
              el.setAttribute(attr, fn());
            }
          });
        }
      }
    }
    console.timeEnd("setupEvents");

    this.postSetup();

    this.update();
  }

  update() {
    console.time("update");
    this.preUpdate();
    for (const map of this.binds.values()) {
      for (const f of map.values()) {
        f();
      }
    }
    this.postUpdate();
    console.timeEnd("update");
  }

  disconnect() {
    this.preDisconnect();
  }
}

const CTX_BLACKLIST = [
  "constructor",
  "postSetup",
  "preUpdate",
  "postUpdate",
  "preDisconnect",
  "setupEvents",
  "update",
  "disconnect",
  "root",
  "binds",
];

function createFunctionWithContext<T, C, A>(code: string, ctx: C, args?: A): () => T {
  const properties = Object.keys(args);
  code = code.trim();
  if (!code.startsWith("{")) code = "{ return " + code;
  if (!code.endsWith("}")) code += " }";
  if (args) {
    const fn = new Function(...properties, code).bind(ctx);
    console.log("fn", fn);
    return () => fn(...properties.map((k) => args[k]));
  } else {
    const fn = new Function(code).bind(ctx);
    console.log("fn", fn);
    return fn;
  }
}

const isAttribute = (s: string): s is keyof HTMLElement => true;
const isEventKey = (s: string): s is keyof HTMLElementEventMap => true;

function ofType<U, T extends U>(klass: { new (): T }, arr: U[]): T[] {
  return arr.filter((v) => v instanceof klass) as T[];
}

const pascalCase = (str: string): string => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
const camelCase = (str: string) =>
  str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace("-", "").replace("_", ""));
