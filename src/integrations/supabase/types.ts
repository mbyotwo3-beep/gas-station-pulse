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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      driver_earnings: {
        Row: {
          amount: number
          driver_id: string
          earned_at: string | null
          id: string
          order_id: string | null
          paid_out_at: string | null
          ride_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: string | null
        }
        Insert: {
          amount: number
          driver_id: string
          earned_at?: string | null
          id?: string
          order_id?: string | null
          paid_out_at?: string | null
          ride_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: string | null
        }
        Update: {
          amount?: number
          driver_id?: string
          earned_at?: string | null
          id?: string
          order_id?: string | null
          paid_out_at?: string | null
          ride_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: string | null
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
          verification_documents: Json | null
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
          verification_documents?: Json | null
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
          verification_documents?: Json | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          preparation_time: number | null
          price: number
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          restaurant_id?: string
          updated_at?: string | null
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
      orders: {
        Row: {
          created_at: string | null
          customer_id: string
          delivered_at: string | null
          delivery_fee: number | null
          delivery_location: Json
          driver_id: string | null
          estimated_delivery_time: string | null
          id: string
          items: Json
          payment_method: string | null
          payment_status: string | null
          picked_up_at: string | null
          pickup_location: Json
          restaurant_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          special_instructions: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_location: Json
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          payment_method?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_location: Json
          restaurant_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          special_instructions?: string | null
          status?: string
          subtotal: number
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          delivered_at?: string | null
          delivery_fee?: number | null
          delivery_location?: Json
          driver_id?: string | null
          estimated_delivery_time?: string | null
          id?: string
          items?: Json
          payment_method?: string | null
          payment_status?: string | null
          picked_up_at?: string | null
          pickup_location?: Json
          restaurant_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          special_instructions?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string | null
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
      payment_methods: {
        Row: {
          cardholder_name: string | null
          created_at: string
          expiry_month: number | null
          expiry_year: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_four: string | null
          provider: string | null
          type: string
          updated_at: string
          user_id: string
          wallet_id: string | null
        }
        Insert: {
          cardholder_name?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          provider?: string | null
          type: string
          updated_at?: string
          user_id: string
          wallet_id?: string | null
        }
        Update: {
          cardholder_name?: string | null
          created_at?: string
          expiry_month?: number | null
          expiry_year?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_four?: string | null
          provider?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          wallet_id?: string | null
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          description: string | null
          expires_at: string
          from_user_id: string
          id: string
          status: string
          to_user_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          from_user_id: string
          id?: string
          status?: string
          to_user_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          from_user_id?: string
          id?: string
          status?: string
          to_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          address: string
          created_at: string | null
          cuisine_type: string | null
          delivery_fee: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: Json
          min_order: number | null
          name: string
          operating_hours: Json | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          cuisine_type?: string | null
          delivery_fee?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location: Json
          min_order?: number | null
          name: string
          operating_hours?: Json | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          cuisine_type?: string | null
          delivery_fee?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: Json
          min_order?: number | null
          name?: string
          operating_hours?: Json | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          ride_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          ride_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
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
          completed_at: string | null
          created_at: string
          id: string
          payer_id: string
          payment_method: string
          ride_id: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payer_id: string
          payment_method: string
          ride_id: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          payer_id?: string
          payment_method?: string
          ride_id?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_payments_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: true
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
          rated_by: string
          rated_user: string
          rating: number
          ride_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_by: string
          rated_user: string
          rating: number
          ride_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_by?: string
          rated_user?: string
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
          id: string
          passenger_id: string | null
          passenger_notes: string | null
          payment_status: string | null
          pickup_location: Json
          service_type: Database["public"]["Enums"]["service_type"] | null
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
          id?: string
          passenger_id?: string | null
          passenger_notes?: string | null
          payment_status?: string | null
          pickup_location: Json
          service_type?: Database["public"]["Enums"]["service_type"] | null
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
          id?: string
          passenger_id?: string | null
          passenger_notes?: string | null
          payment_status?: string | null
          pickup_location?: Json
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          created_at: string
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
      station_reports: {
        Row: {
          created_at: string
          id: string
          note: string | null
          station_id: string
          station_name: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          station_id: string
          station_name?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          station_id?: string
          station_name?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_station_reports_station_id"
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
          address: string
          amenities: string[] | null
          brand: string | null
          created_at: string
          created_by: string | null
          fuel_prices: Json | null
          fuel_types: string[] | null
          id: string
          lat: number
          lng: number
          name: string
          operating_hours: Json | null
          photos: string[] | null
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          fuel_prices?: Json | null
          fuel_types?: string[] | null
          id: string
          lat: number
          lng: number
          name: string
          operating_hours?: Json | null
          photos?: string[] | null
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          brand?: string | null
          created_at?: string
          created_by?: string | null
          fuel_prices?: Json | null
          fuel_types?: string[] | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          operating_hours?: Json | null
          photos?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string | null
          description: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method_id: string | null
          payment_method_type: string | null
          processor_response: Json | null
          processor_transaction_id: string | null
          ride_id: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          ride_id?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method_id?: string | null
          payment_method_type?: string | null
          processor_response?: Json | null
          processor_transaction_id?: string | null
          ride_id?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
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
        Args: {
          p_amount: number
          p_payment_method_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      assign_additional_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      deduct_wallet_funds: {
        Args: { p_amount: number; p_user_id: string }
        Returns: boolean
      }
      get_safe_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          primary_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
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
      service_type: "ride" | "food_delivery" | "package_delivery"
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
      service_type: ["ride", "food_delivery", "package_delivery"],
    },
  },
} as const
