import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
}

interface DynamicFareEstimate {
  distance: number;
  duration: number;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  weatherFare: number;
  fuelAdjustment: number;
  trafficFare: number;
  totalFare: number;
  currency: string;
  // Breakdown info
  surgeMultiplier: number;
  weatherCondition: string;
  trafficLevel: string;
  fuelPricePerLiter: number;
}

export type ServiceType = 'ride' | 'food_delivery' | 'package_delivery';

// Base pricing
const BASE_PRICING = {
  ride: { baseFare: 5.00, perKm: 1.50, perMinute: 0.25, minimumFare: 8.00 },
  food_delivery: { baseFare: 3.00, perKm: 1.00, perMinute: 0.10, minimumFare: 5.00 },
  package_delivery: { baseFare: 5.00, perKm: 1.25, perMinute: 0.15, minimumFare: 7.00 },
};

// Surge pricing tiers
function getSurgeMultiplier(): { multiplier: number; label: string } {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Peak hours: 7-9 AM, 5-8 PM on weekdays
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const isMorningPeak = hour >= 7 && hour < 9;
  const isEveningPeak = hour >= 17 && hour < 20;
  const isLateNight = hour >= 22 || hour < 5;
  const isFridayEvening = dayOfWeek === 5 && hour >= 16;
  const isWeekendNight = (dayOfWeek === 5 || dayOfWeek === 6) && (hour >= 20 || hour < 3);

  if (isWeekendNight) return { multiplier: 1.8, label: 'Weekend Night Surge' };
  if (isFridayEvening) return { multiplier: 1.6, label: 'Friday Rush' };
  if (isWeekday && isEveningPeak) return { multiplier: 1.5, label: 'Evening Peak' };
  if (isWeekday && isMorningPeak) return { multiplier: 1.3, label: 'Morning Peak' };
  if (isLateNight) return { multiplier: 1.4, label: 'Late Night' };
  return { multiplier: 1.0, label: 'Standard' };
}

// Simulate weather conditions (in production, use a weather API)
function getWeatherCondition(): { condition: string; multiplier: number } {
  // For demo, use time-based simulation. In production: OpenWeatherMap API
  const hour = new Date().getHours();
  const month = new Date().getMonth();
  
  // Rainy season simulation (Nov-Mar in Zambia)
  const isRainySeason = month >= 10 || month <= 2;
  const isAfternoon = hour >= 14 && hour <= 18;
  
  if (isRainySeason && isAfternoon) {
    return { condition: '🌧️ Rain', multiplier: 1.3 };
  }
  if (isRainySeason) {
    return { condition: '☁️ Cloudy', multiplier: 1.1 };
  }
  return { condition: '☀️ Clear', multiplier: 1.0 };
}

// Fuel price impact on fare
function getFuelPriceAdjustment(distanceKm: number): { adjustment: number; pricePerLiter: number } {
  // Average fuel price in Zambia (ZMW converted to USD approx)
  // This should ideally come from a live API or database
  const baseFuelPricePerLiter = 1.20; // USD
  const referenceFuelPrice = 1.00; // baseline
  const avgConsumptionPerKm = 0.08; // liters per km (12.5 km/l)
  
  const fuelCostDiff = (baseFuelPricePerLiter - referenceFuelPrice) * avgConsumptionPerKm * distanceKm;
  return { adjustment: Math.max(0, fuelCostDiff), pricePerLiter: baseFuelPricePerLiter };
}

// Traffic estimation based on route duration vs distance
function getTrafficLevel(distanceKm: number, durationMinutes: number): { level: string; multiplier: number } {
  const avgSpeedKmh = (distanceKm / durationMinutes) * 60;
  
  if (avgSpeedKmh < 10) return { level: '🔴 Heavy Traffic', multiplier: 1.4 };
  if (avgSpeedKmh < 20) return { level: '🟠 Moderate Traffic', multiplier: 1.2 };
  if (avgSpeedKmh < 35) return { level: '🟡 Light Traffic', multiplier: 1.1 };
  return { level: '🟢 Clear Roads', multiplier: 1.0 };
}

export function useDynamicPricing() {
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<DynamicFareEstimate | null>(null);

  const calculateDynamicFare = useCallback(async (
    pickup: Location,
    destination: Location,
    serviceType: ServiceType = 'ride'
  ): Promise<DynamicFareEstimate | null> => {
    setLoading(true);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=false`
      );

      if (!response.ok) throw new Error('Failed to fetch route');

      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No route found');

      const route = data.routes[0];
      const distanceKm = route.distance / 1000;
      const durationMinutes = route.duration / 60;

      const pricing = BASE_PRICING[serviceType];
      const surge = getSurgeMultiplier();
      const weather = getWeatherCondition();
      const fuel = getFuelPriceAdjustment(distanceKm);
      const traffic = getTrafficLevel(distanceKm, durationMinutes);

      // Calculate components
      const baseFare = pricing.baseFare;
      const distanceFare = distanceKm * pricing.perKm;
      const timeFare = durationMinutes * pricing.perMinute;
      
      // Apply multipliers
      const subtotal = baseFare + distanceFare + timeFare;
      const surgeFare = subtotal * (surge.multiplier - 1);
      const weatherFare = subtotal * (weather.multiplier - 1);
      const trafficFare = subtotal * (traffic.multiplier - 1);
      const fuelAdjustment = fuel.adjustment;

      let totalFare = subtotal + surgeFare + weatherFare + trafficFare + fuelAdjustment;
      totalFare = Math.max(totalFare, pricing.minimumFare);
      totalFare = Math.round(totalFare * 100) / 100;

      const fareEstimate: DynamicFareEstimate = {
        distance: Math.round(distanceKm * 10) / 10,
        duration: Math.round(durationMinutes),
        baseFare: Math.round(baseFare * 100) / 100,
        distanceFare: Math.round(distanceFare * 100) / 100,
        timeFare: Math.round(timeFare * 100) / 100,
        surgeFare: Math.round(surgeFare * 100) / 100,
        weatherFare: Math.round(weatherFare * 100) / 100,
        fuelAdjustment: Math.round(fuelAdjustment * 100) / 100,
        trafficFare: Math.round(trafficFare * 100) / 100,
        totalFare,
        currency: 'USD',
        surgeMultiplier: surge.multiplier,
        weatherCondition: weather.condition,
        trafficLevel: traffic.level,
        fuelPricePerLiter: fuel.pricePerLiter,
      };

      setEstimate(fareEstimate);
      return fareEstimate;
    } catch (error) {
      console.error('Error calculating dynamic fare:', error);
      toast.error('Could not estimate fare. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearEstimate = useCallback(() => setEstimate(null), []);

  return { estimate, loading, calculateDynamicFare, clearEstimate };
}
