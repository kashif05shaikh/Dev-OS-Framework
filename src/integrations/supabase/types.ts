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
      ai_prompts: {
        Row: {
          body: string
          category: string
          created_at: string
          favorite: boolean
          id: string
          last_used_at: string | null
          model: string | null
          position: number
          tags: string[]
          title: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          model?: string | null
          position?: number
          tags?: string[]
          title: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          model?: string | null
          position?: number
          tags?: string[]
          title?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          color: string
          completed: boolean
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          kind: string
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          kind?: string
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          kind?: string
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coding_profiles: {
        Row: {
          contests_attended: number
          created_at: string
          current_streak: number
          id: string
          last_synced_at: string | null
          max_streak: number
          notes: string | null
          platform: string
          position: number
          problems_solved: number
          profile_url: string | null
          rank_label: string | null
          rating: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          contests_attended?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_synced_at?: string | null
          max_streak?: number
          notes?: string | null
          platform?: string
          position?: number
          problems_solved?: number
          profile_url?: string | null
          rank_label?: string | null
          rating?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          contests_attended?: number
          created_at?: string
          current_streak?: number
          id?: string
          last_synced_at?: string | null
          max_streak?: number
          notes?: string | null
          platform?: string
          position?: number
          problems_solved?: number
          profile_url?: string | null
          rank_label?: string | null
          rating?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_on: string | null
          company: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          follow_up_on: string | null
          id: string
          job_url: string | null
          location: string | null
          notes: string | null
          position: number
          role_title: string
          salary_range: string | null
          status: string
          updated_at: string
          user_id: string
          work_mode: string
        }
        Insert: {
          applied_on?: string | null
          company: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          follow_up_on?: string | null
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          position?: number
          role_title: string
          salary_range?: string | null
          status?: string
          updated_at?: string
          user_id: string
          work_mode?: string
        }
        Update: {
          applied_on?: string | null
          company?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          follow_up_on?: string | null
          id?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          position?: number
          role_title?: string
          salary_range?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          work_mode?: string
        }
        Relationships: []
      }
      learning_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_folders_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          favorite: boolean
          folder_id: string | null
          id: string
          progress_percent: number
          subject_id: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          favorite?: boolean
          folder_id?: string | null
          id?: string
          progress_percent?: number
          subject_id: string
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          favorite?: boolean
          folder_id?: string | null
          id?: string
          progress_percent?: number
          subject_id?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "learning_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_resources_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          archived: boolean
          content_markdown: string
          created_at: string
          folder_id: string | null
          id: string
          pinned: boolean
          subject_id: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          content_markdown?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          subject_id: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          content_markdown?: string
          created_at?: string
          folder_id?: string | null
          id?: string
          pinned?: boolean
          subject_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accent_color: string
          created_at: string
          display_name: string | null
          id: string
          theme: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          display_name?: string | null
          id: string
          theme?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          display_name?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          live_url: string | null
          name: string
          notes: string | null
          pinned: boolean
          position: number
          progress_percent: number
          repo_url: string | null
          status: string
          tech_stack: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          live_url?: string | null
          name: string
          notes?: string | null
          pinned?: boolean
          position?: number
          progress_percent?: number
          repo_url?: string | null
          status?: string
          tech_stack?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          live_url?: string | null
          name?: string
          notes?: string | null
          pinned?: boolean
          position?: number
          progress_percent?: number
          repo_url?: string | null
          status?: string
          tech_stack?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resume_entries: {
        Row: {
          bullets: string[]
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          location: string | null
          organization: string | null
          position: number
          section_id: string
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bullets?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          organization?: string | null
          position?: number
          section_id: string
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bullets?: string[]
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          location?: string | null
          organization?: string | null
          position?: number
          section_id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_entries_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "resume_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      resume_sections: {
        Row: {
          created_at: string
          id: string
          kind: string
          position: number
          resume_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          position?: number
          resume_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          position?: number
          resume_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_sections_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          is_default: boolean
          linkedin_url: string | null
          location: string | null
          phone: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          is_default?: boolean
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          is_default?: boolean
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          position?: number
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
