import { RemoveUserDto, RenameUserDto } from "./access-contracts";
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { IncomingMessage, ServerResponse } from "node:http";
import { PLATFORM_RUNTIME, PlatformRuntime } from "./runtime";
import { AuthenticationError } from "../modules/authentication/domain/identity";
import { AccessError } from "../modules/users-rbac/domain/profiles";
import { BusinessException } from "./problem-details";
import {
  ChangeUserDto,
  CreatedUserDto,
  LoginDto,
  NewUserDto,
  PasswordDto,
  SuccessDto,
  UserProfileDto,
  UpdateUserDto,
  AccessActivityDto,
} from "./access-contracts";
function bodyFields(body: unknown, fields: string[]): void {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).sort().join() !== fields.sort().join()
  )
    throw new BadRequestException();
}
async function accessOperation<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AuthenticationError)
      throw new BusinessException(
        error.code === "login_throttled"
          ? 429
          : error.code === "invalid_password"
            ? 400
            : error.code === "password_change_required"
              ? 403
              : 401,
        error.code,
      );
    if (error instanceof AccessError)
      throw new BusinessException(
        error.code === "access_denied"
          ? 403
          : error.code === "invalid_user"
            ? 400
            : 409,
        error.code,
      );
    throw error;
  }
}
const clearCookie = (response: ServerResponse) =>
  response.setHeader(
    "Set-Cookie",
    "iop_session=; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=0",
  );
@ApiTags("Local access")
@Controller("api/v1")
export class AccessController {
  constructor(
    @Inject(PLATFORM_RUNTIME) private readonly runtime: PlatformRuntime | null,
  ) {}
  private active(request: IncomingMessage) {
    if (request.url?.includes("?")) throw new BadRequestException();
    if (!this.runtime?.access) throw new ServiceUnavailableException();
    return this.runtime;
  }
  @Post("auth/login")
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async login(
    @Req() req: IncomingMessage,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: ServerResponse,
  ) {
    bodyFields(body, ["username", "password"]);
    const r = this.active(req);
    const token = await accessOperation(() =>
      r.access!.authentication.login(body, r.sessionToken(req)),
    );
    res.setHeader(
      "Set-Cookie",
      `iop_session=${token}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=28800`,
    );
    return { ok: true };
  }
  @Post("auth/password")
  @ApiBody({ type: PasswordDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async password(
    @Req() req: IncomingMessage,
    @Body() body: PasswordDto,
    @Res({ passthrough: true }) res: ServerResponse,
  ) {
    bodyFields(body, ["currentPassword", "password"]);
    const r = this.active(req);
    await accessOperation(() =>
      r.access!.authentication.changePassword(
        r.sessionToken(req),
        body.currentPassword,
        body.password,
      ),
    );
    clearCookie(res);
    return { ok: true };
  }
  @Post("auth/logout")
  @ApiCreatedResponse({ type: SuccessDto })
  async logout(
    @Req() req: IncomingMessage,
    @Res({ passthrough: true }) res: ServerResponse,
  ) {
    const r = this.active(req);
    await accessOperation(() =>
      r.access!.authentication.logout(r.sessionToken(req)),
    );
    clearCookie(res);
    return { ok: true };
  }
  @Get("users")
  @ApiOkResponse({ type: [UserProfileDto] })
  async users(@Req() req: IncomingMessage) {
    const r = this.active(req);
    return accessOperation(async () =>
      r.access!.users.list(await r.actor(req)),
    );
  }
  @Post("users")
  @ApiBody({ type: NewUserDto })
  @ApiCreatedResponse({ type: CreatedUserDto })
  async create(@Req() req: IncomingMessage, @Body() body: NewUserDto) {
    bodyFields(body, ["name", "username", "profile"]);
    const r = this.active(req);
    return accessOperation(async () =>
      r.access!.users.create(await r.actor(req), body),
    );
  }
  @Get("users/activity")
  @ApiOkResponse({ type: [AccessActivityDto] })
  async activity(@Req() req: IncomingMessage) {
    const r = this.active(req);
    return accessOperation(async () =>
      r.access!.users.activity(await r.actor(req)),
    );
  }
  @Post("users/details")
  @ApiBody({ type: UpdateUserDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async update(@Req() req: IncomingMessage, @Body() body: UpdateUserDto) {
    bodyFields(body, ["id", "name", "profile", "active"]);
    const r = this.active(req);
    await accessOperation(async () =>
      r.access!.users.update(await r.actor(req), body),
    );
    return { ok: true };
  }
  @Post("users/access")
  @ApiBody({ type: ChangeUserDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async change(@Req() req: IncomingMessage, @Body() body: ChangeUserDto) {
    bodyFields(body, ["id", "profile", "active"]);
    const r = this.active(req);
    await accessOperation(async () =>
      r.access!.users.change(
        await r.actor(req),
        body.id,
        body.profile,
        body.active,
      ),
    );
    return { ok: true };
  }
  @Post("users/name")
  @ApiBody({ type: RenameUserDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async rename(@Req() req: IncomingMessage, @Body() body: RenameUserDto) {
    bodyFields(body, ["id", "name"]);
    const r = this.active(req);
    await accessOperation(async () =>
      r.access!.users.rename(await r.actor(req), body.id, body.name),
    );
    return { ok: true };
  }
  @Post("users/remove")
  @ApiBody({ type: RemoveUserDto })
  @ApiCreatedResponse({ type: SuccessDto })
  async remove(@Req() req: IncomingMessage, @Body() body: RemoveUserDto) {
    bodyFields(body, ["id"]);
    const r = this.active(req);
    await accessOperation(async () =>
      r.access!.users.remove(await r.actor(req), body.id),
    );
    return { ok: true };
  }
}
