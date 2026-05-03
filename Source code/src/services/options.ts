export const graphOptions = {
  locale: "en",
  autoResize: true,
  layout: {
    hierarchical: {
      enabled: true,
      direction: "LR",      
      sortMethod: "directed",
      nodeSpacing: 75,
      levelSeparation: 130,
      blockShifting: false,
      edgeMinimization: false,
      parentCentralization: false 
    },
  },
  nodes: {
    shape: "ellipse",
    color: {
      background: "#ffffff",
      border: "#000000",
    },
    font: { color: "#000000" },
  },
  edges: {
    arrows: {
      to: { enabled: true, scaleFactor: 1 },
    },
    smooth: {
      type: "cubicBezier",
      forceDirection: "horizontal",
      roundness: 0.4,
    },
  },
  physics: {
    enabled: false,
  },
  interaction: {
    dragNodes: true, 
    dragView: true,
    zoomView: true,
  },
};

