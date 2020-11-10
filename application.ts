import { Component } from "./component";

type ComponentConstructor<T extends HTMLElement> = { new(root: T): Component<T> };

class Application {
  constructor(private readonly binds: Map<HTMLElement, Component<HTMLElement>>) {
  }

  shutdown() {
    for(const component of this.binds.values()) {
      component.disconnect();
    }
    this.binds.clear();
  }
}

export class ApplicationBuilder {
  private readonly registeredComponents: Map<string, ComponentConstructor<HTMLElement>>;

  constructor() {
    this.registeredComponents = new Map();
  }

  register<T extends HTMLElement>(name: string, component: ComponentConstructor<T>): this {
    this.registeredComponents.set(name, component);
    return this;
  }

  bind(root: HTMLElement) {
    const binds = new Map();
    for(const key of this.registeredComponents.keys()) {
      let componentTargets = ofType(HTMLElement, Array.from(root.querySelectorAll(`[data-component=${key}]`)));
      for(const el of componentTargets) {
        const componentClass = this.registeredComponents.get(key);
        const component = new componentClass(el as HTMLElement);
        binds.set(el, component);
        el.removeAttribute("data-component");
      }
    }

    return new Application(binds);
  }
}

function ofType<U, T extends U>(ty: { new(...args: any): T }, arr: U[]): T[] {
  return arr.filter(v => v instanceof ty) as T[]
}
