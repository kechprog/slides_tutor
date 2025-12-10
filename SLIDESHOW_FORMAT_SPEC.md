# Slideshow Format Specification

Version: 1.0.0

## Overview

A single-file format for defining narrated slideshow presentations. The format uses an HTML subset with custom attributes to define slide content, narration text, and reading order.

**File Extension:** `.sld`

**MIME Type:** `application/x-slideshow+xml`

**Encoding:** UTF-8 (required)

---

## Document Structure

A valid `.sld` file MUST have the following structure:

```
<slideshow>
  [<metadata>]
  <slide>+
</slideshow>
```

Where:
- `[ ]` denotes optional (zero or one)
- `+` denotes required (one or more)

---

## Elements

### `<slideshow>`

Root element. A document MUST have exactly one `<slideshow>` element at the root.

**Attributes:**

| Attribute | Required | Type   | Description |
|-----------|----------|--------|-------------|
| `title`   | Yes      | String | Presentation title. MUST NOT be empty. |
| `author`  | No       | String | Author name |
| `version` | No       | String | Content version identifier |

**Children:** Zero or one `<metadata>`, followed by one or more `<slide>` elements.

**Constraints:**
- If `<metadata>` is present, it MUST appear before any `<slide>` elements.

---

### `<metadata>`

Optional metadata container. (Note: We use `<metadata>` instead of `<meta>` to avoid conflict with HTML's void `<meta>` element.)

**Attributes:** None

**Children:** Zero or one of each:
- `<description>` - Plain text description
- `<tags>` - Comma-separated topic tags
- `<created>` - ISO 8601 date (YYYY-MM-DD)
- `<modified>` - ISO 8601 date (YYYY-MM-DD)

All meta children contain plain text only (no nested elements).

---

### `<slide>`

Container for a single slide.

**Attributes:**

| Attribute    | Required | Type            | Default | Description |
|--------------|----------|-----------------|---------|-------------|
| `order`      | Yes      | Positive Integer | -      | Slide order within slideshow |
| `transition` | No       | TransitionType  | `none`  | Entry transition effect |
| `id`         | No       | String          | -       | Unique identifier |

**Children:** One or more content elements (see [Content Elements](#content-elements)).

**Constraints:**
- `order` MUST be a positive integer (≥ 1).
- `order` values among sibling `<slide>` elements MUST be unique.
- If `id` is provided, it MUST be unique within the document.
- Slides are presented in ascending `order` value.

---

### Content Elements

The following elements are permitted within `<slide>` and within other content elements where noted.

#### Block Elements

| Element      | Permitted Children |
|--------------|--------------------|
| `<div>`      | Block elements, Inline elements, Text |
| `<p>`        | Inline elements, Text |
| `<h1>`...`<h6>` | Inline elements, Text |
| `<ul>`       | `<li>` only |
| `<ol>`       | `<li>` only |
| `<li>`       | Block elements, Inline elements, Text |
| `<blockquote>` | Block elements, Inline elements, Text |
| `<pre>`      | Text only (whitespace preserved) |

#### Inline Elements

| Element   | Permitted Children |
|-----------|--------------------|
| `<span>`  | Inline elements, Text |
| `<strong>`| Inline elements, Text |
| `<em>`    | Inline elements, Text |
| `<code>`  | Text only |

#### Void Elements

| Element | Required Attributes | Optional Attributes |
|---------|---------------------|---------------------|
| `<img>` | `src`, `alt`        | `width`, `height`   |

---

## Narration Attributes

Any content element MAY have the following attributes:

| Attribute   | Type             | Default | Description |
|-------------|------------------|---------|-------------|
| `order`     | Positive Integer | -       | Narration order among siblings |
| `narration` | String           | -       | TTS text content |
| `delay`     | Non-negative Integer | `0` | Pause in milliseconds after narration |

**Constraints:**

1. If an element has a `narration` attribute, it MUST have an `order` attribute.

2. If an element has a descendant with a `narration` attribute, the element MUST have an `order` attribute.

3. `order` values among sibling elements (that have `order`) MUST be unique.

4. `order` MUST be a positive integer (≥ 1).

5. `delay` MUST be a non-negative integer (≥ 0).

6. `narration` MAY be an empty string (results in no speech, but delay still applies).

---

## Ordering and Traversal

### Order Scope

The `order` attribute defines position **within the parent element only**. Order values are not global.

### Non-Sequential Orders

Order values need not be sequential. Elements are sorted by ascending numeric value.

Example: Elements with `order="1"`, `order="5"`, `order="10"` are processed in that sequence.

### Traversal Algorithm

Given an element E with children:

```
function traverse(E):
    children_with_order = [c for c in E.children if c.has_attribute("order")]
    sorted_children = sort(children_with_order, key=c.order, ascending=true)

    for child in sorted_children:
        if child.has_attribute("narration"):
            speak(child.narration)
            if child.has_attribute("delay"):
                wait(child.delay)
        traverse(child)
```

### Highlighting

During narration of an element, that element SHOULD be visually highlighted. The implementation defines the highlight style.

---

## Validation Rules

A document is **invalid** if any of the following are true:

| Rule ID | Condition | Error |
|---------|-----------|-------|
| E001 | Missing `<slideshow>` root element | "Document must have a <slideshow> root element" |
| E002 | `<slideshow>` missing `title` attribute | "slideshow element requires 'title' attribute" |
| E003 | `<slideshow>` has empty `title` | "slideshow 'title' must not be empty" |
| E004 | No `<slide>` elements present | "slideshow must contain at least one slide" |
| E005 | `<slide>` missing `order` attribute | "slide element requires 'order' attribute" |
| E006 | `<slide>` `order` is not a positive integer | "slide 'order' must be a positive integer" |
| E007 | Duplicate `order` among sibling `<slide>` elements | "Duplicate slide order: {order}" |
| E008 | Element has `narration` without `order` | "Element with 'narration' requires 'order' attribute at line {line}" |
| E009 | Element has descendant with `narration` but no `order` | "Element at line {line} requires 'order' because descendant has 'narration'" |
| E010 | Duplicate `order` among sibling narrated elements | "Duplicate order '{order}' among siblings at line {line}" |
| E011 | `order` is not a positive integer | "'order' must be a positive integer at line {line}" |
| E012 | `delay` is not a non-negative integer | "'delay' must be a non-negative integer at line {line}" |
| E013 | Duplicate `id` attribute in document | "Duplicate id: {id}" |
| E014 | Unknown element type | "Unknown element: {element}" |
| E015 | Invalid child element | "Element {child} not permitted inside {parent}" |
| E016 | `<metadata>` appears after `<slide>` | "metadata element must appear before all slide elements" |
| E017 | `<img>` missing required `src` attribute | "img element requires 'src' attribute" |
| E018 | `<img>` missing required `alt` attribute | "img element requires 'alt' attribute" |
| E019 | Invalid `transition` value | "Invalid transition: '{transition}'. Must be one of: none, fade, slide-left, slide-right, slide-up, slide-down" |
| E020 | Unknown element in `<metadata>` | "Unknown element in metadata: '{element}'" |
| E021 | Duplicate element in `<metadata>` | "Duplicate metadata element: '{element}'" |
| E022 | Invalid date format in `<created>` or `<modified>` | "Invalid date format in '{element}'. Expected YYYY-MM-DD" |

---

## Transitions

**Type:** `TransitionType`

**Valid Values:**

| Value         | Description |
|---------------|-------------|
| `none`        | Instant switch, no animation |
| `fade`        | Opacity transition |
| `slide-left`  | New slide enters from right, old exits left |
| `slide-right` | New slide enters from left, old exits right |
| `slide-up`    | New slide enters from bottom, old exits top |
| `slide-down`  | New slide enters from top, old exits bottom |

Any other value is invalid and MUST produce an error.

---

## Text Content

### Whitespace Handling

- Leading and trailing whitespace in text content is trimmed.
- Consecutive whitespace characters are collapsed to a single space.
- Exception: `<pre>` elements preserve all whitespace.

### Special Characters

The following characters MUST be escaped in text content and attribute values:

| Character | Escape Sequence |
|-----------|-----------------|
| `<`       | `&lt;`          |
| `>`       | `&gt;`          |
| `&`       | `&amp;`         |
| `"`       | `&quot;` (in attributes) |

---

## Complete Example

```html
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

  <slide order="3" transition="fade" id="summary">
    <h1 order="1" narration="To summarize what we have learned">
      Summary
    </h1>
    <div>
      <img src="react-logo.svg" alt="React logo" />
    </div>
    <p order="2" narration="React is a powerful library for building modern user interfaces" delay="1000">
      React makes UI development simple and efficient.
    </p>
  </slide>
</slideshow>
```

**Narration Order for Slide 2:**
1. "Let us start by understanding what React actually is"
2. "React has three main characteristics"
3. "First it is a JavaScript library not a full framework"
4. "Second it uses a component based architecture"
5. "This means you build reusable UI pieces" → pause 200ms
6. "Each component can manage its own state"
7. "Third it uses a virtual DOM for efficient updates" → pause 500ms

---

## Grammar (EBNF)

```ebnf
document      = slideshow ;
slideshow     = "<slideshow" , attributes , ">" , [ metadata ] , slide , { slide } , "</slideshow>" ;
metadata      = "<metadata>" , { metadata_child } , "</metadata>" ;
metadata_child = description | tags | created | modified ;
description   = "<description>" , text , "</description>" ;
tags          = "<tags>" , text , "</tags>" ;
created       = "<created>" , date , "</created>" ;
modified      = "<modified>" , date , "</modified>" ;
date          = digit , digit , digit , digit , "-" , digit , digit , "-" , digit , digit ;
slide         = "<slide" , slide_attrs , ">" , content+ , "</slide>" ;
slide_attrs   = order_attr , [ transition_attr ] , [ id_attr ] ;
content       = block_element | void_element ;
block_element = ( div | p | heading | list | blockquote | pre ) ;
void_element  = img ;
order_attr    = "order" , "=" , '"' , positive_int , '"' ;
narration_attr= "narration" , "=" , '"' , text , '"' ;
delay_attr    = "delay" , "=" , '"' , non_neg_int , '"' ;
positive_int  = digit_nonzero , { digit } ;
non_neg_int   = "0" | positive_int ;
digit         = "0" | digit_nonzero ;
digit_nonzero = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

(Simplified grammar; full grammar would include all element definitions)
