import Image from "next/image";
import { Placeholder } from "./Placeholder";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  rounded?: boolean;
  /** Pour next/image en mode fill, le parent doit être position:relative. */
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

/**
 * Affiche la vraie photographie si `src` est renseigné, sinon un placeholder
 * raffiné. Le client n'aura qu'à remplir les `src` du catalogue.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  rounded = false,
  fill = true,
  sizes,
  priority,
}: ProductImageProps) {
  if (!src) {
    return (
      <Placeholder
        label={alt}
        className={["h-full w-full", className].join(" ")}
        rounded={rounded}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
      priority={priority}
      className={["object-cover", rounded ? "rounded-sm" : "", className].join(
        " ",
      )}
    />
  );
}
