import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
