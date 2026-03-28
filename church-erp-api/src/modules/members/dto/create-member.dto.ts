import { Transform, Type } from 'class-transformer';
import { MemberStatus } from '@prisma/client';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum MemberGender {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO',
}

export enum MemberMaritalStatus {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUVO = 'VIUVO',
}

export function normalizeMemberEnumValue(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toUpperCase();

  return normalized ? normalized : undefined;
}

export class CreateMemberDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date | null;

  @IsOptional()
  @Transform(({ value }) => normalizeMemberEnumValue(value))
  @IsEnum(MemberGender)
  gender?: MemberGender | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @Transform(({ value }) => normalizeMemberEnumValue(value))
  @IsEnum(MemberMaritalStatus)
  maritalStatus?: MemberMaritalStatus | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedAt?: Date | null;

  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsUUID('4')
  churchId!: string;

  @IsOptional()
  @IsUUID('4')
  leadershipRoleId?: string | null;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string | null;
}
