import { MemberStatus } from '@prisma/client';

import { MemberEntity } from '../types/member.type';

export class MemberResponseDto {
  id!: string;
  fullName!: string;
  birthDate!: Date | null;
  gender!: string | null;
  phone!: string | null;
  email!: string | null;
  address!: string | null;
  maritalStatus!: string | null;
  joinedAt!: Date | null;
  status!: MemberStatus;
  notes!: string | null;
  churchId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(member: MemberEntity) {
    this.id = member.id;
    this.fullName = member.fullName;
    this.birthDate = member.birthDate;
    this.gender = member.gender;
    this.phone = member.phone;
    this.email = member.email;
    this.address = member.address;
    this.maritalStatus = member.maritalStatus;
    this.joinedAt = member.joinedAt;
    this.status = member.status;
    this.notes = member.notes;
    this.churchId = member.churchId;
    this.createdAt = member.createdAt;
    this.updatedAt = member.updatedAt;
  }
}
