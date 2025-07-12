CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT,
  points BIGINT DEFAULT 0
);

CREATE POLICY "Allow authenticated users to view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard'))
);

CREATE TABLE problem_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES problems(id),
  level_number BIGINT,
  level_description TEXT,
  evaluation_criteria JSONB
);

CREATE INDEX ON problem_levels (problem_id);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  level_id UUID REFERENCES problem_levels(id),
  diagram_json JSONB,
  score BIGINT,
  feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ON submissions (user_id);
CREATE INDEX ON submissions (level_id);