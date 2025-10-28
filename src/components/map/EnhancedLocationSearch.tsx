import { useState, useEffect } from 'react';
import { Search, X, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SearchLocation {
  lat: number;
  lng: number;
  label: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  location?: SearchLocation;
  timestamp: number;
}

interface EnhancedLocationSearchProps {
  onSelectLocation?: (location: SearchLocation) => void;
  onLocationSelect?: (location: SearchLocation) => void;
  placeholder?: string;
  className?: string;
}

const MAX_HISTORY_ITEMS = 10;

export default function EnhancedLocationSearch({ 
  onSelectLocation, 
  onLocationSelect,
  placeholder = "Search for places...", 
  className 
}: EnhancedLocationSearchProps) {
  const handleLocationCallback = onLocationSelect || onSelectLocation;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchLocation[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ff_search_history');
      if (saved) {
        const history = JSON.parse(saved);
        setSearchHistory(history.slice(0, MAX_HISTORY_ITEMS));
      }

      const savedRecent = localStorage.getItem('ff_recent_searches');
      if (savedRecent) {
        const recent = JSON.parse(savedRecent);
        setRecentSearches(recent.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem('ff_search_history', JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('ff_recent_searches', JSON.stringify(recentSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  }, [recentSearches]);

  // Debounced search
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        // Using Nominatim API for geocoding (free alternative to Google Places)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(query)}&countrycodes=zm,za,bw,mw,zw,tz,ke,ug&addressdetails=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          const locations: SearchLocation[] = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            label: item.display_name.split(',').slice(0, 3).join(', ')
          }));
          setResults(locations);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const addToHistory = (searchQuery: string, location?: SearchLocation) => {
    const historyItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: searchQuery,
      location,
      timestamp: Date.now()
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== searchQuery.toLowerCase()
      );
      return [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    });

    if (location) {
      setRecentSearches(prev => {
        const filtered = prev.filter(item => 
          item.label !== location.label
        );
        return [location, ...filtered].slice(0, 5);
      });
    }
  };

  const handleSelectLocation = (location: SearchLocation) => {
    if (handleLocationCallback) {
      handleLocationCallback(location);
    }
    addToHistory(query, location);
    setQuery('');
    setShowSuggestions(false);
    setResults([]);
  };

  const handleSelectFromHistory = (item: SearchHistoryItem) => {
    if (item.location && handleLocationCallback) {
      handleLocationCallback(item.location);
      setQuery('');
      setShowSuggestions(false);
    } else {
      setQuery(item.query);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem('ff_search_history');
    localStorage.removeItem('ff_recent_searches');
  };

  const removeHistoryItem = (id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        // Reverse geocoding to get location name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          const label = data.display_name?.split(',').slice(0, 3).join(', ') || 'Current Location';
          
          handleSelectLocation({ lat, lng, label });
        } catch (error) {
          handleSelectLocation({ lat, lng, label: 'Current Location' });
        }
      },
      (error) => {
        console.error('Location error:', error);
      }
    );
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="pl-9 pr-20"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
          onClick={getCurrentLocation}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto bg-background border shadow-lg">
          {loading && (
            <div className="p-3 text-center text-muted-foreground">
              Searching...
            </div>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <div className="border-b">
              <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Search Results
              </div>
              {results.map((location, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                  onMouseDown={() => handleSelectLocation(location)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{location.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="border-b">
              <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recent Searches
              </div>
              {recentSearches.map((location, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                  onMouseDown={() => handleSelectLocation(location)}
                >
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{location.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div>
              <div className="p-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                Search History
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
              {searchHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  <button
                    className="flex-1 text-left flex items-start gap-2"
                    onMouseDown={() => handleSelectFromHistory(item)}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm">{item.query}</div>
                      {item.location && (
                        <div className="text-xs text-muted-foreground">
                          {item.location.label}
                        </div>
                      )}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      removeHistoryItem(item.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !query && searchHistory.length === 0 && recentSearches.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Search for places to get started</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}