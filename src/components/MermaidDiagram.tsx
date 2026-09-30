import { useMemo } from "react";

type Shape = "rect" | "round" | "diamond" | "circle";
type Node = { id: string; label: string; shape: Shape };
type Edge = { from: string; to: string; label: string; kind: string };
type Graph = { nodes: Node[]; edges: Edge[]; direction: "TB" | "BT" | "LR" | "RL" };

const nodePattern = /^([\w-]+)(?:\["([^"]*)"\]|\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\})?$/;
const edgePattern = /^(.+?)\s*(-->|---|-.->|==>)(?:\|([^|]*)\|)?\s*(.+)$/;

function parseNode(input: string): Node | null {
  const match = nodePattern.exec(input.trim());
  if (!match) return null;
  return {
    id: match[1],
    label: match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[1],
    shape: match[5] !== undefined ? "diamond" : match[4] !== undefined ? "round" : "rect",
  };
}

/** Deliberately small, safe subset of Mermaid flowchart syntax. */
export function parseFlowchart(source: string): Graph | null {
  const lines = source.replace(/\r\n?/g, "\n").split(/\n|;/).map((line) => line.trim()).filter(Boolean);
  const header = /^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)$/i.exec(lines.shift() ?? "");
  if (!header) return null;
  const nodes = new Map<string, Node>();
  const edges: Edge[] = [];
  for (const line of lines) {
    if (line.startsWith("%%")) continue;
    const edge = edgePattern.exec(line);
    if (edge) {
      const from = parseNode(edge[1]);
      const to = parseNode(edge[4]);
      if (!from || !to) return null;
      for (const node of [from, to]) {
        const existing = nodes.get(node.id);
        if (!existing || node.label !== node.id) nodes.set(node.id, node);
      }
      edges.push({ from: from.id, to: to.id, kind: edge[2], label: edge[3] ?? "" });
    } else {
      const node = parseNode(line);
      if (!node) return null;
      nodes.set(node.id, node);
    }
    if (nodes.size > 60 || edges.length > 120) return null;
  }
  if (!nodes.size || [...nodes.values()].some((node) => node.label.length > 120)) return null;
  return {
    nodes: [...nodes.values()],
    edges,
    direction: header[1].toUpperCase() === "TD" ? "TB" : header[1].toUpperCase() as Graph["direction"],
  };
}

type Props = { source: string };

/** Returns null for unsupported syntax so the caller can show the original source. */
export function MermaidDiagram({ source }: Props) {
  const graph = useMemo(() => parseFlowchart(source), [source]);
  if (!graph) return null;

  const horizontal = graph.direction === "LR" || graph.direction === "RL";
  const reverse = graph.direction === "BT" || graph.direction === "RL";
  const levels = new Map(graph.nodes.map((node) => [node.id, 0]));
  // Bound relaxation: cycles stay at a finite level and still render.
  for (let i = 0; i < graph.nodes.length; i++) {
    let changed = false;
    for (const edge of graph.edges) {
      const next = Math.min(graph.nodes.length - 1, (levels.get(edge.from) ?? 0) + 1);
      if (next > (levels.get(edge.to) ?? 0)) {
        levels.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const groups = new Map<number, Node[]>();
  for (const node of graph.nodes) {
    const level = levels.get(node.id) ?? 0;
    groups.set(level, [...(groups.get(level) ?? []), node]);
  }
  const maxLevel = Math.max(...groups.keys());
  const maxBreadth = Math.max(...[...groups.values()].map((group) => group.length));
  const cellWidth = Math.max(160, Math.min(340, Math.max(...graph.nodes.map((node) => node.label.length)) * 8 + 40));
  const cellHeight = 110;
  const width = horizontal ? (maxLevel + 1) * (cellWidth + 70) : maxBreadth * (cellWidth + 30) + 30;
  const height = horizontal ? maxBreadth * (cellHeight + 30) + 30 : (maxLevel + 1) * (cellHeight + 30);
  const positions = new Map<string, { x: number; y: number }>();
  for (const [level, group] of groups) {
    group.forEach((node, index) => {
      const along = reverse ? maxLevel - level : level;
      const cross = index - (group.length - 1) / 2;
      positions.set(node.id, horizontal
        ? { x: (along + 0.5) * (cellWidth + 70), y: height / 2 + cross * (cellHeight + 30) }
        : { x: width / 2 + cross * (cellWidth + 30), y: (along + 0.5) * (cellHeight + 30) });
    });
  }
  const nodeWidth = cellWidth - 25;
  const nodeHeight = 56;

  return (
    <div className="code-markdown__diagram" role="img" aria-label={"Flowchart: " + graph.nodes.map((node) => node.label).join(", ")}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={"0 0 " + width + " " + height} width={width} height={height}>
        <defs>
          <marker id="code-markdown-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" />
          </marker>
        </defs>
        {graph.edges.map((edge, index) => {
          const from = positions.get(edge.from)!;
          const to = positions.get(edge.to)!;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const xOffset = Math.sign(dx) * (horizontal ? nodeWidth / 2 : Math.min(nodeWidth / 2, Math.abs(dx) / 3));
          const yOffset = Math.sign(dy) * (horizontal ? Math.min(nodeHeight / 2, Math.abs(dy) / 3) : nodeHeight / 2);
          const x1 = from.x + xOffset;
          const y1 = from.y + yOffset;
          const x2 = to.x - xOffset;
          const y2 = to.y - yOffset;
          return (
            <g key={index}>
              <path d={"M" + x1 + " " + y1 + " L" + x2 + " " + y2} fill="none" stroke="currentColor"
                strokeWidth={edge.kind === "==>" ? 2.5 : 1.5}
                strokeDasharray={edge.kind === "-.->" ? "5 4" : undefined}
                markerEnd={edge.kind === "---" ? undefined : "url(#code-markdown-arrow)"} />
              {edge.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle"
                className="code-markdown__diagram-edge-label">{edge.label}</text>}
            </g>
          );
        })}
        {graph.nodes.map((node) => {
          const point = positions.get(node.id)!;
          return (
            <g key={node.id} className="code-markdown__diagram-node">
              {node.shape === "diamond"
                ? <path d={"M" + point.x + " " + (point.y - nodeHeight / 2) + " L" + (point.x + nodeWidth / 2) + " " + point.y + " L" + point.x + " " + (point.y + nodeHeight / 2) + " L" + (point.x - nodeWidth / 2) + " " + point.y + " Z"} />
                : <rect x={point.x - nodeWidth / 2} y={point.y - nodeHeight / 2} width={nodeWidth} height={nodeHeight} rx={node.shape === "round" ? 25 : 7} />}
              <text x={point.x} y={point.y} textAnchor="middle" dominantBaseline="central">
                {node.label.length > 36 ? node.label.slice(0, 35) + "…" : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
