# 02_NORMES_OPERATIONNELLES.md

**Return ↺ — Standards de Développement & Qualité**

**Version** : 1.1 — MVP Baseline (post contre-expertise)
**Co-validé par** : Esdras GBEDOZIN & Ismael AÏHOU
**Date** : 12 février 2026

---

## 1. Principes de Développement (The Golden Rules)

### 1.1 Application des Principes SOLID

L'architecture **Monolithe Modulaire avec NestJS** impose le respect strict des principes SOLID. Voici leur application
concrète dans le contexte du projet Return.

---

#### **S — Single Responsibility Principle (SRP)**

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
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLoan(data: CreateLoanDto): Promise<Loan> {
    const loan = await this.prisma.loan.create({
      data: LoanFactory.toCreateInput(data),
    });

    // Publier un événement au lieu de gérer directement le rappel
    this.eventEmitter.emit('loan.created', new LoanCreatedEvent(loan.id));

    return loan;
  }
}

// Service dédié aux rappels (séparation)
@Injectable()
export class ReminderService {
  @OnEvent('loan.created')
  async handleLoanCreated(event: LoanCreatedEvent) {
    await this.scheduleReminders(event.loanId);
  }
}

// Service dédié au stockage (séparation)
@Injectable()
export class PhotoStorageService {
  constructor(
    @Inject('PHOTO_STORAGE') private readonly storage: PhotoStorage,
  ) {}

  async uploadPhoto(file: Buffer, itemId: string): Promise<string> {
    return this.storage.upload(file, `items/${itemId}/${Date.now()}.jpg`);
  }
}
```

**Bénéfices :**

- Chaque service peut être testé indépendamment
- Changement dans la logique de rappel n'impacte pas la création de prêt
- Remplacement du stockage (S3 → Cloudflare R2) sans toucher au domaine

---

#### **O — Open/Closed Principle (OCP)**

**Définition** : Ouvert à l'extension, fermé à la modification.

**Application dans Return :**
Le système de **notifications** doit supporter plusieurs canaux (push en V1, email/SMS en V2+) sans modifier le code
existant :

```typescript
// Interface abstraite (fermée à la modification)
export interface NotificationChannel {
  send(recipient: string, message: NotificationMessage): Promise<void>;
  supports(channelType: ChannelType): boolean;
}

// Implémentation V1
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

// Extension V2+ (nouveau canal) sans modifier l'existant
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

// Orchestrateur
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

- Ajout de SMS (Twilio) en V2+ en créant `SmsNotificationChannel` sans toucher au code existant
- Tests unitaires isolés par canal
- Possibilité de désactiver un canal en production sans code change (injection de dépendances)

---

#### **L — Liskov Substitution Principle (LSP)**

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

// Implémentation S3 (dev/tests)
@Injectable()
export class S3PhotoStorage implements PhotoStorage {
  async upload(file: Buffer, key: string): Promise<string> {
    await this.s3.putObject({ Bucket: 'return-photos', Key: key, Body: file });
    return `https://s3.amazonaws.com/return-photos/${key}`;
  }
  // ...
}

// Implémentation Cloudflare R2 (production — substituable)
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
export class ItemPhotoService {
  constructor(
    @Inject('PHOTO_STORAGE') private readonly storage: PhotoStorage,
  ) {}

  async attachPhoto(itemId: string, file: Buffer): Promise<string> {
    const key = `items/${itemId}/${Date.now()}.jpg`;
    // Peu importe l'implémentation (S3 ou R2), le contrat est respecté
    return this.storage.upload(file, key);
  }
}
```

---

#### **I — Interface Segregation Principle (ISP)**

**Définition** : Aucun client ne doit dépendre de méthodes qu'il n'utilise pas.

**Application dans Return :**
Le module **Reminders** expose différentes interfaces selon les besoins :

```typescript
// ❌ MAUVAIS : Interface fourre-tout
interface ReminderManager {
  scheduleReminder(loanId: string, date: Date): Promise<void>;
  cancelReminder(reminderId: string): Promise<void>;
  getUpcomingReminders(): Promise<Reminder[]>;
  retryFailedReminders(): Promise<void>; // Seul le worker en a besoin
}

// ✅ BON : Interfaces ségrégées
interface ReminderScheduler {
  schedule(loanId: string, dates: Date[]): Promise<void>;
  cancel(reminderId: string): Promise<void>;
}

interface ReminderQuery {
  getUpcomingReminders(userId: string): Promise<Reminder[]>;
}

interface ReminderFailureHandler {
  retryFailed(): Promise<void>;
}

// Le LoanService n'a besoin que de la planification
@Injectable()
export class LoanService {
  constructor(private readonly scheduler: ReminderScheduler) {}

  async createLoan(data: CreateLoanDto) {
    const loan = await this.prisma.loan.create({ data: LoanFactory.toCreateInput(data) });
    const dates = ReminderPolicy.calculateDates(loan.returnDate);
    await this.scheduler.schedule(loan.id, dates);
  }
}

// Le worker a besoin de la logique de retry
@Injectable()
export class ReminderWorker {
  constructor(
    private readonly failureHandler: ReminderFailureHandler,
  ) {}

  @Cron('0 * * * *')
  async processFailedReminders() {
    await this.failureHandler.retryFailed();
  }
}
```

---

#### **D — Dependency Inversion Principle (DIP)**

**Définition** : Dépendre d'abstractions, pas d'implémentations concrètes.

**Application dans Return :**
Le DIP s'applique aux **services externes** (stockage, notifications, messaging) mais **pas à l'accès base de données**.
Pour le MVP, Prisma est utilisé directement dans les services (pas de Repository Pattern — voir décision en 1.2).

```typescript
// ❌ MAUVAIS : Dépendance directe à un SDK de stockage
@Injectable()
export class ItemPhotoService {
  async uploadPhoto(file: Buffer, itemId: string): Promise<string> {
    // Couplage fort avec Cloudflare R2
    const r2 = new S3Client({ endpoint: 'https://r2.cloudflarestorage.com' });
    await r2.send(new PutObjectCommand({ Bucket: 'photos', Key: `${itemId}.jpg`, Body: file }));
    return `https://photos.return.app/${itemId}.jpg`;
  }
}

// ✅ BON : Dépendance à une abstraction (interface)
export interface PhotoStorage {
  upload(file: Buffer, key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class ItemPhotoService {
  constructor(
    @Inject('PHOTO_STORAGE') private readonly storage: PhotoStorage, // Abstraction
    private readonly prisma: PrismaService, // Prisma = OK directement (décision MVP)
  ) {}

  async uploadPhoto(file: Buffer, itemId: string): Promise<string> {
    const url = await this.storage.upload(file, `items/${itemId}/${Date.now()}.jpg`);
    await this.prisma.item.update({
      where: { id: itemId },
      data: { photoUrl: url },
    });
    return url;
  }
}
```

**Quand appliquer le DIP dans Return :**

| Composant | DIP (interface) | Direct | Raison |
|---|---|---|---|
| Base de données (Prisma) | ❌ | ✅ | MVP — Prisma fournit déjà un bon niveau d'abstraction |
| Stockage photos (R2) | ✅ | ❌ | Provider interchangeable (S3 en dev, R2 en prod) |
| Notifications (FCM) | ✅ | ❌ | Canal extensible (push V1, email V2+) |
| Queue (BullMQ) | ✅ | ❌ | Pourrait migrer vers un autre système de queue |

**Note importante** : L'utilisation directe de Prisma dans les services est un choix pragmatique pour le MVP.
Si un changement d'ORM devient nécessaire (ex: migration vers Drizzle), le refactoring vers un Repository Pattern sera
localisé aux services concernés.

---

### 1.2 Design Patterns

#### **Factory Pattern** (Objets complexes) — Obligatoire

Pour la création d'entités avec logique de validation :

```typescript
export class LoanFactory {
  static toCreateInput(data: CreateLoanDto): Prisma.LoanCreateInput {
    if (data.returnDate && data.returnDate < new Date()) {
      throw new InvalidReturnDateException('Return date must be in the future');
    }

    return {
      id: uuidv4(),
      item: { connect: { id: data.itemId } },
      lender: { connect: { id: data.lenderId } },
      borrower: { connect: { id: data.borrowerId } },
      returnDate: data.returnDate,
      status: LoanStatus.PENDING_CONFIRMATION,
    };
  }
}
```

#### **Observer / Event-Driven** (Couplage faible) — Obligatoire

Communication inter-modules via `EventEmitter2` (@nestjs/event-emitter) :

```typescript
// Événement domaine
export class LoanCreatedEvent {
  constructor(
    public readonly loanId: string,
    public readonly lenderId: string,
    public readonly borrowerId: string,
    public readonly returnDate: Date | null,
  ) {}
}

// Émetteur (module Loans)
@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLoan(data: CreateLoanDto): Promise<Loan> {
    const loan = await this.prisma.loan.create({
      data: LoanFactory.toCreateInput(data),
    });

    this.eventEmitter.emit('loan.created', new LoanCreatedEvent(
      loan.id, loan.lenderId, loan.borrowerId, loan.returnDate,
    ));

    return loan;
  }
}

// Listener découplé (module Reminders)
@Injectable()
export class ReminderListener {
  @OnEvent('loan.created')
  async handleLoanCreated(event: LoanCreatedEvent) {
    if (event.returnDate) {
      const dates = ReminderPolicy.calculateDates(event.returnDate);
      await this.scheduleReminders(event.loanId, dates);
    }
  }
}

// Listener découplé (module Notifications)
@Injectable()
export class NotificationListener {
  @OnEvent('loan.created')
  async handleLoanCreated(event: LoanCreatedEvent) {
    await this.notifyBorrower(event.borrowerId, event.loanId);
  }
}
```

#### **Politique de rappels fixe** (pas de Strategy Pattern en V1)

La politique de rappel est **unique et fixe** — il n'y a pas de politique alternative en V1 :

```typescript
// Service simple avec politique fixe (pas de Strategy Pattern)
export class ReminderPolicy {
  /**
   * Calcule les 5 dates de rappel automatiques pour un prêt.
   * Politique fixe : J-3, J, J+7, J+14, J+21
   */
  static calculateDates(returnDate: Date): Date[] {
    return [
      subDays(returnDate, 3),   // J-3 : PREVENTIVE
      returnDate,                // J   : ON_DUE_DATE
      addDays(returnDate, 7),   // J+7 : FIRST_OVERDUE
      addDays(returnDate, 14),  // J+14 : SECOND_OVERDUE
      addDays(returnDate, 21),  // J+21 : FINAL_OVERDUE
    ];
  }
}

// Utilisé dans le service
@Injectable()
export class ReminderService {
  async scheduleReminders(loanId: string, returnDate: Date): Promise<void> {
    const dates = ReminderPolicy.calculateDates(returnDate);
    const types = [
      ReminderType.PREVENTIVE,
      ReminderType.ON_DUE_DATE,
      ReminderType.FIRST_OVERDUE,
      ReminderType.SECOND_OVERDUE,
      ReminderType.FINAL_OVERDUE,
    ];

    for (let i = 0; i < dates.length; i++) {
      await this.reminderQueue.add('send-reminder', {
        loanId,
        type: types[i],
        scheduledFor: dates[i],
      }, { delay: dates[i].getTime() - Date.now() });
    }
  }
}
```

> **Note** : Si une politique alternative devient nécessaire (ex: rappels urgents, rappels personnalisés), on refactore
> vers un Strategy Pattern à ce moment-là (YAGNI).

---

## 2. Stratégie de Test (TDD Workflow)

### 2.1 Stack de Test

| Couche | Framework | Usage |
|---|---|---|
| **Backend — Unit Tests** | Jest | Tests isolés des services, factories, value objects |
| **Backend — Integration Tests** | Jest + Testcontainers | Tests avec PostgreSQL et Redis réels |
| **Backend — E2E Tests** | Jest + Supertest | Tests des endpoints API |
| **Frontend — Unit/Component Tests** | Jest + React Native Testing Library | Tests des composants et interactions |
| **Frontend — E2E Tests** | Detox (post-MVP) | Smoke tests de navigation critiques |

**Décisions :**

- **Pas de Pact (Contract Testing)** : L'approche OpenAPI-first + Prism mock + tests Supertest couvre le besoin pour une
  équipe de 2 développeurs. Pact serait pertinent si les équipes front/back étaient séparées.
- **Detox réservé au post-MVP** : RNTL couvre 80% des besoins frontend avec 20% de l'effort. Detox (E2E natif) est
  fragile et coûteux — à réserver pour des smoke tests critiques une fois le MVP stabilisé.

### 2.2 Cycle TDD Strict (RED → GREEN → REFACTOR)

**RÈGLE D'OR** : Aucun code de production ne doit être écrit sans test préalable qui échoue.

```
┌────────────────────────────────────────────────────────────────┐
│  Pour CHAQUE fonctionnalité/comportement :                     │
│                                                                │
│  1. RED    (30s-2min)  → Écrire LE test qui échoue            │
│  2. GREEN  (2-5min)    → Code MINIMAL pour passer le test      │
│  3. REFACTOR (3-10min) → Améliorer sans casser les tests       │
│  4. COMMIT             → git commit avec message conventionnel │
│                                                                │
│  Puis passer au comportement suivant.                          │
└────────────────────────────────────────────────────────────────┘
```

**Important** : Le cycle est **par comportement**, pas par feature complète. Une feature (ex: création de prêt) se
décompose en plusieurs cycles RED-GREEN-REFACTOR enchaînés :

#### Exemple : Implémentation de la création d'un prêt

**Cycle 1 — Créer un prêt avec statut PENDING_CONFIRMATION**

```typescript
// RED : loan.service.spec.ts
it('should create a loan with PENDING_CONFIRMATION status', async () => {
  // Arrange
  const prisma = mockDeep<PrismaService>();
  prisma.loan.create.mockResolvedValue(mockLoan);
  const service = new LoanService(prisma, mockEventEmitter);

  // Act
  const result = await service.createLoan(validDto);

  // Assert
  expect(result.status).toBe(LoanStatus.PENDING_CONFIRMATION);
  expect(prisma.loan.create).toHaveBeenCalledTimes(1);
});
// ❌ Test échoue : LoanService.createLoan() n'existe pas encore
```

```typescript
// GREEN : loan.service.ts
@Injectable()
export class LoanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createLoan(dto: CreateLoanDto): Promise<Loan> {
    return this.prisma.loan.create({
      data: {
        ...dto,
        status: LoanStatus.PENDING_CONFIRMATION,
      },
    });
  }
}
// ✅ Test passe
```

```bash
# COMMIT
git commit -m "feat(loans): create loan with pending confirmation status"
```

**Cycle 2 — Émettre un événement après création**

```typescript
// RED
it('should emit LoanCreatedEvent after creation', async () => {
  const prisma = mockDeep<PrismaService>();
  prisma.loan.create.mockResolvedValue(mockLoan);
  const eventEmitter = { emit: jest.fn() };
  const service = new LoanService(prisma, eventEmitter as any);

  await service.createLoan(validDto);

  expect(eventEmitter.emit).toHaveBeenCalledWith(
    'loan.created',
    expect.objectContaining({ loanId: mockLoan.id }),
  );
});
// ❌ Échoue : emit n'est pas appelé
```

```typescript
// GREEN : ajouter l'émission dans createLoan
async createLoan(dto: CreateLoanDto): Promise<Loan> {
  const loan = await this.prisma.loan.create({
    data: { ...dto, status: LoanStatus.PENDING_CONFIRMATION },
  });
  this.eventEmitter.emit('loan.created', new LoanCreatedEvent(loan.id, loan.lenderId));
  return loan;
}
// ✅ Test passe
```

```bash
# COMMIT
git commit -m "feat(loans): emit event on loan creation"
```

**Cycle 3 — REFACTOR : Extraire la factory**

```typescript
// REFACTOR : loan.service.ts
async createLoan(dto: CreateLoanDto): Promise<Loan> {
  const loan = await this.prisma.loan.create({
    data: LoanFactory.toCreateInput(dto),
  });
  this.eventEmitter.emit('loan.created', new LoanCreatedEvent(
    loan.id, loan.lenderId, loan.borrowerId, loan.returnDate,
  ));
  return loan;
}
// ✅ Tests passent toujours (comportement identique)
```

```bash
# COMMIT
git commit -m "refactor(loans): extract LoanFactory for creation logic"
```

**Ce cycle se répète** pour chaque nouveau comportement : validation de la date de retour, refus de prêt si borrower
inexistant, etc.

---

### 2.3 Structure des Tests (Pattern AAA)

**Obligatoire** : Tous les tests doivent suivre le pattern **Arrange-Act-Assert** :

```typescript
describe('ReminderService', () => {
  describe('scheduleReminders', () => {
    it('should schedule 5 reminders for a standard loan', async () => {
      // ========== ARRANGE ==========
      const mockQueue = { add: jest.fn().mockResolvedValue({}) };
      const service = new ReminderService(mockQueue as any);
      const returnDate = new Date('2026-03-15');

      // ========== ACT ==========
      await service.scheduleReminders('loan-123', returnDate);

      // ========== ASSERT ==========
      expect(mockQueue.add).toHaveBeenCalledTimes(5);
      expect(mockQueue.add).toHaveBeenNthCalledWith(1, 'send-reminder', expect.objectContaining({
        loanId: 'loan-123',
        type: ReminderType.PREVENTIVE,
        scheduledFor: new Date('2026-03-12'), // J-3
      }), expect.any(Object));
      expect(mockQueue.add).toHaveBeenNthCalledWith(2, 'send-reminder', expect.objectContaining({
        type: ReminderType.ON_DUE_DATE,
        scheduledFor: new Date('2026-03-15'), // J
      }), expect.any(Object));
      // J+7, J+14, J+21...
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
|---|---|---|
| **Domain Logic** (Entities, Value Objects, Factories) | 95% | ❌ Bloque le merge si < 95% |
| **Services** (Use Cases) | 90% | ❌ Bloque si < 85% |
| **Controllers** (Endpoints) | 70% | ⚠️ Warning si < 60% |
| **DTOs / Validation** | 60% | ℹ️ Info seulement |

> **Note** : Pas de ligne "Repositories" — Prisma est utilisé directement dans les services (pas de Repository Pattern).
> Les tests d'intégration avec Testcontainers couvrent l'accès aux données.

**Configuration Jest** :

```json
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
        "branches": 95,
        "functions": 95,
        "lines": 95,
        "statements": 95
      },
      "./src/**/**.service.ts": {
        "branches": 85,
        "functions": 90,
        "lines": 90,
        "statements": 90
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
      requestId: RequestContext.getCurrentRequestId(),
      errors,
    };
    super(problemDetails, status);
  }
}
```

> **Prérequis** : `RequestContext` repose sur `AsyncLocalStorage` (Node.js) pour propager le `requestId` à travers
> toute la call stack. Un `RequestContextMiddleware` NestJS doit être implémenté dès le Sprint 0 pour initialiser
> l'`AsyncLocalStorage` à chaque requête. Sans cela, `getCurrentRequestId()` retournera `undefined`.

```typescript
// Exceptions métier spécifiques
export class LoanNotFoundException extends ProblemDetailsException {
  constructor(loanId: string, path: string) {
    super(
      HttpStatus.NOT_FOUND, 'loan-not-found', 'Loan Not Found',
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

    if (exception instanceof ProblemDetailsException) {
      return response.status(exception.getStatus()).json(exception.getResponse());
    }

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
throw new UnauthorizedException('invalid-token', 'Your session has expired.', request.url);

// Forbidden (403)
throw new ForbiddenException('not-owner', 'You can only modify loans you created.', request.url);

// Conflict (409)
throw new ConflictException('loan-already-confirmed', 'This loan has already been confirmed.', request.url);

// Rate Limit (429)
throw new RateLimitException('too-many-requests', 'You have exceeded the limit of 15 loans per day.', request.url);
```

---

### 3.2 Politique de Logs

#### Niveaux de Log (OBLIGATOIRES)

| Niveau | Usage | Exemple |
|---|---|---|
| **ERROR** | Erreurs techniques nécessitant intervention | Exception non gérée, DB connexion failed, FCM timeout |
| **WARN** | Situations anormales mais non-bloquantes | Rappel échoué (retry prévu), photo trop lourde |
| **INFO** | Événements métier importants | Loan created, Reminder sent, User logged in |
| **DEBUG** | Détails techniques pour investigation | SQL queries, Redis cache hit/miss, Event published |

#### Format JSON Structuré (OBLIGATOIRE)

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
    "itemName": "Perceuse Bosch"
  },
  "duration": 142,
  "environment": "production"
}
```

#### Configuration Winston (Backend)

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'return-api',
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console uniquement — les conteneurs Fly.io sont éphémères,
    // les File transports sont inutiles (logs perdus au redéploiement).
    // Les logs stdout sont captés par `fly logs` et routables vers
    // un service externe (Logtail, Better Stack) si nécessaire.
    new winston.transports.Console(),
  ],
});
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

### 4.1 Stratégie de Branches (GitHub Flow)

Pour une équipe de 2 développeurs, **GitHub Flow** est plus adapté que Git Flow :
pas de branche `develop`, les features sont mergées directement dans `main`.

```
main (production — déploiement continu)
  ↓
feature/loan-creation
feature/reminder-system
fix/timezone-bug
hotfix/critical-auth-fix
```

#### Branche Principale

| Branche | Rôle | Protection |
|---|---|---|
| **main** | Code en production. Déploiement automatique via Fly.io. | ✅ PR review (1 approval), ✅ CI passing, ❌ Direct push |

> **1 approval** suffit pour une équipe de 2. Self-merge autorisé en cas de hotfix critique (documenté dans un runbook).

#### Branches Éphémères

| Préfixe | Usage | Exemple | Merge vers |
|---|---|---|---|
| **feature/** | Nouvelle fonctionnalité | `feature/loan-creation` | main |
| **fix/** | Correction de bug non-critique | `fix/reminder-timezone` | main |
| **hotfix/** | Correction critique en production | `hotfix/auth-bypass` | main |
| **refactor/** | Refactoring sans changement de comportement | `refactor/loan-service` | main |
| **chore/** | Tâches techniques (deps, config) | `chore/update-dependencies` | main |

#### Workflow Complet

```bash
# 1. Créer une feature branch depuis main
git checkout main
git pull origin main
git checkout -b feature/loan-confirmation

# 2. Développer avec TDD (commits réguliers à chaque cycle RED-GREEN-REFACTOR)
git commit -m "test(loans): add failing test for borrower confirmation"
git commit -m "feat(loans): implement borrower confirmation"
git commit -m "refactor(loans): extract confirmation logic to dedicated method"

# 3. Push et créer une Pull Request
git push origin feature/loan-confirmation
# → Créer PR sur GitHub : feature/loan-confirmation → main

# 4. Review (1 approval), CI verte, puis merge (squash ou merge commit)

# 5. Supprimer la branche après merge
git checkout main
git pull origin main
git branch -d feature/loan-confirmation
```

---

### 4.2 Conventional Commits (OBLIGATOIRE)

**Format** : `<type>(<scope>): <subject>`

#### Types Autorisés

| Type | Description | Exemples |
|---|---|---|
| **feat** | Nouvelle fonctionnalité | `feat(loans): add loan creation endpoint` |
| **fix** | Correction de bug | `fix(reminders): handle timezone conversion error` |
| **refactor** | Refactoring sans changement de comportement | `refactor(auth): extract JWT validation to middleware` |
| **test** | Ajout ou modification de tests | `test(loans): add integration tests for loan creation` |
| **docs** | Documentation uniquement | `docs(api): update OpenAPI spec for loan endpoints` |
| **chore** | Tâches techniques (deps, CI/CD) | `chore(deps): upgrade NestJS to v11.0.0` |
| **style** | Formatage (pas de changement logique) | `style(loans): fix linting errors` |
| **perf** | Amélioration de performance | `perf(db): add index on loans.lender_id` |
| **ci** | Changements CI/CD | `ci(github): add code coverage reporting` |
| **build** | Changements build (docker) | `build(docker): optimize image size` |
| **revert** | Annulation d'un commit précédent | `revert: feat(loans): add loan creation endpoint` |

#### Scopes Principaux

- **loans** : Module de gestion des prêts
- **reminders** : Système de rappels automatiques
- **auth** : Authentification/Autorisation (JWT, Passport)
- **photos** : Gestion des photos d'objets (Cloudflare R2)
- **notifications** : Envoi de notifications push (FCM)
- **users** : Gestion des utilisateurs/profils
- **db** : Base de données (migrations, seeds)
- **api** : Endpoints API (controllers, DTOs)
- **i18n** : Internationalisation (FR/EN)

#### Message de Commit Idéal

```
<type>(<scope>): <subject (impératif, 50 chars max)>
[ligne vide]
<body (description détaillée, 72 chars/ligne max)>
[ligne vide]
<footer (refs, breaking changes)>
```

**Exemple :**

```
feat(reminders): implement automatic reminder scheduling

Schedule 5 reminders (J-3, J, J+7, J+14, J+21) via BullMQ when a loan
is created with a return date. Each reminder uses a random template
from the appropriate tier pool.

Closes #87
```

---

### 4.3 Pre-Commit Hooks (Husky + lint-staged)

**Configuration** pour garantir la qualité avant chaque commit :

```json
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
      "prettier --write"
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
- ✅ Format du message de commit (Conventional Commits)

**Ce qui n'est PAS en pre-commit** (exécuté en CI uniquement) :

- ❌ Tests Jest — trop lent en pre-commit (10-30s), casse le rythme TDD qui impose des commits fréquents
- ❌ Type-checking — `tsc --noEmit` est lent, réservé à la CI

> Les tests sont exécutés en **CI** (push/PR) où le temps est moins critique.
> La PR ne peut pas être mergée sans CI verte.

---

## 5. Conventions Additionnelles

### 5.1 Convention de Nommage des Fichiers

NestJS utilise par convention le **kebab-case** avec suffixe de type :

| Type | Convention | Exemple |
|---|---|---|
| Service | `<name>.service.ts` | `loan.service.ts` |
| Controller | `<name>.controller.ts` | `loan.controller.ts` |
| Module | `<name>.module.ts` | `loan.module.ts` |
| DTO | `<name>.dto.ts` | `create-loan.dto.ts` |
| Entity/Model | `<name>.entity.ts` | `loan.entity.ts` |
| Factory | `<name>.factory.ts` | `loan.factory.ts` |
| Event | `<name>.event.ts` | `loan-created.event.ts` |
| Guard | `<name>.guard.ts` | `loan-owner.guard.ts` |
| Spec (test) | `<name>.spec.ts` | `loan.service.spec.ts` |
| Interface | `<name>.interface.ts` | `photo-storage.interface.ts` |

### 5.2 Validation (class-validator + class-transformer)

**Décision** : `class-validator` avec décorateurs est le choix pour Return, car il s'intègre nativement avec le
`ValidationPipe` de NestJS.

```typescript
// create-loan.dto.ts
import { IsUUID, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLoanDto {
  @IsUUID()
  itemId: string;

  @IsUUID()
  borrowerId: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// main.ts — Activation globale
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Supprime les propriétés non décorées
  forbidNonWhitelisted: true, // Erreur si propriétés inconnues
  transform: true,            // Transformation automatique des types
}));
```

### 5.3 Checklist de Code Review

Avant d'approuver une PR, vérifier :

- [ ] Tous les tests passent (unit + integration)
- [ ] Couverture de code respectée (voir seuils par couche)
- [ ] Message de commit respecte Conventional Commits
- [ ] Aucune donnée sensible loguée (passwords, tokens)
- [ ] RFC 7807 respecté pour toutes les erreurs API
- [ ] Pas de `console.log` (Winston uniquement)
- [ ] Pas de logique métier dans les controllers
- [ ] Documentation API mise à jour (openapi.yaml) si endpoints modifiés
- [ ] i18n : textes utilisateur disponibles en FR et EN

---

## 6. BONUS : Fichier de Contexte pour IDE AI (.github/copilot-instructions.md)

**Copier ce bloc dans `.github/copilot-instructions.md`** pour que les assistants AI appliquent ces règles :

```markdown
# Return ↺ — Règles de Développement pour IA

## Architecture & Stack

- **Backend** : NestJS 11.x (TypeScript 5.8+), Monolithe Modulaire, PostgreSQL 17+ (Prisma 6.x+), Redis 8.x
- **Frontend** : React Native 0.78+ (TypeScript), Zustand 5.x, React Navigation 7.x, React Native Paper
- **Infrastructure** : Fly.io (Europe West), Cloudflare R2, Docker, GitHub Actions CI/CD
- **Auth** : JWT (access 15min + refresh 30j) via Passport.js, révocation immédiate via Redis blacklist
- **Modules** : Loans, Reminders, Items, Users, Notifications (découplés par événements)

## Principes SOLID

1. **SRP** : 1 classe = 1 responsabilité. EventEmitter2 pour découpler les actions secondaires.
2. **OCP** : Interfaces pour tout comportement extensible (notifications, storage).
3. **LSP** : Toute interface substituable sans altérer le contrat.
4. **ISP** : Interfaces ségrégées (ReminderScheduler ≠ ReminderQuery).
5. **DIP** : Abstractions pour services externes (storage, notifications). Prisma directement dans les services (pas de Repository Pattern pour le MVP).

## Design Patterns

- **Factory Pattern** : Création d'entités complexes (`LoanFactory.toCreateInput()`).
- **Observer/Event-Driven** : Communication inter-modules via `EventEmitter2` + `@OnEvent`.
- **Politique fixe de rappels** : J-3, J, J+7, J+14, J+21 (pas de Strategy Pattern en V1).

## TDD Workflow (STRICT)

1. **RED** : Écrire LE test qui échoue (AAA : Arrange-Act-Assert).
2. **GREEN** : Code minimal pour passer le test.
3. **REFACTOR** : Améliorer sans casser les tests.
4. **COMMIT** : Message conventionnel.

Cycle par comportement, pas par feature entière.

**Couverture** : Domain 95%, Services 90%, Controllers 70%.

## Validation

- **class-validator** + **class-transformer** avec NestJS ValidationPipe.
- whitelist: true, forbidNonWhitelisted: true, transform: true.

## Gestion d'Erreurs (RFC 7807)

Toutes les erreurs API retournent un objet ProblemDetails :
```json
{
  "type": "https://api.return.app/errors/<error-type>",
  "title": "...",
  "status": 404,
  "detail": "...",
  "instance": "/v1/...",
  "timestamp": "...",
  "requestId": "..."
}
```

## Logs (JSON Structuré — Winston)

- Console transport uniquement (conteneurs Fly.io éphémères).
- Format JSON avec `requestId`, `userId`, `timestamp`, `context`, `duration`.
- Niveaux : ERROR, WARN, INFO, DEBUG.

## Git (GitHub Flow + Conventional Commits)

- **Branches** : `main` ← `feature/`, `fix/`, `hotfix/`, `refactor/`, `chore/`
- **Pas de branche develop** (GitHub Flow pour 2 développeurs).
- **Commits** : `<type>(<scope>): <subject>`
- **Scopes** : `loans`, `reminders`, `auth`, `photos`, `notifications`, `users`, `db`, `api`, `i18n`
- **Pre-commit** : ESLint + Prettier (pas de Jest en pre-commit).
- **PR** : 1 approval, CI verte.

## Interdictions Strictes

❌ `console.log` (utiliser Winston)
❌ Erreurs HTTP sans RFC 7807
❌ Commits sans type conventionnel
❌ Code de production sans test préalable (TDD)
❌ Logique métier dans les controllers
❌ Secrets en dur (utiliser .env)
❌ Zod pour la validation (utiliser class-validator)
❌ File Transport Winston (conteneurs éphémères)

## Rappels Automatiques (100% automatiques, pas de rappels manuels)

- Politique fixe : J-3, J, J+7, J+14, J+21
- Templates prédéfinis avec pool aléatoire par tier
- Push notifications uniquement en V1 (FCM)
- Après le 5e rappel ignoré → statut NOT_RETURNED

## i18n

- FR + EN en V1 (app + notifications push)
- Textes utilisateur toujours disponibles dans les deux langues

---
**Version** : 1.1 (12 février 2026)
**Prochaine révision** : Post-Sprint 1
```

---

**Co-validé par** : Esdras GBEDOZIN & Ismael AÏHOU
**Date de dernière mise à jour** : 12 février 2026
**Version** : 1.1 — MVP Baseline (post contre-expertise)
**Prochaine révision** : Post-Sprint 1
