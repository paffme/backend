import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiException } from '../shared/api-exception.model';
import { GetOperationId } from '../shared/utils/get-operation-id.helper';
import { User } from './user.entity';
import { TokenResponseDto } from './dto/token-response.dto';
import { CredentialsDto } from './dto/credentials.dto';
import { RegisterDto } from './dto/register.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { UpdateParamsDto } from './dto/update-params.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from './user-role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../shared/guards/roles.guard';
import { FindByIdParamsDto } from './dto/find-by-id-params.dto';
import { User as GetUser } from '../shared/decorators/user.decorator';

@Controller('users')
@ApiTags(User.constructor.name)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreatedResponse({ type: UserDto })
  @ApiConflictResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Register'))
  async register(@Body() dto: RegisterDto): Promise<UserDto> {
    const newUser = await this.userService.register(dto);
    return this.userService.mapper.map(newUser);
  }

  @Post('token')
  @ApiCreatedResponse({ type: TokenResponseDto })
  @ApiBadRequestResponse({ type: ApiException })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Login'))
  async login(@Body() dto: CredentialsDto): Promise<TokenResponseDto> {
    return this.userService.login(dto);
  }

  @Get(':userId')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'FindById'))
  @ApiParam({ name: 'userId', required: true })
  async findById(@Param() params: FindByIdParamsDto): Promise<UserDto> {
    const user = await this.userService.findUserById(params.userId);
    return this.userService.mapper.map(user);
  }

  @Delete(':userId')
  @HttpCode(204)
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiNoContentResponse({})
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'DeleteById'))
  @ApiParam({ name: 'userId', required: true })
  async deleteById(
    @Param() params: FindByIdParamsDto,
    @GetUser() user,
  ): Promise<void> {
    if (user.role === UserRole.User && user._id.toString() !== params.userId) {
      throw new ForbiddenException('Not you');
    }

    await this.userService.deleteById(params.userId);
  }

  @Patch(':userId')
  @Roles(UserRole.Admin, UserRole.User)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({ type: UserDto })
  @ApiUnprocessableEntityResponse({ type: ApiException })
  @ApiNotFoundResponse({ type: ApiException })
  @ApiOperation(GetOperationId(User.constructor.name, 'Update'))
  @ApiParam({ name: 'userId', required: true })
  async update(
    @Param() params: UpdateParamsDto,
    @Body() dto: UpdateUserDto,
    @GetUser() user,
  ): Promise<UserDto> {
    const updatedUser = await this.userService.updateUser(
      params.userId,
      dto,
      user,
    );

    return this.userService.mapper.map(updatedUser);
  }
}
