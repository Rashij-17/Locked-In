'use client';

/* ============================================================
   LOCKED IN — Orbit Ring Component
   Full 24-hour SVG radial clock displaying today's sessions.
   ============================================================ */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useFocusStore } from '@/store/useFocusStore';
import { timeToAngle, polarToCartesian, buildArcPath, getTodayStr, durationMinutes, formatDuration, formatTimeDisplay } from '@/lib/timeUtils';
import type { Task, FocusSession } from '@/types';

/* ---- Constants ---- */
const CX = 240;
const CY = 240;
const VIEWBOX = '0 0 480 480';
const ORBIT_R = 210;
const TICK_R_OUTER = 180;
const TICK_R_MAJOR = 170;
const TICK_R_MINOR = 175;
const LABEL_R = 155;
const CENTER_R = 90;

/* ---- Tooltip State ---- */
interface TooltipData {
  x: number;
  y: number;
  session: FocusSession;
  taskTitle: string;
}

/* ---- Sub-component: Clock Tick Marks ---- */
const ClockTicks = React.memo(function ClockTicks() {
  const ticks: React.ReactElement[] = [];

  for (let h = 0; h < 24; h++) {
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

/* ---- Sub-component: Now Marker (Orbit Dot) ---- */
function ClockMarker() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const angle = timeToAngle(now.getHours(), now.getMinutes());
  const tip = polarToCartesian(CX, CY, ORBIT_R, angle);

  return (
    <g className="clock-marker" style={{ transition: 'transform 1s ease-in-out' }}>
      <circle
        cx={tip.x}
        cy={tip.y}
        r={7}
        fill="none"
        stroke="var(--border-focus)"
        strokeWidth={1.5}
        opacity={0.6}
      />
      <circle
        cx={tip.x}
        cy={tip.y}
        r={4}
        fill="var(--border-focus)"
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

/* ---- Main Component: Orbit Ring (Radial Clock) ---- */
export default function RadialClock() {
  const sessions = useFocusStore((s) => s.sessions);
  const tasks = useTaskStore((s) => s.tasks);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Filter tasks for center panel
  const todayTasks = useMemo(() => {
    const todayStr = getTodayStr();
    return tasks.filter((t) => t.dueDate === todayStr);
  }, [tasks]);
  
  const completedTodayTasks = todayTasks.filter(t => t.completed);

  // Build task lookup map
  const taskMap = useMemo(() => {
    const m = new Map<string, Task>();
    tasks.forEach((t) => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Filter today's sessions
  const todaySessions = useMemo(() => {
    const todayStr = getTodayStr();
    return sessions
      .filter((s) => s.startedAt && s.startedAt.startsWith(todayStr))
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }, [sessions]);

  // Calculate arc data
  const arcData = useMemo(() => {
    return todaySessions.map((session) => {
      const start = new Date(session.startedAt);
      const end = session.endedAt ? new Date(session.endedAt) : new Date(); // In progress uses current time
      
      const startAngle = timeToAngle(start.getHours(), start.getMinutes());
      const endAngle = timeToAngle(end.getHours(), end.getMinutes());

      const isFocus = session.type === 'focus';
      const color = isFocus ? 'var(--accent-primary)' : 'var(--text-tertiary)';
      const strokeWidth = isFocus ? 14 : 6;

      const taskTitle = session.taskId ? taskMap.get(session.taskId)?.title || 'Unknown Task' : (isFocus ? 'Focus Session' : 'Break');

      return { session, startAngle, endAngle, color, strokeWidth, taskTitle };
    });
  }, [todaySessions, taskMap]);

  const handleArcHover = useCallback(
    (e: React.MouseEvent, session: FocusSession, taskTitle: string) => {
      const svgEl = (e.target as Element).closest('svg');
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        session,
        taskTitle,
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
          r={ORBIT_R}
          fill="none"
          stroke="var(--clock-track)"
          strokeWidth={14}
          opacity="var(--clock-track-opacity)"
        />

        {/* Clock ticks */}
        <ClockTicks />

        {/* Hour labels */}
        <ClockLabels />

        {/* Session arcs on the Orbit Ring */}
        {arcData.map(({ session, startAngle, endAngle, color, strokeWidth, taskTitle }) => (
          <path
            key={session.id}
            d={buildArcPath(CX, CY, ORBIT_R, startAngle, endAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={session.completed ? 'var(--arc-completed-opacity)' : 'var(--arc-active-opacity)'}
            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease, opacity 0.3s ease, stroke 0.4s ease' }}
            onMouseMove={(e) => handleArcHover(e, session, taskTitle)}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Now marker */}
        <ClockMarker />

        {/* Center info panel */}
        <ClockCenter
          completedCount={completedTodayTasks.length}
          totalCount={todayTasks.length}
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
            {tooltip.taskTitle}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {tooltip.session.startedAt ? (
              `${formatTimeDisplay(tooltip.session.startedAt.split('T')[1].substring(0, 5))} – ${tooltip.session.endedAt ? formatTimeDisplay(tooltip.session.endedAt.split('T')[1].substring(0, 5)) : 'Now'}`
            ) : 'No time set'}
          </div>
          <div style={{ marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontSize: 11,
              fontWeight: 500,
              background: tooltip.session.type === 'focus' ? 'rgba(var(--accent-primary-rgb), 0.1)' : 'var(--border-default)',
              color: tooltip.session.type === 'focus' ? 'var(--accent-primary)' : 'var(--text-secondary)'
            }}>
              {tooltip.session.type === 'focus' ? 'Focus' : 'Break'}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {tooltip.session.completed ? 'Completed' : 'In Progress'} ({formatDuration(Math.round(tooltip.session.durationSec / 60))})
          </div>
        </div>
      )}
    </div>
  );
}
