import React, { useEffect, useState, useRef } from 'react';
import { GradFlow } from 'gradflow';

export default function FramerLiquidBackground() {
  const [FramerComponent, setFramerComponent] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Attempt dynamic import of Framer ESM component
    import(/* @vite-ignore */ 'https://framer.com/m/AnimatedLiquidBackground-Prod-vIhm.js@ghH1aHLmGZ0iE7qXDFVk')
      .then((mod) => {
        if (isMounted && mod && mod.default) {
          setFramerComponent(() => mod.default);
        }
      })
      .catch((err) => {
        console.warn('Framer dynamic URL import fallback active:', err);
        if (isMounted) setHasError(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (FramerComponent && !hasError) {
    return (
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <FramerComponent
          preset="custom"
          color1="#090d16"
          color2="#0E52FF"
          color3="#82DCFF"
          speed={35}
          scale={1.2}
          distortion={20}
          swirl={60}
          softness={80}
          noise={{ opacity: 0.35, scale: 1 }}
          style={{ width: '100vw', height: '100vh', position: 'absolute', inset: 0 }}
        />
      </div>
    );
  }

  // Liquid Canvas Fallback with Noise Overlay matching Framer Liquid Asset
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      <GradFlow
        config={{
          color1: { r: 14, g: 82, b: 255 },
          color2: { r: 130, g: 220, b: 255 },
          color3: { r: 9, g: 13, b: 22 },
          speed: 0.5,
          scale: 2.4,
          type: 'animated',
          noise: 0.6
        }}
        className="absolute inset-0 w-full h-full"
      />
      {/* Framer Liquid Film Noise Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px'
        }}
      />
    </div>
  );
}
