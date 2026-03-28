import { Transform } from 'class-transformer';
import { MemberStatus } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

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
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @IsOptional()
  @IsUUID('4')
  churchId?: string;

  @IsOptional()
  @IsUUID('4')
  leadershipRoleId?: string;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;
}
