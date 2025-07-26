import React from 'react';

interface DashedBoxProps {
  mouse: { docX: number; docY: number };
  startPos: { x: number; y: number } | null;
}

const DashedBox: React.FC<DashedBoxProps> = ({ mouse, startPos }) => {
  function getRect() {
    if (!startPos) return { x: 0, y: 0, w: 0, h: 0 };
    return {
      x: Math.min(startPos.x, mouse.docX),
      y: Math.min(startPos.y, mouse.docY),
      w: Math.abs(startPos.x - mouse.docX),
      h: Math.abs(startPos.y - mouse.docY),
    };
  }
  if (startPos) {
    const { x, y, w, h } = getRect();
    return (
      <div
        style={{
          transform: `translate(${x}px,${y}px)`,
          width: w,
          height: h,
          position: 'absolute',
          border: `1px dotted gray`,
        }}
      />
    );
  }
  return null;
};

export default DashedBox;
