// Organization types
export interface Organization {
  id: string;
  name: string;
  description: string;
  adviser_name: string | null;
  club_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  creator_id: string;
  member_count?: number;
  created_at: string;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

// Member types - UPDATED
export interface Member {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'creator' | 'officer' | 'member';
  status: 'active' | 'left' | 'banned' | 'pending' | 'approved' | 'rejected';
  joined_at: string;
  reference_number?: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

// Event types
export interface Event {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  deadline: string | null;
  capacity: number;
  fee: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_by: string;
  created_at: string;
}

// Transaction types
export interface Transaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  reference: string | null;
  gcash_fee: number;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

// Announcement types
export interface Announcement {
  id: string;
  organization_id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

// Registration code types
export interface RegistrationCode {
  id: string;
  code: string;
  used: boolean;
  created_at: string;
}

// Organization Member type for Supabase operations
export type OrganizationMemberInsert = Omit<Member, 'id' | 'joined_at' | 'profile'> & {
  profile?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
};

// Join Request type
export interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reference_number?: string | null;
  created_at: string;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url?: string | null;
  };
  organization?: {
    id: string;
    name: string;
  };
}