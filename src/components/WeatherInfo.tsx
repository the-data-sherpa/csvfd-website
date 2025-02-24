import React, { useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, Thermometer } from 'lucide-react';

interface WeatherAlert {
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
}

interface WeatherPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  icon: string;
  windSpeed: string;
  windDirection: string;
}

interface WeatherData {
  currentPeriod: WeatherPeriod;
  forecast: WeatherPeriod[];
}

export function WeatherInfo() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Iredell County coordinates (approximate center)
  const latitude = "35.8311";
  const longitude = "-80.8978";

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        
        // Fetch current weather and forecast
        const pointsResponse = await fetch(
          `https://api.weather.gov/points/${latitude},${longitude}`
        );
        const pointsData = await pointsResponse.json();
        
        const forecastResponse = await fetch(pointsData.properties.forecast);
        const forecastData = await forecastResponse.json();
        
        setWeather({
          currentPeriod: forecastData.properties.periods[0],
          forecast: forecastData.properties.periods.slice(1, 5) // Next 4 periods
        });

        // Fetch alerts
        const alertsResponse = await fetch(
          `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`
        );
        const alertsData = await alertsResponse.json();
        
        setAlerts(
          alertsData.features?.map((feature: any) => ({
            event: feature.properties.event,
            headline: feature.properties.headline,
            description: feature.properties.description,
            severity: feature.properties.severity,
            urgency: feature.properties.urgency
          })) || []
        );

        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError('Failed to load weather information');
        setLoading(false);
      }
    };

    fetchWeatherData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts Section - Always at the top */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            No active weather alerts for Iredell County
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg ${
                alert.severity === 'Extreme' ? 'bg-red-100 text-red-800' :
                alert.severity === 'Severe' ? 'bg-orange-100 text-orange-800' :
                'bg-yellow-100 text-yellow-800'
              }`}
            >
              <h3 className="font-bold">{alert.event}</h3>
              <p className="text-sm mt-1">{alert.headline}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm">View Details</summary>
                <p className="mt-2 text-sm whitespace-pre-line">{alert.description}</p>
              </details>
            </div>
          ))
        )}
      </div>

      {/* Current Weather */}
      {weather && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold mb-4">Current Conditions</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src={weather.currentPeriod.icon} 
                  alt={weather.currentPeriod.shortForecast} 
                  className="w-16 h-16"
                />
                <div>
                  <div className="text-3xl font-bold">
                    {weather.currentPeriod.temperature}°{weather.currentPeriod.temperatureUnit}
                  </div>
                  <div className="text-gray-600">{weather.currentPeriod.shortForecast}</div>
                </div>
              </div>
              <div className="text-right text-gray-600">
                <div>Wind: {weather.currentPeriod.windSpeed}</div>
                <div>{weather.currentPeriod.windDirection}</div>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Forecast</h3>
            <div className="grid grid-cols-2 gap-4">
              {weather.forecast.map((period, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                  <img src={period.icon} alt={period.shortForecast} className="w-10 h-10" />
                  <div className="flex-1">
                    <div className="font-medium">{period.name}</div>
                    <div className="text-sm text-gray-600">
                      {period.temperature}°{period.temperatureUnit}
                    </div>
                    <div className="text-sm text-gray-600">{period.shortForecast}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 