import { MemberStatus } from '@prisma/client';

type MemberResponseSource = {
  id: string;
  fullName: string;
  birthDate: Date | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  maritalStatus: string | null;
  joinedAt: Date | null;
  baptismDate: Date | null;
  membershipDate: Date | null;
  conversionDate: Date | null;
  status: MemberStatus;
  notes: string | null;
  administrativeNotes: string | null;
  churchId: string;
  createdAt: Date;
  updatedAt: Date;
};

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
  baptismDate!: Date | null;
  membershipDate!: Date | null;
  conversionDate!: Date | null;
  status!: MemberStatus;
  notes!: string | null;
  administrativeNotes!: string | null;
  churchId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(member: MemberResponseSource) {
    this.id = member.id;
    this.fullName = member.fullName;
    this.birthDate = member.birthDate;
    this.gender = member.gender;
    this.phone = member.phone;
    this.email = member.email;
    this.address = member.address;
    this.maritalStatus = member.maritalStatus;
    this.joinedAt = member.joinedAt;
    this.baptismDate = member.baptismDate;
    this.membershipDate = member.membershipDate;
    this.conversionDate = member.conversionDate;
    this.status = member.status;
    this.notes = member.notes;
    this.administrativeNotes = member.administrativeNotes;
    this.churchId = member.churchId;
    this.createdAt = member.createdAt;
    this.updatedAt = member.updatedAt;
  }
}
