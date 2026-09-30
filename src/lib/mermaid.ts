export type FlowNode = { id: string; label: string; shape: 'rect' | 'round' | 'diamond' };
export type FlowEdge = { from: string; to: string; label: string; kind: string };
export type FlowGraph = { nodes: FlowNode[]; edges: FlowEdge[]; direction: 'TB' | 'BT' | 'LR' | 'RL' };
type Point = { x: number; y: number };

function statements(source: string): string[] | null {
  const result: string[] = [];
  let text = '', quote = false;
  const stack: string[] = [];
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote && c === '\\') { text += c + (source[++i] ?? ''); continue; }
    if (c === '"') quote = !quote;
    if (!quote) {
      if (!stack.length && source.slice(i, i + 2) === '%%') {
        while (i < source.length && source[i] !== '\n') i++;
        i--; continue;
      }
      if ('[({'.includes(c)) stack.push({ '[': ']', '(': ')', '{': '}' }[c]!);
      else if (']})'.includes(c) && stack.pop() !== c) return null;
      if (!stack.length && (c === ';' || c === '\n')) {
        if (text.trim()) result.push(text.trim());
        text = ''; continue;
      }
    }
    text += c;
  }
  if (quote || stack.length) return null;
  if (text.trim()) result.push(text.trim());
  return result;
}

function readNode(line: string, offset: number) {
  const match = /^\s*([\w]+(?:-[\w]+)*)/.exec(line.slice(offset));
  if (!match) return null;
  const id = match[1];
  let end = offset + match[0].length;
  while (end < line.length && /\s/.test(line[end])) end++;
  const opener = line[end];
  if (!opener || !'[({'.includes(opener)) return { node: { id, label: id, shape: 'rect' as const }, end, explicit: false };
  const closer = { '[': ']', '(': ')', '{': '}' }[opener]!;
  let label = '', quoted = false;
  end++;
  for (; end < line.length; end++) {
    const c = line[end];
    if (quoted && c === '\\') { label += c + (line[++end] ?? ''); continue; }
    if (c === '"') quoted = !quoted;
    if (!quoted && c === closer) break;
    if (!quoted && '[({]})'.includes(c)) return null;
    label += c;
  }
  if (end === line.length || quoted) return null;
  label = label.trim();
  if (label.startsWith('"')) {
    try { label = JSON.parse(label); } catch { return null; }
    if (typeof label !== 'string') return null;
  }
  return { node: { id, label, shape: (opener === '{' ? 'diamond' : opener === '(' ? 'round' : 'rect') as FlowNode['shape'] }, end: end + 1, explicit: true };
}

/** Unsupported Mermaid syntax deliberately falls back to source. */
export function parseFlowchart(source: string): FlowGraph | null {
  if (source.length > 32000) return null;
  const lines = statements(source.replace(/\r\n?/g, '\n'));
  if (!lines) return null;
  const header = /^(?:flowchart|graph)\s+(TB|TD|BT|LR|RL)$/i.exec(lines.shift() ?? '');
  if (!header) return null;
  const nodes = new Map<string, FlowNode>(), edges: FlowEdge[] = [];
  const add = (item: NonNullable<ReturnType<typeof readNode>>) => {
    if (!nodes.has(item.node.id) || item.explicit) nodes.set(item.node.id, item.node);
  };
  for (const line of lines) {
    let from = readNode(line, 0);
    if (!from) return null;
    add(from);
    while (line.slice(from.end).trim()) {
      const arrow = /^\s*(-->|---|-\.->|==>)\s*(?:\|([^|]*)\|\s*)?/.exec(line.slice(from.end));
      if (!arrow) return null;
      const to = readNode(line, from.end + arrow[0].length);
      if (!to) return null;
      add(to);
      edges.push({ from: from.node.id, to: to.node.id, kind: arrow[1], label: arrow[2] ?? '' });
      from = to;
      if (edges.length > 120) return null;
    }
    if (nodes.size > 60) return null;
  }
  if (!nodes.size || [...nodes.values()].some(n => n.label.length > 240) || edges.some(e => e.label.length > 120)) return null;
  return { nodes: [...nodes.values()], edges, direction: header[1].toUpperCase().replace('TD', 'TB') as FlowGraph['direction'] };
}

export function wrapLabel(label: string, limit = 26): string[] {
  const lines: string[] = [];
  for (const paragraph of label.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const chars = [...word];
      if (line && [...line].length + chars.length + 1 > limit) { lines.push(line); line = ''; }
      while (chars.length > limit) { lines.push(chars.splice(0, limit).join('')); }
      if (chars.length) line += (line ? ' ' : '') + chars.join('');
    }
    lines.push(line);
  }
  return lines;
}

export function layoutFlowchart(graph: FlowGraph) {
  // Remove DFS back edges before ranking so cycles retain a readable forward path.
  const outgoing = new Map(graph.nodes.map(n => [n.id, graph.edges.filter(e => e.from === n.id)]));
  const state = new Map<string, number>(), back = new Set<FlowEdge>(), order: string[] = [];
  const visit = (id: string) => {
    if (state.has(id)) return;
    state.set(id, 1);
    for (const edge of outgoing.get(id)!) {
      if (state.get(edge.to) === 1) back.add(edge);
      else visit(edge.to);
    }
    state.set(id, 2); order.push(id);
  };
  for (const node of graph.nodes.filter(n => !graph.edges.some(e => e.to === n.id))) visit(node.id);
  for (const node of graph.nodes) visit(node.id);
  const rank = new Map(graph.nodes.map(n => [n.id, 0]));
  for (const id of order.reverse()) for (const edge of outgoing.get(id)!) {
    if (!back.has(edge)) rank.set(edge.to, Math.max(rank.get(edge.to)!, rank.get(id)! + 1));
  }
  const horizontal = graph.direction === 'LR' || graph.direction === 'RL';
  const sign = graph.direction === 'RL' || graph.direction === 'BT' ? -1 : 1;
  const sizes = graph.nodes.map(node => {
    const lines = wrapLabel(node.label);
    const textWidth = Math.max(...lines.map(l => [...l].length)) * 8;
    return { ...node, lines, rank: rank.get(node.id)!, width: Math.max(120, textWidth * (node.shape === 'diamond' ? 2 : 1) + 40), height: Math.max(56, lines.length * 18 * (node.shape === 'diamond' ? 2 : 1) + 32) };
  });
  const alongSize = Math.max(...sizes.map(n => horizontal ? n.width : n.height));
  const crossSize = Math.max(...sizes.map(n => horizontal ? n.height : n.width));
  const maxRank = Math.max(...rank.values());
  const breadth = Math.max(...sizes.map(n => sizes.filter(other => other.rank === n.rank).length));
  const gap = 140, crossGap = 80, padding = 40;
  const baseCross = padding * 2 + breadth * crossSize + (breadth - 1) * crossGap;
  const point = (along: number, cross: number): Point => horizontal ? { x: along, y: cross } : { x: cross, y: along };
  const nodes = sizes.map(n => {
    const group = sizes.filter(other => other.rank === n.rank);
    return { ...n, ...point(padding + alongSize / 2 + (sign === 1 ? n.rank : maxRank - n.rank) * (alongSize + gap), baseCross / 2 + (group.indexOf(n) - (group.length - 1) / 2) * (crossSize + crossGap)) };
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  let outerLane = 0;
  const edges = graph.edges.map((edge, index) => {
    const from = byId.get(edge.from)!, to = byId.get(edge.to)!;
    const a = horizontal ? from.x : from.y, b = horizontal ? to.x : to.y;
    const c = horizontal ? from.y : from.x, d = horizontal ? to.y : to.x;
    const start = point(a + sign * (horizontal ? from.width : from.height) / 2, c);
    const end = point(b - sign * (horizontal ? to.width : to.height) / 2, d);
    let points: Point[], labelPoint: Point;
    if (!back.has(edge) && to.rank === from.rank + 1) {
      const siblings = graph.edges.filter(e => e.from === edge.from && rank.get(e.to) === from.rank + 1);
      const middle = (a + b) / 2 + Math.max(-gap / 4, Math.min(gap / 4, (siblings.indexOf(edge) - (siblings.length - 1) / 2) * 10));
      points = [start, point(middle, c), point(middle, d), end];
      labelPoint = horizontal ? point(middle, (c + d) / 2 - 12) : point(middle - 12, (c + d) / 2 + (c === d ? 70 : 0));
    } else {
      const lane = baseCross + 40 + outerLane++ * 110;
      const exit = a + sign * (alongSize / 2 + 30 + index % 4 * 12);
      const entry = b - sign * (alongSize / 2 + 30 + index % 4 * 12);
      points = [start, point(exit, c), point(exit, lane), point(entry, lane), point(entry, d), end];
      labelPoint = horizontal ? point((exit + entry) / 2, lane - 12) : point((exit + entry) / 2, lane + 70);
    }
    return { ...edge, points, labelPoint, lines: wrapLabel(edge.label, 18) };
  });
  const bounds: Point[] = nodes.flatMap(n => [{ x: n.x - n.width / 2, y: n.y - n.height / 2 }, { x: n.x + n.width / 2, y: n.y + n.height / 2 }]);
  for (const edge of edges) {
    bounds.push(...edge.points);
    if (edge.label) {
      const halfWidth = Math.max(...edge.lines.map(l => [...l].length)) * 3.5;
      bounds.push({ x: edge.labelPoint.x - halfWidth, y: edge.labelPoint.y - 12 }, { x: edge.labelPoint.x + halfWidth, y: edge.labelPoint.y + edge.lines.length * 14 });
    }
  }
  const dx = Math.max(0, padding - Math.min(...bounds.map(p => p.x)));
  const dy = Math.max(0, padding - Math.min(...bounds.map(p => p.y)));
  for (const n of nodes) { n.x += dx; n.y += dy; }
  for (const e of edges) { for (const p of [...e.points, e.labelPoint]) { p.x += dx; p.y += dy; } }
  return { nodes, edges, width: Math.max(...bounds.map(p => p.x)) + dx + padding, height: Math.max(...bounds.map(p => p.y)) + dy + padding };
}
