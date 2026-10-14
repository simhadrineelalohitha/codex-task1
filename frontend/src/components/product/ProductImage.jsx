import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

const ProductImage = ({
  src,
  name,
  status,
  className = '',
  imageClassName = 'w-full h-full object-cover',
}) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const unavailable = !src || failedSrc === src;

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      role="img"
      aria-label={unavailable ? `${name}: no verified image available` : name}
    >
      {unavailable ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-gray-500">
          <ImageOff size={22} aria-hidden="true" />
          <span className="text-xs font-medium">No verified image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={`${name}${status === 'stock_photo_unverified' ? ' — category stock photo; exact product model not verified' : ''}`}
          className={imageClassName}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      )}
      {!unavailable && status === 'stock_photo_unverified' && (
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Stock photo (unverified)
        </span>
      )}
    </div>
  );
};

export default ProductImage;
