"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface ProductVariantSelectionValue {
  selectedVariantId?: string;
  setSelectedVariantId: (variantId?: string) => void;
}

const ProductVariantSelectionContext =
  createContext<ProductVariantSelectionValue | null>(null);

export function ProductVariantSelectionProvider({
  initialVariantId,
  children,
}: {
  initialVariantId?: string;
  children: ReactNode;
}) {
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId);
  const value = useMemo(
    () => ({ selectedVariantId, setSelectedVariantId }),
    [selectedVariantId],
  );

  return (
    <ProductVariantSelectionContext.Provider value={value}>
      {children}
    </ProductVariantSelectionContext.Provider>
  );
}

export function useProductVariantSelection() {
  return useContext(ProductVariantSelectionContext);
}
