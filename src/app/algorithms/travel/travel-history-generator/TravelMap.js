'use client';

import { useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css'; 
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';

// Fix for default Leaflet marker icons in React/Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal date helper
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDMY = (dateStr) => {
  const d = parseDate(dateStr);
  if (!d) return '';
  return format(d, 'dd/MM/yyyy');
};

// Internal Coordinate Helper (Needs to match your data source logic or pass data in fully prepared)
// Since we can't easily import CSC_COUNTRIES here without bloat, we will assume 
// the parent component passes fully prepared coordinates or we re-import the library here.
// OPTION: We will re-import Country here to be safe and self-contained.
import { Country } from "country-state-city";
const CSC_COUNTRIES = Country.getAllCountries();

const normalize = (str) => 
  str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() || "";

function getCoordsFromCountryName(name) {
  if (!name) return null;
  const q = normalize(name.trim());
  let hit = CSC_COUNTRIES.find(c => normalize(c.name) === q);
  if (hit && hit.latitude && hit.longitude) {
    return [parseFloat(hit.latitude), parseFloat(hit.longitude)];
  }
  return null;
}

export default function TravelMap({ events }) {
  // 1. Build route points
  const route = useMemo(() => {
    const points = [];
    const pins = [];
    let bounds = [];
    
    // Group events to find Origins and Stops
    const tripMap = new Map();
    events.forEach(ev => {
       if(!tripMap.has(ev.tripId)) tripMap.set(ev.tripId, { origin: ev.stop?.tripOriginCountry, stops: [] });
       if(ev.type === 'stop') tripMap.get(ev.tripId).stops.push(ev);
    });

    tripMap.forEach((data, tripId) => {
      // Get Origin Coords
      const originCoords = getCoordsFromCountryName(data.origin);
      if (originCoords) {
        points.push(originCoords);
        bounds.push(originCoords);
      }

      // Get Stop Coords
      data.stops.forEach(ev => {
        const coords = getCoordsFromCountryName(ev.stop.country);
        if (coords) {
          points.push(coords);
          bounds.push(coords);

          // Add Marker for Stop with Dates
          const dateStr = `${formatDMY(ev.stop.arrival)} - ${formatDMY(ev.stop.departure)}`;
          pins.push({ 
            position: coords, 
            label: `${ev.stop.country} (${dateStr})` 
          });
        }
      });
    });

    return { points, pins, bounds };
  }, [events]);

  // Default Center (UK roughly) or calculated bounds
  const center = route.bounds.length > 0 ? route.bounds[0] : [51.505, -0.09];
  const zoom = route.bounds.length > 0 ? 2 : 2;

  // Key forces re-render if data changes (critical for Leaflet)
  return (
    <MapContainer key={JSON.stringify(route.pins)} center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Dashed Route Line */}
      {route.points.length > 1 && (
        <Polyline 
          positions={route.points} 
          pathOptions={{ color: 'hsl(var(--brand))', weight: 3, dashArray: '10, 10', opacity: 0.7 }} 
        />
      )}

      {/* Markers with Permanent Tooltips */}
      {route.pins.map((pin, i) => (
        <Marker key={i} position={pin.position}>
          <Tooltip permanent direction="top" offset={[0, -20]} className="text-xs font-bold border border-slate-300 shadow-sm bg-white/90 px-2 py-1 rounded">
             {pin.label}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
