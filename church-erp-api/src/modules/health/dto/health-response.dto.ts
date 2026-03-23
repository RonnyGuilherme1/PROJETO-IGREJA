export class HealthResponseDto {
  status!: string;
  timestamp!: string;
  database!: string;

  constructor(data: HealthResponseDto) {
    Object.assign(this, data);
  }
}
