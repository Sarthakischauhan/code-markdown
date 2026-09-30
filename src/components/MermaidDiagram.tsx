import { useId, useMemo } from "react";
import { layoutFlowchart, parseFlowchart } from "../lib/mermaid";
export { parseFlowchart } from "../lib/mermaid";

/** Returns null for unsupported syntax so the caller can show the original source. */
export function MermaidDiagram({ source }: { source: string }) {
  const markerId = 'mermaid-arrow-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const layout = useMemo(() => {
    const graph = parseFlowchart(source);
    return graph ? layoutFlowchart(graph) : null;
  }, [source]);
  if (!layout) return null;
  return (
    <div className="code-markdown__diagram" role="img" aria-label={"Flowchart: " + layout.nodes.map(n => n.label).join(', ') + '. Connections: ' + layout.edges.map(e => e.from + ' to ' + e.to + (e.label ? ': ' + e.label : '')).join(', ')}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height}>
        <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
          <path d="M0 0 L8 4 L0 8" fill="none" stroke="currentColor" />
        </marker></defs>
        {layout.edges.map((edge, index) => <g key={index}>
          <path d={edge.points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')} fill="none" stroke="currentColor"
            strokeWidth={edge.kind === '==>' ? 2.5 : 1.5} strokeDasharray={edge.kind === '-.->' ? '5 4' : undefined}
            markerEnd={edge.kind === '---' ? undefined : `url(#${markerId})`} />
          {edge.label && <text x={edge.labelPoint.x} y={edge.labelPoint.y} textAnchor="middle" className="code-markdown__diagram-edge-label">
            {edge.lines.map((line, i) => <tspan key={i} x={edge.labelPoint.x} dy={i ? 14 : 0}>{line}</tspan>)}
          </text>}
        </g>)}
        {layout.nodes.map(node => <g key={node.id} className="code-markdown__diagram-node">
          <title>{node.label}</title>
          {node.shape === 'diamond'
            ? <path d={`M${node.x} ${node.y - node.height / 2} L${node.x + node.width / 2} ${node.y} L${node.x} ${node.y + node.height / 2} L${node.x - node.width / 2} ${node.y} Z`} />
            : <rect x={node.x - node.width / 2} y={node.y - node.height / 2} width={node.width} height={node.height} rx={node.shape === 'round' ? 25 : 7} />}
          <text x={node.x} y={node.y - (node.lines.length - 1) * 9} textAnchor="middle" dominantBaseline="central">
            {node.lines.map((line, i) => <tspan key={i} x={node.x} dy={i ? 18 : 0}>{line}</tspan>)}
          </text>
        </g>)}
      </svg>
    </div>
  );
}
