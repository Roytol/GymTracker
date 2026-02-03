-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  units text default 'kg', -- 'kg' or 'lbs'
  week_start_day text default 'monday', -- 'monday' or 'sunday'
  updated_at timestamp with time zone
);

-- Exercises table
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text, -- e.g., 'Strength', 'Cardio', 'Stretching'
  user_id uuid references auth.users(id) on delete cascade, -- Null for default exercises
  is_custom boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Programs table
create table programs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Program Days table
create table program_days (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references programs(id) on delete cascade not null,
  name text not null, -- e.g., 'Push', 'Pull'
  "order" integer not null
);

-- Program Exercises table
create table program_exercises (
  id uuid default uuid_generate_v4() primary key,
  day_id uuid references program_days(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  sets integer default 3,
  reps text default '10', -- text to allow ranges like '8-12'
  "order" integer not null
);

-- Workouts table
create table workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  program_id uuid references programs(id) on delete set null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  status text default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled'))
);

-- Workout Logs table
create table workout_logs (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null,
  reps integer,
  weight numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic)
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

alter table exercises enable row level security;
create policy "Exercises are viewable by everyone." on exercises for select using (true);
create policy "Users can insert their own custom exercises." on exercises for insert with check (auth.uid() = user_id);
create policy "Users can update own custom exercises." on exercises for update using (auth.uid() = user_id);
create policy "Users can delete own custom exercises." on exercises for delete using (auth.uid() = user_id);

alter table programs enable row level security;
create policy "Users can view own programs." on programs for select using (auth.uid() = user_id);
create policy "Users can insert own programs." on programs for insert with check (auth.uid() = user_id);
create policy "Users can update own programs." on programs for update using (auth.uid() = user_id);
create policy "Users can delete own programs." on programs for delete using (auth.uid() = user_id);

alter table program_days enable row level security;
create policy "Users can view own program days." on program_days for select using (
  exists (
    select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid()
  )
);
create policy "Users can insert own program days." on program_days for insert with check (
  exists (
    select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid()
  )
);
create policy "Users can update own program days." on program_days for update using (
  exists (
    select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid()
  )
);
create policy "Users can delete own program days." on program_days for delete using (
  exists (
    select 1 from programs p where p.id = program_days.program_id and p.user_id = auth.uid()
  )
);

alter table program_exercises enable row level security;
create policy "Users can view own program exercises." on program_exercises for select using (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.day_id and p.user_id = auth.uid()
  )
);
create policy "Users can insert own program exercises." on program_exercises for insert with check (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.day_id and p.user_id = auth.uid()
  )
);
create policy "Users can update own program exercises." on program_exercises for update using (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.day_id and p.user_id = auth.uid()
  )
);
create policy "Users can delete own program exercises." on program_exercises for delete using (
  exists (
    select 1 from program_days d
    join programs p on p.id = d.program_id
    where d.id = program_exercises.day_id and p.user_id = auth.uid()
  )
);

alter table workouts enable row level security;
create policy "Users can view own workouts." on workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts." on workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts." on workouts for update using (auth.uid() = user_id);
create policy "Users can delete own workouts." on workouts for delete using (auth.uid() = user_id);

alter table workout_logs enable row level security;
create policy "Users can view own workout logs." on workout_logs for select using (
  exists (
    select 1 from workouts w where w.id = workout_logs.workout_id and w.user_id = auth.uid()
  )
);
create policy "Users can insert own workout logs." on workout_logs for insert with check (
  exists (
    select 1 from workouts w where w.id = workout_logs.workout_id and w.user_id = auth.uid()
  )
);
create policy "Users can update own workout logs." on workout_logs for update using (
  exists (
    select 1 from workouts w where w.id = workout_logs.workout_id and w.user_id = auth.uid()
  )
);
create policy "Users can delete own workout logs." on workout_logs for delete using (
  exists (
    select 1 from workouts w where w.id = workout_logs.workout_id and w.user_id = auth.uid()
  )
);
