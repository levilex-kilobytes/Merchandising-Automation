export interface Location {
  id: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity: number;
  used: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLocationDto {
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  capacity?: number;
}
