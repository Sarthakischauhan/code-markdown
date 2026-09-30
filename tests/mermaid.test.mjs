import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFlowchart, layoutFlowchart, wrapLabel } from '../src/lib/mermaid.ts';

const parse = source => { const graph = parseFlowchart(source); assert.ok(graph); return graph; };
test('chains, explicit shapes, comments and quoted delimiters', () => {
  const graph = parse('flowchart LR\nA["one; (two)"]-->B(B) -.->|retry| C{Ready?} %% comment\nB-->A');
  assert.equal(graph.edges.length, 3);
  assert.equal(graph.nodes[0].label, 'one; (two)');
  assert.equal(graph.nodes[1].shape, 'round');
  assert.equal(graph.nodes[2].shape, 'diamond');
});
test('unsupported and oversized source safely falls back', () => {
  for (const source of ['sequenceDiagram\nA->>B: hi', 'flowchart LR\nA-->B\nstyle A fill:red', 'flowchart LR\nA[broken', 'flowchart LR\nA((circle))', 'x'.repeat(32001)]) assert.equal(parseFlowchart(source), null);
});
test('long labels wrap without losing text', () => {
  const label = 'A long label that previously disappeared after thirty six characters';
  assert.equal(wrapLabel(label).join(' '), label);
  assert.equal(wrapLabel('a'.repeat(100)).join(''), 'a'.repeat(100));
  assert.ok(wrapLabel(label).every(line => line.length <= 26));
});
function intersects(p, q, node) {
  const left = node.x - node.width / 2, right = node.x + node.width / 2;
  const top = node.y - node.height / 2, bottom = node.y + node.height / 2;
  if (p.x === q.x) return p.x > left && p.x < right && Math.max(p.y, q.y) > top && Math.min(p.y, q.y) < bottom;
  assert.equal(p.y, q.y);
  return p.y > top && p.y < bottom && Math.max(p.x, q.x) > left && Math.min(p.x, q.x) < right;
}
for (const direction of ['TB', 'BT', 'LR', 'RL']) {
  test(`${direction}: cycles, branches, skip links and self-loops avoid node interiors`, () => {
    const layout = layoutFlowchart(parse(`flowchart ${direction}\nA[Start]-->B{Ready?}-->C[Done]\nB-->D[Retry]\nD-->A\nA-->C\nC-->C`));
    assert.equal(layout.nodes.find(n => n.id === 'A').rank, 0);
    assert.equal(layout.nodes.find(n => n.id === 'B').rank, 1);
    assert.equal(layout.nodes.find(n => n.id === 'C').rank, 2);
    for (const edge of layout.edges) for (let i = 1; i < edge.points.length; i++) {
      for (const node of layout.nodes) assert.ok(!intersects(edge.points[i - 1], edge.points[i], node), `${edge.from}->${edge.to} intersects ${node.id}`);
    }
    for (const node of layout.nodes) {
      assert.ok(node.x - node.width / 2 >= 0 && node.y - node.height / 2 >= 0);
      assert.ok(node.x + node.width / 2 <= layout.width && node.y + node.height / 2 <= layout.height);
    }
  });
}
test('disconnected components and pure cycles stay finite', () => {
  const layout = layoutFlowchart(parse('graph TB\nA-->B-->A\nC-->D\nE'));
  assert.equal(new Set(layout.nodes.map(n => `${n.x},${n.y}`)).size, 5);
  assert.ok(Number.isFinite(layout.width) && Number.isFinite(layout.height));
});
