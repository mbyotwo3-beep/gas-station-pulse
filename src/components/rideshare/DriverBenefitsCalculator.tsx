import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, DollarSign, Fuel, Clock, TrendingUp, 
  Cloud, Car, Wallet, BarChart3, AlertTriangle
} from 'lucide-react';

interface EarningsBreakdown {
  grossEarnings: number;
  fuelCost: number;
  platformFee: number;
  netEarnings: number;
  earningsPerHour: number;
  earningsPerKm: number;
  ridesNeeded: number;
  weatherImpact: number;
  trafficImpact: number;
}

export default function DriverBenefitsCalculator() {
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [avgTripDistance, setAvgTripDistance] = useState(10);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState('1.20');
  const [vehicleFuelEfficiency, setVehicleFuelEfficiency] = useState('12');
  const [vehicleType, setVehicleType] = useState('car');
  const [weatherCondition, setWeatherCondition] = useState('clear');
  const [trafficLevel, setTrafficLevel] = useState('moderate');

  const [result, setResult] = useState<EarningsBreakdown | null>(null);

  const calculate = () => {
    const fuelPrice = parseFloat(fuelPricePerLiter) || 1.20;
    const fuelEff = parseFloat(vehicleFuelEfficiency) || 12;

    // Average ride fare based on distance
    const baseFarePerRide = 5.00;
    const farePerKm = 1.50;
    const farePerMinute = 0.25;
    const avgDurationMin = avgTripDistance * 3; // ~20 km/h average with stops

    let avgFarePerRide = baseFarePerRide + (avgTripDistance * farePerKm) + (avgDurationMin * farePerMinute);

    // Weather multiplier
    const weatherMultipliers: Record<string, number> = {
      clear: 1.0,
      cloudy: 1.05,
      rain: 1.3,
      storm: 1.5,
    };
    const wm = weatherMultipliers[weatherCondition] || 1.0;

    // Traffic multiplier (affects time-based earnings)
    const trafficMultipliers: Record<string, number> = {
      light: 1.0,
      moderate: 1.15,
      heavy: 1.35,
    };
    const tm = trafficMultipliers[trafficLevel] || 1.0;

    // Apply multipliers
    avgFarePerRide *= wm;
    // Traffic increases fare but also reduces trips per hour
    const tripsPerHourBase = vehicleType === 'motorcycle' ? 3.5 : 2.5;
    const trafficTripsReduction = trafficLevel === 'heavy' ? 0.6 : trafficLevel === 'moderate' ? 0.8 : 1.0;
    const tripsPerHour = tripsPerHourBase * trafficTripsReduction;

    // Time component increases with traffic
    avgFarePerRide += (avgDurationMin * farePerMinute * (tm - 1));

    const totalTripsPerDay = tripsPerHour * hoursPerDay;
    const totalTripsPerWeek = totalTripsPerDay * daysPerWeek;
    const totalKmPerDay = totalTripsPerDay * avgTripDistance;
    const totalKmPerWeek = totalKmPerDay * daysPerWeek;

    const grossPerWeek = totalTripsPerWeek * avgFarePerRide;

    // Fuel cost
    const litersPerKm = 1 / fuelEff;
    const fuelCostPerWeek = totalKmPerWeek * litersPerKm * fuelPrice;

    // Platform fee (15% like Yango)
    const platformFeeRate = 0.15;
    const platformFee = grossPerWeek * platformFeeRate;

    // Weather impact on fuel (rain uses more fuel)
    const weatherFuelMultiplier = weatherCondition === 'rain' ? 1.15 : weatherCondition === 'storm' ? 1.25 : 1.0;
    const adjustedFuelCost = fuelCostPerWeek * weatherFuelMultiplier;

    const netPerWeek = grossPerWeek - adjustedFuelCost - platformFee;
    const totalHoursPerWeek = hoursPerDay * daysPerWeek;

    // Monthly target calculation
    const monthlyTarget = 2000; // USD
    const weeklyNeeded = monthlyTarget / 4.33;
    const ridesNeeded = Math.ceil(weeklyNeeded / (avgFarePerRide * (1 - platformFeeRate)));

    setResult({
      grossEarnings: Math.round(grossPerWeek * 100) / 100,
      fuelCost: Math.round(adjustedFuelCost * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      netEarnings: Math.round(netPerWeek * 100) / 100,
      earningsPerHour: Math.round((netPerWeek / totalHoursPerWeek) * 100) / 100,
      earningsPerKm: Math.round((netPerWeek / totalKmPerWeek) * 100) / 100,
      ridesNeeded,
      weatherImpact: Math.round((wm - 1) * 100),
      trafficImpact: Math.round((1 - trafficTripsReduction) * 100),
    });
  };

  return (
    <Card className="surface-gradient">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Driver Earnings Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how fuel prices, weather, and traffic affect your earnings. Compare with Yango & Uber rates.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-3 w-3" /> Hours per day
            </Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[hoursPerDay]}
                onValueChange={(v) => setHoursPerDay(v[0])}
                min={2}
                max={14}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-8">{hoursPerDay}h</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Days per week</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[daysPerWeek]}
                onValueChange={(v) => setDaysPerWeek(v[0])}
                min={1}
                max={7}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-8">{daysPerWeek}d</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Avg trip distance (km)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[avgTripDistance]}
                onValueChange={(v) => setAvgTripDistance(v[0])}
                min={2}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-mono w-10">{avgTripDistance}km</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="h-3 w-3" /> Vehicle type
            </Label>
            <Select value={vehicleType} onValueChange={setVehicleType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Fuel className="h-3 w-3" /> Fuel price ($/liter)
            </Label>
            <Input
              type="number"
              value={fuelPricePerLiter}
              onChange={(e) => setFuelPricePerLiter(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label>Fuel efficiency (km/liter)</Label>
            <Input
              type="number"
              value={vehicleFuelEfficiency}
              onChange={(e) => setVehicleFuelEfficiency(e.target.value)}
              step="0.5"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Cloud className="h-3 w-3" /> Weather
            </Label>
            <Select value={weatherCondition} onValueChange={setWeatherCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">☀️ Clear</SelectItem>
                <SelectItem value="cloudy">☁️ Cloudy</SelectItem>
                <SelectItem value="rain">🌧️ Rain</SelectItem>
                <SelectItem value="storm">⛈️ Storm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3" /> Traffic level
            </Label>
            <Select value={trafficLevel} onValueChange={setTrafficLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">🟢 Light</SelectItem>
                <SelectItem value="moderate">🟡 Moderate</SelectItem>
                <SelectItem value="heavy">🔴 Heavy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={calculate} className="w-full" size="lg">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Earnings
        </Button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Weekly Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="py-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Net/Week</p>
                  <p className="text-lg font-bold text-green-600">${result.netEarnings.toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="py-3 text-center">
                  <Wallet className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Net/Month</p>
                  <p className="text-lg font-bold text-blue-600">${(result.netEarnings * 4.33).toFixed(0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary/20">
                <CardContent className="py-3 text-center">
                  <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-xs text-muted-foreground">Per Hour</p>
                  <p className="text-lg font-bold text-primary">${result.earningsPerHour.toFixed(2)}</p>
                </CardContent>
              </Card>
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="py-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto text-orange-600 mb-1" />
                  <p className="text-xs text-muted-foreground">Per Km</p>
                  <p className="text-lg font-bold text-orange-600">${result.earningsPerKm.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Breakdown */}
            <Card>
              <CardContent className="py-4 space-y-2">
                <p className="font-medium text-sm">Weekly Breakdown</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gross earnings</span>
                    <span className="text-green-600">${result.grossEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel costs</span>
                    <span className="text-destructive">-${result.fuelCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (15%)</span>
                    <span className="text-destructive">-${result.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>Net earnings</span>
                    <span className="text-green-600">${result.netEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impact Factors */}
            <div className="flex flex-wrap gap-2">
              {result.weatherImpact > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Cloud className="h-3 w-3" />
                  Weather: +{result.weatherImpact}% fare boost
                </Badge>
              )}
              {result.trafficImpact > 0 && (
                <Badge variant="outline" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Traffic: -{result.trafficImpact}% fewer trips
                </Badge>
              )}
            </div>

            {/* Comparison */}
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <p className="text-xs font-medium mb-2">How you compare (est. weekly net)</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span>🚕 Yango driver (avg)</span>
                    <span className="font-mono">$180 - $320</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>🚗 Uber driver (avg)</span>
                    <span className="font-mono">$200 - $380</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-primary">
                    <span>🟢 Your estimated earnings</span>
                    <span className="font-mono">${result.netEarnings.toFixed(0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
