-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Patients Table
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  age int,
  gender text,
  phone text,
  village text,
  abha_id text,
  ration_card_type text, -- 'APL', 'BPL', 'AAY', 'None'
  family_head_name text,
  blood_group text,
  allergies text[],
  conditions text[],
  emergency_contact text,
  device_id text unique, -- LoRa MAC address or ID
  status text check (status in ('normal', 'warning', 'critical', 'offline')) default 'normal',
  avatar_url text, 
  created_at timestamptz default now()
);

-- 3. Vitals Table (Time-series data)
create table if not exists public.vitals (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  heart_rate int,
  spo2 int,
  temperature float,
  blood_pressure text, -- "120/80"
  blood_sugar int,      -- mg/dL
  clinical_notes text,
  battery_level int,
  timestamp timestamptz default now()
);

-- 4. Medications Table (Compliance & Scheduler)
create table if not exists public.medications (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  medicine_name text not null,
  dosage text not null,
  schedule_time time not null,
  taken_at timestamptz, -- Null if not taken
  status text check (status in ('pending', 'taken', 'missed', 'inactive')) default 'pending',
  slot int default 1, -- 1-4 for SmartDispenser
  created_at timestamptz default now()
);

-- 5. Storage Buckets
insert into storage.buckets (id, name, public) values ('patient-records', 'patient-records', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('patient-avatars', 'patient-avatars', true) on conflict (id) do nothing;

-- 6. Patient Records Table
create table if not exists public.patient_records (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text, -- 'image' or 'pdf'
  category text, -- 'Prescription', 'Lab Report', etc.
  doctor_name text,
  record_date timestamptz,
  created_at timestamptz default now()
);

-- 7. Appointments Table (New)
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_name text,
  scheduled_time timestamptz not null,
  type text, -- 'Check-up', 'Follow-up', etc.
  status text check (status in ('confirmed', 'pending', 'cancelled')) default 'pending',
  location text,
  created_at timestamptz default now()
);

-- 8. ASHA Visits Table
create table if not exists public.asha_visits (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  asha_name text,
  visit_type text, -- 'routine', 'emergency', 'followup'
  scheduled_time timestamptz,
  actual_time timestamptz,
  status text check (status in ('pending', 'completed', 'missed')) default 'pending',
  notes text,
  created_at timestamptz default now()
);

-- 8. Enable Realtime (Safe execution)
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table public.patients, public.vitals, public.medications, public.patient_records, public.appointments;
commit;

-- 9. Row Level Security (RLS)
alter table public.patients enable row level security;
alter table public.vitals enable row level security;
alter table public.medications enable row level security;
alter table public.patient_records enable row level security;
alter table public.appointments enable row level security;

-- Policies (Robust recreation)
do $$
begin
    -- Drop old policies to ensure updates are applied
    drop policy if exists "Public Access" on public.patients;
    drop policy if exists "Public Access" on public.vitals;
    drop policy if exists "Public Access" on public.medications;
    drop policy if exists "Public Access" on public.patient_records;
    drop policy if exists "Public Access" on public.appointments;
    drop policy if exists "Public Access" on storage.objects;
    
    -- Recreate policies
    create policy "Public Access" on public.patients for all using (true) with check (true);
    create policy "Public Access" on public.vitals for all using (true) with check (true);
    create policy "Public Access" on public.medications for all using (true) with check (true);
    create policy "Public Access" on public.patient_records for all using (true) with check (true);
    create policy "Public Access" on public.appointments for all using (true) with check (true);
    create policy "Public Access" on storage.objects for all using (true) with check (true);
end
$$;

-- 9. SCHEMA UPDATES (Run these if tables already exist)
alter table public.patients add column if not exists lat float default 0.0;
alter table public.patients add column if not exists lng float default 0.0;

alter table public.vitals add column if not exists status text;
alter table public.vitals add column if not exists lat float;
alter table public.vitals add column if not exists lng float;
alter table public.vitals add column if not exists is_worn boolean default true;
