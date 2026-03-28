import { DepartmentEntity } from '../types/department.type';

export class DepartmentResponseDto {
  id!: string;
  name!: string;
  description!: string | null;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(department: DepartmentEntity) {
    this.id = department.id;
    this.name = department.name;
    this.description = department.description;
    this.active = department.active;
    this.createdAt = department.createdAt;
    this.updatedAt = department.updatedAt;
  }
}
