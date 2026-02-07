// MapContainer Component - Core Mapbox GL map display
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Route } from '../../services/predictionService';
import { createRouteGeoJSON, calculateBounds, getTrafficColor } from '../../utils/mapUtils';
import '../../styles/mapbox-overrides.css';

// Set Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapContainerProps {
    sourceLocation?: [number, number];
    destinationLocation?: [number, number];
    route?: Route | null;
    currentHour?: number;
    theme?: 'light' | 'dark';
    onMapLoad?: (map: mapboxgl.Map) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({
    sourceLocation,
    destinationLocation,
    route,
    currentHour = new Date().getHours(),
    theme = 'dark',
    onMapLoad,
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const sourceMarker = useRef<mapboxgl.Marker | null>(null);
    const destMarker = useRef<mapboxgl.Marker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
            center: [-74.006, 40.7128], // Default to NYC
            zoom: 12,
            pitch: 45,
            bearing: 0,
            antialias: true,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add scale control
        map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

        map.current.on('load', () => {
            setMapLoaded(true);
            if (onMapLoad && map.current) {
                onMapLoad(map.current);
            }
        });

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update map style when theme changes
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        const style = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
        map.current.setStyle(style);
    }, [theme, mapLoaded]);

    // Add source marker
    useEffect(() => {
        if (!map.current || !mapLoaded || !sourceLocation) return;

        // Remove existing marker
        if (sourceMarker.current) {
            sourceMarker.current.remove();
        }

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker marker-source';
        el.innerHTML = '📍';

        sourceMarker.current = new mapboxgl.Marker(el)
            .setLngLat(sourceLocation)
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h3 style="margin: 0 0 8px 0; font-weight: 600;">Source Location</h3>')
            )
            .addTo(map.current);

        return () => {
            if (sourceMarker.current) {
                sourceMarker.current.remove();
            }
        };
    }, [sourceLocation, mapLoaded]);

    // Add destination marker
    useEffect(() => {
        if (!map.current || !mapLoaded || !destinationLocation) return;

        // Remove existing marker
        if (destMarker.current) {
            destMarker.current.remove();
        }

        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker marker-destination';
        el.innerHTML = '🎯';

        destMarker.current = new mapboxgl.Marker(el)
            .setLngLat(destinationLocation)
            .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                    .setHTML('<h3 style="margin: 0 0 8px 0; font-weight: 600;">Destination</h3>')
            )
            .addTo(map.current);

        return () => {
            if (destMarker.current) {
                destMarker.current.remove();
            }
        };
    }, [destinationLocation, mapLoaded]);

    // Render route
    useEffect(() => {
        if (!map.current || !mapLoaded || !route) return;

        // Collect all coordinates from route segments
        const allCoordinates: [number, number][] = [];
        route.segments.forEach(segment => {
            allCoordinates.push(...segment.coordinates);
        });

        if (allCoordinates.length === 0) return;

        // Remove existing route layers
        if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
        }
        if (map.current.getLayer('route-casing')) {
            map.current.removeLayer('route-casing');
        }
        if (map.current.getSource('route')) {
            map.current.removeSource('route');
        }

        // Add route source
        map.current.addSource('route', {
            type: 'geojson',
            data: createRouteGeoJSON(allCoordinates),
        });

        // Add route casing (outer glow)
        map.current.addLayer({
            id: 'route-casing',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': 'rgba(59, 130, 246, 0.3)',
                'line-width': 10,
                'line-blur': 4,
            },
        });

        // Add main route line
        map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': '#3b82f6',
                'line-width': 6,
            },
        });

        // Fit map to route bounds with animation
        const bounds = calculateBounds(allCoordinates);
        map.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 400, right: 100 },
            duration: 1500,
            essential: true,
        });

        return () => {
            if (map.current) {
                if (map.current.getLayer('route')) {
                    map.current.removeLayer('route');
                }
                if (map.current.getLayer('route-casing')) {
                    map.current.removeLayer('route-casing');
                }
                if (map.current.getSource('route')) {
                    map.current.removeSource('route');
                }
            }
        };
    }, [route, mapLoaded]);

    // Render traffic overlay based on current hour
    useEffect(() => {
        if (!map.current || !mapLoaded || !route) return;

        // Remove existing traffic layers
        route.segments.forEach((_, index) => {
            const layerId = `traffic-${index}`;
            if (map.current!.getLayer(layerId)) {
                map.current!.removeLayer(layerId);
            }
            if (map.current!.getSource(layerId)) {
                map.current!.removeSource(layerId);
            }
        });

        // Add traffic overlay for each segment
        route.segments.forEach((segment, index) => {
            const layerId = `traffic-${index}`;
            const color = getTrafficColor(segment.congestionLevel);

            map.current!.addSource(layerId, {
                type: 'geojson',
                data: createRouteGeoJSON(segment.coordinates),
            });

            map.current!.addLayer({
                id: layerId,
                type: 'line',
                source: layerId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': color,
                    'line-width': 8,
                    'line-opacity': 0.6,
                },
            }, 'route-casing'); // Add below route layers
        });

        return () => {
            if (map.current) {
                route.segments.forEach((_, index) => {
                    const layerId = `traffic-${index}`;
                    if (map.current!.getLayer(layerId)) {
                        map.current!.removeLayer(layerId);
                    }
                    if (map.current!.getSource(layerId)) {
                        map.current!.removeSource(layerId);
                    }
                });
            }
        };
    }, [route, currentHour, mapLoaded]);

    return (
        <div
            ref={mapContainer}
            style={{
                width: '100%',
                height: '100%',
                borderRadius: '0',
            }}
        />
    );
};

export default MapContainer;
