import * as d3 from 'd3';

export interface BubbleNode {
  id: string;
  r: number;
  x?: number;
  y?: number;
  colorIndex: number;
  isProject?: boolean;
  isExpanded?: boolean;
  children?: BubbleNode[];
}

export function layoutBubbles(
  nodes: BubbleNode[],
  width: number,
  height: number
): BubbleNode[] {
  if (nodes.length === 0) return [];

  const padding = 12;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  // Use d3 force simulation for flexible layout
  const simNodes = nodes.map(n => ({ ...n, x: usableWidth / 2, y: usableHeight / 2 }));

  const sim = d3.forceSimulation(simNodes as d3.SimulationNodeDatum[])
    .force('charge', d3.forceManyBody().strength(5))
    .force('center', d3.forceCenter(usableWidth / 2, usableHeight / 2))
    .force(
      'collision',
      d3.forceCollide<BubbleNode & d3.SimulationNodeDatum>().radius(d => d.r + 6)
    )
    .force(
      'boundary',
      boundaryForce(simNodes as (BubbleNode & d3.SimulationNodeDatum)[], usableWidth, usableHeight)
    )
    .stop();

  // Run simulation ticks synchronously
  for (let i = 0; i < 300; i++) {
    sim.tick();
    // Clamp to boundary
    (simNodes as (BubbleNode & d3.SimulationNodeDatum)[]).forEach(node => {
      const r = (node as BubbleNode).r;
      node.x = Math.max(r + padding, Math.min(usableWidth - r + padding, node.x ?? usableWidth / 2));
      node.y = Math.max(r + padding, Math.min(usableHeight - r + padding, node.y ?? usableHeight / 2));
    });
  }

  return simNodes.map(n => ({
    ...n,
    x: n.x,
    y: n.y,
  })) as BubbleNode[];
}

function boundaryForce(
  nodes: (BubbleNode & d3.SimulationNodeDatum)[],
  width: number,
  height: number
) {
  return () => {
    nodes.forEach(node => {
      const r = node.r;
      const padding = 8;
      const x = node.x ?? width / 2;
      const y = node.y ?? height / 2;
      if (x - r < padding) node.vx = (node.vx ?? 0) + (padding - (x - r)) * 0.3;
      if (x + r > width - padding) node.vx = (node.vx ?? 0) - ((x + r) - (width - padding)) * 0.3;
      if (y - r < padding) node.vy = (node.vy ?? 0) + (padding - (y - r)) * 0.3;
      if (y + r > height - padding) node.vy = (node.vy ?? 0) - ((y + r) - (height - padding)) * 0.3;
    });
  };
}
