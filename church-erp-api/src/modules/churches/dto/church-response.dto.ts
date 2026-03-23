import { ChurchStatus } from '@prisma/client';

import { ChurchEntity } from '../types/church.type';

export class ChurchResponseDto {
  id!: string;
  name!: string;
  cnpj!: string | null;
  phone!: string | null;
  email!: string | null;
  address!: string | null;
  pastorName!: string | null;
  status!: ChurchStatus;
  notes!: string | null;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(church: ChurchEntity) {
    this.id = church.id;
    this.name = church.name;
    this.cnpj = church.cnpj;
    this.phone = church.phone;
    this.email = church.email;
    this.address = church.address;
    this.pastorName = church.pastorName;
    this.status = church.status;
    this.notes = church.notes;
    this.createdAt = church.createdAt;
    this.updatedAt = church.updatedAt;
  }
}
