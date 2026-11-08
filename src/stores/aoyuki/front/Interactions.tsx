"use client";

import { useEffect } from "react";
import boot from "./interactions";

/** Interactions de la maquette (panier, galerie, carrousels…), lancées une fois par page. */
export default function Interactions() {
  useEffect(() => {
    boot();
  }, []);
  return null;
}
