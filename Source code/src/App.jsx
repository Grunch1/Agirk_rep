import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network/standalone";
import RankBarChart from "./components/rankBarChart/RankBarChart";
import { graphOptions } from "./services/options";
import utils from "./services/utils";

export default function App() {
  const networkRef = useRef(null);
  const containerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e.target.error);
      reader.readAsText(file);
    });
  }

  async function handleFileUpload(event) {
    setIsLoading(true);
  
    try {
      const file = event.target.files[0];
      const xmlString = await readFileAsText(file);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  
      const keyMap = utils.getXMLKeys(xmlDoc);
      const parsedNodes = utils.getNodeList(xmlDoc, keyMap);
      const parsedEdges = utils.getEdgesList(xmlDoc);
  
      const nodeIdToIsLemma = {};
      const nodeMap = {};
      parsedNodes.forEach((node) => {
        nodeIdToIsLemma[node.id] = node.isLemma;
        nodeMap[node.id] = node;
      });
  
      parsedNodes.forEach((node) => {
        node.color = {
          background: "#ffffff",
          border: "#000000",
        };
      });

      const updatedEdges = parsedEdges.map((edge) => {
        const fromLemma = nodeIdToIsLemma[edge.from];
        const toLemma = nodeIdToIsLemma[edge.to];
        const isConnectedToLemma = fromLemma && toLemma;
  
        if (isConnectedToLemma) {
          if (nodeMap[edge.from]) {
            nodeMap[edge.from].color.background = "#42ff4280";
          }
          if (nodeMap[edge.to]) {
            nodeMap[edge.to].color.background = "#42ff4280";
          }
        }
        
        return {
          ...edge,
          width: isConnectedToLemma ? 4 : 1,
        };
      });
  
      setNodes(parsedNodes);
      setEdges(updatedEdges);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setIsLoading(false);
    }
  }
  

  useEffect(() => {
    if (containerRef.current && nodes.length && edges.length) {
      const nodeList = nodes.map((node) => {
        if (node.label === "#START#" || node.label === "#END#") {
          return {
            ...node,
            color: { background: "#ffff00", border: "#000000" }
          };
        }

        return node;
      });

      const data = { nodes: nodeList, edges };

      if (networkRef.current) {
        networkRef.current.destroy();
      }

      networkRef.current = new Network(containerRef.current, data, graphOptions);

      networkRef.current.on("click", function (params) {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          setSelectedNodeId(nodeId);
        }
      });
    }
  }, [nodes, edges]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <p>Loading...</p>
      </div>
    );

  return (
    <div className="p-8 space-y-6 overflow-x-auto">
      <input
        type="file"
        accept=".xml"
        disabled={isLoading}
        onChange={handleFileUpload}
        className="p-2 border border-black rounded-md"
      />
      <div
        ref={containerRef}
        className="p-4 bg-white shadow-md border border-gray-200 w-full h-[600px] rounded-lg"
      ></div>w
      <div className="rounded-xl w-full min-h-[280px] h-full p-4 bg-white shadow-md border border-gray-200">
        {nodes && nodes.length > 0 && (
          <RankBarChart
            onBarClick={(rank) => {
              const match = nodes.find((node) => node.rank === rank);
              if (match) {
                setSelectedNodeId(match.id);
                networkRef.current?.selectNodes([match.id]);
                networkRef.current?.focus(match.id, { scale: 1 });
              }
            }}
            selectedNodeId={selectedNodeId} nodes={nodes} />
        )}
      </div>
    </div>
  );
}
