export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          content: string;
          slug: string;
          section: string;
          published: boolean;
          order: number;
        };
      };
      announcements: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: string;
          expires_at: string | null;
          published: boolean;
        };
      };
    };
  };
} 