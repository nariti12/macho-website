"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { MACHO_CHARACTER_HEIGHT, MACHO_CHARACTER_WIDTH } from "@/lib/characters/macho-face2";

export function MachoEvolvingCharacter({ imageSrc, nextImageSrc }: { imageSrc: string; nextImageSrc?: string }) {
  const [displayedSrc, setDisplayedSrc] = useState(imageSrc);
  const [previousSrc, setPreviousSrc] = useState<string | null>(null);
  const displayedRef = useRef(imageSrc);

  useEffect(() => {
    if (imageSrc === displayedRef.current) return;
    let cancelled = false;
    const incoming = new window.Image();
    incoming.onload = () => {
      if (cancelled) return;
      // Keep the old full-body image until the new one is ready. Both layers
      // share one rectangle: no face/body edits or evolution-dependent scale.
      setPreviousSrc(displayedRef.current);
      displayedRef.current = imageSrc;
      setDisplayedSrc(imageSrc);
    };
    incoming.src = imageSrc;
    return () => {
      cancelled = true;
      incoming.onload = null;
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!previousSrc) return;
    const timer = setTimeout(() => setPreviousSrc(null), 450);
    return () => clearTimeout(timer);
  }, [displayedSrc, previousSrc]);

  useEffect(() => {
    if (!nextImageSrc) return;
    // WebPs are already delivery-sized; use the same URL for preload/render.
    const next = new window.Image();
    next.src = nextImageSrc;
  }, [nextImageSrc]);

  return (
    <span className="macho-character-frame" data-testid="macho-character-frame">
      {previousSrc && previousSrc !== displayedSrc ? (
        <Image
          key={`previous-${previousSrc}`}
          src={previousSrc}
          alt=""
          aria-hidden="true"
          width={MACHO_CHARACTER_WIDTH}
          height={MACHO_CHARACTER_HEIGHT}
          unoptimized
          draggable={false}
          className="macho-character-layer macho-character-outgoing"
        />
      ) : null}
      <Image
        key={displayedSrc}
        src={displayedSrc}
        alt="マチョ田をクリック"
        width={MACHO_CHARACTER_WIDTH}
        height={MACHO_CHARACTER_HEIGHT}
        unoptimized
        loading="eager"
        fetchPriority="high"
        draggable={false}
        className={`macho-character-layer macho-character-image ${previousSrc ? "macho-character-incoming" : ""}`}
      />
    </span>
  );
}
