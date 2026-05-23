"use client";

import React, { useEffect, useState, useRef } from 'react';
import { X, Star, ShoppingCart, CheckCircle2, HardDrive, FileType, Layers, Rotate3d, Box } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { formatPrice } from '@/utils/price';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  currency: 'USD' | 'UZS';
  exchangeRate: number;
}

const ThreeDViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wireframe, setWireframe] = useState(true);
  const [isRotating, setIsRotating] = useState(true);
  const [activeColor, setActiveColor] = useState<'cyan' | 'indigo'>('cyan');

  // Coordinates for a double pyramid (octahedron)
  const vertices = [
    { x: 0, y: 1.1, z: 0 },
    { x: 0, y: -1.1, z: 0 },
    { x: 0.9, y: 0, z: 0.9 },
    { x: -0.9, y: 0, z: 0.9 },
    { x: -0.9, y: 0, z: -0.9 },
    { x: 0.9, y: 0, z: -0.9 }
  ];

  const edges = [
    [0, 2], [0, 3], [0, 4], [0, 5],
    [1, 2], [1, 3], [1, 4], [1, 5],
    [2, 3], [3, 4], [4, 5], [5, 2]
  ];

  // Rotation angles
  const angleX = useRef(0.6);
  const angleY = useRef(0.6);
  const isDragging = useRef(false);
  const prevMouseX = useRef(0);
  const prevMouseY = useRef(0);

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
        angleX.current += 0.007;
        angleY.current += 0.009;
      }

      const cosX = Math.cos(angleX.current);
      const sinX = Math.sin(angleX.current);
      const cosY = Math.cos(angleY.current);
      const sinY = Math.sin(angleY.current);

      // Project vertices
      const projected = vertices.map(v => {
        // Rotate Y
        let x1 = v.x * cosY - v.z * sinY;
        let z1 = v.x * sinY + v.z * cosY;

        // Rotate X
        let y2 = v.y * cosX - z1 * sinX;
        let z2 = v.y * sinX + z1 * cosX;

        // Perspective projection
        const distance = 2.8;
        const scale = (canvas.width * 0.45) / (distance + z2);

        return {
          x: canvas.width / 2 + x1 * scale,
          y: canvas.height / 2 + y2 * scale
        };
      });

      // Draw faces
      if (!wireframe) {
        const faces = [
          [0, 2, 3], [0, 3, 4], [0, 4, 5], [0, 5, 2],
          [1, 2, 3], [1, 3, 4], [1, 4, 5], [1, 5, 2]
        ];

        ctx.fillStyle = activeColor === 'cyan'
          ? 'rgba(34, 211, 238, 0.12)'
          : 'rgba(99, 102, 241, 0.12)';
        ctx.strokeStyle = activeColor === 'cyan'
          ? 'rgba(34, 211, 238, 0.25)'
          : 'rgba(99, 102, 241, 0.25)';
        ctx.lineWidth = 1;

        faces.forEach(f => {
          ctx.beginPath();
          ctx.moveTo(projected[f[0]].x, projected[f[0]].y);
          ctx.lineTo(projected[f[1]].x, projected[f[1]].y);
          ctx.lineTo(projected[f[2]].x, projected[f[2]].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }

      // Draw edges
      ctx.strokeStyle = activeColor === 'cyan' ? '#22d3ee' : '#6366f1';
      ctx.lineWidth = wireframe ? 2.0 : 1.2;
      ctx.lineJoin = 'round';

      edges.forEach(e => {
        ctx.beginPath();
        ctx.moveTo(projected[e[0]].x, projected[e[0]].y);
        ctx.lineTo(projected[e[1]].x, projected[e[1]].y);
        ctx.stroke();
      });

      // Draw nodes
      ctx.fillStyle = '#ffffff';
      projected.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 ZETRA 3D SECURE STREAMING (DEMO)', canvas.width / 2, 24);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [wireframe, isRotating, activeColor]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    prevMouseX.current = e.clientX;
    prevMouseY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - prevMouseX.current;
    const deltaY = e.clientY - prevMouseY.current;

    angleY.current += deltaX * 0.006;
    angleX.current += deltaY * 0.006;

    prevMouseX.current = e.clientX;
    prevMouseY.current = e.clientY;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="relative w-full h-full bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col justify-between items-center p-4">
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full max-w-[280px] aspect-square cursor-grab active:cursor-grabbing"
      />

      <div className="flex gap-2 w-full justify-between items-center mt-2 border-t border-slate-800/80 pt-3 relative z-10">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              wireframe ? 'bg-indigo-650 border-indigo-550 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Wireframe / Solid rejim"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsRotating(!isRotating)}
            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isRotating ? 'bg-indigo-650 border-indigo-550 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Avto aylantirish"
          >
            <Rotate3d className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveColor('indigo')}
            className={`w-4 h-4 rounded-full bg-indigo-600 border ${activeColor === 'indigo' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
          <button
            type="button"
            onClick={() => setActiveColor('cyan')}
            className={`w-4 h-4 rounded-full bg-cyan-400 border ${activeColor === 'cyan' ? 'border-white scale-110' : 'border-transparent'} cursor-pointer`}
          />
        </div>
      </div>
    </div>
  );
};

const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  currency,
  exchangeRate
}) => {
  const [viewMode, setViewMode] = useState<'image' | '3d'>('image');

  // Reset viewMode when product changes
  useEffect(() => {
    setViewMode('image');
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row transform transition-all duration-300 z-10">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950/40 hover:bg-slate-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image & Category tag */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center gap-4">
          {product.category === '3D Modellar' && (
            <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 self-center">
              <button
                onClick={() => setViewMode('image')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'image'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Muqova rasmi
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === '3d'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                Interaktiv 3D
              </button>
            </div>
          )}

          <div className="relative aspect-video md:aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {viewMode === '3d' && product.category === '3D Modellar' ? (
              <ThreeDViewer />
            ) : (
              <Image 
                src={product.image} 
                alt={product.title} 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
        </div>

        {/* Column 2: Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-semibold rounded-lg border border-indigo-550/20">
                {product.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight">{product.title}</h2>
              <p className="text-slate-400 text-xs mt-2">
                Muallif: <span className="text-slate-200 hover:text-white cursor-pointer transition-colors font-medium">{product.author}</span>
              </p>
            </div>

            {/* Ratings & reviews */}
            <div className="flex items-center gap-4 bg-slate-800/40 p-3 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-base font-bold text-white">{product.rating}</span>
              </div>
              <div className="text-slate-400 text-xs">
                <span className="text-slate-205 font-semibold text-white">{product.reviews} ta</span> baho berilgan
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500 uppercase font-semibold">Tavsif:</p>
              <p className="text-slate-300 text-sm leading-relaxed max-h-[120px] overflow-y-auto pr-1">
                {product.description}
              </p>
            </div>

            {/* Technical details */}
            <div className="grid grid-cols-2 gap-4 border-y border-slate-800 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Fayl hajmi</p>
                  <p className="text-xs font-bold text-slate-200">{product.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800/50 rounded-xl flex items-center justify-center border border-slate-700/30">
                  <FileType className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Format</p>
                  <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{product.fileType}</p>
                </div>
              </div>
            </div>

            {/* Features / Xususiyatlar */}
            {product.features && product.features.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase font-semibold">Asosiy afzalliklari:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300 text-xs leading-normal">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Add to Cart */}
          <div className="mt-8 border-t border-slate-800 pt-6 flex items-center justify-between gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 line-through">
                {formatPrice(product.price * 1.2, currency, exchangeRate)}
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-white">
                {formatPrice(product.price, currency, exchangeRate)}
              </span>
            </div>
            <button 
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 max-w-[220px] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              Savatga qo'shish
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProductModal;
