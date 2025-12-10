import { describe, it, expect } from "vitest";
import { parseSld } from "./parser";

/**
 * CONSOLIDATED PARSER TEST SUITE
 *
 * This file consolidates parser.test.ts, parser.integration.test.ts, and parser.verification.test.ts
 * Redundant tests have been removed while maintaining 100% coverage of all unique test cases.
 */

describe("parseSld - Valid Documents", () => {
  it("parses a minimal valid document", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>Hello</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.title).toBe("Test");
      expect(result.slideshow.slides).toHaveLength(1);
      expect(result.slideshow.slides[0].order).toBe(1);
    }
  });

  it("parses document with all slideshow attributes", () => {
    const content = `
      <slideshow title="Test" author="John" version="1.0">
        <slide order="1">
          <p>Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.title).toBe("Test");
      expect(result.slideshow.author).toBe("John");
      expect(result.slideshow.version).toBe("1.0");
    }
  });

  it("parses metadata element with all fields", () => {
    const content = `
      <slideshow title="Test">
        <metadata>
          <description>A test presentation</description>
          <tags>test, demo</tags>
          <created>2025-01-15</created>
          <modified>2025-01-20</modified>
        </metadata>
        <slide order="1">
          <p>Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta).toBeDefined();
      expect(result.slideshow.meta?.description).toBe("A test presentation");
      expect(result.slideshow.meta?.tags).toEqual(["test", "demo"]);
      expect(result.slideshow.meta?.created).toBe("2025-01-15");
      expect(result.slideshow.meta?.modified).toBe("2025-01-20");
    }
  });

  it("parses metadata with only some fields", () => {
    const content = `
      <slideshow title="Test">
        <metadata>
          <description>Only description</description>
        </metadata>
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta?.description).toBe("Only description");
      expect(result.slideshow.meta?.tags).toBeUndefined();
    }
  });

  it("parses metadata with tags containing whitespace", () => {
    const content = `
      <slideshow title="Test">
        <metadata>
          <tags>tag1,  tag2  ,tag3,   tag4   </tags>
        </metadata>
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta?.tags).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    }
  });

  it("parses single tag without comma", () => {
    const content = `
      <slideshow title="Test">
        <metadata>
          <tags>single-tag</tags>
        </metadata>
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta?.tags).toEqual(["single-tag"]);
    }
  });

  it("parses multiple slides and sorts by order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="3"><p>Third</p></slide>
        <slide order="1"><p>First</p></slide>
        <slide order="2"><p>Second</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.slides).toHaveLength(3);
      expect(result.slideshow.slides[0].order).toBe(1);
      expect(result.slideshow.slides[1].order).toBe(2);
      expect(result.slideshow.slides[2].order).toBe(3);
    }
  });

  it("parses slide transitions", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" transition="fade"><p>A</p></slide>
        <slide order="2" transition="slide-left"><p>B</p></slide>
        <slide order="3"><p>C</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.slides[0].transition).toBe("fade");
      expect(result.slideshow.slides[1].transition).toBe("slide-left");
      expect(result.slideshow.slides[2].transition).toBe("none");
    }
  });

  it("accepts all valid transition types", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" transition="none"><p>1</p></slide>
        <slide order="2" transition="fade"><p>2</p></slide>
        <slide order="3" transition="slide-left"><p>3</p></slide>
        <slide order="4" transition="slide-right"><p>4</p></slide>
        <slide order="5" transition="slide-up"><p>5</p></slide>
        <slide order="6" transition="slide-down"><p>6</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("parses narration attributes with order and delay", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <h1 order="1" narration="Welcome" delay="500">Hello</h1>
          <p order="2" narration="This is content">Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const children = result.slideshow.slides[0].children;
      expect(children).toHaveLength(2);

      const h1 = children[0];
      if (h1.type !== "text") {
        expect(h1.narration).toBe("Welcome");
        expect(h1.delay).toBe(500);
        expect(h1.order).toBe(1);
      }

      const p = children[1];
      if (p.type !== "text") {
        expect(p.narration).toBe("This is content");
        expect(p.order).toBe(2);
      }
    }
  });

  it("allows empty narration string", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1" narration="" delay="500">Silent pause</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const p = result.slideshow.slides[0].children[0];
      if (p.type !== "text") {
        expect(p.narration).toBe("");
        expect(p.delay).toBe(500);
      }
    }
  });

  it("parses nested elements with narration", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ul order="1" narration="List intro">
            <li order="1" narration="First item">One</li>
            <li order="2" narration="Second item">Two</li>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const ul = result.slideshow.slides[0].children[0];
      if (ul.type !== "text" && ul.type === "ul") {
        expect(ul.narration).toBe("List intro");
        expect(ul.children).toHaveLength(2);
      }
    }
  });

  it("parses img elements with all attributes", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <img src="image.png" alt="An image" width="100" height="100" />
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const img = result.slideshow.slides[0].children[0];
      if (img.type === "img") {
        expect(img.src).toBe("image.png");
        expect(img.alt).toBe("An image");
        expect(img.width).toBe("100");
        expect(img.height).toBe("100");
      }
    }
  });

  it("parses slide and element ids", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" id="intro">
          <h1 id="title">Hello</h1>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.slides[0].id).toBe("intro");
      const h1 = result.slideshow.slides[0].children[0];
      if (h1.type !== "text") {
        expect(h1.id).toBe("title");
      }
    }
  });

  it("parses all allowed HTML elements", () => {
    const content = `
      <slideshow title="All Elements Test">
        <slide order="1">
          <div><p>div and p</p></div>
          <h1>h1</h1>
          <h2>h2</h2>
          <h3>h3</h3>
          <h4>h4</h4>
          <h5>h5</h5>
          <h6>h6</h6>
          <ul><li>ul and li</li></ul>
          <ol><li>ol and li</li></ol>
          <blockquote>blockquote</blockquote>
          <pre>pre tag</pre>
          <p><span>span</span></p>
          <p><strong>strong</strong></p>
          <p><em>em</em></p>
          <p><code>code</code></p>
          <img src="test.png" alt="img element" />
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("handles mixed inline and block elements in paragraphs", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>Text before <strong>bold text</strong> and after</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("handles nested inline elements", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>
            <span>
              <strong>
                <em>Deeply nested inline</em>
              </strong>
            </span>
          </p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("allows order attribute without narration", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1">No narration, just order</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("allows delay with order but without narration", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1" delay="500">Just delay and order</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("parses complex real-world example from spec", () => {
    const content = `
      <slideshow title="Introduction to React" author="Jane Smith" version="1.0">
        <metadata>
          <description>Learn the basics of React in 10 minutes</description>
          <tags>react, javascript, tutorial</tags>
          <created>2025-01-15</created>
        </metadata>

        <slide order="1" transition="fade" id="title-slide">
          <h1 order="1" narration="Welcome to Introduction to React">
            Introduction to React
          </h1>
          <p order="2" narration="In this presentation we will cover the fundamentals" delay="300">
            Learn the basics in 10 minutes
          </p>
        </slide>

        <slide order="2" transition="slide-left" id="what-is-react">
          <h1 order="1" narration="Let us start by understanding what React actually is">
            What is React?
          </h1>
          <ul order="2" narration="React has three main characteristics">
            <li order="1" narration="First it is a JavaScript library not a full framework">
              A JavaScript library
            </li>
            <li order="2" narration="Second it uses a component based architecture">
              Component-based
              <ul order="1">
                <li order="1" narration="This means you build reusable UI pieces" delay="200">
                  Reusable components
                </li>
                <li order="2" narration="Each component can manage its own state">
                  Self-contained state
                </li>
              </ul>
            </li>
            <li order="3" narration="Third it uses a virtual DOM for efficient updates" delay="500">
              Virtual DOM
            </li>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const slideshow = result.slideshow;
      expect(slideshow.title).toBe("Introduction to React");
      expect(slideshow.author).toBe("Jane Smith");
      expect(slideshow.slides).toHaveLength(2);
      expect(slideshow.meta?.tags).toEqual(["react", "javascript", "tutorial"]);
    }
  });
});

describe("parseSld - Whitespace Handling", () => {
  it("trims and collapses whitespace in text", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>   Hello    World   </p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(true);
    if (result.success) {
      const p = result.slideshow.slides[0].children[0];
      if (p.type === "p") {
        const text = p.children[0];
        if (text.type === "text") {
          expect(text.content).toBe("Hello World");
        }
      }
    }
  });

  it("handles multiple consecutive spaces between words", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>Multiple     spaces     between     words</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const p = result.slideshow.slides[0].children[0];
      if (p.type === "p") {
        const text = p.children[0];
        if (text.type === "text") {
          expect(text.content).toBe("Multiple spaces between words");
        }
      }
    }
  });

  it("handles tabs and newlines in text", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p>Text
          with
          newlines		and	tabs</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const p = result.slideshow.slides[0].children[0];
      if (p.type === "p") {
        const text = p.children[0];
        if (text.type === "text") {
          expect(text.content).toBe("Text with newlines and tabs");
        }
      }
    }
  });

  it("preserves whitespace in pre elements", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <pre>  function test() {
    return true;
  }</pre>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const pre = result.slideshow.slides[0].children[0];
      if (pre.type === "pre") {
        const text = pre.children[0];
        if (text.type === "text") {
          expect(text.content).toContain("  function test()");
          expect(text.content).toContain("    return true;");
        }
      }
    }
  });
});

describe("parseSld - Special Characters", () => {
  it("handles HTML entities in text content", () => {
    const content = `
      <slideshow title="Test &amp; Demo">
        <slide order="1">
          <p>&lt;div&gt; &amp; &quot;quotes&quot; &gt;</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.title).toBe("Test & Demo");
      const p = result.slideshow.slides[0].children[0];
      if (p.type === "p") {
        const text = p.children[0];
        if (text.type === "text") {
          expect(text.content).toBe('<div> & "quotes" >');
        }
      }
    }
  });

  it("handles HTML entities in narration attribute", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1" narration="Less than &lt; and greater than &gt;">Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const p = result.slideshow.slides[0].children[0];
      if (p.type !== "text") {
        expect(p.narration).toBe("Less than < and greater than >");
      }
    }
  });

  it("handles unicode characters", () => {
    const content = `
      <slideshow title="Unicode Test 🎨">
        <slide order="1">
          <p order="1" narration="こんにちは世界">Hello 世界 🌍</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.title).toBe("Unicode Test 🎨");
    }
  });
});

describe("parseSld - Boundary Conditions", () => {
  describe("Large values", () => {
    it("handles very large order numbers", () => {
      const content = `
        <slideshow title="Test">
          <slide order="999999999">
            <p order="2147483647" narration="Max int">Large order</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.slideshow.slides[0].order).toBe(999999999);
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.order).toBe(2147483647);
        }
      }
    });

    it("accepts MAX_SAFE_INTEGER for slide order", () => {
      const MAX_SAFE = Number.MAX_SAFE_INTEGER;
      const content = `
        <slideshow title="Test">
          <slide order="${MAX_SAFE}">
            <p>Test</p>
          </slide>
        </slideshow>
      `;
      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.slideshow.slides[0].order).toBe(MAX_SAFE);
      }
    });

    it("accepts MAX_SAFE_INTEGER for content order", () => {
      const MAX_SAFE = Number.MAX_SAFE_INTEGER;
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="${MAX_SAFE}" narration="test">Test</p>
          </slide>
        </slideshow>
      `;
      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.order).toBe(MAX_SAFE);
        }
      }
    });

    it("accepts MAX_SAFE_INTEGER for delay", () => {
      const MAX_SAFE = Number.MAX_SAFE_INTEGER;
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="1" narration="test" delay="${MAX_SAFE}">Test</p>
          </slide>
        </slideshow>
      `;
      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.delay).toBe(MAX_SAFE);
        }
      }
    });

    it("handles very long narration text", () => {
      const longText = "A".repeat(10000);
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="1" narration="${longText}">Content</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.narration?.length).toBe(10000);
        }
      }
    });

    it("handles many slides (15 slides)", () => {
      let content = `<slideshow title="Many Slides">`;
      for (let i = 1; i <= 15; i++) {
        content += `<slide order="${i}"><p>Slide ${i}</p></slide>`;
      }
      content += `</slideshow>`;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.slideshow.slides).toHaveLength(15);
      }
    });

    it("handles many sibling elements (20 items)", () => {
      let content = `<slideshow title="Test"><slide order="1"><ul order="1">`;
      for (let i = 1; i <= 20; i++) {
        content += `<li order="${i}" narration="Item ${i}">Item ${i}</li>`;
      }
      content += `</ul></slide></slideshow>`;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const ul = result.slideshow.slides[0].children[0];
        if (ul.type === "ul") {
          expect(ul.children).toHaveLength(20);
        }
      }
    });
  });

  describe("Zero and minimal values", () => {
    it("allows delay of zero explicitly", () => {
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="1" narration="No delay" delay="0">Content</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.delay).toBe(0);
        }
      }
    });

    it("defaults delay to 0 when not specified", () => {
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="1" narration="Default delay">Content</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        const p = result.slideshow.slides[0].children[0];
        if (p.type !== "text") {
          expect(p.delay).toBe(0);
        }
      }
    });

    it("handles single character content", () => {
      const content = `
        <slideshow title="T">
          <slide order="1">
            <p>A</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
    });
  });

  describe("Non-sequential order values", () => {
    it("handles large gaps in order values", () => {
      const content = `
        <slideshow title="Test">
          <slide order="1"><p>First</p></slide>
          <slide order="100"><p>Second</p></slide>
          <slide order="1000"><p>Third</p></slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.slideshow.slides[0].order).toBe(1);
        expect(result.slideshow.slides[1].order).toBe(100);
        expect(result.slideshow.slides[2].order).toBe(1000);
      }
    });

    it("handles reverse order in source", () => {
      const content = `
        <slideshow title="Test">
          <slide order="10"><p>Third</p></slide>
          <slide order="5"><p>Second</p></slide>
          <slide order="1"><p>First</p></slide>
        </slideshow>
      `;

      const result = parseSld(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.slideshow.slides[0].order).toBe(1);
        expect(result.slideshow.slides[1].order).toBe(5);
        expect(result.slideshow.slides[2].order).toBe(10);
      }
    });
  });
});

describe("parseSld - Deeply Nested Structures", () => {
  it("parses deeply nested structures (6 levels)", () => {
    const content = `
      <slideshow title="Nested Test">
        <slide order="1">
          <div order="1" narration="Level 1">
            <div order="1" narration="Level 2">
              <ul order="1" narration="Level 3">
                <li order="1" narration="Level 4">
                  <div order="1" narration="Level 5">
                    <span order="1" narration="Level 6" delay="100">
                      Deep nesting works!
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("handles nested lists within lists within lists", () => {
    const content = `
      <slideshow title="Deep Lists">
        <slide order="1">
          <ul order="1" narration="Top level list">
            <li order="1" narration="Item 1">
              First item
              <ul order="1" narration="Second level list">
                <li order="1" narration="Item 1.1">
                  Nested item
                  <ul order="1" narration="Third level list">
                    <li order="1" narration="Item 1.1.1" delay="250">Deep item</li>
                    <li order="2" narration="Item 1.1.2">Another deep item</li>
                  </ul>
                </li>
                <li order="2" narration="Item 1.2">Another nested item</li>
              </ul>
            </li>
            <li order="2" narration="Item 2">Second item</li>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });

  it("handles mixed ol and ul nesting", () => {
    const content = `
      <slideshow title="Mixed Lists">
        <slide order="1">
          <ol order="1" narration="Ordered list">
            <li order="1" narration="First step">
              Step 1
              <ul order="1" narration="Unordered sub-items">
                <li order="1" narration="Option A">A</li>
                <li order="2" narration="Option B">B</li>
              </ul>
            </li>
            <li order="2" narration="Second step">Step 2</li>
          </ol>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });
});

describe("parseSld - E001: Missing slideshow root", () => {
  it("fails when no slideshow element exists", () => {
    const content = `<div><p>Hello</p></div>`;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E001");
    }
  });

  it("fails on empty document", () => {
    const content = ``;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E001");
    }
  });
});

describe("parseSld - E002: Missing title attribute", () => {
  it("fails when slideshow has no title", () => {
    const content = `
      <slideshow>
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E002");
    }
  });
});

describe("parseSld - E003: Empty title", () => {
  it("fails when title is empty string", () => {
    const content = `
      <slideshow title="">
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E003");
    }
  });

  it("fails when title is whitespace only", () => {
    const content = `
      <slideshow title="   ">
        <slide order="1"><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E003");
    }
  });
});

describe("parseSld - E004: No slides", () => {
  it("fails when slideshow has no slides", () => {
    const content = `
      <slideshow title="Test">
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E004");
    }
  });

  it("fails when slideshow only has metadata", () => {
    const content = `
      <slideshow title="Test">
        <metadata><description>Test</description></metadata>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E004");
    }
  });
});

describe("parseSld - E005: Slide missing order", () => {
  it("fails when slide has no order attribute", () => {
    const content = `
      <slideshow title="Test">
        <slide><p>Content</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E005");
    }
  });
});

describe("parseSld - E006: Slide order not positive integer", () => {
  describe("Invalid formats", () => {
    it.each([
      ["0", "zero"],
      ["-1", "negative"],
      ["abc", "not a number"],
      ["1.5", "float"],
      ["01", "leading zero"],
      ["007", "multiple leading zeros"],
      ["00", "all zeros"],
      [" 1", "leading space"],
      ["1 ", "trailing space"],
      ["+1", "plus sign"],
      ["", "empty string"],
    ])("fails when order is %s (%s)", (orderValue, description) => {
      const content = `
        <slideshow title="Test">
          <slide order="${orderValue}"><p>Content</p></slide>
        </slideshow>
      `;

      const result = parseSld(content);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("E006");
      }
    });
  });

  it("rejects slide order beyond MAX_SAFE_INTEGER", () => {
    const BEYOND_MAX = "9007199254740992";
    const content = `
      <slideshow title="Test">
        <slide order="${BEYOND_MAX}">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E006");
    }
  });

  it("rejects extremely large slide order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="99999999999999999999">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E006");
    }
  });
});

describe("parseSld - E007: Duplicate slide order", () => {
  it("fails when two slides have same order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1"><p>A</p></slide>
        <slide order="1"><p>B</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.code === "E007")).toBe(true);
    }
  });
});

describe("parseSld - E008: Narration without order", () => {
  it("fails when element has narration but no order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p narration="Hello">Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E008");
    }
  });
});

describe("parseSld - E009: Descendant has narration but parent has no order", () => {
  it("fails when nested element has narration but parent lacks order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ul>
            <li order="1" narration="Item">Content</li>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E009");
    }
  });

  it("succeeds when parent has order and child has narration", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <div order="1">
            <p order="1" narration="Child">Text</p>
          </div>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });
});

describe("parseSld - E010: Duplicate order among siblings", () => {
  it("fails when siblings have same order", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1" narration="A">A</p>
          <p order="1" narration="B">B</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.code === "E010")).toBe(true);
    }
  });
});

describe("parseSld - E011: Content element order not positive integer", () => {
  describe("Invalid formats", () => {
    it.each([
      ["0", "zero"],
      ["-1", "negative"],
      ["01", "leading zero"],
      ["007", "multiple leading zeros"],
      ["+5", "plus sign"],
    ])("fails when content order is %s (%s)", (orderValue, description) => {
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="${orderValue}" narration="Hello">Content</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("E011");
      }
    });
  });

  it("rejects content order beyond MAX_SAFE_INTEGER", () => {
    const BEYOND_MAX = "9007199254740992";
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="${BEYOND_MAX}" narration="test">Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E011");
    }
  });
});

describe("parseSld - E012: Invalid delay", () => {
  describe("Invalid delay formats", () => {
    it.each([
      ["-100", "negative"],
      ["abc", "not a number"],
      ["1.5", "decimal"],
      ["0.5", "decimal less than 1"],
      ["100.0", "decimal with .0"],
      ["1e3", "scientific notation"],
      ["-1.5", "negative decimal"],
      ["007", "leading zeros"],
      ["00", "all zeros"],
      [" 100 ", "with spaces"],
      ["100ms", "with units"],
    ])("fails when delay is %s (%s)", (delayValue, description) => {
      const content = `
        <slideshow title="Test">
          <slide order="1">
            <p order="1" narration="Hello" delay="${delayValue}">Content</p>
          </slide>
        </slideshow>
      `;

      const result = parseSld(content);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("E012");
      }
    });
  });

  it("rejects delay beyond MAX_SAFE_INTEGER", () => {
    const BEYOND_MAX = "9007199254740992";
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p order="1" narration="test" delay="${BEYOND_MAX}">Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E012");
    }
  });
});

describe("parseSld - E013: Duplicate id", () => {
  it("fails when two slides have same id", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" id="same"><p>A</p></slide>
        <slide order="2" id="same"><p>B</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.code === "E013")).toBe(true);
    }
  });

  it("fails when elements have same id", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p id="dup">A</p>
          <p id="dup">B</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.code === "E013")).toBe(true);
    }
  });

  it("fails when duplicate ID exists across different slides", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <p id="dup">A</p>
        </slide>
        <slide order="2">
          <p id="dup">B</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.code === "E013")).toBe(true);
    }
  });

  it("fails when duplicate ID between slide and element", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" id="shared">
          <p id="shared">Text</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some(e => e.code === "E013")).toBe(true);
    }
  });
});

describe("parseSld - E014: Unknown element", () => {
  it("fails on unknown element", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <custom>Content</custom>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E014");
      expect(result.errors[0].message).toContain("custom");
    }
  });
});

describe("parseSld - E015: Invalid child element", () => {
  it("fails when ul contains non-li element", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ul>
            <p>Not allowed</p>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E015");
    }
  });

  it("fails when ol contains non-li element", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ol>
            <div>Not allowed</div>
          </ol>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E015");
    }
  });

  it("fails when code contains block elements", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <code><p>Not allowed</p></code>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E015");
    }
  });

  it("fails when pre contains elements", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <pre><span>Not allowed</span></pre>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E015");
    }
  });

  it("allows block and inline elements in li", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ul>
            <li>
              <p>Paragraph in li</p>
              <div>Div in li</div>
              <strong>Strong in li</strong>
            </li>
          </ul>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(true);
  });
});

describe("parseSld - E016: Metadata after slide", () => {
  it("fails when metadata appears after slide", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1"><p>Content</p></slide>
        <metadata><description>Late metadata</description></metadata>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.some((e) => e.code === "E016")).toBe(true);
    }
  });
});

describe("parseSld - E017: img missing src", () => {
  it("fails when img has no src", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <img alt="An image" />
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E017");
    }
  });
});

describe("parseSld - E018: img missing alt", () => {
  it("fails when img has no alt", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <img src="image.png" />
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E018");
    }
  });
});

describe("parseSld - E019: Invalid transition", () => {
  it("fails on invalid transition value", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" transition="invalid">
          <p>Content</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E019");
      expect(result.errors[0].message).toContain("invalid");
    }
  });

  it("rejects zoom transition", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" transition="zoom"><p>Invalid</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E019");
    }
  });
});

describe("parseSld - E020: Unknown elements in metadata", () => {
  it.each([
    ["author", "John Doe"],
    ["title", "My Title"],
    ["version", "1.0"],
    ["foo", "bar"],
    ["p", "This is a description"],
  ])("rejects unknown element '%s' in metadata", (elementName, content) => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <${elementName}>${content}</${elementName}>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E020");
      expect(result.errors[0].message).toBe(`Unknown element in metadata: '${elementName}'`);
    }
  });

  it("accepts all valid metadata elements", () => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <description>A description</description>
          <tags>tag1, tag2</tags>
          <created>2025-01-15</created>
          <modified>2025-01-20</modified>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta?.description).toBe("A description");
      expect(result.slideshow.meta?.tags).toEqual(["tag1", "tag2"]);
      expect(result.slideshow.meta?.created).toBe("2025-01-15");
      expect(result.slideshow.meta?.modified).toBe("2025-01-20");
    }
  });
});

describe("parseSld - E021: Duplicate metadata elements", () => {
  it.each([
    ["description", "First description", "Second description"],
    ["tags", "tag1, tag2", "tag3, tag4"],
    ["created", "2025-01-15", "2025-01-20"],
    ["modified", "2025-01-15", "2025-01-20"],
  ])("rejects duplicate '%s' elements", (elementName, first, second) => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <${elementName}>${first}</${elementName}>
          <${elementName}>${second}</${elementName}>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("E021");
      expect(result.errors[0].message).toBe(`Duplicate metadata element: '${elementName}'`);
    }
  });

  it("rejects triple duplicate elements", () => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <description>First</description>
          <description>Second</description>
          <description>Third</description>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const duplicateErrors = result.errors.filter(e => e.code === "E021");
      expect(duplicateErrors.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("parseSld - E022: Invalid date format", () => {
  describe("created field validation", () => {
    it.each([
      ["Jan 15, 2025", "text date"],
      ["2025/01/15", "slashes"],
      ["15-01-2025", "DD-MM-YYYY"],
      ["2025-1-15", "missing zero in month"],
      ["2025-01-5", "missing zero in day"],
      ["2025-01-15T10:30:00Z", "timestamp"],
      ["2025", "year only"],
    ])("rejects created with invalid format: %s (%s)", (dateValue, description) => {
      const input = `
        <slideshow title="Test">
          <metadata>
            <created>${dateValue}</created>
          </metadata>
          <slide order="1">
            <p>Test</p>
          </slide>
        </slideshow>
      `;
      const result = parseSld(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("E022");
        expect(result.errors[0].message).toBe("Invalid date format in 'created'. Expected YYYY-MM-DD");
      }
    });
  });

  describe("modified field validation", () => {
    it("rejects modified with invalid format", () => {
      const input = `
        <slideshow title="Test">
          <metadata>
            <modified>2025-1-15</modified>
          </metadata>
          <slide order="1">
            <p>Test</p>
          </slide>
        </slideshow>
      `;
      const result = parseSld(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe("E022");
        expect(result.errors[0].message).toBe("Invalid date format in 'modified'. Expected YYYY-MM-DD");
      }
    });
  });

  it("accepts valid date format YYYY-MM-DD", () => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <created>2025-01-15</created>
          <modified>2025-12-31</modified>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.slideshow.meta?.created).toBe("2025-01-15");
      expect(result.slideshow.meta?.modified).toBe("2025-12-31");
    }
  });

  it("accepts dates at boundaries", () => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <created>2000-01-01</created>
          <modified>9999-12-31</modified>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(true);
  });
});

describe("parseSld - Multiple Errors", () => {
  it("detects multiple errors in same document", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1" id="dup">
          <p narration="No order">Missing order</p>
        </slide>
        <slide order="1" id="dup">
          <p narration="Also no order">Missing order</p>
        </slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });

  it("detects errors at different nesting levels", () => {
    const content = `
      <slideshow title="Test">
        <slide order="1">
          <ul>
            <li order="1" narration="Item">
              <p narration="No order">Deep error</p>
            </li>
          </ul>
        </slide>
        <slide order="invalid"><p>Surface error</p></slide>
      </slideshow>
    `;

    const result = parseSld(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });

  it("handles multiple errors in metadata", () => {
    const input = `
      <slideshow title="Test">
        <metadata>
          <description>Valid</description>
          <unknown>Invalid</unknown>
          <created>Invalid date</created>
          <created>2025-01-15</created>
        </metadata>
        <slide order="1">
          <p>Test</p>
        </slide>
      </slideshow>
    `;
    const result = parseSld(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    }
  });
});
