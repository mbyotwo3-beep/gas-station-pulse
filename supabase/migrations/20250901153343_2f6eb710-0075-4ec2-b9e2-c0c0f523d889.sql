-- Create rides table for ride sharing functionality
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location JSONB NOT NULL, -- {lat, lng, address}
  destination_location JSONB NOT NULL, -- {lat, lng, address}
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  fare_amount DECIMAL(10,2),
  estimated_duration INTEGER, -- in minutes
  estimated_distance DECIMAL(10,2), -- in km
  driver_notes TEXT,
  passenger_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create driver_profiles table for drivers
CREATE TABLE public.driver_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('car', 'motorcycle', 'van', 'truck')),
  vehicle_make TEXT,
  vehicle_model TEXT,
  license_plate TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  current_location JSONB, -- {lat, lng}
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ride_requests table for passengers looking for rides
CREATE TABLE public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location JSONB NOT NULL, -- {lat, lng, address}
  destination_location JSONB NOT NULL, -- {lat, lng, address}
  max_fare DECIMAL(10,2),
  passenger_count INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matched', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Enable Row Level Security
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rides
CREATE POLICY "Users can view rides they are involved in" 
ON public.rides 
FOR SELECT 
USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

CREATE POLICY "Drivers can create rides" 
ON public.rides 
FOR INSERT 
WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides" 
ON public.rides 
FOR UPDATE 
USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

-- RLS Policies for driver_profiles
CREATE POLICY "Driver profiles are viewable by everyone" 
ON public.driver_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own driver profile" 
ON public.driver_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own driver profile" 
ON public.driver_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for ride_requests
CREATE POLICY "Ride requests are viewable by everyone" 
ON public.ride_requests 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own ride requests" 
ON public.ride_requests 
FOR INSERT 
WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update their own ride requests" 
ON public.ride_requests 
FOR UPDATE 
USING (auth.uid() = passenger_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_profiles_updated_at
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_driver_profiles_user_id ON public.driver_profiles(user_id);
CREATE INDEX idx_driver_profiles_is_active ON public.driver_profiles(is_active);
CREATE INDEX idx_ride_requests_passenger_id ON public.ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);