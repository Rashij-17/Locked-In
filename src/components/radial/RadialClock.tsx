'use client';

/* ============================================================
   LOCKED IN — Radial Clock Component
   Full 24-hour SVG radial clock with task arcs, tick marks,
   hour labels, center info panel, and live now-hand.
   ============================================================ */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { timeToAngle, polarToCartesian, buildArcPath, parseTime, formatTimeDisplay, formatDuration, durationMinutes, getTodayStr } from '@/lib/timeUtils';
import type { Task, Tag } from '@/types';
import TagPill from '@/components/ui/TagPill';

/* ---- Constants ---- */
const CX = 240;
const CY = 240;
const VIEWBOX = '0 0 480 480';
const TASK_ARC_R = 210;
const TASK_ARC_R_INNER = 194; // For overlapping arcs
const TICK_R_OUTER = 180;
const TICK_R_MAJOR = 170;
const TICK_R_MINOR = 175;
const LABEL_R = 155;
const CENTER_R = 90;

/* ---- Tag color → CSS variable mapping ---- */
const ARC_COLORS: Record<string, string> = {
  sage: 'var(--clock-arc-1)',
  amber: 'var(--clock-arc-2)',
  violet: 'var(--clock-arc-3)',
  coral: 'var(--clock-arc-4)',
  mint: 'var(--clock-arc-5)',
  sky: 'var(--clock-arc-1)',
};

/* ---- Tooltip State ---- */
interface TooltipData {
  x: number;
  y: number;
  task: Task;
  tag: Tag | undefined;
}

/* ---- Sub-component: Clock Tick Marks ---- */
const ClockTicks = React.memo(function ClockTicks() {
  const ticks: React.ReactElement[] = [];

  for (let h = 0; h < 24; h++) {
    // Major tick every hour
    const angle = timeToAngle(h, 0);
    const outer = polarToCartesian(CX, CY, TICK_R_OUTER, angle);
    const inner = polarToCartesian(CX, CY, TICK_R_MAJOR, angle);
    ticks.push(
      <line
        key={`major-${h}`}
        x1={outer.x}
        y1={outer.y}
        x2={inner.x}
        y2={inner.y}
        stroke="var(--border-strong)"
        strokeWidth={1}
        strokeLinecap="round"
      />
    );

    // Minor ticks every 15 min (skip the hour mark)
    for (let q = 1; q < 4; q++) {
      const minAngle = timeToAngle(h, q * 15);
      const mOuter = polarToCartesian(CX, CY, TICK_R_OUTER, minAngle);
      const mInner = polarToCartesian(CX, CY, TICK_R_MINOR, minAngle);
      ticks.push(
        <line
          key={`minor-${h}-${q}`}
          x1={mOuter.x}
          y1={mOuter.y}
          x2={mInner.x}
          y2={mInner.y}
          stroke="var(--border-default)"
          strokeWidth={0.5}
          strokeLinecap="round"
        />
      );
    }
  }

  return <g className="clock-ticks">{ticks}</g>;
});

/* ---- Sub-component: Hour Labels ---- */
const ClockLabels = React.memo(function ClockLabels() {
  const labels: React.ReactElement[] = [];

  for (let h = 0; h < 24; h += 1) {
    // Only show every 3rd hour label to avoid crowding
    if (h % 3 !== 0) continue;
    const angle = timeToAngle(h, 0);
    const pos = polarToCartesian(CX, CY, LABEL_R, angle);
    labels.push(
      <text
        key={`label-${h}`}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-secondary)"
        fontSize={11}
        fontFamily="var(--font-body)"
        fontWeight={500}
      >
        {h}
      </text>
    );
  }

  return <g className="clock-labels">{labels}</g>;
});

/* ---- Sub-component: Now Hand ---- */
function ClockHand() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const angle = timeToAngle(now.getHours(), now.getMinutes());
  const tip = polarToCartesian(CX, CY, 215, angle);

  return (
    <g className="clock-hand" style={{ transition: 'transform 1s ease-in-out' }}>
      <line
        x1={CX}
        y1={CY}
        x2={tip.x}
        y2={tip.y}
        stroke="var(--clock-hand)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle
        cx={tip.x}
        cy={tip.y}
        r={4}
        fill="var(--clock-hand)"
      />
    </g>
  );
}

/* ---- Sub-component: Center Info Panel ---- */
function ClockCenter({ completedCount, totalCount }: { completedCount: number; totalCount: number }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` : '--:--';
  const dateStr = now ? now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '---';

  return (
    <g className="clock-center">
      <circle cx={CX} cy={CY} r={CENTER_R} fill="var(--clock-center)" />
      <circle cx={CX} cy={CY} r={CENTER_R} fill="none" stroke="var(--border-default)" strokeWidth={1} />
      <text
        x={CX}
        y={CY - 14}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-primary)"
        fontSize={28}
        fontFamily="var(--font-display)"
      >
        {timeStr}
      </text>
      <text
        x={CX}
        y={CY + 12}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-secondary)"
        fontSize={11}
        fontFamily="var(--font-body)"
      >
        {dateStr}
      </text>
      <text
        x={CX}
        y={CY + 30}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-tertiary)"
        fontSize={10}
        fontFamily="var(--font-body)"
      >
        {completedCount}/{totalCount} Tasks Done
      </text>
    </g>
  );
}

/* ---- Main Component: Radial Clock ---- */
export default function RadialClock() {
  const allTasks = useTaskStore((s) => s.tasks);
  const tags = useTaskStore((s) => s.tags);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Filter and sort today's tasks
  const tasks = useMemo(() => {
    const today = getTodayStr();
    return allTasks
      .filter((t) => t.dueDate === today)
      .sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [allTasks]);

  // Build tag lookup map
  const tagMap = useMemo(() => {
    const m = new Map<string, Tag>();
    tags.forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  // Filter tasks that have both start and end times (needed for arc rendering)
  const arcTasks = useMemo(
    () => tasks.filter((t) => t.startTime && t.endTime),
    [tasks]
  );

  // Detect overlapping arcs and assign radii
  const arcData = useMemo(() => {
    const sorted = [...arcTasks].sort((a, b) =>
      (a.startTime || '').localeCompare(b.startTime || '')
    );

    return sorted.map((task, i) => {
      // Check if this task overlaps with the previous one
      const prevTask = i > 0 ? sorted[i - 1] : null;
      let radius = TASK_ARC_R;
      if (
        prevTask &&
        prevTask.startTime &&
        prevTask.endTime &&
        task.startTime &&
        task.startTime < prevTask.endTime
      ) {
        radius = TASK_ARC_R_INNER;
      }

      const startAngle = timeToAngle(
        ...Object.values(parseTime(task.startTime!)) as [number, number]
      );
      const endAngle = timeToAngle(
        ...Object.values(parseTime(task.endTime!)) as [number, number]
      );

      const tag = task.tagId ? tagMap.get(task.tagId) : undefined;
      const color = tag ? ARC_COLORS[tag.colorSlot] || 'var(--clock-arc-1)' : 'var(--clock-arc-1)';

      return { task, startAngle, endAngle, radius, color, tag };
    });
  }, [arcTasks, tagMap]);

  const handleArcHover = useCallback(
    (e: React.MouseEvent, task: Task, tag: Tag | undefined) => {
      const svgEl = (e.target as Element).closest('svg');
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        task,
        tag,
      });
    },
    []
  );

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '0 auto' }}>
      <svg
        viewBox={VIEWBOX}
        width="100%"
        style={{ overflow: 'visible', height: 'auto' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Track ring (background) */}
        <circle
          cx={CX}
          cy={CY}
          r={TASK_ARC_R}
          fill="none"
          stroke="var(--clock-track)"
          strokeWidth={14}
          opacity="var(--clock-track-opacity)"
        />

        {/* Clock ticks */}
        <ClockTicks />

        {/* Hour labels */}
        <ClockLabels />

        {/* Task arcs */}
        {arcData.map(({ task, startAngle, endAngle, radius, color, tag }) => (
          <path
            key={task.id}
            d={buildArcPath(CX, CY, radius, startAngle, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            opacity={task.completed ? 'var(--arc-completed-opacity)' : 'var(--arc-active-opacity)'}
            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease, opacity 0.3s ease' }}
            onMouseMove={(e) => handleArcHover(e, task, tag)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Now hand */}
        <ClockHand />

        {/* Center info panel */}
        <ClockCenter
          completedCount={tasks.filter((t) => t.completed).length}
          totalCount={tasks.length}
        />
      </svg>

      {/* Arc Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 180,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
            {tooltip.task.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {tooltip.task.startTime && tooltip.task.endTime
              ? `${formatTimeDisplay(tooltip.task.startTime)} – ${formatTimeDisplay(tooltip.task.endTime)}`
              : 'No time set'}
          </div>
          {tooltip.tag && (
            <div style={{ marginBottom: 4 }}>
              <TagPill name={tooltip.tag.name} colorSlot={tooltip.tag.colorSlot} size="sm" />
            </div>
          )}
          {tooltip.task.startTime && tooltip.task.endTime && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {formatDuration(durationMinutes(tooltip.task.startTime, tooltip.task.endTime))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
