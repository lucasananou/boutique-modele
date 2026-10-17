"use client";

import { useState } from "react";

/* Six shots, six thumbnails, Mycel card radius. */
const SHOTS = [
  { src: "/stores/firstdraw/img/fd-shop1.jpg", alt: "The First Draw jar on a white background" },
  { src: "/stores/firstdraw/img/fd-hand.jpg", alt: "A hand holding the jar" },
  { src: "/stores/firstdraw/img/fd-scoop.jpg", alt: "A scoop of colostrum powder beside the open jar" },
  { src: "/stores/firstdraw/img/fd-grass.jpg", alt: "The jar in dewy pasture grass at sunrise" },
  { src: "/stores/firstdraw/img/v2-pour.jpg", alt: "Powder falling from the scoop into water" },
  { src: "/stores/firstdraw/img/fd-shop3.jpg", alt: "Three jars grouped together" },
];

export default function Gallery() {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="gallery-main">
        <img src={SHOTS[i].src} alt={SHOTS[i].alt} />
      </div>
      <div className="gallery-thumbs">
        {SHOTS.map((s, n) => (
          <button
            key={s.src}
            type="button"
            aria-current={n === i}
            aria-label={s.alt}
            onClick={() => setI(n)}
          >
            <img src={s.src} alt="" />
          </button>
        ))}
      </div>
    </div>
  );
}
