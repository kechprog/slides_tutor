import { describe, it, expect } from "vitest";
import { buildNarrationQueue } from "./builder";
import type { Slideshow, Slide, ContainerElement } from "../parser/types";

/**
 * NARRATION SYSTEM TEST SUITE
 *
 * Tests the narration queue builder which traverses slideshow content trees
 * and creates a flat array of narration items for playback.
 */

describe("buildNarrationQueue", () => {
  describe("Basic functionality", () => {
    it("builds empty queue for slideshow with no narration", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                children: [{ type: "text", content: "Hello", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(0);
    });

    it("builds queue with single narration item", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Hello world",
                children: [{ type: "text", content: "Hello", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(1);
      expect(queue[0]).toEqual({
        id: "elem-0",
        text: "Hello world",
        delay: 0,
        elementPath: [0],
        slideIndex: 0,
      });
    });

    it("captures delay attribute", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Hello world",
                delay: 500,
                children: [{ type: "text", content: "Hello", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(1);
      expect(queue[0].delay).toBe(500);
    });

    it("defaults delay to 0 when not specified", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Hello world",
                children: [{ type: "text", content: "Hello", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue[0].delay).toBe(0);
    });
  });

  describe("Element ordering", () => {
    it("sorts siblings by order attribute", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 3,
                narration: "Third",
                children: [{ type: "text", content: "Third", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
              {
                type: "p",
                order: 1,
                narration: "First",
                children: [{ type: "text", content: "First", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
              {
                type: "p",
                order: 2,
                narration: "Second",
                children: [{ type: "text", content: "Second", location: { line: 3, column: 1 } }],
                location: { line: 3, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(3);
      expect(queue[0].text).toBe("First");
      expect(queue[1].text).toBe("Second");
      expect(queue[2].text).toBe("Third");
    });

    it("handles non-sequential order values", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 10,
                narration: "Last",
                children: [{ type: "text", content: "Last", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
              {
                type: "p",
                order: 1,
                narration: "First",
                children: [{ type: "text", content: "First", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
              {
                type: "p",
                order: 5,
                narration: "Middle",
                children: [{ type: "text", content: "Middle", location: { line: 3, column: 1 } }],
                location: { line: 3, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(3);
      expect(queue[0].text).toBe("First");
      expect(queue[1].text).toBe("Middle");
      expect(queue[2].text).toBe("Last");
    });

    it("skips elements without order attribute", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Has order",
                children: [{ type: "text", content: "First", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
              {
                type: "p",
                narration: "No order",
                children: [{ type: "text", content: "Second", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
              {
                type: "p",
                order: 2,
                narration: "Also has order",
                children: [{ type: "text", content: "Third", location: { line: 3, column: 1 } }],
                location: { line: 3, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(2);
      expect(queue[0].text).toBe("Has order");
      expect(queue[1].text).toBe("Also has order");
    });
  });

  describe("Nested traversal", () => {
    it("traverses nested elements depth-first", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "div",
                order: 1,
                narration: "Parent",
                children: [
                  {
                    type: "p",
                    order: 1,
                    narration: "Child 1",
                    children: [{ type: "text", content: "Child 1", location: { line: 1, column: 1 } }],
                    location: { line: 1, column: 1 },
                  },
                  {
                    type: "p",
                    order: 2,
                    narration: "Child 2",
                    children: [{ type: "text", content: "Child 2", location: { line: 2, column: 1 } }],
                    location: { line: 2, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(3);
      expect(queue[0].text).toBe("Parent");
      expect(queue[1].text).toBe("Child 1");
      expect(queue[2].text).toBe("Child 2");
    });

    it("handles deeply nested structures", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "ul",
                order: 1,
                narration: "List",
                children: [
                  {
                    type: "li",
                    order: 1,
                    narration: "Item 1",
                    children: [
                      {
                        type: "ul",
                        order: 1,
                        children: [
                          {
                            type: "li",
                            order: 1,
                            narration: "Nested Item 1",
                            children: [{ type: "text", content: "Nested 1", location: { line: 1, column: 1 } }],
                            location: { line: 1, column: 1 },
                          },
                          {
                            type: "li",
                            order: 2,
                            narration: "Nested Item 2",
                            children: [{ type: "text", content: "Nested 2", location: { line: 2, column: 1 } }],
                            location: { line: 2, column: 1 },
                          },
                        ],
                        location: { line: 1, column: 1 },
                      },
                    ],
                    location: { line: 1, column: 1 },
                  },
                  {
                    type: "li",
                    order: 2,
                    narration: "Item 2",
                    children: [{ type: "text", content: "Item 2", location: { line: 3, column: 1 } }],
                    location: { line: 3, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(5);
      expect(queue[0].text).toBe("List");
      expect(queue[1].text).toBe("Item 1");
      expect(queue[2].text).toBe("Nested Item 1");
      expect(queue[3].text).toBe("Nested Item 2");
      expect(queue[4].text).toBe("Item 2");
    });

    it("skips parent without narration but processes children", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "div",
                order: 1,
                // No narration on parent
                children: [
                  {
                    type: "p",
                    order: 1,
                    narration: "Child narration",
                    children: [{ type: "text", content: "Child", location: { line: 1, column: 1 } }],
                    location: { line: 1, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(1);
      expect(queue[0].text).toBe("Child narration");
    });
  });

  describe("Element paths", () => {
    it("generates correct path for top-level element", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "First",
                children: [{ type: "text", content: "First", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue[0].elementPath).toEqual([0]);
    });

    it("generates correct path for nested element", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "div",
                order: 1,
                children: [
                  {
                    type: "p",
                    order: 1,
                    narration: "Nested",
                    children: [{ type: "text", content: "Nested", location: { line: 1, column: 1 } }],
                    location: { line: 1, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue[0].elementPath).toEqual([0, 0]);
    });

    it("generates unique IDs for all elements", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "First",
                children: [{ type: "text", content: "First", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
              {
                type: "p",
                order: 2,
                narration: "Second",
                children: [{ type: "text", content: "Second", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue[0].id).toBe("elem-0");
      expect(queue[1].id).toBe("elem-1");
    });
  });

  describe("Multiple slides", () => {
    it("processes slides in order", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 2,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Slide 2",
                children: [{ type: "text", content: "Slide 2", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Slide 1",
                children: [{ type: "text", content: "Slide 1", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
            ],
            location: { line: 2, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue).toHaveLength(2);
      expect(queue[0].text).toBe("Slide 1");
      expect(queue[0].slideIndex).toBe(0);
      expect(queue[1].text).toBe("Slide 2");
      expect(queue[1].slideIndex).toBe(1);
    });

    it("tracks correct slide index for each item", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "First slide",
                children: [{ type: "text", content: "First", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
          {
            order: 2,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Second slide",
                children: [{ type: "text", content: "Second", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
            ],
            location: { line: 2, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      expect(queue[0].slideIndex).toBe(0);
      expect(queue[1].slideIndex).toBe(1);
    });

    it("generates IDs with correct slide index", () => {
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Slide 1 item",
                children: [{ type: "text", content: "First", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
          {
            order: 2,
            transition: "none",
            children: [
              {
                type: "p",
                order: 1,
                narration: "Slide 2 item",
                children: [{ type: "text", content: "Second", location: { line: 2, column: 1 } }],
                location: { line: 2, column: 1 },
              },
            ],
            location: { line: 2, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      // IDs don't include slide index since SlideContent generates
      // IDs based on path only (one slide rendered at a time)
      expect(queue[0].id).toBe("elem-0");
      expect(queue[1].id).toBe("elem-0"); // Same path on different slide
      // We track slideIndex separately in the NarrationItem
      expect(queue[0].slideIndex).toBe(0);
      expect(queue[1].slideIndex).toBe(1);
    });
  });

  describe("Real-world nested structures", () => {
    it("handles <li> with nested <pre> elements (like sample.sld slide 3)", () => {
      // This mirrors the structure in sample.sld slide 3:
      // <div order="3">
      //   <h3 order="1" narration="...">...</h3>
      //   <ol order="2">
      //     <li order="1" narration="...">
      //       <strong>...</strong>
      //       <pre order="1" narration="...">code</pre>
      //     </li>
      //     <li order="2" narration="..." delay="400">
      //       <strong>...</strong>
      //       <pre order="1" narration="..." delay="300">code</pre>
      //     </li>
      //   </ol>
      // </div>
      const slideshow: Slideshow = {
        title: "Test",
        slides: [
          {
            order: 1,
            transition: "none",
            children: [
              {
                type: "div",
                order: 3,
                // No narration on div
                children: [
                  {
                    type: "h3",
                    order: 1,
                    narration: "There are two main types of components",
                    children: [{ type: "text", content: "Two Types", location: { line: 1, column: 1 } }],
                    location: { line: 1, column: 1 },
                  },
                  {
                    type: "ol",
                    order: 2,
                    // No narration on ol
                    children: [
                      {
                        type: "li",
                        order: 1,
                        narration: "Function components are simple",
                        children: [
                          { type: "text", content: "Function Components: ", location: { line: 2, column: 1 } },
                          {
                            type: "strong",
                            // No order attribute on strong
                            children: [{ type: "text", content: "JS functions", location: { line: 2, column: 2 } }],
                            location: { line: 2, column: 2 },
                          },
                          {
                            type: "pre",
                            order: 1,
                            narration: "Here is an example",
                            delay: 300,
                            children: [{ type: "text", content: "function Welcome() {}", location: { line: 3, column: 1 } }],
                            location: { line: 3, column: 1 },
                          },
                        ],
                        location: { line: 2, column: 1 },
                      },
                      {
                        type: "li",
                        order: 2,
                        narration: "Class components extend React",
                        delay: 400,
                        children: [
                          { type: "text", content: "Class Components: ", location: { line: 4, column: 1 } },
                          {
                            type: "strong",
                            // No order attribute on strong
                            children: [{ type: "text", content: "ES6 classes", location: { line: 4, column: 2 } }],
                            location: { line: 4, column: 2 },
                          },
                          {
                            type: "pre",
                            order: 1,
                            narration: "Here is the class version",
                            delay: 300,
                            children: [{ type: "text", content: "class Welcome {}", location: { line: 5, column: 1 } }],
                            location: { line: 5, column: 1 },
                          },
                        ],
                        location: { line: 4, column: 1 },
                      },
                    ],
                    location: { line: 2, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      // Should have 5 narration items:
      // 1. <h3>: "There are two main types of components"
      // 2. First <li>: "Function components are simple"
      // 3. First <pre>: "Here is an example" (delay 300)
      // 4. Second <li>: "Class components extend React" (delay 400)
      // 5. Second <pre>: "Here is the class version" (delay 300)
      expect(queue).toHaveLength(5);
      expect(queue[0].text).toBe("There are two main types of components");
      expect(queue[0].delay).toBe(0);
      expect(queue[1].text).toBe("Function components are simple");
      expect(queue[1].delay).toBe(0);
      expect(queue[2].text).toBe("Here is an example");
      expect(queue[2].delay).toBe(300);
      expect(queue[3].text).toBe("Class components extend React");
      expect(queue[3].delay).toBe(400);
      expect(queue[4].text).toBe("Here is the class version");
      expect(queue[4].delay).toBe(300);
    });
  });

  describe("Complex example from spec", () => {
    it("correctly processes the example from SLIDESHOW_FORMAT_SPEC.md", () => {
      // This is the example from the spec showing nested list traversal
      const slideshow: Slideshow = {
        title: "Introduction to React",
        slides: [
          {
            order: 2,
            transition: "slide-left",
            id: "what-is-react",
            children: [
              {
                type: "h1",
                order: 1,
                narration: "Let us start by understanding what React actually is",
                children: [{ type: "text", content: "What is React?", location: { line: 1, column: 1 } }],
                location: { line: 1, column: 1 },
              },
              {
                type: "ul",
                order: 2,
                narration: "React has three main characteristics",
                children: [
                  {
                    type: "li",
                    order: 1,
                    narration: "First it is a JavaScript library not a full framework",
                    children: [{ type: "text", content: "A JavaScript library", location: { line: 2, column: 1 } }],
                    location: { line: 2, column: 1 },
                  },
                  {
                    type: "li",
                    order: 2,
                    narration: "Second it uses a component based architecture",
                    children: [
                      { type: "text", content: "Component-based", location: { line: 3, column: 1 } },
                      {
                        type: "ul",
                        order: 1,
                        children: [
                          {
                            type: "li",
                            order: 1,
                            narration: "This means you build reusable UI pieces",
                            delay: 200,
                            children: [{ type: "text", content: "Reusable components", location: { line: 4, column: 1 } }],
                            location: { line: 4, column: 1 },
                          },
                          {
                            type: "li",
                            order: 2,
                            narration: "Each component can manage its own state",
                            children: [{ type: "text", content: "Self-contained state", location: { line: 5, column: 1 } }],
                            location: { line: 5, column: 1 },
                          },
                        ],
                        location: { line: 3, column: 1 },
                      },
                    ],
                    location: { line: 3, column: 1 },
                  },
                  {
                    type: "li",
                    order: 3,
                    narration: "Third it uses a virtual DOM for efficient updates",
                    delay: 500,
                    children: [{ type: "text", content: "Virtual DOM", location: { line: 6, column: 1 } }],
                    location: { line: 6, column: 1 },
                  },
                ],
                location: { line: 1, column: 1 },
              },
            ],
            location: { line: 1, column: 1 },
          },
        ],
        location: { line: 1, column: 1 },
      };

      const queue = buildNarrationQueue(slideshow);

      // Expected narration order from spec:
      // 1. "Let us start by understanding what React actually is"
      // 2. "React has three main characteristics"
      // 3. "First it is a JavaScript library not a full framework"
      // 4. "Second it uses a component based architecture"
      // 5. "This means you build reusable UI pieces" → pause 200ms
      // 6. "Each component can manage its own state"
      // 7. "Third it uses a virtual DOM for efficient updates" → pause 500ms

      expect(queue).toHaveLength(7);

      expect(queue[0].text).toBe("Let us start by understanding what React actually is");
      expect(queue[0].delay).toBe(0);

      expect(queue[1].text).toBe("React has three main characteristics");
      expect(queue[1].delay).toBe(0);

      expect(queue[2].text).toBe("First it is a JavaScript library not a full framework");
      expect(queue[2].delay).toBe(0);

      expect(queue[3].text).toBe("Second it uses a component based architecture");
      expect(queue[3].delay).toBe(0);

      expect(queue[4].text).toBe("This means you build reusable UI pieces");
      expect(queue[4].delay).toBe(200);

      expect(queue[5].text).toBe("Each component can manage its own state");
      expect(queue[5].delay).toBe(0);

      expect(queue[6].text).toBe("Third it uses a virtual DOM for efficient updates");
      expect(queue[6].delay).toBe(500);
    });
  });
});
