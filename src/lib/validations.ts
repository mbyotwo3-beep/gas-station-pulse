import { z } from 'zod';

// Ride validation schemas
export const rideRequestSchema = z.object({
  pickup_location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Pickup address is required').max(500)
  }),
  destination_location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().min(1, 'Destination address is required').max(500)
  }),
  max_fare: z.number().positive().optional(),
  passenger_count: z.number().int().min(1).max(8),
  notes: z.string().max(500).optional()
});

// Driver profile validation
export const driverProfileSchema = z.object({
  vehicle_type: z.enum(['car', 'suv', 'motorcycle', 'van']),
  vehicle_make: z.string().min(1).max(100).optional(),
  vehicle_model: z.string().min(1).max(100).optional(),
  license_plate: z.string().min(1).max(20).regex(/^[A-Z0-9-]+$/i, 'Invalid license plate format')
});

// Payment validation
export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  payment_method: z.enum(['cash', 'card', 'wallet']),
  ride_id: z.string().uuid()
});

// Order validation
export const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'At least one item is required'),
  delivery_location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().min(1).max(500)
  }),
  special_instructions: z.string().max(500).optional()
});

// Auth validation
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  display_name: z.string().min(2).max(100).optional(),
  primary_role: z.enum(['user', 'driver', 'passenger', 'manager']).optional()
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Rating validation
export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional()
});

// Location validation
export const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(500).optional()
});