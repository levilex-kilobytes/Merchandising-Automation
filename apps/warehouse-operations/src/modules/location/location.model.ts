import { Location } from './location.types';

export interface LocationRow {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity: number;
  used: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    code: row.code,
    zone: row.zone,
    aisle: row.aisle,
    rack: row.rack,
    shelf: row.shelf,
    bin: row.bin,
    capacity: row.capacity,
    used: row.used,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
