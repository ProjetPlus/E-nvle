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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      calls: {
        Row: {
          answered_at: string | null
          call_type: string | null
          callee_id: string | null
          callee_muted: boolean | null
          callee_video_enabled: boolean | null
          caller_id: string
          caller_muted: boolean | null
          caller_video_enabled: boolean | null
          conversation_id: string | null
          duration: number | null
          ended_at: string | null
          id: string
          is_group: boolean | null
          participants: Json | null
          quality_mode: string | null
          recording_url: string | null
          ring_state: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          answered_at?: string | null
          call_type?: string | null
          callee_id?: string | null
          callee_muted?: boolean | null
          callee_video_enabled?: boolean | null
          caller_id: string
          caller_muted?: boolean | null
          caller_video_enabled?: boolean | null
          conversation_id?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          is_group?: boolean | null
          participants?: Json | null
          quality_mode?: string | null
          recording_url?: string | null
          ring_state?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          answered_at?: string | null
          call_type?: string | null
          callee_id?: string | null
          callee_muted?: boolean | null
          callee_video_enabled?: boolean | null
          caller_id?: string
          caller_muted?: boolean | null
          caller_video_enabled?: boolean | null
          conversation_id?: string | null
          duration?: number | null
          ended_at?: string | null
          id?: string
          is_group?: boolean | null
          participants?: Json | null
          quality_mode?: string | null
          recording_url?: string | null
          ring_state?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          parent_id: string | null
          reactions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_contact_profile_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          muted: boolean | null
          pinned: boolean | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          muted?: boolean | null
          pinned?: boolean | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          muted?: boolean | null
          pinned?: boolean | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_style: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          e2ee_enabled: boolean | null
          ephemeral_ttl: number | null
          id: string
          is_group: boolean | null
          is_locked: boolean | null
          lock_hash: string | null
          lock_method: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_style?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          e2ee_enabled?: boolean | null
          ephemeral_ttl?: number | null
          id?: string
          is_group?: boolean | null
          is_locked?: boolean | null
          lock_hash?: string | null
          lock_method?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_style?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          e2ee_enabled?: boolean | null
          ephemeral_ttl?: number | null
          id?: string
          is_group?: boolean | null
          is_locked?: boolean | null
          lock_hash?: string | null
          lock_method?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          country: string | null
          is_active: boolean | null
          name: string
          rate_to_xof: number | null
          symbol: string
        }
        Insert: {
          code: string
          country?: string | null
          is_active?: boolean | null
          name: string
          rate_to_xof?: number | null
          symbol: string
        }
        Update: {
          code?: string
          country?: string | null
          is_active?: boolean | null
          name?: string
          rate_to_xof?: number | null
          symbol?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          applications_count: number | null
          company: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          job_type: string | null
          location: string | null
          posted_by: string
          salary_range: string | null
          title: string
          views: number | null
        }
        Insert: {
          applications_count?: number | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by: string
          salary_range?: string | null
          title: string
          views?: number | null
        }
        Update: {
          applications_count?: number | null
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: string | null
          location?: string | null
          posted_by?: string
          salary_range?: string | null
          title?: string
          views?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          delivered_to: string[] | null
          edited_at: string | null
          expires_at: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          forwarded_from: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          reactions: Json | null
          read_by: string[] | null
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_to?: string[] | null
          edited_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          delivered_to?: string[] | null
          edited_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          forwarded_from?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_forwarded_from_fkey"
            columns: ["forwarded_from"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string | null
          data: Json | null
          icon: string | null
          id: string
          is_read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          icon?: string | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number | null
          status: string | null
          total_price: number
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number | null
          status?: string | null
          total_price?: number
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number | null
          status?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          likes: number | null
          name: string
          price: number
          seller_id: string
          shares: number | null
          stock: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          likes?: number | null
          name: string
          price?: number
          seller_id: string
          shares?: number | null
          stock?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          likes?: number | null
          name?: string
          price?: number
          seller_id?: string
          shares?: number | null
          stock?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_lock_enabled: boolean | null
          app_lock_hash: string | null
          app_lock_method: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          cover_url: string | null
          created_at: string | null
          currency: string | null
          email: string | null
          full_name: string
          id: string
          language: string | null
          last_seen: string | null
          location: string | null
          notification_sound: string | null
          phone: string | null
          phone_changed_at: string | null
          profession: string | null
          profile_completed: boolean | null
          push_enabled: boolean | null
          ringtone: string | null
          searchable_phone: string | null
          status: string | null
          theme: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          app_lock_enabled?: boolean | null
          app_lock_hash?: string | null
          app_lock_method?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string
          id: string
          language?: string | null
          last_seen?: string | null
          location?: string | null
          notification_sound?: string | null
          phone?: string | null
          phone_changed_at?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          push_enabled?: boolean | null
          ringtone?: string | null
          searchable_phone?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          app_lock_enabled?: boolean | null
          app_lock_hash?: string | null
          app_lock_method?: string | null
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string | null
          full_name?: string
          id?: string
          language?: string | null
          last_seen?: string | null
          location?: string | null
          notification_sound?: string | null
          phone?: string | null
          phone_changed_at?: string | null
          profession?: string | null
          profile_completed?: boolean | null
          push_enabled?: boolean | null
          ringtone?: string | null
          searchable_phone?: string | null
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          emoji: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      shares: {
        Row: {
          channel: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          allow_reshare: boolean | null
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_live: boolean | null
          live_participants: Json | null
          live_status: string | null
          media_type: string | null
          media_url: string
          reactions: Json | null
          reshared_from: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          allow_reshare?: boolean | null
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_live?: boolean | null
          live_participants?: Json | null
          live_status?: string | null
          media_type?: string | null
          media_url: string
          reactions?: Json | null
          reshared_from?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          allow_reshare?: boolean | null
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_live?: boolean | null
          live_participants?: Json | null
          live_status?: string | null
          media_type?: string | null
          media_url?: string
          reactions?: Json | null
          reshared_from?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_reshared_from_fkey"
            columns: ["reshared_from"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_name: string
          device_type: string | null
          id: string
          is_current: boolean | null
          last_active: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name: string
          device_type?: string | null
          id?: string
          is_current?: boolean | null
          last_active?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string
          device_type?: string | null
          id?: string
          is_current?: boolean | null
          last_active?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          recipient_id: string | null
          status: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          status?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          recipient_id?: string | null
          status?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_ephemeral_messages: { Args: never; Returns: undefined }
      generate_otp: { Args: { p_email: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      verify_otp: { Args: { p_code: string; p_email: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
