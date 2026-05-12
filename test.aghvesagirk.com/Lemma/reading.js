const DEFAULT_SECTION_ID = "section-3504207";

const indexPanelLoadPromise = fetch("index-panel.html")
  .then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.text();
  })
  .then((html) => {
    const indexPanel = document.getElementById("index-panel");
    if (indexPanel) {
      indexPanel.innerHTML = html;
      initializeIndexPanelItems();
    }
    return html;
  })
  .catch((err) => {
    setReaderStatus("Could not load the section index.", "error");
    console.error("Failed to load index-panel.html:", err);
  });console.log("");

// Toggle navbar function
    function toggleNavbar() {
      console.log("Toggle button clicked");
      const navbarPages = document.getElementById("navbarSupportedContent");
      if (!navbarPages) return;
      navbarPages.classList.toggle("show");
      const navbarToggleButton = document.querySelector(".navbar-toggler");
      if (navbarToggleButton) {
        navbarToggleButton.setAttribute(
          "aria-expanded",
          navbarPages.classList.contains("show") ? "true" : "false"
        );
      }
    }

    // Load the navbar content from navbar.html
    fetch("navbar.html")
      .then((response) => response.text())
      .then((data) => {
        document.getElementById("navbar").innerHTML = data;

        // Once navbar is loaded, find all links and adjust them if needed
        const navLinks = document.querySelectorAll("#navbar .nav-link");

        navLinks.forEach((link) => {
          const href = link.getAttribute("href");

          // If the href is a hash link (e.g., "#Manuscript"), modify it to point to Home.html
          if (href && href.startsWith("#")) {
            link.setAttribute("href", `Home.html${href}`);
          }
        });

        const navbarToggleButton = document.querySelector(".navbar-toggler");
        if (navbarToggleButton) {
          navbarToggleButton.addEventListener("click", toggleNavbar);
        }
      })
      .catch((error) => console.error("Error loading navbar:", error));

var cb = document.querySelector("#cb-toggle");
    var graphSection = document.querySelector("#graph-section");
    var fakeSection = document.querySelector("#fake-section");

    if (cb) {
      cb.addEventListener("change", function () {
        setGraphVisible(cb.checked);
      });
    }

let nodes = [];
    let graphEdges = [];
    const canvasStates = {};
    let activeDragCanvasId = null;
    let selectedRank = null;
    let currentSectionId = null;

    function getCanvasState(canvasId) {
      if (!canvasStates[canvasId]) {
        resetCanvasState(canvasId);
      }
      return canvasStates[canvasId];
    }

    function resetCanvasState(canvasId) {
      canvasStates[canvasId] = {
        scale: 1,
        minScale: 0.25,
        maxScale: 3,
        translateX: 0,
        translateY: 0,
        isDragging: false,
        pointerStartX: 0,
        pointerStartY: 0,
        startTranslateX: 0,
        startTranslateY: 0,
        ignoreClick: false,
      };
      return canvasStates[canvasId];
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function setReaderStatus(message, type = "info") {
      const status = document.getElementById("reader-status");
      if (!status) return;

      status.classList.remove("is-error", "is-warning");
      if (type === "error") {
        status.textContent = message;
        status.hidden = false;
        status.classList.add("is-error");
      } else if (type === "warning") {
        status.textContent = message;
        status.hidden = false;
        status.classList.add("is-warning");
      } else {
        status.textContent = "";
        status.hidden = true;
      }
    }

    function getRequestedSectionIdFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get("section");
      if (fromQuery) return fromQuery;

      const fromHash = window.location.hash.replace("#", "");
      return fromHash.startsWith("section-") ? fromHash : null;
    }

    function updateSelectedSectionInUrl(fileId) {
      const url = new URL(window.location.href);
      url.searchParams.set("section", fileId);
      url.hash = "";
      window.history.replaceState({}, "", url);
    }

    function setActiveIndexItem(fileId) {
      document.querySelectorAll("#index-panel .year-box").forEach((item) => {
        const isActive = item.id === fileId;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    function initializeIndexPanelItems() {
      document.querySelectorAll("#index-panel .year-box").forEach((item) => {
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
      });
      if (currentSectionId) {
        setActiveIndexItem(currentSectionId);
      }
    }

    function setGraphVisible(isVisible) {
      document.querySelector(".main-content")?.classList.toggle("is-graph-open", isVisible);
      if (graphSection) {
        graphSection.style.display = isVisible ? "block" : "none";
      }
      if (fakeSection) {
        fakeSection.style.display = isVisible ? "none" : "flex";
      }

      const canvas = document.getElementById("myCanvas");
      if (canvas && !isVisible) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }

      if (isVisible && nodes.length) {
        drawCanvas("myCanvas");
      }
    }

    function resetGraphView() {
      resetCanvasState("myCanvas");
      selectedRank = null;
      if (cb && !cb.checked) {
        cb.checked = true;
      }
      setGraphVisible(true);
    }

    function zoomCanvas(multiplier) {
      const canvasId = "myCanvas";
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const state = getCanvasState(canvasId);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const graphX = (centerX - state.translateX) / state.scale;
      const graphY = (centerY - state.translateY) / state.scale;
      const newScale = clamp(state.scale * multiplier, state.minScale, state.maxScale);

      state.translateX = centerX - graphX * newScale;
      state.translateY = centerY - graphY * newScale;
      state.scale = newScale;

      if (cb && !cb.checked) {
        cb.checked = true;
      }
      setGraphVisible(true);
      drawCanvas(canvasId);
    }

    function getCurrentCanvasId() {
      return "myCanvas";
    }

    function getCanvasGraphPoint(event, canvas, canvasId = null) {
      const id = canvasId || (canvas && canvas.id) || "myCanvas";
      const rect = canvas.getBoundingClientRect();
      const state = getCanvasState(id);
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      return {
        x: (mouseX - state.translateX) / state.scale,
        y: (mouseY - state.translateY) / state.scale,
      };
    }

    function findCanvasNodeAtPoint(graphPoint, canvas) {
      return nodes.find((node) => {
        const width = node.width || calculateTextWidth(node.text, canvas);
        const height = node.height || 50;
        const x = node.x !== undefined ? node.x : 100 * (node.rank - 1);
        const y = node.y !== undefined ? node.y : 400 + getYOffset(nodes.indexOf(node));

        return (
          graphPoint.x >= x &&
          graphPoint.x <= x + width &&
          graphPoint.y >= y &&
          graphPoint.y <= y + height
        );
      });
    }

    function findCanvasNodeFromEvent(event, canvas, canvasId = null) {
      return findCanvasNodeAtPoint(getCanvasGraphPoint(event, canvas, canvasId), canvas);
    }

    function updateCanvasCursor(event, canvasId) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const state = getCanvasState(canvasId);
      if (state.isDragging) {
        canvas.style.cursor = "grabbing";
        return;
      }
      canvas.style.cursor = findCanvasNodeFromEvent(event, canvas, canvasId) ? "default" : "grab";
    }

    function handleCanvasClick(event, canvasId = null) {
      const canvas = event.currentTarget || document.getElementById(canvasId || "myCanvas");
      const id = canvasId || (canvas && canvas.id) || "myCanvas";
      const clickedNode = findCanvasNodeFromEvent(event, canvas, id);

      nodes.forEach((node) => {
        node.isClicked = false;
      });
      if (clickedNode) {
        clickedNode.isClicked = true;
      }
      drawCanvas(id);
    }

    function calculateTextWidth(text, canvas) {
      const currentCanvas = canvas
        ? typeof canvas === "string"
          ? document.getElementById(canvas)
          : canvas
        : document.getElementById("myCanvas");
      if (!currentCanvas) {
        throw new Error("Canvas not found for calculateTextWidth");
      }
      const ctx = currentCanvas.getContext("2d");
      const prevTransform = ctx.getTransform();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = "16px Arial";
      const width = ctx.measureText(text).width + 20; // Add padding
      ctx.setTransform(prevTransform);
      return width;
    }

    function normalizeCanvasSize(canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function getRankCounts() {
      const rankGroups = {};
      nodes.forEach((node) => {
        const rank = Number(node.rank || node.dn5 || 0);
        if (!rankGroups[rank]) {
          rankGroups[rank] = 0;
        }
        rankGroups[rank]++;
      });
      return Object.keys(rankGroups)
        .map((rank) => ({ rank: Number(rank), count: rankGroups[rank] }))
        .sort((a, b) => a.rank - b.rank);
    }

    function getOverviewLayout(overviewCanvas, rankCounts) {
      const padding = 40;
      const barWidth = 24;
      const spacing = 10;
      const minBars = 40;
      const totalBars = Math.max(rankCounts.length, minBars);
      const width = Math.max(
        overviewCanvas.offsetWidth,
        padding * 2 + totalBars * barWidth + Math.max(0, totalBars - 1) * spacing
      );
      const height = overviewCanvas.offsetHeight;
      const chartHeight = height - padding * 2;
      return { padding, barWidth, spacing, width, height, chartHeight };
    }

    function handleOverviewClick(event) {
      const overviewCanvas = event.currentTarget;
      const rankCounts = getRankCounts();
      if (!rankCounts.length) return;

      const layout = getOverviewLayout(overviewCanvas, rankCounts);
      const rect = overviewCanvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const chartLeft = layout.padding;
      const index = Math.floor((clickX - chartLeft) / (layout.barWidth + layout.spacing));
      if (index < 0 || index >= rankCounts.length) return;

      const rank = rankCounts[index].rank;
      selectedRank = selectedRank === rank ? null : rank;
      const canvasId = getCurrentCanvasId();
      drawCanvas(canvasId);
      centerCanvasOnRank(rank, canvasId);
      drawOverviewCanvas();
    }

    function centerCanvasOnRank(rank, canvasId = "myCanvas") {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const rankNodes = nodes.filter((node) => Number(node.rank) === Number(rank));
      if (!rankNodes.length) return;

      const state = getCanvasState(canvasId);
      const left = Math.min(...rankNodes.map((node) => node.x));
      const right = Math.max(...rankNodes.map((node) => node.x + node.width));
      const top = Math.min(...rankNodes.map((node) => node.y));
      const bottom = Math.max(...rankNodes.map((node) => node.y + node.height));
      const rankCenterX = (left + right) / 2;
      const rankCenterY = (top + bottom) / 2;

      state.translateX = canvas.width / 2 - rankCenterX * state.scale;
      state.translateY = canvas.height / 2 - rankCenterY * state.scale;
      drawCanvas(canvasId);
    }

    function drawOverviewCanvas() {
      const overviewCanvas = document.getElementById("overviewCanvas");
      if (!overviewCanvas) return;
      const rankCounts = getRankCounts();
      normalizeCanvasSize(overviewCanvas);

      if (!rankCounts.length) {
        const ctx = overviewCanvas.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);
        ctx.fillStyle = "#444";
        ctx.font = "14px Arial";
        ctx.fillText("No graph data to display", 10, 30);
        return;
      }

      const layout = getOverviewLayout(overviewCanvas, rankCounts);
      overviewCanvas.width = layout.width;
      overviewCanvas.style.width = `${layout.width}px`;
      overviewCanvas.height = layout.height;
      const ctx = overviewCanvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, overviewCanvas.width, overviewCanvas.height);

      const maxCount = Math.max(...rankCounts.map((item) => item.count), 1);
      ctx.fillStyle = "#222";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Rank node counts", overviewCanvas.width / 2, 18);

      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(layout.padding, overviewCanvas.height - layout.padding);
      ctx.lineTo(overviewCanvas.width - layout.padding + 10, overviewCanvas.height - layout.padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(layout.padding, overviewCanvas.height - layout.padding);
      ctx.lineTo(layout.padding, layout.padding - 10);
      ctx.stroke();

      rankCounts.forEach((item, index) => {
        const x = layout.padding + index * (layout.barWidth + layout.spacing);
        const barHeight = (item.count / maxCount) * layout.chartHeight;
        const y = overviewCanvas.height - layout.padding - barHeight;
        const isSelected = selectedRank === item.rank;

        ctx.fillStyle = isSelected ? "#FFC107" : "#e1f5fe";
        ctx.strokeStyle = isSelected ? "#FF9800" : "#2196F3";
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, layout.barWidth, barHeight);
        ctx.strokeRect(x, y, layout.barWidth, barHeight);

        ctx.fillStyle = "#000";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(item.count, x + layout.barWidth / 2, y - 6);
        ctx.fillText(item.rank.toString(), x + layout.barWidth / 2, overviewCanvas.height - layout.padding + 14);
      });
    }

    // Function to calculate y position offsets for each rank
    function getYOffset(index) {
      const offsets = [0, 50, -50, 100, -100];
      return offsets[index % offsets.length];
    }

    function drawCanvas(canvasId = "myCanvas") {
      const canvas = typeof canvasId === "string" ? document.getElementById(canvasId) : canvasId;
      if (!canvas) {
        setReaderStatus("Graph canvas is missing.", "error");
        return;
      }

      const layoutSettings = {
        nodeHeight: 50,
        nodeGap: 24,
        rankGap: 90,
        paddingX: 40,
        paddingY: 40,
      };

      const state = getCanvasState(canvas.id);
      normalizeCanvasSize(canvas);
      console.log("Updated Canvas dimensions:", canvas.width, canvas.height);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!canvas.dataset.interactionsInitialized) {
        canvas.style.touchAction = "none";
        canvas.addEventListener("wheel", (event) => handleCanvasWheel(event, canvas.id));
        canvas.addEventListener("mousedown", (event) => handleCanvasPointerDown(event, canvas.id));
        canvas.addEventListener("mousemove", (event) => updateCanvasCursor(event, canvas.id));
        canvas.addEventListener("mouseleave", () => {
          const state = getCanvasState(canvas.id);
          if (!state.isDragging) {
            canvas.style.cursor = "default";
          }
        });
        canvas.addEventListener("click", (event) => {
          const state = getCanvasState(canvas.id);
          if (state.ignoreClick) {
            state.ignoreClick = false;
            return;
          }
          handleCanvasClick(event, canvas.id);
        });
        canvas.dataset.interactionsInitialized = "true";
      }

      ctx.save();
      ctx.translate(state.translateX, state.translateY);
      ctx.scale(state.scale, state.scale);

      function createRoundedRectPath(x, y, width, height) {
        const radius = 20;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }

      function drawNodeFill(node) {
        createRoundedRectPath(node.x, node.y, node.width, node.height);
        const isSelected = selectedRank === node.rank;
        const isClicked = node.isClicked;
        ctx.fillStyle = isSelected
          ? "#FFF59D"
          : isClicked
            ? "#ffcc80"
            : "#e1f5fe";
        ctx.fill();
      }

      function drawNodeDetails(node) {
        createRoundedRectPath(node.x, node.y, node.width, node.height);
        const isSelected = selectedRank === node.rank;
        ctx.lineWidth = node.isLemma && !isSelected ? 2 : 1;
        ctx.strokeStyle = isSelected ? "#FBC02D" : node.isLemma ? "#1976D2" : "#2196F3";
        ctx.stroke();
        if (node.isLemma && !isSelected) {
          createRoundedRectPath(node.x + 3, node.y + 3, node.width - 6, node.height - 6);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(25, 118, 210, 0.35)";
          ctx.stroke();
        }
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(
          node.text,
          node.x + node.width / 2 - ctx.measureText(node.text).width / 2,
          node.y + node.height / 2 + 5
        );
      }

      function lineIntersectsRect(fromX, fromY, toX, toY, rect) {
        const padding = 10;
        const left = rect.x - padding;
        const right = rect.x + rect.width + padding;
        const top = rect.y - padding;
        const bottom = rect.y + rect.height + padding;
        const dx = toX - fromX;
        const dy = toY - fromY;
        let minT = 0;
        let maxT = 1;
        const checks = [
          [-dx, fromX - left],
          [dx, right - fromX],
          [-dy, fromY - top],
          [dy, bottom - fromY],
        ];

        for (const [p, q] of checks) {
          if (p === 0) {
            if (q < 0) return false;
            continue;
          }

          const t = q / p;
          if (p < 0) {
            if (t > maxT) return false;
            if (t > minT) minT = t;
          } else {
            if (t < minT) return false;
            if (t < maxT) maxT = t;
          }
        }

        return true;
      }

      function drawArrowHead(fromX, fromY, toX, toY) {
        const headLength = 10;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }

      function drawRoundedArrowPath(points, isHighlighted = false, isLemmaArrow = false) {
        if (points.length < 2) return;
        const bendRadius = 14;
        const routePoints = points.filter((point, index) => {
          if (index === 0) return true;
          const prev = points[index - 1];
          return point.x !== prev.x || point.y !== prev.y;
        });
        if (routePoints.length < 2) return;

        ctx.save();
        ctx.strokeStyle = isHighlighted
          ? "rgba(255, 152, 0, 0.8)"
          : "rgba(244, 67, 54, 0.8)";
        ctx.lineWidth = isHighlighted ? 5 : isLemmaArrow ? 4 : 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        if (isHighlighted) {
          ctx.shadowColor = "rgba(255, 152, 0, 0.28)";
          ctx.shadowBlur = 4.8;
        }
        ctx.beginPath();
        ctx.moveTo(routePoints[0].x, routePoints[0].y);

        for (let i = 1; i < routePoints.length - 1; i++) {
          const prev = routePoints[i - 1];
          const current = routePoints[i];
          const next = routePoints[i + 1];
          const prevDistance = Math.hypot(current.x - prev.x, current.y - prev.y);
          const nextDistance = Math.hypot(next.x - current.x, next.y - current.y);
          if (!prevDistance || !nextDistance) {
            ctx.lineTo(current.x, current.y);
            continue;
          }
          const radius = Math.min(bendRadius, prevDistance / 2, nextDistance / 2);
          const fromX = current.x + ((prev.x - current.x) / prevDistance) * radius;
          const fromY = current.y + ((prev.y - current.y) / prevDistance) * radius;
          const toX = current.x + ((next.x - current.x) / nextDistance) * radius;
          const toY = current.y + ((next.y - current.y) / nextDistance) * radius;

          ctx.lineTo(fromX, fromY);
          ctx.quadraticCurveTo(current.x, current.y, toX, toY);
        }

        const end = routePoints[routePoints.length - 1];
        const beforeEnd = routePoints[routePoints.length - 2];
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        drawArrowHead(beforeEnd.x, beforeEnd.y, end.x, end.y);
        ctx.restore();
      }

      function getRouteLaneY(sourceNode, targetNode, blockingNodes, arrowIndex) {
        const lanePadding = 30 + (arrowIndex % 4) * 16;
        const routeNodes = [sourceNode, targetNode, ...blockingNodes];
        const topY = Math.min(...routeNodes.map((node) => node.y)) - lanePadding;
        const bottomY = Math.max(...routeNodes.map((node) => node.y + node.height)) + lanePadding;

        if (targetNode.y < sourceNode.y) return topY;
        if (targetNode.y > sourceNode.y) return bottomY;
        return arrowIndex % 2 === 0 ? topY : bottomY;
      }

      function getArrowRoute(sourceNode, targetNode, allNodes, arrowIndex) {
        const direction = targetNode.x >= sourceNode.x ? 1 : -1;
        const start = {
          x: sourceNode.x + (direction > 0 ? sourceNode.width : 0),
          y: sourceNode.y + sourceNode.height / 2,
        };
        const end = {
          x: targetNode.x + (direction > 0 ? 0 : targetNode.width),
          y: targetNode.y + targetNode.height / 2,
        };
        const blockingNodes = allNodes.filter((node) => {
          if (node === sourceNode || node === targetNode) return false;
          return lineIntersectsRect(start.x, start.y, end.x, end.y, node);
        });

        if (!blockingNodes.length) {
          return [start, end];
        }

        const horizontalGap = 24;
        const startOut = { x: start.x + direction * horizontalGap, y: start.y };
        const endIn = { x: end.x - direction * horizontalGap, y: end.y };
        const laneY = getRouteLaneY(sourceNode, targetNode, blockingNodes, arrowIndex);

        return [
          start,
          startOut,
          { x: startOut.x, y: laneY },
          { x: endIn.x, y: laneY },
          endIn,
          end,
        ];
      }

      if (!nodes.length) {
        selectedRank = null;
        ctx.restore();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#444";
        ctx.font = "16px Arial";
        ctx.fillText("No graph data to display", 24, 36);
        drawOverviewCanvas();
        return;
      }

      const rankGroups = {};
      nodes.forEach((node) => {
        if (!rankGroups[node.rank]) {
          rankGroups[node.rank] = [];
        }
        rankGroups[node.rank].push(node);
      });

      const sortedRanks = Object.keys(rankGroups)
        .map(Number)
        .sort((a, b) => a - b);
      let columnX = layoutSettings.paddingX;

      sortedRanks.forEach((rank) => {
        const nodesInRank = rankGroups[rank];
        const measuredNodes = nodesInRank.map((node) => ({
          node,
          width: calculateTextWidth(node.text, canvas),
          height: layoutSettings.nodeHeight,
        }));
        const maxRankWidth = Math.max(...measuredNodes.map((item) => item.width), 1);
        const rankHeight =
          measuredNodes.length * layoutSettings.nodeHeight +
          Math.max(0, measuredNodes.length - 1) * layoutSettings.nodeGap;
        const firstY = Math.max(
          layoutSettings.paddingY,
          (canvas.height - rankHeight) / 2
        );

        measuredNodes.forEach((item, index) => {
          item.node.x = columnX;
          item.node.y = firstY + index * (layoutSettings.nodeHeight + layoutSettings.nodeGap);
          item.node.width = item.width;
          item.node.height = item.height;
        });

        columnX += maxRankWidth + layoutSettings.rankGap;
      });

      const arrows = [];
      nodes.forEach((node) => {
        node.arrows.forEach((arrowIndex) => {
          const toNode = nodes[arrowIndex - 1];
          if (!toNode) return;
          if (Number(toNode.rank) <= Number(node.rank)) return;
          arrows.push({
            sourceNode: node,
            targetNode: toNode,
            isLemmaArrow: Boolean(node.isLemma && toNode.isLemma),
          });
        });
      });

      nodes.forEach((node) => {
        drawNodeFill(node);
      });

      arrows.forEach((arrow, arrowIndex) => {
        if (arrow.sourceNode.isClicked) return;
        const route = getArrowRoute(arrow.sourceNode, arrow.targetNode, nodes, arrowIndex);
        drawRoundedArrowPath(route, false, arrow.isLemmaArrow);
      });

      arrows.forEach((arrow, arrowIndex) => {
        if (!arrow.sourceNode.isClicked) return;
        const route = getArrowRoute(arrow.sourceNode, arrow.targetNode, nodes, arrowIndex);
        drawRoundedArrowPath(route, true, arrow.isLemmaArrow);
      });

      nodes.forEach((node) => {
        drawNodeDetails(node);
      });

      ctx.restore();
      drawOverviewCanvas();
    }

    function handleCanvasWheel(event, canvasId) {
      event.preventDefault();
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const state = getCanvasState(canvasId);
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const graphX = (mouseX - state.translateX) / state.scale;
      const graphY = (mouseY - state.translateY) / state.scale;
      const scaleFactor = event.deltaY < 0 ? 1.1 : 0.9;
      const newScale = clamp(state.scale * scaleFactor, state.minScale, state.maxScale);
      state.translateX = mouseX - graphX * newScale;
      state.translateY = mouseY - graphY * newScale;
      state.scale = newScale;
      drawCanvas(canvasId);
    }

    function handleCanvasPointerDown(event, canvasId) {
      if (event.button !== 0) return;
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const state = getCanvasState(canvasId);
      if (findCanvasNodeFromEvent(event, canvas, canvasId)) {
        state.isDragging = false;
        state.ignoreClick = false;
        canvas.style.cursor = "default";
        return;
      }
      state.isDragging = true;
      state.pointerStartX = event.clientX;
      state.pointerStartY = event.clientY;
      state.startTranslateX = state.translateX;
      state.startTranslateY = state.translateY;
      state.ignoreClick = false;
      canvas.style.cursor = "grabbing";
      activeDragCanvasId = canvasId;
    }

    function handleCanvasPointerMove(event) {
      if (!activeDragCanvasId) return;
      const state = getCanvasState(activeDragCanvasId);
      if (!state.isDragging) return;
      const dx = event.clientX - state.pointerStartX;
      const dy = event.clientY - state.pointerStartY;
      if (Math.abs(dx) + Math.abs(dy) > 5) {
        state.ignoreClick = true;
      }
      state.translateX = state.startTranslateX + dx;
      state.translateY = state.startTranslateY + dy;
      const canvas = document.getElementById(activeDragCanvasId);
      if (canvas) {
        canvas.style.cursor = "grabbing";
      }
      drawCanvas(activeDragCanvasId);
    }

    function handleCanvasPointerUp(event) {
      if (!activeDragCanvasId) return;
      const canvasId = activeDragCanvasId;
      const state = getCanvasState(activeDragCanvasId);
      state.isDragging = false;
      activeDragCanvasId = null;
      const canvas = document.getElementById(canvasId);
      if (canvas && event) {
        updateCanvasCursor(event, canvasId);
      } else if (canvas) {
        canvas.style.cursor = "default";
      }
    }

    window.addEventListener("mousemove", handleCanvasPointerMove);
    window.addEventListener("mouseup", handleCanvasPointerUp);
    // calls the drawCanvas function and reports in console.
    // window.addEventListener("load", drawCanvas);window.addEventListener("load", drawCanvas());

const CATEGORY_COLORS = {
      Locations: "#D65A3A",
      Individuals: "#2F73B8",
      Animals: "#2F8F5B",
      Dates: "#B9830D",
      References: "#7A4BC2",
      Footnotes: "#667085",
    };

    const TAG_HIGHLIGHT_CATEGORY_ORDER = [
      "Locations",
      "Individuals",
      "Animals",
      "Dates",
      "References",
      "Footnotes",
    ];

    const TAG_DATA_LOCATIONS = [
      "get_tags.php",
      "/Lemma/get_tags.php",
      "/test.aghvesagirk.com/Lemma/get_tags.php",
      "../../admin.aghvesagirk.com/tags.json",
      "/admin.aghvesagirk.com/tags.json",
      "https://admin.aghvesagirk.com/tags.json",
    ];

    // imported JSON variables
    let lemmaNodes = null;
    let title = null;
    let rankCount = null;
    let targetCount = null;
    let occurrences = null;
    let actual_time_zone_cuts = null;
    let extrasList = null;
    let keyMap = null;

    // my variables
    let lemmas = null;
    let TitleSections = null;
    let thisFileLocation = `converted/section-3504207.json`;
    let savedTagsData = null;
    let tagsLoadPromise = null;
    const activeHighlightCategories = new Set();

    function getArmenianTextBody() {
      const armenianTextContainer = document.getElementById("armenianText");
      return armenianTextContainer ? armenianTextContainer.querySelector("p") : null;
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;",
      }[char]));
    }

    function escapeRegExp(value) {
      return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function getTextColorForBackground(hexColor) {
      const color = String(hexColor || "").replace("#", "");
      if (color.length !== 6) return "#111";

      const red = parseInt(color.slice(0, 2), 16);
      const green = parseInt(color.slice(2, 4), 16);
      const blue = parseInt(color.slice(4, 6), 16);
      const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
      return brightness > 145 ? "#111" : "#fff";
    }

    async function loadSavedTagsData(force = false) {
      if (savedTagsData && !force) return savedTagsData;
      if (tagsLoadPromise) return tagsLoadPromise;

      tagsLoadPromise = (async () => {
        let lastError = null;

        for (const location of TAG_DATA_LOCATIONS) {
          try {
            const response = await fetch(location, { cache: "no-store" });
            if (!response.ok) {
              throw new Error(`${response.status} ${response.statusText}`);
            }

            savedTagsData = await response.json();
            return savedTagsData;
          } catch (error) {
            lastError = error;
            console.warn(`Could not load tag highlights from ${location}:`, error);
          }
        }

        throw lastError || new Error("No tag data location was available.");
      })();

      try {
        return await tagsLoadPromise;
      } finally {
        tagsLoadPromise = null;
      }
    }

    function getActiveHighlightTags() {
      if (!savedTagsData || !activeHighlightCategories.size) return [];

      const tagMap = new Map();
      TAG_HIGHLIGHT_CATEGORY_ORDER.forEach((category) => {
        if (!activeHighlightCategories.has(category)) return;

        const items = savedTagsData[category];
        if (!Array.isArray(items)) return;

        items.forEach((item) => {
          const text = item && item.text ? item.text.trim() : "";
          if (!text || tagMap.has(text)) return;

          tagMap.set(text, {
            text,
            category,
            color: CATEGORY_COLORS[category] || "#ccc",
          });
        });
      });

      return Array.from(tagMap.values()).sort((a, b) => b.text.length - a.text.length);
    }

    function renderArmenianText() {
      const textElement = getArmenianTextBody();
      if (!textElement || typeof lemmas !== "string") return;

      const tags = getActiveHighlightTags();
      if (!tags.length) {
        textElement.textContent = lemmas;
        return;
      }

      const tagByText = new Map(tags.map((tag) => [tag.text, tag]));
      const tagPattern = tags.map((tag) => escapeRegExp(tag.text)).join("|");
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${tagPattern})(?=$|[^\\p{L}\\p{N}_])`, "gu");

      let html = "";
      let lastIndex = 0;
      let matchResult = null;

      while ((matchResult = regex.exec(lemmas)) !== null) {
        const prefix = matchResult[1];
        const match = matchResult[2];
        const tag = tagByText.get(match);
        html += escapeHtml(lemmas.slice(lastIndex, matchResult.index));
        html += escapeHtml(prefix);
        lastIndex = matchResult.index + matchResult[0].length;

        if (!tag) {
          html += escapeHtml(match);
          continue;
        }

        const label = `${tag.category}: ${match}`;
        const textColor = getTextColorForBackground(tag.color);
        html += `<span class="reader-tag-highlight" title="${escapeHtml(label)}" style="background-color: ${tag.color}; color: ${textColor};">${escapeHtml(match)}</span>`;
      }

      html += escapeHtml(lemmas.slice(lastIndex));
      textElement.innerHTML = html;
    }

    async function handleHighlightCategoryChange(event) {
      const checkbox = event.currentTarget;
      const category = checkbox.dataset.highlightCategory;
      if (!category) return;

      if (checkbox.checked) {
        activeHighlightCategories.add(category);
      } else {
        activeHighlightCategories.delete(category);
      }

      if (activeHighlightCategories.size) {
        try {
          await loadSavedTagsData();
        } catch (error) {
          console.error("Could not load tag highlights:", error);
          checkbox.checked = false;
          activeHighlightCategories.delete(category);
        }
      }

      renderArmenianText();
    }

    function setupHighlightToggles() {
      document.querySelectorAll("[data-highlight-category]").forEach((checkbox) => {
        checkbox.addEventListener("change", handleHighlightCategoryChange);
      });
    }

    function getLemmaDisplayText(node) {
      return node.normal_form || node.text || "";
    }

    // Function to filter lemmas and display in #armenianText
    function filterAndDisplayLemmas() {
      if (lemmaNodes) {
        // making sure its loaded
        lemmas = lemmaNodes
          .filter((node) => node.is_lemma)
          .map(getLemmaDisplayText)
          .filter(Boolean)
          .join(" ");
        renderArmenianText();
      } else {
        console.warn("lemmaNodes is not loaded yet");
      }
    }

    // load json data
    function importTheVariables(data) {
      if (!data || !Array.isArray(data.nodes) || !data.title) {
        setReaderStatus("Invalid text data: expected title and nodes.", "error");
        console.error("Invalid JSON data:", data);
        return;
      }

      lemmaNodes = [...data.nodes];
      title = data.title || "Untitled";
      rankCount = data.rankCount || {};
      targetCount = data.targetCount || {};
      occurrences = data.occurrences || {};
      actual_time_zone_cuts = data.actual_time_zone_cuts || null;
      extrasList = data.extrasList || [];
      keyMap = data.keyMap || {};

      // Update HTML elements with the latest title
      document.getElementById("bookTitle_Arm").textContent = title;
      document.getElementById("bookTitle_Eng").textContent = title;

      console.log("data is loaded: ", {
        title,
        rankCount,
        targetCount,
        occurrences,
        actual_time_zone_cuts,
        extrasList,
        keyMap,
      });
    }

    function parseGraphMLText(xmlText) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");
      if (xmlDoc.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid XML document");
      }

      const keyMapById = {};
      Array.from(xmlDoc.getElementsByTagName("key")).forEach((key) => {
        const id = key.getAttribute("id");
        const name = key.getAttribute("attr.name") || key.getAttribute("name");
        if (id && name) {
          keyMapById[id] = name;
        }
      });

      const nodes = Array.from(xmlDoc.getElementsByTagName("node")).map((nodeEl) => {
        const nodeObj = { id: nodeEl.getAttribute("id") };
        Array.from(nodeEl.getElementsByTagName("data")).forEach((dataEl) => {
          const keyId = dataEl.getAttribute("key");
          const name = keyMapById[keyId] || keyId;
          const value = dataEl.textContent || "";
          nodeObj[name] = parseGraphMLValue(value, name);
        });
        return nodeObj;
      });

      const graphEl = xmlDoc.getElementsByTagName("graph")[0];
      const titleValue = graphEl ? graphEl.getAttribute("id") || "Untitled" : "Untitled";
      const edges = Array.from(xmlDoc.getElementsByTagName("edge")).map((edgeEl) => {
        const edgeObj = {
          id: edgeEl.getAttribute("id"),
          source: edgeEl.getAttribute("source"),
          target: edgeEl.getAttribute("target"),
        };

        Array.from(edgeEl.getElementsByTagName("data")).forEach((dataEl) => {
          const keyId = dataEl.getAttribute("key");
          const name = keyMapById[keyId] || keyId;
          const value = dataEl.textContent || "";
          edgeObj[name] = parseGraphMLValue(value, name);
        });

        return edgeObj;
      });

      return {
        title: titleValue,
        nodes,
        edges,
        rankCount: {},
        targetCount: {},
        occurrences: {},
        actual_time_zone_cuts: null,
        extrasList: [],
        keyMap: keyMapById,
      };
    }

    function convertGraphMLToCanvasNodes(graphData) {
      const rawNodes = graphData.nodes || [];
      const rawEdges = graphData.edges || [];
      const idToIndex = {};

      function getTextLabel(rawNode) {
        return rawNode.normal_form !== undefined && rawNode.normal_form !== null && rawNode.normal_form !== ""
          ? rawNode.normal_form
          : " ";
      }

      function getRankValue(rawNode, fallback) {
        return rawNode.rank !== undefined && rawNode.rank !== null && rawNode.rank !== ""
          ? rawNode.rank
          : fallback;
      }

      function shouldIgnoreGraphMLNode(rawNode) {
        if (rawNode.is_start === true || rawNode.is_end === true) return true;
        if (rawNode.neolabel === "[SECTION]") return true;

        return Object.values(rawNode).some((value) => {
          if (typeof value !== "string") return false;
          const normalizedValue = value.trim();
          return normalizedValue === "#START#" || normalizedValue.startsWith("milestone");
        });
      }

      const visibleRawNodes = rawNodes.filter((rawNode) => !shouldIgnoreGraphMLNode(rawNode));

      const canvasNodes = visibleRawNodes.map((rawNode, index) => {
        const text = getTextLabel(rawNode);
        const rank = getRankValue(rawNode, index + 1);
        const node = {
          id: rawNode.id,
          text,
          rank,
          isLemma: rawNode.is_lemma === true,
          arrows: [],
          isClicked: false,
        };
        idToIndex[rawNode.id] = index;
        return node;
      });

      if (rawEdges.length) {
        rawEdges.forEach((edge) => {
          const sourceIndex = idToIndex[edge.source];
          const targetIndex = idToIndex[edge.target];
          if (sourceIndex !== undefined && targetIndex !== undefined) {
            canvasNodes[sourceIndex].arrows.push(targetIndex + 1);
          }
        });
      } else {
        visibleRawNodes.forEach((rawNode) => {
          const sourceIndex = idToIndex[rawNode.id];
          if (sourceIndex === undefined || !Array.isArray(rawNode.targets)) return;

          rawNode.targets.forEach((targetId) => {
            const targetIndex = idToIndex[targetId];
            if (targetIndex !== undefined) {
              canvasNodes[sourceIndex].arrows.push(targetIndex + 1);
            }
          });
        });
      }

      canvasNodes.forEach((node) => {
        node.arrows = Array.from(new Set(node.arrows));
      });

      return canvasNodes;
    }

    function convertJsonToCanvasNodes(data) {
      return convertGraphMLToCanvasNodes({
        nodes: data && Array.isArray(data.nodes) ? data.nodes : [],
        edges: [],
      });
    }

    function parseGraphMLValue(value, name) {
      const trimmed = value.trim();
      if (trimmed === "true") return true;
      if (trimmed === "false") return false;
      if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          return trimmed;
        }
      }
      return trimmed;
    }

    // Load JSON text and XML graph by section ID
    function loadSectionData(fileId) {
      if (!fileId) {
        setReaderStatus("No section id was provided.", "error");
        return;
      }

      currentSectionId = fileId;
      updateSelectedSectionInUrl(fileId);
      setActiveIndexItem(fileId);
      setReaderStatus(`Loading ${fileId}...`);

      const jsonLocation = `converted/${fileId}.json`;
      const xmlLocation = `xml/${fileId}.xml`;

      const textPromise = fetch(jsonLocation)
        .then((response) => {
          if (!response.ok) throw new Error(response.statusText);
          return response.json();
        })
        .then((data) => {
          console.log(`${fileId}.json loaded successfully`);
          importTheVariables(data);
          filterAndDisplayLemmas();
          return { success: true, data };
        })
        .catch((error) => {
          console.error(`Failed to load ${fileId}.json:`, error);
          return { success: false, error };
        });

      const graphPromise = fetch(xmlLocation)
        .then((response) => {
          if (!response.ok) throw new Error(response.statusText);
          return response.text();
        })
        .then((text) => {
          const graphData = parseGraphMLText(text);
          nodes = convertGraphMLToCanvasNodes(graphData);
          console.log(`${fileId}.xml loaded successfully`, graphData);
          return { success: true };
        })
        .catch((error) => {
          console.warn(`Failed to load ${fileId}.xml:`, error);
          nodes = [];
          return { success: false, error };
        });

      Promise.all([textPromise, graphPromise]).then(([textResult, graphResult]) => {
        if (!textResult.success) {
          setReaderStatus(`Failed to load ${fileId}.json`, "error");
          return;
        }

        if (!graphResult.success) {
          nodes = convertJsonToCanvasNodes(textResult.data);
          setReaderStatus("Warning: XML format Graph data was not found, using JSON", "warning");
        } else {
          setReaderStatus(`Loaded ${title}.`);
        }

        resetCanvasState("myCanvas");
        const cb = document.querySelector("#cb-toggle");
        if (cb && cb.checked) {
          drawCanvas("myCanvas");
        }
      });
    }

    // Click event listener on yearbox class divs
    document.addEventListener("DOMContentLoaded", () => {
      const indexPanel = document.getElementById("index-panel");
      setupHighlightToggles();
      initializeIndexPanelItems();
      setReaderStatus("Loading default section...");

      // Use event delegation for handling dynamically added .year-box elements
      indexPanel.addEventListener("click", (event) => {
        const target = event.target.closest(".year-box");

        // Check if the clicked element has the 'year-box' class
        if (target) {
          const fileId = target.id;
          if (fileId) {
            loadSectionData(fileId);
          }
        }
      });

      indexPanel.addEventListener("keydown", (event) => {
        const target = event.target.closest(".year-box");
        if (!target) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          loadSectionData(target.id);
        }
      });

      const overviewCanvas = document.getElementById("overviewCanvas");
      if (overviewCanvas) {
        overviewCanvas.addEventListener("click", handleOverviewClick);
      }

      const resetButton = document.getElementById("graph-reset");
      if (resetButton) {
        resetButton.addEventListener("click", resetGraphView);
      }

      const zoomInButton = document.getElementById("graph-zoom-in");
      if (zoomInButton) {
        zoomInButton.addEventListener("click", () => zoomCanvas(1.2));
      }

      const zoomOutButton = document.getElementById("graph-zoom-out");
      if (zoomOutButton) {
        zoomOutButton.addEventListener("click", () => zoomCanvas(0.8));
      }

      indexPanelLoadPromise.finally(() => {
        const requestedSectionId = getRequestedSectionIdFromUrl() || DEFAULT_SECTION_ID;
        loadSectionData(requestedSectionId);
      });
    });

    // drawCanvas();
    // loadSectionData('section-3504207');
    // document.getElementById("cb-toggle").click();

