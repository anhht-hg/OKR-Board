'use client';

import { createContext, useContext } from 'react';

interface TreeContextValue {
  compact: boolean; // true when detail drawer is open
}

export const TreeContext = createContext<TreeContextValue>({ compact: false });

export function useTreeContext() {
  return useContext(TreeContext);
}
