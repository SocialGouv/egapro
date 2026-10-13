import "./animationPolyfills";

import autoAnimate from "@formkit/auto-animate";

// auto-animate records the position of the children of a parent after its animation delay (250 ms).
const settle = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

describe("auto-animate", () => {
  let errors: unknown[];
  const onError = (event: ErrorEvent) => {
    errors.push(event.error ?? event.message);
    event.preventDefault();
  };

  beforeEach(() => {
    errors = [];
    window.addEventListener("error", onError);
  });

  afterEach(() => {
    window.removeEventListener("error", onError);
    document.body.innerHTML = "";
  });

  it("retire sans exception un conteneur animé devenu sa propre cible", async () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    inner.append(document.createElement("p"));
    outer.append(inner);
    document.body.append(outer);
    autoAnimate(outer);
    autoAnimate(inner);
    await settle(300);

    // A mutation of inner, seen before any mutation of outer, makes inner its own target.
    inner.append(document.createElement("p"));
    await settle();
    // Only child of outer: no sibling to put it back next to for its exit animation.
    outer.removeChild(inner);
    await settle();

    expect(errors).toEqual([]);
    expect(outer.contains(inner)).toBe(false);
  });

  it("anime toujours la sortie d'un élément à côté de ses voisins", async () => {
    const parent = document.createElement("div");
    const [first, second] = [document.createElement("p"), document.createElement("p")];
    parent.append(first, second);
    document.body.append(parent);
    autoAnimate(parent);
    await settle(300);

    parent.removeChild(second);
    await settle();

    expect(errors).toEqual([]);
    expect(parent.lastElementChild).toBe(second);
    expect(second.style.position).toBe("absolute");
  });
});
