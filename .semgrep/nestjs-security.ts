// ===================================================================
// 1. nestjs-handler-missing-access-policy
// ===================================================================
@Controller('a')
export class MissingPolicyController {
  // ruleid: nestjs-handler-missing-access-policy
  @Get('x')
  async noPolicyGet() {}

  // ruleid: nestjs-handler-missing-access-policy
  @Docs.foo()
  @HttpCode(200)
  @Post('x')
  async noPolicyPostManyDecorators() {}

  // ruleid: nestjs-handler-missing-access-policy
  @Delete(':id')
  @Roles(RoleSlug.ADMIN)
  async legacyRolesIsNotAPolicy() {}

  // ruleid: nestjs-handler-missing-access-policy
  @UseGuards(ContextFilterGuard)
  @Patch('x')
  async onlyAuxiliaryGuard() {}

  // ruleid: nestjs-handler-missing-access-policy
  @Sse('stream')
  stream() {}

  // ruleid: nestjs-handler-missing-access-policy
  @All('any')
  async catchAll() {}

  // ok: nestjs-handler-missing-access-policy
  @Docs.foo()
  @Protected({ roles: 'authenticated' })
  @Get('y')
  async protectedAbove() {}

  // ok: nestjs-handler-missing-access-policy
  @Get('y')
  @HttpCode(200)
  @Public({ reason: 'public by design' })
  async publicBelow() {}

  // ok: nestjs-handler-missing-access-policy
  @UseGuards(ContextFilterGuard)
  @Post('z')
  @Protected({ roles: [RoleSlug.ADMIN] })
  async protectedWithContextGuard() {}

  // ok: nestjs-handler-missing-access-policy
  @Public({ reason: 'gov flow uses AutenticacaoGovGuard' })
  @UseGuards(AutenticacaoGovGuard)
  @Get('loginRedirect')
  async loginRedirect() {}

  // Not an HTTP handler: no rule.
  // ok: nestjs-handler-missing-access-policy
  helper() {}
}

// ok: nestjs-handler-missing-access-policy
@Protected({ roles: 'authenticated' })
@Controller('b')
export class ClassProtectedFirst {
  @Get('x')
  async x() {}
}

@Controller('c')
@UseInterceptors(Foo)
@Protected({ roles: [RoleSlug.ADMIN] })
export class ClassProtectedAfterController {
  // ok: nestjs-handler-missing-access-policy
  @Get('x')
  async x() {}
}

@Public({ reason: 'public by design' })
@Controller('d')
@UseInterceptors(Foo)
export class ClassPublic {
  // ok: nestjs-handler-missing-access-policy
  @Get('x')
  async x() {}
}

@Controller('e')
export class ClassWithoutPolicy {
  // ruleid: nestjs-handler-missing-access-policy
  @Get('x')
  async x() {}
}

// ===================================================================
// 2. nestjs-direct-useguards
// ===================================================================
@Controller('g')
@Protected({ roles: 'authenticated' })
// ruleid: nestjs-direct-useguards
@UseGuards(JwtAuthGuard, RolesGuard, FgaGuard)
export class DirectGuardsClass {
  // ruleid: nestjs-direct-useguards
  @UseGuards(JwtAuthGuard)
  @Get('x')
  async jwtOnly() {}

  // ruleid: nestjs-direct-useguards
  @UseGuards(AuthGuard('jwt'))
  @Get('x')
  async passportInline() {}

  // ruleid: nestjs-direct-useguards
  @UseGuards(ContextFilterGuard, RolesGuard)
  @Get('x')
  async mixedAllowedAndForbidden() {}

  // ok: nestjs-direct-useguards
  @UseGuards(ContextFilterGuard)
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get('x')
  async contextFilter() {}

  // ok: nestjs-direct-useguards
  @UseGuards(DestructionChallengeGuard)
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Delete('x')
  async destructionChallenge() {}

  // ok: nestjs-direct-useguards
  @UseGuards(AutenticacaoGovGuard)
  @Public({ reason: 'gov flow uses AutenticacaoGovGuard' })
  @Get('x')
  async govGuard() {}
}

// ===================================================================
// 3. nestjs-protected-and-public-conflict
// ===================================================================
// ruleid: nestjs-protected-and-public-conflict
@Controller('h')
@Public({ reason: 'public by design' })
@Protected({ roles: 'authenticated' })
export class ConflictClass {
  // ruleid: nestjs-protected-and-public-conflict
  @Public({ reason: 'public by design' })
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get('x')
  async both() {}

  // ok: nestjs-protected-and-public-conflict
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get('y')
  async onlyProtected() {}
}

// ===================================================================
// 4. nestjs-interceptor-pii-leak (taint)
// ===================================================================
@Injectable()
export class LeakyInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, body } = request;

    // ruleid: nestjs-interceptor-pii-leak
    this.logger.log(JSON.stringify(request.body));
    // ruleid: nestjs-interceptor-pii-leak
    console.log(request.user);
    // ruleid: nestjs-interceptor-pii-leak
    this.logger.log(`user ${user.email}`);
    // ruleid: nestjs-interceptor-pii-leak
    this.logger.warn({ auth: request.headers.authorization });
    // ruleid: nestjs-interceptor-pii-leak
    this.logger.debug(body);

    return next.handle().pipe(
      tap((data) => {
        // ruleid: nestjs-interceptor-pii-leak
        this.logger.log(JSON.stringify(data));
      }),
      map((payload) => {
        // ruleid: nestjs-interceptor-pii-leak
        span.setAttribute('response', payload);
        return payload;
      }),
    );
  }
}

@Injectable()
export class SafeInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, user } = request;
    const started = Date.now();
    const buildLog = (status: number) => ({
      method,
      status,
      user: user?.id ?? 'anonymous',
      durationMs: Date.now() - started,
    });

    // ok: nestjs-interceptor-pii-leak
    this.logger.log(request.user.id);
    // ok: nestjs-interceptor-pii-leak
    this.logger.log(`${method} ${request.originalUrl}`);

    return next.handle().pipe(
      tap({
        next: () => {
          // ok: nestjs-interceptor-pii-leak
          this.logger.log(JSON.stringify(buildLog(200)));
        },
      }),
    );
  }
}

// Same calls outside an interceptor are out of scope for this rule.
@Injectable()
export class NotAnInterceptor {
  handle(request: any) {
    // ok: nestjs-interceptor-pii-leak
    console.log(request.body);
  }
}

// ===================================================================
// 5. nestjs-idor-unscoped-resource-id (taint, heuristic)
// ===================================================================
@Controller('i')
export class IdorController {
  @Protected({ roles: 'authenticated' })
  @Get('item')
  async byId(@Param('id', ParseIntPipe) id: number) {
    // ruleid: nestjs-idor-unscoped-resource-id
    return this.itemService.findById(id);
  }

  @Protected({ roles: 'authenticated' })
  @Delete()
  async byBody(@Body() dto: DeleteDto) {
    // ruleid: nestjs-idor-unscoped-resource-id
    return this.itemRepository.delete(dto.ids);
  }

  @Protected({ roles: 'authenticated' })
  @Get('by-code')
  async byCode(@Query('code') code: string) {
    // ruleid: nestjs-idor-unscoped-resource-id
    return this.itemService.findByCode(code);
  }

  @Protected({
    roles: [RoleSlug.ADMIN],
    fga: { objectType: 'website', action: 'can_view', resourceIdResolver: (ctx) => ctx.params.id },
  })
  @Get('item')
  async withFga(@Param('id', ParseIntPipe) id: number) {
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findById(id);
  }

  // Admin-only handlers are excluded from this rule.
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get('admin-item')
  async adminExcluded(@Param('id', ParseIntPipe) id: number) {
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findById(id);
  }

  @Protected({ roles: 'authenticated' })
  @Get('item')
  async withSecurityContext(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const securityContext = { user };
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findById(securityContext, id);
  }

  @Public({ reason: 'public by design' })
  @Get('item')
  async publicRead(@Param('id', ParseIntPipe) id: number) {
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findPublic(id);
  }

  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get()
  async noRequestInput() {
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findAll();
  }
}

@Public({ reason: 'public by design' })
@Controller('l')
export class PublicClassIdor {
  @Get('item')
  async read(@Param('id', ParseIntPipe) id: number) {
    // ok: nestjs-idor-unscoped-resource-id
    return this.itemService.findPublic(id);
  }
}

// Parameter name does not look like an identifier: not a taint source.
@Controller('m')
export class NonIdParamIdorController {
  @Protected({ roles: 'authenticated' })
  @Post(':queueName/cancel')
  async cancel(@Param('queueName') queueName: string) {
    // ok: nestjs-idor-unscoped-resource-id
    return this.queueService.cancel(queueName);
  }
}

// ===================================================================
// 6. nestjs-parameterized-route-missing-fga
// ===================================================================
@Controller('j')
export class ParamRouteController {
  // ruleid: nestjs-parameterized-route-missing-fga
  @Protected({ roles: 'authenticated' })
  @Get(':id')
  async authenticatedNoFga() {}

  // ruleid: nestjs-parameterized-route-missing-fga
  @Protected({ roles: 'authenticated' })
  @Delete(':websiteId')
  async authenticatedNoFgaCompositeId() {}

  // ok: nestjs-parameterized-route-missing-fga
  @Protected({ roles: 'authenticated', fga: AMS_ROLE_VIEWER })
  @Get(':id')
  async nonAdminWithFga() {}

  // Admin roles are excluded from this rule.
  // ok: nestjs-parameterized-route-missing-fga
  @Protected({ roles: [RoleSlug.ADMIN] })
  @Get(':id')
  async adminNoFga() {}

  // ok: nestjs-parameterized-route-missing-fga
  @Protected({ roles: [RoleSlug.ADMIN], fga: AMS_ROLE_VIEWER })
  @Get(':id')
  async adminWithFga() {}

  // ok: nestjs-parameterized-route-missing-fga
  @Protected({ roles: 'authenticated' })
  @Get('list')
  async noParam() {}

  // Path parameter is not an id.
  // ok: nestjs-parameterized-route-missing-fga
  @Protected({ roles: 'authenticated' })
  @Post(':queueName/cancel')
  async nonIdParam() {}
}

// ===================================================================
// 7. nestjs-avoid-any-return-in-controller
// ===================================================================
@Controller('k')
export class AnyReturnController {
  // ruleid: nestjs-avoid-any-return-in-controller
  async anyPromise(): Promise<any> {}

  // ruleid: nestjs-avoid-any-return-in-controller
  anyPlain(): any {}

  // ok: nestjs-avoid-any-return-in-controller
  async typed(): Promise<ItemDto> {}

  // ok: nestjs-avoid-any-return-in-controller
  async noContent(): Promise<void> {}

  // ok: nestjs-avoid-any-return-in-controller
  async withoutReturnType() {}
}

// ===================================================================
// 8. nestjs-dto-property-missing-validator
// ===================================================================
export class InvalidCreateUserDto {
  @IsString()
  name: string;

  // ruleid: nestjs-dto-property-missing-validator
  role: string;

  // ruleid: nestjs-dto-property-missing-validator
  nickname?: string;

  // ruleid: nestjs-dto-property-missing-validator
  email!: string;
}

export class ValidCreateUserDto {
  // ok: nestjs-dto-property-missing-validator
  @IsString()
  name: string;

  // ok: nestjs-dto-property-missing-validator
  @IsInt()
  age: number;

  // ok: nestjs-dto-property-missing-validator
  @IsOptional()
  @IsString()
  nickname?: string;

  // ok: nestjs-dto-property-missing-validator
  helperMethod() {
    return this.name;
  }
}

// Response DTOs are not validated input.
// ok: nestjs-dto-property-missing-validator
export class UserResponseDto {
  id: number;
  name: string;
}

// Not a DTO by name.
// ok: nestjs-dto-property-missing-validator
export class UserEntity {
  id: number;
  name: string;
}

// ===================================================================
// 9. nestjs-controller-untyped-input
// ===================================================================
@Controller('untyped')
@Protected({ roles: 'authenticated' })
export class UntypedInputController {
  // ruleid: nestjs-controller-untyped-input
  @Post('raw')
  async rawBody(@Body() body: any) {}

  // ruleid: nestjs-controller-untyped-input
  @Post('raw-string')
  async stringBody(@Body() body: string) {}

  // ruleid: nestjs-controller-untyped-input
  @Post('raw-record')
  async recordBody(@Body() body: Record<string, unknown>) {}

  // ruleid: nestjs-controller-untyped-input
  @Post('raw-array')
  async arrayBody(@Body() items: ValidCreateUserDto[]) {}

  // ruleid: nestjs-controller-untyped-input
  @Get('search')
  async rawQuery(@Query() q: any) {}

  // ruleid: nestjs-controller-untyped-input
  @Get('raw-param/:id')
  async rawParam(@Param('id') id: any) {}

  // ok: nestjs-controller-untyped-input
  @Get('search-str')
  async stringQuery(@Query('q') q: string) {}

  // ok: nestjs-controller-untyped-input
  @Get('search-dto')
  async dtoQuery(@Query() query: ListQueryDto) {}

  // ok: nestjs-controller-untyped-input
  @Post('typed')
  async typedDto(@Body() dto: ValidCreateUserDto) {}

  // ok: nestjs-controller-untyped-input
  @Post('piped-body')
  async pipedBody(@Body('name', new TrimPipe()) name: string) {}

  // ok: nestjs-controller-untyped-input
  @Post('piped-array')
  async pipedArray(
    @Body(new ParseArrayPipe({ items: ValidCreateUserDto })) items: ValidCreateUserDto[],
  ) {}

  // ok: nestjs-controller-untyped-input
  @Get(':id')
  async pipedParam(@Param('id', ParseIntPipe) id: number) {}

  // ok: nestjs-controller-untyped-input
  @Get('slug/:slug')
  async stringParam(@Param('slug') slug: string) {}
}

// ===================================================================
// 10. nestjs-raw-sql-string-interpolation
// ===================================================================
@Injectable()
export class RawSqlService {
  constructor(
    private readonly db: DataSource,
    private readonly manager: EntityManager,
    private readonly clickhouse: ClickHouseClient,
  ) {}

  async unsafePostgres(name: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return this.db.query(`SELECT * FROM users WHERE name = '${name}'`);
  }

  async unsafePostgresWithParams(name: string, id: number) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return this.db.query(`SELECT * FROM ${name} WHERE id = $1`, [id]);
  }

  async unsafeEntityManager(name: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return this.manager.query(`SELECT * FROM users WHERE name = '${name}'`);
  }

  async unsafeQueryRunner(queryRunner: QueryRunner, name: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return queryRunner.query(`DELETE FROM users WHERE name = '${name}'`);
  }

  async unsafeClickhouseQuery(table: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return this.clickhouse.query({ query: `SELECT * FROM ${table}`, format: 'JSONEachRow' });
  }

  async unsafeClickhouseCommand(table: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    return this.clickhouse.command({ query: `TRUNCATE TABLE ${table}` });
  }

  unsafeQueryBuilder(qb: SelectQueryBuilder<User>, name: string, email: string, role: string) {
    // ruleid: nestjs-raw-sql-string-interpolation
    qb.where(`user.name = '${name}'`);
    // ruleid: nestjs-raw-sql-string-interpolation
    qb.andWhere(`user.email = '${email}'`);
    // ruleid: nestjs-raw-sql-string-interpolation
    qb.orWhere(`user.role = '${role}'`);
  }

  async safePostgres(name: string) {
    // ok: nestjs-raw-sql-string-interpolation
    return this.db.query('SELECT * FROM users WHERE name = $1', [name]);
  }

  async safeEntityManager(name: string) {
    // ok: nestjs-raw-sql-string-interpolation
    return this.manager.query('SELECT * FROM users WHERE name = $1', [name]);
  }

  async safeTemplateWithoutInterpolation() {
    // ok: nestjs-raw-sql-string-interpolation
    return this.db.query(`SELECT 1`);
  }

  async safeClickhouse(id: number) {
    // ok: nestjs-raw-sql-string-interpolation
    return this.clickhouse.query({
      query: 'SELECT * FROM events WHERE id = {id:UInt32}',
      query_params: { id },
    });
  }

  safeQueryBuilder(qb: SelectQueryBuilder<User>, name: string) {
    // ok: nestjs-raw-sql-string-interpolation
    qb.where('user.name = :name', { name });
  }

  logsAreNotSql(id: number) {
    // ok: nestjs-raw-sql-string-interpolation
    this.logger.log(`processing ${id}`);
  }
}

// ===================================================================
// 11. nestjs-worker-unvalidated-job-data
// ===================================================================
@Processor('evaluation')
export class UnsafeEvaluationWorker extends WorkerHost {
  constructor(private readonly evaluatorService: EvaluatorService) {
    super();
  }

  async process(job: Job) {
    // ruleid: nestjs-worker-unvalidated-job-data
    await this.evaluatorService.run(job.data);

    // ruleid: nestjs-worker-unvalidated-job-data
    await this.evaluatorService.run({ url: job.data.url });

    // ruleid: nestjs-worker-unvalidated-job-data
    const url = job.data.url;
  }

  // Event handlers are excluded from this rule.
  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    // ok: nestjs-worker-unvalidated-job-data
    this.logger.error(job.data.id);
  }
}

@Processor('evaluation-safe')
export class SafeEvaluationWorker extends WorkerHost {
  constructor(private readonly evaluatorService: EvaluatorService) {
    super();
  }

  async process(job: Job) {
    const payload = EvaluationJobSchema.parse(job.data);
    // ok: nestjs-worker-unvalidated-job-data
    await this.evaluatorService.run(payload);
  }
}

@Processor('evaluation-safe-parse')
export class SafeParseEvaluationWorker extends WorkerHost {
  constructor(private readonly evaluatorService: EvaluatorService) {
    super();
  }

  async process(job: Job) {
    const result = EvaluationJobSchema.safeParse(job.data);
    if (!result.success) {
      return;
    }
    // ok: nestjs-worker-unvalidated-job-data
    await this.evaluatorService.run(result.data);
  }
}

// Not a BullMQ worker: out of scope for this rule.
export class NotAWorker {
  constructor(private readonly evaluatorService: EvaluatorService) {}

  async process(job: Job) {
    // ok: nestjs-worker-unvalidated-job-data
    await this.evaluatorService.run(job.data);
  }
}
