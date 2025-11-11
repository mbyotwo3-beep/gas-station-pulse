-- Create saved_routes table
CREATE TABLE public.saved_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  start_location JSONB NOT NULL,
  end_location JSONB NOT NULL,
  waypoints JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved routes"
ON public.saved_routes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved routes"
ON public.saved_routes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved routes"
ON public.saved_routes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved routes"
ON public.saved_routes
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_routes_updated_at
BEFORE UPDATE ON public.saved_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_saved_routes_user_id ON public.saved_routes(user_id);