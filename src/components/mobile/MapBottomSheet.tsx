import { useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "full";

interface MapBottomSheetProps {
  /** Pixel heights for each snap point. Computed from window height by default. */
  snapPoints?: { peek: number; full: number };
  initial?: SheetSnap;
  snap?: SheetSnap; // controlled
  onSnapChange?: (s: SheetSnap) => void;
  header?: ReactNode;
  children: ReactNode;
  /** Bottom inset to leave room for the bottom nav. */
  bottomInset?: number;
}

export default function MapBottomSheet({
  snapPoints,
  initial = "peek",
  snap,
  onSnapChange,
  header,
  children,
  bottomInset = 64,
}: MapBottomSheetProps) {
  const [internalSnap, setInternalSnap] = useState<SheetSnap>(initial);
  const current = snap ?? internalSnap;

  const setSnap = useCallback(
    (s: SheetSnap) => {
      if (snap === undefined) setInternalSnap(s);
      onSnapChange?.(s);
    },
    [snap, onSnapChange]
  );

  // Default snap heights based on viewport. Only two stable states so the
  // sheet never lingers in a middle position that hides map data.
  const [points, setPoints] = useState({ peek: 120, full: 600 });
  useEffect(() => {
    if (snapPoints) {
      setPoints(snapPoints);
      return;
    }
    const compute = () => {
      const h = window.innerHeight - bottomInset;
      setPoints({
        peek: Math.min(140, Math.round(h * 0.18)),
        full: Math.round(h * 0.92),
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [snapPoints, bottomInset]);

  const height = points[current];

  // Drag handling with velocity-aware snapping so the sheet always "sticks"
  // cleanly to one of the two stable states.
  const startY = useRef<number | null>(null);
  const startHeight = useRef<number>(height);
  const lastY = useRef<number | null>(null);
  const lastTime = useRef<number>(0);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    lastY.current = e.clientY;
    lastTime.current = performance.now();
    startHeight.current = height;
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = startY.current - e.clientY;
    const next = Math.max(
      points.peek,
      Math.min(points.full, startHeight.current + dy)
    );
    lastY.current = e.clientY;
    lastTime.current = performance.now();
    setDragHeight(next);
  };
  const onPointerUp = () => {
    if (startY.current === null) return;

    const final = dragHeight ?? height;
    const now = performance.now();
    const dt = now - lastTime.current || 16;
    const dy = (lastY.current ?? startY.current) - startY.current;
    const velocity = dy / dt; // px/ms, positive = upward drag

    const midpoint = (points.peek + points.full) / 2;
    const threshold = (points.full - points.peek) * 0.15; // 15% bias toward direction

    let next: SheetSnap;
    if (velocity > 0.6 || final > midpoint + threshold) {
      // Dragged up / flicked up → expand
      next = "full";
    } else if (velocity < -0.6 || final < midpoint - threshold) {
      // Dragged down / flicked down → collapse
      next = "peek";
    } else {
      // Near midpoint: snap to closest stable state
      next = final < midpoint ? "peek" : "full";
    }

    setSnap(next);
    setDragHeight(null);
    startY.current = null;
    lastY.current = null;
  };

  const visualHeight = dragHeight ?? height;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40 bg-background border-t border-border shadow-2xl rounded-t-2xl flex flex-col",
        "transition-[height] duration-300 ease-out will-change-[height]",
        dragHeight !== null && "transition-none"
      )}
      style={{
        bottom: bottomInset,
        height: visualHeight,
      }}
      role="dialog"
      aria-label="Details"
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-2.5 pb-2 cursor-grab touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          // Tap handle to toggle between peek and full
          const next: SheetSnap = current === "peek" ? "full" : "peek";
          setSnap(next);
        }}
      >
        <div className="h-1 w-9 rounded-full bg-foreground/20" />
      </div>

      {header && <div className="px-5 pb-3 shrink-0">{header}</div>}

      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
        {children}
      </div>
    </div>
  );

}
