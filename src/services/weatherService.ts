import { api } from './api';

export interface WeatherData {
  city: string;
  country: string;
  temperature: {
    current: number;
    feelsLike: number;
    min: number;
    max: number;
  };
  conditions: {
    main: string;
    description: string;
    icon: string;
  };
  atmosphere: {
    humidity: number;
    pressure: number;
    visibility: number;
  };
  wind: {
    speed: number;
    direction: number;
  };
  clouds: {
    coverage: number;
  };
  sun: {
    sunrise: string;
    sunset: string;
  };
  timestamp: string;
}

export interface ForecastData {
  city: string;
  country: string;
  forecast: Array<{
    date: string;
    dataPoints: Array<{
      datetime: string;
      temperature: {
        current: number;
        feelsLike: number;
        min: number;
        max: number;
      };
      conditions: {
        main: string;
        description: string;
        icon: string;
      };
      atmosphere: {
        humidity: number;
        pressure: number;
      };
      wind: {
        speed: number;
        direction: number;
      };
      clouds: {
        coverage: number;
      };
      precipitation: {
        probability: number;
      };
    }>;
  }>;
  timestamp: string;
}

export const weatherService = {
  /**
   * GET /api/weather/current
   * Obtener clima actual de una ciudad
   */
  getCurrentWeather: async (city: string, country?: string): Promise<WeatherData> => {
    const params = new URLSearchParams();
    params.append('city', city);
    if (country) {
      params.append('country', country);
    }

    return api.get<WeatherData>(`/weather/current?${params.toString()}`);
  },

  /**
   * GET /api/weather/forecast
   * Obtener pronóstico de 5 días
   */
  getForecast: async (city: string, country?: string): Promise<ForecastData> => {
    const params = new URLSearchParams();
    params.append('city', city);
    if (country) {
      params.append('country', country);
    }

    return api.get<ForecastData>(`/weather/forecast?${params.toString()}`);
  },

  /**
   * GET /api/weather/coords
   * Obtener clima por coordenadas
   */
  getWeatherByCoords: async (lat: number, lon: number): Promise<WeatherData> => {
    return api.get<WeatherData>(`/weather/coords?lat=${lat}&lon=${lon}`);
  },
};
