import { useMemo, useRef, useState, useCallback } from 'react';
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import { cn } from '@/lib/utils';
import { Entity, Relation } from '@/types';

type GraphNode = NodeObject & {
  id: string;
  name: string;
  type: string;
};

type GraphLink = LinkObject & {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
  confidence: number;
  evidence: string[];
  notes?: string;
  curvature?: number;
};

const NODE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  event: { 
    fill: 'rgba(245, 158, 11, 0.9)', 
    stroke: 'rgba(251, 191, 36, 1)',
    glow: 'rgba(245, 158, 11, 0.5)'
  },
  location: { 
    fill: 'rgba(59, 130, 246, 0.9)', 
    stroke: 'rgba(96, 165, 250, 1)',
    glow: 'rgba(59, 130, 246, 0.5)'
  },
  unit: { 
    fill: 'rgba(34, 197, 94, 0.9)', 
    stroke: 'rgba(74, 222, 128, 1)',
    glow: 'rgba(34, 197, 94, 0.5)'
  },
  person: { 
    fill: 'rgba(20, 184, 166, 0.9)', 
    stroke: 'rgba(45, 212, 191, 1)',
    glow: 'rgba(20, 184, 166, 0.5)'
  },
  source: { 
    fill: 'rgba(100, 116, 139, 0.8)', 
    stroke: 'rgba(148, 163, 184, 1)',
    glow: 'rgba(100, 116, 139, 0.3)'
  }
};

const EDGE_COLORS: Record<string, { line: string; label: string }> = {
  conflicts_with: { line: 'rgba(239, 68, 68, 0.9)', label: 'rgba(254, 202, 202, 0.95)' },
  supports: { line: 'rgba(34, 197, 94, 0.8)', label: 'rgba(187, 247, 208, 0.95)' },
  located_at: { line: 'rgba(59, 130, 246, 0.8)', label: 'rgba(191, 219, 254, 0.95)' },
  participated_in: { line: 'rgba(168, 85, 247, 0.8)', label: 'rgba(233, 213, 255, 0.95)' },
  commanded_by: { line: 'rgba(245, 158, 11, 0.8)', label: 'rgba(254, 243, 199, 0.95)' },
  default: { line: 'rgba(148, 163, 184, 0.7)', label: 'rgba(226, 232, 240, 0.95)' }
};

function isLowConfidence(conf: number) {
  return conf < 0.4;
}

function formatRelationType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function ForceKnowledgeGraph(props: {
  className?: string;
  entities: Entity[];
  relations: Relation[];
  filterType?: string;
  onSelectEntity?: (e: Entity) => void;
  onSelectRelation?: (r: Relation) => void;
}) {
  const { className, entities, relations, filterType = 'all', onSelectEntity, onSelectRelation } = props;
  const fgRef = useRef<ForceGraphMethods | null>(null);

  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [hoverLinkId, setHoverLinkId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const nodeAllow = new Set(
      entities
        .filter((e) => filterType === 'all' || e.type === filterType)
        .map((e) => e.id)
    );

    const rels = relations.filter((r) => {
      if (filterType === 'all') return true;
      return nodeAllow.has(r.from) || nodeAllow.has(r.to);
    });

    rels.forEach((r) => {
      nodeAllow.add(r.from);
      nodeAllow.add(r.to);
    });

    const nodeMap = new Map<string, GraphNode>();

    entities
      .filter((e) => nodeAllow.has(e.id))
      .forEach((e) => {
        nodeMap.set(e.id, {
          id: e.id,
          name: e.name,
          type: e.type
        });
      });

    rels.forEach((r) => {
      [r.from, r.to].forEach((id) => {
        if (!nodeMap.has(id)) {
          nodeMap.set(id, {
            id,
            name: id,
            type: 'source'
          });
        }
      });
    });

    const nodes: GraphNode[] = Array.from(nodeMap.values());

    // Calculate curvature for parallel edges
    const edgePairs = new Map<string, number>();
    const links: GraphLink[] = rels.map((r) => {
      const pairKey = [r.from, r.to].sort().join('|');
      const count = edgePairs.get(pairKey) || 0;
      edgePairs.set(pairKey, count + 1);
      
      return {
        id: r.id,
        source: r.from,
        target: r.to,
        type: r.type,
        confidence: r.confidence,
        evidence: r.evidence || [],
        notes: (r as any).notes || undefined,
        curvature: count * 0.3
      };
    });

    return { nodes, links, relsById: new Map(rels.map((r) => [r.id, r])) };
  }, [entities, relations, filterType]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    filtered.links.forEach((l) => {
      const s = typeof l.source === 'object' ? l.source.id : String(l.source);
      const t = typeof l.target === 'object' ? l.target.id : String(l.target);
      if (!map.has(s)) map.set(s, new Set());
      if (!map.has(t)) map.set(t, new Set());
      map.get(s)!.add(t);
      map.get(t)!.add(s);
    });
    return map;
  }, [filtered.links]);

  const isConnectedToHover = useCallback((nodeId: string) => {
    if (!hoverNodeId) return true;
    if (nodeId === hoverNodeId) return true;
    return neighbors.get(hoverNodeId)?.has(nodeId) ?? false;
  }, [hoverNodeId, neighbors]);

  const drawNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const size = node.id === hoverNodeId ? 9 : 7;
    const c = NODE_COLORS[node.type] || NODE_COLORS.source;

    const connected = isConnectedToHover(node.id);
    const alpha = connected ? 1 : 0.15;

    ctx.globalAlpha = alpha;

    // Glow effect for hovered node
    if (node.id === hoverNodeId) {
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 20;
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fillStyle = c.fill;
    ctx.fill();
    
    // Inner highlight
    ctx.beginPath();
    ctx.arc(node.x - size * 0.25, node.y - size * 0.25, size * 0.4, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.lineWidth = node.id === hoverNodeId ? 2.5 : 1.5;
    ctx.strokeStyle = c.stroke;
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Label
    const showLabel = node.id === hoverNodeId || globalScale > 1.8;
    if (showLabel) {
      const fontSize = Math.max(11, 13 / globalScale);
      ctx.font = `500 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
      const textWidth = ctx.measureText(label).width;
      const padding = 6;
      const x = node.x + size + 8;
      const y = node.y - fontSize / 2;

      ctx.globalAlpha = connected ? 0.95 : 0.15;
      
      // Label background with rounded corners
      const radius = 4;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x - padding, y - padding, textWidth + padding * 2, fontSize + padding * 2, radius);
      ctx.fill();
      
      ctx.strokeStyle = c.stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
      ctx.fillText(label, x, y + fontSize);
    }
    ctx.globalAlpha = 1;
  }, [hoverNodeId, isConnectedToHover]);

  const drawLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source;
    const target = link.target;
    
    if (typeof source !== 'object' || typeof target !== 'object') return;
    
    const edgeColor = EDGE_COLORS[link.type] || EDGE_COLORS.default;
    const isConflict = link.type === 'conflicts_with';
    const isHovered = link.id === hoverLinkId;
    
    const sourceId = source.id;
    const targetId = target.id;
    const isConnected = !hoverNodeId || sourceId === hoverNodeId || targetId === hoverNodeId;
    
    const alpha = isConnected ? (isHovered ? 1 : 0.8) : 0.1;
    ctx.globalAlpha = alpha;

    // Calculate control point for curved edge
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const curvature = link.curvature || 0.2;
    const cpX = midX - dy * curvature;
    const cpY = midY + dx * curvature;

    // Draw edge line
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(cpX, cpY, target.x, target.y);
    ctx.strokeStyle = edgeColor.line;
    ctx.lineWidth = isHovered ? 3 : (isConflict ? 2.2 : 1.5);
    
    if (isLowConfidence(link.confidence) && !isConflict) {
      ctx.setLineDash([8, 5]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw arrow at target
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    // Get angle at the end of the curve
    const t = 0.85;
    const qx = (1-t)*(1-t)*source.x + 2*(1-t)*t*cpX + t*t*target.x;
    const qy = (1-t)*(1-t)*source.y + 2*(1-t)*t*cpY + t*t*target.y;
    const angle = Math.atan2(target.y - qy, target.x - qx);
    
    const arrowX = target.x - 8 * Math.cos(angle);
    const arrowY = target.y - 8 * Math.sin(angle);
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle - arrowAngle),
      arrowY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(
      arrowX - arrowLength * Math.cos(angle + arrowAngle),
      arrowY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.strokeStyle = edgeColor.line;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw edge label
    const showLabel = isHovered || globalScale > 1.2;
    if (showLabel && isConnected) {
      const labelText = formatRelationType(link.type);
      const confidenceText = `${Math.round(link.confidence * 100)}%`;
      
      const fontSize = Math.max(8, 10 / globalScale);
      ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
      
      const labelWidth = ctx.measureText(labelText).width;
      const confWidth = ctx.measureText(confidenceText).width;
      const totalWidth = labelWidth + confWidth + 10;
      const padding = 3;
      
      // Position label at curve midpoint
      const labelX = cpX - totalWidth / 2;
      const labelY = cpY - fontSize / 2 - 2;

      ctx.globalAlpha = isHovered ? 0.98 : (globalScale > 1.8 ? 0.9 : 0.75);
      
      // Label background
      ctx.fillStyle = 'rgba(10, 17, 30, 0.92)';
      ctx.beginPath();
      ctx.roundRect(labelX - padding, labelY - padding, totalWidth + padding * 2, fontSize + padding * 2, 3);
      ctx.fill();
      
      ctx.strokeStyle = edgeColor.line;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Label text
      ctx.fillStyle = edgeColor.label;
      ctx.fillText(labelText, labelX, labelY + fontSize);
      
      // Confidence badge
      ctx.fillStyle = isLowConfidence(link.confidence) 
        ? 'rgba(251, 191, 36, 0.9)' 
        : 'rgba(74, 222, 128, 0.9)';
      ctx.fillText(confidenceText, labelX + labelWidth + 6, labelY + fontSize);
    }

    ctx.globalAlpha = 1;
  }, [hoverNodeId, hoverLinkId]);

  return (
    <div className={cn('relative h-[600px] w-full overflow-hidden rounded-2xl border border-border/50 bg-background', className)}>
      {/* Legend */}
      <div className="absolute left-4 top-4 z-10 glass rounded-xl px-4 py-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">Node Types</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: NODE_COLORS.event.fill, boxShadow: `0 0 8px ${NODE_COLORS.event.glow}` }} /> Event
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: NODE_COLORS.location.fill, boxShadow: `0 0 8px ${NODE_COLORS.location.glow}` }} /> Location
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: NODE_COLORS.unit.fill, boxShadow: `0 0 8px ${NODE_COLORS.unit.glow}` }} /> Unit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: NODE_COLORS.person.fill, boxShadow: `0 0 8px ${NODE_COLORS.person.glow}` }} /> Person
          </span>
        </div>
        <div className="text-xs font-medium text-muted-foreground mt-3 mb-2">Edge Types</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full" style={{ background: EDGE_COLORS.conflicts_with.line }} /> Conflict
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full" style={{ background: EDGE_COLORS.supports.line }} /> Support
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full opacity-40" style={{ background: EDGE_COLORS.default.line, borderStyle: 'dashed' }} /> Low conf.
          </span>
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef as any}
        graphData={filtered}
        backgroundColor="hsl(222 47% 5%)"
        nodeRelSize={6}
        linkCurvature={(l: any) => l.curvature || 0.2}
        linkDirectionalParticles={(l: any) => (String(l.id) === hoverLinkId ? 4 : 0)}
        linkDirectionalParticleWidth={3}
        linkDirectionalParticleColor={(l: any) => {
          const edgeColor = EDGE_COLORS[l.type] || EDGE_COLORS.default;
          return edgeColor.line;
        }}
        nodeCanvasObject={drawNode}
        linkCanvasObjectMode={() => 'replace'}
        linkCanvasObject={drawLink}
        onNodeHover={(n: any) => setHoverNodeId(n ? String(n.id) : null)}
        onLinkHover={(l: any) => setHoverLinkId(l ? String(l.id) : null)}
        onNodeClick={(n: any) => {
          const ent = entities.find((e) => e.id === n.id);
          if (ent) onSelectEntity?.(ent);
        }}
        onLinkClick={(l: any) => {
          const rel = filtered.relsById.get(String(l.id));
          if (rel) onSelectRelation?.(rel);
        }}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 80)}
      />

      {/* Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          className="glass rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          onClick={() => fgRef.current?.zoomToFit(600, 60)}
        >
          Fit View
        </button>
        <button
          className="glass rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
          onClick={() => fgRef.current?.zoom(2.5, 400)}
        >
          Zoom In
        </button>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 z-10 glass rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <span className="font-mono">{filtered.nodes.length}</span> nodes · <span className="font-mono">{filtered.links.length}</span> edges
      </div>
    </div>
  );
}
