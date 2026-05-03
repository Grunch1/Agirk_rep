import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useRef } from "react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

const RankBarChart = ({ nodes, selectedNodeId, onBarClick }) => {
  const chartRef = useRef(null);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const selectedRank = selectedNode?.rank || null;

  const rankCounts = nodes.reduce((acc, node) => {
    const rank = node.rank || 0;
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {});

  const sortedRanks = Object.keys(rankCounts)
    .map(Number)
    .sort((a, b) => a - b);

  const maxRank = Math.max(...sortedRanks, 10);
  const allRanks = Array.from({ length: maxRank }, (_, i) => i + 1);

  const data = {
    labels: allRanks,
    datasets: [
      {
        label: "Total Nodes",
        data: allRanks.map((rank) => rankCounts[rank] || 0),
        backgroundColor: allRanks.map((rank) =>
          rank === selectedRank ? "#4da6ff" : "#581c1c"
        ),
        borderRadius: 2,
        categoryPercentage: 0.8,
        barPercentage: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event) => {
      const chart = chartRef.current;
      if (!chart) return;

      const elements = chart.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        true
      );

      if (elements.length > 0) {
        const index = elements[0].index;
        const clickedRank = allRanks[index];

        if (onBarClick) {
          onBarClick(clickedRank);
        } else {
          console.log("Clicked Rank:", clickedRank);
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
          drawTicks: false,
        },
        ticks: {
          display: false,
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          drawBorder: false,
          drawTicks: true,
        },
        ticks: {
          display: false,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#111827",
        titleColor: "#f9fafb",
        bodyColor: "#d1d5db",
      },
    },
    layout: {
      padding: 5,
    },
    elements: {
      bar: {
        borderSkipped: false,
      },
    },
  };

  return (
    <div className="w-full overflow-x-auto p-4 bg-white rounded-xl shadow-md">
      <div style={{ width: `100vw`, height: "200px" }}>
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default RankBarChart;
