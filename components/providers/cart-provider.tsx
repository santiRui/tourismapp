"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, useRef } from "react"
import type { Producto } from "@/types/database"
import { useAuth } from "@/hooks/use-auth"

interface CartItem extends Producto {
  cantidad: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (producto: Producto) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
  itemCount: number
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartLoaded, setIsCartLoaded] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const prevUserRef = useRef(user)

  // Efecto para manejar el cambio de estado del usuario (login/logout)
  useEffect(() => {
    // No hacer nada hasta que la autenticación haya terminado de cargar
    if (authLoading) return;

    const prevUser = prevUserRef.current;

    // CASO 1: El usuario ha cerrado sesión (antes había un usuario y ahora no)
    if (prevUser && !user) {
      const cartKey = `cart_${prevUser.id}`;
      if (typeof window !== "undefined") {
        localStorage.removeItem(cartKey);
      }
      setItems([]);
      setIsCartLoaded(false);
    }

    // Actualizamos la referencia del usuario para el próximo renderizado
    prevUserRef.current = user;
  }, [user, authLoading]);

  // Efecto para cargar el carrito desde localStorage
  useEffect(() => {
    // Esperar a que la autenticación termine de cargar
    if (authLoading) {
      return;
    }

    // Si hay un usuario, cargar su carrito
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        } catch (error) {
          console.error("Error al cargar el carrito desde localStorage:", error);
          setItems([]);
        }
      }
    } else {
      // Si no hay usuario, el carrito debe estar vacío
      setItems([]);
    }

    // Marcamos el carrito como "cargado" solo después de que la autenticación esté resuelta.
    setIsCartLoaded(true);
  }, [user, authLoading]);

  // Efecto para guardar el carrito en localStorage cada vez que los items cambian
  useEffect(() => {
    // Solo guardamos si el carrito ya fue cargado y si hay un usuario.
    // Esto previene que el estado inicial vacío sobrescriba el carrito guardado.
    if (isCartLoaded && user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(items))
    }
  }, [items, user, isCartLoaded])

  const addItem = (producto: Producto) => {
    if (!user) {
      console.warn("Intento de agregar item sin autenticación")
      return
    }

    const sanitizedProducto = {
      ...producto,
      precio: Number(producto.precio) || 0,
      stock: Number(producto.stock) || 0,
      precio_original: producto.precio_original ? Number(producto.precio_original) : null,
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === sanitizedProducto.id)
      if (existingItem) {
        return currentItems.map((item) =>
          item.id === sanitizedProducto.id
            ? { ...item, cantidad: Math.min(Number(item.cantidad) + 1, Number(sanitizedProducto.stock)) }
            : item,
        )
      }
      return [...currentItems, { ...sanitizedProducto, cantidad: 1 }]
    })
  }

  const removeItem = (productId: string) => {
    if (!user) return
    setItems((currentItems) => currentItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (!user) return

    const numQuantity = Number(quantity) || 0
    if (numQuantity <= 0) {
      removeItem(productId)
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id === productId) {
          const newQuantity = Math.min(numQuantity, Number(item.stock) || 0)
          return { ...item, cantidad: newQuantity }
        }
        return item
      }),
    )
  }

  const clearCart = () => {
    if (!user) return
    setItems([])
  }

  const total = user
    ? items.reduce((sum, item) => {
        const itemPrecio = Number(item.precio) || 0
        const itemCantidad = Number(item.cantidad) || 0
        return sum + itemPrecio * itemCantidad
      }, 0)
    : 0

  const itemCount = user
    ? items.reduce((sum, item) => sum + (Number(item.cantidad) || 0), 0)
    : 0

  const value = {
    items: user ? items : [],
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
