// This file contains SQL setup for new database tables
// Run these SQL commands in your Supabase SQL editor

// Freedom Wall Posts Table
const freedomWallPostsTable = `
CREATE TABLE IF NOT EXISTS freedom_wall_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// Freedom Wall Comments Table
const freedomWallCommentsTable = `
CREATE TABLE IF NOT EXISTS freedom_wall_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES freedom_wall_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// Freedom Wall Likes Table
const freedomWallLikesTable = `
CREATE TABLE IF NOT EXISTS freedom_wall_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES freedom_wall_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// Event Join Requests Table
const eventJoinRequestsTable = `
CREATE TABLE IF NOT EXISTS event_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES organization_events(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  payment_proof TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

// RLS Policies for Freedom Wall
const freedomWallRLSPolicies = `
-- Allow users to create posts in their organization
CREATE POLICY "Users can create posts in their organization"
  ON freedom_wall_posts
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM organization_members 
     WHERE organization_id = NEW.organization_id 
     AND user_id = NEW.user_id 
     AND status = 'active') > 0
  );

-- Allow users to read posts from their organization
CREATE POLICY "Users can read posts from their organization"
  ON freedom_wall_posts
  FOR SELECT
  USING (
    (SELECT COUNT(*) FROM organization_members 
     WHERE organization_id = freedom_wall_posts.organization_id 
     AND user_id = auth.uid() 
     AND status = 'active') > 0
  );

-- Allow users to update/delete their own posts
CREATE POLICY "Users can update/delete their own posts"
  ON freedom_wall_posts
  FOR UPDATE, DELETE
  USING (user_id = auth.uid());

-- Allow users to create comments on posts they can see
CREATE POLICY "Users can comment on visible posts"
  ON freedom_wall_comments
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM freedom_wall_posts 
     WHERE id = NEW.post_id 
     AND organization_id IN (
       SELECT organization_id FROM organization_members 
       WHERE user_id = NEW.user_id AND status = 'active'
     )) > 0
  );

-- Allow users to read comments on visible posts
CREATE POLICY "Users can read comments on visible posts"
  ON freedom_wall_comments
  FOR SELECT
  USING (
    (SELECT COUNT(*) FROM freedom_wall_posts 
     WHERE id = freedom_wall_comments.post_id 
     AND organization_id IN (
       SELECT organization_id FROM organization_members 
       WHERE user_id = auth.uid() AND status = 'active'
     )) > 0
  );

-- Allow users to like posts they can see
CREATE POLICY "Users can like visible posts"
  ON freedom_wall_likes
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM freedom_wall_posts 
     WHERE id = NEW.post_id 
     AND organization_id IN (
       SELECT organization_id FROM organization_members 
       WHERE user_id = NEW.user_id AND status = 'active'
     )) > 0
  );

-- Allow users to delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON freedom_wall_likes
  FOR DELETE
  USING (user_id = auth.uid());

-- Allow users to see if they've liked a post
CREATE POLICY "Users can check their own likes"
  ON freedom_wall_likes
  FOR SELECT
  USING (user_id = auth.uid());
`;

// RLS Policies for Event Join Requests
const eventJoinRequestsRLSPolicies = `
-- Allow users to create join requests for events in organizations they're members of
CREATE POLICY "Members can request to join events"
  ON event_join_requests
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM organization_members 
     WHERE organization_id = NEW.organization_id 
     AND user_id = NEW.user_id 
     AND status = 'active') > 0
  );

-- Allow organization officers/creators to manage join requests
CREATE POLICY "Officers/creators can manage join requests"
  ON event_join_requests
  FOR ALL
  USING (
    (SELECT COUNT(*) FROM organization_members 
     WHERE organization_id = event_join_requests.organization_id 
     AND user_id = auth.uid() 
     AND status = 'active' 
     AND role IN ('creator', 'officer')) > 0
  );

-- Allow users to see their own join requests
CREATE POLICY "Users can see their own join requests"
  ON event_join_requests
  FOR SELECT
  USING (user_id = auth.uid());
`;

// Output the SQL commands
console.log("Freedom Wall Tables SQL:");
console.log(freedomWallPostsTable);
console.log(freedomWallCommentsTable);
console.log(freedomWallLikesTable);
console.log(eventJoinRequestsTable);
console.log("\nRLS Policies SQL:");
console.log(freedomWallRLSPolicies);
console.log(eventJoinRequestsRLSPolicies);

export {};