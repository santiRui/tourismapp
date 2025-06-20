export interface Database {
  public: {
    Tables: {
      productos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          tipo: "vuelo" | "hospedaje" | "auto" | "paquete"
          precio: number
          precio_original: number | null
          stock: number
          imagen_url: string | null
          destacado: boolean
          activo: boolean
          destino: string | null
          duracion: string | null
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          tipo: "vuelo" | "hospedaje" | "auto" | "paquete"
          precio: number
          precio_original?: number | null
          stock?: number
          imagen_url?: string | null
          destacado?: boolean
          activo?: boolean
          destino?: string | null
          duracion?: string | null
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          tipo?: "vuelo" | "hospedaje" | "auto" | "paquete"
          precio?: number
          precio_original?: number | null
          stock?: number
          imagen_url?: string | null
          destacado?: boolean
          activo?: boolean
          destino?: string | null
          duracion?: string | null
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
      }
      usuarios: {
        Row: {
          id: string
          email: string
          nombre_completo: string | null
          telefono: string | null
          tipo_usuario: "cliente" | "admin"
          activo: boolean
          fecha_creacion: string
          fecha_actualizacion: string
        }
        Insert: {
          id: string
          email: string
          nombre_completo?: string | null
          telefono?: string | null
          tipo_usuario?: "cliente" | "admin"
          activo?: boolean
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
        Update: {
          id?: string
          email?: string
          nombre_completo?: string | null
          telefono?: string | null
          tipo_usuario?: "cliente" | "admin"
          activo?: boolean
          fecha_creacion?: string
          fecha_actualizacion?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: string
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          total: number
        }
        Update: {
          id?: string
          status?: string
          total?: number
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          quantity?: number
          price?: number
        }
      }
    }
  }
}

// Tipo para productos (usando nombres en español)
export type Producto = Database["public"]["Tables"]["productos"]["Row"]

// Tipo para usuarios
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"]

// Tipo para ordenes
export type Order = Database["public"]["Tables"]["orders"]["Row"]

// Tipo para items de orden
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]

// Para compatibilidad con código existente, mantenemos el tipo Product como alias
export type Product = Producto

