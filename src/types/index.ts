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
  background_image?: string | null;
  logo_image?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  fee?: number;
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  isMember?: boolean;
  hasPendingRequest?: boolean;
}

// Member types
export interface Member {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'creator' | 'officer' | 'member';
  status: 'active' | 'left' | 'banned';
  joined_at: string;
  profiles?: {
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

// Event Member types
export interface EventMember {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'joined';
  joined_at: string;
  payment_proof?: string | null;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
}

// Extended Organization type with wallet balance
export interface OrganizationWithWallet extends Organization {
  wallet_balance?: number;
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

// Wallet Transaction types
export interface WalletTransaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  reference: string | null;
  created_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

// Event Transaction types
export interface EventTransaction {
  id: string;
  event_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_proof?: string | null;
  created_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
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
