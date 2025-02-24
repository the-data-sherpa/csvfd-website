export interface Page {
  id: string;
  slug: string;
  title: string;
  section: string;
  content: string;
  order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
  meta_description: string | null;
  meta_keywords: string | null;
}

export interface SiteUser {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'webmaster' | 'admin';
  created_at: string;
}

export interface MonthlyCallStat {
  id: string;
  year: number;
  month: number;
  fires: number;
  medical: number;
  created_at: string;
  updated_at: string;
}

export interface YearlyCallStat {
  id: string;
  year: number;
  total_calls: number;
  created_at: string;
  updated_at: string;
}

export type PageSection = 'our-department' | 'services' | 'memorials' | 'cool-spring' | 'members';