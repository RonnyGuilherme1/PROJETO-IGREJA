import { MemberResponseDto } from './member-response.dto';

export class MembersListResponseDto {
  items!: MemberResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
  totalPages!: number;

  constructor(data: MembersListResponseDto) {
    this.items = data.items;
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
    this.totalPages = data.totalPages;
  }
}
