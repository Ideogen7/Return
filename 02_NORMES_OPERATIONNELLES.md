# 02_NORMES_OPERATIONNELLES.md
**Return ↺ - Standards de Développement & Qualité**

---

## 1. Principes de Développement (The Golden Rules)

### 1.1 Application des Principes SOLID

L'architecture **Monolithe Modulaire avec NestJS** impose le respect strict des principes SOLID. Voici leur application concrète dans le contexte du projet Return :

---

#### **S - Single Responsibility Principle (SRP)**

**Définition** : Une classe ne doit avoir qu'une seule raison de changer.

**Application dans Return :**  
Dans le module **Loans**, chaque service a une responsabilité unique :

```typescript
// ❌ MAUVAIS : Service God-Object avec multiples responsabilités
@Injectable()
export class LoanService {
  createLoan(data: CreateLoanDto) { /* ... */ }
  sendReminderEmail(loanId: string) { /* ... */ }
  uploadPhoto(file: File) { /* ... */ }
  calculateStatistics() { /* ... */ }
}

// ✅ BON : Responsabilités isolées
@Injectable()
export class LoanService {
  constructor(
    private readonly loanRepository: LoanRepository,
    private readonly eventBus: EventBus,
  ) {}

  async createLoan(data: CreateLoanDto): Promise<Loan> {
    const loan = Loan.create(data); // Domain logic
    await this.loanRepository.save(loan);
    
    // Publier un événement au lieu de gérer directement le rappel
    this.eventBus.publish(new LoanCreatedEvent(loan.id));
    
    return loan;
  }
}

// Service dédié aux rappels (séparation)
@Injectable()
export class ReminderService {
  @OnEvent('loan.created')
  async handleLoanCreated(event: LoanCreatedEvent) {
    await this.scheduleReminder(event.loanId);
  }
}

// Service dédié au stockage (séparation)
@Injectable()
export class PhotoStorageService {
  async uploadPhoto(file: File, loanId: string): Promise<string> {
    return this.s3Client.upload(file, `loans/${loanId}/photo.jpg`);
  }
}
```

**Bénéfices :**
- Chaque service peut être testé indépendamment
- Changement dans la logique de rappel n'impacte pas la création de prêt
- Remplacement du stockage (S3 → Cloudflare R2) sans toucher au domaine

---

#### **O - Open/Closed Principle (OCP)**

**Définition** : Ouvert à l'extension, fermé à la modification.

**Application dans Return :**  
Le système de **notifications** doit supporter plusieurs canaux (push, email, SMS) sans modifier le code existant :

```typescript
// Interface abstraite (fermée à la modification)
export interface NotificationChannel {
  send(recipient: string, message: NotificationMessage): Promise<void>;
  supports(channelType: ChannelType): boolean;
}

// Implémentation initiale (V1)
@Injectable()
export class PushNotificationChannel implements NotificationChannel {
  constructor(private readonly fcm: FirebaseMessaging) {}

  async send(recipient: string, message: NotificationMessage): Promise<void> {
    await this.fcm.send({
      token: recipient,
      notification: { title: message.title, body: message.body },
    });
  }

  supports(channelType: ChannelType): boolean {
    return channelType === ChannelType.PUSH;
  }
}

// Extension pour V2 (nouveau canal) sans modifier l'existant
@Injectable()
export class EmailNotificationChannel implements NotificationChannel {
  constructor(private readonly mailService: MailService) {}

  async send(recipient: string, message: NotificationMessage): Promise<void> {
    await this.mailService.sendEmail({
      to: recipient,
      subject: message.title,
      html: message.body,
    });
  }

  supports(channelType: ChannelType): boolean {
    return channelType === ChannelType.EMAIL;
  }
}

// Orchestrateur (Strategy Pattern)
@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATION_CHANNELS')
    private readonly channels: NotificationChannel[],
  ) {}

  async notify(recipient: string, channelType: ChannelType, message: NotificationMessage) {
    const channel = this.channels.find(c => c.supports(channelType));
    if (!channel) throw new UnsupportedChannelException(channelType);
    
    await channel.send(recipient, message);
  }
}
```

**Bénéfices :**
- Ajout de SMS (Twilio) en créant `SmsNotificationChannel` sans toucher au code existant
- Tests unitaires isolés par canal
- Possibilité de désactiver un canal en production sans code change (injection de dépendances)

---

#### **L - Liskov Substitution Principle (LSP)**

**Définition** : Les sous-types doivent être substituables à leurs types de base sans altérer le comportement.

**Application dans Return :**  
Le système de **stockage de photos** doit permettre de changer de provider (S3 → R2) sans casser l'application :

```typescript
// Interface abstraite garantissant le contrat
export interface PhotoStorage {
  upload(file: Buffer, key: string): Promise<string>; // Retourne l'URL
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}

// Implémentation S3
@Injectable()
export class S3PhotoStorage implements PhotoStorage {
  async upload(file: Buffer, key: string): Promise<string> {
    await this.s3.putObject({ Bucket: 'return-photos', Key: key, Body: file });
    return `https://s3.amazonaws.com/return-photos/${key}`;
  }
  // ...
}

// Implémentation Cloudflare R2 (substituable)
@Injectable()
export class R2PhotoStorage implements PhotoStorage {
  async upload(file: Buffer, key: string): Promise<string> {
    // Même signature, comportement équivalent
    await this.r2.put(key, file);
    return `https://photos.return.app/${key}`;
  }
  // ...
}

// Service métier ne connaît que l'interface
@Injectable()
export class LoanPhotoService {
  constructor(
    @Inject('PHOTO_STORAGE') private readonly storage: PhotoStorage,
  ) {}

  async attachPhoto(loanId: string, file: Buffer): Promise<string> {
    const key = `loans/${loanId}/${Date.now()}.jpg`;
    const url = await this.storage.upload(file, key);
    // Peu importe l'implémentation (S3 ou R2), le contrat est respecté
    return url;
  }
}
```

---

#### **I - Interface Segregation Principle (ISP)**

**Définition** : Aucun client ne doit dépendre de méthodes qu'il n'utilise pas.

**Application dans Return :**  
Le module **Reminders** expose différentes interfaces selon les besoins :

```typescript
// ❌ MAUVAIS : Interface fourre-tout
interface ReminderManager {
  scheduleReminder(loanId: string, date: Date): Promise<void>;
  cancelReminder(reminderId: string): Promise<void>;
  getUpcomingReminders(): Promise<Reminder[]>;
  sendManualReminder(loanId: string, message: string): Promise<void>;
  retryFailedReminders(): Promise<void>; // Seul le worker en a besoin
}

// ✅ BON : Interfaces ségrégées
interface ReminderScheduler {
  schedule(loanId: string, date: Date): Promise<void>;
  cancel(reminderId: string): Promise<void>;
}

interface ReminderQuery {
  getUpcomingReminders(userId: string): Promise<Reminder[]>;
}

interface ManualReminderSender {
  sendNow(loanId: string, message: string): Promise<void>;
}

// Le LoanService n'a besoin que de la planification
@Injectable()
export class LoanService {
  constructor(private readonly scheduler: ReminderScheduler) {}

  async createLoan(data: CreateLoanDto) {
    const loan = await this.repository.save(data);
    await this.scheduler.schedule(loan.id, loan.returnDate);
  }
}

// Le worker a besoin de la logique de retry
@Injectable()
export class ReminderWorker {
  constructor(
    private readonly scheduler: ReminderScheduler,
    private readonly failureHandler: ReminderFailureHandler, // Interface dédiée
  ) {}

  @Cron('0 * * * *')
  async processFailedReminders() {
    await this.failureHandler.retryFailed();
  }
}
```

---

#### **D - Dependency Inversion Principle (DIP)**

**Définition** : Dépendre d'abstractions, pas d'implémentations concrètes.

**Application dans Return :**  
Le module **Loans** ne doit jamais dépendre directement de Prisma ou PostgreSQL :

```typescript
// ❌ MAUVAIS : Dépendance directe à Prisma
@Injectable()
export class LoanService {
  constructor(private readonly prisma: PrismaService) {} // Couplage fort

  async findLoanById(id: string): Promise<Loan> {
    const loanData = await this.prisma.loan.findUnique({ where: { id } });
    return loanData; // Retourne un type Prisma, pas un domain object
  }
}

// ✅ BON : Dépendance à une abstraction
export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  save(loan: Loan): Promise<Loan>;
  findActiveLoansByLender(lenderId: string): Promise<Loan[]>;
}

// Le service métier dépend de l'interface (abstraction)
@Injectable()
export class LoanService {
  constructor(
    private readonly loanRepository: LoanRepository, // Inversion de dépendance
  ) {}

  async findLoanById(id: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(id);
    if (!loan) throw new LoanNotFoundException(id);
    return loan; // Retourne un objet du domaine
  }
}

// Implémentation concrète dans la couche infrastructure
@Injectable()
export class PrismaLoanRepository implements LoanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Loan | null> {
    const data = await this.prisma.loan.findUnique({
      where: { id },
      include: { item: true, borrower: true },
    });
    return data ? LoanMapper.toDomain(data) : null;
  }

  async save(loan: Loan): Promise<Loan> {
    const data = LoanMapper.toPersistence(loan);
    const saved = await this.prisma.loan.create({ data });
    return LoanMapper.toDomain(saved);
  }
}
```

**Bénéfices :**
- Tests unitaires avec un `InMemoryLoanRepository` sans base de données
- Migration Prisma → TypeORM en changeant uniquement l'implémentation
- Le domaine métier reste pur (pas de dépendance à Prisma)

---

### 1.2 Design Patterns Imposés

#### **Repository Pattern** (Accès aux données)

**Obligatoire** pour toute interaction avec la base de données. Chaque agrégat du domaine a son repository :

```typescript
// Contrat du repository
export interface LoanRepository {
  findById(id: string): Promise<Loan | null>;
  save(loan: Loan): Promise<Loan>;
  delete(id: string): Promise<void>;
}

// Le service métier ne connaît que le contrat
@Injectable()
export class LoanService {
  constructor(private readonly loanRepository: LoanRepository) {}
}
```

#### **Factory Pattern** (Objets complexes)

**Obligatoire** pour la création d'entités avec logique de validation :

```typescript
// Factory pour créer un prêt avec ses règles métier
export class LoanFactory {
  static create(data: CreateLoanDto): Loan {
    // Validation métier
    if (data.returnDate && data.returnDate < new Date()) {
      throw new InvalidReturnDateException('Return date must be in the future');
    }

    return new Loan({
      id: uuidv4(),
      item: ItemFactory.create(data.item),
      borrower: data.borrower,
      lender: data.lender,
      returnDate: data.returnDate,
      status: LoanStatus.PENDING_CONFIRMATION,
      createdAt: new Date(),
    });
  }
}
```

#### **Strategy Pattern** (Algorithmes interchangeables)

**Recommandé** pour les rappels (politiques de relance) :

```typescript
interface ReminderStrategy {
  calculateReminderDates(loan: Loan): Date[];
}

class StandardReminderStrategy implements ReminderStrategy {
  calculateReminderDates(loan: Loan): Date[] {
    const returnDate = loan.returnDate;
    return [
      subDays(returnDate, 3),  // J-3
      addDays(returnDate, 3),  // J+3
      addDays(returnDate, 10), // J+10
      addDays(returnDate, 17), // J+17
    ];
  }
}

class UrgentReminderStrategy implements ReminderStrategy {
  calculateReminderDates(loan: Loan): Date[] {
    return [
      subDays(loan.returnDate, 1), // J-1
      loan.returnDate,             // J-day
      addDays(loan.returnDate, 1), // J+1
    ];
  }
}
```

#### **Observer Pattern / Event-Driven** (Couplage faible)

**Obligatoire** pour la communication inter-modules :

```typescript
// Événement domaine
export class LoanCreatedEvent {
  constructor(public readonly loanId: string, public readonly lenderId: string) {}
}

// Émetteur
@Injectable()
export class LoanService {
  constructor(private readonly eventBus: EventBus) {}

  async createLoan(data: CreateLoanDto): Promise<Loan> {
    const loan = await this.repository.save(LoanFactory.create(data));
    this.eventBus.publish(new LoanCreatedEvent(loan.id, loan.lenderId));
    return loan;
  }
}

// Listeners découplés
@Injectable()
export class ReminderService {
  @OnEvent('loan.created')
  async handleLoanCreated(event: LoanCreatedEvent) {
    await this.scheduleReminders(event.loanId);
  }
}

@Injectable()
export class AnalyticsService {
  @OnEvent('loan.created')
  async trackLoanCreation(event: LoanCreatedEvent) {
    await this.analytics.track('loan_created', { userId: event.lenderId });
  }
}
```

---

## 2. Stratégie de Test (TDD Workflow)

### 2.1 Stack de Test

| Couche | Framework | Usage |
|--------|-----------|-------|
| **Backend - Unit Tests** | Jest | Tests isolés des services, factories, value objects |
| **Backend - Integration Tests** | Jest + Testcontainers | Tests avec PostgreSQL et Redis réels |
| **Backend - E2E Tests** | Jest + Supertest | Tests des endpoints API |
| **Frontend - Unit Tests** | Jest + React Native Testing Library | Tests des composants React |
| **Frontend - E2E Tests** | Detox | Tests de navigation et workflows complets |
| **API Contract Tests** | Pact | Tests de contrats entre mobile et API |

### 2.2 Cycle TDD Strict

**RÈGLE D'OR** : Aucun code de production ne doit être écrit sans test préalable qui échoue.

```
┌─────────────────────────────────────────────┐
│  RED → GREEN → REFACTOR → COMMIT           │
└─────────────────────────────────────────────┘

1. RED (30s-2min)   : Écrire le test qui échoue (compilation ou assertion)
2. GREEN (2-5min)   : Écrire le code MINIMAL pour passer le test
3. REFACTOR (3-10min) : Améliorer le code sans changer le comportement
4. COMMIT           : git commit avec message conventionnel
```

#### Exemple Concret : Création d'un Prêt

**STEP 1 : RED (Test qui échoue)**

```typescript
// loan.service.spec.ts
describe('LoanService', () => {
  describe('createLoan', () => {
    it('should create a loan with PENDING_CONFIRMATION status', async () => {
      // Arrange
      const mockRepository = {
        save: jest.fn().mockResolvedValue(mockLoan),
      };
      const service = new LoanService(mockRepository as any);
      const dto: CreateLoanDto = {
        itemName: 'Perceuse Bosch',
        borrowerId: 'user-123',
        lenderId: 'user-456',
        returnDate: new Date('2026-03-01'),
      };

      // Act
      const result = await service.createLoan(dto);

      // Assert
      expect(result.status).toBe(LoanStatus.PENDING_CONFIRMATION);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

// ❌ Test échoue : LoanService.createLoan() n'existe pas encore
```

**STEP 2 : GREEN (Code minimal)**

```typescript
// loan.service.ts
@Injectable()
export class LoanService {
  constructor(private readonly repository: LoanRepository) {}

  async createLoan(dto: CreateLoanDto): Promise<Loan> {
    const loan = {
      id: uuidv4(),
      itemName: dto.itemName,
      borrowerId: dto.borrowerId,
      lenderId: dto.lenderId,
      returnDate: dto.returnDate,
      status: LoanStatus.PENDING_CONFIRMATION, // Hard-codé pour passer le test
      createdAt: new Date(),
    };
    return this.repository.save(loan);
  }
}

// ✅ Test passe maintenant
```

**STEP 3 : REFACTOR (Amélioration)**

```typescript
// loan.service.ts (après refactoring)
@Injectable()
export class LoanService {
  constructor(
    private readonly repository: LoanRepository,
    private readonly factory: LoanFactory, // Extraction de la logique de création
  ) {}

  async createLoan(dto: CreateLoanDto): Promise<Loan> {
    const loan = this.factory.create(dto); // Logique métier déplacée
    return this.repository.save(loan);
  }
}

// loan.factory.ts (nouvelle classe)
export class LoanFactory {
  static create(dto: CreateLoanDto): Loan {
    return {
      id: uuidv4(),
      itemName: dto.itemName,
      borrowerId: dto.borrowerId,
      lenderId: dto.lenderId,
      returnDate: dto.returnDate,
      status: LoanStatus.PENDING_CONFIRMATION,
      createdAt: new Date(),
    };
  }
}

// ✅ Tests passent toujours (comportement identique)
```

**STEP 4 : COMMIT**

```bash
git add loan.service.ts loan.service.spec.ts loan.factory.ts
git commit -m "feat(loans): add loan creation with pending confirmation status

- Implement LoanService.createLoan() with factory pattern
- Extract creation logic to LoanFactory for testability
- Tests: 1 passing (loan.service.spec.ts)

Refs: #12"
```

---

### 2.3 Structure des Tests (Pattern AAA)

**Obligatoire** : Tous les tests doivent suivre le pattern **Arrange-Act-Assert** :

```typescript
describe('ReminderService', () => {
  describe('scheduleReminder', () => {
    it('should schedule 4 reminders for a standard loan', async () => {
      // ========== ARRANGE ==========
      // Configuration de l'environnement de test
      const mockQueue = {
        add: jest.fn().mockResolvedValue({}),
      };
      const service = new ReminderService(mockQueue as any);
      const loan: Loan = {
        id: 'loan-123',
        returnDate: new Date('2026-03-15'),
        status: LoanStatus.ACTIVE,
        // ...
      };

      // ========== ACT ==========
      // Exécution de l'action testée
      await service.scheduleReminder(loan);

      // ========== ASSERT ==========
      // Vérification des résultats attendus
      expect(mockQueue.add).toHaveBeenCalledTimes(4);
      expect(mockQueue.add).toHaveBeenNthCalledWith(1, 'send-reminder', {
        loanId: 'loan-123',
        scheduledFor: new Date('2026-03-12'), // J-3
      });
      // ...
    });
  });
});
```

**Règles supplémentaires :**
- **1 test = 1 assertion logique** (sauf cas de vérification d'objet complexe)
- **Pas de logique conditionnelle dans les tests** (if/for/while)
- **Noms de tests explicites** : `should [comportement attendu] when [condition]`
- **Tests isolés** : Aucun test ne doit dépendre de l'exécution d'un autre

---

### 2.4 Couverture de Code Minimale

| Couche | Couverture Minimale | Seuil CI/CD |
|--------|---------------------|-------------|
| **Domain Logic** (Entities, Value Objects) | 100% | ❌ Bloque le merge si < 100% |
| **Services** (Use Cases) | 90% | ❌ Bloque si < 85% |
| **Repositories** (Implémentations) | 80% | ⚠️ Warning si < 75% |
| **Controllers** (Endpoints) | 70% | ⚠️ Warning si < 60% |
| **DTOs / Mappers** | 60% | ℹ️ Info seulement |

**Configuration Jest** :

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 85,
        "lines": 85,
        "statements": 85
      },
      "./src/domain/**/*.ts": {
        "branches": 100,
        "functions": 100,
        "lines": 100,
        "statements": 100
      }
    }
  }
}
```

---

## 3. Gestion des Erreurs & Logs (Standardisation)

### 3.1 Standard RFC 7807 (Problem Details for HTTP APIs)

**OBLIGATOIRE** : Toutes les réponses d'erreur API doivent respecter le RFC 7807.

#### Structure JSON Standardisée

```json
{
  "type": "https://api.return.app/errors/loan-not-found",
  "title": "Loan Not Found",
  "status": 404,
  "detail": "The loan with ID 'loan-123' does not exist or you don't have access to it.",
  "instance": "/api/v1/loans/loan-123",
  "timestamp": "2026-02-08T14:32:00Z",
  "requestId": "req-7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d",
  "errors": [ 
    {
      "field": "loanId",
      "code": "NOT_FOUND",
      "message": "Loan does not exist"
    }
  ]
}
```

#### Implémentation NestJS

```typescript
// common/exceptions/problem-details.exception.ts
export class ProblemDetailsException extends HttpException {
  constructor(
    status: HttpStatus,
    type: string,
    title: string,
    detail: string,
    instance: string,
    errors?: ErrorDetail[],
  ) {
    const problemDetails = {
      type: `https://api.return.app/errors/${type}`,
      title,
      status,
      detail,
      instance,
      timestamp: new Date().toISOString(),
      requestId: RequestContext.getCurrentRequestId(), // Thread-local context
      errors,
    };
    super(problemDetails, status);
  }
}

// Exemple d'usage
export class LoanNotFoundException extends ProblemDetailsException {
  constructor(loanId: string, path: string) {
    super(
      HttpStatus.NOT_FOUND,
      'loan-not-found',
      'Loan Not Found',
      `The loan with ID '${loanId}' does not exist or you don't have access to it.`,
      path,
      [{ field: 'loanId', code: 'NOT_FOUND', message: 'Loan does not exist' }],
    );
  }
}

// Filter global pour capturer toutes les exceptions
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Si c'est une ProblemDetailsException, retourner tel quel
    if (exception instanceof ProblemDetailsException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

    // Sinon, wrapper dans un format RFC 7807 générique
    const status = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      type: 'https://api.return.app/errors/internal-server-error',
      title: 'Internal Server Error',
      status,
      detail: exception.message || 'An unexpected error occurred',
      instance: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.id,
    });
  }
}
```

#### Exemples d'Erreurs Standardisées

```typescript
// Validation Error (400)
throw new ValidationException([
  { field: 'returnDate', code: 'INVALID_DATE', message: 'Return date must be in the future' },
  { field: 'itemName', code: 'TOO_SHORT', message: 'Item name must be at least 3 characters' },
], request.url);

// Unauthorized (401)
throw new UnauthorizedException('invalid-token', 'Your session has expired. Please log in again.', request.url);

// Forbidden (403)
throw new ForbiddenException('not-owner', 'You can only modify loans you created.', request.url);

// Conflict (409)
throw new ConflictException('loan-already-confirmed', 'This loan has already been confirmed by the borrower.', request.url);

// Rate Limit (429)
throw new RateLimitException('too-many-requests', 'You have exceeded the limit of 50 loans per day.', request.url);
```

---

### 3.2 Politique de Logs

#### Niveaux de Log (OBLIGATOIRES)

| Niveau | Usage | Exemple |
|--------|-------|---------|
| **ERROR** | Erreurs techniques nécessitant intervention | Exception non gérée, DB connexion failed, API tier timeout |
| **WARN** | Situations anormales mais non-bloquantes | Rappel échoué (retry prévu), Photo trop lourde (compressée automatiquement) |
| **INFO** | Événements métier importants | Loan created, Reminder sent, User logged in |
| **DEBUG** | Détails techniques pour investigation | SQL queries, Redis cache hit/miss, Event published |
| **TRACE** | Informations ultra-détaillées (désactivé en production) | Function entry/exit, Variable values |

#### Format JSON Structuré (OBLIGATOIRE)

Tous les logs doivent être au format JSON pour faciliter le parsing (Datadog, Kibana, Loki) :

```json
{
  "timestamp": "2026-02-08T14:32:00.123Z",
  "level": "info",
  "message": "Loan created successfully",
  "service": "loan-service",
  "requestId": "req-7f3c9a2b-4d1e-4a8f-9c7b-1e3f5a6b8c9d",
  "userId": "user-456",
  "context": {
    "loanId": "loan-123",
    "borrowerId": "user-789",
    "itemName": "Perceuse Bosch",
    "returnDate": "2026-03-15"
  },
  "duration": 142,
  "environment": "production"
}
```

#### Configuration Winston (Backend)

```typescript
// common/logging/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(), // Format JSON obligatoire
  ),
  defaultMeta: {
    service: 'return-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Exemple d'usage dans un service
@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  async createLoan(dto: CreateLoanDto, userId: string): Promise<Loan> {
    const startTime = Date.now();
    
    this.logger.log({
      message: 'Creating loan',
      userId,
      itemName: dto.itemName,
      requestId: RequestContext.getCurrentRequestId(),
    });

    try {
      const loan = await this.repository.save(LoanFactory.create(dto));
      
      this.logger.log({
        message: 'Loan created successfully',
        userId,
        loanId: loan.id,
        duration: Date.now() - startTime,
      });

      return loan;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create loan',
        userId,
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
      });
      throw error;
    }
  }
}
```

#### Règles de Logging

**✅ À FAIRE :**
- Logger tous les événements métier importants (création, mise à jour, suppression)
- Inclure systématiquement `requestId` et `userId` dans le contexte
- Logger les erreurs avec stack trace complète
- Logger les métriques de performance (durée des requêtes DB > 1s)

**❌ À ÉVITER :**
- Logger des données sensibles (mots de passe, tokens, numéros de carte)
- Logger dans des boucles (risque de spam)
- Utiliser `console.log` au lieu du logger Winston
- Logger des objets entiers sans filtrer (risque d'overflow)

---

## 4. Git Flow & Conventional Commits

### 4.1 Stratégie de Branches

```
main (production)
  ↓
develop (pré-production)
  ↓
feature/loan-creation
feature/reminder-system
feature/photo-upload
  ↓
hotfix/critical-bug-fix
```

#### Branches Principales

| Branche | Rôle | Protection |
|---------|------|------------|
| **main** | Code en production. Déploiements automatiques. | ✅ PR reviews (2 approvals), ✅ CI/CD passing, ❌ Direct push |
| **develop** | Branche d'intégration pour la prochaine release | ✅ PR reviews (1 approval), ✅ CI/CD passing |

#### Branches Éphémères

| Préfixe | Usage | Exemple | Merge vers |
|---------|-------|---------|------------|
| **feature/** | Nouvelle fonctionnalité | `feature/loan-creation` | develop |
| **fix/** | Correction de bug non-critique | `fix/reminder-timezone` | develop |
| **hotfix/** | Correction critique en production | `hotfix/auth-bypass` | main + develop |
| **refactor/** | Refactoring sans changement de comportement | `refactor/loan-service` | develop |
| **chore/** | Tâches techniques (deps, config) | `chore/update-dependencies` | develop |

#### Workflow Complet

```bash
# 1. Créer une feature branch depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/loan-confirmation

# 2. Développer avec TDD (commits réguliers)
# ... (écrire tests, code, refactoring)
git add .
git commit -m "feat(loans): add borrower confirmation workflow"

# 3. Push et créer une Pull Request
git push origin feature/loan-confirmation
# → Créer PR sur GitHub : feature/loan-confirmation → develop

# 4. Après review et merge, supprimer la branche
git checkout develop
git pull origin develop
git branch -d feature/loan-confirmation
git push origin --delete feature/loan-confirmation
```

---

### 4.2 Conventional Commits (OBLIGATOIRE)

**Format** : `<type>(<scope>): <subject>`

#### Types Autorisés

| Type | Description | Exemples |
|------|-------------|----------|
| **feat** | Nouvelle fonctionnalité | `feat(loans): add loan creation endpoint` |
| **fix** | Correction de bug | `fix(reminders): handle timezone conversion error` |
| **refactor** | Refactoring sans changement de comportement | `refactor(auth): extract JWT validation to middleware` |
| **test** | Ajout ou modification de tests | `test(loans): add integration tests for loan repository` |
| **docs** | Documentation uniquement | `docs(api): update OpenAPI spec for loan endpoints` |
| **chore** | Tâches techniques (deps, CI/CD) | `chore(deps): upgrade NestJS to v10.3.0` |
| **style** | Formatage (pas de changement logique) | `style(loans): fix linting errors` |
| **perf** | Amélioration de performance | `perf(db): add index on loans.lender_id` |
| **ci** | Changements CI/CD | `ci(github): add code coverage reporting` |
| **build** | Changements build (webpack, docker) | `build(docker): optimize image size` |
| **revert** | Annulation d'un commit précédent | `revert: feat(loans): add loan creation endpoint` |

#### Scopes Principaux

- **loans** : Module de gestion des prêts
- **reminders** : Système de rappels
- **auth** : Authentification/Autorisation
- **photos** : Gestion des photos d'objets
- **notifications** : Envoi de notifications
- **users** : Gestion des utilisateurs
- **db** : Base de données
- **api** : Endpoints API

#### Règles de Format

**✅ BON :**
```bash
feat(loans): add loan confirmation by borrower

- Implement PENDING_CONFIRMATION status
- Add confirmation/refusal endpoints
- Send notification to borrower on creation

Closes #42
```

**❌ MAUVAIS :**
```bash
Added some stuff for loans
```

```bash
fix: bug
```

```bash
FEAT(LOANS): THIS IS A VERY IMPORTANT FEATURE!!!
```

#### Message de Commit Idéal

```
<type>(<scope>): <subject (impératif, 50 chars max)>
[ligne vide]
<body (description détaillée, 72 chars/ligne max)>
[ligne vide]
<footer (refs, breaking changes)>
```

**Exemple Complet :**

```
feat(reminders): implement retry mechanism for failed notifications

Add exponential backoff retry logic for notifications that fail to send.
Notifications are retried up to 3 times with delays of 5min, 15min, and 60min.
Failed notifications are marked as 'failed' after all retries exhausted.

BREAKING CHANGE: ReminderService.send() now returns a Promise<ReminderStatus>
instead of void. Update all callers accordingly.

Closes #87
Refs #45, #56
```

---

### 4.3 Pre-Commit Hooks (Husky + lint-staged)

**Configuration automatique** pour garantir la qualité avant chaque commit :

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
```

**Ce qui est vérifié automatiquement :**
- ✅ Formatage du code (Prettier)
- ✅ Linting (ESLint)
- ✅ Tests des fichiers modifiés (Jest)
- ✅ Format du message de commit (Conventional Commits)

**Si une vérification échoue, le commit est bloqué.**

---

## 5. BONUS : Fichier de Contexte pour IDE AI (.github/copilot-instructions.md)

**Copier ce bloc dans `.github/copilot-instructions.md` pour que GitHub Copilot applique automatiquement ces règles :**

```markdown
# Return ↺ - Règles de Développement pour IA

## Architecture & Stack
- **Backend** : NestJS (TypeScript), Monolithe Modulaire, PostgreSQL + Redis
- **Frontend** : React Native (TypeScript), Zustand, React Navigation
- **Infrastructure** : Fly.io, Cloudflare R2, Docker
- **Modules** : Loans, Reminders, Items, Users, Notifications (découplés par événements)

## Principes SOLID (OBLIGATOIRES)
1. **SRP** : 1 classe = 1 responsabilité. Utiliser EventBus pour découpler les actions secondaires.
2. **OCP** : Créer des interfaces pour tout comportement extensible (notifications, storage).
3. **LSP** : Toute interface doit être substituable sans altérer le contrat.
4. **ISP** : Séparer les interfaces (ex: ReminderScheduler ≠ ReminderQuery).
5. **DIP** : Services dépendent d'abstractions (interfaces), jamais d'implémentations (Prisma).

## Design Patterns Imposés
- **Repository Pattern** : Tout accès DB passe par une interface `*Repository`.
- **Factory Pattern** : Création d'entités complexes (ex: `LoanFactory.create()`).
- **Strategy Pattern** : Algorithmes interchangeables (ex: politiques de rappel).
- **Observer Pattern** : Communication inter-modules via `EventBus`.

## TDD Workflow (STRICT)
1. **RED** : Écrire le test qui échoue (AAA : Arrange-Act-Assert).
2. **GREEN** : Code minimal pour passer le test.
3. **REFACTOR** : Améliorer sans casser les tests.
4. **COMMIT** : Message conventionnel (voir ci-dessous).

**Couverture minimale** : Domain 100%, Services 90%, Repositories 80%, Controllers 70%.

## Gestion d'Erreurs (RFC 7807)
Toutes les erreurs API doivent retourner :
```json
{
  "type": "https://api.return.app/errors/loan-not-found",
  "title": "Loan Not Found",
  "status": 404,
  "detail": "...",
  "instance": "/api/v1/loans/loan-123",
  "timestamp": "2026-02-08T14:32:00Z",
  "requestId": "req-...",
  "errors": [{"field": "loanId", "code": "NOT_FOUND", "message": "..."}]
}
```

## Logs (JSON Structuré Uniquement)
- **ERROR** : Erreurs techniques nécessitant intervention.
- **WARN** : Situations anormales mais non-bloquantes.
- **INFO** : Événements métier importants.
- **DEBUG** : Détails techniques (désactivé en production).

**Format obligatoire** : JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`.

## Git Commits (Conventional Commits)
Format : `<type>(<scope>): <subject>`

**Types** : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`, `build`, `revert`.
**Scopes** : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`.

**Exemple** :
```
feat(loans): add borrower confirmation workflow

- Implement PENDING_CONFIRMATION status
- Add confirmation/refusal endpoints
- Tests: 12 passing

Closes #42
```

## Checklist Avant Merge
- [ ] Tous les tests passent (unit + integration)
- [ ] Couverture de code respectée (voir seuils par couche)
- [ ] Code review approuvé (2 approvals pour main, 1 pour develop)
- [ ] Message de commit respecte Conventional Commits
- [ ] Aucune donnée sensible loguée (passwords, tokens)
- [ ] RFC 7807 respecté pour toutes les erreurs API
- [ ] Documentation API mise à jour (OpenAPI spec)

## Interdictions Strictes
❌ Dépendance directe à Prisma dans les services (utiliser Repository)
❌ `console.log` au lieu de Winston
❌ Erreurs HTTP sans RFC 7807
❌ Commits sans type conventionnel
❌ Code de production sans test préalable (TDD)
❌ Logique métier dans les controllers (déplacer dans services)
❌ Secrets en dur dans le code (utiliser .env)

## Priorités de Développement
1. **Sécurité** : Validation des inputs, Rate Limiting, RBAC strict.
2. **Testabilité** : TDD, Mocks, Testcontainers.
3. **Maintenabilité** : SOLID, Design Patterns, Documentation.
4. **Performance** : Après validation fonctionnelle (pas d'optimisation prématurée).

---
**Version** : 1.0 (8 février 2026)
**Prochaine révision** : Post-sprint 1
```

---

**Document validé par :** Esdras GBEDOZIN 
**Date de dernière mise à jour :** 8 février 2026  
**Version :** 1.0 - MVP Baseline  
**Prochaine révision** : Après validation par l'équipe de développement
