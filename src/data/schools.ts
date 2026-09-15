import { CITIES, type CityData } from '@/data/cities';
import { distanceMiles } from '@/lib/utils';

export interface School {
  id: string;
  slug: string;
  name: string;
  bio: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  instruments: string[];
  avg_rating: number;
  review_count: number;
  featured: boolean;
  available: boolean;
  website_url: string;
  maps_url: string;
  phone: string;
  ages: string;
  price_range: string;
  sample: boolean;
}

const PROGRAMS = [
  {
    key: 'youth-music-academy',
    name: (city: string) => `${city} Youth Music Academy`,
    streetName: 'Maple Ave',
    streetNum: 214,
    instruments: ['Piano', 'Violin', 'Early Childhood'],
    ages: 'Ages 3–18',
    price: '$$',
    bio: (city: string, state: string) =>
      `Community music programs in ${city}, ${state}. Piano, violin, and early-childhood classes for beginners through advancing students.`,
    searchQuery: (city: string, state: string) => `${city} ${state} piano lessons for kids`,
  },
  {
    key: 'suzuki-studio',
    name: (city: string) => `${city} Suzuki Studio`,
    streetName: 'Oak St',
    streetNum: 518,
    instruments: ['Violin', 'Cello', 'Suzuki Method'],
    ages: 'Ages 4–16',
    price: '$$$',
    bio: (city: string, state: string) =>
      `Suzuki strings in ${city}, ${state}. Parent-involved violin and cello for early beginners through youth orchestra prep.`,
    searchQuery: (city: string, state: string) => `${city} ${state} suzuki violin lessons`,
  },
  {
    key: 'guitar-and-voice',
    name: (city: string) => `${city} Guitar & Voice School`,
    streetName: 'Pine Rd',
    streetNum: 830,
    instruments: ['Guitar', 'Voice', 'Ukulele'],
    ages: 'Ages 6–17',
    price: '$$',
    bio: (city: string, state: string) =>
      `Guitar and voice lessons in ${city}, ${state}. Private and small-group classes, plus beginner ukulele.`,
    searchQuery: (city: string, state: string) => `${city} ${state} guitar lessons for kids`,
  },
] as const;

function padZip(zip: string, offset: number) {
  const n = parseInt(zip, 10) + offset;
  return Number.isFinite(n) ? String(Math.max(0, n)).padStart(5, '0').slice(-5) : zip;
}

function buildSchool(city: CityData, programIndex: number, cityIndex: number): School {
  const program = PROGRAMS[programIndex];
  const slug = `${city.citySlug}-${city.stateAbbr.toLowerCase()}-${program.key}`;
  const street = `${program.streetNum + cityIndex} ${program.streetName}`;
  return {
    id: slug,
    slug,
    name: program.name(city.city),
    bio: program.bio(city.city, city.stateAbbr),
    street,
    city: city.city,
    state: city.stateAbbr,
    zip: padZip(city.zip, programIndex),
    lat: city.lat + programIndex * 0.012,
    lng: city.lng - programIndex * 0.012,
    instruments: [...program.instruments],
    avg_rating: 4.4 + ((cityIndex + programIndex) % 5) * 0.1,
    review_count: 12 + ((cityIndex * 3 + programIndex) % 40),
    featured: programIndex === 0 && cityIndex < 12,
    available: true,
    website_url: `https://www.google.com/search?q=${encodeURIComponent(program.searchQuery(city.city, city.stateAbbr))}`,
    maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`music school ${city.city} ${city.stateAbbr}`)}`,
    phone: `(555) 010-${String(100 + ((cityIndex * 3 + programIndex) % 90)).padStart(4, '0')}`,
    ages: program.ages,
    price_range: program.price,
    sample: true,
  };
}

export const SCHOOLS: School[] = CITIES.flatMap((city, cityIndex) =>
  PROGRAMS.map((_, programIndex) => buildSchool(city, programIndex, cityIndex))
);

export function getSchoolBySlug(slug: string) {
  return SCHOOLS.find(s => s.slug === slug);
}

export function featuredSchools(limit = 8) {
  return SCHOOLS.filter(s => s.featured && s.available).slice(0, limit);
}

export function searchSchools(opts: {
  q?: string;
  zip?: string;
  instrument?: string;
  rating?: string;
  price?: string;
  featured?: boolean;
  sort?: string;
  zipCoords?: { lat: number; lng: number } | null;
}) {
  let list = SCHOOLS.filter(s => s.available);

  if (opts.featured) list = list.filter(s => s.featured);
  if (opts.instrument) list = list.filter(s => s.instruments.includes(opts.instrument!));
  if (opts.price) list = list.filter(s => s.price_range === opts.price);
  if (opts.rating) {
    const min = parseFloat(opts.rating);
    list = list.filter(s => s.avg_rating >= min);
  }
  if (opts.q?.trim()) {
    const term = opts.q.trim().toLowerCase();
    list = list.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.bio.toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term) ||
      s.street.toLowerCase().includes(term) ||
      s.instruments.some(i => i.toLowerCase().includes(term))
    );
  }
  if (opts.zipCoords) {
    list = list.filter(s => distanceMiles(opts.zipCoords!.lat, opts.zipCoords!.lng, s.lat, s.lng) <= 100);
  }

  const sort = opts.sort ?? 'rating';
  if (sort === 'reviews') list = [...list].sort((a, b) => b.review_count - a.review_count);
  else if (sort === 'featured') list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || b.avg_rating - a.avg_rating);
  else list = [...list].sort((a, b) => b.avg_rating - a.avg_rating);

  return list;
}

export function schoolsInCity(city: string, stateAbbr: string) {
  return SCHOOLS.filter(
    s => s.available && s.city.toLowerCase() === city.toLowerCase() && s.state === stateAbbr
  ).sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
}

export function schoolsByInstrument(name: string) {
  return SCHOOLS.filter(s => s.available && s.instruments.includes(name))
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.avg_rating - a.avg_rating)
    .slice(0, 48);
}
