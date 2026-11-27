import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, ShieldAlert } from 'lucide-react';
import { BypassState } from '../types/modTypes';

interface FloatingBubbleProps {
  isOpen: boolean;
  onToggle: () => void;
  bypassState: BypassState;
}

const BUBBLE_SIZE = 56;
const MARGIN = 12;

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  isOpen,
  onToggle,
  bypassState,
}) => {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(MARGIN, window.innerWidth - BUBBLE_SIZE - 18) : 24,
    y: typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.22) : 120,
  }));

  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    moved: false,
  });

  // Clamp position if viewport resizes
  useEffect(() => {
    const clampToViewport = () => {
      setPos((prev) => ({
        x: Math.min(Math.max(MARGIN, prev.x), window.innerWidth - BUBBLE_SIZE - MARGIN),
        y: Math.min(Math.max(MARGIN, prev.y), window.innerHeight - BUBBLE_SIZE - MARGIN),
      }));
    };
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.hypot(dx, dy) > 5) {
      dragRef.current.moved = true;
    }

    const maxX = window.innerWidth - BUBBLE_SIZE - MARGIN;
    const maxY = window.innerHeight - BUBBLE_SIZE - MARGIN;
    const nextX = Math.min(Math.max(MARGIN, dragRef.current.origX + dx), maxX);
    const nextY = Math.min(Math.max(MARGIN, dragRef.current.origY + dy), maxY);

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current.pointerId = null;
    setIsDragging(false);

    if (!wasMoved) {
      onToggle();
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label={isOpen ? 'Collapse Mod Menu' : 'Expand Mod Menu'}
      title="Drag to move · Tap to toggle Mod Menu"
      style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-50 w-14 h-14 rounded-2xl flex items-center justify-center select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'scale-105' : 'hover:scale-105'
      } ${
        isOpen
          ? 'bg-[#0b0d13]/95 border-2 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_24px_rgba(0,240,255,0.45)]'
          : 'bg-[#0b0d13]/95 border-2 border-[#ff2a55] text-[#ff2a55] shadow-[0_0_24px_rgba(255,42,85,0.45)]'
      }`}
    >
      {bypassState === 'active' ? (
        <Crosshair className="w-6 h-6" />
      ) : (
        <ShieldAlert className="w-6 h-6" />
      )}
      <span
        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-md text-[9px] font-mono-tech font-bold flex items-center justify-center border border-[#07080c] ${
          isOpen
            ? 'bg-[#00f0ff] text-[#07080c]'
            : 'bg-[#ff2a55] text-white'
        }`}
      >
        {isOpen ? '–' : '+'}
      </span>
    </button>
  );
};
