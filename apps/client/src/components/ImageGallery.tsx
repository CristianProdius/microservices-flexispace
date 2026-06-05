"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import Lightbox from "./Lightbox";

interface ImageGalleryProps {
  images: string[];
  spaceName: string;
}

const ImageGallery = ({ images, spaceName }: ImageGalleryProps) => {
  const t = useTranslations("spaces");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) return null;

  return (
    <>
      {images.length <= 1 ? (
        <div className="mb-8 rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
          <button
            onClick={() => openLightbox(0)}
            className="relative aspect-[21/9] w-full cursor-pointer group"
          >
            <Image
              src={images[0] || "/placeholder-space.jpg"}
              alt={spaceName}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden shadow-[var(--shadow-lg)]">
          <button
            onClick={() => openLightbox(0)}
            className="relative aspect-[4/3] md:aspect-auto md:row-span-2 md:min-h-[400px] cursor-pointer group"
          >
            <Image
              src={images[0] || "/placeholder-space.jpg"}
              alt={spaceName}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            {images.slice(1, 5).map((img, idx) => (
              <button
                key={idx}
                onClick={() => openLightbox(idx + 1)}
                className="relative aspect-[4/3] cursor-pointer group"
              >
                <Image
                  src={img}
                  alt={`${spaceName} - ${idx + 2}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>

          {images.length > 5 && (
            <button
              onClick={() => openLightbox(5)}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-foreground text-sm font-medium rounded-lg shadow-[var(--shadow-md)] backdrop-blur-sm transition-colors cursor-pointer"
            >
              <Camera className="size-4" />
              {t("showAllPhotos", { count: images.length })}
            </button>
          )}
        </div>
      )}

      <Lightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        alt={spaceName}
      />
    </>
  );
};

export default ImageGallery;
