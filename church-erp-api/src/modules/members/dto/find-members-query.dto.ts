import { Transform, Type } from 'class-transformer';
import { MemberStatus } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { normalizeMemberEnumValue } from './create-member.dto';

export enum MemberAgeRange {
  CHILDREN = 'CHILDREN',
  TEENS = 'TEENS',
  ADULTS = 'ADULTS',
  SENIORS = 'SENIORS',
}

export class FindMembersQueryDto {
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number = 1;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  limit?: number = 10;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  size?: number;

  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5000)
  perPage?: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeMemberEnumValue(value))
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsUUID('4')
  churchId?: string;

  @IsOptional()
  @Transform(({ value }) => normalizeMemberEnumValue(value))
  @IsEnum(MemberAgeRange)
  ageRange?: MemberAgeRange;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedTo?: Date;
}
