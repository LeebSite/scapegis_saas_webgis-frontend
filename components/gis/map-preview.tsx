"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GISService } from '@/lib/api/GISService';
import type { GeoJSONFeatureCollection } from '@/lib/types/gis';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapPreviewProps {
    layerId: string;
    className?: string;
}

// Component to fit map bounds
function FitBounds({ geojson }: { geojson: GeoJSONFeatureCollection }) {
    const map = useMap();

    useEffect(() => {
        if (geojson && geojson.features.length > 0) {
            const geoJsonLayer = L.geoJSON(geojson as any);
            const bounds = geoJsonLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [geojson, map]);

    return null;
}

export function MapPreview({ layerId, className = '' }: MapPreviewProps) {
    const [geojson, setGeojson] = useState<GeoJSONFeatureCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadGeoJSON();
    }, [layerId]);

    const loadGeoJSON = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await GISService.getLayerGeoJSON(layerId);
            setGeojson(data);
        } catch (err: any) {
            console.error('Failed to load GeoJSON:', err);
            setError(err.response?.data?.detail || 'Failed to load map data');
        } finally {
            setLoading(false);
        }
    };

    const getFeatureStyle = (feature: any) => {
        const geometryType = feature?.geometry?.type;

        // Different styles for different geometry types
        if (geometryType === 'Point' || geometryType === 'MultiPoint') {
            return {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.6,
                weight: 2,
                radius: 8,
            };
        } else if (geometryType === 'LineString' || geometryType === 'MultiLineString') {
            return {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.8,
            };
        } else {
            // Polygon
            return {
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.3,
                weight: 2,
                opacity: 0.8,
            };
        }
    };

    const onEachFeature = (feature: any, layer: any) => {
        // Add popup with properties
        if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
                .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
                .join('');

            layer.bindPopup(`<div class="text-sm">${popupContent}</div>`);
        }

        // Add hover effect
        layer.on({
            mouseover: (e: any) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 4,
                    fillOpacity: 0.6,
                });
            },
            mouseout: (e: any) => {
                const layer = e.target;
                layer.setStyle(getFeatureStyle(feature));
            },
        });
    };

    const pointToLayer = (feature: any, latlng: L.LatLng) => {
        return L.circleMarker(latlng, getFeatureStyle(feature));
    };

    if (loading) {
        return (
            <div className={`flex items-center justify-center h-full min-h-[400px] bg-muted rounded-lg ${className}`}>
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center h-full min-h-[400px] ${className}`}>
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                        <p className="font-medium mb-2">{error}</p>
                        <Button variant="outline" size="sm" onClick={loadGeoJSON}>
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!geojson || geojson.features.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full min-h-[400px] bg-muted rounded-lg ${className}`}>
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">This layer has no features to display</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`rounded-lg overflow-hidden border ${className}`}>
            <MapContainer
                center={[0, 0]}
                zoom={2}
                style={{ height: '600px', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <GeoJSON
                    data={geojson as any}
                    style={getFeatureStyle}
                    onEachFeature={onEachFeature}
                    pointToLayer={pointToLayer}
                />

                <FitBounds geojson={geojson} />
            </MapContainer>
        </div>
    );
}
