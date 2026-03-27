import { useState } from 'react';
import { Cloud, CloudRain, Sun, Snowflake, Wind, Droplets, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { weatherService, type ForecastData } from '@/services/weatherService';
import { useQuery } from '@tanstack/react-query';

const weatherIcons: Record<string, React.ReactNode> = {
  '01d': <Sun className="h-8 w-8 text-yellow-500" />,
  '01n': <Sun className="h-8 w-8 text-yellow-300" />,
  '02d': <Cloud className="h-8 w-8 text-gray-400" />,
  '02n': <Cloud className="h-8 w-8 text-gray-500" />,
  '03d': <Cloud className="h-8 w-8 text-gray-400" />,
  '03n': <Cloud className="h-8 w-8 text-gray-500" />,
  '04d': <Cloud className="h-8 w-8 text-gray-500" />,
  '04n': <Cloud className="h-8 w-8 text-gray-600" />,
  '09d': <CloudRain className="h-8 w-8 text-blue-500" />,
  '09n': <CloudRain className="h-8 w-8 text-blue-600" />,
  '10d': <CloudRain className="h-8 w-8 text-blue-400" />,
  '10n': <CloudRain className="h-8 w-8 text-blue-500" />,
  '11d': <Cloud className="h-8 w-8 text-gray-600" />,
  '11n': <Cloud className="h-8 w-8 text-gray-700" />,
  '13d': <Snowflake className="h-8 w-8 text-blue-200" />,
  '13n': <Snowflake className="h-8 w-8 text-blue-300" />,
  '50d': <Wind className="h-8 w-8 text-gray-400" />,
  '50n': <Wind className="h-8 w-8 text-gray-500" />,
};

export function WeatherCard() {
  const [city, setCity] = useState('Buenos Aires');
  const [searchCity, setSearchCity] = useState('Buenos Aires');

  const { data: forecast, isLoading, error } = useQuery({
    queryKey: ['weather-forecast', searchCity],
    queryFn: () => weatherService.getForecast(searchCity, 'AR'),
    enabled: !!searchCity,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city.trim()) {
      setSearchCity(city);
    }
  };

  // Obtener resumen diario del pronóstico
  const getDailySummary = (dataPoints: ForecastData['forecast'][0]['dataPoints']) => {
    const temps = dataPoints.map(d => d.temperature.current);
    const minTemp = Math.min(...dataPoints.map(d => d.temperature.min));
    const maxTemp = Math.max(...dataPoints.map(d => d.temperature.max));
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgHumidity = dataPoints.reduce((sum, d) => sum + d.atmosphere.humidity, 0) / dataPoints.length;
    const maxPrecipitation = Math.max(...dataPoints.map(d => d.precipitation.probability));

    // Obtener la condición más común del día
    const conditions = dataPoints.map(d => d.conditions.main);
    const modeCondition = conditions.sort((a, b) =>
      conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    )[0];

    // Obtener el icono del mediodía (aprox 12:00)
    const middayIcon = dataPoints.find(d => d.datetime.includes('12:00:00'))?.conditions.icon ||
                       dataPoints[0]?.conditions.icon;

    return {
      minTemp,
      maxTemp,
      avgTemp,
      avgHumidity,
      maxPrecipitation,
      modeCondition,
      icon: middayIcon || '01d',
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Weather Forecast
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="city" className="sr-only">City</Label>
            <Input
              id="city"
              type="text"
              placeholder="Enter city name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Search'}
          </Button>
        </form>

        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
            {(error as Error).message || 'Failed to fetch weather data'}
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            {/* Location */}
            <div>
              <h3 className="text-xl font-bold">{forecast.city}, {forecast.country}</h3>
              <p className="text-sm text-muted-foreground">5-Day Forecast</p>
            </div>

            {/* Forecast by day */}
            <div className="space-y-3">
              {forecast.forecast.slice(0, 5).map((day) => {
                const summary = getDailySummary(day.dataPoints);

                return (
                  <div key={day.date} className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-sm font-medium">{formatDate(day.date)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {weatherIcons[summary.icon] || <Cloud className="h-8 w-8 text-gray-400" />}
                        <div>
                          <p className="text-sm capitalize text-muted-foreground">{summary.modeCondition}</p>
                          <p className="text-xs text-muted-foreground">
                            {summary.avgHumidity.toFixed(0)}% humidity
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            <span className="text-lg font-bold">{Math.round(summary.maxTemp)}°</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Thermometer className="h-3 w-3 text-blue-500" />
                            <span className="text-sm">{Math.round(summary.minTemp)}°</span>
                          </div>
                        </div>

                        {summary.maxPrecipitation > 30 && (
                          <div className="flex items-center gap-1 text-blue-500" title="Precipitation probability">
                            <Droplets className="h-4 w-4" />
                            <span className="text-sm font-medium">{Math.round(summary.maxPrecipitation)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>• Temperatures shown in Celsius</span>
                <span>• Precipitation shown when &gt; 30% chance</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
