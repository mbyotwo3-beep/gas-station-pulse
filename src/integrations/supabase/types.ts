export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      driver_earnings: {
        Row: {
          amount: number
          created_at: string
          driver_id: string
          id: string
          order_id: string | null
          ride_id: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          driver_id: string
          id?: string
          order_id?: string | null
          ride_id?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          driver_id?: string
          id?: string
          order_id?: string | null
          ride_id?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string
          current_location: Json | null
          id: string
          is_active: boolean
          license_plate: string | null
          rating: number | null
          total_rides: number | null
          updated_at: string
          user_id: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_type: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          current_location?: Json | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          current_location?: Json | null
          id?: string
          is_active?: boolean
          license_plate?: string | null
          rating?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_type?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          delivery_fee: number | null
          delivery_location: Json | null
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          items: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_location: Json | null
          restaurant_id: string | null
          service_type: string
          status: string
          subtotal: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          delivery_fee?: number | null
          delivery_location?: Json | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: Json | null
          restaurant_id?: string | null
          service_type?: string
          status?: string
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          delivery_fee?: number | null
          delivery_location?: Json | null
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_location?: Json | null
          restaurant_id?: string | null
          service_type?: string
          status?: string
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          recipient_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferences: Json | null
          primary_role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          preferences?: Json | null
          primary_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          primary_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          cuisine_type: string | null
          delivery_fee: number | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          minimum_order: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuisine_type?: string | null
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          minimum_order?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          cuisine_type?: string | null
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          minimum_order?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ride_cancellations: {
        Row: {
          cancelled_by: string
          created_at: string
          id: string
          reason: string | null
          ride_id: string
          role: string | null
        }
        Insert: {
          cancelled_by: string
          created_at?: string
          id?: string
          reason?: string | null
          ride_id: string
          role?: string | null
        }
        Update: {
          cancelled_by?: string
          created_at?: string
          id?: string
          reason?: string | null
          ride_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_cancellations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_disputes: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          reporter_id: string
          ride_id: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          reporter_id: string
          ride_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          reporter_id?: string
          ride_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_disputes_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          ride_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          ride_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          ride_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payee_id: string | null
          payer_id: string
          payment_method: string
          reference_id: string | null
          ride_id: string
          status: string
          tip_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payee_id?: string | null
          payer_id: string
          payment_method?: string
          reference_id?: string | null
          ride_id: string
          status?: string
          tip_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payee_id?: string | null
          payer_id?: string
          payment_method?: string
          reference_id?: string | null
          ride_id?: string
          status?: string
          tip_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          ratee_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id: string
          rater_id: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          ratee_id?: string
          rater_id?: string
          rating?: number
          ride_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          created_at: string
          destination_location: Json
          expires_at: string
          id: string
          max_fare: number | null
          notes: string | null
          passenger_count: number
          passenger_id: string
          pickup_location: Json
          status: string
        }
        Insert: {
          created_at?: string
          destination_location: Json
          expires_at?: string
          id?: string
          max_fare?: number | null
          notes?: string | null
          passenger_count?: number
          passenger_id: string
          pickup_location: Json
          status?: string
        }
        Update: {
          created_at?: string
          destination_location?: Json
          expires_at?: string
          id?: string
          max_fare?: number | null
          notes?: string | null
          passenger_count?: number
          passenger_id?: string
          pickup_location?: Json
          status?: string
        }
        Relationships: []
      }
      rides: {
        Row: {
          completed_at: string | null
          created_at: string
          destination_location: Json
          driver_id: string | null
          driver_notes: string | null
          estimated_distance: number | null
          estimated_duration: number | null
          fare_amount: number | null
          fare_breakdown: Json | null
          id: string
          otp_code: string | null
          passenger_id: string
          passenger_notes: string | null
          pickup_location: Json
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          destination_location: Json
          driver_id?: string | null
          driver_notes?: string | null
          estimated_distance?: number | null
          estimated_duration?: number | null
          fare_amount?: number | null
          fare_breakdown?: Json | null
          id?: string
          otp_code?: string | null
          passenger_id: string
          passenger_notes?: string | null
          pickup_location: Json
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          destination_location?: Json
          driver_id?: string | null
          driver_notes?: string | null
          estimated_distance?: number | null
          estimated_duration?: number | null
          fare_amount?: number | null
          fare_breakdown?: Json | null
          id?: string
          otp_code?: string | null
          passenger_id?: string
          passenger_notes?: string | null
          pickup_location?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          type: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          type?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          created_at: string
          distance: number | null
          duration: number | null
          end_location: Json
          id: string
          name: string
          start_location: Json
          updated_at: string
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          created_at?: string
          distance?: number | null
          duration?: number | null
          end_location: Json
          id?: string
          name: string
          start_location: Json
          updated_at?: string
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          created_at?: string
          distance?: number | null
          duration?: number | null
          end_location?: Json
          id?: string
          name?: string
          start_location?: Json
          updated_at?: string
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: []
      }
      station_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          station_id: string
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          station_id: string
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          station_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_photos_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          station_id: string
          station_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          station_id: string
          station_name?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          station_id?: string
          station_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_reports_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      station_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          station_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          station_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          station_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_reviews_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string | null
          amenities: Json | null
          brand: string | null
          created_at: string
          created_by: string | null
          fuel_prices: Json | null
          fuel_types: Json | null
          id: string
          lat: number
          lng: number
          name: string
          operating_hours: Json | null
          photos: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          fuel_prices?: Json | null
          fuel_types?: Json | null
          id: string
          lat: number
          lng: number
          name: string
          operating_hours?: Json | null
          photos?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          fuel_prices?: Json | null
          fuel_types?: Json | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          operating_hours?: Json | null
          photos?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          reference_id: string | null
          service_id: string | null
          service_type: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          service_id?: string | null
          service_type?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_wallet_funds: {
        Args: { p_amount: number; p_transaction_id?: string; p_user_id: string }
        Returns: boolean
      }
      assign_additional_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      assign_nearest_runner: { Args: { p_order_id: string }; Returns: boolean }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      deduct_wallet_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      get_safe_driver_profile: {
        Args: { _user_id: string }
        Returns: {
          current_location: Json
          is_active: boolean
          license_plate: string
          rating: number
          total_rides: number
          user_id: string
          vehicle_make: string
          vehicle_model: string
          vehicle_type: string
          verification_status: string
          verified_at: string
          verified_by: string
        }[]
      }
      get_safe_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          primary_role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      settle_service_payment: {
        Args: {
          p_amount: number
          p_reference_id?: string
          p_service_id: string
          p_service_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      transfer_wallet_funds: {
        Args: {
          p_amount: number
          p_description?: string
          p_from_user_id: string
          p_to_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "driver" | "manager" | "admin" | "passenger"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "driver", "manager", "admin", "passenger"],
    },
  },
} as const
