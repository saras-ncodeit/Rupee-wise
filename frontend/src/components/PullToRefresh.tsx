import React, { useState, useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

  const threshold = 60; // minimum drag distance in px to trigger refresh

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only pull if we are scrolled to the top of the container
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || refreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;

      if (diff > 0) {
        // Prevent default browser refresh or bounce
        if (e.cancelable) e.preventDefault();
        
        // Logarithmic resistance
        const distance = Math.min(diff * 0.4, 100);
        setPullDistance(distance);
      } else {
        isPullingRef.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || refreshing) return;
      isPullingRef.current = false;

      if (pullDistance >= threshold) {
        setRefreshing(true);
        setPullDistance(40); // hold layout to show loader
        try {
          await onRefresh();
        } catch (err) {
          console.error(err);
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        height: '100%', 
        overflowY: 'auto', 
        position: 'relative',
        overscrollBehaviorY: 'contain' // Disables default browser pull-to-refresh!
      }}
    >
      {/* Pull Indicator Spinner */}
      <div 
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: isPullingRef.current ? 'none' : 'height var(--transition-fast), opacity var(--transition-fast)',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: pullDistance > 0 ? '1px solid var(--card-border)' : 'none'
        }}
      >
        <Loader 
          size={20} 
          color="var(--primary)" 
          className={refreshing ? 'animate-spin' : ''} 
          style={{ 
            transform: refreshing ? 'none' : `rotate(${pullDistance * 6}deg)`,
            transition: refreshing ? 'none' : 'transform 0.1s linear'
          }}
        />
      </div>

      {/* Children content wrapper */}
      <div 
        style={{
          transform: `translateY(${refreshing ? 40 : pullDistance}px)`,
          transition: isPullingRef.current ? 'none' : 'transform var(--transition-fast)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
