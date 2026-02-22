import sanitizeHtml from "sanitize-html";

/**
 * TipTap 에디터 HTML 출력 정제
 * 허용 태그: TipTap StarterKit + Image + Link 확장 출력만 허용
 * 차단: <script>, <iframe>, on* 이벤트 핸들러 등 모든 악성 벡터
 */
export function sanitizePostContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "strong", "em", "s", "a", "img",
    ],
    allowedAttributes: {
      a:   ["href", "target", "rel"],
      img: ["src", "alt", "class"],
      code: ["class"],
      pre:  ["class"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    // a 태그 외부 링크 강제 noopener
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
          ...(attribs.href?.startsWith("http") ? { target: "_blank" } : {}),
        },
      }),
    },
  });
}
