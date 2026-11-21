import type { CSSProperties, ReactNode } from "react";
import type { Photo as PhotoData } from "@/db/schema";
import { mediaSrc, mediaSrcSet } from "@/lib/routes";
import styles from "./Photo.module.css";

type Props = {
  photo: PhotoData | null;
  /** Show text inside the placeholder frame: the caption by default, or a custom label. */
  caption?: boolean;
  label?: string;
  /** Width of the placeholder stripes, px. */
  stripe?: number;
  /** How wide the photo shows, for picking an image size. */
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  /** Overlaid on the photo, e.g. the editor's upload controls. */
  children?: ReactNode;
  /** Show an uploaded photo whole, at its own proportions, instead of cropping it to the slot. */
  natural?: boolean;
};

/** A photo slot: the uploaded image, or the design's striped placeholder until there is one. */
export function Photo({ photo, caption = true, label, stripe = 6, sizes, className, style, children, natural }: Props) {
  const image = photo?.image;
  if (image) {
    const frameStyle = natural ? { ...style, aspectRatio: `${image.width} / ${image.height}`, height: "auto" } : style;
    return (
      <div className={className ? `${styles.frame} ${className}` : styles.frame} style={frameStyle}>
        {/* Uploads are already resized into fixed widths, so a plain img with srcset is enough. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(image.id, 960)}
          srcSet={mediaSrcSet(image.id)}
          sizes={sizes ?? "(max-width: 760px) 100vw, 640px"}
          width={image.width}
          height={image.height}
          alt={photo.caption}
          loading="lazy"
          decoding="async"
          className={styles.image}
        />
        {children}
      </div>
    );
  }
  return (
    <div
      className={className ? `${styles.placeholder} ${className}` : styles.placeholder}
      style={{ ...style, "--stripe": `${stripe}px` } as CSSProperties}
      role={children ? undefined : "img"}
      aria-label={children ? undefined : (photo?.caption ?? "Photo")}
    >
      {label ?? (caption ? photo?.caption : null)}
      {children}
    </div>
  );
}
