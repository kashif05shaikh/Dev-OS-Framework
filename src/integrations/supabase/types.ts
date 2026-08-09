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
          activity: Json
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
          submissions_count: number
          sync_error: string | null
          sync_status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          activity?: Json
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
          submissions_count?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          activity?: Json
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
          submissions_count?: number
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_seconds: number
          completed: boolean
          created_at: string
          ended_at: string | null
          id: string
          label: string | null
          mode: string
          notes: string | null
          planned_minutes: number
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_seconds?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          label?: string | null
          mode?: string
          notes?: string | null
          planned_minutes?: number
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_seconds?: number
          completed?: boolean
          created_at?: string
          ended_at?: string | null
          id?: string
          label?: string | null
          mode?: string
          notes?: string | null
          planned_minutes?: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_milestones: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          goal_id: string
          id: string
          position: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          goal_id: string
          id?: string
          position?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          goal_id?: string
          id?: string
          position?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_milestones_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_value: number
          description: string | null
          due_date: string | null
          id: string
          pinned: boolean
          position: number
          priority: string
          status: string
          target_value: number
          timeframe: string
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          pinned?: boolean
          position?: number
          priority?: string
          status?: string
          target_value?: number
          timeframe?: string
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: number
          description?: string | null
          due_date?: string | null
          id?: string
          pinned?: boolean
          position?: number
          priority?: string
          status?: string
          target_value?: number
          timeframe?: string
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          count: number
          created_at: string
          habit_id: string
          id: string
          log_date: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          habit_id: string
          id?: string
          log_date?: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          best_streak: number
          color: string
          created_at: string
          current_streak: number
          description: string | null
          frequency: string
          icon: string
          id: string
          name: string
          position: number
          target_per_period: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          best_streak?: number
          color?: string
          created_at?: string
          current_streak?: number
          description?: string | null
          frequency?: string
          icon?: string
          id?: string
          name: string
          position?: number
          target_per_period?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          best_streak?: number
          color?: string
          created_at?: string
          current_streak?: number
          description?: string | null
          frequency?: string
          icon?: string
          id?: string
          name?: string
          position?: number
          target_per_period?: number
          updated_at?: string
          user_id?: string
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
          file_name: string | null
          file_path: string | null
          file_size: number | null
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
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
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
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
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
      platform_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          expires_at: string | null
          handle: string | null
          id: string
          last_error: string | null
          platform: string
          platform_user_id: string | null
          secret_ciphertext: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          platform: string
          platform_user_id?: string | null
          secret_ciphertext?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          expires_at?: string | null
          handle?: string | null
          id?: string
          last_error?: string | null
          platform?: string
          platform_user_id?: string | null
          secret_ciphertext?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      social_accounts: {
        Row: {
          auto_sync: boolean
          connected: boolean
          created_at: string
          id: string
          last_error: string | null
          last_synced: string | null
          platform: string
          position: number
          profile_url: string | null
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          auto_sync?: boolean
          connected?: boolean
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced?: string | null
          platform: string
          position?: number
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          auto_sync?: boolean
          connected?: boolean
          created_at?: string
          id?: string
          last_error?: string | null
          last_synced?: string | null
          platform?: string
          position?: number
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      social_profile_cache: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          extra_json: Json
          followers: number | null
          following: number | null
          handle: string | null
          id: string
          joined_at: string | null
          location: string | null
          platform: string
          posts: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          extra_json?: Json
          followers?: number | null
          following?: number | null
          handle?: string | null
          id?: string
          joined_at?: string | null
          location?: string | null
          platform: string
          posts?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          extra_json?: Json
          followers?: number | null
          following?: number | null
          handle?: string | null
          id?: string
          joined_at?: string | null
          location?: string | null
          platform?: string
          posts?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
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
