import { AuthUserDto } from './auth-user.dto';

export class LoginResponseDto {
  accessToken!: string;
  user!: AuthUserDto;

  constructor(data: LoginResponseDto) {
    this.accessToken = data.accessToken;
    this.user = data.user;
  }
}
