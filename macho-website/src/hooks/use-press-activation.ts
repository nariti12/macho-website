import type { DragEvent, KeyboardEvent, MouseEvent, PointerEvent, RefObject } from "react";
import { useRef } from "react";

type PressPoint = {
  startX: number;
  startY: number;
  moved: boolean;
};

type UsePressActivationOptions<T extends HTMLElement> = {
  targetRef: RefObject<T | null>;
  maxMovement?: number;
  onActivate: (pointerType: string) => void;
  onPressStart?: (pointerType: string) => void;
};

const isPrimaryPointer = (event: PointerEvent<HTMLElement>) => event.pointerType !== "mouse" || event.button === 0;

export function usePressActivation<T extends HTMLElement>({
  targetRef,
  maxMovement = 12,
  onActivate,
  onPressStart,
}: UsePressActivationOptions<T>) {
  const activePointersRef = useRef(new Map<number, PressPoint>());

  const setPressedState = (pressed: boolean) => {
    const target = targetRef.current;
    if (!target) return;
    if (pressed) target.dataset.pressed = "true";
    else delete target.dataset.pressed;
  };

  const releasePointer = (event: PointerEvent<T>, activate: boolean) => {
    const press = activePointersRef.current.get(event.pointerId);
    if (!press) return;

    activePointersRef.current.delete(event.pointerId);
    if (activePointersRef.current.size === 0) setPressedState(false);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Synthetic events and older browsers may not expose pointer capture.
    }

    if (activate && !press.moved) onActivate(event.pointerType || "pointer");
  };

  return {
    onPointerDown: (event: PointerEvent<T>) => {
      if (!isPrimaryPointer(event)) return;
      // Keep progression independent from the number of simultaneous touch
      // points while still accepting every sequential tap.
      if (activePointersRef.current.size > 0) return;
      event.preventDefault();
      activePointersRef.current.set(event.pointerId, {
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      });
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement, not a requirement for activation.
      }
      setPressedState(true);
      onPressStart?.(event.pointerType || "pointer");
    },
    onPointerMove: (event: PointerEvent<T>) => {
      const press = activePointersRef.current.get(event.pointerId);
      if (!press || press.moved) return;
      const distance = Math.hypot(event.clientX - press.startX, event.clientY - press.startY);
      if (distance > maxMovement) press.moved = true;
    },
    onPointerUp: (event: PointerEvent<T>) => {
      event.preventDefault();
      releasePointer(event, true);
    },
    onPointerCancel: (event: PointerEvent<T>) => releasePointer(event, false),
    onLostPointerCapture: (event: PointerEvent<T>) => releasePointer(event, false),
    onClick: (event: MouseEvent<T>) => {
      // Pointer input is committed by pointerup. A detail of 0 identifies
      // keyboard activation and keeps Enter/Space accessible without doubling.
      if (event.detail !== 0) {
        event.preventDefault();
        return;
      }
      onPressStart?.("keyboard");
      onActivate("keyboard");
    },
    onKeyDown: (event: KeyboardEvent<T>) => {
      if (event.key === "Enter" || event.key === " ") setPressedState(true);
    },
    onKeyUp: (event: KeyboardEvent<T>) => {
      if (event.key === "Enter" || event.key === " ") setPressedState(false);
    },
    onDragStart: (event: DragEvent<T>) => event.preventDefault(),
    onContextMenu: (event: MouseEvent<T>) => event.preventDefault(),
  };
}
