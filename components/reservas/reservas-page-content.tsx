"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Calendar, Edit, Trash2, Eye, Clock, CheckCircle, XCircle, Plus, Minus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { supabase, isSupabaseAvailable } from "@/lib/supabase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import type { Order, OrderItem, Product } from "@/types/database"

interface OrderWithDetails extends Order {
  order_items: (OrderItem & { products: Product })[]
}

interface EditableOrderItem extends OrderItem {
  products: Product
}

export function ReservasPageContent() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [editingOrder, setEditingOrder] = useState<OrderWithDetails | null>(null)
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>([])
  const [activeTab, setActiveTab] = useState("todas")

  useEffect(() => {
    if (user && isSupabaseAvailable) {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (editingOrder) {
      setEditableItems(JSON.parse(JSON.stringify(editingOrder.order_items)))
    }
  }, [editingOrder])

  const loadOrders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items (*, products (*)) `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
      toast({ title: "Error", description: "No se pudieron cargar tus reservas", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrder = async () => {
    if (!editingOrder || !user) return;

    const originalOrder = orders.find(o => o.id === editingOrder.id);
    if (!originalOrder) {
      toast({ title: "Error", description: "No se encontró la orden original.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const newTotal = editableItems.reduce((total, item) => total + item.price * item.quantity, 0);

      for (const item of editableItems) {
        const originalItem = originalOrder.order_items.find(oi => oi.id === item.id);
        if (!originalItem) continue;

        const quantityChange = item.quantity - originalItem.quantity;

        if (quantityChange !== 0) {
          // Obtenemos el stock más reciente para minimizar condiciones de carrera
          const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.products.id)
            .single();

          if (fetchError || !product) {
            throw new Error(`No se pudo obtener el stock actual para ${item.products.nombre}.`);
          }

          const newStock = product.stock - quantityChange;

          // Verificación final para asegurar que no se venda más de lo disponible
          if (newStock < 0) {
            throw new Error(`Stock insuficiente para ${item.products.nombre}. Solo quedan ${product.stock} unidades.`);
          }

          const { error: stockError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.products.id);

          if (stockError) {
            throw new Error(`Error al ajustar el stock para ${item.products.nombre}: ${stockError.message}`);
          }
        }

        const { error: itemError } = await supabase
          .from('order_items')
          .update({ quantity: item.quantity })
          .eq('id', item.id);

        if (itemError) {
          throw new Error(`Error al actualizar el item ${item.products.nombre}: ${itemError.message}`);
        }
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update({ total: newTotal, updated_at: new Date().toISOString() })
        .eq('id', editingOrder.id);

      if (orderError) {
        throw new Error(`Error al actualizar el total de la orden: ${orderError.message}`);
      }

      toast({ title: "Reserva Actualizada", description: "Los cambios se guardaron exitosamente." });
      setEditingOrder(null);
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast({
        title: "Error en la Actualización",
        description: error.message || "No se pudieron guardar todos los cambios. Por favor, revisa la reserva.",
        variant: "destructive",
      });
    } finally {
      await loadOrders();
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    // Implementation remains the same
  }

  const handleQuantityChange = (itemId: string, delta: number) => {
    setEditableItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + delta;
          const stock = item.products.stock + (editingOrder?.order_items.find(i => i.id === itemId)?.quantity || 0);
          if (newQuantity > 0 && newQuantity <= stock) {
            return { ...item, quantity: newQuantity };
          }
        }
        return item;
      })
    );
  };

  // JSX and other functions remain largely the same, with modifications in the Dialog for editing.
  // The following is a condensed representation of the JSX for brevity.

  if (!user) { /* ... no changes ... */ }
  if (!isSupabaseAvailable) { /* ... no changes ... */ }

  const getStatusColor = (status: string) => { /* ... no changes ... */ }
  const getStatusIcon = (status: string) => { /* ... no changes ... */ }
  const getTypeIcon = (type: string) => { /* ... no changes ... */ }

  const filteredOrders = activeTab === "todas" ? orders : orders.filter((order) => order.status === activeTab)

  if (loading) { /* ... no changes ... */ }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ... Header and Tabs ... */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="grid w-full grid-cols-5 mb-8">
           <TabsTrigger value="todas">Todas</TabsTrigger>
           <TabsTrigger value="pending">Pendientes</TabsTrigger>
           <TabsTrigger value="confirmed">Confirmadas</TabsTrigger>
           <TabsTrigger value="delivered">Completadas</TabsTrigger>
           <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
         </TabsList>

        <TabsContent value={activeTab}>
          {filteredOrders.length === 0 ? (
             <div className="text-center py-12">
               <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-gray-700 mb-2">
                 No tienes reservas {activeTab === "todas" ? "" : activeTab}
               </h3>
               <p className="text-gray-500 mb-4">Explora nuestros servicios y haz tu primera reserva</p>
               <Button asChild className="bg-[#1B4965] hover:bg-[#5FA8D3] text-white">
                 <Link href="/servicios">Explorar Servicios</Link>
               </Button>
             </div>
           ) : (
             <div className="grid gap-6">
               {filteredOrders.map((order) => (
                 <Card key={order.id} className="hover:shadow-lg transition-shadow duration-300">
                   <CardHeader>
                     <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                         <div className="flex items-center space-x-2">
                           {order.order_items.map((item) => (
                             <span key={item.id} className="text-2xl">
                               {getTypeIcon(item.products.tipo)}
                             </span>
                           ))}
                         </div>
                         <div>
                           <CardTitle className="text-xl text-[#1B4965]">Reserva #{order.id.slice(0, 8)}</CardTitle>
                           <p className="text-sm text-gray-500">
                             {format(new Date(order.created_at), "PPP", { locale: es })}
                           </p>
                         </div>
                       </div>
                       <Badge className={getStatusColor(order.status)}>
                         <div className="flex items-center space-x-1">
                           {getStatusIcon(order.status)}
                           <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                         </div>
                       </Badge>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <div className="space-y-4">
                       {/* Order Items */}
                       <div>
                         <h4 className="font-medium text-gray-700 mb-2">Productos:</h4>
                         <div className="space-y-2">
                           {order.order_items.map((item) => (
                             <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                               <div className="flex items-center space-x-2">
                                 <span>{getTypeIcon(item.products.tipo)}</span>
                                 <span className="font-medium">{item.products.nombre}</span>
                                 <span className="text-sm text-gray-500">x{item.quantity}</span>
                               </div>
                               <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                             </div>
                           ))}
                         </div>
                       </div>

                      {/* Total */}
                       <div className="flex justify-between items-center pt-2 border-t">
                         <span className="font-semibold">Total:</span>
                         <span className="text-xl font-bold text-[#1B4965]">${order.total.toLocaleString()}</span>
                       </div>

                      {/* Actions */}
                       <div className="flex flex-wrap gap-3 pt-4">
                        {/* ... View Details Dialog (no changes) ... */}

                        {order.status === "pending" && (
                          <>
                            <Dialog open={!!editingOrder && editingOrder.id === order.id} onOpenChange={(isOpen) => !isOpen && setEditingOrder(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                  onClick={() => setEditingOrder(order)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modificar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Modificar Reserva</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {editableItems.map(item => {
                                    const originalItem = editingOrder?.order_items.find(i => i.id === item.id);
                                    const currentStock = item.products.stock + (originalItem?.quantity || 0) - item.quantity;
                                    return (
                                      <div key={item.id} className="flex items-center justify-between">
                                        <span className="font-medium">{item.products.nombre}</span>
                                        <div className="flex items-center gap-2">
                                          <Button size="icon" variant="outline" onClick={() => handleQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span>{item.quantity}</span>
                                          <Button size="icon" variant="outline" onClick={() => handleQuantityChange(item.id, 1)} disabled={item.quantity >= item.products.stock + (originalItem?.quantity || 0)}>
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <span className="text-sm text-gray-500">Stock: {currentStock}</span>
                                      </div>
                                    );
                                  })}
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setEditingOrder(null)}>
                                      Cancelar
                                    </Button>
                                    <Button onClick={handleUpdateOrder}>Guardar Cambios</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* ... Cancel Order AlertDialog (no changes) ... */}
                          </>
                        )}
                      </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>
       </Tabs>
    </div>
  )
}
