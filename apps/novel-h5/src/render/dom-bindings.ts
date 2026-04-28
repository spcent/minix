type ClickHandler<TElement extends HTMLElement> = (element: TElement, event: MouseEvent) => void | Promise<void>;
type InputValueHandler<TElement extends HTMLInputElement | HTMLTextAreaElement> = (
  value: string,
  element: TElement,
  event: Event,
) => void | Promise<void>;

export function queryElement<TElement extends Element>(root: ParentNode, selector: string): TElement | null {
  return root.querySelector<TElement>(selector);
}

export function bindClicks<TElement extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
  handler: ClickHandler<TElement>,
) {
  root.querySelectorAll<TElement>(selector).forEach((element) => {
    element.addEventListener("click", (event) => {
      void handler(element, event);
    });
  });
}

export function bindInputValue<TElement extends HTMLInputElement | HTMLTextAreaElement>(
  root: ParentNode,
  selector: string,
  handler: InputValueHandler<TElement>,
): TElement | null {
  const input = queryElement<TElement>(root, selector);
  if (!input) {
    return null;
  }

  input.addEventListener("input", (event) => {
    void handler(input.value, input, event);
  });

  return input;
}

export function readDataValue(element: HTMLElement, key: string): string | undefined {
  const value = element.dataset[key];
  return value && value.length > 0 ? value : undefined;
}
