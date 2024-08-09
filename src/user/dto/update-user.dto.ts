export class UpdateUserDto {
  password: string;
  username: string;
  names: string;
  emails: string;
  type: string;
  tags: string[];
  websites: number[];
  transfer: any;
  userId: number;
  confirmPassword: string;
  app: string;
  defaultWebsites: number[];
}
