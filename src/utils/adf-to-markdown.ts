type ADFNode = {
  type: string;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{ type: string }>;
  attrs?: Record<string, any>;
};

export function adfToMarkdown(nodes: ADFNode[]): string {
  return nodes.map((node) => processNode(node)).join("");
}

function processNode(node: ADFNode, listDepth = 0): string {
  switch (node.type) {
    case "paragraph":
      return processInlineContent(node.content || []) + "\n\n";

    case "text":
      return applyMarks(node.text || "", node.marks || []);

    case "heading":
      const level = node.attrs?.level || 1;
      const headingText = processInlineContent(node.content || []);
      return `${"#".repeat(level)} ${headingText}\n\n`;

    case "bulletList":
      return (
        (node.content || [])
          .map((item) => processListItem(item, "-", listDepth))
          .join("") + "\n"
      );

    case "orderedList":
      return (
        (node.content || [])
          .map((item, idx) => processListItem(item, `${idx + 1}.`, listDepth))
          .join("") + "\n"
      );

    case "listItem":
      return processInlineContent(node.content || []);

    case "rule":
      return "---\n\n";

    case "mediaSingle":
      const media = node.content?.[0];
      if (media?.type === "media") {
        const alt = media.attrs?.alt || "image";
        const id = media.attrs?.id;
        return id ? `![${alt}](${id})\n\n` : "";
      }
      return "";

    default:
      if (node.content) {
        return node.content
          .map((child) => processNode(child, listDepth))
          .join("");
      }
      return "";
  }
}

function processListItem(item: ADFNode, marker: string, depth: number): string {
  const indent = "  ".repeat(depth);
  const content = (item.content || [])
    .map((child) => {
      if (child.type === "paragraph") {
        return processInlineContent(child.content || []);
      }
      if (child.type === "bulletList" || child.type === "orderedList") {
        return "\n" + processNode(child, depth + 1);
      }
      return processNode(child, depth);
    })
    .join("");

  return `${indent}${marker} ${content}\n`;
}

function processInlineContent(nodes: ADFNode[]): string {
  return nodes.map((node) => processNode(node)).join("");
}

function applyMarks(text: string, marks: Array<{ type: string }>): string {
  let result = text;
  for (const mark of marks) {
    switch (mark.type) {
      case "strong":
        result = `**${result}**`;
        break;
      case "em":
        result = `*${result}*`;
        break;
      case "code":
        result = `\`${result}\``;
        break;
    }
  }
  return result;
}
