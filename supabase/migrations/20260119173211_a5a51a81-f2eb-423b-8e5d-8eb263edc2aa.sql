-- Create enums
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE public.trip_status AS ENUM ('STARTED', 'ENDED');
CREATE TYPE public.photo_type AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'KM_METER');

-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create users/profiles table (references auth.users)
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    UNIQUE(user_id, role)
);

-- Create vehicles table
CREATE TABLE public.vehicles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table
CREATE TABLE public.trips (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    start_km INTEGER,
    end_km INTEGER,
    start_location_lat DECIMAL,
    start_location_lng DECIMAL,
    end_location_lat DECIMAL,
    end_location_lng DECIMAL,
    status trip_status NOT NULL DEFAULT 'STARTED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work_sessions table
CREATE TABLE public.work_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    location_lat DECIMAL,
    location_lng DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle_photos table
CREATE TABLE public.vehicle_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    photo_type photo_type NOT NULL,
    photo_url TEXT NOT NULL,
    taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table
CREATE TABLE public.receipts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gps_logs table
CREATE TABLE public.gps_logs (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for companies
CREATE POLICY "Admins can view all companies" ON public.companies
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can manage companies" ON public.companies
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for vehicles
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage vehicles" ON public.vehicles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for trips
CREATE POLICY "Users can view their own trips" ON public.trips
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all trips" ON public.trips
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users can manage their own trips" ON public.trips
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all trips" ON public.trips
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for work_sessions
CREATE POLICY "Users can view their own sessions" ON public.work_sessions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions" ON public.work_sessions
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users can manage their own sessions" ON public.work_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for vehicle_photos
CREATE POLICY "Authenticated users can view photos" ON public.vehicle_photos
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage photos" ON public.vehicle_photos
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for receipts
CREATE POLICY "Users can view their own receipts" ON public.receipts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all receipts" ON public.receipts
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Users can manage their own receipts" ON public.receipts
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for gps_logs
CREATE POLICY "Authenticated users can view gps_logs" ON public.gps_logs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admins can manage gps_logs" ON public.gps_logs
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'ADMIN'));

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();