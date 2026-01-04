import type { Slideshow, ContentNode, ContentElement } from "../parser/types";
import type { NarrationItem } from "./types";

/**
 * Builds a flat narration queue from a slideshow by traversing each slide's content tree.
 *
 * Algorithm:
 * 1. Iterate through slides in order
 * 2. For each slide, traverse its content tree recursively
 * 3. Sort children with `order` attribute by their order value
 * 4. For each ordered child (processed in order):
 *    a. If has `narration`, add to queue
 *    b. Recursively process children
 * 5. Return flat array of NarrationItems
 *
 * IMPORTANT: The elementPath must use the ACTUAL index in the children array,
 * not the index in the sorted/filtered array. This ensures the ID matches
 * what SlideContent generates for highlighting.
 *
 * @param slideshow - The parsed slideshow AST
 * @returns Flat array of narration items in playback order
 */
export function buildNarrationQueue(slideshow: Slideshow): NarrationItem[] {
  const queue: NarrationItem[] = [];

  // Process each slide in order
  const sortedSlides = [...slideshow.slides].sort((a, b) => a.order - b.order);

  sortedSlides.forEach((slide, slideIndex) => {
    // Traverse the slide's content tree
    traverseContent(slide.children, [], slideIndex, queue);
  });

  return queue;
}

/**
 * Represents an element with its original index in the children array.
 */
interface IndexedElement {
  element: ContentElement;
  originalIndex: number;
}

/**
 * Recursively traverses content nodes and builds narration items.
 *
 * The key insight is that we need to:
 * 1. Track the ORIGINAL index of each element in the children array
 * 2. Sort by `order` attribute for processing sequence
 * 3. Use the ORIGINAL index in the path (not the sorted index)
 *
 * @param nodes - Array of content nodes to traverse
 * @param parentPath - Path to parent element in slide tree
 * @param slideIndex - Index of current slide
 * @param queue - Accumulator for narration items
 */
function traverseContent(
  nodes: ContentNode[],
  parentPath: number[],
  slideIndex: number,
  queue: NarrationItem[]
): void {
  // Build array of elements with their original indices
  const indexedElements: IndexedElement[] = [];

  nodes.forEach((node, originalIndex) => {
    if (node.type !== "text") {
      indexedElements.push({
        element: node as ContentElement,
        originalIndex,
      });
    }
  });

  // Filter to only elements with order attribute
  const orderedElements = indexedElements.filter(
    (item) => item.element.order !== undefined
  );

  // Sort by order attribute (ascending)
  const sortedElements = [...orderedElements].sort(
    (a, b) => a.element.order! - b.element.order!
  );

  // Process each ordered element
  sortedElements.forEach((item) => {
    const { element, originalIndex } = item;

    // Build the path using the ORIGINAL index in the children array
    const elementPath = [...parentPath, originalIndex];

    // If element has narration, add to queue
    if (element.narration !== undefined) {
      const id = generateNarrationId(slideIndex, elementPath);
      queue.push({
        id,
        text: element.narration,
        delay: element.delay ?? 0,
        elementPath,
        slideIndex,
      });
    }

    // Recursively process children if this is a container element
    if ("children" in element && Array.isArray(element.children)) {
      traverseContent(element.children, elementPath, slideIndex, queue);
    }
  });
}

/**
 * Generates a unique ID for a narration item.
 * Format: slide-{slideIndex}-elem-{path} (matches SlideContent component's ID generation)
 * Including slideIndex ensures IDs are unique across all slides.
 *
 * @param slideIndex - Index of the slide containing this element
 * @param elementPath - Path to element in slide tree
 * @returns Unique ID string
 */
function generateNarrationId(slideIndex: number, elementPath: number[]): string {
  return `slide-${slideIndex}-elem-${elementPath.join("-")}`;
}
