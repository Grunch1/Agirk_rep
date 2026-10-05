(function (global) {
  "use strict";

  function getDisplayText(node) {
    const normalized = node && node.normal_form;
    if (typeof normalized === "string" && normalized.trim()) return normalized;
    const original = node && node.text;
    return original === undefined || original === null ? "" : String(original);
  }

  function isReadingNode(node) {
    if (!node || node.is_section === true || node.is_start === true || node.is_end === true) return false;
    if (node.neolabel && node.neolabel !== "[READING]") return false;
    const text = String(node.text || "").trim();
    const name = String(node.name || "").trim();
    if (text === "[SECTION]" || text === "#START#" || text === "#END#" || name.startsWith("milestone-")) return false;
    if (Number(node.rank) === 0 && text === "N/A") return false;
    return Boolean(getDisplayText(node).trim());
  }

  function getLemmaNodes(section) {
    return section.nodes
      .filter((node) => node.is_lemma === true && isReadingNode(node))
      .sort((a, b) => Number(a.rank || 0) - Number(b.rank || 0));
  }

  function getLemmaText(section) {
    return getLemmaNodes(section).map(getDisplayText).join(" ");
  }

  function parseValue(value, name) {
    const text = value.trim();
    if (name === "text" || name === "normal_form" || name === "display" || name === "name") return text;
    if (text === "true") return true;
    if (text === "false") return false;
    if (/^-?\d+$/.test(text)) return Number(text);
    if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
      try { return JSON.parse(text); } catch (error) { /* Keep non-JSON GraphML values. */ }
    }
    return text;
  }

  function parseGraphMLText(xmlText) {
    const xml = new DOMParser().parseFromString(xmlText, "application/xml");
    if (xml.getElementsByTagName("parsererror").length) throw new Error("Invalid section XML.");
    const graph = xml.getElementsByTagName("graph")[0];
    if (!graph) throw new Error("Section XML has no graph.");
    const keyMap = {};
    Array.from(xml.getElementsByTagName("key")).forEach((key) => {
      keyMap[key.getAttribute("id")] = key.getAttribute("attr.name") || key.getAttribute("name");
    });
    function readData(element, result) {
      Array.from(element.getElementsByTagName("data")).forEach((data) => {
        const name = keyMap[data.getAttribute("key")] || data.getAttribute("key");
        result[name] = parseValue(data.textContent || "", name);
      });
      return result;
    }
    const nodes = Array.from(graph.getElementsByTagName("node")).map((node) =>
      readData(node, { id: node.getAttribute("id") })
    );
    const edges = Array.from(graph.getElementsByTagName("edge")).map((edge) =>
      readData(edge, {
        id: edge.getAttribute("id"),
        source: edge.getAttribute("source"),
        target: edge.getAttribute("target"),
      })
    );
    const sectionNode = nodes.find((node) => node.neolabel === "[SECTION]");
    const sectionId = sectionNode ? sectionNode.id : graph.getAttribute("id");
    const title = sectionNode && sectionNode.name
      ? sectionNode.name.replace(/^milestone-/, "").replace(/_/g, " ")
      : "";
    return { sectionId: `section-${sectionId}`, title, nodes, edges };
  }

  function createSection(data, graphData, fileId) {
    if (!/^section-\d+$/.test(fileId)) throw new Error("Invalid section id.");
    if (!data || !Array.isArray(data.nodes) || typeof data.title !== "string" || !data.title.trim()) {
      throw new Error("Invalid section data: expected a title and nodes.");
    }
    const sectionNodeId = fileId.slice("section-".length);
    const matchesSection = data.sectionId !== undefined
      ? data.sectionId === fileId
      : data.nodes.some((node) => String(node.id) === sectionNodeId);
    if (!matchesSection) {
      throw new Error("Text data does not match the selected section.");
    }
    if (graphData && graphData.sectionId !== fileId) {
      throw new Error("Graph data does not match the selected section.");
    }
    const graphNodes = new Map(graphData ? graphData.nodes.map((node) => [String(node.id), node]) : []);
    const nodes = data.nodes.map((node) => {
      const graphNode = graphNodes.get(String(node.id));
      if (graphData && !graphNode) throw new Error("Graph readings do not match the selected text.");
      return { ...node, ...graphNode, id: String(node.id), text: node.text };
    });
    return {
      ...data,
      sectionId: fileId,
      title: data.title.trim(),
      nodes,
      edges: graphData ? graphData.edges : [],
    };
  }

  global.SectionData = Object.freeze({
    getDisplayText,
    isReadingNode,
    getLemmaNodes,
    getLemmaText,
    parseGraphMLText,
    createSection,
  });
})(globalThis);
