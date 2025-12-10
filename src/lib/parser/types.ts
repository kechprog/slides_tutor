export type TransitionType =
  | "none"
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down";

export const VALID_TRANSITIONS: TransitionType[] = [
  "none",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
];

export interface SourceLocation {
  line: number;
  column: number;
}

export interface SlideshowMeta {
  description?: string;
  tags?: string[];
  created?: string;
  modified?: string;
}

export interface NarrationNode {
  order: number;
  narration?: string;
  delay: number;
  element: ContentElement;
  children: NarrationNode[];
}

export interface BaseElement {
  type: string;
  id?: string;
  order?: number;
  narration?: string;
  delay?: number;
  location: SourceLocation;
}

export interface TextNode {
  type: "text";
  content: string;
  location: SourceLocation;
}

export interface ImgElement extends BaseElement {
  type: "img";
  src: string;
  alt: string;
  width?: string;
  height?: string;
}

export interface ContainerElement extends BaseElement {
  type:
    | "div"
    | "p"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "ul"
    | "ol"
    | "li"
    | "blockquote"
    | "pre"
    | "span"
    | "strong"
    | "em"
    | "code";
  children: ContentNode[];
}

export type ContentElement = ImgElement | ContainerElement;
export type ContentNode = ContentElement | TextNode;

export interface Slide {
  order: number;
  transition: TransitionType;
  id?: string;
  children: ContentNode[];
  location: SourceLocation;
}

export interface Slideshow {
  title: string;
  author?: string;
  version?: string;
  meta?: SlideshowMeta;
  slides: Slide[];
  location: SourceLocation;
}

// Allowed elements
export const BLOCK_ELEMENTS = [
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
] as const;

export const INLINE_ELEMENTS = ["span", "strong", "em", "code"] as const;

export const VOID_ELEMENTS = ["img"] as const;

export const META_ELEMENTS = [
  "description",
  "tags",
  "created",
  "modified",
] as const;

export const STRUCTURAL_ELEMENTS = ["slideshow", "metadata", "slide"] as const;

export const ALL_ALLOWED_ELEMENTS = [
  ...STRUCTURAL_ELEMENTS,
  ...META_ELEMENTS,
  ...BLOCK_ELEMENTS,
  ...INLINE_ELEMENTS,
  ...VOID_ELEMENTS,
] as const;

export type BlockElementType = (typeof BLOCK_ELEMENTS)[number];
export type InlineElementType = (typeof INLINE_ELEMENTS)[number];
export type VoidElementType = (typeof VOID_ELEMENTS)[number];
export type MetaElementType = (typeof META_ELEMENTS)[number];
export type AllowedElementType = (typeof ALL_ALLOWED_ELEMENTS)[number];

// Child constraints
export const ELEMENT_CHILDREN: Record<string, readonly string[]> = {
  ul: ["li"],
  ol: ["li"],
  pre: [], // text only
  code: [], // text only
};

export const TEXT_ONLY_ELEMENTS = ["pre", "code"] as const;

// Sets for O(1) lookups
export const ALLOWED_ELEMENTS_SET = new Set<string>(ALL_ALLOWED_ELEMENTS);
export const VALID_TRANSITIONS_SET = new Set<string>(VALID_TRANSITIONS);
export const TEXT_ONLY_ELEMENTS_SET = new Set<string>(TEXT_ONLY_ELEMENTS);
export const META_ELEMENTS_SET = new Set<string>(META_ELEMENTS);

// Validation patterns
export const ORDER_PATTERN = /^[1-9]\d*$/;
export const DELAY_PATTERN = /^(0|[1-9]\d*)$/;
export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
