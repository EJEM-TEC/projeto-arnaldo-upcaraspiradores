-- Create subscription cancellation requests table
CREATE TABLE IF NOT EXISTS subscription_cancellation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id TEXT NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_subscription_cancellation_user_id ON subscription_cancellation_requests(user_id);
CREATE INDEX idx_subscription_cancellation_status ON subscription_cancellation_requests(status);
CREATE INDEX idx_subscription_cancellation_subscription_id ON subscription_cancellation_requests(subscription_id);

-- Enable RLS
ALTER TABLE subscription_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own requests
CREATE POLICY "Users can view their own cancellation requests"
  ON subscription_cancellation_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create cancellation requests"
  ON subscription_cancellation_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins (with admin role) can view all requests
CREATE POLICY "Admins can view all cancellation requests"
  ON subscription_cancellation_requests
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Admins can update requests
CREATE POLICY "Admins can update cancellation requests"
  ON subscription_cancellation_requests
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));
