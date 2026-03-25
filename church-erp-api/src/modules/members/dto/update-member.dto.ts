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
import {
  MemberGender,
  MemberMaritalStatus,
  normalizeMemberEnumValue,
} from './create-member.dto';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  fullName?: string;

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
  @Type(() => Date)
  @IsDate()
  baptismDate?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  membershipDate?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  conversionDate?: Date | null;

  @IsOptional()
  @Transform(({ value }) => normalizeMemberEnumValue(value))
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  administrativeNotes?: string | null;

  @IsOptional()
  @IsUUID('4')
  churchId?: string;
}
