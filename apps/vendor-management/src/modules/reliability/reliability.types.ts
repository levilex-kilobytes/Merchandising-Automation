export interface SupplierReliability {
  id: string;
  supplierId: string;
  periodStart: Date;
  periodEnd: Date;
  ordersTotal: number;
  ordersOnTime: number;
  ordersLate: number;
  ordersShort: number;
  ordersDamaged: number;
  onTimeRate: number | null;
  qualityRate: number | null;
  updatedAt: Date;
}

export interface RecordDeliveryDto {
  supplierId: string;
  deliveredAt: string;
  onTime: boolean;
  hadShortage: boolean;
  hadDamage: boolean;
}
