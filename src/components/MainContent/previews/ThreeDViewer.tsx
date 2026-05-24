"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Layers, Rotate3d, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type ShapeType = 'knot' | 'torus' | 'tesseract';
type ColorTheme = 'cyan' | 'indigo' | 'green' | 'pink';

export const ThreeDViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wireframe, setWireframe] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [shape, setShape] = useState<ShapeType>('knot');
  const [theme, setTheme] = useState<ColorTheme>('cyan');
  const [zoom, setZoom] = useState(1.0);
  const { language } = useLanguage();

  // Rotation angles
  const angleX = useRef(0.5);
  const angleY = useRef(0.5);
  const angleW = useRef(0.0); // For 4D rotation
  const isDragging = useRef(false);
  const prevMouseX = useRef(0);
  const prevMouseY = useRef(0);

  // Generate math data dynamically
  const getShapeData = () => {
    if (shape === 'knot') {
      // Torus Knot (p=2, q=3)
      const vertices = [];
      const numPoints = 120;
      for (let i = 0; i < numPoints; i++) {
        const phi = (i / numPoints) * 2 * Math.PI;
        const r = 0.75 + 0.25 * Math.cos(3 * phi);
        const x = r * Math.cos(2 * phi);
        const y = r * Math.sin(2 * phi);
        const z = 0.3 * Math.sin(3 * phi);
        vertices.push({ x, y, z });
      }
      
      const edges = [];
      for (let i = 0; i < numPoints; i++) {
        edges.push([i, (i + 1) % numPoints]);
      }
      return { vertices, edges };
    } else if (shape === 'torus') {
      // 3D Torus Grid
      const vertices = [];
      const edges = [];
      const segmentsU = 16;
      const segmentsV = 12;
      const R = 0.75;
      const r = 0.28;
      
      for (let u = 0; u < segmentsU; u++) {
        const angleU = (u / segmentsU) * 2 * Math.PI;
        const cosU = Math.cos(angleU);
        const sinU = Math.sin(angleU);
        
        for (let v = 0; v < segmentsV; v++) {
          const angleV = (v / segmentsV) * 2 * Math.PI;
          const cosV = Math.cos(angleV);
          const sinV = Math.sin(angleV);
          
          const x = (R + r * cosV) * cosU;
          const y = (R + r * cosV) * sinU;
          const z = r * sinV;
          
          vertices.push({ x, y, z });
          
          const nextU = (u + 1) % segmentsU;
          const nextV = (v + 1) % segmentsV;
          edges.push([u * segmentsV + v, nextU * segmentsV + v]);
          edges.push([u * segmentsV + v, u * segmentsV + nextV]);
        }
      }
      return { vertices, edges };
    } else {
      // 4D Tesseract (Hypercube)
      const vertices = [];
      for (let i = 0; i < 16; i++) {
        vertices.push({
          x: (i & 1 ? 1 : -1) * 0.55,
          y: (i & 2 ? 1 : -1) * 0.55,
          z: (i & 4 ? 1 : -1) * 0.55,
          w: (i & 8 ? 1 : -1) * 0.55
        });
      }
      
      const edges = [];
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          const diff = i ^ j;
          if (diff === 1 || diff === 2 || diff === 4 || diff === 8) {
            edges.push([i, j]);
          }
        }
      }
      return { vertices, edges };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Auto rotation
      if (isRotating && !isDragging.current) {
        angleX.current += 0.006;
        angleY.current += 0.008;
        angleW.current += 0.005; // 4D rotation speed
      }

      const cosX = Math.cos(angleX.current);
      const sinX = Math.sin(angleX.current);
      const cosY = Math.cos(angleY.current);
      const sinY = Math.sin(angleY.current);

      const shapeData = getShapeData();
      
      // Color definitions
      const isLight = document.documentElement.classList.contains('light');
      let primaryColor = '#22d3ee'; // Cyan
      let secondaryColor = 'rgba(34, 211, 238, 0.12)';
      let nodeColor = isLight ? '#0f172a' : '#ffffff';

      if (theme === 'indigo') {
        primaryColor = isLight ? '#4f46e5' : '#6366f1';
        secondaryColor = isLight ? 'rgba(79, 70, 229, 0.08)' : 'rgba(99, 102, 241, 0.12)';
      } else if (theme === 'green') {
        primaryColor = isLight ? '#16a34a' : '#4ade80';
        secondaryColor = isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(74, 222, 128, 0.12)';
      } else if (theme === 'pink') {
        primaryColor = isLight ? '#db2777' : '#f472b6';
        secondaryColor = isLight ? 'rgba(219, 39, 119, 0.08)' : 'rgba(244, 114, 182, 0.12)';
      }

      // Project vertices
      const projected = shapeData.vertices.map((v: any) => {
        let x = v.x;
        let y = v.y;
        let z = v.z;

        // If Tesseract (4D), perform 4D rotation first, then project to 3D
        if ('w' in v) {
          const w = v.w;
          const cosW = Math.cos(angleW.current);
          const sinW = Math.sin(angleW.current);
          
          // Rotate in XW plane
          const xRotated = x * cosW - w * sinW;
          const wRotated = x * sinW + w * cosW;
          x = xRotated;
          
          // Project 4D to 3D
          const distance4D = 1.8;
          const scale4D = distance4D / (distance4D + wRotated);
          x *= scale4D;
          y *= scale4D;
          z *= scale4D;
        }

        // Apply 3D rotation
        // Rotate Y
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate X
        let y2 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Perspective projection to 2D
        const distance3D = 2.5;
        const baseScale = (canvas.width * 0.4) / (distance3D + z2);
        const finalScale = baseScale * zoom;

        return {
          x: canvas.width / 2 + x1 * finalScale,
          y: canvas.height / 2 + y2 * finalScale,
          depth: z2 // Save for depth sorting if needed
        };
      });

      // Draw solid faces if it is a Torus and not wireframe
      if (!wireframe && shape === 'torus') {
        const segmentsV = 12;
        const numVertices = projected.length;
        ctx.fillStyle = secondaryColor;
        ctx.strokeStyle = primaryColor + '40'; // Low opacity border
        ctx.lineWidth = 0.5;

        // Draw quads of torus mesh
        for (let i = 0; i < numVertices; i++) {
          const nextRowIdx = (i + segmentsV) % numVertices;
          const nextColIdx = (i + 1) % segmentsV === 0 ? i - segmentsV + 1 : i + 1;
          const diagIdx = (nextRowIdx + 1) % segmentsV === 0 ? nextRowIdx - segmentsV + 1 : nextRowIdx + 1;

          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[nextColIdx].x, projected[nextColIdx].y);
          ctx.lineTo(projected[diagIdx].x, projected[diagIdx].y);
          ctx.lineTo(projected[nextRowIdx].x, projected[nextRowIdx].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw edges
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = wireframe ? (shape === 'knot' ? 2.5 : 1.8) : 1.0;
      ctx.lineJoin = 'round';

      shapeData.edges.forEach((e: any) => {
        ctx.beginPath();
        ctx.moveTo(projected[e[0]].x, projected[e[0]].y);
        ctx.lineTo(projected[e[1]].x, projected[e[1]].y);
        ctx.stroke();
      });

      // Draw nodes
      ctx.fillStyle = nodeColor;
      projected.forEach((p: any) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, shape === 'knot' ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Watermark Overlay
      ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`🔒 ZETRA 3D ENGINE (${shape.toUpperCase()})`, canvas.width / 2, 22);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [wireframe, isRotating, shape, theme, zoom]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    prevMouseX.current = e.clientX;
    prevMouseY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMouseX.current;
    const deltaY = e.clientY - prevMouseY.current;

    angleY.current += deltaX * 0.007;
    angleX.current += deltaY * 0.007;

    prevMouseX.current = e.clientX;
    prevMouseY.current = e.clientY;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoom = (amount: number) => {
    setZoom(prev => Math.min(Math.max(prev + amount, 0.5), 2.0));
  };

  return (
    <div className="relative w-full h-full bg-slate-955 light:bg-slate-100 rounded-2xl border border-slate-800 light:border-slate-200 flex flex-col justify-between items-center p-4 transition-colors">
      
      {/* Top Controller Bar */}
      <div className="flex gap-2 w-full justify-between items-center pb-2 border-b border-slate-800/80 light:border-slate-200/80 relative z-10">
        <select
          value={shape}
          onChange={(e) => setShape(e.target.value as ShapeType)}
          className="bg-slate-900 border border-slate-800 text-slate-200 light:bg-white light:border-slate-250 light:text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
        >
          <option value="knot">{language === 'uz' ? 'Tugun' : language === 'ru' ? 'Узел' : 'Torus Knot'}</option>
          <option value="torus">{language === 'uz' ? 'Torus (Donut)' : language === 'ru' ? 'Тор (Бублик)' : 'Torus Grid'}</option>
          <option value="tesseract">{language === 'uz' ? 'Tesserakt (4D)' : language === 'ru' ? 'Тессеракт (4D)' : 'Tesseract (4D)'}</option>
        </select>

        {/* Zoom Controls */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleZoom(0.1)}
            className="p-1 hover:bg-slate-900 light:hover:bg-slate-200 rounded text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-800 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-0.1)}
            className="p-1 hover:bg-slate-900 light:hover:bg-slate-200 rounded text-slate-400 hover:text-slate-200 light:text-slate-600 light:hover:text-slate-800 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full max-w-[260px] aspect-square cursor-grab active:cursor-grabbing my-2"
      />

      {/* Bottom controls */}
      <div className="flex gap-2 w-full justify-between items-center border-t border-slate-800/80 light:border-slate-200 pt-3 relative z-10">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              wireframe ? 'bg-indigo-650 border-indigo-550 text-white' : 'bg-slate-900 border-slate-800 light:bg-white light:border-slate-250 text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
            title={language === 'uz' ? 'Simli rejim' : language === 'ru' ? 'Каркасный режим' : 'Wireframe Mode'}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isRotating ? 'bg-indigo-650 border-indigo-550 text-white' : 'bg-slate-900 border-slate-800 light:bg-white light:border-slate-250 text-slate-400 light:text-slate-600 hover:text-slate-200'
            }`}
            title={language === 'uz' ? 'Avto aylantirish' : language === 'ru' ? 'Вращение' : 'Auto Rotate'}
          >
            <Rotate3d className="w-4 h-4" />
          </button>
        </div>

        {/* Color Theme Selector */}
        <div className="flex gap-1.5 bg-slate-900/55 light:bg-slate-200/50 p-1 rounded-full border border-slate-800 light:border-slate-300/40">
          <button
            type="button"
            onClick={() => setTheme('cyan')}
            className={`w-3.5 h-3.5 rounded-full bg-cyan-400 border ${theme === 'cyan' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
          <button
            type="button"
            onClick={() => setTheme('indigo')}
            className={`w-3.5 h-3.5 rounded-full bg-indigo-600 border ${theme === 'indigo' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
          <button
            type="button"
            onClick={() => setTheme('green')}
            className={`w-3.5 h-3.5 rounded-full bg-emerald-400 border ${theme === 'green' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
          <button
            type="button"
            onClick={() => setTheme('pink')}
            className={`w-3.5 h-3.5 rounded-full bg-pink-500 border ${theme === 'pink' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
        </div>
      </div>
    </div>
  );
};
