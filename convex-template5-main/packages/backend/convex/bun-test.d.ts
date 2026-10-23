// Standalone TypeScript definitions for "bun:test"
// Provides complete types for describe, it, test, expect, lifecycle hooks, and matchers
// without external runtime or dev dependencies.

declare module "bun:test" {
  export interface Matchers<T = any> {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toStrictEqual(expected: any): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeNaN(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(n: number | bigint): void;
    toBeGreaterThanOrEqual(n: number | bigint): void;
    toBeLessThan(n: number | bigint): void;
    toBeLessThanOrEqual(n: number | bigint): void;
    toBeCloseTo(expected: number, numDigits?: number): void;
    toBeInstanceOf(expected: any): void;
    toContain(item: any): void;
    toContainEqual(item: any): void;
    toHaveLength(length: number): void;
    toHaveProperty(keyPath: string | any[], value?: any): void;
    toMatch(pattern: string | RegExp): void;
    toMatchObject(expected: any): void;
    toThrow(expected?: any): void;
    toThrowError(expected?: any): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(n: number): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenLastCalledWith(...args: any[]): void;
    toHaveBeenNthCalledWith(n: number, ...args: any[]): void;
    toHaveReturned(): void;
    toHaveReturnedTimes(n: number): void;
    toHaveReturnedWith(value: any): void;
    toHaveLastReturnedWith(value: any): void;
    toHaveNthReturnedWith(n: number, value: any): void;
    not: Matchers<T>;
    resolves: Promise<Matchers<T>> & Matchers<T>;
    rejects: Promise<Matchers<T>> & Matchers<T>;
  }

  export interface ExpectStatic {
    <T = any>(actual: T): Matchers<T>;
    extend(matchers: Record<string, (...args: any[]) => any>): void;
    any(constructor: any): any;
    anything(): any;
    arrayContaining(arr: any[]): any;
    objectContaining(obj: any): any;
    stringContaining(str: string): any;
    stringMatching(pattern: string | RegExp): any;
    not: {
      arrayContaining(arr: any[]): any;
      objectContaining(obj: any): any;
      stringContaining(str: string): any;
      stringMatching(pattern: string | RegExp): any;
    };
  }

  export const expect: ExpectStatic;

  export type TestFn = () => void | Promise<any>;

  export interface TestModifier {
    (name: string, fn: TestFn, timeout?: number): void;
    only: (name: string, fn: TestFn, timeout?: number) => void;
    skip: (name: string, fn: TestFn, timeout?: number) => void;
    todo: (name: string, fn?: TestFn) => void;
    each: (table: any[] | TemplateStringsArray, ...args: any[]) => (name: string, fn: (...args: any[]) => void | Promise<any>, timeout?: number) => void;
  }

  export const test: TestModifier;
  export const it: TestModifier;

  export interface DescribeModifier {
    (name: string | Function, fn: () => void): void;
    only: (name: string | Function, fn: () => void) => void;
    skip: (name: string | Function, fn: () => void) => void;
    todo: (name: string | Function, fn?: () => void) => void;
    each: (table: any[] | TemplateStringsArray, ...args: any[]) => (name: string | Function, fn: (...args: any[]) => void) => void;
  }

  export const describe: DescribeModifier;

  export function beforeAll(fn: TestFn, timeout?: number): void;
  export function beforeEach(fn: TestFn, timeout?: number): void;
  export function afterAll(fn: TestFn, timeout?: number): void;
  export function afterEach(fn: TestFn, timeout?: number): void;

  export interface Mock<T extends (...args: any[]) => any = (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mock: {
      calls: Parameters<T>[];
      results: { type: "return" | "throw"; value: any }[];
      instances: any[];
      lastCall?: Parameters<T>;
    };
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
    mockImplementation(fn: T): this;
    mockImplementationOnce(fn: T): this;
    mockReturnValue(val: ReturnType<T>): this;
    mockReturnValueOnce(val: ReturnType<T>): this;
    mockResolvedValue(val: Awaited<ReturnType<T>>): this;
    mockResolvedValueOnce(val: Awaited<ReturnType<T>>): this;
    mockRejectedValue(val: any): this;
    mockRejectedValueOnce(val: any): this;
  }

  export function fn<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): Mock<T>;
  export function mock<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): Mock<T>;
  export function spyOn<T extends {}, K extends keyof T>(obj: T, method: K): T[K] extends (...args: any[]) => any ? Mock<T[K]> : never;

  export function setSystemTime(now?: number | Date): void;
}
