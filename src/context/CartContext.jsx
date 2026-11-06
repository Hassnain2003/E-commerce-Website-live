import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'cart';

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  function persist(nextItems) {
    setItems(nextItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }

  function addItem(product) {
    const existing = items.find((item) => item.id === product.id);
    const nextItems = existing
      ? items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [...items, { ...product, quantity: 1 }];
    persist(nextItems);
  }

  function updateQuantity(id, quantity) {
    const safeQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    persist(items.map((item) => (item.id === id ? { ...item, quantity: safeQuantity } : item)));
  }

  function removeItem(id) {
    persist(items.filter((item) => item.id !== id));
  }

  function clearCart() {
    persist([]);
  }

  const value = useMemo(
    () => ({
      items,
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
