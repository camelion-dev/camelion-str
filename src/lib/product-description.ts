import sanitizeHtml from "sanitize-html";

export const MAX_DETAILED_DESCRIPTION_LENGTH = 50_000;

const allowedTags = [
  "a", "blockquote", "br", "caption", "code", "dd", "div", "dl", "dt",
  "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "i", "li", "ol", "p", "pre", "s", "span", "strong", "sub",
  "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
];

export function sanitizeProductDescription(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^(#[\da-f]{3,8}|rgba?\([\d.,% ]+\)|hsla?\([\d.,%deg ]+\)|[a-z]{1,20})$/i],
        "background-color": [/^(#[\da-f]{3,8}|rgba?\([\d.,% ]+\)|hsla?\([\d.,%deg ]+\)|[a-z]{1,20})$/i],
        "font-size": [/^\d+(?:\.\d+)?(?:px|pt|em|rem|%)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "text-align": [/^(left|right|center|justify)$/],
        "text-decoration": [/^(none|underline|line-through)$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}
