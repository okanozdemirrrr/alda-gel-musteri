'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Product, CartItemLocal, SelectedOption } from '@/types/menu'

interface CartContextType {
  cart: CartItemLocal[]
  addToCart: (product: Product, quantity?: number, note?: string, selectedOptions?: SelectedOption[], unitPrice?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNote: (productId: string, note: string) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItemLocal[]>([])

  // LocalStorage'dan sepeti yükle
  useEffect(() => {
    const savedCart = localStorage.getItem('alda_gel_cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error('Sepet yüklenemedi:', error)
      }
    }
  }, [])

  // Sepet değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('alda_gel_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product, quantity: number = 1, note?: string, selectedOptions?: SelectedOption[], unitPrice?: number) => {
    setCart(prevCart => {
      // Opsiyonlu ürünler her zaman ayrı satır olarak eklenir
      const optionKey = selectedOptions && selectedOptions.length > 0
        ? selectedOptions.map(o => o.option_id).sort().join('|')
        : ''

      const existingItem = prevCart.find(item => {
        if (item.product.id !== product.id) return false
        const itemKey = item.selected_options && item.selected_options.length > 0
          ? item.selected_options.map(o => o.option_id).sort().join('|')
          : ''
        return itemKey === optionKey
      })

      if (existingItem) {
        return prevCart.map(item => {
          if (item.product.id !== product.id) return item
          const itemKey = item.selected_options && item.selected_options.length > 0
            ? item.selected_options.map(o => o.option_id).sort().join('|')
            : ''
          if (itemKey !== optionKey) return item
          return { ...item, quantity: item.quantity + quantity, note: note || item.note }
        })
      } else {
        return [...prevCart, { product, quantity, note, selected_options: selectedOptions, unit_price: unitPrice }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }

  const updateNote = (productId: string, note: string) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, note: note } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('alda_gel_cart')
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.unit_price || item.product.price
      return total + price * item.quantity
    }, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateNote,
        clearCart,
        getCartTotal,
        getCartItemCount
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

