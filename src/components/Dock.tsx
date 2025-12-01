import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, MotionValue } from 'framer-motion';
import { cn } from '@/lib/utils';

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  dockHeight?: number;
  magnification?: number;
};

function DockItem({
  children,
  className,
  onClick,
  mouseX,
  distance,
  magnification,
  baseItemSize,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  distance: number;
  magnification: number;
  baseItemSize: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize]
  );
  const size = useSpring(targetSize, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-full bg-white/5 border border-white/5 cursor-pointer transition-colors hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { isHovered })
          : child
      )}
    </motion.div>
  );
}

function DockIcon({ children, className, isHovered }: { children: React.ReactNode; className?: string; isHovered?: MotionValue<number> }) {
  return <div className={cn("flex items-center justify-center w-full h-full text-white", className)}>{children}</div>;
}

function DockLabel({ children, className, isHovered }: { children: React.ReactNode; className?: string; isHovered?: MotionValue<number> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered?.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe?.();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2.5 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none border border-white/10",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Dock({
  items,
  className,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <div className={cn("fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex justify-center pb-2", className)}>
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end p-2.5 gap-3 rounded-[24px] bg-[#0F0F11]/60 backdrop-blur-xl border border-white/10 shadow-2xl"
        style={{ height: panelHeight }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            <DockLabel>{item.label}</DockLabel>
          </DockItem>
        ))}
      </motion.div>
    </div>
  );
}
