import { useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";

export type SheetSnap = "peek" | "half" | "full";

interface MapBottomSheetProps {
  /** Pixel heights for each snap point. Computed from window height by default. */
  snapPoints?: { peek: number; half: number; full: number };
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
  initial = "half",
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

  // Default snap heights based on viewport
  const [points, setPoints] = useState({ peek: 120, half: 360, full: 600 });
  useEffect(() => {
    if (snapPoints) {
      setPoints(snapPoints);
      return;
    }
    const compute = () => {
      const h = window.innerHeight - bottomInset;
      setPoints({
        peek: Math.min(140, Math.round(h * 0.18)),
        half: Math.round(h * 0.5),
        full: Math.round(h * 0.92),
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [snapPoints, bottomInset]);

  const height = points[current];

  // Drag handling
  const startY = useRef<number | null>(null);
  const startHeight = useRef<number>(height);
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
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
    setDragHeight(next);
  };
  const onPointerUp = () => {
    if (startY.current === null) return;
    const final = dragHeight ?? height;
    // Snap to nearest
    const dPeek = Math.abs(final - points.peek);
    const dHalf = Math.abs(final - points.half);
    const dFull = Math.abs(final - points.full);
    const min = Math.min(dPeek, dHalf, dFull);
    const next: SheetSnap =
      min === dPeek ? "peek" : min === dHalf ? "half" : "full";
    setSnap(next);
    setDragHeight(null);
    startY.current = null;
  };

  const visualHeight = dragHeight ?? height;

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-40 bg-background border-t shadow-2xl rounded-t-3xl flex flex-col",
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
        className="flex justify-center pt-2 pb-1 cursor-grab touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          // Tap handle to cycle snap
          const next: SheetSnap =
            current === "peek" ? "half" : current === "half" ? "full" : "peek";
          setSnap(next);
        }}
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      </div>

      {header && <div className="px-4 pb-2 shrink-0">{header}</div>}

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
        {children}
      </div>
    </div>
  );
}
