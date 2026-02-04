import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
}

interface FareEstimate {
  distance: number; // in km
  duration: number; // in minutes
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  totalFare: number;
  currency: string;
}

// Pricing configuration (can be moved to database later)
const PRICING = {
  ride: {
    baseFare: 5.00,
    perKm: 1.50,
    perMinute: 0.25,
    minimumFare: 8.00,
    currency: 'USD'
  },
  food_delivery: {
    baseFare: 3.00,
    perKm: 1.00,
    perMinute: 0.10,
    minimumFare: 5.00,
    currency: 'USD'
  },
  package_delivery: {
    baseFare: 5.00,
    perKm: 1.25,
    perMinute: 0.15,
    minimumFare: 7.00,
    currency: 'USD'
  }
};

export type ServiceType = 'ride' | 'food_delivery' | 'package_delivery';

export function useFareEstimation() {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);

  const calculateFare = useCallback(async (
    pickup: Location,
    destination: Location,
    serviceType: ServiceType = 'ride'
  ): Promise<FareEstimate | null> => {
    setLoading(true);
    
    try {
      // Use OSRM to get actual road distance and duration
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=false`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch route');
      }
      
      const data = await response.json();
      
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }
      
      const route = data.routes[0];
      const distanceKm = route.distance / 1000; // Convert meters to km
      const durationMinutes = route.duration / 60; // Convert seconds to minutes
      
      const pricing = PRICING[serviceType];
      
      const baseFare = pricing.baseFare;
      const distanceFare = distanceKm * pricing.perKm;
      const timeFare = durationMinutes * pricing.perMinute;
      
      let totalFare = baseFare + distanceFare + timeFare;
      
      // Apply minimum fare
      if (totalFare < pricing.minimumFare) {
        totalFare = pricing.minimumFare;
      }
      
      // Round to 2 decimal places
      totalFare = Math.round(totalFare * 100) / 100;
      
      const fareEstimate: FareEstimate = {
        distance: Math.round(distanceKm * 10) / 10,
        duration: Math.round(durationMinutes),
        baseFare: Math.round(baseFare * 100) / 100,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        totalFare,
        currency: pricing.currency
      };
      
      setEstimate(fareEstimate);
      return fareEstimate;
    } catch (error) {
      console.error('Error calculating fare:', error);
      toast.error('Could not estimate fare. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearEstimate = useCallback(() => {
    setEstimate(null);
  }, []);

  return {
    estimate,
    loading,
    calculateFare,
    clearEstimate
  };
}
