import { parse, DefaultTreeAdapterMap } from "parse5";
import { createError, ValidationError } from "./errors";
import {
  Slideshow,
  Slide,
  SlideshowMeta,
  ContentNode,
  ContainerElement,
  ImgElement,
  SourceLocation,
  TransitionType,
  ELEMENT_CHILDREN,
  ALLOWED_ELEMENTS_SET,
  VALID_TRANSITIONS_SET,
  TEXT_ONLY_ELEMENTS_SET,
  META_ELEMENTS_SET,
  ORDER_PATTERN,
  DELAY_PATTERN,
  ISO_DATE_PATTERN,
} from "./types";

type Document = DefaultTreeAdapterMap["document"];
type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];
type TextNodeParse5 = DefaultTreeAdapterMap["textNode"];

export interface ParseResult {
  success: true;
  slideshow: Slideshow;
}

export interface ParseError {
  success: false;
  errors: ValidationError[];
}

export type ParseOutput = ParseResult | ParseError;

function getLocation(node: Node): SourceLocation {
  const loc = node.sourceCodeLocation;
  return {
    line: loc?.startLine ?? 0,
    column: loc?.startCol ?? 0,
  };
}

function getAttribute(element: Element, name: string): string | undefined {
  const attr = element.attrs.find((a) => a.name === name);
  return attr?.value;
}

function isElement(node: Node): node is Element {
  return "tagName" in node;
}

function isTextNode(node: Node): node is TextNodeParse5 {
  return node.nodeName === "#text";
}

function findElements(parent: Node, tagName: string): Element[] {
  const results: Element[] = [];
  if ("childNodes" in parent) {
    for (const child of parent.childNodes) {
      if (isElement(child) && child.tagName === tagName) {
        results.push(child);
      }
    }
  }
  return results;
}

function findFirstElement(parent: Node, tagName: string): Element | undefined {
  if ("childNodes" in parent) {
    for (const child of parent.childNodes) {
      if (isElement(child) && child.tagName === tagName) {
        return child;
      }
    }
  }
  return undefined;
}

function getTextContent(element: Element, preserveWhitespace = false): string {
  let text = "";
  if ("childNodes" in element) {
    for (const child of element.childNodes) {
      if (isTextNode(child)) {
        text += child.value;
      } else if (isElement(child)) {
        text += getTextContent(child, preserveWhitespace);
      }
    }
  }

  if (!preserveWhitespace) {
    text = text.trim().replace(/\s+/g, " ");
  }

  return text;
}

function hasNarrationInSubtree(element: Element): boolean {
  if (getAttribute(element, "narration") !== undefined) {
    return true;
  }

  if ("childNodes" in element) {
    for (const child of element.childNodes) {
      if (isElement(child) && hasNarrationInSubtree(child)) {
        return true;
      }
    }
  }

  return false;
}

// Validation helpers to reduce code duplication
function validatePositiveInteger(
  value: string,
  location: SourceLocation,
  errorCode: "E006" | "E011",
  errors: ValidationError[]
): number | null {
  if (!ORDER_PATTERN.test(value)) {
    errors.push(createError(errorCode, location));
    return null;
  }

  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > Number.MAX_SAFE_INTEGER) {
    errors.push(createError(errorCode, location));
    return null;
  }

  return num;
}

function validateDelay(
  value: string,
  location: SourceLocation,
  errors: ValidationError[]
): number | null {
  if (!DELAY_PATTERN.test(value)) {
    errors.push(createError("E012", location));
    return null;
  }

  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0 || num > Number.MAX_SAFE_INTEGER) {
    errors.push(createError("E012", location));
    return null;
  }

  return num;
}

export function parseSld(content: string): ParseOutput {
  const errors: ValidationError[] = [];
  const seenIds = new Set<string>();

  const document = parse(content, {
    sourceCodeLocationInfo: true,
  }) as Document;

  // Find html > body > slideshow (parse5 wraps in html/body)
  const html = findFirstElement(document, "html");
  const body = html ? findFirstElement(html, "body") : undefined;
  const slideshowElement = body
    ? findFirstElement(body, "slideshow")
    : undefined;

  // E001: Missing slideshow root
  if (!slideshowElement) {
    errors.push(createError("E001", { line: 1, column: 1 }));
    return { success: false, errors };
  }

  const slideshowLoc = getLocation(slideshowElement);

  // E002: Missing title
  const title = getAttribute(slideshowElement, "title");
  if (title === undefined) {
    errors.push(createError("E002", slideshowLoc));
    return { success: false, errors };
  }

  // E003: Empty title
  if (title.trim() === "") {
    errors.push(createError("E003", slideshowLoc));
    return { success: false, errors };
  }

  const author = getAttribute(slideshowElement, "author");
  const version = getAttribute(slideshowElement, "version");

  // Check for metadata element
  let meta: SlideshowMeta | undefined;
  const metaElement = findFirstElement(slideshowElement, "metadata");

  // Find all slides
  const slideElements = findElements(slideshowElement, "slide");

  // E004: No slides
  if (slideElements.length === 0) {
    errors.push(createError("E004", slideshowLoc));
    return { success: false, errors };
  }

  // E016: meta after slide
  if (metaElement) {
    const metaLoc = getLocation(metaElement);
    const firstSlideLoc = getLocation(slideElements[0]);

    if (metaLoc.line > firstSlideLoc.line) {
      errors.push(createError("E016", metaLoc));
    } else {
      meta = parseMeta(metaElement, errors);
    }
  }

  // Validate unknown elements in slideshow
  if ("childNodes" in slideshowElement) {
    for (const child of slideshowElement.childNodes) {
      if (isElement(child)) {
        const tagName = child.tagName;
        if (tagName !== "metadata" && tagName !== "slide") {
          if (!ALLOWED_ELEMENTS_SET.has(tagName) && tagName !== "head") {
            errors.push(
              createError("E014", getLocation(child), { element: tagName })
            );
          }
        }
      }
    }
  }

  // Parse slides
  const slides: Slide[] = [];
  const slideOrders = new Map<number, SourceLocation>();

  for (const slideEl of slideElements) {
    const slideLoc = getLocation(slideEl);

    // E005: Missing order
    const orderStr = getAttribute(slideEl, "order");
    if (orderStr === undefined) {
      errors.push(createError("E005", slideLoc));
      continue;
    }

    // E006: Invalid order (must be positive integer without leading zeros)
    const order = validatePositiveInteger(orderStr, slideLoc, "E006", errors);
    if (order === null) {
      continue;
    }

    // E007: Duplicate order
    if (slideOrders.has(order)) {
      errors.push(createError("E007", slideLoc, { order }));
      continue;
    }
    slideOrders.set(order, slideLoc);

    // Validate transition
    const transitionStr = getAttribute(slideEl, "transition") ?? "none";
    if (!VALID_TRANSITIONS_SET.has(transitionStr)) {
      errors.push(
        createError("E019", slideLoc, { transition: transitionStr })
      );
      continue;
    }
    const transition = transitionStr as TransitionType;

    // Check id uniqueness
    const id = getAttribute(slideEl, "id");
    if (id !== undefined) {
      if (seenIds.has(id)) {
        errors.push(createError("E013", slideLoc, { id }));
      } else {
        seenIds.add(id);
      }
    }

    // Parse children
    const children = parseChildren(slideEl, "slide", errors, seenIds);

    slides.push({
      order,
      transition,
      id,
      children,
      location: slideLoc,
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Sort slides by order
  slides.sort((a, b) => a.order - b.order);

  return {
    success: true,
    slideshow: {
      title,
      author,
      version,
      meta,
      slides,
      location: slideshowLoc,
    },
  };
}

const VALID_META_CHILDREN_SET = new Set(["description", "tags", "created", "modified"]);

function parseMeta(
  metaElement: Element,
  errors: ValidationError[]
): SlideshowMeta {
  const meta: SlideshowMeta = {};
  const seenElements = new Set<string>();

  if ("childNodes" in metaElement) {
    for (const child of metaElement.childNodes) {
      if (isElement(child)) {
        const tagName = child.tagName;
        const childLoc = getLocation(child);

        // E020: Unknown element in metadata
        if (!VALID_META_CHILDREN_SET.has(tagName)) {
          errors.push(createError("E020", childLoc, { element: tagName }));
          continue;
        }

        // E021: Duplicate metadata element
        if (seenElements.has(tagName)) {
          errors.push(createError("E021", childLoc, { element: tagName }));
          continue;
        }
        seenElements.add(tagName);

        const textContent = getTextContent(child);

        // E022: Invalid date format
        if (tagName === "created" || tagName === "modified") {
          if (textContent && !ISO_DATE_PATTERN.test(textContent)) {
            errors.push(createError("E022", childLoc, { element: tagName }));
            continue;
          }
        }

        // Store values
        if (tagName === "description") {
          meta.description = textContent;
        } else if (tagName === "tags") {
          meta.tags = textContent.split(",").map((t) => t.trim()).filter(Boolean);
        } else if (tagName === "created") {
          meta.created = textContent;
        } else if (tagName === "modified") {
          meta.modified = textContent;
        }
      }
    }
  }

  return meta;
}

function parseChildren(
  parent: Element,
  parentTagName: string,
  errors: ValidationError[],
  seenIds: Set<string>
): ContentNode[] {
  const children: ContentNode[] = [];
  const siblingOrders = new Map<number, SourceLocation>();

  if (!("childNodes" in parent)) {
    return children;
  }

  const isPreElement = parentTagName === "pre";

  for (const child of parent.childNodes) {
    if (isTextNode(child)) {
      const text = isPreElement
        ? child.value
        : child.value.trim().replace(/\s+/g, " ");

      // For pre elements, preserve all text including whitespace-only
      // For other elements, only add non-empty text
      if (text || isPreElement) {
        children.push({
          type: "text",
          content: text,
          location: getLocation(child),
        });
      }
    } else if (isElement(child)) {
      const tagName = child.tagName;
      const childLoc = getLocation(child);

      // Skip html structure elements injected by parse5
      if (tagName === "head" || tagName === "body" || tagName === "html") {
        continue;
      }

      // E014: Unknown element
      if (!ALLOWED_ELEMENTS_SET.has(tagName)) {
        errors.push(createError("E014", childLoc, { element: tagName }));
        continue;
      }

      // Skip structural/metadata elements in content
      if (
        tagName === "slideshow" ||
        tagName === "slide" ||
        tagName === "metadata" ||
        META_ELEMENTS_SET.has(tagName)
      ) {
        continue;
      }

      // E015: Text-only elements (pre, code) cannot have element children
      if (TEXT_ONLY_ELEMENTS_SET.has(parentTagName)) {
        errors.push(
          createError("E015", childLoc, { child: tagName, parent: parentTagName })
        );
        continue;
      }

      // E015: Check child element constraints (ul/ol can only contain li)
      const allowedChildren = ELEMENT_CHILDREN[parentTagName];
      if (allowedChildren !== undefined && allowedChildren.length > 0) {
        if (!allowedChildren.includes(tagName)) {
          errors.push(
            createError("E015", childLoc, { child: tagName, parent: parentTagName })
          );
          continue;
        }
      }

      // Validate id uniqueness
      const id = getAttribute(child, "id");
      if (id !== undefined) {
        if (seenIds.has(id)) {
          errors.push(createError("E013", childLoc, { id }));
        } else {
          seenIds.add(id);
        }
      }

      // Validate narration/order relationship
      const narration = getAttribute(child, "narration");
      const orderStr = getAttribute(child, "order");
      const delayStr = getAttribute(child, "delay");

      // E008: narration without order
      if (narration !== undefined && orderStr === undefined) {
        errors.push(createError("E008", childLoc));
        continue;
      }

      // E009: descendant has narration but element has no order
      if (orderStr === undefined && hasNarrationInSubtree(child)) {
        errors.push(createError("E009", childLoc));
        continue;
      }

      let order: number | undefined;
      let delay = 0;

      if (orderStr !== undefined) {
        const validatedOrder = validatePositiveInteger(orderStr, childLoc, "E011", errors);
        if (validatedOrder === null) {
          continue;
        }
        order = validatedOrder;

        // E010: Duplicate order among siblings
        if (siblingOrders.has(order)) {
          errors.push(createError("E010", childLoc, { order }));
          continue;
        }
        siblingOrders.set(order, childLoc);
      }

      if (delayStr !== undefined) {
        const validatedDelay = validateDelay(delayStr, childLoc, errors);
        if (validatedDelay === null) {
          continue;
        }
        delay = validatedDelay;
      }

      // Parse element
      if (tagName === "img") {
        const src = getAttribute(child, "src");
        const alt = getAttribute(child, "alt");

        // E017: Missing src
        if (src === undefined) {
          errors.push(createError("E017", childLoc));
          continue;
        }

        // E018: Missing alt
        if (alt === undefined) {
          errors.push(createError("E018", childLoc));
          continue;
        }

        const imgElement: ImgElement = {
          type: "img",
          src,
          alt,
          width: getAttribute(child, "width"),
          height: getAttribute(child, "height"),
          id,
          order,
          narration,
          delay,
          location: childLoc,
        };
        children.push(imgElement);
      } else {
        // Container element
        const elementChildren = parseChildren(child, tagName, errors, seenIds);

        const containerElement: ContainerElement = {
          type: tagName as ContainerElement["type"],
          children: elementChildren,
          id,
          order,
          narration,
          delay,
          location: childLoc,
        };
        children.push(containerElement);
      }
    }
  }

  return children;
}
