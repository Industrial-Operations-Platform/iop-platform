import { ApiProperty } from "@nestjs/swagger";
export class LoginDto {
  @ApiProperty() username!: string;
  @ApiProperty({ writeOnly: true }) password!: string;
}
export class PasswordDto {
  @ApiProperty({ writeOnly: true }) currentPassword!: string;
  @ApiProperty({ writeOnly: true, minLength: 15, maxLength: 128 })
  password!: string;
}
export class NewUserDto {
  @ApiProperty() name!: string;
  @ApiProperty() username!: string;
  @ApiProperty({
    enum: ["administrator", "technician", "task-force", "team-leader"],
  })
  profile!: "administrator" | "technician" | "task-force" | "team-leader";
}
export class ChangeUserDto {
  @ApiProperty() id!: string;
  @ApiProperty({
    enum: ["administrator", "technician", "task-force", "team-leader"],
  })
  profile!: NewUserDto["profile"];
  @ApiProperty() active!: boolean;
}
export class UserProfileDto extends NewUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() active!: boolean;
}
export class CreatedUserDto {
  @ApiProperty({ type: UserProfileDto }) user!: UserProfileDto;
  @ApiProperty() initialPassword!: string;
}
export class SuccessDto {
  @ApiProperty() ok!: boolean;
}

export class RemoveUserDto {
  @ApiProperty() id!: string;
}

export class RenameUserDto {
  @ApiProperty() id!: string;
  @ApiProperty({ minLength: 1, maxLength: 100 }) name!: string;
}
