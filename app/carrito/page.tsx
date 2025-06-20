"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MainLayout } from "@/components/layout/main-layout";
import { Minus, Plus, Trash2 } from "lucide-react";

// 1. IMPORTAMOS TU HOOK PERSONALIZADO
import { useCart } from "@/hooks/use-cart";

// 2. AJUSTAMOS EL TIPO PARA QUE COINCIDA CON TUS DATOS
//    (nombre, precio, cantidad, imagen_url)
type CartItem = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
  imagen_url?: string | null;
};

export default function CartPage() {
  // 3. USAMOS TU HOOK `useCart` PARA OBTENER LOS DATOS REALES
  const { items: cartItems, total, updateQuantity, removeItem } = useCart();
  
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateSubtotal = (item: CartItem) => {
    return item.precio * item.cantidad;
  };

  // --- FUNCIÓN DE PAGO ADAPTADA ---
  const handlePayment = async () => {
    if (!cartItems || cartItems.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    setIsProcessing(true);

    // Mapeamos los datos del carrito al formato que espera Mercado Pago
    const itemsForMercadoPago = cartItems.map((item) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
    }));

    try {
      // Llamamos a nuestra nueva API Route de Next.js
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: itemsForMercadoPago }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la API devuelve un error, lo mostramos
        throw new Error(data.error || "Error desconocido del servidor");
      }

      // Si todo va bien, redirigimos al usuario al Checkout Pro de Mercado Pago
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert("No se pudo obtener el link de pago. Inténtalo de nuevo.");
      }

    } catch (error) {
      console.error("Error al procesar el pago:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Hubo un error al procesar el pago: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };
  // --- FIN DE LA FUNCIÓN DE PAGO ---

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tu Carrito de Compras</h1>
        {cartItems.length === 0 ? (
          <p>No tienes items en tu carrito.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de tu reserva</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 5. AJUSTAMOS EL JSX PARA USAR TUS PROPIEDADES */}
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b last:border-b-0">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          {item.imagen_url && <img src={item.imagen_url} alt={item.nombre} className="w-16 h-16 rounded-md object-cover" />}
                          <div className="flex-grow">
                            <p className="font-semibold">{item.nombre}</p>
                            <p className="text-sm text-muted-foreground">${item.precio.toFixed(2)} c/u</p>
                            <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-lg w-10 text-center">{item.cantidad}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                            disabled={item.cantidad >= item.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <p className="font-semibold w-24 text-right">${calculateSubtotal(item).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Total a Pagar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    {/* 6. USAMOS EL TOTAL DE TU HOOK */}
                    <span>${Number(total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Impuestos y tasas</span>
                    <span>A calcular</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${Number(total).toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handlePayment} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Procesando..." : "Continuar al Pago"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}