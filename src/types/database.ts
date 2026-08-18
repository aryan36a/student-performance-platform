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
      admin_users: {
        Row: {
          created_at: string
          email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_scores: {
        Row: {
          coding: number
          computer_fundamentals: number
          created_at: string
          id: string
          import_id: string
          logical_reasoning: number
          pseudocode_debugging: number
          quantitative_aptitude: number
          student_id: string
          total: number
          updated_at: string
          verbal_ability: number
        }
        Insert: {
          coding: number
          computer_fundamentals: number
          created_at?: string
          id?: string
          import_id: string
          logical_reasoning: number
          pseudocode_debugging: number
          quantitative_aptitude: number
          student_id: string
          total: number
          updated_at?: string
          verbal_ability: number
        }
        Update: {
          coding?: number
          computer_fundamentals?: number
          created_at?: string
          id?: string
          import_id?: string
          logical_reasoning?: number
          pseudocode_debugging?: number
          quantitative_aptitude?: number
          student_id?: string
          total?: number
          updated_at?: string
          verbal_ability?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
  Row: {
    created_at: string;
    error_count: number;
    filename: string;
    id: string;
    identity_conflict_records: number;
    multiple_entry_records: number;
    notes: string | null;
    raw_entries: number;
    status: string;
    student_count: number;
    test_name: string;
    max_scores: {
      computer_fundamentals: number;
      quantitative_aptitude: number;
      logical_reasoning: number;
      verbal_ability: number;
      pseudocode_debugging: number;
      coding: number;
    } | null;
    unique_students: number;
    uploaded_at: string;
    uploaded_by: string | null;
    warning_count: number;
  };

  Insert: {
    created_at?: string;
    error_count?: number;
    filename: string;
    id?: string;
    identity_conflict_records?: number;
    multiple_entry_records?: number;
    notes?: string | null;
    raw_entries?: number;
    status: string;
    student_count?: number;
    test_name: string;
    max_scores: {
      computer_fundamentals: number;
      quantitative_aptitude: number;
      logical_reasoning: number;
      verbal_ability: number;
      pseudocode_debugging: number;
      coding: number;
    };
    unique_students?: number;
    uploaded_at?: string;
    uploaded_by?: string | null;
    warning_count?: number;
  };

  Update: {
    created_at?: string;
    error_count?: number;
    filename?: string;
    id?: string;
    identity_conflict_records?: number;
    multiple_entry_records?: number;
    notes?: string | null;
    raw_entries?: number;
    status?: string;
    student_count?: number;
    test_name?: string;
    max_scores?: {
      computer_fundamentals: number;
      quantitative_aptitude: number;
      logical_reasoning: number;
      verbal_ability: number;
      pseudocode_debugging: number;
      coding: number;
    } | null;
    unique_students?: number;
    uploaded_at?: string;
    uploaded_by?: string | null;
    warning_count?: number;
  };

  Relationships: [];
},
      student_public_scores: {
        Row: {
          branch: string
          coding: number
          computer_fundamentals: number
          created_at: string
          division: string
          duplicate_type: string | null
          has_multiple_entries: boolean
          id: string
          import_id: string
          logical_reasoning: number
          name: string
          pseudocode_debugging: number
          quantitative_aptitude: number
          student_id: string
          total: number
          updated_at: string
          verbal_ability: number
        }
        Insert: {
          branch: string
          coding: number
          computer_fundamentals: number
          created_at?: string
          division: string
          duplicate_type?: string | null
          has_multiple_entries?: boolean
          id?: string
          import_id: string
          logical_reasoning: number
          name: string
          pseudocode_debugging: number
          quantitative_aptitude: number
          student_id: string
          total: number
          updated_at?: string
          verbal_ability: number
        }
        Update: {
          branch?: string
          coding?: number
          computer_fundamentals?: number
          created_at?: string
          division?: string
          duplicate_type?: string | null
          has_multiple_entries?: boolean
          id?: string
          import_id?: string
          logical_reasoning?: number
          name?: string
          pseudocode_debugging?: number
          quantitative_aptitude?: number
          student_id?: string
          total?: number
          updated_at?: string
          verbal_ability?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_public_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          branch: string
          created_at: string
          division: string
          email: string | null
          id: string
          mobile: string | null
          name: string
          prn: string
          updated_at: string
        }
        Insert: {
          branch: string
          created_at?: string
          division: string
          email?: string | null
          id?: string
          mobile?: string | null
          name: string
          prn: string
          updated_at?: string
        }
        Update: {
          branch?: string
          created_at?: string
          division?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string
          prn?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_all_student_imports: {
  Args: Record<PropertyKey, never>;
  Returns: undefined;
};

delete_student_import: {
  Args: {
    p_import_id: string;
  };
  Returns: undefined;
};
      is_admin: { Args: never; Returns: boolean }
      replace_student_dataset: {
        Args: {
          payload: Json
          p_filename: string
          p_test_name: string
          p_max_scores: Json
          p_identity_conflict_records: number
          p_multiple_entry_records: number
          p_raw_entries: number
          p_unique_students: number
          p_warning_count: number
          
        }
        Returns: string
      }
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
