import { LeadershipRoleEntity } from '../types/leadership-role.type';

export class LeadershipRoleResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(leadershipRole: LeadershipRoleEntity) {
    this.id = leadershipRole.id;
    this.name = leadershipRole.name;
    this.description = leadershipRole.description;
    this.active = leadershipRole.active;
    this.createdAt = leadershipRole.createdAt;
    this.updatedAt = leadershipRole.updatedAt;
  }
}
