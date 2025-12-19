
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model Space
 * 
 */
export type Space = $Result.DefaultSelection<Prisma.$SpacePayload>
/**
 * Model SpaceCategory
 * 
 */
export type SpaceCategory = $Result.DefaultSelection<Prisma.$SpaceCategoryPayload>
/**
 * Model Amenity
 * 
 */
export type Amenity = $Result.DefaultSelection<Prisma.$AmenityPayload>
/**
 * Model SpaceAmenity
 * 
 */
export type SpaceAmenity = $Result.DefaultSelection<Prisma.$SpaceAmenityPayload>
/**
 * Model Availability
 * 
 */
export type Availability = $Result.DefaultSelection<Prisma.$AvailabilityPayload>
/**
 * Model BlockedDate
 * 
 */
export type BlockedDate = $Result.DefaultSelection<Prisma.$BlockedDatePayload>
/**
 * Model Booking
 * 
 */
export type Booking = $Result.DefaultSelection<Prisma.$BookingPayload>
/**
 * Model Review
 * 
 */
export type Review = $Result.DefaultSelection<Prisma.$ReviewPayload>
/**
 * Model Payout
 * 
 */
export type Payout = $Result.DefaultSelection<Prisma.$PayoutPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Role: {
  USER: 'USER',
  HOST: 'HOST',
  ADMIN: 'ADMIN'
};

export type Role = (typeof Role)[keyof typeof Role]


export const SpaceType: {
  OFFICE_DESK: 'OFFICE_DESK',
  PRIVATE_OFFICE: 'PRIVATE_OFFICE',
  MEETING_ROOM: 'MEETING_ROOM',
  EVENT_VENUE: 'EVENT_VENUE',
  WEDDING_VENUE: 'WEDDING_VENUE',
  COWORKING_SPACE: 'COWORKING_SPACE'
};

export type SpaceType = (typeof SpaceType)[keyof typeof SpaceType]


export const PricingType: {
  HOURLY: 'HOURLY',
  DAILY: 'DAILY',
  BOTH: 'BOTH'
};

export type PricingType = (typeof PricingType)[keyof typeof PricingType]


export const BookingStatus: {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DEPOSIT_PAID: 'DEPOSIT_PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
};

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]


export const CancellationPolicy: {
  FLEXIBLE: 'FLEXIBLE',
  MODERATE: 'MODERATE',
  STRICT: 'STRICT',
  NON_REFUNDABLE: 'NON_REFUNDABLE'
};

export type CancellationPolicy = (typeof CancellationPolicy)[keyof typeof CancellationPolicy]


export const PayoutStatus: {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

}

export type Role = $Enums.Role

export const Role: typeof $Enums.Role

export type SpaceType = $Enums.SpaceType

export const SpaceType: typeof $Enums.SpaceType

export type PricingType = $Enums.PricingType

export const PricingType: typeof $Enums.PricingType

export type BookingStatus = $Enums.BookingStatus

export const BookingStatus: typeof $Enums.BookingStatus

export type CancellationPolicy = $Enums.CancellationPolicy

export const CancellationPolicy: typeof $Enums.CancellationPolicy

export type PayoutStatus = $Enums.PayoutStatus

export const PayoutStatus: typeof $Enums.PayoutStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.space`: Exposes CRUD operations for the **Space** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Spaces
    * const spaces = await prisma.space.findMany()
    * ```
    */
  get space(): Prisma.SpaceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.spaceCategory`: Exposes CRUD operations for the **SpaceCategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SpaceCategories
    * const spaceCategories = await prisma.spaceCategory.findMany()
    * ```
    */
  get spaceCategory(): Prisma.SpaceCategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.amenity`: Exposes CRUD operations for the **Amenity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Amenities
    * const amenities = await prisma.amenity.findMany()
    * ```
    */
  get amenity(): Prisma.AmenityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.spaceAmenity`: Exposes CRUD operations for the **SpaceAmenity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SpaceAmenities
    * const spaceAmenities = await prisma.spaceAmenity.findMany()
    * ```
    */
  get spaceAmenity(): Prisma.SpaceAmenityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.availability`: Exposes CRUD operations for the **Availability** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Availabilities
    * const availabilities = await prisma.availability.findMany()
    * ```
    */
  get availability(): Prisma.AvailabilityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.blockedDate`: Exposes CRUD operations for the **BlockedDate** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BlockedDates
    * const blockedDates = await prisma.blockedDate.findMany()
    * ```
    */
  get blockedDate(): Prisma.BlockedDateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.booking`: Exposes CRUD operations for the **Booking** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Bookings
    * const bookings = await prisma.booking.findMany()
    * ```
    */
  get booking(): Prisma.BookingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.review`: Exposes CRUD operations for the **Review** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Reviews
    * const reviews = await prisma.review.findMany()
    * ```
    */
  get review(): Prisma.ReviewDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.payout`: Exposes CRUD operations for the **Payout** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payouts
    * const payouts = await prisma.payout.findMany()
    * ```
    */
  get payout(): Prisma.PayoutDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.16.0
   * Query Engine version: 1c57fdcd7e44b29b9313256c76699e91c3ac3c43
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Session: 'Session',
    Space: 'Space',
    SpaceCategory: 'SpaceCategory',
    Amenity: 'Amenity',
    SpaceAmenity: 'SpaceAmenity',
    Availability: 'Availability',
    BlockedDate: 'BlockedDate',
    Booking: 'Booking',
    Review: 'Review',
    Payout: 'Payout'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "session" | "space" | "spaceCategory" | "amenity" | "spaceAmenity" | "availability" | "blockedDate" | "booking" | "review" | "payout"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      Space: {
        payload: Prisma.$SpacePayload<ExtArgs>
        fields: Prisma.SpaceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpaceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpaceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          findFirst: {
            args: Prisma.SpaceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpaceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          findMany: {
            args: Prisma.SpaceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>[]
          }
          create: {
            args: Prisma.SpaceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          createMany: {
            args: Prisma.SpaceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpaceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>[]
          }
          delete: {
            args: Prisma.SpaceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          update: {
            args: Prisma.SpaceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          deleteMany: {
            args: Prisma.SpaceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpaceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpaceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>[]
          }
          upsert: {
            args: Prisma.SpaceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpacePayload>
          }
          aggregate: {
            args: Prisma.SpaceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpace>
          }
          groupBy: {
            args: Prisma.SpaceGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpaceGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpaceCountArgs<ExtArgs>
            result: $Utils.Optional<SpaceCountAggregateOutputType> | number
          }
        }
      }
      SpaceCategory: {
        payload: Prisma.$SpaceCategoryPayload<ExtArgs>
        fields: Prisma.SpaceCategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpaceCategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpaceCategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          findFirst: {
            args: Prisma.SpaceCategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpaceCategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          findMany: {
            args: Prisma.SpaceCategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>[]
          }
          create: {
            args: Prisma.SpaceCategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          createMany: {
            args: Prisma.SpaceCategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpaceCategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>[]
          }
          delete: {
            args: Prisma.SpaceCategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          update: {
            args: Prisma.SpaceCategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          deleteMany: {
            args: Prisma.SpaceCategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpaceCategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpaceCategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>[]
          }
          upsert: {
            args: Prisma.SpaceCategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceCategoryPayload>
          }
          aggregate: {
            args: Prisma.SpaceCategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpaceCategory>
          }
          groupBy: {
            args: Prisma.SpaceCategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpaceCategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpaceCategoryCountArgs<ExtArgs>
            result: $Utils.Optional<SpaceCategoryCountAggregateOutputType> | number
          }
        }
      }
      Amenity: {
        payload: Prisma.$AmenityPayload<ExtArgs>
        fields: Prisma.AmenityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AmenityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AmenityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          findFirst: {
            args: Prisma.AmenityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AmenityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          findMany: {
            args: Prisma.AmenityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>[]
          }
          create: {
            args: Prisma.AmenityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          createMany: {
            args: Prisma.AmenityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AmenityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>[]
          }
          delete: {
            args: Prisma.AmenityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          update: {
            args: Prisma.AmenityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          deleteMany: {
            args: Prisma.AmenityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AmenityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AmenityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>[]
          }
          upsert: {
            args: Prisma.AmenityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AmenityPayload>
          }
          aggregate: {
            args: Prisma.AmenityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAmenity>
          }
          groupBy: {
            args: Prisma.AmenityGroupByArgs<ExtArgs>
            result: $Utils.Optional<AmenityGroupByOutputType>[]
          }
          count: {
            args: Prisma.AmenityCountArgs<ExtArgs>
            result: $Utils.Optional<AmenityCountAggregateOutputType> | number
          }
        }
      }
      SpaceAmenity: {
        payload: Prisma.$SpaceAmenityPayload<ExtArgs>
        fields: Prisma.SpaceAmenityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SpaceAmenityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SpaceAmenityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          findFirst: {
            args: Prisma.SpaceAmenityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SpaceAmenityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          findMany: {
            args: Prisma.SpaceAmenityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>[]
          }
          create: {
            args: Prisma.SpaceAmenityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          createMany: {
            args: Prisma.SpaceAmenityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SpaceAmenityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>[]
          }
          delete: {
            args: Prisma.SpaceAmenityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          update: {
            args: Prisma.SpaceAmenityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          deleteMany: {
            args: Prisma.SpaceAmenityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SpaceAmenityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SpaceAmenityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>[]
          }
          upsert: {
            args: Prisma.SpaceAmenityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SpaceAmenityPayload>
          }
          aggregate: {
            args: Prisma.SpaceAmenityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSpaceAmenity>
          }
          groupBy: {
            args: Prisma.SpaceAmenityGroupByArgs<ExtArgs>
            result: $Utils.Optional<SpaceAmenityGroupByOutputType>[]
          }
          count: {
            args: Prisma.SpaceAmenityCountArgs<ExtArgs>
            result: $Utils.Optional<SpaceAmenityCountAggregateOutputType> | number
          }
        }
      }
      Availability: {
        payload: Prisma.$AvailabilityPayload<ExtArgs>
        fields: Prisma.AvailabilityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AvailabilityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AvailabilityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          findFirst: {
            args: Prisma.AvailabilityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AvailabilityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          findMany: {
            args: Prisma.AvailabilityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>[]
          }
          create: {
            args: Prisma.AvailabilityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          createMany: {
            args: Prisma.AvailabilityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AvailabilityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>[]
          }
          delete: {
            args: Prisma.AvailabilityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          update: {
            args: Prisma.AvailabilityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          deleteMany: {
            args: Prisma.AvailabilityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AvailabilityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AvailabilityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>[]
          }
          upsert: {
            args: Prisma.AvailabilityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AvailabilityPayload>
          }
          aggregate: {
            args: Prisma.AvailabilityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAvailability>
          }
          groupBy: {
            args: Prisma.AvailabilityGroupByArgs<ExtArgs>
            result: $Utils.Optional<AvailabilityGroupByOutputType>[]
          }
          count: {
            args: Prisma.AvailabilityCountArgs<ExtArgs>
            result: $Utils.Optional<AvailabilityCountAggregateOutputType> | number
          }
        }
      }
      BlockedDate: {
        payload: Prisma.$BlockedDatePayload<ExtArgs>
        fields: Prisma.BlockedDateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BlockedDateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BlockedDateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          findFirst: {
            args: Prisma.BlockedDateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BlockedDateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          findMany: {
            args: Prisma.BlockedDateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>[]
          }
          create: {
            args: Prisma.BlockedDateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          createMany: {
            args: Prisma.BlockedDateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BlockedDateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>[]
          }
          delete: {
            args: Prisma.BlockedDateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          update: {
            args: Prisma.BlockedDateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          deleteMany: {
            args: Prisma.BlockedDateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BlockedDateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BlockedDateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>[]
          }
          upsert: {
            args: Prisma.BlockedDateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BlockedDatePayload>
          }
          aggregate: {
            args: Prisma.BlockedDateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBlockedDate>
          }
          groupBy: {
            args: Prisma.BlockedDateGroupByArgs<ExtArgs>
            result: $Utils.Optional<BlockedDateGroupByOutputType>[]
          }
          count: {
            args: Prisma.BlockedDateCountArgs<ExtArgs>
            result: $Utils.Optional<BlockedDateCountAggregateOutputType> | number
          }
        }
      }
      Booking: {
        payload: Prisma.$BookingPayload<ExtArgs>
        fields: Prisma.BookingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BookingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BookingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findFirst: {
            args: Prisma.BookingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BookingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          findMany: {
            args: Prisma.BookingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          create: {
            args: Prisma.BookingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          createMany: {
            args: Prisma.BookingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BookingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          delete: {
            args: Prisma.BookingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          update: {
            args: Prisma.BookingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          deleteMany: {
            args: Prisma.BookingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BookingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BookingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>[]
          }
          upsert: {
            args: Prisma.BookingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BookingPayload>
          }
          aggregate: {
            args: Prisma.BookingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBooking>
          }
          groupBy: {
            args: Prisma.BookingGroupByArgs<ExtArgs>
            result: $Utils.Optional<BookingGroupByOutputType>[]
          }
          count: {
            args: Prisma.BookingCountArgs<ExtArgs>
            result: $Utils.Optional<BookingCountAggregateOutputType> | number
          }
        }
      }
      Review: {
        payload: Prisma.$ReviewPayload<ExtArgs>
        fields: Prisma.ReviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findFirst: {
            args: Prisma.ReviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          findMany: {
            args: Prisma.ReviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          create: {
            args: Prisma.ReviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          createMany: {
            args: Prisma.ReviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReviewCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          delete: {
            args: Prisma.ReviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          update: {
            args: Prisma.ReviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          deleteMany: {
            args: Prisma.ReviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReviewUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>[]
          }
          upsert: {
            args: Prisma.ReviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReviewPayload>
          }
          aggregate: {
            args: Prisma.ReviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReview>
          }
          groupBy: {
            args: Prisma.ReviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReviewCountArgs<ExtArgs>
            result: $Utils.Optional<ReviewCountAggregateOutputType> | number
          }
        }
      }
      Payout: {
        payload: Prisma.$PayoutPayload<ExtArgs>
        fields: Prisma.PayoutFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PayoutFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PayoutFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          findFirst: {
            args: Prisma.PayoutFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PayoutFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          findMany: {
            args: Prisma.PayoutFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>[]
          }
          create: {
            args: Prisma.PayoutCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          createMany: {
            args: Prisma.PayoutCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PayoutCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>[]
          }
          delete: {
            args: Prisma.PayoutDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          update: {
            args: Prisma.PayoutUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          deleteMany: {
            args: Prisma.PayoutDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PayoutUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PayoutUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>[]
          }
          upsert: {
            args: Prisma.PayoutUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PayoutPayload>
          }
          aggregate: {
            args: Prisma.PayoutAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayout>
          }
          groupBy: {
            args: Prisma.PayoutGroupByArgs<ExtArgs>
            result: $Utils.Optional<PayoutGroupByOutputType>[]
          }
          count: {
            args: Prisma.PayoutCountArgs<ExtArgs>
            result: $Utils.Optional<PayoutCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    session?: SessionOmit
    space?: SpaceOmit
    spaceCategory?: SpaceCategoryOmit
    amenity?: AmenityOmit
    spaceAmenity?: SpaceAmenityOmit
    availability?: AvailabilityOmit
    blockedDate?: BlockedDateOmit
    booking?: BookingOmit
    review?: ReviewOmit
    payout?: PayoutOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    sessions: number
    spaces: number
    bookings: number
    reviews: number
    payouts: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
    spaces?: boolean | UserCountOutputTypeCountSpacesArgs
    bookings?: boolean | UserCountOutputTypeCountBookingsArgs
    reviews?: boolean | UserCountOutputTypeCountReviewsArgs
    payouts?: boolean | UserCountOutputTypeCountPayoutsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSpacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountReviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountPayoutsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutWhereInput
  }


  /**
   * Count Type SpaceCountOutputType
   */

  export type SpaceCountOutputType = {
    amenities: number
    availability: number
    blockedDates: number
    bookings: number
    reviews: number
  }

  export type SpaceCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    amenities?: boolean | SpaceCountOutputTypeCountAmenitiesArgs
    availability?: boolean | SpaceCountOutputTypeCountAvailabilityArgs
    blockedDates?: boolean | SpaceCountOutputTypeCountBlockedDatesArgs
    bookings?: boolean | SpaceCountOutputTypeCountBookingsArgs
    reviews?: boolean | SpaceCountOutputTypeCountReviewsArgs
  }

  // Custom InputTypes
  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCountOutputType
     */
    select?: SpaceCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeCountAmenitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceAmenityWhereInput
  }

  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeCountAvailabilityArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AvailabilityWhereInput
  }

  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeCountBlockedDatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlockedDateWhereInput
  }

  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeCountBookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
  }

  /**
   * SpaceCountOutputType without action
   */
  export type SpaceCountOutputTypeCountReviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
  }


  /**
   * Count Type SpaceCategoryCountOutputType
   */

  export type SpaceCategoryCountOutputType = {
    spaces: number
  }

  export type SpaceCategoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spaces?: boolean | SpaceCategoryCountOutputTypeCountSpacesArgs
  }

  // Custom InputTypes
  /**
   * SpaceCategoryCountOutputType without action
   */
  export type SpaceCategoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategoryCountOutputType
     */
    select?: SpaceCategoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SpaceCategoryCountOutputType without action
   */
  export type SpaceCategoryCountOutputTypeCountSpacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceWhereInput
  }


  /**
   * Count Type AmenityCountOutputType
   */

  export type AmenityCountOutputType = {
    spaces: number
  }

  export type AmenityCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spaces?: boolean | AmenityCountOutputTypeCountSpacesArgs
  }

  // Custom InputTypes
  /**
   * AmenityCountOutputType without action
   */
  export type AmenityCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AmenityCountOutputType
     */
    select?: AmenityCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AmenityCountOutputType without action
   */
  export type AmenityCountOutputTypeCountSpacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceAmenityWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    username: string | null
    name: string | null
    password: string | null
    role: $Enums.Role | null
    emailVerified: boolean | null
    image: string | null
    phone: string | null
    bio: string | null
    createdAt: Date | null
    updatedAt: Date | null
    hostVerified: boolean | null
    hostingSince: Date | null
    stripeAccountId: string | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    username: string | null
    name: string | null
    password: string | null
    role: $Enums.Role | null
    emailVerified: boolean | null
    image: string | null
    phone: string | null
    bio: string | null
    createdAt: Date | null
    updatedAt: Date | null
    hostVerified: boolean | null
    hostingSince: Date | null
    stripeAccountId: string | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    username: number
    name: number
    password: number
    role: number
    emailVerified: number
    image: number
    phone: number
    bio: number
    createdAt: number
    updatedAt: number
    hostVerified: number
    hostingSince: number
    stripeAccountId: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    username?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    image?: true
    phone?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
    hostVerified?: true
    hostingSince?: true
    stripeAccountId?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    username?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    image?: true
    phone?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
    hostVerified?: true
    hostingSince?: true
    stripeAccountId?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    username?: true
    name?: true
    password?: true
    role?: true
    emailVerified?: true
    image?: true
    phone?: true
    bio?: true
    createdAt?: true
    updatedAt?: true
    hostVerified?: true
    hostingSince?: true
    stripeAccountId?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    username: string
    name: string | null
    password: string
    role: $Enums.Role
    emailVerified: boolean
    image: string | null
    phone: string | null
    bio: string | null
    createdAt: Date
    updatedAt: Date
    hostVerified: boolean
    hostingSince: Date | null
    stripeAccountId: string | null
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    username?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    image?: boolean
    phone?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostVerified?: boolean
    hostingSince?: boolean
    stripeAccountId?: boolean
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    spaces?: boolean | User$spacesArgs<ExtArgs>
    bookings?: boolean | User$bookingsArgs<ExtArgs>
    reviews?: boolean | User$reviewsArgs<ExtArgs>
    payouts?: boolean | User$payoutsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    username?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    image?: boolean
    phone?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostVerified?: boolean
    hostingSince?: boolean
    stripeAccountId?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    username?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    image?: boolean
    phone?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostVerified?: boolean
    hostingSince?: boolean
    stripeAccountId?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    username?: boolean
    name?: boolean
    password?: boolean
    role?: boolean
    emailVerified?: boolean
    image?: boolean
    phone?: boolean
    bio?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostVerified?: boolean
    hostingSince?: boolean
    stripeAccountId?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "username" | "name" | "password" | "role" | "emailVerified" | "image" | "phone" | "bio" | "createdAt" | "updatedAt" | "hostVerified" | "hostingSince" | "stripeAccountId", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    spaces?: boolean | User$spacesArgs<ExtArgs>
    bookings?: boolean | User$bookingsArgs<ExtArgs>
    reviews?: boolean | User$reviewsArgs<ExtArgs>
    payouts?: boolean | User$payoutsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      sessions: Prisma.$SessionPayload<ExtArgs>[]
      spaces: Prisma.$SpacePayload<ExtArgs>[]
      bookings: Prisma.$BookingPayload<ExtArgs>[]
      reviews: Prisma.$ReviewPayload<ExtArgs>[]
      payouts: Prisma.$PayoutPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      username: string
      name: string | null
      password: string
      role: $Enums.Role
      emailVerified: boolean
      image: string | null
      phone: string | null
      bio: string | null
      createdAt: Date
      updatedAt: Date
      hostVerified: boolean
      hostingSince: Date | null
      stripeAccountId: string | null
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    spaces<T extends User$spacesArgs<ExtArgs> = {}>(args?: Subset<T, User$spacesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    bookings<T extends User$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, User$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    reviews<T extends User$reviewsArgs<ExtArgs> = {}>(args?: Subset<T, User$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    payouts<T extends User$payoutsArgs<ExtArgs> = {}>(args?: Subset<T, User$payoutsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly username: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'Role'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly image: FieldRef<"User", 'String'>
    readonly phone: FieldRef<"User", 'String'>
    readonly bio: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
    readonly hostVerified: FieldRef<"User", 'Boolean'>
    readonly hostingSince: FieldRef<"User", 'DateTime'>
    readonly stripeAccountId: FieldRef<"User", 'String'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * User.spaces
   */
  export type User$spacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    where?: SpaceWhereInput
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    cursor?: SpaceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpaceScalarFieldEnum | SpaceScalarFieldEnum[]
  }

  /**
   * User.bookings
   */
  export type User$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * User.reviews
   */
  export type User$reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    cursor?: ReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * User.payouts
   */
  export type User$payoutsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    where?: PayoutWhereInput
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    cursor?: PayoutWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    userId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    userId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    userId: string
    token: string
    expiresAt: Date
    createdAt: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    id?: boolean
    userId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["session"]>
  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions and returns the data updated in the database.
     * @param {SessionUpdateManyAndReturnArgs} args - Arguments to update many Sessions.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
    readonly token: FieldRef<"Session", 'String'>
    readonly expiresAt: FieldRef<"Session", 'DateTime'>
    readonly createdAt: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session updateManyAndReturn
   */
  export type SessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Model Space
   */

  export type AggregateSpace = {
    _count: SpaceCountAggregateOutputType | null
    _avg: SpaceAvgAggregateOutputType | null
    _sum: SpaceSumAggregateOutputType | null
    _min: SpaceMinAggregateOutputType | null
    _max: SpaceMaxAggregateOutputType | null
  }

  export type SpaceAvgAggregateOutputType = {
    id: number | null
    pricePerHour: number | null
    pricePerDay: number | null
    depositPercent: number | null
    capacity: number | null
    minBookingHours: number | null
    maxBookingHours: number | null
    latitude: number | null
    longitude: number | null
  }

  export type SpaceSumAggregateOutputType = {
    id: number | null
    pricePerHour: number | null
    pricePerDay: number | null
    depositPercent: number | null
    capacity: number | null
    minBookingHours: number | null
    maxBookingHours: number | null
    latitude: number | null
    longitude: number | null
  }

  export type SpaceMinAggregateOutputType = {
    id: number | null
    name: string | null
    shortDescription: string | null
    description: string | null
    spaceType: $Enums.SpaceType | null
    pricingType: $Enums.PricingType | null
    pricePerHour: number | null
    pricePerDay: number | null
    depositPercent: number | null
    capacity: number | null
    minBookingHours: number | null
    maxBookingHours: number | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    latitude: number | null
    longitude: number | null
    isActive: boolean | null
    instantBook: boolean | null
    cancellationPolicy: $Enums.CancellationPolicy | null
    houseRules: string | null
    createdAt: Date | null
    updatedAt: Date | null
    hostId: string | null
    categorySlug: string | null
  }

  export type SpaceMaxAggregateOutputType = {
    id: number | null
    name: string | null
    shortDescription: string | null
    description: string | null
    spaceType: $Enums.SpaceType | null
    pricingType: $Enums.PricingType | null
    pricePerHour: number | null
    pricePerDay: number | null
    depositPercent: number | null
    capacity: number | null
    minBookingHours: number | null
    maxBookingHours: number | null
    address: string | null
    city: string | null
    state: string | null
    country: string | null
    postalCode: string | null
    latitude: number | null
    longitude: number | null
    isActive: boolean | null
    instantBook: boolean | null
    cancellationPolicy: $Enums.CancellationPolicy | null
    houseRules: string | null
    createdAt: Date | null
    updatedAt: Date | null
    hostId: string | null
    categorySlug: string | null
  }

  export type SpaceCountAggregateOutputType = {
    id: number
    name: number
    shortDescription: number
    description: number
    spaceType: number
    pricingType: number
    pricePerHour: number
    pricePerDay: number
    depositPercent: number
    capacity: number
    minBookingHours: number
    maxBookingHours: number
    images: number
    address: number
    city: number
    state: number
    country: number
    postalCode: number
    latitude: number
    longitude: number
    isActive: number
    instantBook: number
    cancellationPolicy: number
    houseRules: number
    createdAt: number
    updatedAt: number
    hostId: number
    categorySlug: number
    _all: number
  }


  export type SpaceAvgAggregateInputType = {
    id?: true
    pricePerHour?: true
    pricePerDay?: true
    depositPercent?: true
    capacity?: true
    minBookingHours?: true
    maxBookingHours?: true
    latitude?: true
    longitude?: true
  }

  export type SpaceSumAggregateInputType = {
    id?: true
    pricePerHour?: true
    pricePerDay?: true
    depositPercent?: true
    capacity?: true
    minBookingHours?: true
    maxBookingHours?: true
    latitude?: true
    longitude?: true
  }

  export type SpaceMinAggregateInputType = {
    id?: true
    name?: true
    shortDescription?: true
    description?: true
    spaceType?: true
    pricingType?: true
    pricePerHour?: true
    pricePerDay?: true
    depositPercent?: true
    capacity?: true
    minBookingHours?: true
    maxBookingHours?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    isActive?: true
    instantBook?: true
    cancellationPolicy?: true
    houseRules?: true
    createdAt?: true
    updatedAt?: true
    hostId?: true
    categorySlug?: true
  }

  export type SpaceMaxAggregateInputType = {
    id?: true
    name?: true
    shortDescription?: true
    description?: true
    spaceType?: true
    pricingType?: true
    pricePerHour?: true
    pricePerDay?: true
    depositPercent?: true
    capacity?: true
    minBookingHours?: true
    maxBookingHours?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    isActive?: true
    instantBook?: true
    cancellationPolicy?: true
    houseRules?: true
    createdAt?: true
    updatedAt?: true
    hostId?: true
    categorySlug?: true
  }

  export type SpaceCountAggregateInputType = {
    id?: true
    name?: true
    shortDescription?: true
    description?: true
    spaceType?: true
    pricingType?: true
    pricePerHour?: true
    pricePerDay?: true
    depositPercent?: true
    capacity?: true
    minBookingHours?: true
    maxBookingHours?: true
    images?: true
    address?: true
    city?: true
    state?: true
    country?: true
    postalCode?: true
    latitude?: true
    longitude?: true
    isActive?: true
    instantBook?: true
    cancellationPolicy?: true
    houseRules?: true
    createdAt?: true
    updatedAt?: true
    hostId?: true
    categorySlug?: true
    _all?: true
  }

  export type SpaceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Space to aggregate.
     */
    where?: SpaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Spaces to fetch.
     */
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SpaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Spaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Spaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Spaces
    **/
    _count?: true | SpaceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SpaceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SpaceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SpaceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SpaceMaxAggregateInputType
  }

  export type GetSpaceAggregateType<T extends SpaceAggregateArgs> = {
        [P in keyof T & keyof AggregateSpace]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpace[P]>
      : GetScalarType<T[P], AggregateSpace[P]>
  }




  export type SpaceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceWhereInput
    orderBy?: SpaceOrderByWithAggregationInput | SpaceOrderByWithAggregationInput[]
    by: SpaceScalarFieldEnum[] | SpaceScalarFieldEnum
    having?: SpaceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpaceCountAggregateInputType | true
    _avg?: SpaceAvgAggregateInputType
    _sum?: SpaceSumAggregateInputType
    _min?: SpaceMinAggregateInputType
    _max?: SpaceMaxAggregateInputType
  }

  export type SpaceGroupByOutputType = {
    id: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour: number | null
    pricePerDay: number | null
    depositPercent: number
    capacity: number
    minBookingHours: number | null
    maxBookingHours: number | null
    images: JsonValue
    address: string
    city: string
    state: string | null
    country: string
    postalCode: string | null
    latitude: number | null
    longitude: number | null
    isActive: boolean
    instantBook: boolean
    cancellationPolicy: $Enums.CancellationPolicy
    houseRules: string | null
    createdAt: Date
    updatedAt: Date
    hostId: string
    categorySlug: string
    _count: SpaceCountAggregateOutputType | null
    _avg: SpaceAvgAggregateOutputType | null
    _sum: SpaceSumAggregateOutputType | null
    _min: SpaceMinAggregateOutputType | null
    _max: SpaceMaxAggregateOutputType | null
  }

  type GetSpaceGroupByPayload<T extends SpaceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpaceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpaceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpaceGroupByOutputType[P]>
            : GetScalarType<T[P], SpaceGroupByOutputType[P]>
        }
      >
    >


  export type SpaceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    shortDescription?: boolean
    description?: boolean
    spaceType?: boolean
    pricingType?: boolean
    pricePerHour?: boolean
    pricePerDay?: boolean
    depositPercent?: boolean
    capacity?: boolean
    minBookingHours?: boolean
    maxBookingHours?: boolean
    images?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: boolean
    houseRules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostId?: boolean
    categorySlug?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
    amenities?: boolean | Space$amenitiesArgs<ExtArgs>
    availability?: boolean | Space$availabilityArgs<ExtArgs>
    blockedDates?: boolean | Space$blockedDatesArgs<ExtArgs>
    bookings?: boolean | Space$bookingsArgs<ExtArgs>
    reviews?: boolean | Space$reviewsArgs<ExtArgs>
    _count?: boolean | SpaceCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["space"]>

  export type SpaceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    shortDescription?: boolean
    description?: boolean
    spaceType?: boolean
    pricingType?: boolean
    pricePerHour?: boolean
    pricePerDay?: boolean
    depositPercent?: boolean
    capacity?: boolean
    minBookingHours?: boolean
    maxBookingHours?: boolean
    images?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: boolean
    houseRules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostId?: boolean
    categorySlug?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["space"]>

  export type SpaceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    shortDescription?: boolean
    description?: boolean
    spaceType?: boolean
    pricingType?: boolean
    pricePerHour?: boolean
    pricePerDay?: boolean
    depositPercent?: boolean
    capacity?: boolean
    minBookingHours?: boolean
    maxBookingHours?: boolean
    images?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: boolean
    houseRules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostId?: boolean
    categorySlug?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["space"]>

  export type SpaceSelectScalar = {
    id?: boolean
    name?: boolean
    shortDescription?: boolean
    description?: boolean
    spaceType?: boolean
    pricingType?: boolean
    pricePerHour?: boolean
    pricePerDay?: boolean
    depositPercent?: boolean
    capacity?: boolean
    minBookingHours?: boolean
    maxBookingHours?: boolean
    images?: boolean
    address?: boolean
    city?: boolean
    state?: boolean
    country?: boolean
    postalCode?: boolean
    latitude?: boolean
    longitude?: boolean
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: boolean
    houseRules?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    hostId?: boolean
    categorySlug?: boolean
  }

  export type SpaceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "shortDescription" | "description" | "spaceType" | "pricingType" | "pricePerHour" | "pricePerDay" | "depositPercent" | "capacity" | "minBookingHours" | "maxBookingHours" | "images" | "address" | "city" | "state" | "country" | "postalCode" | "latitude" | "longitude" | "isActive" | "instantBook" | "cancellationPolicy" | "houseRules" | "createdAt" | "updatedAt" | "hostId" | "categorySlug", ExtArgs["result"]["space"]>
  export type SpaceInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
    amenities?: boolean | Space$amenitiesArgs<ExtArgs>
    availability?: boolean | Space$availabilityArgs<ExtArgs>
    blockedDates?: boolean | Space$blockedDatesArgs<ExtArgs>
    bookings?: boolean | Space$bookingsArgs<ExtArgs>
    reviews?: boolean | Space$reviewsArgs<ExtArgs>
    _count?: boolean | SpaceCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SpaceIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
  }
  export type SpaceIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
    category?: boolean | SpaceCategoryDefaultArgs<ExtArgs>
  }

  export type $SpacePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Space"
    objects: {
      host: Prisma.$UserPayload<ExtArgs>
      category: Prisma.$SpaceCategoryPayload<ExtArgs>
      amenities: Prisma.$SpaceAmenityPayload<ExtArgs>[]
      availability: Prisma.$AvailabilityPayload<ExtArgs>[]
      blockedDates: Prisma.$BlockedDatePayload<ExtArgs>[]
      bookings: Prisma.$BookingPayload<ExtArgs>[]
      reviews: Prisma.$ReviewPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      shortDescription: string
      description: string
      spaceType: $Enums.SpaceType
      pricingType: $Enums.PricingType
      pricePerHour: number | null
      pricePerDay: number | null
      depositPercent: number
      capacity: number
      minBookingHours: number | null
      maxBookingHours: number | null
      images: Prisma.JsonValue
      address: string
      city: string
      state: string | null
      country: string
      postalCode: string | null
      latitude: number | null
      longitude: number | null
      isActive: boolean
      instantBook: boolean
      cancellationPolicy: $Enums.CancellationPolicy
      houseRules: string | null
      createdAt: Date
      updatedAt: Date
      hostId: string
      categorySlug: string
    }, ExtArgs["result"]["space"]>
    composites: {}
  }

  type SpaceGetPayload<S extends boolean | null | undefined | SpaceDefaultArgs> = $Result.GetResult<Prisma.$SpacePayload, S>

  type SpaceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpaceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpaceCountAggregateInputType | true
    }

  export interface SpaceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Space'], meta: { name: 'Space' } }
    /**
     * Find zero or one Space that matches the filter.
     * @param {SpaceFindUniqueArgs} args - Arguments to find a Space
     * @example
     * // Get one Space
     * const space = await prisma.space.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpaceFindUniqueArgs>(args: SelectSubset<T, SpaceFindUniqueArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Space that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpaceFindUniqueOrThrowArgs} args - Arguments to find a Space
     * @example
     * // Get one Space
     * const space = await prisma.space.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpaceFindUniqueOrThrowArgs>(args: SelectSubset<T, SpaceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Space that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceFindFirstArgs} args - Arguments to find a Space
     * @example
     * // Get one Space
     * const space = await prisma.space.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpaceFindFirstArgs>(args?: SelectSubset<T, SpaceFindFirstArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Space that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceFindFirstOrThrowArgs} args - Arguments to find a Space
     * @example
     * // Get one Space
     * const space = await prisma.space.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpaceFindFirstOrThrowArgs>(args?: SelectSubset<T, SpaceFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Spaces that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Spaces
     * const spaces = await prisma.space.findMany()
     * 
     * // Get first 10 Spaces
     * const spaces = await prisma.space.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const spaceWithIdOnly = await prisma.space.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SpaceFindManyArgs>(args?: SelectSubset<T, SpaceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Space.
     * @param {SpaceCreateArgs} args - Arguments to create a Space.
     * @example
     * // Create one Space
     * const Space = await prisma.space.create({
     *   data: {
     *     // ... data to create a Space
     *   }
     * })
     * 
     */
    create<T extends SpaceCreateArgs>(args: SelectSubset<T, SpaceCreateArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Spaces.
     * @param {SpaceCreateManyArgs} args - Arguments to create many Spaces.
     * @example
     * // Create many Spaces
     * const space = await prisma.space.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SpaceCreateManyArgs>(args?: SelectSubset<T, SpaceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Spaces and returns the data saved in the database.
     * @param {SpaceCreateManyAndReturnArgs} args - Arguments to create many Spaces.
     * @example
     * // Create many Spaces
     * const space = await prisma.space.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Spaces and only return the `id`
     * const spaceWithIdOnly = await prisma.space.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SpaceCreateManyAndReturnArgs>(args?: SelectSubset<T, SpaceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Space.
     * @param {SpaceDeleteArgs} args - Arguments to delete one Space.
     * @example
     * // Delete one Space
     * const Space = await prisma.space.delete({
     *   where: {
     *     // ... filter to delete one Space
     *   }
     * })
     * 
     */
    delete<T extends SpaceDeleteArgs>(args: SelectSubset<T, SpaceDeleteArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Space.
     * @param {SpaceUpdateArgs} args - Arguments to update one Space.
     * @example
     * // Update one Space
     * const space = await prisma.space.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SpaceUpdateArgs>(args: SelectSubset<T, SpaceUpdateArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Spaces.
     * @param {SpaceDeleteManyArgs} args - Arguments to filter Spaces to delete.
     * @example
     * // Delete a few Spaces
     * const { count } = await prisma.space.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SpaceDeleteManyArgs>(args?: SelectSubset<T, SpaceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Spaces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Spaces
     * const space = await prisma.space.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SpaceUpdateManyArgs>(args: SelectSubset<T, SpaceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Spaces and returns the data updated in the database.
     * @param {SpaceUpdateManyAndReturnArgs} args - Arguments to update many Spaces.
     * @example
     * // Update many Spaces
     * const space = await prisma.space.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Spaces and only return the `id`
     * const spaceWithIdOnly = await prisma.space.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SpaceUpdateManyAndReturnArgs>(args: SelectSubset<T, SpaceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Space.
     * @param {SpaceUpsertArgs} args - Arguments to update or create a Space.
     * @example
     * // Update or create a Space
     * const space = await prisma.space.upsert({
     *   create: {
     *     // ... data to create a Space
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Space we want to update
     *   }
     * })
     */
    upsert<T extends SpaceUpsertArgs>(args: SelectSubset<T, SpaceUpsertArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Spaces.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCountArgs} args - Arguments to filter Spaces to count.
     * @example
     * // Count the number of Spaces
     * const count = await prisma.space.count({
     *   where: {
     *     // ... the filter for the Spaces we want to count
     *   }
     * })
    **/
    count<T extends SpaceCountArgs>(
      args?: Subset<T, SpaceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpaceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Space.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpaceAggregateArgs>(args: Subset<T, SpaceAggregateArgs>): Prisma.PrismaPromise<GetSpaceAggregateType<T>>

    /**
     * Group by Space.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SpaceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpaceGroupByArgs['orderBy'] }
        : { orderBy?: SpaceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpaceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpaceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Space model
   */
  readonly fields: SpaceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Space.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpaceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    host<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    category<T extends SpaceCategoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceCategoryDefaultArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    amenities<T extends Space$amenitiesArgs<ExtArgs> = {}>(args?: Subset<T, Space$amenitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    availability<T extends Space$availabilityArgs<ExtArgs> = {}>(args?: Subset<T, Space$availabilityArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    blockedDates<T extends Space$blockedDatesArgs<ExtArgs> = {}>(args?: Subset<T, Space$blockedDatesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    bookings<T extends Space$bookingsArgs<ExtArgs> = {}>(args?: Subset<T, Space$bookingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    reviews<T extends Space$reviewsArgs<ExtArgs> = {}>(args?: Subset<T, Space$reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Space model
   */
  interface SpaceFieldRefs {
    readonly id: FieldRef<"Space", 'Int'>
    readonly name: FieldRef<"Space", 'String'>
    readonly shortDescription: FieldRef<"Space", 'String'>
    readonly description: FieldRef<"Space", 'String'>
    readonly spaceType: FieldRef<"Space", 'SpaceType'>
    readonly pricingType: FieldRef<"Space", 'PricingType'>
    readonly pricePerHour: FieldRef<"Space", 'Int'>
    readonly pricePerDay: FieldRef<"Space", 'Int'>
    readonly depositPercent: FieldRef<"Space", 'Int'>
    readonly capacity: FieldRef<"Space", 'Int'>
    readonly minBookingHours: FieldRef<"Space", 'Int'>
    readonly maxBookingHours: FieldRef<"Space", 'Int'>
    readonly images: FieldRef<"Space", 'Json'>
    readonly address: FieldRef<"Space", 'String'>
    readonly city: FieldRef<"Space", 'String'>
    readonly state: FieldRef<"Space", 'String'>
    readonly country: FieldRef<"Space", 'String'>
    readonly postalCode: FieldRef<"Space", 'String'>
    readonly latitude: FieldRef<"Space", 'Float'>
    readonly longitude: FieldRef<"Space", 'Float'>
    readonly isActive: FieldRef<"Space", 'Boolean'>
    readonly instantBook: FieldRef<"Space", 'Boolean'>
    readonly cancellationPolicy: FieldRef<"Space", 'CancellationPolicy'>
    readonly houseRules: FieldRef<"Space", 'String'>
    readonly createdAt: FieldRef<"Space", 'DateTime'>
    readonly updatedAt: FieldRef<"Space", 'DateTime'>
    readonly hostId: FieldRef<"Space", 'String'>
    readonly categorySlug: FieldRef<"Space", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Space findUnique
   */
  export type SpaceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter, which Space to fetch.
     */
    where: SpaceWhereUniqueInput
  }

  /**
   * Space findUniqueOrThrow
   */
  export type SpaceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter, which Space to fetch.
     */
    where: SpaceWhereUniqueInput
  }

  /**
   * Space findFirst
   */
  export type SpaceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter, which Space to fetch.
     */
    where?: SpaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Spaces to fetch.
     */
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Spaces.
     */
    cursor?: SpaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Spaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Spaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Spaces.
     */
    distinct?: SpaceScalarFieldEnum | SpaceScalarFieldEnum[]
  }

  /**
   * Space findFirstOrThrow
   */
  export type SpaceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter, which Space to fetch.
     */
    where?: SpaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Spaces to fetch.
     */
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Spaces.
     */
    cursor?: SpaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Spaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Spaces.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Spaces.
     */
    distinct?: SpaceScalarFieldEnum | SpaceScalarFieldEnum[]
  }

  /**
   * Space findMany
   */
  export type SpaceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter, which Spaces to fetch.
     */
    where?: SpaceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Spaces to fetch.
     */
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Spaces.
     */
    cursor?: SpaceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Spaces from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Spaces.
     */
    skip?: number
    distinct?: SpaceScalarFieldEnum | SpaceScalarFieldEnum[]
  }

  /**
   * Space create
   */
  export type SpaceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * The data needed to create a Space.
     */
    data: XOR<SpaceCreateInput, SpaceUncheckedCreateInput>
  }

  /**
   * Space createMany
   */
  export type SpaceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Spaces.
     */
    data: SpaceCreateManyInput | SpaceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Space createManyAndReturn
   */
  export type SpaceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * The data used to create many Spaces.
     */
    data: SpaceCreateManyInput | SpaceCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Space update
   */
  export type SpaceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * The data needed to update a Space.
     */
    data: XOR<SpaceUpdateInput, SpaceUncheckedUpdateInput>
    /**
     * Choose, which Space to update.
     */
    where: SpaceWhereUniqueInput
  }

  /**
   * Space updateMany
   */
  export type SpaceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Spaces.
     */
    data: XOR<SpaceUpdateManyMutationInput, SpaceUncheckedUpdateManyInput>
    /**
     * Filter which Spaces to update
     */
    where?: SpaceWhereInput
    /**
     * Limit how many Spaces to update.
     */
    limit?: number
  }

  /**
   * Space updateManyAndReturn
   */
  export type SpaceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * The data used to update Spaces.
     */
    data: XOR<SpaceUpdateManyMutationInput, SpaceUncheckedUpdateManyInput>
    /**
     * Filter which Spaces to update
     */
    where?: SpaceWhereInput
    /**
     * Limit how many Spaces to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Space upsert
   */
  export type SpaceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * The filter to search for the Space to update in case it exists.
     */
    where: SpaceWhereUniqueInput
    /**
     * In case the Space found by the `where` argument doesn't exist, create a new Space with this data.
     */
    create: XOR<SpaceCreateInput, SpaceUncheckedCreateInput>
    /**
     * In case the Space was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpaceUpdateInput, SpaceUncheckedUpdateInput>
  }

  /**
   * Space delete
   */
  export type SpaceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    /**
     * Filter which Space to delete.
     */
    where: SpaceWhereUniqueInput
  }

  /**
   * Space deleteMany
   */
  export type SpaceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Spaces to delete
     */
    where?: SpaceWhereInput
    /**
     * Limit how many Spaces to delete.
     */
    limit?: number
  }

  /**
   * Space.amenities
   */
  export type Space$amenitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    where?: SpaceAmenityWhereInput
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    cursor?: SpaceAmenityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpaceAmenityScalarFieldEnum | SpaceAmenityScalarFieldEnum[]
  }

  /**
   * Space.availability
   */
  export type Space$availabilityArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    where?: AvailabilityWhereInput
    orderBy?: AvailabilityOrderByWithRelationInput | AvailabilityOrderByWithRelationInput[]
    cursor?: AvailabilityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AvailabilityScalarFieldEnum | AvailabilityScalarFieldEnum[]
  }

  /**
   * Space.blockedDates
   */
  export type Space$blockedDatesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    where?: BlockedDateWhereInput
    orderBy?: BlockedDateOrderByWithRelationInput | BlockedDateOrderByWithRelationInput[]
    cursor?: BlockedDateWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BlockedDateScalarFieldEnum | BlockedDateScalarFieldEnum[]
  }

  /**
   * Space.bookings
   */
  export type Space$bookingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    cursor?: BookingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Space.reviews
   */
  export type Space$reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    cursor?: ReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Space without action
   */
  export type SpaceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
  }


  /**
   * Model SpaceCategory
   */

  export type AggregateSpaceCategory = {
    _count: SpaceCategoryCountAggregateOutputType | null
    _avg: SpaceCategoryAvgAggregateOutputType | null
    _sum: SpaceCategorySumAggregateOutputType | null
    _min: SpaceCategoryMinAggregateOutputType | null
    _max: SpaceCategoryMaxAggregateOutputType | null
  }

  export type SpaceCategoryAvgAggregateOutputType = {
    id: number | null
  }

  export type SpaceCategorySumAggregateOutputType = {
    id: number | null
  }

  export type SpaceCategoryMinAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
  }

  export type SpaceCategoryMaxAggregateOutputType = {
    id: number | null
    name: string | null
    slug: string | null
    description: string | null
    icon: string | null
  }

  export type SpaceCategoryCountAggregateOutputType = {
    id: number
    name: number
    slug: number
    description: number
    icon: number
    _all: number
  }


  export type SpaceCategoryAvgAggregateInputType = {
    id?: true
  }

  export type SpaceCategorySumAggregateInputType = {
    id?: true
  }

  export type SpaceCategoryMinAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
  }

  export type SpaceCategoryMaxAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
  }

  export type SpaceCategoryCountAggregateInputType = {
    id?: true
    name?: true
    slug?: true
    description?: true
    icon?: true
    _all?: true
  }

  export type SpaceCategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpaceCategory to aggregate.
     */
    where?: SpaceCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceCategories to fetch.
     */
    orderBy?: SpaceCategoryOrderByWithRelationInput | SpaceCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SpaceCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SpaceCategories
    **/
    _count?: true | SpaceCategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SpaceCategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SpaceCategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SpaceCategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SpaceCategoryMaxAggregateInputType
  }

  export type GetSpaceCategoryAggregateType<T extends SpaceCategoryAggregateArgs> = {
        [P in keyof T & keyof AggregateSpaceCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpaceCategory[P]>
      : GetScalarType<T[P], AggregateSpaceCategory[P]>
  }




  export type SpaceCategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceCategoryWhereInput
    orderBy?: SpaceCategoryOrderByWithAggregationInput | SpaceCategoryOrderByWithAggregationInput[]
    by: SpaceCategoryScalarFieldEnum[] | SpaceCategoryScalarFieldEnum
    having?: SpaceCategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpaceCategoryCountAggregateInputType | true
    _avg?: SpaceCategoryAvgAggregateInputType
    _sum?: SpaceCategorySumAggregateInputType
    _min?: SpaceCategoryMinAggregateInputType
    _max?: SpaceCategoryMaxAggregateInputType
  }

  export type SpaceCategoryGroupByOutputType = {
    id: number
    name: string
    slug: string
    description: string | null
    icon: string | null
    _count: SpaceCategoryCountAggregateOutputType | null
    _avg: SpaceCategoryAvgAggregateOutputType | null
    _sum: SpaceCategorySumAggregateOutputType | null
    _min: SpaceCategoryMinAggregateOutputType | null
    _max: SpaceCategoryMaxAggregateOutputType | null
  }

  type GetSpaceCategoryGroupByPayload<T extends SpaceCategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpaceCategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpaceCategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpaceCategoryGroupByOutputType[P]>
            : GetScalarType<T[P], SpaceCategoryGroupByOutputType[P]>
        }
      >
    >


  export type SpaceCategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
    spaces?: boolean | SpaceCategory$spacesArgs<ExtArgs>
    _count?: boolean | SpaceCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spaceCategory"]>

  export type SpaceCategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
  }, ExtArgs["result"]["spaceCategory"]>

  export type SpaceCategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
  }, ExtArgs["result"]["spaceCategory"]>

  export type SpaceCategorySelectScalar = {
    id?: boolean
    name?: boolean
    slug?: boolean
    description?: boolean
    icon?: boolean
  }

  export type SpaceCategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "slug" | "description" | "icon", ExtArgs["result"]["spaceCategory"]>
  export type SpaceCategoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spaces?: boolean | SpaceCategory$spacesArgs<ExtArgs>
    _count?: boolean | SpaceCategoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SpaceCategoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SpaceCategoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SpaceCategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SpaceCategory"
    objects: {
      spaces: Prisma.$SpacePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      slug: string
      description: string | null
      icon: string | null
    }, ExtArgs["result"]["spaceCategory"]>
    composites: {}
  }

  type SpaceCategoryGetPayload<S extends boolean | null | undefined | SpaceCategoryDefaultArgs> = $Result.GetResult<Prisma.$SpaceCategoryPayload, S>

  type SpaceCategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpaceCategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpaceCategoryCountAggregateInputType | true
    }

  export interface SpaceCategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SpaceCategory'], meta: { name: 'SpaceCategory' } }
    /**
     * Find zero or one SpaceCategory that matches the filter.
     * @param {SpaceCategoryFindUniqueArgs} args - Arguments to find a SpaceCategory
     * @example
     * // Get one SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpaceCategoryFindUniqueArgs>(args: SelectSubset<T, SpaceCategoryFindUniqueArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SpaceCategory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpaceCategoryFindUniqueOrThrowArgs} args - Arguments to find a SpaceCategory
     * @example
     * // Get one SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpaceCategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, SpaceCategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpaceCategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryFindFirstArgs} args - Arguments to find a SpaceCategory
     * @example
     * // Get one SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpaceCategoryFindFirstArgs>(args?: SelectSubset<T, SpaceCategoryFindFirstArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpaceCategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryFindFirstOrThrowArgs} args - Arguments to find a SpaceCategory
     * @example
     * // Get one SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpaceCategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, SpaceCategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SpaceCategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SpaceCategories
     * const spaceCategories = await prisma.spaceCategory.findMany()
     * 
     * // Get first 10 SpaceCategories
     * const spaceCategories = await prisma.spaceCategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const spaceCategoryWithIdOnly = await prisma.spaceCategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SpaceCategoryFindManyArgs>(args?: SelectSubset<T, SpaceCategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SpaceCategory.
     * @param {SpaceCategoryCreateArgs} args - Arguments to create a SpaceCategory.
     * @example
     * // Create one SpaceCategory
     * const SpaceCategory = await prisma.spaceCategory.create({
     *   data: {
     *     // ... data to create a SpaceCategory
     *   }
     * })
     * 
     */
    create<T extends SpaceCategoryCreateArgs>(args: SelectSubset<T, SpaceCategoryCreateArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SpaceCategories.
     * @param {SpaceCategoryCreateManyArgs} args - Arguments to create many SpaceCategories.
     * @example
     * // Create many SpaceCategories
     * const spaceCategory = await prisma.spaceCategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SpaceCategoryCreateManyArgs>(args?: SelectSubset<T, SpaceCategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SpaceCategories and returns the data saved in the database.
     * @param {SpaceCategoryCreateManyAndReturnArgs} args - Arguments to create many SpaceCategories.
     * @example
     * // Create many SpaceCategories
     * const spaceCategory = await prisma.spaceCategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SpaceCategories and only return the `id`
     * const spaceCategoryWithIdOnly = await prisma.spaceCategory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SpaceCategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, SpaceCategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SpaceCategory.
     * @param {SpaceCategoryDeleteArgs} args - Arguments to delete one SpaceCategory.
     * @example
     * // Delete one SpaceCategory
     * const SpaceCategory = await prisma.spaceCategory.delete({
     *   where: {
     *     // ... filter to delete one SpaceCategory
     *   }
     * })
     * 
     */
    delete<T extends SpaceCategoryDeleteArgs>(args: SelectSubset<T, SpaceCategoryDeleteArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SpaceCategory.
     * @param {SpaceCategoryUpdateArgs} args - Arguments to update one SpaceCategory.
     * @example
     * // Update one SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SpaceCategoryUpdateArgs>(args: SelectSubset<T, SpaceCategoryUpdateArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SpaceCategories.
     * @param {SpaceCategoryDeleteManyArgs} args - Arguments to filter SpaceCategories to delete.
     * @example
     * // Delete a few SpaceCategories
     * const { count } = await prisma.spaceCategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SpaceCategoryDeleteManyArgs>(args?: SelectSubset<T, SpaceCategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpaceCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SpaceCategories
     * const spaceCategory = await prisma.spaceCategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SpaceCategoryUpdateManyArgs>(args: SelectSubset<T, SpaceCategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpaceCategories and returns the data updated in the database.
     * @param {SpaceCategoryUpdateManyAndReturnArgs} args - Arguments to update many SpaceCategories.
     * @example
     * // Update many SpaceCategories
     * const spaceCategory = await prisma.spaceCategory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SpaceCategories and only return the `id`
     * const spaceCategoryWithIdOnly = await prisma.spaceCategory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SpaceCategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, SpaceCategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SpaceCategory.
     * @param {SpaceCategoryUpsertArgs} args - Arguments to update or create a SpaceCategory.
     * @example
     * // Update or create a SpaceCategory
     * const spaceCategory = await prisma.spaceCategory.upsert({
     *   create: {
     *     // ... data to create a SpaceCategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SpaceCategory we want to update
     *   }
     * })
     */
    upsert<T extends SpaceCategoryUpsertArgs>(args: SelectSubset<T, SpaceCategoryUpsertArgs<ExtArgs>>): Prisma__SpaceCategoryClient<$Result.GetResult<Prisma.$SpaceCategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SpaceCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryCountArgs} args - Arguments to filter SpaceCategories to count.
     * @example
     * // Count the number of SpaceCategories
     * const count = await prisma.spaceCategory.count({
     *   where: {
     *     // ... the filter for the SpaceCategories we want to count
     *   }
     * })
    **/
    count<T extends SpaceCategoryCountArgs>(
      args?: Subset<T, SpaceCategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpaceCategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SpaceCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpaceCategoryAggregateArgs>(args: Subset<T, SpaceCategoryAggregateArgs>): Prisma.PrismaPromise<GetSpaceCategoryAggregateType<T>>

    /**
     * Group by SpaceCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceCategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SpaceCategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpaceCategoryGroupByArgs['orderBy'] }
        : { orderBy?: SpaceCategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpaceCategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpaceCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SpaceCategory model
   */
  readonly fields: SpaceCategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SpaceCategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpaceCategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    spaces<T extends SpaceCategory$spacesArgs<ExtArgs> = {}>(args?: Subset<T, SpaceCategory$spacesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SpaceCategory model
   */
  interface SpaceCategoryFieldRefs {
    readonly id: FieldRef<"SpaceCategory", 'Int'>
    readonly name: FieldRef<"SpaceCategory", 'String'>
    readonly slug: FieldRef<"SpaceCategory", 'String'>
    readonly description: FieldRef<"SpaceCategory", 'String'>
    readonly icon: FieldRef<"SpaceCategory", 'String'>
  }
    

  // Custom InputTypes
  /**
   * SpaceCategory findUnique
   */
  export type SpaceCategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter, which SpaceCategory to fetch.
     */
    where: SpaceCategoryWhereUniqueInput
  }

  /**
   * SpaceCategory findUniqueOrThrow
   */
  export type SpaceCategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter, which SpaceCategory to fetch.
     */
    where: SpaceCategoryWhereUniqueInput
  }

  /**
   * SpaceCategory findFirst
   */
  export type SpaceCategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter, which SpaceCategory to fetch.
     */
    where?: SpaceCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceCategories to fetch.
     */
    orderBy?: SpaceCategoryOrderByWithRelationInput | SpaceCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpaceCategories.
     */
    cursor?: SpaceCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpaceCategories.
     */
    distinct?: SpaceCategoryScalarFieldEnum | SpaceCategoryScalarFieldEnum[]
  }

  /**
   * SpaceCategory findFirstOrThrow
   */
  export type SpaceCategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter, which SpaceCategory to fetch.
     */
    where?: SpaceCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceCategories to fetch.
     */
    orderBy?: SpaceCategoryOrderByWithRelationInput | SpaceCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpaceCategories.
     */
    cursor?: SpaceCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpaceCategories.
     */
    distinct?: SpaceCategoryScalarFieldEnum | SpaceCategoryScalarFieldEnum[]
  }

  /**
   * SpaceCategory findMany
   */
  export type SpaceCategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter, which SpaceCategories to fetch.
     */
    where?: SpaceCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceCategories to fetch.
     */
    orderBy?: SpaceCategoryOrderByWithRelationInput | SpaceCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SpaceCategories.
     */
    cursor?: SpaceCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceCategories.
     */
    skip?: number
    distinct?: SpaceCategoryScalarFieldEnum | SpaceCategoryScalarFieldEnum[]
  }

  /**
   * SpaceCategory create
   */
  export type SpaceCategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * The data needed to create a SpaceCategory.
     */
    data: XOR<SpaceCategoryCreateInput, SpaceCategoryUncheckedCreateInput>
  }

  /**
   * SpaceCategory createMany
   */
  export type SpaceCategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SpaceCategories.
     */
    data: SpaceCategoryCreateManyInput | SpaceCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpaceCategory createManyAndReturn
   */
  export type SpaceCategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * The data used to create many SpaceCategories.
     */
    data: SpaceCategoryCreateManyInput | SpaceCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpaceCategory update
   */
  export type SpaceCategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * The data needed to update a SpaceCategory.
     */
    data: XOR<SpaceCategoryUpdateInput, SpaceCategoryUncheckedUpdateInput>
    /**
     * Choose, which SpaceCategory to update.
     */
    where: SpaceCategoryWhereUniqueInput
  }

  /**
   * SpaceCategory updateMany
   */
  export type SpaceCategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SpaceCategories.
     */
    data: XOR<SpaceCategoryUpdateManyMutationInput, SpaceCategoryUncheckedUpdateManyInput>
    /**
     * Filter which SpaceCategories to update
     */
    where?: SpaceCategoryWhereInput
    /**
     * Limit how many SpaceCategories to update.
     */
    limit?: number
  }

  /**
   * SpaceCategory updateManyAndReturn
   */
  export type SpaceCategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * The data used to update SpaceCategories.
     */
    data: XOR<SpaceCategoryUpdateManyMutationInput, SpaceCategoryUncheckedUpdateManyInput>
    /**
     * Filter which SpaceCategories to update
     */
    where?: SpaceCategoryWhereInput
    /**
     * Limit how many SpaceCategories to update.
     */
    limit?: number
  }

  /**
   * SpaceCategory upsert
   */
  export type SpaceCategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * The filter to search for the SpaceCategory to update in case it exists.
     */
    where: SpaceCategoryWhereUniqueInput
    /**
     * In case the SpaceCategory found by the `where` argument doesn't exist, create a new SpaceCategory with this data.
     */
    create: XOR<SpaceCategoryCreateInput, SpaceCategoryUncheckedCreateInput>
    /**
     * In case the SpaceCategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpaceCategoryUpdateInput, SpaceCategoryUncheckedUpdateInput>
  }

  /**
   * SpaceCategory delete
   */
  export type SpaceCategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
    /**
     * Filter which SpaceCategory to delete.
     */
    where: SpaceCategoryWhereUniqueInput
  }

  /**
   * SpaceCategory deleteMany
   */
  export type SpaceCategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpaceCategories to delete
     */
    where?: SpaceCategoryWhereInput
    /**
     * Limit how many SpaceCategories to delete.
     */
    limit?: number
  }

  /**
   * SpaceCategory.spaces
   */
  export type SpaceCategory$spacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Space
     */
    select?: SpaceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Space
     */
    omit?: SpaceOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceInclude<ExtArgs> | null
    where?: SpaceWhereInput
    orderBy?: SpaceOrderByWithRelationInput | SpaceOrderByWithRelationInput[]
    cursor?: SpaceWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpaceScalarFieldEnum | SpaceScalarFieldEnum[]
  }

  /**
   * SpaceCategory without action
   */
  export type SpaceCategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceCategory
     */
    select?: SpaceCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceCategory
     */
    omit?: SpaceCategoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceCategoryInclude<ExtArgs> | null
  }


  /**
   * Model Amenity
   */

  export type AggregateAmenity = {
    _count: AmenityCountAggregateOutputType | null
    _avg: AmenityAvgAggregateOutputType | null
    _sum: AmenitySumAggregateOutputType | null
    _min: AmenityMinAggregateOutputType | null
    _max: AmenityMaxAggregateOutputType | null
  }

  export type AmenityAvgAggregateOutputType = {
    id: number | null
  }

  export type AmenitySumAggregateOutputType = {
    id: number | null
  }

  export type AmenityMinAggregateOutputType = {
    id: number | null
    name: string | null
    icon: string | null
    category: string | null
  }

  export type AmenityMaxAggregateOutputType = {
    id: number | null
    name: string | null
    icon: string | null
    category: string | null
  }

  export type AmenityCountAggregateOutputType = {
    id: number
    name: number
    icon: number
    category: number
    _all: number
  }


  export type AmenityAvgAggregateInputType = {
    id?: true
  }

  export type AmenitySumAggregateInputType = {
    id?: true
  }

  export type AmenityMinAggregateInputType = {
    id?: true
    name?: true
    icon?: true
    category?: true
  }

  export type AmenityMaxAggregateInputType = {
    id?: true
    name?: true
    icon?: true
    category?: true
  }

  export type AmenityCountAggregateInputType = {
    id?: true
    name?: true
    icon?: true
    category?: true
    _all?: true
  }

  export type AmenityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Amenity to aggregate.
     */
    where?: AmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Amenities to fetch.
     */
    orderBy?: AmenityOrderByWithRelationInput | AmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Amenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Amenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Amenities
    **/
    _count?: true | AmenityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AmenityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AmenitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AmenityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AmenityMaxAggregateInputType
  }

  export type GetAmenityAggregateType<T extends AmenityAggregateArgs> = {
        [P in keyof T & keyof AggregateAmenity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAmenity[P]>
      : GetScalarType<T[P], AggregateAmenity[P]>
  }




  export type AmenityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AmenityWhereInput
    orderBy?: AmenityOrderByWithAggregationInput | AmenityOrderByWithAggregationInput[]
    by: AmenityScalarFieldEnum[] | AmenityScalarFieldEnum
    having?: AmenityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AmenityCountAggregateInputType | true
    _avg?: AmenityAvgAggregateInputType
    _sum?: AmenitySumAggregateInputType
    _min?: AmenityMinAggregateInputType
    _max?: AmenityMaxAggregateInputType
  }

  export type AmenityGroupByOutputType = {
    id: number
    name: string
    icon: string | null
    category: string | null
    _count: AmenityCountAggregateOutputType | null
    _avg: AmenityAvgAggregateOutputType | null
    _sum: AmenitySumAggregateOutputType | null
    _min: AmenityMinAggregateOutputType | null
    _max: AmenityMaxAggregateOutputType | null
  }

  type GetAmenityGroupByPayload<T extends AmenityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AmenityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AmenityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AmenityGroupByOutputType[P]>
            : GetScalarType<T[P], AmenityGroupByOutputType[P]>
        }
      >
    >


  export type AmenitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    icon?: boolean
    category?: boolean
    spaces?: boolean | Amenity$spacesArgs<ExtArgs>
    _count?: boolean | AmenityCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["amenity"]>

  export type AmenitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    icon?: boolean
    category?: boolean
  }, ExtArgs["result"]["amenity"]>

  export type AmenitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    icon?: boolean
    category?: boolean
  }, ExtArgs["result"]["amenity"]>

  export type AmenitySelectScalar = {
    id?: boolean
    name?: boolean
    icon?: boolean
    category?: boolean
  }

  export type AmenityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "icon" | "category", ExtArgs["result"]["amenity"]>
  export type AmenityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    spaces?: boolean | Amenity$spacesArgs<ExtArgs>
    _count?: boolean | AmenityCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AmenityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AmenityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AmenityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Amenity"
    objects: {
      spaces: Prisma.$SpaceAmenityPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      icon: string | null
      category: string | null
    }, ExtArgs["result"]["amenity"]>
    composites: {}
  }

  type AmenityGetPayload<S extends boolean | null | undefined | AmenityDefaultArgs> = $Result.GetResult<Prisma.$AmenityPayload, S>

  type AmenityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AmenityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AmenityCountAggregateInputType | true
    }

  export interface AmenityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Amenity'], meta: { name: 'Amenity' } }
    /**
     * Find zero or one Amenity that matches the filter.
     * @param {AmenityFindUniqueArgs} args - Arguments to find a Amenity
     * @example
     * // Get one Amenity
     * const amenity = await prisma.amenity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AmenityFindUniqueArgs>(args: SelectSubset<T, AmenityFindUniqueArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Amenity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AmenityFindUniqueOrThrowArgs} args - Arguments to find a Amenity
     * @example
     * // Get one Amenity
     * const amenity = await prisma.amenity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AmenityFindUniqueOrThrowArgs>(args: SelectSubset<T, AmenityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Amenity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityFindFirstArgs} args - Arguments to find a Amenity
     * @example
     * // Get one Amenity
     * const amenity = await prisma.amenity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AmenityFindFirstArgs>(args?: SelectSubset<T, AmenityFindFirstArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Amenity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityFindFirstOrThrowArgs} args - Arguments to find a Amenity
     * @example
     * // Get one Amenity
     * const amenity = await prisma.amenity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AmenityFindFirstOrThrowArgs>(args?: SelectSubset<T, AmenityFindFirstOrThrowArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Amenities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Amenities
     * const amenities = await prisma.amenity.findMany()
     * 
     * // Get first 10 Amenities
     * const amenities = await prisma.amenity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const amenityWithIdOnly = await prisma.amenity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AmenityFindManyArgs>(args?: SelectSubset<T, AmenityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Amenity.
     * @param {AmenityCreateArgs} args - Arguments to create a Amenity.
     * @example
     * // Create one Amenity
     * const Amenity = await prisma.amenity.create({
     *   data: {
     *     // ... data to create a Amenity
     *   }
     * })
     * 
     */
    create<T extends AmenityCreateArgs>(args: SelectSubset<T, AmenityCreateArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Amenities.
     * @param {AmenityCreateManyArgs} args - Arguments to create many Amenities.
     * @example
     * // Create many Amenities
     * const amenity = await prisma.amenity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AmenityCreateManyArgs>(args?: SelectSubset<T, AmenityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Amenities and returns the data saved in the database.
     * @param {AmenityCreateManyAndReturnArgs} args - Arguments to create many Amenities.
     * @example
     * // Create many Amenities
     * const amenity = await prisma.amenity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Amenities and only return the `id`
     * const amenityWithIdOnly = await prisma.amenity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AmenityCreateManyAndReturnArgs>(args?: SelectSubset<T, AmenityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Amenity.
     * @param {AmenityDeleteArgs} args - Arguments to delete one Amenity.
     * @example
     * // Delete one Amenity
     * const Amenity = await prisma.amenity.delete({
     *   where: {
     *     // ... filter to delete one Amenity
     *   }
     * })
     * 
     */
    delete<T extends AmenityDeleteArgs>(args: SelectSubset<T, AmenityDeleteArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Amenity.
     * @param {AmenityUpdateArgs} args - Arguments to update one Amenity.
     * @example
     * // Update one Amenity
     * const amenity = await prisma.amenity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AmenityUpdateArgs>(args: SelectSubset<T, AmenityUpdateArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Amenities.
     * @param {AmenityDeleteManyArgs} args - Arguments to filter Amenities to delete.
     * @example
     * // Delete a few Amenities
     * const { count } = await prisma.amenity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AmenityDeleteManyArgs>(args?: SelectSubset<T, AmenityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Amenities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Amenities
     * const amenity = await prisma.amenity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AmenityUpdateManyArgs>(args: SelectSubset<T, AmenityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Amenities and returns the data updated in the database.
     * @param {AmenityUpdateManyAndReturnArgs} args - Arguments to update many Amenities.
     * @example
     * // Update many Amenities
     * const amenity = await prisma.amenity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Amenities and only return the `id`
     * const amenityWithIdOnly = await prisma.amenity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AmenityUpdateManyAndReturnArgs>(args: SelectSubset<T, AmenityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Amenity.
     * @param {AmenityUpsertArgs} args - Arguments to update or create a Amenity.
     * @example
     * // Update or create a Amenity
     * const amenity = await prisma.amenity.upsert({
     *   create: {
     *     // ... data to create a Amenity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Amenity we want to update
     *   }
     * })
     */
    upsert<T extends AmenityUpsertArgs>(args: SelectSubset<T, AmenityUpsertArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Amenities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityCountArgs} args - Arguments to filter Amenities to count.
     * @example
     * // Count the number of Amenities
     * const count = await prisma.amenity.count({
     *   where: {
     *     // ... the filter for the Amenities we want to count
     *   }
     * })
    **/
    count<T extends AmenityCountArgs>(
      args?: Subset<T, AmenityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AmenityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Amenity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AmenityAggregateArgs>(args: Subset<T, AmenityAggregateArgs>): Prisma.PrismaPromise<GetAmenityAggregateType<T>>

    /**
     * Group by Amenity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AmenityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AmenityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AmenityGroupByArgs['orderBy'] }
        : { orderBy?: AmenityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AmenityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAmenityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Amenity model
   */
  readonly fields: AmenityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Amenity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AmenityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    spaces<T extends Amenity$spacesArgs<ExtArgs> = {}>(args?: Subset<T, Amenity$spacesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Amenity model
   */
  interface AmenityFieldRefs {
    readonly id: FieldRef<"Amenity", 'Int'>
    readonly name: FieldRef<"Amenity", 'String'>
    readonly icon: FieldRef<"Amenity", 'String'>
    readonly category: FieldRef<"Amenity", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Amenity findUnique
   */
  export type AmenityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter, which Amenity to fetch.
     */
    where: AmenityWhereUniqueInput
  }

  /**
   * Amenity findUniqueOrThrow
   */
  export type AmenityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter, which Amenity to fetch.
     */
    where: AmenityWhereUniqueInput
  }

  /**
   * Amenity findFirst
   */
  export type AmenityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter, which Amenity to fetch.
     */
    where?: AmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Amenities to fetch.
     */
    orderBy?: AmenityOrderByWithRelationInput | AmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Amenities.
     */
    cursor?: AmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Amenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Amenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Amenities.
     */
    distinct?: AmenityScalarFieldEnum | AmenityScalarFieldEnum[]
  }

  /**
   * Amenity findFirstOrThrow
   */
  export type AmenityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter, which Amenity to fetch.
     */
    where?: AmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Amenities to fetch.
     */
    orderBy?: AmenityOrderByWithRelationInput | AmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Amenities.
     */
    cursor?: AmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Amenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Amenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Amenities.
     */
    distinct?: AmenityScalarFieldEnum | AmenityScalarFieldEnum[]
  }

  /**
   * Amenity findMany
   */
  export type AmenityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter, which Amenities to fetch.
     */
    where?: AmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Amenities to fetch.
     */
    orderBy?: AmenityOrderByWithRelationInput | AmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Amenities.
     */
    cursor?: AmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Amenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Amenities.
     */
    skip?: number
    distinct?: AmenityScalarFieldEnum | AmenityScalarFieldEnum[]
  }

  /**
   * Amenity create
   */
  export type AmenityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * The data needed to create a Amenity.
     */
    data: XOR<AmenityCreateInput, AmenityUncheckedCreateInput>
  }

  /**
   * Amenity createMany
   */
  export type AmenityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Amenities.
     */
    data: AmenityCreateManyInput | AmenityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Amenity createManyAndReturn
   */
  export type AmenityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * The data used to create many Amenities.
     */
    data: AmenityCreateManyInput | AmenityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Amenity update
   */
  export type AmenityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * The data needed to update a Amenity.
     */
    data: XOR<AmenityUpdateInput, AmenityUncheckedUpdateInput>
    /**
     * Choose, which Amenity to update.
     */
    where: AmenityWhereUniqueInput
  }

  /**
   * Amenity updateMany
   */
  export type AmenityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Amenities.
     */
    data: XOR<AmenityUpdateManyMutationInput, AmenityUncheckedUpdateManyInput>
    /**
     * Filter which Amenities to update
     */
    where?: AmenityWhereInput
    /**
     * Limit how many Amenities to update.
     */
    limit?: number
  }

  /**
   * Amenity updateManyAndReturn
   */
  export type AmenityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * The data used to update Amenities.
     */
    data: XOR<AmenityUpdateManyMutationInput, AmenityUncheckedUpdateManyInput>
    /**
     * Filter which Amenities to update
     */
    where?: AmenityWhereInput
    /**
     * Limit how many Amenities to update.
     */
    limit?: number
  }

  /**
   * Amenity upsert
   */
  export type AmenityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * The filter to search for the Amenity to update in case it exists.
     */
    where: AmenityWhereUniqueInput
    /**
     * In case the Amenity found by the `where` argument doesn't exist, create a new Amenity with this data.
     */
    create: XOR<AmenityCreateInput, AmenityUncheckedCreateInput>
    /**
     * In case the Amenity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AmenityUpdateInput, AmenityUncheckedUpdateInput>
  }

  /**
   * Amenity delete
   */
  export type AmenityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
    /**
     * Filter which Amenity to delete.
     */
    where: AmenityWhereUniqueInput
  }

  /**
   * Amenity deleteMany
   */
  export type AmenityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Amenities to delete
     */
    where?: AmenityWhereInput
    /**
     * Limit how many Amenities to delete.
     */
    limit?: number
  }

  /**
   * Amenity.spaces
   */
  export type Amenity$spacesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    where?: SpaceAmenityWhereInput
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    cursor?: SpaceAmenityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SpaceAmenityScalarFieldEnum | SpaceAmenityScalarFieldEnum[]
  }

  /**
   * Amenity without action
   */
  export type AmenityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Amenity
     */
    select?: AmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Amenity
     */
    omit?: AmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AmenityInclude<ExtArgs> | null
  }


  /**
   * Model SpaceAmenity
   */

  export type AggregateSpaceAmenity = {
    _count: SpaceAmenityCountAggregateOutputType | null
    _avg: SpaceAmenityAvgAggregateOutputType | null
    _sum: SpaceAmenitySumAggregateOutputType | null
    _min: SpaceAmenityMinAggregateOutputType | null
    _max: SpaceAmenityMaxAggregateOutputType | null
  }

  export type SpaceAmenityAvgAggregateOutputType = {
    id: number | null
    spaceId: number | null
    amenityId: number | null
  }

  export type SpaceAmenitySumAggregateOutputType = {
    id: number | null
    spaceId: number | null
    amenityId: number | null
  }

  export type SpaceAmenityMinAggregateOutputType = {
    id: number | null
    spaceId: number | null
    amenityId: number | null
  }

  export type SpaceAmenityMaxAggregateOutputType = {
    id: number | null
    spaceId: number | null
    amenityId: number | null
  }

  export type SpaceAmenityCountAggregateOutputType = {
    id: number
    spaceId: number
    amenityId: number
    _all: number
  }


  export type SpaceAmenityAvgAggregateInputType = {
    id?: true
    spaceId?: true
    amenityId?: true
  }

  export type SpaceAmenitySumAggregateInputType = {
    id?: true
    spaceId?: true
    amenityId?: true
  }

  export type SpaceAmenityMinAggregateInputType = {
    id?: true
    spaceId?: true
    amenityId?: true
  }

  export type SpaceAmenityMaxAggregateInputType = {
    id?: true
    spaceId?: true
    amenityId?: true
  }

  export type SpaceAmenityCountAggregateInputType = {
    id?: true
    spaceId?: true
    amenityId?: true
    _all?: true
  }

  export type SpaceAmenityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpaceAmenity to aggregate.
     */
    where?: SpaceAmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceAmenities to fetch.
     */
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SpaceAmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceAmenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceAmenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SpaceAmenities
    **/
    _count?: true | SpaceAmenityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SpaceAmenityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SpaceAmenitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SpaceAmenityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SpaceAmenityMaxAggregateInputType
  }

  export type GetSpaceAmenityAggregateType<T extends SpaceAmenityAggregateArgs> = {
        [P in keyof T & keyof AggregateSpaceAmenity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSpaceAmenity[P]>
      : GetScalarType<T[P], AggregateSpaceAmenity[P]>
  }




  export type SpaceAmenityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SpaceAmenityWhereInput
    orderBy?: SpaceAmenityOrderByWithAggregationInput | SpaceAmenityOrderByWithAggregationInput[]
    by: SpaceAmenityScalarFieldEnum[] | SpaceAmenityScalarFieldEnum
    having?: SpaceAmenityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SpaceAmenityCountAggregateInputType | true
    _avg?: SpaceAmenityAvgAggregateInputType
    _sum?: SpaceAmenitySumAggregateInputType
    _min?: SpaceAmenityMinAggregateInputType
    _max?: SpaceAmenityMaxAggregateInputType
  }

  export type SpaceAmenityGroupByOutputType = {
    id: number
    spaceId: number
    amenityId: number
    _count: SpaceAmenityCountAggregateOutputType | null
    _avg: SpaceAmenityAvgAggregateOutputType | null
    _sum: SpaceAmenitySumAggregateOutputType | null
    _min: SpaceAmenityMinAggregateOutputType | null
    _max: SpaceAmenityMaxAggregateOutputType | null
  }

  type GetSpaceAmenityGroupByPayload<T extends SpaceAmenityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SpaceAmenityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SpaceAmenityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SpaceAmenityGroupByOutputType[P]>
            : GetScalarType<T[P], SpaceAmenityGroupByOutputType[P]>
        }
      >
    >


  export type SpaceAmenitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    amenityId?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spaceAmenity"]>

  export type SpaceAmenitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    amenityId?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spaceAmenity"]>

  export type SpaceAmenitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    amenityId?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["spaceAmenity"]>

  export type SpaceAmenitySelectScalar = {
    id?: boolean
    spaceId?: boolean
    amenityId?: boolean
  }

  export type SpaceAmenityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "spaceId" | "amenityId", ExtArgs["result"]["spaceAmenity"]>
  export type SpaceAmenityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }
  export type SpaceAmenityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }
  export type SpaceAmenityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    amenity?: boolean | AmenityDefaultArgs<ExtArgs>
  }

  export type $SpaceAmenityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SpaceAmenity"
    objects: {
      space: Prisma.$SpacePayload<ExtArgs>
      amenity: Prisma.$AmenityPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      spaceId: number
      amenityId: number
    }, ExtArgs["result"]["spaceAmenity"]>
    composites: {}
  }

  type SpaceAmenityGetPayload<S extends boolean | null | undefined | SpaceAmenityDefaultArgs> = $Result.GetResult<Prisma.$SpaceAmenityPayload, S>

  type SpaceAmenityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SpaceAmenityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SpaceAmenityCountAggregateInputType | true
    }

  export interface SpaceAmenityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SpaceAmenity'], meta: { name: 'SpaceAmenity' } }
    /**
     * Find zero or one SpaceAmenity that matches the filter.
     * @param {SpaceAmenityFindUniqueArgs} args - Arguments to find a SpaceAmenity
     * @example
     * // Get one SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SpaceAmenityFindUniqueArgs>(args: SelectSubset<T, SpaceAmenityFindUniqueArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SpaceAmenity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SpaceAmenityFindUniqueOrThrowArgs} args - Arguments to find a SpaceAmenity
     * @example
     * // Get one SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SpaceAmenityFindUniqueOrThrowArgs>(args: SelectSubset<T, SpaceAmenityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpaceAmenity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityFindFirstArgs} args - Arguments to find a SpaceAmenity
     * @example
     * // Get one SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SpaceAmenityFindFirstArgs>(args?: SelectSubset<T, SpaceAmenityFindFirstArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SpaceAmenity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityFindFirstOrThrowArgs} args - Arguments to find a SpaceAmenity
     * @example
     * // Get one SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SpaceAmenityFindFirstOrThrowArgs>(args?: SelectSubset<T, SpaceAmenityFindFirstOrThrowArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SpaceAmenities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SpaceAmenities
     * const spaceAmenities = await prisma.spaceAmenity.findMany()
     * 
     * // Get first 10 SpaceAmenities
     * const spaceAmenities = await prisma.spaceAmenity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const spaceAmenityWithIdOnly = await prisma.spaceAmenity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SpaceAmenityFindManyArgs>(args?: SelectSubset<T, SpaceAmenityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SpaceAmenity.
     * @param {SpaceAmenityCreateArgs} args - Arguments to create a SpaceAmenity.
     * @example
     * // Create one SpaceAmenity
     * const SpaceAmenity = await prisma.spaceAmenity.create({
     *   data: {
     *     // ... data to create a SpaceAmenity
     *   }
     * })
     * 
     */
    create<T extends SpaceAmenityCreateArgs>(args: SelectSubset<T, SpaceAmenityCreateArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SpaceAmenities.
     * @param {SpaceAmenityCreateManyArgs} args - Arguments to create many SpaceAmenities.
     * @example
     * // Create many SpaceAmenities
     * const spaceAmenity = await prisma.spaceAmenity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SpaceAmenityCreateManyArgs>(args?: SelectSubset<T, SpaceAmenityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SpaceAmenities and returns the data saved in the database.
     * @param {SpaceAmenityCreateManyAndReturnArgs} args - Arguments to create many SpaceAmenities.
     * @example
     * // Create many SpaceAmenities
     * const spaceAmenity = await prisma.spaceAmenity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SpaceAmenities and only return the `id`
     * const spaceAmenityWithIdOnly = await prisma.spaceAmenity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SpaceAmenityCreateManyAndReturnArgs>(args?: SelectSubset<T, SpaceAmenityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SpaceAmenity.
     * @param {SpaceAmenityDeleteArgs} args - Arguments to delete one SpaceAmenity.
     * @example
     * // Delete one SpaceAmenity
     * const SpaceAmenity = await prisma.spaceAmenity.delete({
     *   where: {
     *     // ... filter to delete one SpaceAmenity
     *   }
     * })
     * 
     */
    delete<T extends SpaceAmenityDeleteArgs>(args: SelectSubset<T, SpaceAmenityDeleteArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SpaceAmenity.
     * @param {SpaceAmenityUpdateArgs} args - Arguments to update one SpaceAmenity.
     * @example
     * // Update one SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SpaceAmenityUpdateArgs>(args: SelectSubset<T, SpaceAmenityUpdateArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SpaceAmenities.
     * @param {SpaceAmenityDeleteManyArgs} args - Arguments to filter SpaceAmenities to delete.
     * @example
     * // Delete a few SpaceAmenities
     * const { count } = await prisma.spaceAmenity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SpaceAmenityDeleteManyArgs>(args?: SelectSubset<T, SpaceAmenityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpaceAmenities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SpaceAmenities
     * const spaceAmenity = await prisma.spaceAmenity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SpaceAmenityUpdateManyArgs>(args: SelectSubset<T, SpaceAmenityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SpaceAmenities and returns the data updated in the database.
     * @param {SpaceAmenityUpdateManyAndReturnArgs} args - Arguments to update many SpaceAmenities.
     * @example
     * // Update many SpaceAmenities
     * const spaceAmenity = await prisma.spaceAmenity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SpaceAmenities and only return the `id`
     * const spaceAmenityWithIdOnly = await prisma.spaceAmenity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SpaceAmenityUpdateManyAndReturnArgs>(args: SelectSubset<T, SpaceAmenityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SpaceAmenity.
     * @param {SpaceAmenityUpsertArgs} args - Arguments to update or create a SpaceAmenity.
     * @example
     * // Update or create a SpaceAmenity
     * const spaceAmenity = await prisma.spaceAmenity.upsert({
     *   create: {
     *     // ... data to create a SpaceAmenity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SpaceAmenity we want to update
     *   }
     * })
     */
    upsert<T extends SpaceAmenityUpsertArgs>(args: SelectSubset<T, SpaceAmenityUpsertArgs<ExtArgs>>): Prisma__SpaceAmenityClient<$Result.GetResult<Prisma.$SpaceAmenityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SpaceAmenities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityCountArgs} args - Arguments to filter SpaceAmenities to count.
     * @example
     * // Count the number of SpaceAmenities
     * const count = await prisma.spaceAmenity.count({
     *   where: {
     *     // ... the filter for the SpaceAmenities we want to count
     *   }
     * })
    **/
    count<T extends SpaceAmenityCountArgs>(
      args?: Subset<T, SpaceAmenityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SpaceAmenityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SpaceAmenity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SpaceAmenityAggregateArgs>(args: Subset<T, SpaceAmenityAggregateArgs>): Prisma.PrismaPromise<GetSpaceAmenityAggregateType<T>>

    /**
     * Group by SpaceAmenity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SpaceAmenityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SpaceAmenityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SpaceAmenityGroupByArgs['orderBy'] }
        : { orderBy?: SpaceAmenityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SpaceAmenityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSpaceAmenityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SpaceAmenity model
   */
  readonly fields: SpaceAmenityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SpaceAmenity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SpaceAmenityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    space<T extends SpaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceDefaultArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    amenity<T extends AmenityDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AmenityDefaultArgs<ExtArgs>>): Prisma__AmenityClient<$Result.GetResult<Prisma.$AmenityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SpaceAmenity model
   */
  interface SpaceAmenityFieldRefs {
    readonly id: FieldRef<"SpaceAmenity", 'Int'>
    readonly spaceId: FieldRef<"SpaceAmenity", 'Int'>
    readonly amenityId: FieldRef<"SpaceAmenity", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * SpaceAmenity findUnique
   */
  export type SpaceAmenityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter, which SpaceAmenity to fetch.
     */
    where: SpaceAmenityWhereUniqueInput
  }

  /**
   * SpaceAmenity findUniqueOrThrow
   */
  export type SpaceAmenityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter, which SpaceAmenity to fetch.
     */
    where: SpaceAmenityWhereUniqueInput
  }

  /**
   * SpaceAmenity findFirst
   */
  export type SpaceAmenityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter, which SpaceAmenity to fetch.
     */
    where?: SpaceAmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceAmenities to fetch.
     */
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpaceAmenities.
     */
    cursor?: SpaceAmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceAmenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceAmenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpaceAmenities.
     */
    distinct?: SpaceAmenityScalarFieldEnum | SpaceAmenityScalarFieldEnum[]
  }

  /**
   * SpaceAmenity findFirstOrThrow
   */
  export type SpaceAmenityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter, which SpaceAmenity to fetch.
     */
    where?: SpaceAmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceAmenities to fetch.
     */
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SpaceAmenities.
     */
    cursor?: SpaceAmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceAmenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceAmenities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SpaceAmenities.
     */
    distinct?: SpaceAmenityScalarFieldEnum | SpaceAmenityScalarFieldEnum[]
  }

  /**
   * SpaceAmenity findMany
   */
  export type SpaceAmenityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter, which SpaceAmenities to fetch.
     */
    where?: SpaceAmenityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SpaceAmenities to fetch.
     */
    orderBy?: SpaceAmenityOrderByWithRelationInput | SpaceAmenityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SpaceAmenities.
     */
    cursor?: SpaceAmenityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SpaceAmenities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SpaceAmenities.
     */
    skip?: number
    distinct?: SpaceAmenityScalarFieldEnum | SpaceAmenityScalarFieldEnum[]
  }

  /**
   * SpaceAmenity create
   */
  export type SpaceAmenityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * The data needed to create a SpaceAmenity.
     */
    data: XOR<SpaceAmenityCreateInput, SpaceAmenityUncheckedCreateInput>
  }

  /**
   * SpaceAmenity createMany
   */
  export type SpaceAmenityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SpaceAmenities.
     */
    data: SpaceAmenityCreateManyInput | SpaceAmenityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SpaceAmenity createManyAndReturn
   */
  export type SpaceAmenityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * The data used to create many SpaceAmenities.
     */
    data: SpaceAmenityCreateManyInput | SpaceAmenityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpaceAmenity update
   */
  export type SpaceAmenityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * The data needed to update a SpaceAmenity.
     */
    data: XOR<SpaceAmenityUpdateInput, SpaceAmenityUncheckedUpdateInput>
    /**
     * Choose, which SpaceAmenity to update.
     */
    where: SpaceAmenityWhereUniqueInput
  }

  /**
   * SpaceAmenity updateMany
   */
  export type SpaceAmenityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SpaceAmenities.
     */
    data: XOR<SpaceAmenityUpdateManyMutationInput, SpaceAmenityUncheckedUpdateManyInput>
    /**
     * Filter which SpaceAmenities to update
     */
    where?: SpaceAmenityWhereInput
    /**
     * Limit how many SpaceAmenities to update.
     */
    limit?: number
  }

  /**
   * SpaceAmenity updateManyAndReturn
   */
  export type SpaceAmenityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * The data used to update SpaceAmenities.
     */
    data: XOR<SpaceAmenityUpdateManyMutationInput, SpaceAmenityUncheckedUpdateManyInput>
    /**
     * Filter which SpaceAmenities to update
     */
    where?: SpaceAmenityWhereInput
    /**
     * Limit how many SpaceAmenities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * SpaceAmenity upsert
   */
  export type SpaceAmenityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * The filter to search for the SpaceAmenity to update in case it exists.
     */
    where: SpaceAmenityWhereUniqueInput
    /**
     * In case the SpaceAmenity found by the `where` argument doesn't exist, create a new SpaceAmenity with this data.
     */
    create: XOR<SpaceAmenityCreateInput, SpaceAmenityUncheckedCreateInput>
    /**
     * In case the SpaceAmenity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SpaceAmenityUpdateInput, SpaceAmenityUncheckedUpdateInput>
  }

  /**
   * SpaceAmenity delete
   */
  export type SpaceAmenityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
    /**
     * Filter which SpaceAmenity to delete.
     */
    where: SpaceAmenityWhereUniqueInput
  }

  /**
   * SpaceAmenity deleteMany
   */
  export type SpaceAmenityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SpaceAmenities to delete
     */
    where?: SpaceAmenityWhereInput
    /**
     * Limit how many SpaceAmenities to delete.
     */
    limit?: number
  }

  /**
   * SpaceAmenity without action
   */
  export type SpaceAmenityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SpaceAmenity
     */
    select?: SpaceAmenitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the SpaceAmenity
     */
    omit?: SpaceAmenityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SpaceAmenityInclude<ExtArgs> | null
  }


  /**
   * Model Availability
   */

  export type AggregateAvailability = {
    _count: AvailabilityCountAggregateOutputType | null
    _avg: AvailabilityAvgAggregateOutputType | null
    _sum: AvailabilitySumAggregateOutputType | null
    _min: AvailabilityMinAggregateOutputType | null
    _max: AvailabilityMaxAggregateOutputType | null
  }

  export type AvailabilityAvgAggregateOutputType = {
    id: number | null
    spaceId: number | null
    dayOfWeek: number | null
  }

  export type AvailabilitySumAggregateOutputType = {
    id: number | null
    spaceId: number | null
    dayOfWeek: number | null
  }

  export type AvailabilityMinAggregateOutputType = {
    id: number | null
    spaceId: number | null
    dayOfWeek: number | null
    startTime: string | null
    endTime: string | null
    isOpen: boolean | null
  }

  export type AvailabilityMaxAggregateOutputType = {
    id: number | null
    spaceId: number | null
    dayOfWeek: number | null
    startTime: string | null
    endTime: string | null
    isOpen: boolean | null
  }

  export type AvailabilityCountAggregateOutputType = {
    id: number
    spaceId: number
    dayOfWeek: number
    startTime: number
    endTime: number
    isOpen: number
    _all: number
  }


  export type AvailabilityAvgAggregateInputType = {
    id?: true
    spaceId?: true
    dayOfWeek?: true
  }

  export type AvailabilitySumAggregateInputType = {
    id?: true
    spaceId?: true
    dayOfWeek?: true
  }

  export type AvailabilityMinAggregateInputType = {
    id?: true
    spaceId?: true
    dayOfWeek?: true
    startTime?: true
    endTime?: true
    isOpen?: true
  }

  export type AvailabilityMaxAggregateInputType = {
    id?: true
    spaceId?: true
    dayOfWeek?: true
    startTime?: true
    endTime?: true
    isOpen?: true
  }

  export type AvailabilityCountAggregateInputType = {
    id?: true
    spaceId?: true
    dayOfWeek?: true
    startTime?: true
    endTime?: true
    isOpen?: true
    _all?: true
  }

  export type AvailabilityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Availability to aggregate.
     */
    where?: AvailabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Availabilities to fetch.
     */
    orderBy?: AvailabilityOrderByWithRelationInput | AvailabilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AvailabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Availabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Availabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Availabilities
    **/
    _count?: true | AvailabilityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AvailabilityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AvailabilitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AvailabilityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AvailabilityMaxAggregateInputType
  }

  export type GetAvailabilityAggregateType<T extends AvailabilityAggregateArgs> = {
        [P in keyof T & keyof AggregateAvailability]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAvailability[P]>
      : GetScalarType<T[P], AggregateAvailability[P]>
  }




  export type AvailabilityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AvailabilityWhereInput
    orderBy?: AvailabilityOrderByWithAggregationInput | AvailabilityOrderByWithAggregationInput[]
    by: AvailabilityScalarFieldEnum[] | AvailabilityScalarFieldEnum
    having?: AvailabilityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AvailabilityCountAggregateInputType | true
    _avg?: AvailabilityAvgAggregateInputType
    _sum?: AvailabilitySumAggregateInputType
    _min?: AvailabilityMinAggregateInputType
    _max?: AvailabilityMaxAggregateInputType
  }

  export type AvailabilityGroupByOutputType = {
    id: number
    spaceId: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen: boolean
    _count: AvailabilityCountAggregateOutputType | null
    _avg: AvailabilityAvgAggregateOutputType | null
    _sum: AvailabilitySumAggregateOutputType | null
    _min: AvailabilityMinAggregateOutputType | null
    _max: AvailabilityMaxAggregateOutputType | null
  }

  type GetAvailabilityGroupByPayload<T extends AvailabilityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AvailabilityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AvailabilityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AvailabilityGroupByOutputType[P]>
            : GetScalarType<T[P], AvailabilityGroupByOutputType[P]>
        }
      >
    >


  export type AvailabilitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    dayOfWeek?: boolean
    startTime?: boolean
    endTime?: boolean
    isOpen?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["availability"]>

  export type AvailabilitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    dayOfWeek?: boolean
    startTime?: boolean
    endTime?: boolean
    isOpen?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["availability"]>

  export type AvailabilitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    dayOfWeek?: boolean
    startTime?: boolean
    endTime?: boolean
    isOpen?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["availability"]>

  export type AvailabilitySelectScalar = {
    id?: boolean
    spaceId?: boolean
    dayOfWeek?: boolean
    startTime?: boolean
    endTime?: boolean
    isOpen?: boolean
  }

  export type AvailabilityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "spaceId" | "dayOfWeek" | "startTime" | "endTime" | "isOpen", ExtArgs["result"]["availability"]>
  export type AvailabilityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }
  export type AvailabilityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }
  export type AvailabilityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }

  export type $AvailabilityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Availability"
    objects: {
      space: Prisma.$SpacePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      spaceId: number
      dayOfWeek: number
      startTime: string
      endTime: string
      isOpen: boolean
    }, ExtArgs["result"]["availability"]>
    composites: {}
  }

  type AvailabilityGetPayload<S extends boolean | null | undefined | AvailabilityDefaultArgs> = $Result.GetResult<Prisma.$AvailabilityPayload, S>

  type AvailabilityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AvailabilityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AvailabilityCountAggregateInputType | true
    }

  export interface AvailabilityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Availability'], meta: { name: 'Availability' } }
    /**
     * Find zero or one Availability that matches the filter.
     * @param {AvailabilityFindUniqueArgs} args - Arguments to find a Availability
     * @example
     * // Get one Availability
     * const availability = await prisma.availability.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AvailabilityFindUniqueArgs>(args: SelectSubset<T, AvailabilityFindUniqueArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Availability that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AvailabilityFindUniqueOrThrowArgs} args - Arguments to find a Availability
     * @example
     * // Get one Availability
     * const availability = await prisma.availability.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AvailabilityFindUniqueOrThrowArgs>(args: SelectSubset<T, AvailabilityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Availability that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityFindFirstArgs} args - Arguments to find a Availability
     * @example
     * // Get one Availability
     * const availability = await prisma.availability.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AvailabilityFindFirstArgs>(args?: SelectSubset<T, AvailabilityFindFirstArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Availability that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityFindFirstOrThrowArgs} args - Arguments to find a Availability
     * @example
     * // Get one Availability
     * const availability = await prisma.availability.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AvailabilityFindFirstOrThrowArgs>(args?: SelectSubset<T, AvailabilityFindFirstOrThrowArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Availabilities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Availabilities
     * const availabilities = await prisma.availability.findMany()
     * 
     * // Get first 10 Availabilities
     * const availabilities = await prisma.availability.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const availabilityWithIdOnly = await prisma.availability.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AvailabilityFindManyArgs>(args?: SelectSubset<T, AvailabilityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Availability.
     * @param {AvailabilityCreateArgs} args - Arguments to create a Availability.
     * @example
     * // Create one Availability
     * const Availability = await prisma.availability.create({
     *   data: {
     *     // ... data to create a Availability
     *   }
     * })
     * 
     */
    create<T extends AvailabilityCreateArgs>(args: SelectSubset<T, AvailabilityCreateArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Availabilities.
     * @param {AvailabilityCreateManyArgs} args - Arguments to create many Availabilities.
     * @example
     * // Create many Availabilities
     * const availability = await prisma.availability.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AvailabilityCreateManyArgs>(args?: SelectSubset<T, AvailabilityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Availabilities and returns the data saved in the database.
     * @param {AvailabilityCreateManyAndReturnArgs} args - Arguments to create many Availabilities.
     * @example
     * // Create many Availabilities
     * const availability = await prisma.availability.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Availabilities and only return the `id`
     * const availabilityWithIdOnly = await prisma.availability.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AvailabilityCreateManyAndReturnArgs>(args?: SelectSubset<T, AvailabilityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Availability.
     * @param {AvailabilityDeleteArgs} args - Arguments to delete one Availability.
     * @example
     * // Delete one Availability
     * const Availability = await prisma.availability.delete({
     *   where: {
     *     // ... filter to delete one Availability
     *   }
     * })
     * 
     */
    delete<T extends AvailabilityDeleteArgs>(args: SelectSubset<T, AvailabilityDeleteArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Availability.
     * @param {AvailabilityUpdateArgs} args - Arguments to update one Availability.
     * @example
     * // Update one Availability
     * const availability = await prisma.availability.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AvailabilityUpdateArgs>(args: SelectSubset<T, AvailabilityUpdateArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Availabilities.
     * @param {AvailabilityDeleteManyArgs} args - Arguments to filter Availabilities to delete.
     * @example
     * // Delete a few Availabilities
     * const { count } = await prisma.availability.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AvailabilityDeleteManyArgs>(args?: SelectSubset<T, AvailabilityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Availabilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Availabilities
     * const availability = await prisma.availability.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AvailabilityUpdateManyArgs>(args: SelectSubset<T, AvailabilityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Availabilities and returns the data updated in the database.
     * @param {AvailabilityUpdateManyAndReturnArgs} args - Arguments to update many Availabilities.
     * @example
     * // Update many Availabilities
     * const availability = await prisma.availability.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Availabilities and only return the `id`
     * const availabilityWithIdOnly = await prisma.availability.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AvailabilityUpdateManyAndReturnArgs>(args: SelectSubset<T, AvailabilityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Availability.
     * @param {AvailabilityUpsertArgs} args - Arguments to update or create a Availability.
     * @example
     * // Update or create a Availability
     * const availability = await prisma.availability.upsert({
     *   create: {
     *     // ... data to create a Availability
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Availability we want to update
     *   }
     * })
     */
    upsert<T extends AvailabilityUpsertArgs>(args: SelectSubset<T, AvailabilityUpsertArgs<ExtArgs>>): Prisma__AvailabilityClient<$Result.GetResult<Prisma.$AvailabilityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Availabilities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityCountArgs} args - Arguments to filter Availabilities to count.
     * @example
     * // Count the number of Availabilities
     * const count = await prisma.availability.count({
     *   where: {
     *     // ... the filter for the Availabilities we want to count
     *   }
     * })
    **/
    count<T extends AvailabilityCountArgs>(
      args?: Subset<T, AvailabilityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AvailabilityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Availability.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AvailabilityAggregateArgs>(args: Subset<T, AvailabilityAggregateArgs>): Prisma.PrismaPromise<GetAvailabilityAggregateType<T>>

    /**
     * Group by Availability.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AvailabilityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AvailabilityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AvailabilityGroupByArgs['orderBy'] }
        : { orderBy?: AvailabilityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AvailabilityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAvailabilityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Availability model
   */
  readonly fields: AvailabilityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Availability.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AvailabilityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    space<T extends SpaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceDefaultArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Availability model
   */
  interface AvailabilityFieldRefs {
    readonly id: FieldRef<"Availability", 'Int'>
    readonly spaceId: FieldRef<"Availability", 'Int'>
    readonly dayOfWeek: FieldRef<"Availability", 'Int'>
    readonly startTime: FieldRef<"Availability", 'String'>
    readonly endTime: FieldRef<"Availability", 'String'>
    readonly isOpen: FieldRef<"Availability", 'Boolean'>
  }
    

  // Custom InputTypes
  /**
   * Availability findUnique
   */
  export type AvailabilityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter, which Availability to fetch.
     */
    where: AvailabilityWhereUniqueInput
  }

  /**
   * Availability findUniqueOrThrow
   */
  export type AvailabilityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter, which Availability to fetch.
     */
    where: AvailabilityWhereUniqueInput
  }

  /**
   * Availability findFirst
   */
  export type AvailabilityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter, which Availability to fetch.
     */
    where?: AvailabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Availabilities to fetch.
     */
    orderBy?: AvailabilityOrderByWithRelationInput | AvailabilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Availabilities.
     */
    cursor?: AvailabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Availabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Availabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Availabilities.
     */
    distinct?: AvailabilityScalarFieldEnum | AvailabilityScalarFieldEnum[]
  }

  /**
   * Availability findFirstOrThrow
   */
  export type AvailabilityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter, which Availability to fetch.
     */
    where?: AvailabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Availabilities to fetch.
     */
    orderBy?: AvailabilityOrderByWithRelationInput | AvailabilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Availabilities.
     */
    cursor?: AvailabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Availabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Availabilities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Availabilities.
     */
    distinct?: AvailabilityScalarFieldEnum | AvailabilityScalarFieldEnum[]
  }

  /**
   * Availability findMany
   */
  export type AvailabilityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter, which Availabilities to fetch.
     */
    where?: AvailabilityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Availabilities to fetch.
     */
    orderBy?: AvailabilityOrderByWithRelationInput | AvailabilityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Availabilities.
     */
    cursor?: AvailabilityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Availabilities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Availabilities.
     */
    skip?: number
    distinct?: AvailabilityScalarFieldEnum | AvailabilityScalarFieldEnum[]
  }

  /**
   * Availability create
   */
  export type AvailabilityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * The data needed to create a Availability.
     */
    data: XOR<AvailabilityCreateInput, AvailabilityUncheckedCreateInput>
  }

  /**
   * Availability createMany
   */
  export type AvailabilityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Availabilities.
     */
    data: AvailabilityCreateManyInput | AvailabilityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Availability createManyAndReturn
   */
  export type AvailabilityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * The data used to create many Availabilities.
     */
    data: AvailabilityCreateManyInput | AvailabilityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Availability update
   */
  export type AvailabilityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * The data needed to update a Availability.
     */
    data: XOR<AvailabilityUpdateInput, AvailabilityUncheckedUpdateInput>
    /**
     * Choose, which Availability to update.
     */
    where: AvailabilityWhereUniqueInput
  }

  /**
   * Availability updateMany
   */
  export type AvailabilityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Availabilities.
     */
    data: XOR<AvailabilityUpdateManyMutationInput, AvailabilityUncheckedUpdateManyInput>
    /**
     * Filter which Availabilities to update
     */
    where?: AvailabilityWhereInput
    /**
     * Limit how many Availabilities to update.
     */
    limit?: number
  }

  /**
   * Availability updateManyAndReturn
   */
  export type AvailabilityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * The data used to update Availabilities.
     */
    data: XOR<AvailabilityUpdateManyMutationInput, AvailabilityUncheckedUpdateManyInput>
    /**
     * Filter which Availabilities to update
     */
    where?: AvailabilityWhereInput
    /**
     * Limit how many Availabilities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Availability upsert
   */
  export type AvailabilityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * The filter to search for the Availability to update in case it exists.
     */
    where: AvailabilityWhereUniqueInput
    /**
     * In case the Availability found by the `where` argument doesn't exist, create a new Availability with this data.
     */
    create: XOR<AvailabilityCreateInput, AvailabilityUncheckedCreateInput>
    /**
     * In case the Availability was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AvailabilityUpdateInput, AvailabilityUncheckedUpdateInput>
  }

  /**
   * Availability delete
   */
  export type AvailabilityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
    /**
     * Filter which Availability to delete.
     */
    where: AvailabilityWhereUniqueInput
  }

  /**
   * Availability deleteMany
   */
  export type AvailabilityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Availabilities to delete
     */
    where?: AvailabilityWhereInput
    /**
     * Limit how many Availabilities to delete.
     */
    limit?: number
  }

  /**
   * Availability without action
   */
  export type AvailabilityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Availability
     */
    select?: AvailabilitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Availability
     */
    omit?: AvailabilityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AvailabilityInclude<ExtArgs> | null
  }


  /**
   * Model BlockedDate
   */

  export type AggregateBlockedDate = {
    _count: BlockedDateCountAggregateOutputType | null
    _avg: BlockedDateAvgAggregateOutputType | null
    _sum: BlockedDateSumAggregateOutputType | null
    _min: BlockedDateMinAggregateOutputType | null
    _max: BlockedDateMaxAggregateOutputType | null
  }

  export type BlockedDateAvgAggregateOutputType = {
    id: number | null
    spaceId: number | null
  }

  export type BlockedDateSumAggregateOutputType = {
    id: number | null
    spaceId: number | null
  }

  export type BlockedDateMinAggregateOutputType = {
    id: number | null
    spaceId: number | null
    date: Date | null
    reason: string | null
  }

  export type BlockedDateMaxAggregateOutputType = {
    id: number | null
    spaceId: number | null
    date: Date | null
    reason: string | null
  }

  export type BlockedDateCountAggregateOutputType = {
    id: number
    spaceId: number
    date: number
    reason: number
    _all: number
  }


  export type BlockedDateAvgAggregateInputType = {
    id?: true
    spaceId?: true
  }

  export type BlockedDateSumAggregateInputType = {
    id?: true
    spaceId?: true
  }

  export type BlockedDateMinAggregateInputType = {
    id?: true
    spaceId?: true
    date?: true
    reason?: true
  }

  export type BlockedDateMaxAggregateInputType = {
    id?: true
    spaceId?: true
    date?: true
    reason?: true
  }

  export type BlockedDateCountAggregateInputType = {
    id?: true
    spaceId?: true
    date?: true
    reason?: true
    _all?: true
  }

  export type BlockedDateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlockedDate to aggregate.
     */
    where?: BlockedDateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlockedDates to fetch.
     */
    orderBy?: BlockedDateOrderByWithRelationInput | BlockedDateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BlockedDateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlockedDates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlockedDates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BlockedDates
    **/
    _count?: true | BlockedDateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BlockedDateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BlockedDateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BlockedDateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BlockedDateMaxAggregateInputType
  }

  export type GetBlockedDateAggregateType<T extends BlockedDateAggregateArgs> = {
        [P in keyof T & keyof AggregateBlockedDate]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBlockedDate[P]>
      : GetScalarType<T[P], AggregateBlockedDate[P]>
  }




  export type BlockedDateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BlockedDateWhereInput
    orderBy?: BlockedDateOrderByWithAggregationInput | BlockedDateOrderByWithAggregationInput[]
    by: BlockedDateScalarFieldEnum[] | BlockedDateScalarFieldEnum
    having?: BlockedDateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BlockedDateCountAggregateInputType | true
    _avg?: BlockedDateAvgAggregateInputType
    _sum?: BlockedDateSumAggregateInputType
    _min?: BlockedDateMinAggregateInputType
    _max?: BlockedDateMaxAggregateInputType
  }

  export type BlockedDateGroupByOutputType = {
    id: number
    spaceId: number
    date: Date
    reason: string | null
    _count: BlockedDateCountAggregateOutputType | null
    _avg: BlockedDateAvgAggregateOutputType | null
    _sum: BlockedDateSumAggregateOutputType | null
    _min: BlockedDateMinAggregateOutputType | null
    _max: BlockedDateMaxAggregateOutputType | null
  }

  type GetBlockedDateGroupByPayload<T extends BlockedDateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BlockedDateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BlockedDateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BlockedDateGroupByOutputType[P]>
            : GetScalarType<T[P], BlockedDateGroupByOutputType[P]>
        }
      >
    >


  export type BlockedDateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    date?: boolean
    reason?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blockedDate"]>

  export type BlockedDateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    date?: boolean
    reason?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blockedDate"]>

  export type BlockedDateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    spaceId?: boolean
    date?: boolean
    reason?: boolean
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["blockedDate"]>

  export type BlockedDateSelectScalar = {
    id?: boolean
    spaceId?: boolean
    date?: boolean
    reason?: boolean
  }

  export type BlockedDateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "spaceId" | "date" | "reason", ExtArgs["result"]["blockedDate"]>
  export type BlockedDateInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }
  export type BlockedDateIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }
  export type BlockedDateIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }

  export type $BlockedDatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BlockedDate"
    objects: {
      space: Prisma.$SpacePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      spaceId: number
      date: Date
      reason: string | null
    }, ExtArgs["result"]["blockedDate"]>
    composites: {}
  }

  type BlockedDateGetPayload<S extends boolean | null | undefined | BlockedDateDefaultArgs> = $Result.GetResult<Prisma.$BlockedDatePayload, S>

  type BlockedDateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BlockedDateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BlockedDateCountAggregateInputType | true
    }

  export interface BlockedDateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BlockedDate'], meta: { name: 'BlockedDate' } }
    /**
     * Find zero or one BlockedDate that matches the filter.
     * @param {BlockedDateFindUniqueArgs} args - Arguments to find a BlockedDate
     * @example
     * // Get one BlockedDate
     * const blockedDate = await prisma.blockedDate.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BlockedDateFindUniqueArgs>(args: SelectSubset<T, BlockedDateFindUniqueArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BlockedDate that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BlockedDateFindUniqueOrThrowArgs} args - Arguments to find a BlockedDate
     * @example
     * // Get one BlockedDate
     * const blockedDate = await prisma.blockedDate.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BlockedDateFindUniqueOrThrowArgs>(args: SelectSubset<T, BlockedDateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlockedDate that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateFindFirstArgs} args - Arguments to find a BlockedDate
     * @example
     * // Get one BlockedDate
     * const blockedDate = await prisma.blockedDate.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BlockedDateFindFirstArgs>(args?: SelectSubset<T, BlockedDateFindFirstArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BlockedDate that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateFindFirstOrThrowArgs} args - Arguments to find a BlockedDate
     * @example
     * // Get one BlockedDate
     * const blockedDate = await prisma.blockedDate.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BlockedDateFindFirstOrThrowArgs>(args?: SelectSubset<T, BlockedDateFindFirstOrThrowArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BlockedDates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BlockedDates
     * const blockedDates = await prisma.blockedDate.findMany()
     * 
     * // Get first 10 BlockedDates
     * const blockedDates = await prisma.blockedDate.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const blockedDateWithIdOnly = await prisma.blockedDate.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BlockedDateFindManyArgs>(args?: SelectSubset<T, BlockedDateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BlockedDate.
     * @param {BlockedDateCreateArgs} args - Arguments to create a BlockedDate.
     * @example
     * // Create one BlockedDate
     * const BlockedDate = await prisma.blockedDate.create({
     *   data: {
     *     // ... data to create a BlockedDate
     *   }
     * })
     * 
     */
    create<T extends BlockedDateCreateArgs>(args: SelectSubset<T, BlockedDateCreateArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BlockedDates.
     * @param {BlockedDateCreateManyArgs} args - Arguments to create many BlockedDates.
     * @example
     * // Create many BlockedDates
     * const blockedDate = await prisma.blockedDate.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BlockedDateCreateManyArgs>(args?: SelectSubset<T, BlockedDateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BlockedDates and returns the data saved in the database.
     * @param {BlockedDateCreateManyAndReturnArgs} args - Arguments to create many BlockedDates.
     * @example
     * // Create many BlockedDates
     * const blockedDate = await prisma.blockedDate.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BlockedDates and only return the `id`
     * const blockedDateWithIdOnly = await prisma.blockedDate.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BlockedDateCreateManyAndReturnArgs>(args?: SelectSubset<T, BlockedDateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BlockedDate.
     * @param {BlockedDateDeleteArgs} args - Arguments to delete one BlockedDate.
     * @example
     * // Delete one BlockedDate
     * const BlockedDate = await prisma.blockedDate.delete({
     *   where: {
     *     // ... filter to delete one BlockedDate
     *   }
     * })
     * 
     */
    delete<T extends BlockedDateDeleteArgs>(args: SelectSubset<T, BlockedDateDeleteArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BlockedDate.
     * @param {BlockedDateUpdateArgs} args - Arguments to update one BlockedDate.
     * @example
     * // Update one BlockedDate
     * const blockedDate = await prisma.blockedDate.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BlockedDateUpdateArgs>(args: SelectSubset<T, BlockedDateUpdateArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BlockedDates.
     * @param {BlockedDateDeleteManyArgs} args - Arguments to filter BlockedDates to delete.
     * @example
     * // Delete a few BlockedDates
     * const { count } = await prisma.blockedDate.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BlockedDateDeleteManyArgs>(args?: SelectSubset<T, BlockedDateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlockedDates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BlockedDates
     * const blockedDate = await prisma.blockedDate.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BlockedDateUpdateManyArgs>(args: SelectSubset<T, BlockedDateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BlockedDates and returns the data updated in the database.
     * @param {BlockedDateUpdateManyAndReturnArgs} args - Arguments to update many BlockedDates.
     * @example
     * // Update many BlockedDates
     * const blockedDate = await prisma.blockedDate.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BlockedDates and only return the `id`
     * const blockedDateWithIdOnly = await prisma.blockedDate.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BlockedDateUpdateManyAndReturnArgs>(args: SelectSubset<T, BlockedDateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BlockedDate.
     * @param {BlockedDateUpsertArgs} args - Arguments to update or create a BlockedDate.
     * @example
     * // Update or create a BlockedDate
     * const blockedDate = await prisma.blockedDate.upsert({
     *   create: {
     *     // ... data to create a BlockedDate
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BlockedDate we want to update
     *   }
     * })
     */
    upsert<T extends BlockedDateUpsertArgs>(args: SelectSubset<T, BlockedDateUpsertArgs<ExtArgs>>): Prisma__BlockedDateClient<$Result.GetResult<Prisma.$BlockedDatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BlockedDates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateCountArgs} args - Arguments to filter BlockedDates to count.
     * @example
     * // Count the number of BlockedDates
     * const count = await prisma.blockedDate.count({
     *   where: {
     *     // ... the filter for the BlockedDates we want to count
     *   }
     * })
    **/
    count<T extends BlockedDateCountArgs>(
      args?: Subset<T, BlockedDateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BlockedDateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BlockedDate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BlockedDateAggregateArgs>(args: Subset<T, BlockedDateAggregateArgs>): Prisma.PrismaPromise<GetBlockedDateAggregateType<T>>

    /**
     * Group by BlockedDate.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BlockedDateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BlockedDateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BlockedDateGroupByArgs['orderBy'] }
        : { orderBy?: BlockedDateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BlockedDateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBlockedDateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BlockedDate model
   */
  readonly fields: BlockedDateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BlockedDate.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BlockedDateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    space<T extends SpaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceDefaultArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BlockedDate model
   */
  interface BlockedDateFieldRefs {
    readonly id: FieldRef<"BlockedDate", 'Int'>
    readonly spaceId: FieldRef<"BlockedDate", 'Int'>
    readonly date: FieldRef<"BlockedDate", 'DateTime'>
    readonly reason: FieldRef<"BlockedDate", 'String'>
  }
    

  // Custom InputTypes
  /**
   * BlockedDate findUnique
   */
  export type BlockedDateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter, which BlockedDate to fetch.
     */
    where: BlockedDateWhereUniqueInput
  }

  /**
   * BlockedDate findUniqueOrThrow
   */
  export type BlockedDateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter, which BlockedDate to fetch.
     */
    where: BlockedDateWhereUniqueInput
  }

  /**
   * BlockedDate findFirst
   */
  export type BlockedDateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter, which BlockedDate to fetch.
     */
    where?: BlockedDateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlockedDates to fetch.
     */
    orderBy?: BlockedDateOrderByWithRelationInput | BlockedDateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlockedDates.
     */
    cursor?: BlockedDateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlockedDates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlockedDates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlockedDates.
     */
    distinct?: BlockedDateScalarFieldEnum | BlockedDateScalarFieldEnum[]
  }

  /**
   * BlockedDate findFirstOrThrow
   */
  export type BlockedDateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter, which BlockedDate to fetch.
     */
    where?: BlockedDateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlockedDates to fetch.
     */
    orderBy?: BlockedDateOrderByWithRelationInput | BlockedDateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BlockedDates.
     */
    cursor?: BlockedDateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlockedDates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlockedDates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BlockedDates.
     */
    distinct?: BlockedDateScalarFieldEnum | BlockedDateScalarFieldEnum[]
  }

  /**
   * BlockedDate findMany
   */
  export type BlockedDateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter, which BlockedDates to fetch.
     */
    where?: BlockedDateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BlockedDates to fetch.
     */
    orderBy?: BlockedDateOrderByWithRelationInput | BlockedDateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BlockedDates.
     */
    cursor?: BlockedDateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BlockedDates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BlockedDates.
     */
    skip?: number
    distinct?: BlockedDateScalarFieldEnum | BlockedDateScalarFieldEnum[]
  }

  /**
   * BlockedDate create
   */
  export type BlockedDateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * The data needed to create a BlockedDate.
     */
    data: XOR<BlockedDateCreateInput, BlockedDateUncheckedCreateInput>
  }

  /**
   * BlockedDate createMany
   */
  export type BlockedDateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BlockedDates.
     */
    data: BlockedDateCreateManyInput | BlockedDateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BlockedDate createManyAndReturn
   */
  export type BlockedDateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * The data used to create many BlockedDates.
     */
    data: BlockedDateCreateManyInput | BlockedDateCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BlockedDate update
   */
  export type BlockedDateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * The data needed to update a BlockedDate.
     */
    data: XOR<BlockedDateUpdateInput, BlockedDateUncheckedUpdateInput>
    /**
     * Choose, which BlockedDate to update.
     */
    where: BlockedDateWhereUniqueInput
  }

  /**
   * BlockedDate updateMany
   */
  export type BlockedDateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BlockedDates.
     */
    data: XOR<BlockedDateUpdateManyMutationInput, BlockedDateUncheckedUpdateManyInput>
    /**
     * Filter which BlockedDates to update
     */
    where?: BlockedDateWhereInput
    /**
     * Limit how many BlockedDates to update.
     */
    limit?: number
  }

  /**
   * BlockedDate updateManyAndReturn
   */
  export type BlockedDateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * The data used to update BlockedDates.
     */
    data: XOR<BlockedDateUpdateManyMutationInput, BlockedDateUncheckedUpdateManyInput>
    /**
     * Filter which BlockedDates to update
     */
    where?: BlockedDateWhereInput
    /**
     * Limit how many BlockedDates to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BlockedDate upsert
   */
  export type BlockedDateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * The filter to search for the BlockedDate to update in case it exists.
     */
    where: BlockedDateWhereUniqueInput
    /**
     * In case the BlockedDate found by the `where` argument doesn't exist, create a new BlockedDate with this data.
     */
    create: XOR<BlockedDateCreateInput, BlockedDateUncheckedCreateInput>
    /**
     * In case the BlockedDate was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BlockedDateUpdateInput, BlockedDateUncheckedUpdateInput>
  }

  /**
   * BlockedDate delete
   */
  export type BlockedDateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
    /**
     * Filter which BlockedDate to delete.
     */
    where: BlockedDateWhereUniqueInput
  }

  /**
   * BlockedDate deleteMany
   */
  export type BlockedDateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BlockedDates to delete
     */
    where?: BlockedDateWhereInput
    /**
     * Limit how many BlockedDates to delete.
     */
    limit?: number
  }

  /**
   * BlockedDate without action
   */
  export type BlockedDateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BlockedDate
     */
    select?: BlockedDateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BlockedDate
     */
    omit?: BlockedDateOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BlockedDateInclude<ExtArgs> | null
  }


  /**
   * Model Booking
   */

  export type AggregateBooking = {
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  export type BookingAvgAggregateOutputType = {
    numberOfGuests: number | null
    spaceId: number | null
    subtotal: number | null
    serviceFee: number | null
    totalAmount: number | null
    depositAmount: number | null
    remainingAmount: number | null
  }

  export type BookingSumAggregateOutputType = {
    numberOfGuests: number | null
    spaceId: number | null
    subtotal: number | null
    serviceFee: number | null
    totalAmount: number | null
    depositAmount: number | null
    remainingAmount: number | null
  }

  export type BookingMinAggregateOutputType = {
    id: string | null
    userId: string | null
    guestEmail: string | null
    guestName: string | null
    guestPhone: string | null
    numberOfGuests: number | null
    spaceId: number | null
    startDateTime: Date | null
    endDateTime: Date | null
    isHourly: boolean | null
    subtotal: number | null
    serviceFee: number | null
    totalAmount: number | null
    depositAmount: number | null
    remainingAmount: number | null
    depositPaid: boolean | null
    depositPaidAt: Date | null
    remainingPaid: boolean | null
    remainingPaidAt: Date | null
    depositSessionId: string | null
    remainingSessionId: string | null
    depositPaymentIntentId: string | null
    remainingPaymentIntentId: string | null
    status: $Enums.BookingStatus | null
    hostNote: string | null
    guestNote: string | null
    createdAt: Date | null
    updatedAt: Date | null
    approvedAt: Date | null
    cancelledAt: Date | null
    completedAt: Date | null
  }

  export type BookingMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    guestEmail: string | null
    guestName: string | null
    guestPhone: string | null
    numberOfGuests: number | null
    spaceId: number | null
    startDateTime: Date | null
    endDateTime: Date | null
    isHourly: boolean | null
    subtotal: number | null
    serviceFee: number | null
    totalAmount: number | null
    depositAmount: number | null
    remainingAmount: number | null
    depositPaid: boolean | null
    depositPaidAt: Date | null
    remainingPaid: boolean | null
    remainingPaidAt: Date | null
    depositSessionId: string | null
    remainingSessionId: string | null
    depositPaymentIntentId: string | null
    remainingPaymentIntentId: string | null
    status: $Enums.BookingStatus | null
    hostNote: string | null
    guestNote: string | null
    createdAt: Date | null
    updatedAt: Date | null
    approvedAt: Date | null
    cancelledAt: Date | null
    completedAt: Date | null
  }

  export type BookingCountAggregateOutputType = {
    id: number
    userId: number
    guestEmail: number
    guestName: number
    guestPhone: number
    numberOfGuests: number
    spaceId: number
    startDateTime: number
    endDateTime: number
    isHourly: number
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid: number
    depositPaidAt: number
    remainingPaid: number
    remainingPaidAt: number
    depositSessionId: number
    remainingSessionId: number
    depositPaymentIntentId: number
    remainingPaymentIntentId: number
    status: number
    hostNote: number
    guestNote: number
    createdAt: number
    updatedAt: number
    approvedAt: number
    cancelledAt: number
    completedAt: number
    _all: number
  }


  export type BookingAvgAggregateInputType = {
    numberOfGuests?: true
    spaceId?: true
    subtotal?: true
    serviceFee?: true
    totalAmount?: true
    depositAmount?: true
    remainingAmount?: true
  }

  export type BookingSumAggregateInputType = {
    numberOfGuests?: true
    spaceId?: true
    subtotal?: true
    serviceFee?: true
    totalAmount?: true
    depositAmount?: true
    remainingAmount?: true
  }

  export type BookingMinAggregateInputType = {
    id?: true
    userId?: true
    guestEmail?: true
    guestName?: true
    guestPhone?: true
    numberOfGuests?: true
    spaceId?: true
    startDateTime?: true
    endDateTime?: true
    isHourly?: true
    subtotal?: true
    serviceFee?: true
    totalAmount?: true
    depositAmount?: true
    remainingAmount?: true
    depositPaid?: true
    depositPaidAt?: true
    remainingPaid?: true
    remainingPaidAt?: true
    depositSessionId?: true
    remainingSessionId?: true
    depositPaymentIntentId?: true
    remainingPaymentIntentId?: true
    status?: true
    hostNote?: true
    guestNote?: true
    createdAt?: true
    updatedAt?: true
    approvedAt?: true
    cancelledAt?: true
    completedAt?: true
  }

  export type BookingMaxAggregateInputType = {
    id?: true
    userId?: true
    guestEmail?: true
    guestName?: true
    guestPhone?: true
    numberOfGuests?: true
    spaceId?: true
    startDateTime?: true
    endDateTime?: true
    isHourly?: true
    subtotal?: true
    serviceFee?: true
    totalAmount?: true
    depositAmount?: true
    remainingAmount?: true
    depositPaid?: true
    depositPaidAt?: true
    remainingPaid?: true
    remainingPaidAt?: true
    depositSessionId?: true
    remainingSessionId?: true
    depositPaymentIntentId?: true
    remainingPaymentIntentId?: true
    status?: true
    hostNote?: true
    guestNote?: true
    createdAt?: true
    updatedAt?: true
    approvedAt?: true
    cancelledAt?: true
    completedAt?: true
  }

  export type BookingCountAggregateInputType = {
    id?: true
    userId?: true
    guestEmail?: true
    guestName?: true
    guestPhone?: true
    numberOfGuests?: true
    spaceId?: true
    startDateTime?: true
    endDateTime?: true
    isHourly?: true
    subtotal?: true
    serviceFee?: true
    totalAmount?: true
    depositAmount?: true
    remainingAmount?: true
    depositPaid?: true
    depositPaidAt?: true
    remainingPaid?: true
    remainingPaidAt?: true
    depositSessionId?: true
    remainingSessionId?: true
    depositPaymentIntentId?: true
    remainingPaymentIntentId?: true
    status?: true
    hostNote?: true
    guestNote?: true
    createdAt?: true
    updatedAt?: true
    approvedAt?: true
    cancelledAt?: true
    completedAt?: true
    _all?: true
  }

  export type BookingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Booking to aggregate.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Bookings
    **/
    _count?: true | BookingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BookingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BookingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BookingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BookingMaxAggregateInputType
  }

  export type GetBookingAggregateType<T extends BookingAggregateArgs> = {
        [P in keyof T & keyof AggregateBooking]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBooking[P]>
      : GetScalarType<T[P], AggregateBooking[P]>
  }




  export type BookingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BookingWhereInput
    orderBy?: BookingOrderByWithAggregationInput | BookingOrderByWithAggregationInput[]
    by: BookingScalarFieldEnum[] | BookingScalarFieldEnum
    having?: BookingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BookingCountAggregateInputType | true
    _avg?: BookingAvgAggregateInputType
    _sum?: BookingSumAggregateInputType
    _min?: BookingMinAggregateInputType
    _max?: BookingMaxAggregateInputType
  }

  export type BookingGroupByOutputType = {
    id: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone: string | null
    numberOfGuests: number
    spaceId: number
    startDateTime: Date
    endDateTime: Date
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid: boolean
    depositPaidAt: Date | null
    remainingPaid: boolean
    remainingPaidAt: Date | null
    depositSessionId: string | null
    remainingSessionId: string | null
    depositPaymentIntentId: string | null
    remainingPaymentIntentId: string | null
    status: $Enums.BookingStatus
    hostNote: string | null
    guestNote: string | null
    createdAt: Date
    updatedAt: Date
    approvedAt: Date | null
    cancelledAt: Date | null
    completedAt: Date | null
    _count: BookingCountAggregateOutputType | null
    _avg: BookingAvgAggregateOutputType | null
    _sum: BookingSumAggregateOutputType | null
    _min: BookingMinAggregateOutputType | null
    _max: BookingMaxAggregateOutputType | null
  }

  type GetBookingGroupByPayload<T extends BookingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BookingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BookingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BookingGroupByOutputType[P]>
            : GetScalarType<T[P], BookingGroupByOutputType[P]>
        }
      >
    >


  export type BookingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    guestEmail?: boolean
    guestName?: boolean
    guestPhone?: boolean
    numberOfGuests?: boolean
    spaceId?: boolean
    startDateTime?: boolean
    endDateTime?: boolean
    isHourly?: boolean
    subtotal?: boolean
    serviceFee?: boolean
    totalAmount?: boolean
    depositAmount?: boolean
    remainingAmount?: boolean
    depositPaid?: boolean
    depositPaidAt?: boolean
    remainingPaid?: boolean
    remainingPaidAt?: boolean
    depositSessionId?: boolean
    remainingSessionId?: boolean
    depositPaymentIntentId?: boolean
    remainingPaymentIntentId?: boolean
    status?: boolean
    hostNote?: boolean
    guestNote?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    approvedAt?: boolean
    cancelledAt?: boolean
    completedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    review?: boolean | Booking$reviewArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    guestEmail?: boolean
    guestName?: boolean
    guestPhone?: boolean
    numberOfGuests?: boolean
    spaceId?: boolean
    startDateTime?: boolean
    endDateTime?: boolean
    isHourly?: boolean
    subtotal?: boolean
    serviceFee?: boolean
    totalAmount?: boolean
    depositAmount?: boolean
    remainingAmount?: boolean
    depositPaid?: boolean
    depositPaidAt?: boolean
    remainingPaid?: boolean
    remainingPaidAt?: boolean
    depositSessionId?: boolean
    remainingSessionId?: boolean
    depositPaymentIntentId?: boolean
    remainingPaymentIntentId?: boolean
    status?: boolean
    hostNote?: boolean
    guestNote?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    approvedAt?: boolean
    cancelledAt?: boolean
    completedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    guestEmail?: boolean
    guestName?: boolean
    guestPhone?: boolean
    numberOfGuests?: boolean
    spaceId?: boolean
    startDateTime?: boolean
    endDateTime?: boolean
    isHourly?: boolean
    subtotal?: boolean
    serviceFee?: boolean
    totalAmount?: boolean
    depositAmount?: boolean
    remainingAmount?: boolean
    depositPaid?: boolean
    depositPaidAt?: boolean
    remainingPaid?: boolean
    remainingPaidAt?: boolean
    depositSessionId?: boolean
    remainingSessionId?: boolean
    depositPaymentIntentId?: boolean
    remainingPaymentIntentId?: boolean
    status?: boolean
    hostNote?: boolean
    guestNote?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    approvedAt?: boolean
    cancelledAt?: boolean
    completedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["booking"]>

  export type BookingSelectScalar = {
    id?: boolean
    userId?: boolean
    guestEmail?: boolean
    guestName?: boolean
    guestPhone?: boolean
    numberOfGuests?: boolean
    spaceId?: boolean
    startDateTime?: boolean
    endDateTime?: boolean
    isHourly?: boolean
    subtotal?: boolean
    serviceFee?: boolean
    totalAmount?: boolean
    depositAmount?: boolean
    remainingAmount?: boolean
    depositPaid?: boolean
    depositPaidAt?: boolean
    remainingPaid?: boolean
    remainingPaidAt?: boolean
    depositSessionId?: boolean
    remainingSessionId?: boolean
    depositPaymentIntentId?: boolean
    remainingPaymentIntentId?: boolean
    status?: boolean
    hostNote?: boolean
    guestNote?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    approvedAt?: boolean
    cancelledAt?: boolean
    completedAt?: boolean
  }

  export type BookingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "guestEmail" | "guestName" | "guestPhone" | "numberOfGuests" | "spaceId" | "startDateTime" | "endDateTime" | "isHourly" | "subtotal" | "serviceFee" | "totalAmount" | "depositAmount" | "remainingAmount" | "depositPaid" | "depositPaidAt" | "remainingPaid" | "remainingPaidAt" | "depositSessionId" | "remainingSessionId" | "depositPaymentIntentId" | "remainingPaymentIntentId" | "status" | "hostNote" | "guestNote" | "createdAt" | "updatedAt" | "approvedAt" | "cancelledAt" | "completedAt", ExtArgs["result"]["booking"]>
  export type BookingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    review?: boolean | Booking$reviewArgs<ExtArgs>
  }
  export type BookingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }
  export type BookingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
  }

  export type $BookingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Booking"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      space: Prisma.$SpacePayload<ExtArgs>
      review: Prisma.$ReviewPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      guestEmail: string
      guestName: string
      guestPhone: string | null
      numberOfGuests: number
      spaceId: number
      startDateTime: Date
      endDateTime: Date
      isHourly: boolean
      subtotal: number
      serviceFee: number
      totalAmount: number
      depositAmount: number
      remainingAmount: number
      depositPaid: boolean
      depositPaidAt: Date | null
      remainingPaid: boolean
      remainingPaidAt: Date | null
      depositSessionId: string | null
      remainingSessionId: string | null
      depositPaymentIntentId: string | null
      remainingPaymentIntentId: string | null
      status: $Enums.BookingStatus
      hostNote: string | null
      guestNote: string | null
      createdAt: Date
      updatedAt: Date
      approvedAt: Date | null
      cancelledAt: Date | null
      completedAt: Date | null
    }, ExtArgs["result"]["booking"]>
    composites: {}
  }

  type BookingGetPayload<S extends boolean | null | undefined | BookingDefaultArgs> = $Result.GetResult<Prisma.$BookingPayload, S>

  type BookingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BookingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BookingCountAggregateInputType | true
    }

  export interface BookingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Booking'], meta: { name: 'Booking' } }
    /**
     * Find zero or one Booking that matches the filter.
     * @param {BookingFindUniqueArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BookingFindUniqueArgs>(args: SelectSubset<T, BookingFindUniqueArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Booking that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BookingFindUniqueOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BookingFindUniqueOrThrowArgs>(args: SelectSubset<T, BookingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BookingFindFirstArgs>(args?: SelectSubset<T, BookingFindFirstArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Booking that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindFirstOrThrowArgs} args - Arguments to find a Booking
     * @example
     * // Get one Booking
     * const booking = await prisma.booking.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BookingFindFirstOrThrowArgs>(args?: SelectSubset<T, BookingFindFirstOrThrowArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Bookings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Bookings
     * const bookings = await prisma.booking.findMany()
     * 
     * // Get first 10 Bookings
     * const bookings = await prisma.booking.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bookingWithIdOnly = await prisma.booking.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BookingFindManyArgs>(args?: SelectSubset<T, BookingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Booking.
     * @param {BookingCreateArgs} args - Arguments to create a Booking.
     * @example
     * // Create one Booking
     * const Booking = await prisma.booking.create({
     *   data: {
     *     // ... data to create a Booking
     *   }
     * })
     * 
     */
    create<T extends BookingCreateArgs>(args: SelectSubset<T, BookingCreateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Bookings.
     * @param {BookingCreateManyArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BookingCreateManyArgs>(args?: SelectSubset<T, BookingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Bookings and returns the data saved in the database.
     * @param {BookingCreateManyAndReturnArgs} args - Arguments to create many Bookings.
     * @example
     * // Create many Bookings
     * const booking = await prisma.booking.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BookingCreateManyAndReturnArgs>(args?: SelectSubset<T, BookingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Booking.
     * @param {BookingDeleteArgs} args - Arguments to delete one Booking.
     * @example
     * // Delete one Booking
     * const Booking = await prisma.booking.delete({
     *   where: {
     *     // ... filter to delete one Booking
     *   }
     * })
     * 
     */
    delete<T extends BookingDeleteArgs>(args: SelectSubset<T, BookingDeleteArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Booking.
     * @param {BookingUpdateArgs} args - Arguments to update one Booking.
     * @example
     * // Update one Booking
     * const booking = await prisma.booking.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BookingUpdateArgs>(args: SelectSubset<T, BookingUpdateArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Bookings.
     * @param {BookingDeleteManyArgs} args - Arguments to filter Bookings to delete.
     * @example
     * // Delete a few Bookings
     * const { count } = await prisma.booking.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BookingDeleteManyArgs>(args?: SelectSubset<T, BookingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BookingUpdateManyArgs>(args: SelectSubset<T, BookingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Bookings and returns the data updated in the database.
     * @param {BookingUpdateManyAndReturnArgs} args - Arguments to update many Bookings.
     * @example
     * // Update many Bookings
     * const booking = await prisma.booking.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Bookings and only return the `id`
     * const bookingWithIdOnly = await prisma.booking.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BookingUpdateManyAndReturnArgs>(args: SelectSubset<T, BookingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Booking.
     * @param {BookingUpsertArgs} args - Arguments to update or create a Booking.
     * @example
     * // Update or create a Booking
     * const booking = await prisma.booking.upsert({
     *   create: {
     *     // ... data to create a Booking
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Booking we want to update
     *   }
     * })
     */
    upsert<T extends BookingUpsertArgs>(args: SelectSubset<T, BookingUpsertArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Bookings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingCountArgs} args - Arguments to filter Bookings to count.
     * @example
     * // Count the number of Bookings
     * const count = await prisma.booking.count({
     *   where: {
     *     // ... the filter for the Bookings we want to count
     *   }
     * })
    **/
    count<T extends BookingCountArgs>(
      args?: Subset<T, BookingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BookingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BookingAggregateArgs>(args: Subset<T, BookingAggregateArgs>): Prisma.PrismaPromise<GetBookingAggregateType<T>>

    /**
     * Group by Booking.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BookingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BookingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BookingGroupByArgs['orderBy'] }
        : { orderBy?: BookingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BookingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBookingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Booking model
   */
  readonly fields: BookingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Booking.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BookingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    space<T extends SpaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceDefaultArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    review<T extends Booking$reviewArgs<ExtArgs> = {}>(args?: Subset<T, Booking$reviewArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Booking model
   */
  interface BookingFieldRefs {
    readonly id: FieldRef<"Booking", 'String'>
    readonly userId: FieldRef<"Booking", 'String'>
    readonly guestEmail: FieldRef<"Booking", 'String'>
    readonly guestName: FieldRef<"Booking", 'String'>
    readonly guestPhone: FieldRef<"Booking", 'String'>
    readonly numberOfGuests: FieldRef<"Booking", 'Int'>
    readonly spaceId: FieldRef<"Booking", 'Int'>
    readonly startDateTime: FieldRef<"Booking", 'DateTime'>
    readonly endDateTime: FieldRef<"Booking", 'DateTime'>
    readonly isHourly: FieldRef<"Booking", 'Boolean'>
    readonly subtotal: FieldRef<"Booking", 'Int'>
    readonly serviceFee: FieldRef<"Booking", 'Int'>
    readonly totalAmount: FieldRef<"Booking", 'Int'>
    readonly depositAmount: FieldRef<"Booking", 'Int'>
    readonly remainingAmount: FieldRef<"Booking", 'Int'>
    readonly depositPaid: FieldRef<"Booking", 'Boolean'>
    readonly depositPaidAt: FieldRef<"Booking", 'DateTime'>
    readonly remainingPaid: FieldRef<"Booking", 'Boolean'>
    readonly remainingPaidAt: FieldRef<"Booking", 'DateTime'>
    readonly depositSessionId: FieldRef<"Booking", 'String'>
    readonly remainingSessionId: FieldRef<"Booking", 'String'>
    readonly depositPaymentIntentId: FieldRef<"Booking", 'String'>
    readonly remainingPaymentIntentId: FieldRef<"Booking", 'String'>
    readonly status: FieldRef<"Booking", 'BookingStatus'>
    readonly hostNote: FieldRef<"Booking", 'String'>
    readonly guestNote: FieldRef<"Booking", 'String'>
    readonly createdAt: FieldRef<"Booking", 'DateTime'>
    readonly updatedAt: FieldRef<"Booking", 'DateTime'>
    readonly approvedAt: FieldRef<"Booking", 'DateTime'>
    readonly cancelledAt: FieldRef<"Booking", 'DateTime'>
    readonly completedAt: FieldRef<"Booking", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Booking findUnique
   */
  export type BookingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findUniqueOrThrow
   */
  export type BookingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking findFirst
   */
  export type BookingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findFirstOrThrow
   */
  export type BookingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Booking to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Bookings.
     */
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking findMany
   */
  export type BookingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter, which Bookings to fetch.
     */
    where?: BookingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Bookings to fetch.
     */
    orderBy?: BookingOrderByWithRelationInput | BookingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Bookings.
     */
    cursor?: BookingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Bookings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Bookings.
     */
    skip?: number
    distinct?: BookingScalarFieldEnum | BookingScalarFieldEnum[]
  }

  /**
   * Booking create
   */
  export type BookingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to create a Booking.
     */
    data: XOR<BookingCreateInput, BookingUncheckedCreateInput>
  }

  /**
   * Booking createMany
   */
  export type BookingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Booking createManyAndReturn
   */
  export type BookingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to create many Bookings.
     */
    data: BookingCreateManyInput | BookingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking update
   */
  export type BookingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The data needed to update a Booking.
     */
    data: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
    /**
     * Choose, which Booking to update.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking updateMany
   */
  export type BookingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
  }

  /**
   * Booking updateManyAndReturn
   */
  export type BookingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * The data used to update Bookings.
     */
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyInput>
    /**
     * Filter which Bookings to update
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Booking upsert
   */
  export type BookingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * The filter to search for the Booking to update in case it exists.
     */
    where: BookingWhereUniqueInput
    /**
     * In case the Booking found by the `where` argument doesn't exist, create a new Booking with this data.
     */
    create: XOR<BookingCreateInput, BookingUncheckedCreateInput>
    /**
     * In case the Booking was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BookingUpdateInput, BookingUncheckedUpdateInput>
  }

  /**
   * Booking delete
   */
  export type BookingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
    /**
     * Filter which Booking to delete.
     */
    where: BookingWhereUniqueInput
  }

  /**
   * Booking deleteMany
   */
  export type BookingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Bookings to delete
     */
    where?: BookingWhereInput
    /**
     * Limit how many Bookings to delete.
     */
    limit?: number
  }

  /**
   * Booking.review
   */
  export type Booking$reviewArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    where?: ReviewWhereInput
  }

  /**
   * Booking without action
   */
  export type BookingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Booking
     */
    select?: BookingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Booking
     */
    omit?: BookingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BookingInclude<ExtArgs> | null
  }


  /**
   * Model Review
   */

  export type AggregateReview = {
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  export type ReviewAvgAggregateOutputType = {
    id: number | null
    rating: number | null
    spaceId: number | null
  }

  export type ReviewSumAggregateOutputType = {
    id: number | null
    rating: number | null
    spaceId: number | null
  }

  export type ReviewMinAggregateOutputType = {
    id: number | null
    rating: number | null
    comment: string | null
    userId: string | null
    spaceId: number | null
    bookingId: string | null
    hostResponse: string | null
    hostRespondedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReviewMaxAggregateOutputType = {
    id: number | null
    rating: number | null
    comment: string | null
    userId: string | null
    spaceId: number | null
    bookingId: string | null
    hostResponse: string | null
    hostRespondedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReviewCountAggregateOutputType = {
    id: number
    rating: number
    comment: number
    userId: number
    spaceId: number
    bookingId: number
    hostResponse: number
    hostRespondedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReviewAvgAggregateInputType = {
    id?: true
    rating?: true
    spaceId?: true
  }

  export type ReviewSumAggregateInputType = {
    id?: true
    rating?: true
    spaceId?: true
  }

  export type ReviewMinAggregateInputType = {
    id?: true
    rating?: true
    comment?: true
    userId?: true
    spaceId?: true
    bookingId?: true
    hostResponse?: true
    hostRespondedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReviewMaxAggregateInputType = {
    id?: true
    rating?: true
    comment?: true
    userId?: true
    spaceId?: true
    bookingId?: true
    hostResponse?: true
    hostRespondedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReviewCountAggregateInputType = {
    id?: true
    rating?: true
    comment?: true
    userId?: true
    spaceId?: true
    bookingId?: true
    hostResponse?: true
    hostRespondedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Review to aggregate.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Reviews
    **/
    _count?: true | ReviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReviewMaxAggregateInputType
  }

  export type GetReviewAggregateType<T extends ReviewAggregateArgs> = {
        [P in keyof T & keyof AggregateReview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReview[P]>
      : GetScalarType<T[P], AggregateReview[P]>
  }




  export type ReviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReviewWhereInput
    orderBy?: ReviewOrderByWithAggregationInput | ReviewOrderByWithAggregationInput[]
    by: ReviewScalarFieldEnum[] | ReviewScalarFieldEnum
    having?: ReviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReviewCountAggregateInputType | true
    _avg?: ReviewAvgAggregateInputType
    _sum?: ReviewSumAggregateInputType
    _min?: ReviewMinAggregateInputType
    _max?: ReviewMaxAggregateInputType
  }

  export type ReviewGroupByOutputType = {
    id: number
    rating: number
    comment: string | null
    userId: string
    spaceId: number
    bookingId: string
    hostResponse: string | null
    hostRespondedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReviewCountAggregateOutputType | null
    _avg: ReviewAvgAggregateOutputType | null
    _sum: ReviewSumAggregateOutputType | null
    _min: ReviewMinAggregateOutputType | null
    _max: ReviewMaxAggregateOutputType | null
  }

  type GetReviewGroupByPayload<T extends ReviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReviewGroupByOutputType[P]>
            : GetScalarType<T[P], ReviewGroupByOutputType[P]>
        }
      >
    >


  export type ReviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rating?: boolean
    comment?: boolean
    userId?: boolean
    spaceId?: boolean
    bookingId?: boolean
    hostResponse?: boolean
    hostRespondedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rating?: boolean
    comment?: boolean
    userId?: boolean
    spaceId?: boolean
    bookingId?: boolean
    hostResponse?: boolean
    hostRespondedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    rating?: boolean
    comment?: boolean
    userId?: boolean
    spaceId?: boolean
    bookingId?: boolean
    hostResponse?: boolean
    hostRespondedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["review"]>

  export type ReviewSelectScalar = {
    id?: boolean
    rating?: boolean
    comment?: boolean
    userId?: boolean
    spaceId?: boolean
    bookingId?: boolean
    hostResponse?: boolean
    hostRespondedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReviewOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "rating" | "comment" | "userId" | "spaceId" | "bookingId" | "hostResponse" | "hostRespondedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["review"]>
  export type ReviewInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }
  export type ReviewIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }
  export type ReviewIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    space?: boolean | SpaceDefaultArgs<ExtArgs>
    booking?: boolean | BookingDefaultArgs<ExtArgs>
  }

  export type $ReviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Review"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      space: Prisma.$SpacePayload<ExtArgs>
      booking: Prisma.$BookingPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      rating: number
      comment: string | null
      userId: string
      spaceId: number
      bookingId: string
      hostResponse: string | null
      hostRespondedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["review"]>
    composites: {}
  }

  type ReviewGetPayload<S extends boolean | null | undefined | ReviewDefaultArgs> = $Result.GetResult<Prisma.$ReviewPayload, S>

  type ReviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReviewCountAggregateInputType | true
    }

  export interface ReviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Review'], meta: { name: 'Review' } }
    /**
     * Find zero or one Review that matches the filter.
     * @param {ReviewFindUniqueArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReviewFindUniqueArgs>(args: SelectSubset<T, ReviewFindUniqueArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Review that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReviewFindUniqueOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReviewFindUniqueOrThrowArgs>(args: SelectSubset<T, ReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Review that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReviewFindFirstArgs>(args?: SelectSubset<T, ReviewFindFirstArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Review that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindFirstOrThrowArgs} args - Arguments to find a Review
     * @example
     * // Get one Review
     * const review = await prisma.review.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReviewFindFirstOrThrowArgs>(args?: SelectSubset<T, ReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Reviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Reviews
     * const reviews = await prisma.review.findMany()
     * 
     * // Get first 10 Reviews
     * const reviews = await prisma.review.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const reviewWithIdOnly = await prisma.review.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReviewFindManyArgs>(args?: SelectSubset<T, ReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Review.
     * @param {ReviewCreateArgs} args - Arguments to create a Review.
     * @example
     * // Create one Review
     * const Review = await prisma.review.create({
     *   data: {
     *     // ... data to create a Review
     *   }
     * })
     * 
     */
    create<T extends ReviewCreateArgs>(args: SelectSubset<T, ReviewCreateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Reviews.
     * @param {ReviewCreateManyArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReviewCreateManyArgs>(args?: SelectSubset<T, ReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Reviews and returns the data saved in the database.
     * @param {ReviewCreateManyAndReturnArgs} args - Arguments to create many Reviews.
     * @example
     * // Create many Reviews
     * const review = await prisma.review.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Reviews and only return the `id`
     * const reviewWithIdOnly = await prisma.review.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReviewCreateManyAndReturnArgs>(args?: SelectSubset<T, ReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Review.
     * @param {ReviewDeleteArgs} args - Arguments to delete one Review.
     * @example
     * // Delete one Review
     * const Review = await prisma.review.delete({
     *   where: {
     *     // ... filter to delete one Review
     *   }
     * })
     * 
     */
    delete<T extends ReviewDeleteArgs>(args: SelectSubset<T, ReviewDeleteArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Review.
     * @param {ReviewUpdateArgs} args - Arguments to update one Review.
     * @example
     * // Update one Review
     * const review = await prisma.review.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReviewUpdateArgs>(args: SelectSubset<T, ReviewUpdateArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Reviews.
     * @param {ReviewDeleteManyArgs} args - Arguments to filter Reviews to delete.
     * @example
     * // Delete a few Reviews
     * const { count } = await prisma.review.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReviewDeleteManyArgs>(args?: SelectSubset<T, ReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Reviews
     * const review = await prisma.review.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReviewUpdateManyArgs>(args: SelectSubset<T, ReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Reviews and returns the data updated in the database.
     * @param {ReviewUpdateManyAndReturnArgs} args - Arguments to update many Reviews.
     * @example
     * // Update many Reviews
     * const review = await prisma.review.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Reviews and only return the `id`
     * const reviewWithIdOnly = await prisma.review.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ReviewUpdateManyAndReturnArgs>(args: SelectSubset<T, ReviewUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Review.
     * @param {ReviewUpsertArgs} args - Arguments to update or create a Review.
     * @example
     * // Update or create a Review
     * const review = await prisma.review.upsert({
     *   create: {
     *     // ... data to create a Review
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Review we want to update
     *   }
     * })
     */
    upsert<T extends ReviewUpsertArgs>(args: SelectSubset<T, ReviewUpsertArgs<ExtArgs>>): Prisma__ReviewClient<$Result.GetResult<Prisma.$ReviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Reviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewCountArgs} args - Arguments to filter Reviews to count.
     * @example
     * // Count the number of Reviews
     * const count = await prisma.review.count({
     *   where: {
     *     // ... the filter for the Reviews we want to count
     *   }
     * })
    **/
    count<T extends ReviewCountArgs>(
      args?: Subset<T, ReviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReviewAggregateArgs>(args: Subset<T, ReviewAggregateArgs>): Prisma.PrismaPromise<GetReviewAggregateType<T>>

    /**
     * Group by Review.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReviewGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReviewGroupByArgs['orderBy'] }
        : { orderBy?: ReviewGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Review model
   */
  readonly fields: ReviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Review.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    space<T extends SpaceDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SpaceDefaultArgs<ExtArgs>>): Prisma__SpaceClient<$Result.GetResult<Prisma.$SpacePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    booking<T extends BookingDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BookingDefaultArgs<ExtArgs>>): Prisma__BookingClient<$Result.GetResult<Prisma.$BookingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Review model
   */
  interface ReviewFieldRefs {
    readonly id: FieldRef<"Review", 'Int'>
    readonly rating: FieldRef<"Review", 'Int'>
    readonly comment: FieldRef<"Review", 'String'>
    readonly userId: FieldRef<"Review", 'String'>
    readonly spaceId: FieldRef<"Review", 'Int'>
    readonly bookingId: FieldRef<"Review", 'String'>
    readonly hostResponse: FieldRef<"Review", 'String'>
    readonly hostRespondedAt: FieldRef<"Review", 'DateTime'>
    readonly createdAt: FieldRef<"Review", 'DateTime'>
    readonly updatedAt: FieldRef<"Review", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Review findUnique
   */
  export type ReviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findUniqueOrThrow
   */
  export type ReviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review findFirst
   */
  export type ReviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findFirstOrThrow
   */
  export type ReviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Review to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Reviews.
     */
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review findMany
   */
  export type ReviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter, which Reviews to fetch.
     */
    where?: ReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Reviews to fetch.
     */
    orderBy?: ReviewOrderByWithRelationInput | ReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Reviews.
     */
    cursor?: ReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Reviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Reviews.
     */
    skip?: number
    distinct?: ReviewScalarFieldEnum | ReviewScalarFieldEnum[]
  }

  /**
   * Review create
   */
  export type ReviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The data needed to create a Review.
     */
    data: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
  }

  /**
   * Review createMany
   */
  export type ReviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Review createManyAndReturn
   */
  export type ReviewCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data used to create many Reviews.
     */
    data: ReviewCreateManyInput | ReviewCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Review update
   */
  export type ReviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The data needed to update a Review.
     */
    data: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
    /**
     * Choose, which Review to update.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review updateMany
   */
  export type ReviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Reviews.
     */
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyInput>
    /**
     * Filter which Reviews to update
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to update.
     */
    limit?: number
  }

  /**
   * Review updateManyAndReturn
   */
  export type ReviewUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * The data used to update Reviews.
     */
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyInput>
    /**
     * Filter which Reviews to update
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Review upsert
   */
  export type ReviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * The filter to search for the Review to update in case it exists.
     */
    where: ReviewWhereUniqueInput
    /**
     * In case the Review found by the `where` argument doesn't exist, create a new Review with this data.
     */
    create: XOR<ReviewCreateInput, ReviewUncheckedCreateInput>
    /**
     * In case the Review was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReviewUpdateInput, ReviewUncheckedUpdateInput>
  }

  /**
   * Review delete
   */
  export type ReviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
    /**
     * Filter which Review to delete.
     */
    where: ReviewWhereUniqueInput
  }

  /**
   * Review deleteMany
   */
  export type ReviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Reviews to delete
     */
    where?: ReviewWhereInput
    /**
     * Limit how many Reviews to delete.
     */
    limit?: number
  }

  /**
   * Review without action
   */
  export type ReviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Review
     */
    select?: ReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Review
     */
    omit?: ReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ReviewInclude<ExtArgs> | null
  }


  /**
   * Model Payout
   */

  export type AggregatePayout = {
    _count: PayoutCountAggregateOutputType | null
    _avg: PayoutAvgAggregateOutputType | null
    _sum: PayoutSumAggregateOutputType | null
    _min: PayoutMinAggregateOutputType | null
    _max: PayoutMaxAggregateOutputType | null
  }

  export type PayoutAvgAggregateOutputType = {
    amount: number | null
    platformFee: number | null
    netAmount: number | null
  }

  export type PayoutSumAggregateOutputType = {
    amount: number | null
    platformFee: number | null
    netAmount: number | null
  }

  export type PayoutMinAggregateOutputType = {
    id: string | null
    hostId: string | null
    amount: number | null
    platformFee: number | null
    netAmount: number | null
    status: $Enums.PayoutStatus | null
    stripeTransferId: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutMaxAggregateOutputType = {
    id: string | null
    hostId: string | null
    amount: number | null
    platformFee: number | null
    netAmount: number | null
    status: $Enums.PayoutStatus | null
    stripeTransferId: string | null
    processedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PayoutCountAggregateOutputType = {
    id: number
    hostId: number
    amount: number
    platformFee: number
    netAmount: number
    status: number
    bookingIds: number
    stripeTransferId: number
    processedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PayoutAvgAggregateInputType = {
    amount?: true
    platformFee?: true
    netAmount?: true
  }

  export type PayoutSumAggregateInputType = {
    amount?: true
    platformFee?: true
    netAmount?: true
  }

  export type PayoutMinAggregateInputType = {
    id?: true
    hostId?: true
    amount?: true
    platformFee?: true
    netAmount?: true
    status?: true
    stripeTransferId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutMaxAggregateInputType = {
    id?: true
    hostId?: true
    amount?: true
    platformFee?: true
    netAmount?: true
    status?: true
    stripeTransferId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PayoutCountAggregateInputType = {
    id?: true
    hostId?: true
    amount?: true
    platformFee?: true
    netAmount?: true
    status?: true
    bookingIds?: true
    stripeTransferId?: true
    processedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PayoutAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payout to aggregate.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payouts
    **/
    _count?: true | PayoutCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PayoutAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PayoutSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PayoutMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PayoutMaxAggregateInputType
  }

  export type GetPayoutAggregateType<T extends PayoutAggregateArgs> = {
        [P in keyof T & keyof AggregatePayout]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayout[P]>
      : GetScalarType<T[P], AggregatePayout[P]>
  }




  export type PayoutGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PayoutWhereInput
    orderBy?: PayoutOrderByWithAggregationInput | PayoutOrderByWithAggregationInput[]
    by: PayoutScalarFieldEnum[] | PayoutScalarFieldEnum
    having?: PayoutScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PayoutCountAggregateInputType | true
    _avg?: PayoutAvgAggregateInputType
    _sum?: PayoutSumAggregateInputType
    _min?: PayoutMinAggregateInputType
    _max?: PayoutMaxAggregateInputType
  }

  export type PayoutGroupByOutputType = {
    id: string
    hostId: string
    amount: number
    platformFee: number
    netAmount: number
    status: $Enums.PayoutStatus
    bookingIds: string[]
    stripeTransferId: string | null
    processedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PayoutCountAggregateOutputType | null
    _avg: PayoutAvgAggregateOutputType | null
    _sum: PayoutSumAggregateOutputType | null
    _min: PayoutMinAggregateOutputType | null
    _max: PayoutMaxAggregateOutputType | null
  }

  type GetPayoutGroupByPayload<T extends PayoutGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PayoutGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PayoutGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PayoutGroupByOutputType[P]>
            : GetScalarType<T[P], PayoutGroupByOutputType[P]>
        }
      >
    >


  export type PayoutSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostId?: boolean
    amount?: boolean
    platformFee?: boolean
    netAmount?: boolean
    status?: boolean
    bookingIds?: boolean
    stripeTransferId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payout"]>

  export type PayoutSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostId?: boolean
    amount?: boolean
    platformFee?: boolean
    netAmount?: boolean
    status?: boolean
    bookingIds?: boolean
    stripeTransferId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payout"]>

  export type PayoutSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    hostId?: boolean
    amount?: boolean
    platformFee?: boolean
    netAmount?: boolean
    status?: boolean
    bookingIds?: boolean
    stripeTransferId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    host?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["payout"]>

  export type PayoutSelectScalar = {
    id?: boolean
    hostId?: boolean
    amount?: boolean
    platformFee?: boolean
    netAmount?: boolean
    status?: boolean
    bookingIds?: boolean
    stripeTransferId?: boolean
    processedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PayoutOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "hostId" | "amount" | "platformFee" | "netAmount" | "status" | "bookingIds" | "stripeTransferId" | "processedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["payout"]>
  export type PayoutInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PayoutIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type PayoutIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    host?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $PayoutPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payout"
    objects: {
      host: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      hostId: string
      amount: number
      platformFee: number
      netAmount: number
      status: $Enums.PayoutStatus
      bookingIds: string[]
      stripeTransferId: string | null
      processedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payout"]>
    composites: {}
  }

  type PayoutGetPayload<S extends boolean | null | undefined | PayoutDefaultArgs> = $Result.GetResult<Prisma.$PayoutPayload, S>

  type PayoutCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PayoutFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PayoutCountAggregateInputType | true
    }

  export interface PayoutDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payout'], meta: { name: 'Payout' } }
    /**
     * Find zero or one Payout that matches the filter.
     * @param {PayoutFindUniqueArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PayoutFindUniqueArgs>(args: SelectSubset<T, PayoutFindUniqueArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Payout that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PayoutFindUniqueOrThrowArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PayoutFindUniqueOrThrowArgs>(args: SelectSubset<T, PayoutFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payout that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindFirstArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PayoutFindFirstArgs>(args?: SelectSubset<T, PayoutFindFirstArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payout that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindFirstOrThrowArgs} args - Arguments to find a Payout
     * @example
     * // Get one Payout
     * const payout = await prisma.payout.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PayoutFindFirstOrThrowArgs>(args?: SelectSubset<T, PayoutFindFirstOrThrowArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Payouts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payouts
     * const payouts = await prisma.payout.findMany()
     * 
     * // Get first 10 Payouts
     * const payouts = await prisma.payout.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const payoutWithIdOnly = await prisma.payout.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PayoutFindManyArgs>(args?: SelectSubset<T, PayoutFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Payout.
     * @param {PayoutCreateArgs} args - Arguments to create a Payout.
     * @example
     * // Create one Payout
     * const Payout = await prisma.payout.create({
     *   data: {
     *     // ... data to create a Payout
     *   }
     * })
     * 
     */
    create<T extends PayoutCreateArgs>(args: SelectSubset<T, PayoutCreateArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Payouts.
     * @param {PayoutCreateManyArgs} args - Arguments to create many Payouts.
     * @example
     * // Create many Payouts
     * const payout = await prisma.payout.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PayoutCreateManyArgs>(args?: SelectSubset<T, PayoutCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payouts and returns the data saved in the database.
     * @param {PayoutCreateManyAndReturnArgs} args - Arguments to create many Payouts.
     * @example
     * // Create many Payouts
     * const payout = await prisma.payout.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payouts and only return the `id`
     * const payoutWithIdOnly = await prisma.payout.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PayoutCreateManyAndReturnArgs>(args?: SelectSubset<T, PayoutCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Payout.
     * @param {PayoutDeleteArgs} args - Arguments to delete one Payout.
     * @example
     * // Delete one Payout
     * const Payout = await prisma.payout.delete({
     *   where: {
     *     // ... filter to delete one Payout
     *   }
     * })
     * 
     */
    delete<T extends PayoutDeleteArgs>(args: SelectSubset<T, PayoutDeleteArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Payout.
     * @param {PayoutUpdateArgs} args - Arguments to update one Payout.
     * @example
     * // Update one Payout
     * const payout = await prisma.payout.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PayoutUpdateArgs>(args: SelectSubset<T, PayoutUpdateArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Payouts.
     * @param {PayoutDeleteManyArgs} args - Arguments to filter Payouts to delete.
     * @example
     * // Delete a few Payouts
     * const { count } = await prisma.payout.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PayoutDeleteManyArgs>(args?: SelectSubset<T, PayoutDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payouts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payouts
     * const payout = await prisma.payout.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PayoutUpdateManyArgs>(args: SelectSubset<T, PayoutUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payouts and returns the data updated in the database.
     * @param {PayoutUpdateManyAndReturnArgs} args - Arguments to update many Payouts.
     * @example
     * // Update many Payouts
     * const payout = await prisma.payout.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Payouts and only return the `id`
     * const payoutWithIdOnly = await prisma.payout.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PayoutUpdateManyAndReturnArgs>(args: SelectSubset<T, PayoutUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Payout.
     * @param {PayoutUpsertArgs} args - Arguments to update or create a Payout.
     * @example
     * // Update or create a Payout
     * const payout = await prisma.payout.upsert({
     *   create: {
     *     // ... data to create a Payout
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payout we want to update
     *   }
     * })
     */
    upsert<T extends PayoutUpsertArgs>(args: SelectSubset<T, PayoutUpsertArgs<ExtArgs>>): Prisma__PayoutClient<$Result.GetResult<Prisma.$PayoutPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Payouts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutCountArgs} args - Arguments to filter Payouts to count.
     * @example
     * // Count the number of Payouts
     * const count = await prisma.payout.count({
     *   where: {
     *     // ... the filter for the Payouts we want to count
     *   }
     * })
    **/
    count<T extends PayoutCountArgs>(
      args?: Subset<T, PayoutCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PayoutCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payout.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PayoutAggregateArgs>(args: Subset<T, PayoutAggregateArgs>): Prisma.PrismaPromise<GetPayoutAggregateType<T>>

    /**
     * Group by Payout.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PayoutGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PayoutGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PayoutGroupByArgs['orderBy'] }
        : { orderBy?: PayoutGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PayoutGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPayoutGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payout model
   */
  readonly fields: PayoutFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payout.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PayoutClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    host<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Payout model
   */
  interface PayoutFieldRefs {
    readonly id: FieldRef<"Payout", 'String'>
    readonly hostId: FieldRef<"Payout", 'String'>
    readonly amount: FieldRef<"Payout", 'Int'>
    readonly platformFee: FieldRef<"Payout", 'Int'>
    readonly netAmount: FieldRef<"Payout", 'Int'>
    readonly status: FieldRef<"Payout", 'PayoutStatus'>
    readonly bookingIds: FieldRef<"Payout", 'String[]'>
    readonly stripeTransferId: FieldRef<"Payout", 'String'>
    readonly processedAt: FieldRef<"Payout", 'DateTime'>
    readonly createdAt: FieldRef<"Payout", 'DateTime'>
    readonly updatedAt: FieldRef<"Payout", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Payout findUnique
   */
  export type PayoutFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout findUniqueOrThrow
   */
  export type PayoutFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout findFirst
   */
  export type PayoutFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payouts.
     */
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout findFirstOrThrow
   */
  export type PayoutFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payout to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payouts.
     */
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout findMany
   */
  export type PayoutFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter, which Payouts to fetch.
     */
    where?: PayoutWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payouts to fetch.
     */
    orderBy?: PayoutOrderByWithRelationInput | PayoutOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payouts.
     */
    cursor?: PayoutWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payouts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payouts.
     */
    skip?: number
    distinct?: PayoutScalarFieldEnum | PayoutScalarFieldEnum[]
  }

  /**
   * Payout create
   */
  export type PayoutCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The data needed to create a Payout.
     */
    data: XOR<PayoutCreateInput, PayoutUncheckedCreateInput>
  }

  /**
   * Payout createMany
   */
  export type PayoutCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payouts.
     */
    data: PayoutCreateManyInput | PayoutCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payout createManyAndReturn
   */
  export type PayoutCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * The data used to create many Payouts.
     */
    data: PayoutCreateManyInput | PayoutCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payout update
   */
  export type PayoutUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The data needed to update a Payout.
     */
    data: XOR<PayoutUpdateInput, PayoutUncheckedUpdateInput>
    /**
     * Choose, which Payout to update.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout updateMany
   */
  export type PayoutUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payouts.
     */
    data: XOR<PayoutUpdateManyMutationInput, PayoutUncheckedUpdateManyInput>
    /**
     * Filter which Payouts to update
     */
    where?: PayoutWhereInput
    /**
     * Limit how many Payouts to update.
     */
    limit?: number
  }

  /**
   * Payout updateManyAndReturn
   */
  export type PayoutUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * The data used to update Payouts.
     */
    data: XOR<PayoutUpdateManyMutationInput, PayoutUncheckedUpdateManyInput>
    /**
     * Filter which Payouts to update
     */
    where?: PayoutWhereInput
    /**
     * Limit how many Payouts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Payout upsert
   */
  export type PayoutUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * The filter to search for the Payout to update in case it exists.
     */
    where: PayoutWhereUniqueInput
    /**
     * In case the Payout found by the `where` argument doesn't exist, create a new Payout with this data.
     */
    create: XOR<PayoutCreateInput, PayoutUncheckedCreateInput>
    /**
     * In case the Payout was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PayoutUpdateInput, PayoutUncheckedUpdateInput>
  }

  /**
   * Payout delete
   */
  export type PayoutDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
    /**
     * Filter which Payout to delete.
     */
    where: PayoutWhereUniqueInput
  }

  /**
   * Payout deleteMany
   */
  export type PayoutDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payouts to delete
     */
    where?: PayoutWhereInput
    /**
     * Limit how many Payouts to delete.
     */
    limit?: number
  }

  /**
   * Payout without action
   */
  export type PayoutDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payout
     */
    select?: PayoutSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payout
     */
    omit?: PayoutOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PayoutInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    username: 'username',
    name: 'name',
    password: 'password',
    role: 'role',
    emailVerified: 'emailVerified',
    image: 'image',
    phone: 'phone',
    bio: 'bio',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hostVerified: 'hostVerified',
    hostingSince: 'hostingSince',
    stripeAccountId: 'stripeAccountId'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const SpaceScalarFieldEnum: {
    id: 'id',
    name: 'name',
    shortDescription: 'shortDescription',
    description: 'description',
    spaceType: 'spaceType',
    pricingType: 'pricingType',
    pricePerHour: 'pricePerHour',
    pricePerDay: 'pricePerDay',
    depositPercent: 'depositPercent',
    capacity: 'capacity',
    minBookingHours: 'minBookingHours',
    maxBookingHours: 'maxBookingHours',
    images: 'images',
    address: 'address',
    city: 'city',
    state: 'state',
    country: 'country',
    postalCode: 'postalCode',
    latitude: 'latitude',
    longitude: 'longitude',
    isActive: 'isActive',
    instantBook: 'instantBook',
    cancellationPolicy: 'cancellationPolicy',
    houseRules: 'houseRules',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    hostId: 'hostId',
    categorySlug: 'categorySlug'
  };

  export type SpaceScalarFieldEnum = (typeof SpaceScalarFieldEnum)[keyof typeof SpaceScalarFieldEnum]


  export const SpaceCategoryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    description: 'description',
    icon: 'icon'
  };

  export type SpaceCategoryScalarFieldEnum = (typeof SpaceCategoryScalarFieldEnum)[keyof typeof SpaceCategoryScalarFieldEnum]


  export const AmenityScalarFieldEnum: {
    id: 'id',
    name: 'name',
    icon: 'icon',
    category: 'category'
  };

  export type AmenityScalarFieldEnum = (typeof AmenityScalarFieldEnum)[keyof typeof AmenityScalarFieldEnum]


  export const SpaceAmenityScalarFieldEnum: {
    id: 'id',
    spaceId: 'spaceId',
    amenityId: 'amenityId'
  };

  export type SpaceAmenityScalarFieldEnum = (typeof SpaceAmenityScalarFieldEnum)[keyof typeof SpaceAmenityScalarFieldEnum]


  export const AvailabilityScalarFieldEnum: {
    id: 'id',
    spaceId: 'spaceId',
    dayOfWeek: 'dayOfWeek',
    startTime: 'startTime',
    endTime: 'endTime',
    isOpen: 'isOpen'
  };

  export type AvailabilityScalarFieldEnum = (typeof AvailabilityScalarFieldEnum)[keyof typeof AvailabilityScalarFieldEnum]


  export const BlockedDateScalarFieldEnum: {
    id: 'id',
    spaceId: 'spaceId',
    date: 'date',
    reason: 'reason'
  };

  export type BlockedDateScalarFieldEnum = (typeof BlockedDateScalarFieldEnum)[keyof typeof BlockedDateScalarFieldEnum]


  export const BookingScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    guestEmail: 'guestEmail',
    guestName: 'guestName',
    guestPhone: 'guestPhone',
    numberOfGuests: 'numberOfGuests',
    spaceId: 'spaceId',
    startDateTime: 'startDateTime',
    endDateTime: 'endDateTime',
    isHourly: 'isHourly',
    subtotal: 'subtotal',
    serviceFee: 'serviceFee',
    totalAmount: 'totalAmount',
    depositAmount: 'depositAmount',
    remainingAmount: 'remainingAmount',
    depositPaid: 'depositPaid',
    depositPaidAt: 'depositPaidAt',
    remainingPaid: 'remainingPaid',
    remainingPaidAt: 'remainingPaidAt',
    depositSessionId: 'depositSessionId',
    remainingSessionId: 'remainingSessionId',
    depositPaymentIntentId: 'depositPaymentIntentId',
    remainingPaymentIntentId: 'remainingPaymentIntentId',
    status: 'status',
    hostNote: 'hostNote',
    guestNote: 'guestNote',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    approvedAt: 'approvedAt',
    cancelledAt: 'cancelledAt',
    completedAt: 'completedAt'
  };

  export type BookingScalarFieldEnum = (typeof BookingScalarFieldEnum)[keyof typeof BookingScalarFieldEnum]


  export const ReviewScalarFieldEnum: {
    id: 'id',
    rating: 'rating',
    comment: 'comment',
    userId: 'userId',
    spaceId: 'spaceId',
    bookingId: 'bookingId',
    hostResponse: 'hostResponse',
    hostRespondedAt: 'hostRespondedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReviewScalarFieldEnum = (typeof ReviewScalarFieldEnum)[keyof typeof ReviewScalarFieldEnum]


  export const PayoutScalarFieldEnum: {
    id: 'id',
    hostId: 'hostId',
    amount: 'amount',
    platformFee: 'platformFee',
    netAmount: 'netAmount',
    status: 'status',
    bookingIds: 'bookingIds',
    stripeTransferId: 'stripeTransferId',
    processedAt: 'processedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PayoutScalarFieldEnum = (typeof PayoutScalarFieldEnum)[keyof typeof PayoutScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Role'
   */
  export type EnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role'>
    


  /**
   * Reference to a field of type 'Role[]'
   */
  export type ListEnumRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Role[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'SpaceType'
   */
  export type EnumSpaceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SpaceType'>
    


  /**
   * Reference to a field of type 'SpaceType[]'
   */
  export type ListEnumSpaceTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SpaceType[]'>
    


  /**
   * Reference to a field of type 'PricingType'
   */
  export type EnumPricingTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PricingType'>
    


  /**
   * Reference to a field of type 'PricingType[]'
   */
  export type ListEnumPricingTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PricingType[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'CancellationPolicy'
   */
  export type EnumCancellationPolicyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CancellationPolicy'>
    


  /**
   * Reference to a field of type 'CancellationPolicy[]'
   */
  export type ListEnumCancellationPolicyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CancellationPolicy[]'>
    


  /**
   * Reference to a field of type 'BookingStatus'
   */
  export type EnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus'>
    


  /**
   * Reference to a field of type 'BookingStatus[]'
   */
  export type ListEnumBookingStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BookingStatus[]'>
    


  /**
   * Reference to a field of type 'PayoutStatus'
   */
  export type EnumPayoutStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PayoutStatus'>
    


  /**
   * Reference to a field of type 'PayoutStatus[]'
   */
  export type ListEnumPayoutStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PayoutStatus[]'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    username?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    hostVerified?: BoolFilter<"User"> | boolean
    hostingSince?: DateTimeNullableFilter<"User"> | Date | string | null
    stripeAccountId?: StringNullableFilter<"User"> | string | null
    sessions?: SessionListRelationFilter
    spaces?: SpaceListRelationFilter
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
    payouts?: PayoutListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    username?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostVerified?: SortOrder
    hostingSince?: SortOrderInput | SortOrder
    stripeAccountId?: SortOrderInput | SortOrder
    sessions?: SessionOrderByRelationAggregateInput
    spaces?: SpaceOrderByRelationAggregateInput
    bookings?: BookingOrderByRelationAggregateInput
    reviews?: ReviewOrderByRelationAggregateInput
    payouts?: PayoutOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    username?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    name?: StringNullableFilter<"User"> | string | null
    password?: StringFilter<"User"> | string
    role?: EnumRoleFilter<"User"> | $Enums.Role
    emailVerified?: BoolFilter<"User"> | boolean
    image?: StringNullableFilter<"User"> | string | null
    phone?: StringNullableFilter<"User"> | string | null
    bio?: StringNullableFilter<"User"> | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    hostVerified?: BoolFilter<"User"> | boolean
    hostingSince?: DateTimeNullableFilter<"User"> | Date | string | null
    stripeAccountId?: StringNullableFilter<"User"> | string | null
    sessions?: SessionListRelationFilter
    spaces?: SpaceListRelationFilter
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
    payouts?: PayoutListRelationFilter
  }, "id" | "email" | "username">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    username?: SortOrder
    name?: SortOrderInput | SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    bio?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostVerified?: SortOrder
    hostingSince?: SortOrderInput | SortOrder
    stripeAccountId?: SortOrderInput | SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    username?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    password?: StringWithAggregatesFilter<"User"> | string
    role?: EnumRoleWithAggregatesFilter<"User"> | $Enums.Role
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    image?: StringNullableWithAggregatesFilter<"User"> | string | null
    phone?: StringNullableWithAggregatesFilter<"User"> | string | null
    bio?: StringNullableWithAggregatesFilter<"User"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    hostVerified?: BoolWithAggregatesFilter<"User"> | boolean
    hostingSince?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    stripeAccountId?: StringNullableWithAggregatesFilter<"User"> | string | null
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    token?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    userId?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "token">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    userId?: StringWithAggregatesFilter<"Session"> | string
    token?: StringWithAggregatesFilter<"Session"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type SpaceWhereInput = {
    AND?: SpaceWhereInput | SpaceWhereInput[]
    OR?: SpaceWhereInput[]
    NOT?: SpaceWhereInput | SpaceWhereInput[]
    id?: IntFilter<"Space"> | number
    name?: StringFilter<"Space"> | string
    shortDescription?: StringFilter<"Space"> | string
    description?: StringFilter<"Space"> | string
    spaceType?: EnumSpaceTypeFilter<"Space"> | $Enums.SpaceType
    pricingType?: EnumPricingTypeFilter<"Space"> | $Enums.PricingType
    pricePerHour?: IntNullableFilter<"Space"> | number | null
    pricePerDay?: IntNullableFilter<"Space"> | number | null
    depositPercent?: IntFilter<"Space"> | number
    capacity?: IntFilter<"Space"> | number
    minBookingHours?: IntNullableFilter<"Space"> | number | null
    maxBookingHours?: IntNullableFilter<"Space"> | number | null
    images?: JsonFilter<"Space">
    address?: StringFilter<"Space"> | string
    city?: StringFilter<"Space"> | string
    state?: StringNullableFilter<"Space"> | string | null
    country?: StringFilter<"Space"> | string
    postalCode?: StringNullableFilter<"Space"> | string | null
    latitude?: FloatNullableFilter<"Space"> | number | null
    longitude?: FloatNullableFilter<"Space"> | number | null
    isActive?: BoolFilter<"Space"> | boolean
    instantBook?: BoolFilter<"Space"> | boolean
    cancellationPolicy?: EnumCancellationPolicyFilter<"Space"> | $Enums.CancellationPolicy
    houseRules?: StringNullableFilter<"Space"> | string | null
    createdAt?: DateTimeFilter<"Space"> | Date | string
    updatedAt?: DateTimeFilter<"Space"> | Date | string
    hostId?: StringFilter<"Space"> | string
    categorySlug?: StringFilter<"Space"> | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
    category?: XOR<SpaceCategoryScalarRelationFilter, SpaceCategoryWhereInput>
    amenities?: SpaceAmenityListRelationFilter
    availability?: AvailabilityListRelationFilter
    blockedDates?: BlockedDateListRelationFilter
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
  }

  export type SpaceOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    shortDescription?: SortOrder
    description?: SortOrder
    spaceType?: SortOrder
    pricingType?: SortOrder
    pricePerHour?: SortOrderInput | SortOrder
    pricePerDay?: SortOrderInput | SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrderInput | SortOrder
    maxBookingHours?: SortOrderInput | SortOrder
    images?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrder
    postalCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    isActive?: SortOrder
    instantBook?: SortOrder
    cancellationPolicy?: SortOrder
    houseRules?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostId?: SortOrder
    categorySlug?: SortOrder
    host?: UserOrderByWithRelationInput
    category?: SpaceCategoryOrderByWithRelationInput
    amenities?: SpaceAmenityOrderByRelationAggregateInput
    availability?: AvailabilityOrderByRelationAggregateInput
    blockedDates?: BlockedDateOrderByRelationAggregateInput
    bookings?: BookingOrderByRelationAggregateInput
    reviews?: ReviewOrderByRelationAggregateInput
  }

  export type SpaceWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SpaceWhereInput | SpaceWhereInput[]
    OR?: SpaceWhereInput[]
    NOT?: SpaceWhereInput | SpaceWhereInput[]
    name?: StringFilter<"Space"> | string
    shortDescription?: StringFilter<"Space"> | string
    description?: StringFilter<"Space"> | string
    spaceType?: EnumSpaceTypeFilter<"Space"> | $Enums.SpaceType
    pricingType?: EnumPricingTypeFilter<"Space"> | $Enums.PricingType
    pricePerHour?: IntNullableFilter<"Space"> | number | null
    pricePerDay?: IntNullableFilter<"Space"> | number | null
    depositPercent?: IntFilter<"Space"> | number
    capacity?: IntFilter<"Space"> | number
    minBookingHours?: IntNullableFilter<"Space"> | number | null
    maxBookingHours?: IntNullableFilter<"Space"> | number | null
    images?: JsonFilter<"Space">
    address?: StringFilter<"Space"> | string
    city?: StringFilter<"Space"> | string
    state?: StringNullableFilter<"Space"> | string | null
    country?: StringFilter<"Space"> | string
    postalCode?: StringNullableFilter<"Space"> | string | null
    latitude?: FloatNullableFilter<"Space"> | number | null
    longitude?: FloatNullableFilter<"Space"> | number | null
    isActive?: BoolFilter<"Space"> | boolean
    instantBook?: BoolFilter<"Space"> | boolean
    cancellationPolicy?: EnumCancellationPolicyFilter<"Space"> | $Enums.CancellationPolicy
    houseRules?: StringNullableFilter<"Space"> | string | null
    createdAt?: DateTimeFilter<"Space"> | Date | string
    updatedAt?: DateTimeFilter<"Space"> | Date | string
    hostId?: StringFilter<"Space"> | string
    categorySlug?: StringFilter<"Space"> | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
    category?: XOR<SpaceCategoryScalarRelationFilter, SpaceCategoryWhereInput>
    amenities?: SpaceAmenityListRelationFilter
    availability?: AvailabilityListRelationFilter
    blockedDates?: BlockedDateListRelationFilter
    bookings?: BookingListRelationFilter
    reviews?: ReviewListRelationFilter
  }, "id">

  export type SpaceOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    shortDescription?: SortOrder
    description?: SortOrder
    spaceType?: SortOrder
    pricingType?: SortOrder
    pricePerHour?: SortOrderInput | SortOrder
    pricePerDay?: SortOrderInput | SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrderInput | SortOrder
    maxBookingHours?: SortOrderInput | SortOrder
    images?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrderInput | SortOrder
    country?: SortOrder
    postalCode?: SortOrderInput | SortOrder
    latitude?: SortOrderInput | SortOrder
    longitude?: SortOrderInput | SortOrder
    isActive?: SortOrder
    instantBook?: SortOrder
    cancellationPolicy?: SortOrder
    houseRules?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostId?: SortOrder
    categorySlug?: SortOrder
    _count?: SpaceCountOrderByAggregateInput
    _avg?: SpaceAvgOrderByAggregateInput
    _max?: SpaceMaxOrderByAggregateInput
    _min?: SpaceMinOrderByAggregateInput
    _sum?: SpaceSumOrderByAggregateInput
  }

  export type SpaceScalarWhereWithAggregatesInput = {
    AND?: SpaceScalarWhereWithAggregatesInput | SpaceScalarWhereWithAggregatesInput[]
    OR?: SpaceScalarWhereWithAggregatesInput[]
    NOT?: SpaceScalarWhereWithAggregatesInput | SpaceScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Space"> | number
    name?: StringWithAggregatesFilter<"Space"> | string
    shortDescription?: StringWithAggregatesFilter<"Space"> | string
    description?: StringWithAggregatesFilter<"Space"> | string
    spaceType?: EnumSpaceTypeWithAggregatesFilter<"Space"> | $Enums.SpaceType
    pricingType?: EnumPricingTypeWithAggregatesFilter<"Space"> | $Enums.PricingType
    pricePerHour?: IntNullableWithAggregatesFilter<"Space"> | number | null
    pricePerDay?: IntNullableWithAggregatesFilter<"Space"> | number | null
    depositPercent?: IntWithAggregatesFilter<"Space"> | number
    capacity?: IntWithAggregatesFilter<"Space"> | number
    minBookingHours?: IntNullableWithAggregatesFilter<"Space"> | number | null
    maxBookingHours?: IntNullableWithAggregatesFilter<"Space"> | number | null
    images?: JsonWithAggregatesFilter<"Space">
    address?: StringWithAggregatesFilter<"Space"> | string
    city?: StringWithAggregatesFilter<"Space"> | string
    state?: StringNullableWithAggregatesFilter<"Space"> | string | null
    country?: StringWithAggregatesFilter<"Space"> | string
    postalCode?: StringNullableWithAggregatesFilter<"Space"> | string | null
    latitude?: FloatNullableWithAggregatesFilter<"Space"> | number | null
    longitude?: FloatNullableWithAggregatesFilter<"Space"> | number | null
    isActive?: BoolWithAggregatesFilter<"Space"> | boolean
    instantBook?: BoolWithAggregatesFilter<"Space"> | boolean
    cancellationPolicy?: EnumCancellationPolicyWithAggregatesFilter<"Space"> | $Enums.CancellationPolicy
    houseRules?: StringNullableWithAggregatesFilter<"Space"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Space"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Space"> | Date | string
    hostId?: StringWithAggregatesFilter<"Space"> | string
    categorySlug?: StringWithAggregatesFilter<"Space"> | string
  }

  export type SpaceCategoryWhereInput = {
    AND?: SpaceCategoryWhereInput | SpaceCategoryWhereInput[]
    OR?: SpaceCategoryWhereInput[]
    NOT?: SpaceCategoryWhereInput | SpaceCategoryWhereInput[]
    id?: IntFilter<"SpaceCategory"> | number
    name?: StringFilter<"SpaceCategory"> | string
    slug?: StringFilter<"SpaceCategory"> | string
    description?: StringNullableFilter<"SpaceCategory"> | string | null
    icon?: StringNullableFilter<"SpaceCategory"> | string | null
    spaces?: SpaceListRelationFilter
  }

  export type SpaceCategoryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    spaces?: SpaceOrderByRelationAggregateInput
  }

  export type SpaceCategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    slug?: string
    AND?: SpaceCategoryWhereInput | SpaceCategoryWhereInput[]
    OR?: SpaceCategoryWhereInput[]
    NOT?: SpaceCategoryWhereInput | SpaceCategoryWhereInput[]
    name?: StringFilter<"SpaceCategory"> | string
    description?: StringNullableFilter<"SpaceCategory"> | string | null
    icon?: StringNullableFilter<"SpaceCategory"> | string | null
    spaces?: SpaceListRelationFilter
  }, "id" | "slug">

  export type SpaceCategoryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrderInput | SortOrder
    icon?: SortOrderInput | SortOrder
    _count?: SpaceCategoryCountOrderByAggregateInput
    _avg?: SpaceCategoryAvgOrderByAggregateInput
    _max?: SpaceCategoryMaxOrderByAggregateInput
    _min?: SpaceCategoryMinOrderByAggregateInput
    _sum?: SpaceCategorySumOrderByAggregateInput
  }

  export type SpaceCategoryScalarWhereWithAggregatesInput = {
    AND?: SpaceCategoryScalarWhereWithAggregatesInput | SpaceCategoryScalarWhereWithAggregatesInput[]
    OR?: SpaceCategoryScalarWhereWithAggregatesInput[]
    NOT?: SpaceCategoryScalarWhereWithAggregatesInput | SpaceCategoryScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SpaceCategory"> | number
    name?: StringWithAggregatesFilter<"SpaceCategory"> | string
    slug?: StringWithAggregatesFilter<"SpaceCategory"> | string
    description?: StringNullableWithAggregatesFilter<"SpaceCategory"> | string | null
    icon?: StringNullableWithAggregatesFilter<"SpaceCategory"> | string | null
  }

  export type AmenityWhereInput = {
    AND?: AmenityWhereInput | AmenityWhereInput[]
    OR?: AmenityWhereInput[]
    NOT?: AmenityWhereInput | AmenityWhereInput[]
    id?: IntFilter<"Amenity"> | number
    name?: StringFilter<"Amenity"> | string
    icon?: StringNullableFilter<"Amenity"> | string | null
    category?: StringNullableFilter<"Amenity"> | string | null
    spaces?: SpaceAmenityListRelationFilter
  }

  export type AmenityOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    icon?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    spaces?: SpaceAmenityOrderByRelationAggregateInput
  }

  export type AmenityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    name?: string
    AND?: AmenityWhereInput | AmenityWhereInput[]
    OR?: AmenityWhereInput[]
    NOT?: AmenityWhereInput | AmenityWhereInput[]
    icon?: StringNullableFilter<"Amenity"> | string | null
    category?: StringNullableFilter<"Amenity"> | string | null
    spaces?: SpaceAmenityListRelationFilter
  }, "id" | "name">

  export type AmenityOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    icon?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    _count?: AmenityCountOrderByAggregateInput
    _avg?: AmenityAvgOrderByAggregateInput
    _max?: AmenityMaxOrderByAggregateInput
    _min?: AmenityMinOrderByAggregateInput
    _sum?: AmenitySumOrderByAggregateInput
  }

  export type AmenityScalarWhereWithAggregatesInput = {
    AND?: AmenityScalarWhereWithAggregatesInput | AmenityScalarWhereWithAggregatesInput[]
    OR?: AmenityScalarWhereWithAggregatesInput[]
    NOT?: AmenityScalarWhereWithAggregatesInput | AmenityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Amenity"> | number
    name?: StringWithAggregatesFilter<"Amenity"> | string
    icon?: StringNullableWithAggregatesFilter<"Amenity"> | string | null
    category?: StringNullableWithAggregatesFilter<"Amenity"> | string | null
  }

  export type SpaceAmenityWhereInput = {
    AND?: SpaceAmenityWhereInput | SpaceAmenityWhereInput[]
    OR?: SpaceAmenityWhereInput[]
    NOT?: SpaceAmenityWhereInput | SpaceAmenityWhereInput[]
    id?: IntFilter<"SpaceAmenity"> | number
    spaceId?: IntFilter<"SpaceAmenity"> | number
    amenityId?: IntFilter<"SpaceAmenity"> | number
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    amenity?: XOR<AmenityScalarRelationFilter, AmenityWhereInput>
  }

  export type SpaceAmenityOrderByWithRelationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
    space?: SpaceOrderByWithRelationInput
    amenity?: AmenityOrderByWithRelationInput
  }

  export type SpaceAmenityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    spaceId_amenityId?: SpaceAmenitySpaceIdAmenityIdCompoundUniqueInput
    AND?: SpaceAmenityWhereInput | SpaceAmenityWhereInput[]
    OR?: SpaceAmenityWhereInput[]
    NOT?: SpaceAmenityWhereInput | SpaceAmenityWhereInput[]
    spaceId?: IntFilter<"SpaceAmenity"> | number
    amenityId?: IntFilter<"SpaceAmenity"> | number
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    amenity?: XOR<AmenityScalarRelationFilter, AmenityWhereInput>
  }, "id" | "spaceId_amenityId">

  export type SpaceAmenityOrderByWithAggregationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
    _count?: SpaceAmenityCountOrderByAggregateInput
    _avg?: SpaceAmenityAvgOrderByAggregateInput
    _max?: SpaceAmenityMaxOrderByAggregateInput
    _min?: SpaceAmenityMinOrderByAggregateInput
    _sum?: SpaceAmenitySumOrderByAggregateInput
  }

  export type SpaceAmenityScalarWhereWithAggregatesInput = {
    AND?: SpaceAmenityScalarWhereWithAggregatesInput | SpaceAmenityScalarWhereWithAggregatesInput[]
    OR?: SpaceAmenityScalarWhereWithAggregatesInput[]
    NOT?: SpaceAmenityScalarWhereWithAggregatesInput | SpaceAmenityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"SpaceAmenity"> | number
    spaceId?: IntWithAggregatesFilter<"SpaceAmenity"> | number
    amenityId?: IntWithAggregatesFilter<"SpaceAmenity"> | number
  }

  export type AvailabilityWhereInput = {
    AND?: AvailabilityWhereInput | AvailabilityWhereInput[]
    OR?: AvailabilityWhereInput[]
    NOT?: AvailabilityWhereInput | AvailabilityWhereInput[]
    id?: IntFilter<"Availability"> | number
    spaceId?: IntFilter<"Availability"> | number
    dayOfWeek?: IntFilter<"Availability"> | number
    startTime?: StringFilter<"Availability"> | string
    endTime?: StringFilter<"Availability"> | string
    isOpen?: BoolFilter<"Availability"> | boolean
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
  }

  export type AvailabilityOrderByWithRelationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    isOpen?: SortOrder
    space?: SpaceOrderByWithRelationInput
  }

  export type AvailabilityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    spaceId_dayOfWeek?: AvailabilitySpaceIdDayOfWeekCompoundUniqueInput
    AND?: AvailabilityWhereInput | AvailabilityWhereInput[]
    OR?: AvailabilityWhereInput[]
    NOT?: AvailabilityWhereInput | AvailabilityWhereInput[]
    spaceId?: IntFilter<"Availability"> | number
    dayOfWeek?: IntFilter<"Availability"> | number
    startTime?: StringFilter<"Availability"> | string
    endTime?: StringFilter<"Availability"> | string
    isOpen?: BoolFilter<"Availability"> | boolean
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
  }, "id" | "spaceId_dayOfWeek">

  export type AvailabilityOrderByWithAggregationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    isOpen?: SortOrder
    _count?: AvailabilityCountOrderByAggregateInput
    _avg?: AvailabilityAvgOrderByAggregateInput
    _max?: AvailabilityMaxOrderByAggregateInput
    _min?: AvailabilityMinOrderByAggregateInput
    _sum?: AvailabilitySumOrderByAggregateInput
  }

  export type AvailabilityScalarWhereWithAggregatesInput = {
    AND?: AvailabilityScalarWhereWithAggregatesInput | AvailabilityScalarWhereWithAggregatesInput[]
    OR?: AvailabilityScalarWhereWithAggregatesInput[]
    NOT?: AvailabilityScalarWhereWithAggregatesInput | AvailabilityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Availability"> | number
    spaceId?: IntWithAggregatesFilter<"Availability"> | number
    dayOfWeek?: IntWithAggregatesFilter<"Availability"> | number
    startTime?: StringWithAggregatesFilter<"Availability"> | string
    endTime?: StringWithAggregatesFilter<"Availability"> | string
    isOpen?: BoolWithAggregatesFilter<"Availability"> | boolean
  }

  export type BlockedDateWhereInput = {
    AND?: BlockedDateWhereInput | BlockedDateWhereInput[]
    OR?: BlockedDateWhereInput[]
    NOT?: BlockedDateWhereInput | BlockedDateWhereInput[]
    id?: IntFilter<"BlockedDate"> | number
    spaceId?: IntFilter<"BlockedDate"> | number
    date?: DateTimeFilter<"BlockedDate"> | Date | string
    reason?: StringNullableFilter<"BlockedDate"> | string | null
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
  }

  export type BlockedDateOrderByWithRelationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    date?: SortOrder
    reason?: SortOrderInput | SortOrder
    space?: SpaceOrderByWithRelationInput
  }

  export type BlockedDateWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: BlockedDateWhereInput | BlockedDateWhereInput[]
    OR?: BlockedDateWhereInput[]
    NOT?: BlockedDateWhereInput | BlockedDateWhereInput[]
    spaceId?: IntFilter<"BlockedDate"> | number
    date?: DateTimeFilter<"BlockedDate"> | Date | string
    reason?: StringNullableFilter<"BlockedDate"> | string | null
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
  }, "id">

  export type BlockedDateOrderByWithAggregationInput = {
    id?: SortOrder
    spaceId?: SortOrder
    date?: SortOrder
    reason?: SortOrderInput | SortOrder
    _count?: BlockedDateCountOrderByAggregateInput
    _avg?: BlockedDateAvgOrderByAggregateInput
    _max?: BlockedDateMaxOrderByAggregateInput
    _min?: BlockedDateMinOrderByAggregateInput
    _sum?: BlockedDateSumOrderByAggregateInput
  }

  export type BlockedDateScalarWhereWithAggregatesInput = {
    AND?: BlockedDateScalarWhereWithAggregatesInput | BlockedDateScalarWhereWithAggregatesInput[]
    OR?: BlockedDateScalarWhereWithAggregatesInput[]
    NOT?: BlockedDateScalarWhereWithAggregatesInput | BlockedDateScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"BlockedDate"> | number
    spaceId?: IntWithAggregatesFilter<"BlockedDate"> | number
    date?: DateTimeWithAggregatesFilter<"BlockedDate"> | Date | string
    reason?: StringNullableWithAggregatesFilter<"BlockedDate"> | string | null
  }

  export type BookingWhereInput = {
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    id?: StringFilter<"Booking"> | string
    userId?: StringFilter<"Booking"> | string
    guestEmail?: StringFilter<"Booking"> | string
    guestName?: StringFilter<"Booking"> | string
    guestPhone?: StringNullableFilter<"Booking"> | string | null
    numberOfGuests?: IntFilter<"Booking"> | number
    spaceId?: IntFilter<"Booking"> | number
    startDateTime?: DateTimeFilter<"Booking"> | Date | string
    endDateTime?: DateTimeFilter<"Booking"> | Date | string
    isHourly?: BoolFilter<"Booking"> | boolean
    subtotal?: IntFilter<"Booking"> | number
    serviceFee?: IntFilter<"Booking"> | number
    totalAmount?: IntFilter<"Booking"> | number
    depositAmount?: IntFilter<"Booking"> | number
    remainingAmount?: IntFilter<"Booking"> | number
    depositPaid?: BoolFilter<"Booking"> | boolean
    depositPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    remainingPaid?: BoolFilter<"Booking"> | boolean
    remainingPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    depositSessionId?: StringNullableFilter<"Booking"> | string | null
    remainingSessionId?: StringNullableFilter<"Booking"> | string | null
    depositPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    remainingPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    hostNote?: StringNullableFilter<"Booking"> | string | null
    guestNote?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    approvedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    review?: XOR<ReviewNullableScalarRelationFilter, ReviewWhereInput> | null
  }

  export type BookingOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    guestEmail?: SortOrder
    guestName?: SortOrder
    guestPhone?: SortOrderInput | SortOrder
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    startDateTime?: SortOrder
    endDateTime?: SortOrder
    isHourly?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
    depositPaid?: SortOrder
    depositPaidAt?: SortOrderInput | SortOrder
    remainingPaid?: SortOrder
    remainingPaidAt?: SortOrderInput | SortOrder
    depositSessionId?: SortOrderInput | SortOrder
    remainingSessionId?: SortOrderInput | SortOrder
    depositPaymentIntentId?: SortOrderInput | SortOrder
    remainingPaymentIntentId?: SortOrderInput | SortOrder
    status?: SortOrder
    hostNote?: SortOrderInput | SortOrder
    guestNote?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    approvedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    user?: UserOrderByWithRelationInput
    space?: SpaceOrderByWithRelationInput
    review?: ReviewOrderByWithRelationInput
  }

  export type BookingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BookingWhereInput | BookingWhereInput[]
    OR?: BookingWhereInput[]
    NOT?: BookingWhereInput | BookingWhereInput[]
    userId?: StringFilter<"Booking"> | string
    guestEmail?: StringFilter<"Booking"> | string
    guestName?: StringFilter<"Booking"> | string
    guestPhone?: StringNullableFilter<"Booking"> | string | null
    numberOfGuests?: IntFilter<"Booking"> | number
    spaceId?: IntFilter<"Booking"> | number
    startDateTime?: DateTimeFilter<"Booking"> | Date | string
    endDateTime?: DateTimeFilter<"Booking"> | Date | string
    isHourly?: BoolFilter<"Booking"> | boolean
    subtotal?: IntFilter<"Booking"> | number
    serviceFee?: IntFilter<"Booking"> | number
    totalAmount?: IntFilter<"Booking"> | number
    depositAmount?: IntFilter<"Booking"> | number
    remainingAmount?: IntFilter<"Booking"> | number
    depositPaid?: BoolFilter<"Booking"> | boolean
    depositPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    remainingPaid?: BoolFilter<"Booking"> | boolean
    remainingPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    depositSessionId?: StringNullableFilter<"Booking"> | string | null
    remainingSessionId?: StringNullableFilter<"Booking"> | string | null
    depositPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    remainingPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    hostNote?: StringNullableFilter<"Booking"> | string | null
    guestNote?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    approvedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    review?: XOR<ReviewNullableScalarRelationFilter, ReviewWhereInput> | null
  }, "id">

  export type BookingOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    guestEmail?: SortOrder
    guestName?: SortOrder
    guestPhone?: SortOrderInput | SortOrder
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    startDateTime?: SortOrder
    endDateTime?: SortOrder
    isHourly?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
    depositPaid?: SortOrder
    depositPaidAt?: SortOrderInput | SortOrder
    remainingPaid?: SortOrder
    remainingPaidAt?: SortOrderInput | SortOrder
    depositSessionId?: SortOrderInput | SortOrder
    remainingSessionId?: SortOrderInput | SortOrder
    depositPaymentIntentId?: SortOrderInput | SortOrder
    remainingPaymentIntentId?: SortOrderInput | SortOrder
    status?: SortOrder
    hostNote?: SortOrderInput | SortOrder
    guestNote?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    approvedAt?: SortOrderInput | SortOrder
    cancelledAt?: SortOrderInput | SortOrder
    completedAt?: SortOrderInput | SortOrder
    _count?: BookingCountOrderByAggregateInput
    _avg?: BookingAvgOrderByAggregateInput
    _max?: BookingMaxOrderByAggregateInput
    _min?: BookingMinOrderByAggregateInput
    _sum?: BookingSumOrderByAggregateInput
  }

  export type BookingScalarWhereWithAggregatesInput = {
    AND?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    OR?: BookingScalarWhereWithAggregatesInput[]
    NOT?: BookingScalarWhereWithAggregatesInput | BookingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Booking"> | string
    userId?: StringWithAggregatesFilter<"Booking"> | string
    guestEmail?: StringWithAggregatesFilter<"Booking"> | string
    guestName?: StringWithAggregatesFilter<"Booking"> | string
    guestPhone?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    numberOfGuests?: IntWithAggregatesFilter<"Booking"> | number
    spaceId?: IntWithAggregatesFilter<"Booking"> | number
    startDateTime?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    endDateTime?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    isHourly?: BoolWithAggregatesFilter<"Booking"> | boolean
    subtotal?: IntWithAggregatesFilter<"Booking"> | number
    serviceFee?: IntWithAggregatesFilter<"Booking"> | number
    totalAmount?: IntWithAggregatesFilter<"Booking"> | number
    depositAmount?: IntWithAggregatesFilter<"Booking"> | number
    remainingAmount?: IntWithAggregatesFilter<"Booking"> | number
    depositPaid?: BoolWithAggregatesFilter<"Booking"> | boolean
    depositPaidAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    remainingPaid?: BoolWithAggregatesFilter<"Booking"> | boolean
    remainingPaidAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    depositSessionId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    remainingSessionId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    depositPaymentIntentId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    remainingPaymentIntentId?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    status?: EnumBookingStatusWithAggregatesFilter<"Booking"> | $Enums.BookingStatus
    hostNote?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    guestNote?: StringNullableWithAggregatesFilter<"Booking"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Booking"> | Date | string
    approvedAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
    completedAt?: DateTimeNullableWithAggregatesFilter<"Booking"> | Date | string | null
  }

  export type ReviewWhereInput = {
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    id?: IntFilter<"Review"> | number
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    userId?: StringFilter<"Review"> | string
    spaceId?: IntFilter<"Review"> | number
    bookingId?: StringFilter<"Review"> | string
    hostResponse?: StringNullableFilter<"Review"> | string | null
    hostRespondedAt?: DateTimeNullableFilter<"Review"> | Date | string | null
    createdAt?: DateTimeFilter<"Review"> | Date | string
    updatedAt?: DateTimeFilter<"Review"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    booking?: XOR<BookingScalarRelationFilter, BookingWhereInput>
  }

  export type ReviewOrderByWithRelationInput = {
    id?: SortOrder
    rating?: SortOrder
    comment?: SortOrderInput | SortOrder
    userId?: SortOrder
    spaceId?: SortOrder
    bookingId?: SortOrder
    hostResponse?: SortOrderInput | SortOrder
    hostRespondedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
    space?: SpaceOrderByWithRelationInput
    booking?: BookingOrderByWithRelationInput
  }

  export type ReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    bookingId?: string
    AND?: ReviewWhereInput | ReviewWhereInput[]
    OR?: ReviewWhereInput[]
    NOT?: ReviewWhereInput | ReviewWhereInput[]
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    userId?: StringFilter<"Review"> | string
    spaceId?: IntFilter<"Review"> | number
    hostResponse?: StringNullableFilter<"Review"> | string | null
    hostRespondedAt?: DateTimeNullableFilter<"Review"> | Date | string | null
    createdAt?: DateTimeFilter<"Review"> | Date | string
    updatedAt?: DateTimeFilter<"Review"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
    space?: XOR<SpaceScalarRelationFilter, SpaceWhereInput>
    booking?: XOR<BookingScalarRelationFilter, BookingWhereInput>
  }, "id" | "bookingId">

  export type ReviewOrderByWithAggregationInput = {
    id?: SortOrder
    rating?: SortOrder
    comment?: SortOrderInput | SortOrder
    userId?: SortOrder
    spaceId?: SortOrder
    bookingId?: SortOrder
    hostResponse?: SortOrderInput | SortOrder
    hostRespondedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReviewCountOrderByAggregateInput
    _avg?: ReviewAvgOrderByAggregateInput
    _max?: ReviewMaxOrderByAggregateInput
    _min?: ReviewMinOrderByAggregateInput
    _sum?: ReviewSumOrderByAggregateInput
  }

  export type ReviewScalarWhereWithAggregatesInput = {
    AND?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    OR?: ReviewScalarWhereWithAggregatesInput[]
    NOT?: ReviewScalarWhereWithAggregatesInput | ReviewScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Review"> | number
    rating?: IntWithAggregatesFilter<"Review"> | number
    comment?: StringNullableWithAggregatesFilter<"Review"> | string | null
    userId?: StringWithAggregatesFilter<"Review"> | string
    spaceId?: IntWithAggregatesFilter<"Review"> | number
    bookingId?: StringWithAggregatesFilter<"Review"> | string
    hostResponse?: StringNullableWithAggregatesFilter<"Review"> | string | null
    hostRespondedAt?: DateTimeNullableWithAggregatesFilter<"Review"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Review"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Review"> | Date | string
  }

  export type PayoutWhereInput = {
    AND?: PayoutWhereInput | PayoutWhereInput[]
    OR?: PayoutWhereInput[]
    NOT?: PayoutWhereInput | PayoutWhereInput[]
    id?: StringFilter<"Payout"> | string
    hostId?: StringFilter<"Payout"> | string
    amount?: IntFilter<"Payout"> | number
    platformFee?: IntFilter<"Payout"> | number
    netAmount?: IntFilter<"Payout"> | number
    status?: EnumPayoutStatusFilter<"Payout"> | $Enums.PayoutStatus
    bookingIds?: StringNullableListFilter<"Payout">
    stripeTransferId?: StringNullableFilter<"Payout"> | string | null
    processedAt?: DateTimeNullableFilter<"Payout"> | Date | string | null
    createdAt?: DateTimeFilter<"Payout"> | Date | string
    updatedAt?: DateTimeFilter<"Payout"> | Date | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type PayoutOrderByWithRelationInput = {
    id?: SortOrder
    hostId?: SortOrder
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
    status?: SortOrder
    bookingIds?: SortOrder
    stripeTransferId?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    host?: UserOrderByWithRelationInput
  }

  export type PayoutWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: PayoutWhereInput | PayoutWhereInput[]
    OR?: PayoutWhereInput[]
    NOT?: PayoutWhereInput | PayoutWhereInput[]
    hostId?: StringFilter<"Payout"> | string
    amount?: IntFilter<"Payout"> | number
    platformFee?: IntFilter<"Payout"> | number
    netAmount?: IntFilter<"Payout"> | number
    status?: EnumPayoutStatusFilter<"Payout"> | $Enums.PayoutStatus
    bookingIds?: StringNullableListFilter<"Payout">
    stripeTransferId?: StringNullableFilter<"Payout"> | string | null
    processedAt?: DateTimeNullableFilter<"Payout"> | Date | string | null
    createdAt?: DateTimeFilter<"Payout"> | Date | string
    updatedAt?: DateTimeFilter<"Payout"> | Date | string
    host?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type PayoutOrderByWithAggregationInput = {
    id?: SortOrder
    hostId?: SortOrder
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
    status?: SortOrder
    bookingIds?: SortOrder
    stripeTransferId?: SortOrderInput | SortOrder
    processedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PayoutCountOrderByAggregateInput
    _avg?: PayoutAvgOrderByAggregateInput
    _max?: PayoutMaxOrderByAggregateInput
    _min?: PayoutMinOrderByAggregateInput
    _sum?: PayoutSumOrderByAggregateInput
  }

  export type PayoutScalarWhereWithAggregatesInput = {
    AND?: PayoutScalarWhereWithAggregatesInput | PayoutScalarWhereWithAggregatesInput[]
    OR?: PayoutScalarWhereWithAggregatesInput[]
    NOT?: PayoutScalarWhereWithAggregatesInput | PayoutScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payout"> | string
    hostId?: StringWithAggregatesFilter<"Payout"> | string
    amount?: IntWithAggregatesFilter<"Payout"> | number
    platformFee?: IntWithAggregatesFilter<"Payout"> | number
    netAmount?: IntWithAggregatesFilter<"Payout"> | number
    status?: EnumPayoutStatusWithAggregatesFilter<"Payout"> | $Enums.PayoutStatus
    bookingIds?: StringNullableListFilter<"Payout">
    stripeTransferId?: StringNullableWithAggregatesFilter<"Payout"> | string | null
    processedAt?: DateTimeNullableWithAggregatesFilter<"Payout"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payout"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payout"> | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
    spaces?: SpaceCreateNestedManyWithoutHostInput
    bookings?: BookingCreateNestedManyWithoutUserInput
    reviews?: ReviewCreateNestedManyWithoutUserInput
    payouts?: PayoutCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    spaces?: SpaceUncheckedCreateNestedManyWithoutHostInput
    bookings?: BookingUncheckedCreateNestedManyWithoutUserInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutUserInput
    payouts?: PayoutUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
    spaces?: SpaceUpdateManyWithoutHostNestedInput
    bookings?: BookingUpdateManyWithoutUserNestedInput
    reviews?: ReviewUpdateManyWithoutUserNestedInput
    payouts?: PayoutUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    spaces?: SpaceUncheckedUpdateManyWithoutHostNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutUserNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutUserNestedInput
    payouts?: PayoutUncheckedUpdateManyWithoutHostNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SessionCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    id?: string
    userId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpaceCreateInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceCreateManyInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
  }

  export type SpaceUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpaceUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
  }

  export type SpaceCategoryCreateInput = {
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    spaces?: SpaceCreateNestedManyWithoutCategoryInput
  }

  export type SpaceCategoryUncheckedCreateInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
    spaces?: SpaceUncheckedCreateNestedManyWithoutCategoryInput
  }

  export type SpaceCategoryUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceUpdateManyWithoutCategoryNestedInput
  }

  export type SpaceCategoryUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceUncheckedUpdateManyWithoutCategoryNestedInput
  }

  export type SpaceCategoryCreateManyInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
  }

  export type SpaceCategoryUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SpaceCategoryUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AmenityCreateInput = {
    name: string
    icon?: string | null
    category?: string | null
    spaces?: SpaceAmenityCreateNestedManyWithoutAmenityInput
  }

  export type AmenityUncheckedCreateInput = {
    id?: number
    name: string
    icon?: string | null
    category?: string | null
    spaces?: SpaceAmenityUncheckedCreateNestedManyWithoutAmenityInput
  }

  export type AmenityUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceAmenityUpdateManyWithoutAmenityNestedInput
  }

  export type AmenityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceAmenityUncheckedUpdateManyWithoutAmenityNestedInput
  }

  export type AmenityCreateManyInput = {
    id?: number
    name: string
    icon?: string | null
    category?: string | null
  }

  export type AmenityUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AmenityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SpaceAmenityCreateInput = {
    space: SpaceCreateNestedOneWithoutAmenitiesInput
    amenity: AmenityCreateNestedOneWithoutSpacesInput
  }

  export type SpaceAmenityUncheckedCreateInput = {
    id?: number
    spaceId: number
    amenityId: number
  }

  export type SpaceAmenityUpdateInput = {
    space?: SpaceUpdateOneRequiredWithoutAmenitiesNestedInput
    amenity?: AmenityUpdateOneRequiredWithoutSpacesNestedInput
  }

  export type SpaceAmenityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    amenityId?: IntFieldUpdateOperationsInput | number
  }

  export type SpaceAmenityCreateManyInput = {
    id?: number
    spaceId: number
    amenityId: number
  }

  export type SpaceAmenityUpdateManyMutationInput = {

  }

  export type SpaceAmenityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    amenityId?: IntFieldUpdateOperationsInput | number
  }

  export type AvailabilityCreateInput = {
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
    space: SpaceCreateNestedOneWithoutAvailabilityInput
  }

  export type AvailabilityUncheckedCreateInput = {
    id?: number
    spaceId: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
  }

  export type AvailabilityUpdateInput = {
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
    space?: SpaceUpdateOneRequiredWithoutAvailabilityNestedInput
  }

  export type AvailabilityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AvailabilityCreateManyInput = {
    id?: number
    spaceId: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
  }

  export type AvailabilityUpdateManyMutationInput = {
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AvailabilityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type BlockedDateCreateInput = {
    date: Date | string
    reason?: string | null
    space: SpaceCreateNestedOneWithoutBlockedDatesInput
  }

  export type BlockedDateUncheckedCreateInput = {
    id?: number
    spaceId: number
    date: Date | string
    reason?: string | null
  }

  export type BlockedDateUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
    space?: SpaceUpdateOneRequiredWithoutBlockedDatesNestedInput
  }

  export type BlockedDateUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BlockedDateCreateManyInput = {
    id?: number
    spaceId: number
    date: Date | string
    reason?: string | null
  }

  export type BlockedDateUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BlockedDateUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BookingCreateInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    user: UserCreateNestedOneWithoutBookingsInput
    space: SpaceCreateNestedOneWithoutBookingsInput
    review?: ReviewCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateInput = {
    id?: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    spaceId: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    review?: ReviewUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutBookingsNestedInput
    space?: SpaceUpdateOneRequiredWithoutBookingsNestedInput
    review?: ReviewUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    review?: ReviewUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingCreateManyInput = {
    id?: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    spaceId: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type BookingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type BookingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReviewCreateInput = {
    rating: number
    comment?: string | null
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutReviewsInput
    space: SpaceCreateNestedOneWithoutReviewsInput
    booking: BookingCreateNestedOneWithoutReviewInput
  }

  export type ReviewUncheckedCreateInput = {
    id?: number
    rating: number
    comment?: string | null
    userId: string
    spaceId: number
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewUpdateInput = {
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutReviewsNestedInput
    space?: SpaceUpdateOneRequiredWithoutReviewsNestedInput
    booking?: BookingUpdateOneRequiredWithoutReviewNestedInput
  }

  export type ReviewUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    spaceId?: IntFieldUpdateOperationsInput | number
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewCreateManyInput = {
    id?: number
    rating: number
    comment?: string | null
    userId: string
    spaceId: number
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewUpdateManyMutationInput = {
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    spaceId?: IntFieldUpdateOperationsInput | number
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutCreateInput = {
    id?: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutPayoutsInput
  }

  export type PayoutUncheckedCreateInput = {
    id?: string
    hostId: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutPayoutsNestedInput
  }

  export type PayoutUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutCreateManyInput = {
    id?: string
    hostId: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    hostId?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

  export type SpaceListRelationFilter = {
    every?: SpaceWhereInput
    some?: SpaceWhereInput
    none?: SpaceWhereInput
  }

  export type BookingListRelationFilter = {
    every?: BookingWhereInput
    some?: BookingWhereInput
    none?: BookingWhereInput
  }

  export type ReviewListRelationFilter = {
    every?: ReviewWhereInput
    some?: ReviewWhereInput
    none?: ReviewWhereInput
  }

  export type PayoutListRelationFilter = {
    every?: PayoutWhereInput
    some?: PayoutWhereInput
    none?: PayoutWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SpaceOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BookingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ReviewOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PayoutOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    username?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    phone?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostVerified?: SortOrder
    hostingSince?: SortOrder
    stripeAccountId?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    username?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    phone?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostVerified?: SortOrder
    hostingSince?: SortOrder
    stripeAccountId?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    username?: SortOrder
    name?: SortOrder
    password?: SortOrder
    role?: SortOrder
    emailVerified?: SortOrder
    image?: SortOrder
    phone?: SortOrder
    bio?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostVerified?: SortOrder
    hostingSince?: SortOrder
    stripeAccountId?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type EnumSpaceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SpaceType | EnumSpaceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSpaceTypeFilter<$PrismaModel> | $Enums.SpaceType
  }

  export type EnumPricingTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingType | EnumPricingTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPricingTypeFilter<$PrismaModel> | $Enums.PricingType
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type EnumCancellationPolicyFilter<$PrismaModel = never> = {
    equals?: $Enums.CancellationPolicy | EnumCancellationPolicyFieldRefInput<$PrismaModel>
    in?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    not?: NestedEnumCancellationPolicyFilter<$PrismaModel> | $Enums.CancellationPolicy
  }

  export type SpaceCategoryScalarRelationFilter = {
    is?: SpaceCategoryWhereInput
    isNot?: SpaceCategoryWhereInput
  }

  export type SpaceAmenityListRelationFilter = {
    every?: SpaceAmenityWhereInput
    some?: SpaceAmenityWhereInput
    none?: SpaceAmenityWhereInput
  }

  export type AvailabilityListRelationFilter = {
    every?: AvailabilityWhereInput
    some?: AvailabilityWhereInput
    none?: AvailabilityWhereInput
  }

  export type BlockedDateListRelationFilter = {
    every?: BlockedDateWhereInput
    some?: BlockedDateWhereInput
    none?: BlockedDateWhereInput
  }

  export type SpaceAmenityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AvailabilityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BlockedDateOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SpaceCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    shortDescription?: SortOrder
    description?: SortOrder
    spaceType?: SortOrder
    pricingType?: SortOrder
    pricePerHour?: SortOrder
    pricePerDay?: SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrder
    maxBookingHours?: SortOrder
    images?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    isActive?: SortOrder
    instantBook?: SortOrder
    cancellationPolicy?: SortOrder
    houseRules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostId?: SortOrder
    categorySlug?: SortOrder
  }

  export type SpaceAvgOrderByAggregateInput = {
    id?: SortOrder
    pricePerHour?: SortOrder
    pricePerDay?: SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrder
    maxBookingHours?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type SpaceMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    shortDescription?: SortOrder
    description?: SortOrder
    spaceType?: SortOrder
    pricingType?: SortOrder
    pricePerHour?: SortOrder
    pricePerDay?: SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrder
    maxBookingHours?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    isActive?: SortOrder
    instantBook?: SortOrder
    cancellationPolicy?: SortOrder
    houseRules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostId?: SortOrder
    categorySlug?: SortOrder
  }

  export type SpaceMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    shortDescription?: SortOrder
    description?: SortOrder
    spaceType?: SortOrder
    pricingType?: SortOrder
    pricePerHour?: SortOrder
    pricePerDay?: SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrder
    maxBookingHours?: SortOrder
    address?: SortOrder
    city?: SortOrder
    state?: SortOrder
    country?: SortOrder
    postalCode?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
    isActive?: SortOrder
    instantBook?: SortOrder
    cancellationPolicy?: SortOrder
    houseRules?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    hostId?: SortOrder
    categorySlug?: SortOrder
  }

  export type SpaceSumOrderByAggregateInput = {
    id?: SortOrder
    pricePerHour?: SortOrder
    pricePerDay?: SortOrder
    depositPercent?: SortOrder
    capacity?: SortOrder
    minBookingHours?: SortOrder
    maxBookingHours?: SortOrder
    latitude?: SortOrder
    longitude?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EnumSpaceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SpaceType | EnumSpaceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSpaceTypeWithAggregatesFilter<$PrismaModel> | $Enums.SpaceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSpaceTypeFilter<$PrismaModel>
    _max?: NestedEnumSpaceTypeFilter<$PrismaModel>
  }

  export type EnumPricingTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingType | EnumPricingTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPricingTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingTypeFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type EnumCancellationPolicyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CancellationPolicy | EnumCancellationPolicyFieldRefInput<$PrismaModel>
    in?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    not?: NestedEnumCancellationPolicyWithAggregatesFilter<$PrismaModel> | $Enums.CancellationPolicy
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCancellationPolicyFilter<$PrismaModel>
    _max?: NestedEnumCancellationPolicyFilter<$PrismaModel>
  }

  export type SpaceCategoryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
  }

  export type SpaceCategoryAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SpaceCategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
  }

  export type SpaceCategoryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    slug?: SortOrder
    description?: SortOrder
    icon?: SortOrder
  }

  export type SpaceCategorySumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AmenityCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    category?: SortOrder
  }

  export type AmenityAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AmenityMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    category?: SortOrder
  }

  export type AmenityMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    icon?: SortOrder
    category?: SortOrder
  }

  export type AmenitySumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SpaceScalarRelationFilter = {
    is?: SpaceWhereInput
    isNot?: SpaceWhereInput
  }

  export type AmenityScalarRelationFilter = {
    is?: AmenityWhereInput
    isNot?: AmenityWhereInput
  }

  export type SpaceAmenitySpaceIdAmenityIdCompoundUniqueInput = {
    spaceId: number
    amenityId: number
  }

  export type SpaceAmenityCountOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
  }

  export type SpaceAmenityAvgOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
  }

  export type SpaceAmenityMaxOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
  }

  export type SpaceAmenityMinOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
  }

  export type SpaceAmenitySumOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    amenityId?: SortOrder
  }

  export type AvailabilitySpaceIdDayOfWeekCompoundUniqueInput = {
    spaceId: number
    dayOfWeek: number
  }

  export type AvailabilityCountOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    isOpen?: SortOrder
  }

  export type AvailabilityAvgOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
  }

  export type AvailabilityMaxOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    isOpen?: SortOrder
  }

  export type AvailabilityMinOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
    startTime?: SortOrder
    endTime?: SortOrder
    isOpen?: SortOrder
  }

  export type AvailabilitySumOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    dayOfWeek?: SortOrder
  }

  export type BlockedDateCountOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    date?: SortOrder
    reason?: SortOrder
  }

  export type BlockedDateAvgOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
  }

  export type BlockedDateMaxOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    date?: SortOrder
    reason?: SortOrder
  }

  export type BlockedDateMinOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
    date?: SortOrder
    reason?: SortOrder
  }

  export type BlockedDateSumOrderByAggregateInput = {
    id?: SortOrder
    spaceId?: SortOrder
  }

  export type EnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type ReviewNullableScalarRelationFilter = {
    is?: ReviewWhereInput | null
    isNot?: ReviewWhereInput | null
  }

  export type BookingCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    guestEmail?: SortOrder
    guestName?: SortOrder
    guestPhone?: SortOrder
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    startDateTime?: SortOrder
    endDateTime?: SortOrder
    isHourly?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
    depositPaid?: SortOrder
    depositPaidAt?: SortOrder
    remainingPaid?: SortOrder
    remainingPaidAt?: SortOrder
    depositSessionId?: SortOrder
    remainingSessionId?: SortOrder
    depositPaymentIntentId?: SortOrder
    remainingPaymentIntentId?: SortOrder
    status?: SortOrder
    hostNote?: SortOrder
    guestNote?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    approvedAt?: SortOrder
    cancelledAt?: SortOrder
    completedAt?: SortOrder
  }

  export type BookingAvgOrderByAggregateInput = {
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
  }

  export type BookingMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    guestEmail?: SortOrder
    guestName?: SortOrder
    guestPhone?: SortOrder
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    startDateTime?: SortOrder
    endDateTime?: SortOrder
    isHourly?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
    depositPaid?: SortOrder
    depositPaidAt?: SortOrder
    remainingPaid?: SortOrder
    remainingPaidAt?: SortOrder
    depositSessionId?: SortOrder
    remainingSessionId?: SortOrder
    depositPaymentIntentId?: SortOrder
    remainingPaymentIntentId?: SortOrder
    status?: SortOrder
    hostNote?: SortOrder
    guestNote?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    approvedAt?: SortOrder
    cancelledAt?: SortOrder
    completedAt?: SortOrder
  }

  export type BookingMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    guestEmail?: SortOrder
    guestName?: SortOrder
    guestPhone?: SortOrder
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    startDateTime?: SortOrder
    endDateTime?: SortOrder
    isHourly?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
    depositPaid?: SortOrder
    depositPaidAt?: SortOrder
    remainingPaid?: SortOrder
    remainingPaidAt?: SortOrder
    depositSessionId?: SortOrder
    remainingSessionId?: SortOrder
    depositPaymentIntentId?: SortOrder
    remainingPaymentIntentId?: SortOrder
    status?: SortOrder
    hostNote?: SortOrder
    guestNote?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    approvedAt?: SortOrder
    cancelledAt?: SortOrder
    completedAt?: SortOrder
  }

  export type BookingSumOrderByAggregateInput = {
    numberOfGuests?: SortOrder
    spaceId?: SortOrder
    subtotal?: SortOrder
    serviceFee?: SortOrder
    totalAmount?: SortOrder
    depositAmount?: SortOrder
    remainingAmount?: SortOrder
  }

  export type EnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type BookingScalarRelationFilter = {
    is?: BookingWhereInput
    isNot?: BookingWhereInput
  }

  export type ReviewCountOrderByAggregateInput = {
    id?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    userId?: SortOrder
    spaceId?: SortOrder
    bookingId?: SortOrder
    hostResponse?: SortOrder
    hostRespondedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewAvgOrderByAggregateInput = {
    id?: SortOrder
    rating?: SortOrder
    spaceId?: SortOrder
  }

  export type ReviewMaxOrderByAggregateInput = {
    id?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    userId?: SortOrder
    spaceId?: SortOrder
    bookingId?: SortOrder
    hostResponse?: SortOrder
    hostRespondedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewMinOrderByAggregateInput = {
    id?: SortOrder
    rating?: SortOrder
    comment?: SortOrder
    userId?: SortOrder
    spaceId?: SortOrder
    bookingId?: SortOrder
    hostResponse?: SortOrder
    hostRespondedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReviewSumOrderByAggregateInput = {
    id?: SortOrder
    rating?: SortOrder
    spaceId?: SortOrder
  }

  export type EnumPayoutStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusFilter<$PrismaModel> | $Enums.PayoutStatus
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type PayoutCountOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
    status?: SortOrder
    bookingIds?: SortOrder
    stripeTransferId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutAvgOrderByAggregateInput = {
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
  }

  export type PayoutMaxOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
    status?: SortOrder
    stripeTransferId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutMinOrderByAggregateInput = {
    id?: SortOrder
    hostId?: SortOrder
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
    status?: SortOrder
    stripeTransferId?: SortOrder
    processedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PayoutSumOrderByAggregateInput = {
    amount?: SortOrder
    platformFee?: SortOrder
    netAmount?: SortOrder
  }

  export type EnumPayoutStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel> | $Enums.PayoutStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPayoutStatusFilter<$PrismaModel>
    _max?: NestedEnumPayoutStatusFilter<$PrismaModel>
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SpaceCreateNestedManyWithoutHostInput = {
    create?: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput> | SpaceCreateWithoutHostInput[] | SpaceUncheckedCreateWithoutHostInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutHostInput | SpaceCreateOrConnectWithoutHostInput[]
    createMany?: SpaceCreateManyHostInputEnvelope
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutUserInput = {
    create?: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput> | BookingCreateWithoutUserInput[] | BookingUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutUserInput | BookingCreateOrConnectWithoutUserInput[]
    createMany?: BookingCreateManyUserInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewCreateNestedManyWithoutUserInput = {
    create?: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput> | ReviewCreateWithoutUserInput[] | ReviewUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutUserInput | ReviewCreateOrConnectWithoutUserInput[]
    createMany?: ReviewCreateManyUserInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type PayoutCreateNestedManyWithoutHostInput = {
    create?: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput> | PayoutCreateWithoutHostInput[] | PayoutUncheckedCreateWithoutHostInput[]
    connectOrCreate?: PayoutCreateOrConnectWithoutHostInput | PayoutCreateOrConnectWithoutHostInput[]
    createMany?: PayoutCreateManyHostInputEnvelope
    connect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SpaceUncheckedCreateNestedManyWithoutHostInput = {
    create?: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput> | SpaceCreateWithoutHostInput[] | SpaceUncheckedCreateWithoutHostInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutHostInput | SpaceCreateOrConnectWithoutHostInput[]
    createMany?: SpaceCreateManyHostInputEnvelope
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput> | BookingCreateWithoutUserInput[] | BookingUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutUserInput | BookingCreateOrConnectWithoutUserInput[]
    createMany?: BookingCreateManyUserInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput> | ReviewCreateWithoutUserInput[] | ReviewUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutUserInput | ReviewCreateOrConnectWithoutUserInput[]
    createMany?: ReviewCreateManyUserInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type PayoutUncheckedCreateNestedManyWithoutHostInput = {
    create?: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput> | PayoutCreateWithoutHostInput[] | PayoutUncheckedCreateWithoutHostInput[]
    connectOrCreate?: PayoutCreateOrConnectWithoutHostInput | PayoutCreateOrConnectWithoutHostInput[]
    createMany?: PayoutCreateManyHostInputEnvelope
    connect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumRoleFieldUpdateOperationsInput = {
    set?: $Enums.Role
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SpaceUpdateManyWithoutHostNestedInput = {
    create?: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput> | SpaceCreateWithoutHostInput[] | SpaceUncheckedCreateWithoutHostInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutHostInput | SpaceCreateOrConnectWithoutHostInput[]
    upsert?: SpaceUpsertWithWhereUniqueWithoutHostInput | SpaceUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: SpaceCreateManyHostInputEnvelope
    set?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    disconnect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    delete?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    update?: SpaceUpdateWithWhereUniqueWithoutHostInput | SpaceUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: SpaceUpdateManyWithWhereWithoutHostInput | SpaceUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
  }

  export type BookingUpdateManyWithoutUserNestedInput = {
    create?: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput> | BookingCreateWithoutUserInput[] | BookingUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutUserInput | BookingCreateOrConnectWithoutUserInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutUserInput | BookingUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BookingCreateManyUserInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutUserInput | BookingUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutUserInput | BookingUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUpdateManyWithoutUserNestedInput = {
    create?: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput> | ReviewCreateWithoutUserInput[] | ReviewUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutUserInput | ReviewCreateOrConnectWithoutUserInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutUserInput | ReviewUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ReviewCreateManyUserInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutUserInput | ReviewUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutUserInput | ReviewUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type PayoutUpdateManyWithoutHostNestedInput = {
    create?: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput> | PayoutCreateWithoutHostInput[] | PayoutUncheckedCreateWithoutHostInput[]
    connectOrCreate?: PayoutCreateOrConnectWithoutHostInput | PayoutCreateOrConnectWithoutHostInput[]
    upsert?: PayoutUpsertWithWhereUniqueWithoutHostInput | PayoutUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: PayoutCreateManyHostInputEnvelope
    set?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    disconnect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    delete?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    connect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    update?: PayoutUpdateWithWhereUniqueWithoutHostInput | PayoutUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: PayoutUpdateManyWithWhereWithoutHostInput | PayoutUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: PayoutScalarWhereInput | PayoutScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SpaceUncheckedUpdateManyWithoutHostNestedInput = {
    create?: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput> | SpaceCreateWithoutHostInput[] | SpaceUncheckedCreateWithoutHostInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutHostInput | SpaceCreateOrConnectWithoutHostInput[]
    upsert?: SpaceUpsertWithWhereUniqueWithoutHostInput | SpaceUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: SpaceCreateManyHostInputEnvelope
    set?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    disconnect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    delete?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    update?: SpaceUpdateWithWhereUniqueWithoutHostInput | SpaceUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: SpaceUpdateManyWithWhereWithoutHostInput | SpaceUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput> | BookingCreateWithoutUserInput[] | BookingUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutUserInput | BookingCreateOrConnectWithoutUserInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutUserInput | BookingUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BookingCreateManyUserInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutUserInput | BookingUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutUserInput | BookingUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput> | ReviewCreateWithoutUserInput[] | ReviewUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutUserInput | ReviewCreateOrConnectWithoutUserInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutUserInput | ReviewUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ReviewCreateManyUserInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutUserInput | ReviewUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutUserInput | ReviewUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type PayoutUncheckedUpdateManyWithoutHostNestedInput = {
    create?: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput> | PayoutCreateWithoutHostInput[] | PayoutUncheckedCreateWithoutHostInput[]
    connectOrCreate?: PayoutCreateOrConnectWithoutHostInput | PayoutCreateOrConnectWithoutHostInput[]
    upsert?: PayoutUpsertWithWhereUniqueWithoutHostInput | PayoutUpsertWithWhereUniqueWithoutHostInput[]
    createMany?: PayoutCreateManyHostInputEnvelope
    set?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    disconnect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    delete?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    connect?: PayoutWhereUniqueInput | PayoutWhereUniqueInput[]
    update?: PayoutUpdateWithWhereUniqueWithoutHostInput | PayoutUpdateWithWhereUniqueWithoutHostInput[]
    updateMany?: PayoutUpdateManyWithWhereWithoutHostInput | PayoutUpdateManyWithWhereWithoutHostInput[]
    deleteMany?: PayoutScalarWhereInput | PayoutScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserCreateNestedOneWithoutSpacesInput = {
    create?: XOR<UserCreateWithoutSpacesInput, UserUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpacesInput
    connect?: UserWhereUniqueInput
  }

  export type SpaceCategoryCreateNestedOneWithoutSpacesInput = {
    create?: XOR<SpaceCategoryCreateWithoutSpacesInput, SpaceCategoryUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: SpaceCategoryCreateOrConnectWithoutSpacesInput
    connect?: SpaceCategoryWhereUniqueInput
  }

  export type SpaceAmenityCreateNestedManyWithoutSpaceInput = {
    create?: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput> | SpaceAmenityCreateWithoutSpaceInput[] | SpaceAmenityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutSpaceInput | SpaceAmenityCreateOrConnectWithoutSpaceInput[]
    createMany?: SpaceAmenityCreateManySpaceInputEnvelope
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
  }

  export type AvailabilityCreateNestedManyWithoutSpaceInput = {
    create?: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput> | AvailabilityCreateWithoutSpaceInput[] | AvailabilityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: AvailabilityCreateOrConnectWithoutSpaceInput | AvailabilityCreateOrConnectWithoutSpaceInput[]
    createMany?: AvailabilityCreateManySpaceInputEnvelope
    connect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
  }

  export type BlockedDateCreateNestedManyWithoutSpaceInput = {
    create?: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput> | BlockedDateCreateWithoutSpaceInput[] | BlockedDateUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BlockedDateCreateOrConnectWithoutSpaceInput | BlockedDateCreateOrConnectWithoutSpaceInput[]
    createMany?: BlockedDateCreateManySpaceInputEnvelope
    connect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
  }

  export type BookingCreateNestedManyWithoutSpaceInput = {
    create?: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput> | BookingCreateWithoutSpaceInput[] | BookingUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutSpaceInput | BookingCreateOrConnectWithoutSpaceInput[]
    createMany?: BookingCreateManySpaceInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewCreateNestedManyWithoutSpaceInput = {
    create?: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput> | ReviewCreateWithoutSpaceInput[] | ReviewUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutSpaceInput | ReviewCreateOrConnectWithoutSpaceInput[]
    createMany?: ReviewCreateManySpaceInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput = {
    create?: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput> | SpaceAmenityCreateWithoutSpaceInput[] | SpaceAmenityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutSpaceInput | SpaceAmenityCreateOrConnectWithoutSpaceInput[]
    createMany?: SpaceAmenityCreateManySpaceInputEnvelope
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
  }

  export type AvailabilityUncheckedCreateNestedManyWithoutSpaceInput = {
    create?: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput> | AvailabilityCreateWithoutSpaceInput[] | AvailabilityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: AvailabilityCreateOrConnectWithoutSpaceInput | AvailabilityCreateOrConnectWithoutSpaceInput[]
    createMany?: AvailabilityCreateManySpaceInputEnvelope
    connect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
  }

  export type BlockedDateUncheckedCreateNestedManyWithoutSpaceInput = {
    create?: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput> | BlockedDateCreateWithoutSpaceInput[] | BlockedDateUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BlockedDateCreateOrConnectWithoutSpaceInput | BlockedDateCreateOrConnectWithoutSpaceInput[]
    createMany?: BlockedDateCreateManySpaceInputEnvelope
    connect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
  }

  export type BookingUncheckedCreateNestedManyWithoutSpaceInput = {
    create?: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput> | BookingCreateWithoutSpaceInput[] | BookingUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutSpaceInput | BookingCreateOrConnectWithoutSpaceInput[]
    createMany?: BookingCreateManySpaceInputEnvelope
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
  }

  export type ReviewUncheckedCreateNestedManyWithoutSpaceInput = {
    create?: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput> | ReviewCreateWithoutSpaceInput[] | ReviewUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutSpaceInput | ReviewCreateOrConnectWithoutSpaceInput[]
    createMany?: ReviewCreateManySpaceInputEnvelope
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
  }

  export type EnumSpaceTypeFieldUpdateOperationsInput = {
    set?: $Enums.SpaceType
  }

  export type EnumPricingTypeFieldUpdateOperationsInput = {
    set?: $Enums.PricingType
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableFloatFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type EnumCancellationPolicyFieldUpdateOperationsInput = {
    set?: $Enums.CancellationPolicy
  }

  export type UserUpdateOneRequiredWithoutSpacesNestedInput = {
    create?: XOR<UserCreateWithoutSpacesInput, UserUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: UserCreateOrConnectWithoutSpacesInput
    upsert?: UserUpsertWithoutSpacesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSpacesInput, UserUpdateWithoutSpacesInput>, UserUncheckedUpdateWithoutSpacesInput>
  }

  export type SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput = {
    create?: XOR<SpaceCategoryCreateWithoutSpacesInput, SpaceCategoryUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: SpaceCategoryCreateOrConnectWithoutSpacesInput
    upsert?: SpaceCategoryUpsertWithoutSpacesInput
    connect?: SpaceCategoryWhereUniqueInput
    update?: XOR<XOR<SpaceCategoryUpdateToOneWithWhereWithoutSpacesInput, SpaceCategoryUpdateWithoutSpacesInput>, SpaceCategoryUncheckedUpdateWithoutSpacesInput>
  }

  export type SpaceAmenityUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput> | SpaceAmenityCreateWithoutSpaceInput[] | SpaceAmenityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutSpaceInput | SpaceAmenityCreateOrConnectWithoutSpaceInput[]
    upsert?: SpaceAmenityUpsertWithWhereUniqueWithoutSpaceInput | SpaceAmenityUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: SpaceAmenityCreateManySpaceInputEnvelope
    set?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    disconnect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    delete?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    update?: SpaceAmenityUpdateWithWhereUniqueWithoutSpaceInput | SpaceAmenityUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: SpaceAmenityUpdateManyWithWhereWithoutSpaceInput | SpaceAmenityUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
  }

  export type AvailabilityUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput> | AvailabilityCreateWithoutSpaceInput[] | AvailabilityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: AvailabilityCreateOrConnectWithoutSpaceInput | AvailabilityCreateOrConnectWithoutSpaceInput[]
    upsert?: AvailabilityUpsertWithWhereUniqueWithoutSpaceInput | AvailabilityUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: AvailabilityCreateManySpaceInputEnvelope
    set?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    disconnect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    delete?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    connect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    update?: AvailabilityUpdateWithWhereUniqueWithoutSpaceInput | AvailabilityUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: AvailabilityUpdateManyWithWhereWithoutSpaceInput | AvailabilityUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: AvailabilityScalarWhereInput | AvailabilityScalarWhereInput[]
  }

  export type BlockedDateUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput> | BlockedDateCreateWithoutSpaceInput[] | BlockedDateUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BlockedDateCreateOrConnectWithoutSpaceInput | BlockedDateCreateOrConnectWithoutSpaceInput[]
    upsert?: BlockedDateUpsertWithWhereUniqueWithoutSpaceInput | BlockedDateUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: BlockedDateCreateManySpaceInputEnvelope
    set?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    disconnect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    delete?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    connect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    update?: BlockedDateUpdateWithWhereUniqueWithoutSpaceInput | BlockedDateUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: BlockedDateUpdateManyWithWhereWithoutSpaceInput | BlockedDateUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: BlockedDateScalarWhereInput | BlockedDateScalarWhereInput[]
  }

  export type BookingUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput> | BookingCreateWithoutSpaceInput[] | BookingUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutSpaceInput | BookingCreateOrConnectWithoutSpaceInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutSpaceInput | BookingUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: BookingCreateManySpaceInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutSpaceInput | BookingUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutSpaceInput | BookingUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput> | ReviewCreateWithoutSpaceInput[] | ReviewUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutSpaceInput | ReviewCreateOrConnectWithoutSpaceInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutSpaceInput | ReviewUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: ReviewCreateManySpaceInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutSpaceInput | ReviewUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutSpaceInput | ReviewUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput> | SpaceAmenityCreateWithoutSpaceInput[] | SpaceAmenityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutSpaceInput | SpaceAmenityCreateOrConnectWithoutSpaceInput[]
    upsert?: SpaceAmenityUpsertWithWhereUniqueWithoutSpaceInput | SpaceAmenityUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: SpaceAmenityCreateManySpaceInputEnvelope
    set?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    disconnect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    delete?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    update?: SpaceAmenityUpdateWithWhereUniqueWithoutSpaceInput | SpaceAmenityUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: SpaceAmenityUpdateManyWithWhereWithoutSpaceInput | SpaceAmenityUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
  }

  export type AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput> | AvailabilityCreateWithoutSpaceInput[] | AvailabilityUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: AvailabilityCreateOrConnectWithoutSpaceInput | AvailabilityCreateOrConnectWithoutSpaceInput[]
    upsert?: AvailabilityUpsertWithWhereUniqueWithoutSpaceInput | AvailabilityUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: AvailabilityCreateManySpaceInputEnvelope
    set?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    disconnect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    delete?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    connect?: AvailabilityWhereUniqueInput | AvailabilityWhereUniqueInput[]
    update?: AvailabilityUpdateWithWhereUniqueWithoutSpaceInput | AvailabilityUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: AvailabilityUpdateManyWithWhereWithoutSpaceInput | AvailabilityUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: AvailabilityScalarWhereInput | AvailabilityScalarWhereInput[]
  }

  export type BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput> | BlockedDateCreateWithoutSpaceInput[] | BlockedDateUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BlockedDateCreateOrConnectWithoutSpaceInput | BlockedDateCreateOrConnectWithoutSpaceInput[]
    upsert?: BlockedDateUpsertWithWhereUniqueWithoutSpaceInput | BlockedDateUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: BlockedDateCreateManySpaceInputEnvelope
    set?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    disconnect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    delete?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    connect?: BlockedDateWhereUniqueInput | BlockedDateWhereUniqueInput[]
    update?: BlockedDateUpdateWithWhereUniqueWithoutSpaceInput | BlockedDateUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: BlockedDateUpdateManyWithWhereWithoutSpaceInput | BlockedDateUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: BlockedDateScalarWhereInput | BlockedDateScalarWhereInput[]
  }

  export type BookingUncheckedUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput> | BookingCreateWithoutSpaceInput[] | BookingUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: BookingCreateOrConnectWithoutSpaceInput | BookingCreateOrConnectWithoutSpaceInput[]
    upsert?: BookingUpsertWithWhereUniqueWithoutSpaceInput | BookingUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: BookingCreateManySpaceInputEnvelope
    set?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    disconnect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    delete?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    connect?: BookingWhereUniqueInput | BookingWhereUniqueInput[]
    update?: BookingUpdateWithWhereUniqueWithoutSpaceInput | BookingUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: BookingUpdateManyWithWhereWithoutSpaceInput | BookingUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: BookingScalarWhereInput | BookingScalarWhereInput[]
  }

  export type ReviewUncheckedUpdateManyWithoutSpaceNestedInput = {
    create?: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput> | ReviewCreateWithoutSpaceInput[] | ReviewUncheckedCreateWithoutSpaceInput[]
    connectOrCreate?: ReviewCreateOrConnectWithoutSpaceInput | ReviewCreateOrConnectWithoutSpaceInput[]
    upsert?: ReviewUpsertWithWhereUniqueWithoutSpaceInput | ReviewUpsertWithWhereUniqueWithoutSpaceInput[]
    createMany?: ReviewCreateManySpaceInputEnvelope
    set?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    disconnect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    delete?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    connect?: ReviewWhereUniqueInput | ReviewWhereUniqueInput[]
    update?: ReviewUpdateWithWhereUniqueWithoutSpaceInput | ReviewUpdateWithWhereUniqueWithoutSpaceInput[]
    updateMany?: ReviewUpdateManyWithWhereWithoutSpaceInput | ReviewUpdateManyWithWhereWithoutSpaceInput[]
    deleteMany?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
  }

  export type SpaceCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput> | SpaceCreateWithoutCategoryInput[] | SpaceUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutCategoryInput | SpaceCreateOrConnectWithoutCategoryInput[]
    createMany?: SpaceCreateManyCategoryInputEnvelope
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
  }

  export type SpaceUncheckedCreateNestedManyWithoutCategoryInput = {
    create?: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput> | SpaceCreateWithoutCategoryInput[] | SpaceUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutCategoryInput | SpaceCreateOrConnectWithoutCategoryInput[]
    createMany?: SpaceCreateManyCategoryInputEnvelope
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
  }

  export type SpaceUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput> | SpaceCreateWithoutCategoryInput[] | SpaceUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutCategoryInput | SpaceCreateOrConnectWithoutCategoryInput[]
    upsert?: SpaceUpsertWithWhereUniqueWithoutCategoryInput | SpaceUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SpaceCreateManyCategoryInputEnvelope
    set?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    disconnect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    delete?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    update?: SpaceUpdateWithWhereUniqueWithoutCategoryInput | SpaceUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SpaceUpdateManyWithWhereWithoutCategoryInput | SpaceUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
  }

  export type SpaceUncheckedUpdateManyWithoutCategoryNestedInput = {
    create?: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput> | SpaceCreateWithoutCategoryInput[] | SpaceUncheckedCreateWithoutCategoryInput[]
    connectOrCreate?: SpaceCreateOrConnectWithoutCategoryInput | SpaceCreateOrConnectWithoutCategoryInput[]
    upsert?: SpaceUpsertWithWhereUniqueWithoutCategoryInput | SpaceUpsertWithWhereUniqueWithoutCategoryInput[]
    createMany?: SpaceCreateManyCategoryInputEnvelope
    set?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    disconnect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    delete?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    connect?: SpaceWhereUniqueInput | SpaceWhereUniqueInput[]
    update?: SpaceUpdateWithWhereUniqueWithoutCategoryInput | SpaceUpdateWithWhereUniqueWithoutCategoryInput[]
    updateMany?: SpaceUpdateManyWithWhereWithoutCategoryInput | SpaceUpdateManyWithWhereWithoutCategoryInput[]
    deleteMany?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
  }

  export type SpaceAmenityCreateNestedManyWithoutAmenityInput = {
    create?: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput> | SpaceAmenityCreateWithoutAmenityInput[] | SpaceAmenityUncheckedCreateWithoutAmenityInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutAmenityInput | SpaceAmenityCreateOrConnectWithoutAmenityInput[]
    createMany?: SpaceAmenityCreateManyAmenityInputEnvelope
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
  }

  export type SpaceAmenityUncheckedCreateNestedManyWithoutAmenityInput = {
    create?: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput> | SpaceAmenityCreateWithoutAmenityInput[] | SpaceAmenityUncheckedCreateWithoutAmenityInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutAmenityInput | SpaceAmenityCreateOrConnectWithoutAmenityInput[]
    createMany?: SpaceAmenityCreateManyAmenityInputEnvelope
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
  }

  export type SpaceAmenityUpdateManyWithoutAmenityNestedInput = {
    create?: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput> | SpaceAmenityCreateWithoutAmenityInput[] | SpaceAmenityUncheckedCreateWithoutAmenityInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutAmenityInput | SpaceAmenityCreateOrConnectWithoutAmenityInput[]
    upsert?: SpaceAmenityUpsertWithWhereUniqueWithoutAmenityInput | SpaceAmenityUpsertWithWhereUniqueWithoutAmenityInput[]
    createMany?: SpaceAmenityCreateManyAmenityInputEnvelope
    set?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    disconnect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    delete?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    update?: SpaceAmenityUpdateWithWhereUniqueWithoutAmenityInput | SpaceAmenityUpdateWithWhereUniqueWithoutAmenityInput[]
    updateMany?: SpaceAmenityUpdateManyWithWhereWithoutAmenityInput | SpaceAmenityUpdateManyWithWhereWithoutAmenityInput[]
    deleteMany?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
  }

  export type SpaceAmenityUncheckedUpdateManyWithoutAmenityNestedInput = {
    create?: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput> | SpaceAmenityCreateWithoutAmenityInput[] | SpaceAmenityUncheckedCreateWithoutAmenityInput[]
    connectOrCreate?: SpaceAmenityCreateOrConnectWithoutAmenityInput | SpaceAmenityCreateOrConnectWithoutAmenityInput[]
    upsert?: SpaceAmenityUpsertWithWhereUniqueWithoutAmenityInput | SpaceAmenityUpsertWithWhereUniqueWithoutAmenityInput[]
    createMany?: SpaceAmenityCreateManyAmenityInputEnvelope
    set?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    disconnect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    delete?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    connect?: SpaceAmenityWhereUniqueInput | SpaceAmenityWhereUniqueInput[]
    update?: SpaceAmenityUpdateWithWhereUniqueWithoutAmenityInput | SpaceAmenityUpdateWithWhereUniqueWithoutAmenityInput[]
    updateMany?: SpaceAmenityUpdateManyWithWhereWithoutAmenityInput | SpaceAmenityUpdateManyWithWhereWithoutAmenityInput[]
    deleteMany?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
  }

  export type SpaceCreateNestedOneWithoutAmenitiesInput = {
    create?: XOR<SpaceCreateWithoutAmenitiesInput, SpaceUncheckedCreateWithoutAmenitiesInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutAmenitiesInput
    connect?: SpaceWhereUniqueInput
  }

  export type AmenityCreateNestedOneWithoutSpacesInput = {
    create?: XOR<AmenityCreateWithoutSpacesInput, AmenityUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: AmenityCreateOrConnectWithoutSpacesInput
    connect?: AmenityWhereUniqueInput
  }

  export type SpaceUpdateOneRequiredWithoutAmenitiesNestedInput = {
    create?: XOR<SpaceCreateWithoutAmenitiesInput, SpaceUncheckedCreateWithoutAmenitiesInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutAmenitiesInput
    upsert?: SpaceUpsertWithoutAmenitiesInput
    connect?: SpaceWhereUniqueInput
    update?: XOR<XOR<SpaceUpdateToOneWithWhereWithoutAmenitiesInput, SpaceUpdateWithoutAmenitiesInput>, SpaceUncheckedUpdateWithoutAmenitiesInput>
  }

  export type AmenityUpdateOneRequiredWithoutSpacesNestedInput = {
    create?: XOR<AmenityCreateWithoutSpacesInput, AmenityUncheckedCreateWithoutSpacesInput>
    connectOrCreate?: AmenityCreateOrConnectWithoutSpacesInput
    upsert?: AmenityUpsertWithoutSpacesInput
    connect?: AmenityWhereUniqueInput
    update?: XOR<XOR<AmenityUpdateToOneWithWhereWithoutSpacesInput, AmenityUpdateWithoutSpacesInput>, AmenityUncheckedUpdateWithoutSpacesInput>
  }

  export type SpaceCreateNestedOneWithoutAvailabilityInput = {
    create?: XOR<SpaceCreateWithoutAvailabilityInput, SpaceUncheckedCreateWithoutAvailabilityInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutAvailabilityInput
    connect?: SpaceWhereUniqueInput
  }

  export type SpaceUpdateOneRequiredWithoutAvailabilityNestedInput = {
    create?: XOR<SpaceCreateWithoutAvailabilityInput, SpaceUncheckedCreateWithoutAvailabilityInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutAvailabilityInput
    upsert?: SpaceUpsertWithoutAvailabilityInput
    connect?: SpaceWhereUniqueInput
    update?: XOR<XOR<SpaceUpdateToOneWithWhereWithoutAvailabilityInput, SpaceUpdateWithoutAvailabilityInput>, SpaceUncheckedUpdateWithoutAvailabilityInput>
  }

  export type SpaceCreateNestedOneWithoutBlockedDatesInput = {
    create?: XOR<SpaceCreateWithoutBlockedDatesInput, SpaceUncheckedCreateWithoutBlockedDatesInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutBlockedDatesInput
    connect?: SpaceWhereUniqueInput
  }

  export type SpaceUpdateOneRequiredWithoutBlockedDatesNestedInput = {
    create?: XOR<SpaceCreateWithoutBlockedDatesInput, SpaceUncheckedCreateWithoutBlockedDatesInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutBlockedDatesInput
    upsert?: SpaceUpsertWithoutBlockedDatesInput
    connect?: SpaceWhereUniqueInput
    update?: XOR<XOR<SpaceUpdateToOneWithWhereWithoutBlockedDatesInput, SpaceUpdateWithoutBlockedDatesInput>, SpaceUncheckedUpdateWithoutBlockedDatesInput>
  }

  export type UserCreateNestedOneWithoutBookingsInput = {
    create?: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsInput
    connect?: UserWhereUniqueInput
  }

  export type SpaceCreateNestedOneWithoutBookingsInput = {
    create?: XOR<SpaceCreateWithoutBookingsInput, SpaceUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutBookingsInput
    connect?: SpaceWhereUniqueInput
  }

  export type ReviewCreateNestedOneWithoutBookingInput = {
    create?: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
    connectOrCreate?: ReviewCreateOrConnectWithoutBookingInput
    connect?: ReviewWhereUniqueInput
  }

  export type ReviewUncheckedCreateNestedOneWithoutBookingInput = {
    create?: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
    connectOrCreate?: ReviewCreateOrConnectWithoutBookingInput
    connect?: ReviewWhereUniqueInput
  }

  export type EnumBookingStatusFieldUpdateOperationsInput = {
    set?: $Enums.BookingStatus
  }

  export type UserUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: UserCreateOrConnectWithoutBookingsInput
    upsert?: UserUpsertWithoutBookingsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBookingsInput, UserUpdateWithoutBookingsInput>, UserUncheckedUpdateWithoutBookingsInput>
  }

  export type SpaceUpdateOneRequiredWithoutBookingsNestedInput = {
    create?: XOR<SpaceCreateWithoutBookingsInput, SpaceUncheckedCreateWithoutBookingsInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutBookingsInput
    upsert?: SpaceUpsertWithoutBookingsInput
    connect?: SpaceWhereUniqueInput
    update?: XOR<XOR<SpaceUpdateToOneWithWhereWithoutBookingsInput, SpaceUpdateWithoutBookingsInput>, SpaceUncheckedUpdateWithoutBookingsInput>
  }

  export type ReviewUpdateOneWithoutBookingNestedInput = {
    create?: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
    connectOrCreate?: ReviewCreateOrConnectWithoutBookingInput
    upsert?: ReviewUpsertWithoutBookingInput
    disconnect?: ReviewWhereInput | boolean
    delete?: ReviewWhereInput | boolean
    connect?: ReviewWhereUniqueInput
    update?: XOR<XOR<ReviewUpdateToOneWithWhereWithoutBookingInput, ReviewUpdateWithoutBookingInput>, ReviewUncheckedUpdateWithoutBookingInput>
  }

  export type ReviewUncheckedUpdateOneWithoutBookingNestedInput = {
    create?: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
    connectOrCreate?: ReviewCreateOrConnectWithoutBookingInput
    upsert?: ReviewUpsertWithoutBookingInput
    disconnect?: ReviewWhereInput | boolean
    delete?: ReviewWhereInput | boolean
    connect?: ReviewWhereUniqueInput
    update?: XOR<XOR<ReviewUpdateToOneWithWhereWithoutBookingInput, ReviewUpdateWithoutBookingInput>, ReviewUncheckedUpdateWithoutBookingInput>
  }

  export type UserCreateNestedOneWithoutReviewsInput = {
    create?: XOR<UserCreateWithoutReviewsInput, UserUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsInput
    connect?: UserWhereUniqueInput
  }

  export type SpaceCreateNestedOneWithoutReviewsInput = {
    create?: XOR<SpaceCreateWithoutReviewsInput, SpaceUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutReviewsInput
    connect?: SpaceWhereUniqueInput
  }

  export type BookingCreateNestedOneWithoutReviewInput = {
    create?: XOR<BookingCreateWithoutReviewInput, BookingUncheckedCreateWithoutReviewInput>
    connectOrCreate?: BookingCreateOrConnectWithoutReviewInput
    connect?: BookingWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: XOR<UserCreateWithoutReviewsInput, UserUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: UserCreateOrConnectWithoutReviewsInput
    upsert?: UserUpsertWithoutReviewsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutReviewsInput, UserUpdateWithoutReviewsInput>, UserUncheckedUpdateWithoutReviewsInput>
  }

  export type SpaceUpdateOneRequiredWithoutReviewsNestedInput = {
    create?: XOR<SpaceCreateWithoutReviewsInput, SpaceUncheckedCreateWithoutReviewsInput>
    connectOrCreate?: SpaceCreateOrConnectWithoutReviewsInput
    upsert?: SpaceUpsertWithoutReviewsInput
    connect?: SpaceWhereUniqueInput
    update?: XOR<XOR<SpaceUpdateToOneWithWhereWithoutReviewsInput, SpaceUpdateWithoutReviewsInput>, SpaceUncheckedUpdateWithoutReviewsInput>
  }

  export type BookingUpdateOneRequiredWithoutReviewNestedInput = {
    create?: XOR<BookingCreateWithoutReviewInput, BookingUncheckedCreateWithoutReviewInput>
    connectOrCreate?: BookingCreateOrConnectWithoutReviewInput
    upsert?: BookingUpsertWithoutReviewInput
    connect?: BookingWhereUniqueInput
    update?: XOR<XOR<BookingUpdateToOneWithWhereWithoutReviewInput, BookingUpdateWithoutReviewInput>, BookingUncheckedUpdateWithoutReviewInput>
  }

  export type PayoutCreatebookingIdsInput = {
    set: string[]
  }

  export type UserCreateNestedOneWithoutPayoutsInput = {
    create?: XOR<UserCreateWithoutPayoutsInput, UserUncheckedCreateWithoutPayoutsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPayoutsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumPayoutStatusFieldUpdateOperationsInput = {
    set?: $Enums.PayoutStatus
  }

  export type PayoutUpdatebookingIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type UserUpdateOneRequiredWithoutPayoutsNestedInput = {
    create?: XOR<UserCreateWithoutPayoutsInput, UserUncheckedCreateWithoutPayoutsInput>
    connectOrCreate?: UserCreateOrConnectWithoutPayoutsInput
    upsert?: UserUpsertWithoutPayoutsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutPayoutsInput, UserUpdateWithoutPayoutsInput>, UserUncheckedUpdateWithoutPayoutsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleFilter<$PrismaModel> | $Enums.Role
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Role | EnumRoleFieldRefInput<$PrismaModel>
    in?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.Role[] | ListEnumRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumRoleWithAggregatesFilter<$PrismaModel> | $Enums.Role
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRoleFilter<$PrismaModel>
    _max?: NestedEnumRoleFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumSpaceTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.SpaceType | EnumSpaceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSpaceTypeFilter<$PrismaModel> | $Enums.SpaceType
  }

  export type NestedEnumPricingTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingType | EnumPricingTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPricingTypeFilter<$PrismaModel> | $Enums.PricingType
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumCancellationPolicyFilter<$PrismaModel = never> = {
    equals?: $Enums.CancellationPolicy | EnumCancellationPolicyFieldRefInput<$PrismaModel>
    in?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    not?: NestedEnumCancellationPolicyFilter<$PrismaModel> | $Enums.CancellationPolicy
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedEnumSpaceTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SpaceType | EnumSpaceTypeFieldRefInput<$PrismaModel>
    in?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.SpaceType[] | ListEnumSpaceTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumSpaceTypeWithAggregatesFilter<$PrismaModel> | $Enums.SpaceType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSpaceTypeFilter<$PrismaModel>
    _max?: NestedEnumSpaceTypeFilter<$PrismaModel>
  }

  export type NestedEnumPricingTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PricingType | EnumPricingTypeFieldRefInput<$PrismaModel>
    in?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.PricingType[] | ListEnumPricingTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumPricingTypeWithAggregatesFilter<$PrismaModel> | $Enums.PricingType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPricingTypeFilter<$PrismaModel>
    _max?: NestedEnumPricingTypeFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedFloatNullableFilter<$PrismaModel>
    _min?: NestedFloatNullableFilter<$PrismaModel>
    _max?: NestedFloatNullableFilter<$PrismaModel>
  }

  export type NestedEnumCancellationPolicyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CancellationPolicy | EnumCancellationPolicyFieldRefInput<$PrismaModel>
    in?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    notIn?: $Enums.CancellationPolicy[] | ListEnumCancellationPolicyFieldRefInput<$PrismaModel>
    not?: NestedEnumCancellationPolicyWithAggregatesFilter<$PrismaModel> | $Enums.CancellationPolicy
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCancellationPolicyFilter<$PrismaModel>
    _max?: NestedEnumCancellationPolicyFilter<$PrismaModel>
  }

  export type NestedEnumBookingStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusFilter<$PrismaModel> | $Enums.BookingStatus
  }

  export type NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BookingStatus | EnumBookingStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BookingStatus[] | ListEnumBookingStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBookingStatusWithAggregatesFilter<$PrismaModel> | $Enums.BookingStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBookingStatusFilter<$PrismaModel>
    _max?: NestedEnumBookingStatusFilter<$PrismaModel>
  }

  export type NestedEnumPayoutStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusFilter<$PrismaModel> | $Enums.PayoutStatus
  }

  export type NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PayoutStatus | EnumPayoutStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PayoutStatus[] | ListEnumPayoutStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPayoutStatusWithAggregatesFilter<$PrismaModel> | $Enums.PayoutStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPayoutStatusFilter<$PrismaModel>
    _max?: NestedEnumPayoutStatusFilter<$PrismaModel>
  }

  export type SessionCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SpaceCreateWithoutHostInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutHostInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutHostInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput>
  }

  export type SpaceCreateManyHostInputEnvelope = {
    data: SpaceCreateManyHostInput | SpaceCreateManyHostInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutUserInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    space: SpaceCreateNestedOneWithoutBookingsInput
    review?: ReviewCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutUserInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    spaceId: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    review?: ReviewUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutUserInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput>
  }

  export type BookingCreateManyUserInputEnvelope = {
    data: BookingCreateManyUserInput | BookingCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ReviewCreateWithoutUserInput = {
    rating: number
    comment?: string | null
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    space: SpaceCreateNestedOneWithoutReviewsInput
    booking: BookingCreateNestedOneWithoutReviewInput
  }

  export type ReviewUncheckedCreateWithoutUserInput = {
    id?: number
    rating: number
    comment?: string | null
    spaceId: number
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutUserInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput>
  }

  export type ReviewCreateManyUserInputEnvelope = {
    data: ReviewCreateManyUserInput | ReviewCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type PayoutCreateWithoutHostInput = {
    id?: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutUncheckedCreateWithoutHostInput = {
    id?: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutCreateOrConnectWithoutHostInput = {
    where: PayoutWhereUniqueInput
    create: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput>
  }

  export type PayoutCreateManyHostInputEnvelope = {
    data: PayoutCreateManyHostInput | PayoutCreateManyHostInput[]
    skipDuplicates?: boolean
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    token?: StringFilter<"Session"> | string
    expiresAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
  }

  export type SpaceUpsertWithWhereUniqueWithoutHostInput = {
    where: SpaceWhereUniqueInput
    update: XOR<SpaceUpdateWithoutHostInput, SpaceUncheckedUpdateWithoutHostInput>
    create: XOR<SpaceCreateWithoutHostInput, SpaceUncheckedCreateWithoutHostInput>
  }

  export type SpaceUpdateWithWhereUniqueWithoutHostInput = {
    where: SpaceWhereUniqueInput
    data: XOR<SpaceUpdateWithoutHostInput, SpaceUncheckedUpdateWithoutHostInput>
  }

  export type SpaceUpdateManyWithWhereWithoutHostInput = {
    where: SpaceScalarWhereInput
    data: XOR<SpaceUpdateManyMutationInput, SpaceUncheckedUpdateManyWithoutHostInput>
  }

  export type SpaceScalarWhereInput = {
    AND?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
    OR?: SpaceScalarWhereInput[]
    NOT?: SpaceScalarWhereInput | SpaceScalarWhereInput[]
    id?: IntFilter<"Space"> | number
    name?: StringFilter<"Space"> | string
    shortDescription?: StringFilter<"Space"> | string
    description?: StringFilter<"Space"> | string
    spaceType?: EnumSpaceTypeFilter<"Space"> | $Enums.SpaceType
    pricingType?: EnumPricingTypeFilter<"Space"> | $Enums.PricingType
    pricePerHour?: IntNullableFilter<"Space"> | number | null
    pricePerDay?: IntNullableFilter<"Space"> | number | null
    depositPercent?: IntFilter<"Space"> | number
    capacity?: IntFilter<"Space"> | number
    minBookingHours?: IntNullableFilter<"Space"> | number | null
    maxBookingHours?: IntNullableFilter<"Space"> | number | null
    images?: JsonFilter<"Space">
    address?: StringFilter<"Space"> | string
    city?: StringFilter<"Space"> | string
    state?: StringNullableFilter<"Space"> | string | null
    country?: StringFilter<"Space"> | string
    postalCode?: StringNullableFilter<"Space"> | string | null
    latitude?: FloatNullableFilter<"Space"> | number | null
    longitude?: FloatNullableFilter<"Space"> | number | null
    isActive?: BoolFilter<"Space"> | boolean
    instantBook?: BoolFilter<"Space"> | boolean
    cancellationPolicy?: EnumCancellationPolicyFilter<"Space"> | $Enums.CancellationPolicy
    houseRules?: StringNullableFilter<"Space"> | string | null
    createdAt?: DateTimeFilter<"Space"> | Date | string
    updatedAt?: DateTimeFilter<"Space"> | Date | string
    hostId?: StringFilter<"Space"> | string
    categorySlug?: StringFilter<"Space"> | string
  }

  export type BookingUpsertWithWhereUniqueWithoutUserInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutUserInput, BookingUncheckedUpdateWithoutUserInput>
    create: XOR<BookingCreateWithoutUserInput, BookingUncheckedCreateWithoutUserInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutUserInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutUserInput, BookingUncheckedUpdateWithoutUserInput>
  }

  export type BookingUpdateManyWithWhereWithoutUserInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutUserInput>
  }

  export type BookingScalarWhereInput = {
    AND?: BookingScalarWhereInput | BookingScalarWhereInput[]
    OR?: BookingScalarWhereInput[]
    NOT?: BookingScalarWhereInput | BookingScalarWhereInput[]
    id?: StringFilter<"Booking"> | string
    userId?: StringFilter<"Booking"> | string
    guestEmail?: StringFilter<"Booking"> | string
    guestName?: StringFilter<"Booking"> | string
    guestPhone?: StringNullableFilter<"Booking"> | string | null
    numberOfGuests?: IntFilter<"Booking"> | number
    spaceId?: IntFilter<"Booking"> | number
    startDateTime?: DateTimeFilter<"Booking"> | Date | string
    endDateTime?: DateTimeFilter<"Booking"> | Date | string
    isHourly?: BoolFilter<"Booking"> | boolean
    subtotal?: IntFilter<"Booking"> | number
    serviceFee?: IntFilter<"Booking"> | number
    totalAmount?: IntFilter<"Booking"> | number
    depositAmount?: IntFilter<"Booking"> | number
    remainingAmount?: IntFilter<"Booking"> | number
    depositPaid?: BoolFilter<"Booking"> | boolean
    depositPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    remainingPaid?: BoolFilter<"Booking"> | boolean
    remainingPaidAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    depositSessionId?: StringNullableFilter<"Booking"> | string | null
    remainingSessionId?: StringNullableFilter<"Booking"> | string | null
    depositPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    remainingPaymentIntentId?: StringNullableFilter<"Booking"> | string | null
    status?: EnumBookingStatusFilter<"Booking"> | $Enums.BookingStatus
    hostNote?: StringNullableFilter<"Booking"> | string | null
    guestNote?: StringNullableFilter<"Booking"> | string | null
    createdAt?: DateTimeFilter<"Booking"> | Date | string
    updatedAt?: DateTimeFilter<"Booking"> | Date | string
    approvedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    cancelledAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
    completedAt?: DateTimeNullableFilter<"Booking"> | Date | string | null
  }

  export type ReviewUpsertWithWhereUniqueWithoutUserInput = {
    where: ReviewWhereUniqueInput
    update: XOR<ReviewUpdateWithoutUserInput, ReviewUncheckedUpdateWithoutUserInput>
    create: XOR<ReviewCreateWithoutUserInput, ReviewUncheckedCreateWithoutUserInput>
  }

  export type ReviewUpdateWithWhereUniqueWithoutUserInput = {
    where: ReviewWhereUniqueInput
    data: XOR<ReviewUpdateWithoutUserInput, ReviewUncheckedUpdateWithoutUserInput>
  }

  export type ReviewUpdateManyWithWhereWithoutUserInput = {
    where: ReviewScalarWhereInput
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyWithoutUserInput>
  }

  export type ReviewScalarWhereInput = {
    AND?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
    OR?: ReviewScalarWhereInput[]
    NOT?: ReviewScalarWhereInput | ReviewScalarWhereInput[]
    id?: IntFilter<"Review"> | number
    rating?: IntFilter<"Review"> | number
    comment?: StringNullableFilter<"Review"> | string | null
    userId?: StringFilter<"Review"> | string
    spaceId?: IntFilter<"Review"> | number
    bookingId?: StringFilter<"Review"> | string
    hostResponse?: StringNullableFilter<"Review"> | string | null
    hostRespondedAt?: DateTimeNullableFilter<"Review"> | Date | string | null
    createdAt?: DateTimeFilter<"Review"> | Date | string
    updatedAt?: DateTimeFilter<"Review"> | Date | string
  }

  export type PayoutUpsertWithWhereUniqueWithoutHostInput = {
    where: PayoutWhereUniqueInput
    update: XOR<PayoutUpdateWithoutHostInput, PayoutUncheckedUpdateWithoutHostInput>
    create: XOR<PayoutCreateWithoutHostInput, PayoutUncheckedCreateWithoutHostInput>
  }

  export type PayoutUpdateWithWhereUniqueWithoutHostInput = {
    where: PayoutWhereUniqueInput
    data: XOR<PayoutUpdateWithoutHostInput, PayoutUncheckedUpdateWithoutHostInput>
  }

  export type PayoutUpdateManyWithWhereWithoutHostInput = {
    where: PayoutScalarWhereInput
    data: XOR<PayoutUpdateManyMutationInput, PayoutUncheckedUpdateManyWithoutHostInput>
  }

  export type PayoutScalarWhereInput = {
    AND?: PayoutScalarWhereInput | PayoutScalarWhereInput[]
    OR?: PayoutScalarWhereInput[]
    NOT?: PayoutScalarWhereInput | PayoutScalarWhereInput[]
    id?: StringFilter<"Payout"> | string
    hostId?: StringFilter<"Payout"> | string
    amount?: IntFilter<"Payout"> | number
    platformFee?: IntFilter<"Payout"> | number
    netAmount?: IntFilter<"Payout"> | number
    status?: EnumPayoutStatusFilter<"Payout"> | $Enums.PayoutStatus
    bookingIds?: StringNullableListFilter<"Payout">
    stripeTransferId?: StringNullableFilter<"Payout"> | string | null
    processedAt?: DateTimeNullableFilter<"Payout"> | Date | string | null
    createdAt?: DateTimeFilter<"Payout"> | Date | string
    updatedAt?: DateTimeFilter<"Payout"> | Date | string
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    spaces?: SpaceCreateNestedManyWithoutHostInput
    bookings?: BookingCreateNestedManyWithoutUserInput
    reviews?: ReviewCreateNestedManyWithoutUserInput
    payouts?: PayoutCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    spaces?: SpaceUncheckedCreateNestedManyWithoutHostInput
    bookings?: BookingUncheckedCreateNestedManyWithoutUserInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutUserInput
    payouts?: PayoutUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceUpdateManyWithoutHostNestedInput
    bookings?: BookingUpdateManyWithoutUserNestedInput
    reviews?: ReviewUpdateManyWithoutUserNestedInput
    payouts?: PayoutUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    spaces?: SpaceUncheckedUpdateManyWithoutHostNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutUserNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutUserNestedInput
    payouts?: PayoutUncheckedUpdateManyWithoutHostNestedInput
  }

  export type UserCreateWithoutSpacesInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
    bookings?: BookingCreateNestedManyWithoutUserInput
    reviews?: ReviewCreateNestedManyWithoutUserInput
    payouts?: PayoutCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateWithoutSpacesInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    bookings?: BookingUncheckedCreateNestedManyWithoutUserInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutUserInput
    payouts?: PayoutUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserCreateOrConnectWithoutSpacesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSpacesInput, UserUncheckedCreateWithoutSpacesInput>
  }

  export type SpaceCategoryCreateWithoutSpacesInput = {
    name: string
    slug: string
    description?: string | null
    icon?: string | null
  }

  export type SpaceCategoryUncheckedCreateWithoutSpacesInput = {
    id?: number
    name: string
    slug: string
    description?: string | null
    icon?: string | null
  }

  export type SpaceCategoryCreateOrConnectWithoutSpacesInput = {
    where: SpaceCategoryWhereUniqueInput
    create: XOR<SpaceCategoryCreateWithoutSpacesInput, SpaceCategoryUncheckedCreateWithoutSpacesInput>
  }

  export type SpaceAmenityCreateWithoutSpaceInput = {
    amenity: AmenityCreateNestedOneWithoutSpacesInput
  }

  export type SpaceAmenityUncheckedCreateWithoutSpaceInput = {
    id?: number
    amenityId: number
  }

  export type SpaceAmenityCreateOrConnectWithoutSpaceInput = {
    where: SpaceAmenityWhereUniqueInput
    create: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput>
  }

  export type SpaceAmenityCreateManySpaceInputEnvelope = {
    data: SpaceAmenityCreateManySpaceInput | SpaceAmenityCreateManySpaceInput[]
    skipDuplicates?: boolean
  }

  export type AvailabilityCreateWithoutSpaceInput = {
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
  }

  export type AvailabilityUncheckedCreateWithoutSpaceInput = {
    id?: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
  }

  export type AvailabilityCreateOrConnectWithoutSpaceInput = {
    where: AvailabilityWhereUniqueInput
    create: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput>
  }

  export type AvailabilityCreateManySpaceInputEnvelope = {
    data: AvailabilityCreateManySpaceInput | AvailabilityCreateManySpaceInput[]
    skipDuplicates?: boolean
  }

  export type BlockedDateCreateWithoutSpaceInput = {
    date: Date | string
    reason?: string | null
  }

  export type BlockedDateUncheckedCreateWithoutSpaceInput = {
    id?: number
    date: Date | string
    reason?: string | null
  }

  export type BlockedDateCreateOrConnectWithoutSpaceInput = {
    where: BlockedDateWhereUniqueInput
    create: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput>
  }

  export type BlockedDateCreateManySpaceInputEnvelope = {
    data: BlockedDateCreateManySpaceInput | BlockedDateCreateManySpaceInput[]
    skipDuplicates?: boolean
  }

  export type BookingCreateWithoutSpaceInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    user: UserCreateNestedOneWithoutBookingsInput
    review?: ReviewCreateNestedOneWithoutBookingInput
  }

  export type BookingUncheckedCreateWithoutSpaceInput = {
    id?: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    review?: ReviewUncheckedCreateNestedOneWithoutBookingInput
  }

  export type BookingCreateOrConnectWithoutSpaceInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput>
  }

  export type BookingCreateManySpaceInputEnvelope = {
    data: BookingCreateManySpaceInput | BookingCreateManySpaceInput[]
    skipDuplicates?: boolean
  }

  export type ReviewCreateWithoutSpaceInput = {
    rating: number
    comment?: string | null
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutReviewsInput
    booking: BookingCreateNestedOneWithoutReviewInput
  }

  export type ReviewUncheckedCreateWithoutSpaceInput = {
    id?: number
    rating: number
    comment?: string | null
    userId: string
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutSpaceInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput>
  }

  export type ReviewCreateManySpaceInputEnvelope = {
    data: ReviewCreateManySpaceInput | ReviewCreateManySpaceInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutSpacesInput = {
    update: XOR<UserUpdateWithoutSpacesInput, UserUncheckedUpdateWithoutSpacesInput>
    create: XOR<UserCreateWithoutSpacesInput, UserUncheckedCreateWithoutSpacesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSpacesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSpacesInput, UserUncheckedUpdateWithoutSpacesInput>
  }

  export type UserUpdateWithoutSpacesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
    bookings?: BookingUpdateManyWithoutUserNestedInput
    reviews?: ReviewUpdateManyWithoutUserNestedInput
    payouts?: PayoutUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateWithoutSpacesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutUserNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutUserNestedInput
    payouts?: PayoutUncheckedUpdateManyWithoutHostNestedInput
  }

  export type SpaceCategoryUpsertWithoutSpacesInput = {
    update: XOR<SpaceCategoryUpdateWithoutSpacesInput, SpaceCategoryUncheckedUpdateWithoutSpacesInput>
    create: XOR<SpaceCategoryCreateWithoutSpacesInput, SpaceCategoryUncheckedCreateWithoutSpacesInput>
    where?: SpaceCategoryWhereInput
  }

  export type SpaceCategoryUpdateToOneWithWhereWithoutSpacesInput = {
    where?: SpaceCategoryWhereInput
    data: XOR<SpaceCategoryUpdateWithoutSpacesInput, SpaceCategoryUncheckedUpdateWithoutSpacesInput>
  }

  export type SpaceCategoryUpdateWithoutSpacesInput = {
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SpaceCategoryUncheckedUpdateWithoutSpacesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    icon?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SpaceAmenityUpsertWithWhereUniqueWithoutSpaceInput = {
    where: SpaceAmenityWhereUniqueInput
    update: XOR<SpaceAmenityUpdateWithoutSpaceInput, SpaceAmenityUncheckedUpdateWithoutSpaceInput>
    create: XOR<SpaceAmenityCreateWithoutSpaceInput, SpaceAmenityUncheckedCreateWithoutSpaceInput>
  }

  export type SpaceAmenityUpdateWithWhereUniqueWithoutSpaceInput = {
    where: SpaceAmenityWhereUniqueInput
    data: XOR<SpaceAmenityUpdateWithoutSpaceInput, SpaceAmenityUncheckedUpdateWithoutSpaceInput>
  }

  export type SpaceAmenityUpdateManyWithWhereWithoutSpaceInput = {
    where: SpaceAmenityScalarWhereInput
    data: XOR<SpaceAmenityUpdateManyMutationInput, SpaceAmenityUncheckedUpdateManyWithoutSpaceInput>
  }

  export type SpaceAmenityScalarWhereInput = {
    AND?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
    OR?: SpaceAmenityScalarWhereInput[]
    NOT?: SpaceAmenityScalarWhereInput | SpaceAmenityScalarWhereInput[]
    id?: IntFilter<"SpaceAmenity"> | number
    spaceId?: IntFilter<"SpaceAmenity"> | number
    amenityId?: IntFilter<"SpaceAmenity"> | number
  }

  export type AvailabilityUpsertWithWhereUniqueWithoutSpaceInput = {
    where: AvailabilityWhereUniqueInput
    update: XOR<AvailabilityUpdateWithoutSpaceInput, AvailabilityUncheckedUpdateWithoutSpaceInput>
    create: XOR<AvailabilityCreateWithoutSpaceInput, AvailabilityUncheckedCreateWithoutSpaceInput>
  }

  export type AvailabilityUpdateWithWhereUniqueWithoutSpaceInput = {
    where: AvailabilityWhereUniqueInput
    data: XOR<AvailabilityUpdateWithoutSpaceInput, AvailabilityUncheckedUpdateWithoutSpaceInput>
  }

  export type AvailabilityUpdateManyWithWhereWithoutSpaceInput = {
    where: AvailabilityScalarWhereInput
    data: XOR<AvailabilityUpdateManyMutationInput, AvailabilityUncheckedUpdateManyWithoutSpaceInput>
  }

  export type AvailabilityScalarWhereInput = {
    AND?: AvailabilityScalarWhereInput | AvailabilityScalarWhereInput[]
    OR?: AvailabilityScalarWhereInput[]
    NOT?: AvailabilityScalarWhereInput | AvailabilityScalarWhereInput[]
    id?: IntFilter<"Availability"> | number
    spaceId?: IntFilter<"Availability"> | number
    dayOfWeek?: IntFilter<"Availability"> | number
    startTime?: StringFilter<"Availability"> | string
    endTime?: StringFilter<"Availability"> | string
    isOpen?: BoolFilter<"Availability"> | boolean
  }

  export type BlockedDateUpsertWithWhereUniqueWithoutSpaceInput = {
    where: BlockedDateWhereUniqueInput
    update: XOR<BlockedDateUpdateWithoutSpaceInput, BlockedDateUncheckedUpdateWithoutSpaceInput>
    create: XOR<BlockedDateCreateWithoutSpaceInput, BlockedDateUncheckedCreateWithoutSpaceInput>
  }

  export type BlockedDateUpdateWithWhereUniqueWithoutSpaceInput = {
    where: BlockedDateWhereUniqueInput
    data: XOR<BlockedDateUpdateWithoutSpaceInput, BlockedDateUncheckedUpdateWithoutSpaceInput>
  }

  export type BlockedDateUpdateManyWithWhereWithoutSpaceInput = {
    where: BlockedDateScalarWhereInput
    data: XOR<BlockedDateUpdateManyMutationInput, BlockedDateUncheckedUpdateManyWithoutSpaceInput>
  }

  export type BlockedDateScalarWhereInput = {
    AND?: BlockedDateScalarWhereInput | BlockedDateScalarWhereInput[]
    OR?: BlockedDateScalarWhereInput[]
    NOT?: BlockedDateScalarWhereInput | BlockedDateScalarWhereInput[]
    id?: IntFilter<"BlockedDate"> | number
    spaceId?: IntFilter<"BlockedDate"> | number
    date?: DateTimeFilter<"BlockedDate"> | Date | string
    reason?: StringNullableFilter<"BlockedDate"> | string | null
  }

  export type BookingUpsertWithWhereUniqueWithoutSpaceInput = {
    where: BookingWhereUniqueInput
    update: XOR<BookingUpdateWithoutSpaceInput, BookingUncheckedUpdateWithoutSpaceInput>
    create: XOR<BookingCreateWithoutSpaceInput, BookingUncheckedCreateWithoutSpaceInput>
  }

  export type BookingUpdateWithWhereUniqueWithoutSpaceInput = {
    where: BookingWhereUniqueInput
    data: XOR<BookingUpdateWithoutSpaceInput, BookingUncheckedUpdateWithoutSpaceInput>
  }

  export type BookingUpdateManyWithWhereWithoutSpaceInput = {
    where: BookingScalarWhereInput
    data: XOR<BookingUpdateManyMutationInput, BookingUncheckedUpdateManyWithoutSpaceInput>
  }

  export type ReviewUpsertWithWhereUniqueWithoutSpaceInput = {
    where: ReviewWhereUniqueInput
    update: XOR<ReviewUpdateWithoutSpaceInput, ReviewUncheckedUpdateWithoutSpaceInput>
    create: XOR<ReviewCreateWithoutSpaceInput, ReviewUncheckedCreateWithoutSpaceInput>
  }

  export type ReviewUpdateWithWhereUniqueWithoutSpaceInput = {
    where: ReviewWhereUniqueInput
    data: XOR<ReviewUpdateWithoutSpaceInput, ReviewUncheckedUpdateWithoutSpaceInput>
  }

  export type ReviewUpdateManyWithWhereWithoutSpaceInput = {
    where: ReviewScalarWhereInput
    data: XOR<ReviewUpdateManyMutationInput, ReviewUncheckedUpdateManyWithoutSpaceInput>
  }

  export type SpaceCreateWithoutCategoryInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutCategoryInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutCategoryInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput>
  }

  export type SpaceCreateManyCategoryInputEnvelope = {
    data: SpaceCreateManyCategoryInput | SpaceCreateManyCategoryInput[]
    skipDuplicates?: boolean
  }

  export type SpaceUpsertWithWhereUniqueWithoutCategoryInput = {
    where: SpaceWhereUniqueInput
    update: XOR<SpaceUpdateWithoutCategoryInput, SpaceUncheckedUpdateWithoutCategoryInput>
    create: XOR<SpaceCreateWithoutCategoryInput, SpaceUncheckedCreateWithoutCategoryInput>
  }

  export type SpaceUpdateWithWhereUniqueWithoutCategoryInput = {
    where: SpaceWhereUniqueInput
    data: XOR<SpaceUpdateWithoutCategoryInput, SpaceUncheckedUpdateWithoutCategoryInput>
  }

  export type SpaceUpdateManyWithWhereWithoutCategoryInput = {
    where: SpaceScalarWhereInput
    data: XOR<SpaceUpdateManyMutationInput, SpaceUncheckedUpdateManyWithoutCategoryInput>
  }

  export type SpaceAmenityCreateWithoutAmenityInput = {
    space: SpaceCreateNestedOneWithoutAmenitiesInput
  }

  export type SpaceAmenityUncheckedCreateWithoutAmenityInput = {
    id?: number
    spaceId: number
  }

  export type SpaceAmenityCreateOrConnectWithoutAmenityInput = {
    where: SpaceAmenityWhereUniqueInput
    create: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput>
  }

  export type SpaceAmenityCreateManyAmenityInputEnvelope = {
    data: SpaceAmenityCreateManyAmenityInput | SpaceAmenityCreateManyAmenityInput[]
    skipDuplicates?: boolean
  }

  export type SpaceAmenityUpsertWithWhereUniqueWithoutAmenityInput = {
    where: SpaceAmenityWhereUniqueInput
    update: XOR<SpaceAmenityUpdateWithoutAmenityInput, SpaceAmenityUncheckedUpdateWithoutAmenityInput>
    create: XOR<SpaceAmenityCreateWithoutAmenityInput, SpaceAmenityUncheckedCreateWithoutAmenityInput>
  }

  export type SpaceAmenityUpdateWithWhereUniqueWithoutAmenityInput = {
    where: SpaceAmenityWhereUniqueInput
    data: XOR<SpaceAmenityUpdateWithoutAmenityInput, SpaceAmenityUncheckedUpdateWithoutAmenityInput>
  }

  export type SpaceAmenityUpdateManyWithWhereWithoutAmenityInput = {
    where: SpaceAmenityScalarWhereInput
    data: XOR<SpaceAmenityUpdateManyMutationInput, SpaceAmenityUncheckedUpdateManyWithoutAmenityInput>
  }

  export type SpaceCreateWithoutAmenitiesInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutAmenitiesInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutAmenitiesInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutAmenitiesInput, SpaceUncheckedCreateWithoutAmenitiesInput>
  }

  export type AmenityCreateWithoutSpacesInput = {
    name: string
    icon?: string | null
    category?: string | null
  }

  export type AmenityUncheckedCreateWithoutSpacesInput = {
    id?: number
    name: string
    icon?: string | null
    category?: string | null
  }

  export type AmenityCreateOrConnectWithoutSpacesInput = {
    where: AmenityWhereUniqueInput
    create: XOR<AmenityCreateWithoutSpacesInput, AmenityUncheckedCreateWithoutSpacesInput>
  }

  export type SpaceUpsertWithoutAmenitiesInput = {
    update: XOR<SpaceUpdateWithoutAmenitiesInput, SpaceUncheckedUpdateWithoutAmenitiesInput>
    create: XOR<SpaceCreateWithoutAmenitiesInput, SpaceUncheckedCreateWithoutAmenitiesInput>
    where?: SpaceWhereInput
  }

  export type SpaceUpdateToOneWithWhereWithoutAmenitiesInput = {
    where?: SpaceWhereInput
    data: XOR<SpaceUpdateWithoutAmenitiesInput, SpaceUncheckedUpdateWithoutAmenitiesInput>
  }

  export type SpaceUpdateWithoutAmenitiesInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutAmenitiesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type AmenityUpsertWithoutSpacesInput = {
    update: XOR<AmenityUpdateWithoutSpacesInput, AmenityUncheckedUpdateWithoutSpacesInput>
    create: XOR<AmenityCreateWithoutSpacesInput, AmenityUncheckedCreateWithoutSpacesInput>
    where?: AmenityWhereInput
  }

  export type AmenityUpdateToOneWithWhereWithoutSpacesInput = {
    where?: AmenityWhereInput
    data: XOR<AmenityUpdateWithoutSpacesInput, AmenityUncheckedUpdateWithoutSpacesInput>
  }

  export type AmenityUpdateWithoutSpacesInput = {
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AmenityUncheckedUpdateWithoutSpacesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    icon?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type SpaceCreateWithoutAvailabilityInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutAvailabilityInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutAvailabilityInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutAvailabilityInput, SpaceUncheckedCreateWithoutAvailabilityInput>
  }

  export type SpaceUpsertWithoutAvailabilityInput = {
    update: XOR<SpaceUpdateWithoutAvailabilityInput, SpaceUncheckedUpdateWithoutAvailabilityInput>
    create: XOR<SpaceCreateWithoutAvailabilityInput, SpaceUncheckedCreateWithoutAvailabilityInput>
    where?: SpaceWhereInput
  }

  export type SpaceUpdateToOneWithWhereWithoutAvailabilityInput = {
    where?: SpaceWhereInput
    data: XOR<SpaceUpdateWithoutAvailabilityInput, SpaceUncheckedUpdateWithoutAvailabilityInput>
  }

  export type SpaceUpdateWithoutAvailabilityInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutAvailabilityInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceCreateWithoutBlockedDatesInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutBlockedDatesInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutBlockedDatesInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutBlockedDatesInput, SpaceUncheckedCreateWithoutBlockedDatesInput>
  }

  export type SpaceUpsertWithoutBlockedDatesInput = {
    update: XOR<SpaceUpdateWithoutBlockedDatesInput, SpaceUncheckedUpdateWithoutBlockedDatesInput>
    create: XOR<SpaceCreateWithoutBlockedDatesInput, SpaceUncheckedCreateWithoutBlockedDatesInput>
    where?: SpaceWhereInput
  }

  export type SpaceUpdateToOneWithWhereWithoutBlockedDatesInput = {
    where?: SpaceWhereInput
    data: XOR<SpaceUpdateWithoutBlockedDatesInput, SpaceUncheckedUpdateWithoutBlockedDatesInput>
  }

  export type SpaceUpdateWithoutBlockedDatesInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutBlockedDatesInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type UserCreateWithoutBookingsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
    spaces?: SpaceCreateNestedManyWithoutHostInput
    reviews?: ReviewCreateNestedManyWithoutUserInput
    payouts?: PayoutCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateWithoutBookingsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    spaces?: SpaceUncheckedCreateNestedManyWithoutHostInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutUserInput
    payouts?: PayoutUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserCreateOrConnectWithoutBookingsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
  }

  export type SpaceCreateWithoutBookingsInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    reviews?: ReviewCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutBookingsInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutBookingsInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutBookingsInput, SpaceUncheckedCreateWithoutBookingsInput>
  }

  export type ReviewCreateWithoutBookingInput = {
    rating: number
    comment?: string | null
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutReviewsInput
    space: SpaceCreateNestedOneWithoutReviewsInput
  }

  export type ReviewUncheckedCreateWithoutBookingInput = {
    id?: number
    rating: number
    comment?: string | null
    userId: string
    spaceId: number
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReviewCreateOrConnectWithoutBookingInput = {
    where: ReviewWhereUniqueInput
    create: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
  }

  export type UserUpsertWithoutBookingsInput = {
    update: XOR<UserUpdateWithoutBookingsInput, UserUncheckedUpdateWithoutBookingsInput>
    create: XOR<UserCreateWithoutBookingsInput, UserUncheckedCreateWithoutBookingsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBookingsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBookingsInput, UserUncheckedUpdateWithoutBookingsInput>
  }

  export type UserUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
    spaces?: SpaceUpdateManyWithoutHostNestedInput
    reviews?: ReviewUpdateManyWithoutUserNestedInput
    payouts?: PayoutUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateWithoutBookingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    spaces?: SpaceUncheckedUpdateManyWithoutHostNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutUserNestedInput
    payouts?: PayoutUncheckedUpdateManyWithoutHostNestedInput
  }

  export type SpaceUpsertWithoutBookingsInput = {
    update: XOR<SpaceUpdateWithoutBookingsInput, SpaceUncheckedUpdateWithoutBookingsInput>
    create: XOR<SpaceCreateWithoutBookingsInput, SpaceUncheckedCreateWithoutBookingsInput>
    where?: SpaceWhereInput
  }

  export type SpaceUpdateToOneWithWhereWithoutBookingsInput = {
    where?: SpaceWhereInput
    data: XOR<SpaceUpdateWithoutBookingsInput, SpaceUncheckedUpdateWithoutBookingsInput>
  }

  export type SpaceUpdateWithoutBookingsInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutBookingsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type ReviewUpsertWithoutBookingInput = {
    update: XOR<ReviewUpdateWithoutBookingInput, ReviewUncheckedUpdateWithoutBookingInput>
    create: XOR<ReviewCreateWithoutBookingInput, ReviewUncheckedCreateWithoutBookingInput>
    where?: ReviewWhereInput
  }

  export type ReviewUpdateToOneWithWhereWithoutBookingInput = {
    where?: ReviewWhereInput
    data: XOR<ReviewUpdateWithoutBookingInput, ReviewUncheckedUpdateWithoutBookingInput>
  }

  export type ReviewUpdateWithoutBookingInput = {
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutReviewsNestedInput
    space?: SpaceUpdateOneRequiredWithoutReviewsNestedInput
  }

  export type ReviewUncheckedUpdateWithoutBookingInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    spaceId?: IntFieldUpdateOperationsInput | number
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutReviewsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
    spaces?: SpaceCreateNestedManyWithoutHostInput
    bookings?: BookingCreateNestedManyWithoutUserInput
    payouts?: PayoutCreateNestedManyWithoutHostInput
  }

  export type UserUncheckedCreateWithoutReviewsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    spaces?: SpaceUncheckedCreateNestedManyWithoutHostInput
    bookings?: BookingUncheckedCreateNestedManyWithoutUserInput
    payouts?: PayoutUncheckedCreateNestedManyWithoutHostInput
  }

  export type UserCreateOrConnectWithoutReviewsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutReviewsInput, UserUncheckedCreateWithoutReviewsInput>
  }

  export type SpaceCreateWithoutReviewsInput = {
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    host: UserCreateNestedOneWithoutSpacesInput
    category: SpaceCategoryCreateNestedOneWithoutSpacesInput
    amenities?: SpaceAmenityCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateCreateNestedManyWithoutSpaceInput
    bookings?: BookingCreateNestedManyWithoutSpaceInput
  }

  export type SpaceUncheckedCreateWithoutReviewsInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
    categorySlug: string
    amenities?: SpaceAmenityUncheckedCreateNestedManyWithoutSpaceInput
    availability?: AvailabilityUncheckedCreateNestedManyWithoutSpaceInput
    blockedDates?: BlockedDateUncheckedCreateNestedManyWithoutSpaceInput
    bookings?: BookingUncheckedCreateNestedManyWithoutSpaceInput
  }

  export type SpaceCreateOrConnectWithoutReviewsInput = {
    where: SpaceWhereUniqueInput
    create: XOR<SpaceCreateWithoutReviewsInput, SpaceUncheckedCreateWithoutReviewsInput>
  }

  export type BookingCreateWithoutReviewInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
    user: UserCreateNestedOneWithoutBookingsInput
    space: SpaceCreateNestedOneWithoutBookingsInput
  }

  export type BookingUncheckedCreateWithoutReviewInput = {
    id?: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    spaceId: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type BookingCreateOrConnectWithoutReviewInput = {
    where: BookingWhereUniqueInput
    create: XOR<BookingCreateWithoutReviewInput, BookingUncheckedCreateWithoutReviewInput>
  }

  export type UserUpsertWithoutReviewsInput = {
    update: XOR<UserUpdateWithoutReviewsInput, UserUncheckedUpdateWithoutReviewsInput>
    create: XOR<UserCreateWithoutReviewsInput, UserUncheckedCreateWithoutReviewsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutReviewsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutReviewsInput, UserUncheckedUpdateWithoutReviewsInput>
  }

  export type UserUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
    spaces?: SpaceUpdateManyWithoutHostNestedInput
    bookings?: BookingUpdateManyWithoutUserNestedInput
    payouts?: PayoutUpdateManyWithoutHostNestedInput
  }

  export type UserUncheckedUpdateWithoutReviewsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    spaces?: SpaceUncheckedUpdateManyWithoutHostNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutUserNestedInput
    payouts?: PayoutUncheckedUpdateManyWithoutHostNestedInput
  }

  export type SpaceUpsertWithoutReviewsInput = {
    update: XOR<SpaceUpdateWithoutReviewsInput, SpaceUncheckedUpdateWithoutReviewsInput>
    create: XOR<SpaceCreateWithoutReviewsInput, SpaceUncheckedCreateWithoutReviewsInput>
    where?: SpaceWhereInput
  }

  export type SpaceUpdateToOneWithWhereWithoutReviewsInput = {
    where?: SpaceWhereInput
    data: XOR<SpaceUpdateWithoutReviewsInput, SpaceUncheckedUpdateWithoutReviewsInput>
  }

  export type SpaceUpdateWithoutReviewsInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutReviewsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type BookingUpsertWithoutReviewInput = {
    update: XOR<BookingUpdateWithoutReviewInput, BookingUncheckedUpdateWithoutReviewInput>
    create: XOR<BookingCreateWithoutReviewInput, BookingUncheckedCreateWithoutReviewInput>
    where?: BookingWhereInput
  }

  export type BookingUpdateToOneWithWhereWithoutReviewInput = {
    where?: BookingWhereInput
    data: XOR<BookingUpdateWithoutReviewInput, BookingUncheckedUpdateWithoutReviewInput>
  }

  export type BookingUpdateWithoutReviewInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutBookingsNestedInput
    space?: SpaceUpdateOneRequiredWithoutBookingsNestedInput
  }

  export type BookingUncheckedUpdateWithoutReviewInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserCreateWithoutPayoutsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionCreateNestedManyWithoutUserInput
    spaces?: SpaceCreateNestedManyWithoutHostInput
    bookings?: BookingCreateNestedManyWithoutUserInput
    reviews?: ReviewCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutPayoutsInput = {
    id?: string
    email: string
    username: string
    name?: string | null
    password: string
    role?: $Enums.Role
    emailVerified?: boolean
    image?: string | null
    phone?: string | null
    bio?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostVerified?: boolean
    hostingSince?: Date | string | null
    stripeAccountId?: string | null
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    spaces?: SpaceUncheckedCreateNestedManyWithoutHostInput
    bookings?: BookingUncheckedCreateNestedManyWithoutUserInput
    reviews?: ReviewUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutPayoutsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutPayoutsInput, UserUncheckedCreateWithoutPayoutsInput>
  }

  export type UserUpsertWithoutPayoutsInput = {
    update: XOR<UserUpdateWithoutPayoutsInput, UserUncheckedUpdateWithoutPayoutsInput>
    create: XOR<UserCreateWithoutPayoutsInput, UserUncheckedCreateWithoutPayoutsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutPayoutsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutPayoutsInput, UserUncheckedUpdateWithoutPayoutsInput>
  }

  export type UserUpdateWithoutPayoutsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUpdateManyWithoutUserNestedInput
    spaces?: SpaceUpdateManyWithoutHostNestedInput
    bookings?: BookingUpdateManyWithoutUserNestedInput
    reviews?: ReviewUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutPayoutsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    username?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    password?: StringFieldUpdateOperationsInput | string
    role?: EnumRoleFieldUpdateOperationsInput | $Enums.Role
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    image?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    bio?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostVerified?: BoolFieldUpdateOperationsInput | boolean
    hostingSince?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeAccountId?: NullableStringFieldUpdateOperationsInput | string | null
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    spaces?: SpaceUncheckedUpdateManyWithoutHostNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutUserNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutUserNestedInput
  }

  export type SessionCreateManyUserInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type SpaceCreateManyHostInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    categorySlug: string
  }

  export type BookingCreateManyUserInput = {
    id?: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    spaceId: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type ReviewCreateManyUserInput = {
    id?: number
    rating: number
    comment?: string | null
    spaceId: number
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PayoutCreateManyHostInput = {
    id?: string
    amount: number
    platformFee: number
    netAmount: number
    status?: $Enums.PayoutStatus
    bookingIds?: PayoutCreatebookingIdsInput | string[]
    stripeTransferId?: string | null
    processedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpaceUpdateWithoutHostInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    category?: SpaceCategoryUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutHostInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categorySlug?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateManyWithoutHostInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    categorySlug?: StringFieldUpdateOperationsInput | string
  }

  export type BookingUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    space?: SpaceUpdateOneRequiredWithoutBookingsNestedInput
    review?: ReviewUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    review?: ReviewUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReviewUpdateWithoutUserInput = {
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    space?: SpaceUpdateOneRequiredWithoutReviewsNestedInput
    booking?: BookingUpdateOneRequiredWithoutReviewNestedInput
  }

  export type ReviewUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    spaceId?: IntFieldUpdateOperationsInput | number
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    spaceId?: IntFieldUpdateOperationsInput | number
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutUpdateWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutUncheckedUpdateWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PayoutUncheckedUpdateManyWithoutHostInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: IntFieldUpdateOperationsInput | number
    platformFee?: IntFieldUpdateOperationsInput | number
    netAmount?: IntFieldUpdateOperationsInput | number
    status?: EnumPayoutStatusFieldUpdateOperationsInput | $Enums.PayoutStatus
    bookingIds?: PayoutUpdatebookingIdsInput | string[]
    stripeTransferId?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpaceAmenityCreateManySpaceInput = {
    id?: number
    amenityId: number
  }

  export type AvailabilityCreateManySpaceInput = {
    id?: number
    dayOfWeek: number
    startTime: string
    endTime: string
    isOpen?: boolean
  }

  export type BlockedDateCreateManySpaceInput = {
    id?: number
    date: Date | string
    reason?: string | null
  }

  export type BookingCreateManySpaceInput = {
    id?: string
    userId: string
    guestEmail: string
    guestName: string
    guestPhone?: string | null
    numberOfGuests?: number
    startDateTime: Date | string
    endDateTime: Date | string
    isHourly: boolean
    subtotal: number
    serviceFee: number
    totalAmount: number
    depositAmount: number
    remainingAmount: number
    depositPaid?: boolean
    depositPaidAt?: Date | string | null
    remainingPaid?: boolean
    remainingPaidAt?: Date | string | null
    depositSessionId?: string | null
    remainingSessionId?: string | null
    depositPaymentIntentId?: string | null
    remainingPaymentIntentId?: string | null
    status?: $Enums.BookingStatus
    hostNote?: string | null
    guestNote?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    approvedAt?: Date | string | null
    cancelledAt?: Date | string | null
    completedAt?: Date | string | null
  }

  export type ReviewCreateManySpaceInput = {
    id?: number
    rating: number
    comment?: string | null
    userId: string
    bookingId: string
    hostResponse?: string | null
    hostRespondedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SpaceAmenityUpdateWithoutSpaceInput = {
    amenity?: AmenityUpdateOneRequiredWithoutSpacesNestedInput
  }

  export type SpaceAmenityUncheckedUpdateWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    amenityId?: IntFieldUpdateOperationsInput | number
  }

  export type SpaceAmenityUncheckedUpdateManyWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    amenityId?: IntFieldUpdateOperationsInput | number
  }

  export type AvailabilityUpdateWithoutSpaceInput = {
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AvailabilityUncheckedUpdateWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AvailabilityUncheckedUpdateManyWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    dayOfWeek?: IntFieldUpdateOperationsInput | number
    startTime?: StringFieldUpdateOperationsInput | string
    endTime?: StringFieldUpdateOperationsInput | string
    isOpen?: BoolFieldUpdateOperationsInput | boolean
  }

  export type BlockedDateUpdateWithoutSpaceInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BlockedDateUncheckedUpdateWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BlockedDateUncheckedUpdateManyWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    reason?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type BookingUpdateWithoutSpaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    user?: UserUpdateOneRequiredWithoutBookingsNestedInput
    review?: ReviewUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateWithoutSpaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    review?: ReviewUncheckedUpdateOneWithoutBookingNestedInput
  }

  export type BookingUncheckedUpdateManyWithoutSpaceInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    guestEmail?: StringFieldUpdateOperationsInput | string
    guestName?: StringFieldUpdateOperationsInput | string
    guestPhone?: NullableStringFieldUpdateOperationsInput | string | null
    numberOfGuests?: IntFieldUpdateOperationsInput | number
    startDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    endDateTime?: DateTimeFieldUpdateOperationsInput | Date | string
    isHourly?: BoolFieldUpdateOperationsInput | boolean
    subtotal?: IntFieldUpdateOperationsInput | number
    serviceFee?: IntFieldUpdateOperationsInput | number
    totalAmount?: IntFieldUpdateOperationsInput | number
    depositAmount?: IntFieldUpdateOperationsInput | number
    remainingAmount?: IntFieldUpdateOperationsInput | number
    depositPaid?: BoolFieldUpdateOperationsInput | boolean
    depositPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    remainingPaid?: BoolFieldUpdateOperationsInput | boolean
    remainingPaidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    depositSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingSessionId?: NullableStringFieldUpdateOperationsInput | string | null
    depositPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    remainingPaymentIntentId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumBookingStatusFieldUpdateOperationsInput | $Enums.BookingStatus
    hostNote?: NullableStringFieldUpdateOperationsInput | string | null
    guestNote?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    approvedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    cancelledAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ReviewUpdateWithoutSpaceInput = {
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutReviewsNestedInput
    booking?: BookingUpdateOneRequiredWithoutReviewNestedInput
  }

  export type ReviewUncheckedUpdateWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReviewUncheckedUpdateManyWithoutSpaceInput = {
    id?: IntFieldUpdateOperationsInput | number
    rating?: IntFieldUpdateOperationsInput | number
    comment?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    bookingId?: StringFieldUpdateOperationsInput | string
    hostResponse?: NullableStringFieldUpdateOperationsInput | string | null
    hostRespondedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SpaceCreateManyCategoryInput = {
    id?: number
    name: string
    shortDescription: string
    description: string
    spaceType: $Enums.SpaceType
    pricingType: $Enums.PricingType
    pricePerHour?: number | null
    pricePerDay?: number | null
    depositPercent?: number
    capacity: number
    minBookingHours?: number | null
    maxBookingHours?: number | null
    images: JsonNullValueInput | InputJsonValue
    address: string
    city: string
    state?: string | null
    country: string
    postalCode?: string | null
    latitude?: number | null
    longitude?: number | null
    isActive?: boolean
    instantBook?: boolean
    cancellationPolicy?: $Enums.CancellationPolicy
    houseRules?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    hostId: string
  }

  export type SpaceUpdateWithoutCategoryInput = {
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    host?: UserUpdateOneRequiredWithoutSpacesNestedInput
    amenities?: SpaceAmenityUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
    amenities?: SpaceAmenityUncheckedUpdateManyWithoutSpaceNestedInput
    availability?: AvailabilityUncheckedUpdateManyWithoutSpaceNestedInput
    blockedDates?: BlockedDateUncheckedUpdateManyWithoutSpaceNestedInput
    bookings?: BookingUncheckedUpdateManyWithoutSpaceNestedInput
    reviews?: ReviewUncheckedUpdateManyWithoutSpaceNestedInput
  }

  export type SpaceUncheckedUpdateManyWithoutCategoryInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    shortDescription?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    spaceType?: EnumSpaceTypeFieldUpdateOperationsInput | $Enums.SpaceType
    pricingType?: EnumPricingTypeFieldUpdateOperationsInput | $Enums.PricingType
    pricePerHour?: NullableIntFieldUpdateOperationsInput | number | null
    pricePerDay?: NullableIntFieldUpdateOperationsInput | number | null
    depositPercent?: IntFieldUpdateOperationsInput | number
    capacity?: IntFieldUpdateOperationsInput | number
    minBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    maxBookingHours?: NullableIntFieldUpdateOperationsInput | number | null
    images?: JsonNullValueInput | InputJsonValue
    address?: StringFieldUpdateOperationsInput | string
    city?: StringFieldUpdateOperationsInput | string
    state?: NullableStringFieldUpdateOperationsInput | string | null
    country?: StringFieldUpdateOperationsInput | string
    postalCode?: NullableStringFieldUpdateOperationsInput | string | null
    latitude?: NullableFloatFieldUpdateOperationsInput | number | null
    longitude?: NullableFloatFieldUpdateOperationsInput | number | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    instantBook?: BoolFieldUpdateOperationsInput | boolean
    cancellationPolicy?: EnumCancellationPolicyFieldUpdateOperationsInput | $Enums.CancellationPolicy
    houseRules?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    hostId?: StringFieldUpdateOperationsInput | string
  }

  export type SpaceAmenityCreateManyAmenityInput = {
    id?: number
    spaceId: number
  }

  export type SpaceAmenityUpdateWithoutAmenityInput = {
    space?: SpaceUpdateOneRequiredWithoutAmenitiesNestedInput
  }

  export type SpaceAmenityUncheckedUpdateWithoutAmenityInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
  }

  export type SpaceAmenityUncheckedUpdateManyWithoutAmenityInput = {
    id?: IntFieldUpdateOperationsInput | number
    spaceId?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}