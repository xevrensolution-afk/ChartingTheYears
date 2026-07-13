'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Annotation,
} from 'react-simple-maps';
import { Icon } from '@/components/ui/kit/Icon';
import { getCountryCode, getCountryName } from '@/lib/countries';
import { isCountryVisibleInEra } from '@/lib/historicalExistence';
import { useAppSelector } from '@/store/hooks';
import { selectMapStyle } from '@/features/settings/selectors';
import './HistoricalMap.css';

const GEO_URL = '/countries-110m.json';

// ── Palette definitions ────────────────────────────────────────────────────────
const MAP_STYLES: Record<string, {
  ocean: string;
  countryFill: string;
  countryStroke: string;
  labelFill: string;
}> = {
  'Parchment': {
    ocean: '#F5EEE4',
    countryFill: '#CDBFAA',
    countryStroke: '#BDB0A0',
    labelFill: '#3D2F22',
  },
  'Dark Ocean': {
    ocean: '#2e2a24',
    countryFill: '#4a443c',
    countryStroke: '#5c5448',
    labelFill: 'oklch(0.85 0.02 70)',
  },
  'Light Ocean': {
    ocean: '#d6e8f0',
    countryFill: '#c8d8e2',
    countryStroke: '#9ab5c4',
    labelFill: 'oklch(0.28 0.03 220)',
  },
};

const DEFAULT_STYLE = MAP_STYLES['Parchment'];

// ── Country label configuration ────────────────────────────────────────────────
const COUNTRY_LABELS: Array<{ name: string; lon: number; lat: number; minZoom: number }> = [
  // ── Tier 1: always visible (minZoom 1.0) ───────────────────────────────
  { name: 'Russia',        lon: 96,   lat: 62,  minZoom: 1.0 },
  { name: 'Canada',        lon: -96,  lat: 60,  minZoom: 1.0 },
  { name: 'United States', lon: -97,  lat: 39,  minZoom: 1.0 },
  { name: 'China',         lon: 104,  lat: 36,  minZoom: 1.0 },
  { name: 'Brazil',        lon: -52,  lat: -10, minZoom: 1.0 },
  { name: 'Australia',     lon: 134,  lat: -27, minZoom: 1.0 },
  { name: 'India',         lon: 80,   lat: 22,  minZoom: 1.0 },
  { name: 'Greenland',     lon: -42,  lat: 72,  minZoom: 1.0 },
  { name: 'Algeria',       lon: 3,    lat: 28,  minZoom: 1.0 },
  { name: 'Kazakhstan',    lon: 66,   lat: 48,  minZoom: 1.0 },
  { name: 'Saudi Arabia',  lon: 45,   lat: 24,  minZoom: 1.0 },
  { name: 'Mexico',        lon: -102, lat: 24,  minZoom: 1.0 },
  { name: 'Indonesia',     lon: 117,  lat: -2,  minZoom: 1.0 },
  { name: 'Mongolia',      lon: 103,  lat: 46,  minZoom: 1.0 },
  { name: 'Sudan',         lon: 30,   lat: 15,  minZoom: 1.0 },
  { name: 'Argentina',     lon: -64,  lat: -36, minZoom: 1.0 },
  { name: 'Libya',         lon: 18,   lat: 27,  minZoom: 1.0 },
  { name: 'Iran',          lon: 53,   lat: 32,  minZoom: 1.0 },
  // ── Tier 2: visible at zoom ≥ 1.7 ──────────────────────────────────────
  { name: 'Nigeria',                     lon: 8,    lat: 10,  minZoom: 1.7 },
  { name: 'Egypt',                       lon: 30,   lat: 27,  minZoom: 1.7 },
  { name: 'South Africa',                lon: 25,   lat: -29, minZoom: 1.7 },
  { name: 'Pakistan',                    lon: 70,   lat: 30,  minZoom: 1.7 },
  { name: 'Turkey',                      lon: 35,   lat: 39,  minZoom: 1.7 },
  { name: 'France',                      lon: 2.5,  lat: 46,  minZoom: 1.7 },
  { name: 'Germany',                     lon: 10,   lat: 51,  minZoom: 1.7 },
  { name: 'Ukraine',                     lon: 32,   lat: 49,  minZoom: 1.7 },
  { name: 'Spain',                       lon: -3,   lat: 40,  minZoom: 1.7 },
  { name: 'Peru',                        lon: -75,  lat: -10, minZoom: 1.7 },
  { name: 'Colombia',                    lon: -74,  lat: 4,   minZoom: 1.7 },
  { name: 'Angola',                      lon: 18,   lat: -12, minZoom: 1.7 },
  { name: 'Ethiopia',                    lon: 40,   lat: 8,   minZoom: 1.7 },
  { name: 'Mali',                        lon: -2,   lat: 18,  minZoom: 1.7 },
  { name: 'Mozambique',                  lon: 35,   lat: -18, minZoom: 1.7 },
  { name: 'Chad',                        lon: 18,   lat: 15,  minZoom: 1.7 },
  { name: 'Bolivia',                     lon: -65,  lat: -17, minZoom: 1.7 },
  { name: 'Myanmar',                     lon: 96,   lat: 20,  minZoom: 1.7 },
  { name: 'Afghanistan',                 lon: 67,   lat: 34,  minZoom: 1.7 },
  { name: 'Iraq',                        lon: 44,   lat: 33,  minZoom: 1.7 },
  { name: 'Venezuela',                   lon: -66,  lat: 8,   minZoom: 1.7 },
  { name: 'Democratic Republic of the Congo', lon: 24, lat: -3, minZoom: 1.7 },
  { name: 'Mauritania',                  lon: -11,  lat: 20,  minZoom: 1.7 },
  { name: 'South Sudan',                 lon: 31,   lat: 7,   minZoom: 1.7 },
  { name: 'Namibia',                     lon: 18,   lat: -22, minZoom: 1.7 },
  // ── Tier 3: visible at zoom ≥ 2.6 ──────────────────────────────────────
  { name: 'Poland',         lon: 20,   lat: 52,   minZoom: 2.6 },
  { name: 'United Kingdom', lon: -2,   lat: 54,   minZoom: 2.6 },
  { name: 'Sweden',         lon: 18,   lat: 62,   minZoom: 2.6 },
  { name: 'Norway',         lon: 9,    lat: 62,   minZoom: 2.6 },
  { name: 'Finland',        lon: 26,   lat: 64,   minZoom: 2.6 },
  { name: 'Morocco',        lon: -6,   lat: 32,   minZoom: 2.6 },
  { name: 'Uzbekistan',     lon: 63,   lat: 41,   minZoom: 2.6 },
  { name: 'Turkmenistan',   lon: 59,   lat: 40,   minZoom: 2.6 },
  { name: 'Thailand',       lon: 101,  lat: 15,   minZoom: 2.6 },
  { name: 'Vietnam',        lon: 108,  lat: 16,   minZoom: 2.6 },
  { name: 'Malaysia',       lon: 110,  lat: 2,    minZoom: 2.6 },
  { name: 'Romania',        lon: 25,   lat: 46,   minZoom: 2.6 },
  { name: 'Chile',          lon: -71,  lat: -35,  minZoom: 2.6 },
  { name: 'Tanzania',       lon: 35,   lat: -6,   minZoom: 2.6 },
  { name: 'Kenya',          lon: 38,   lat: 0,    minZoom: 2.6 },
  { name: 'Somalia',        lon: 46,   lat: 6,    minZoom: 2.6 },
  { name: 'Zambia',         lon: 28,   lat: -13,  minZoom: 2.6 },
  { name: 'Zimbabwe',       lon: 30,   lat: -20,  minZoom: 2.6 },
  { name: 'Japan',          lon: 138,  lat: 37,   minZoom: 2.6 },
  { name: 'South Korea',    lon: 128,  lat: 36,   minZoom: 2.6 },
  { name: 'North Korea',    lon: 127,  lat: 40,   minZoom: 2.6 },
  { name: 'Philippines',    lon: 122,  lat: 12,   minZoom: 2.6 },
  { name: 'Italy',          lon: 12,   lat: 43,   minZoom: 2.6 },
  { name: 'Greece',         lon: 22,   lat: 39,   minZoom: 2.6 },
  { name: 'Belarus',        lon: 28,   lat: 53,   minZoom: 2.6 },
  { name: 'Syria',          lon: 38,   lat: 35,   minZoom: 2.6 },
  { name: 'Cameroon',       lon: 12,   lat: 5,    minZoom: 2.6 },
  { name: 'Niger',          lon: 8,    lat: 17,   minZoom: 2.6 },
  { name: 'New Zealand',    lon: 172,  lat: -42,  minZoom: 2.6 },
  { name: 'Portugal',       lon: -8,   lat: 39.5, minZoom: 2.6 },
  { name: 'Netherlands',    lon: 5.3,  lat: 52.3, minZoom: 2.6 },
  { name: 'Hungary',        lon: 19,   lat: 47,   minZoom: 2.6 },
  { name: 'Austria',        lon: 14.5, lat: 47.5, minZoom: 2.6 },
  { name: 'Czech Republic', lon: 15.5, lat: 49.8, minZoom: 2.6 },
  { name: 'Switzerland',    lon: 8.2,  lat: 47,   minZoom: 2.6 },
  { name: 'Belgium',        lon: 4.5,  lat: 50.5, minZoom: 2.6 },
  { name: 'Denmark',        lon: 10,   lat: 56,   minZoom: 2.6 },
  { name: 'Bulgaria',       lon: 25,   lat: 42.8, minZoom: 2.6 },
  { name: 'Serbia',         lon: 21,   lat: 44,   minZoom: 2.6 },
  { name: 'Ireland',        lon: -8,   lat: 53.2, minZoom: 2.6 },
  { name: 'Yemen',          lon: 48,   lat: 16,   minZoom: 2.6 },
  { name: 'Jordan',         lon: 36.5, lat: 31,   minZoom: 2.6 },
  { name: 'Bangladesh',     lon: 90,   lat: 23.5, minZoom: 2.6 },
  { name: 'Nepal',          lon: 84,   lat: 28,   minZoom: 2.6 },
  { name: 'Cambodia',       lon: 105,  lat: 12,   minZoom: 2.6 },
  { name: 'Laos',           lon: 103,  lat: 18,   minZoom: 2.6 },
  { name: 'Ecuador',        lon: -78,  lat: -1.5, minZoom: 2.6 },
  { name: 'Paraguay',       lon: -58,  lat: -23,  minZoom: 2.6 },
  { name: 'Uruguay',        lon: -56,  lat: -33,  minZoom: 2.6 },
  { name: 'Ghana',          lon: -1,   lat: 8,    minZoom: 2.6 },
  { name: 'Senegal',        lon: -14,  lat: 14,   minZoom: 2.6 },
  { name: "Côte d'Ivoire",  lon: -6,   lat: 7.5,  minZoom: 2.6 },
  { name: 'Madagascar',     lon: 47,   lat: -20,  minZoom: 2.6 },
  { name: 'Papua New Guinea', lon: 145, lat: -6,  minZoom: 2.6 },
  { name: 'Taiwan',         lon: 121,  lat: 24,   minZoom: 2.6 },
  { name: 'Botswana',       lon: 24,   lat: -22,  minZoom: 2.6 },
  { name: 'Kyrgyzstan',     lon: 75,   lat: 41.5, minZoom: 2.6 },
  { name: 'Tajikistan',     lon: 71,   lat: 39,   minZoom: 2.6 },
  { name: 'Azerbaijan',     lon: 47.5, lat: 40.5, minZoom: 2.6 },
  { name: 'Georgia',        lon: 43.5, lat: 42,   minZoom: 2.6 },
  { name: 'Armenia',        lon: 45,   lat: 40,   minZoom: 2.6 },
  { name: 'Croatia',        lon: 16,   lat: 45.2, minZoom: 2.6 },
  { name: 'Slovakia',       lon: 19.5, lat: 48.5, minZoom: 2.6 },
  { name: 'Lithuania',      lon: 24,   lat: 55.8, minZoom: 2.6 },
  { name: 'Latvia',         lon: 25,   lat: 57,   minZoom: 2.6 },
  { name: 'Estonia',        lon: 25.5, lat: 59,   minZoom: 2.6 },
  { name: 'Moldova',        lon: 29,   lat: 47,   minZoom: 2.6 },
  { name: 'Eritrea',        lon: 39,   lat: 15.5, minZoom: 2.6 },
  { name: 'Djibouti',       lon: 43,   lat: 11.8, minZoom: 2.6 },
  // ── Tier 4: visible at zoom ≥ 3.5 (small/dense countries) ──────────────
  { name: 'Lebanon',            lon: 35.9, lat: 34,   minZoom: 3.5 },
  { name: 'Israel',             lon: 35,   lat: 31.5, minZoom: 3.5 },
  { name: 'United Arab Emirates', lon: 54, lat: 24.1, minZoom: 3.5 },
  { name: 'Kuwait',             lon: 47.7, lat: 29.3, minZoom: 3.5 },
  { name: 'Qatar',              lon: 51.2, lat: 25.3, minZoom: 3.5 },
  { name: 'Oman',               lon: 57.5, lat: 22,   minZoom: 3.5 },
  { name: 'Cuba',               lon: -80,  lat: 22,   minZoom: 3.5 },
  { name: 'Honduras',           lon: -86.5, lat: 15,  minZoom: 3.5 },
  { name: 'Guatemala',          lon: -90.5, lat: 15.5, minZoom: 3.5 },
  { name: 'Nicaragua',          lon: -85,  lat: 12.5, minZoom: 3.5 },
  { name: 'Dominican Republic', lon: -70,  lat: 19,   minZoom: 3.5 },
  { name: 'Haiti',              lon: -73,  lat: 19,   minZoom: 3.5 },
  { name: 'Albania',            lon: 20,   lat: 41.2, minZoom: 3.5 },
  { name: 'Bosnia and Herzegovina', lon: 17.5, lat: 44, minZoom: 3.5 },
  { name: 'North Macedonia',    lon: 21.7, lat: 41.6, minZoom: 3.5 },
  { name: 'Kosovo',             lon: 21,   lat: 42.6, minZoom: 3.5 },
  { name: 'Montenegro',         lon: 19.3, lat: 42.8, minZoom: 3.5 },
  { name: 'Slovenia',           lon: 14.8, lat: 46.1, minZoom: 3.5 },
  { name: 'Sri Lanka',          lon: 81,   lat: 8,    minZoom: 3.5 },
  { name: 'Panama',             lon: -80,  lat: 9,    minZoom: 3.5 },
  { name: 'Costa Rica',         lon: -84,  lat: 10,   minZoom: 3.5 },
  { name: 'Tunisia',            lon: 9,    lat: 34,   minZoom: 3.5 },
];

// ── Module-level highlight constants (computed once, never recreated) ──────────
const HIGHLIGHT_FILLS: Record<'low' | 'medium' | 'high', string> = {
  low:    'oklch(0.87 0.06 72)',
  medium: 'oklch(0.78 0.09 70)',
  high:   'oklch(0.63 0.14 68)',
};

const GLOW_FILTERS: Record<'low' | 'medium' | 'high', string> = {
  low:    'drop-shadow(0 0 3px oklch(0.87 0.06 72 / 0.7))',
  medium: 'drop-shadow(0 0 5px oklch(0.78 0.09 70 / 0.8))',
  high:   'drop-shadow(0 0 8px oklch(0.63 0.14 68 / 0.9)) drop-shadow(0 0 3px oklch(0.63 0.14 68 / 0.5))',
};

function calcIntensity(count: number): 'low' | 'medium' | 'high' {
  if (count <= 1) return 'low';
  if (count <= 3) return 'medium';
  return 'high';
}

// ── GeoFeature: memoized, isolated per-country Geography ─────────────────────
// All props are primitives so React.memo's shallow comparison is exact.
// Only re-renders when its own data changes — not when sibling/parent state does.
interface GeoFeatureProps {
  geo: any;
  countryCode: string;
  isSelected: boolean;
  isHighlighted: boolean;
  hasHighlights: boolean;
  isIdleState: boolean;
  intensity: 'low' | 'medium' | 'high';
  historicallyExists: boolean;
  highlightDelay: string;
  paletteFill: string;
  paletteStroke: string;
  onCountryClick: (code: string) => void;
}

const GeoFeature = memo(function GeoFeature({
  geo,
  countryCode,
  isSelected,
  isHighlighted,
  hasHighlights,
  isIdleState,
  intensity,
  historicallyExists,
  highlightDelay,
  paletteFill,
  paletteStroke,
  onCountryClick,
}: GeoFeatureProps) {
  const highlightFill = HIGHLIGHT_FILLS[intensity];

  const fillColor = isSelected
    ? 'var(--ink)'
    : isHighlighted && !isIdleState
      ? highlightFill
      : paletteFill;

  const strokeColor = isSelected
    ? 'var(--ink)'
    : isHighlighted && !isIdleState
      ? highlightFill
      : paletteStroke;

  const opacityVal = historicallyExists
    ? (isSelected || (isHighlighted && !isIdleState)) ? 1 : hasHighlights ? 0.28 : 1
    : 0;

  const defaultFilter = isSelected
    ? 'drop-shadow(0 0 6px var(--ink))'
    : isHighlighted && !isIdleState
      ? GLOW_FILTERS[intensity]
      : 'none';

  const hoverFill = isHighlighted && !isIdleState
    ? HIGHLIGHT_FILLS.high
    : isSelected
      ? 'var(--ink)'
      : 'var(--accent-soft)';

  const hoverOpacity = isHighlighted && !isIdleState
    ? 1
    : hasHighlights
      ? 0.55
      : 0.85;

  const className = [
    'map-geo',
    isSelected && 'map-geo--selected',
    isHighlighted && !isIdleState && `map-geo--highlighted map-geo--${intensity}`,
    !isHighlighted && hasHighlights && 'map-geo--muted',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Geography
      geography={geo}
      onClick={() => onCountryClick(countryCode)}
      className={className}
      style={{
        default: {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: isHighlighted && !isIdleState ? 0.7 : 0.5,
          outline: 'none',
          // Removed 'filter' from transition — CSS filter on SVG is expensive to animate
          transition:
            'fill 550ms cubic-bezier(0.4,0,0.2,1), stroke 550ms cubic-bezier(0.4,0,0.2,1), opacity 700ms cubic-bezier(0.4,0,0.2,1)',
          opacity: opacityVal,
          filter: defaultFilter,
          willChange: 'fill, opacity',
          animationDelay: highlightDelay,
          pointerEvents: historicallyExists ? 'auto' : 'none',
        },
        hover: {
          fill: hoverFill,
          stroke: isHighlighted && !isIdleState ? HIGHLIGHT_FILLS.high : paletteStroke,
          strokeWidth: 0.8,
          outline: 'none',
          cursor: 'pointer',
          opacity: hoverOpacity,
          filter: isHighlighted && !isIdleState
            ? 'drop-shadow(0 0 8px oklch(0.63 0.14 68 / 0.95))'
            : 'none',
        },
        pressed: {
          fill: 'var(--ink)',
          stroke: 'var(--ink)',
          strokeWidth: 0.5,
          outline: 'none',
          opacity: 1,
          filter: 'none',
        },
      }}
    />
  );
});

// ── HistoricalMap ─────────────────────────────────────────────────────────────
interface HistoricalMapProps {
  highlightedCountries: string[];
  selectedCountryName: string | null;
  activeEra: string | null;
  booksInSelection: { title: string }[];
  bookCountByCountry?: Record<string, number>;
  onCountryClick?: (countryName: string) => void;
}

const HistoricalMap = memo(function HistoricalMap({
  highlightedCountries,
  selectedCountryName,
  activeEra,
  booksInSelection,
  bookCountByCountry,
  onCountryClick,
}: HistoricalMapProps) {
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1.2 });
  // Subscribes to the mapStyle string only — settings churn elsewhere
  // can't re-render this (heavy, memoized) component.
  const mapStyle = useAppSelector(selectMapStyle);

  const prevEraRef = useRef(activeEra);
  const [isEraTransitioning, setIsEraTransitioning] = useState(false);
  const [eraAnimKey, setEraAnimKey] = useState(0);

  useEffect(() => {
    if (prevEraRef.current !== activeEra) {
      prevEraRef.current = activeEra;
      setIsEraTransitioning(true);
      setEraAnimKey((k) => k + 1);
      const t = setTimeout(() => setIsEraTransitioning(false), 900);
      return () => clearTimeout(t);
    }
  }, [activeEra]);

  // Only null (no era chosen) is truly idle. 'All' is an active state that shows highlights.
  const isIdleState = activeEra === null;
  const hasHighlights = !isIdleState && highlightedCountries.length > 0;

  // O(1) Set for fast per-country highlight lookup (replaces O(n) .includes())
  const highlightedSet = useMemo(
    () => new Set(highlightedCountries),
    [highlightedCountries],
  );

  // Pre-built index map for stagger animation delays (replaces O(n) .indexOf())
  const highlightIndexMap = useMemo(
    () => new Map(highlightedCountries.map((code, i) => [code, i])),
    [highlightedCountries],
  );

  const palette = MAP_STYLES[mapStyle] ?? DEFAULT_STYLE;

  const handleZoomIn = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 6) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }));
  }, []);

  const handleMoveEnd = useCallback(
    (pos: { coordinates: [number, number]; zoom: number }) => setPosition(pos),
    [],
  );

  const handleCountryClick = useCallback(
    (code: string) => onCountryClick?.(code),
    [onCountryClick],
  );

  const zoom = position.zoom;
  const baseFontSize = 5;
  const labelFontSize = baseFontSize / zoom;

  const visibleLabels = useMemo(
    () => COUNTRY_LABELS.filter((lbl) => zoom >= lbl.minZoom),
    [zoom],
  );

  return (
    <div
      className={`map-wrapper${isEraTransitioning ? ' era-transitioning' : ''}${hasHighlights ? ' era-active' : ''}`}
      style={{ backgroundColor: palette.ocean }}
    >
      <div className="map-dot-pattern" />

      {isEraTransitioning && <div className="map-era-flash" />}

      {!activeEra && (
        <div className="map-idle-overlay">
          <div className="map-idle-inner">
            <div className="map-idle-globe">🌍</div>
            <p className="map-idle-title">Explore the Atlas</p>
            <p className="map-idle-hint">Select an era to reveal historical countries and books</p>
            <div className="map-idle-eras">
              <span className="map-idle-era-chip">Ancient</span>
              <span className="map-idle-era-chip">1900–1920</span>
              <span className="map-idle-era-chip">1940</span>
              <span className="map-idle-era-chip">1980</span>
              <span className="map-idle-era-chip">2026</span>
            </div>
          </div>
        </div>
      )}

      {hasHighlights && (
        <div className="map-era-badge" key={eraAnimKey}>
          <span className="map-era-badge-dot" />
          {activeEra}
        </div>
      )}

      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const name = geo.properties.name;
                const code = getCountryCode(name);
                const isSelected = selectedCountryName === code;
                const isHighlighted = highlightedSet.has(code); // O(1) — was O(n)
                const historicallyExists =
                  !activeEra || activeEra === 'All' || isCountryVisibleInEra(code, activeEra);
                const count = bookCountByCountry?.[code] ?? 0;
                const intensity = isHighlighted ? calcIntensity(count) : 'low';
                const highlightIdx = isHighlighted ? (highlightIndexMap.get(code) ?? -1) : -1; // O(1) — was O(n)
                const highlightDelay =
                  highlightIdx >= 0 ? `${Math.min(highlightIdx * 40, 400)}ms` : '0ms';

                return (
                  <GeoFeature
                    key={geo.rsmKey}
                    geo={geo}
                    countryCode={code}
                    isSelected={isSelected}
                    isHighlighted={isHighlighted}
                    hasHighlights={hasHighlights}
                    isIdleState={isIdleState}
                    intensity={intensity}
                    historicallyExists={historicallyExists}
                    highlightDelay={highlightDelay}
                    paletteFill={palette.countryFill}
                    paletteStroke={palette.countryStroke}
                    onCountryClick={handleCountryClick}
                  />
                );
              })
            }
          </Geographies>

          {visibleLabels.map((lbl) => {
            const code = getCountryCode(lbl.name);
            const isHighlighted = highlightedSet.has(code);
            const isSelected = selectedCountryName === code;
            const labelHistoricallyExists =
              !activeEra || activeEra === 'All' || isCountryVisibleInEra(code, activeEra);
            const zoomFade = Math.min((zoom - lbl.minZoom + 0.3) / 0.3, 1);
            const fadeOpacity = labelHistoricallyExists ? zoomFade : 0;

            return (
              <Annotation
                key={lbl.name}
                subject={[lbl.lon, lbl.lat]}
                dx={0}
                dy={0}
                connectorProps={{}}
              >
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  style={{
                    fontSize: `${labelFontSize}px`,
                    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
                    fontWeight: isHighlighted || isSelected ? 700 : 500,
                    fill: isSelected
                      ? 'var(--canvas)'
                      : isHighlighted
                        ? 'oklch(0.18 0.015 60)'
                        : palette.labelFill,
                    opacity: fadeOpacity,
                    transition: 'opacity 700ms cubic-bezier(0.4,0,0.2,1)',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    letterSpacing: '0.01em',
                    textShadow: '0 0 4px var(--surface-2)',
                  }}
                >
                  {lbl.name}
                </text>
              </Annotation>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {selectedCountryName && (
        <div className="map-selection-overlay" key={selectedCountryName}>
          <div>
            <h2 className="map-overlay-country">{getCountryName(selectedCountryName)}</h2>
            <p className="map-overlay-era">Coverage: {activeEra}</p>
            {bookCountByCountry?.[selectedCountryName] && (
              <div className="map-overlay-count">
                <span className="map-overlay-count-dot" />
                {bookCountByCountry[selectedCountryName]} book{bookCountByCountry[selectedCountryName] !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="map-book-list">
            {booksInSelection.slice(0, 4).map((book, idx) => (
              <button
                key={idx}
                className="map-book-row"
                style={{ animationDelay: `${idx * 60 + 120}ms` }}
              >
                <span className="map-book-row-title">{book.title}</span>
                <span className="map-book-row-chevron">›</span>
              </button>
            ))}
            {booksInSelection.length === 0 && (
              <p className="map-no-books">No books found for this era</p>
            )}
          </div>
        </div>
      )}

      <div className="map-controls">
        <button onClick={handleZoomIn} className="map-zoom-btn" aria-label="Zoom in">
          <Icon name="plus" size={16} />
        </button>
        <button onClick={handleZoomOut} className="map-zoom-btn" aria-label="Zoom out">
          <span className="map-zoom-minus-bar" />
        </button>
      </div>

      <div className="map-zoom-badge">
        {zoom < 1.7 ? 'World view' : zoom < 2.6 ? 'Regional view' : 'Country view'}
      </div>
    </div>
  );
});

export { HistoricalMap };
export default HistoricalMap;
