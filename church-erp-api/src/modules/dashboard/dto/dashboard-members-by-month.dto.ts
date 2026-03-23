export class DashboardMembersByMonthDto {
  month!: string;
  totalMembers!: number;

  constructor(data: DashboardMembersByMonthDto) {
    this.month = data.month;
    this.totalMembers = data.totalMembers;
  }
}
