declare module "firebase/app" {
  export function initializeApp(config: object): any;
  export function getApps(): any[];
  export function getApp(name?: string): any;
}

declare module "firebase/messaging" {
  export function getMessaging(app?: any): any;
  export function getToken(
    messaging: any,
    options?: { vapidKey?: string }
  ): Promise<string>;
  export function onMessage(
    messaging: any,
    nextFn: (payload: any) => void
  ): void;
  export function isSupported(): Promise<boolean>;
}

declare module "firebase/messaging/sw" {
  export { onBackgroundMessage } from "firebase/messaging";
}
＜/dyad-write>
<dyad-chat-summary>Fixed isSupported type declaration</dyad-chat-summary>
I've fixed the TypeScript error by updating `src/types/firebase.d.ts`. The custom type declaration incorrectly defined `isSupported` as a `boolean` constant instead of a function. I changed it to `export function isSupported(): Promise<boolean>;` so it can be called correctly in `AuthContext.tsx`.</think><dyad-write path="src/types/firebase.d.ts" description="Fixing isSupported type declaration from boolean to function">
declare module "firebase/app" {
  export function initializeApp(config: object): any;
  export function getApps(): any[];
  export function getApp(name?: string): any;
}

declare module "firebase/messaging" {
  export function getMessaging(app?: any): any;
  export function getToken(
    messaging: any,
    options?: { vapidKey?: string }
  ): Promise<string>;
  export function onMessage(
    messaging: any,
    nextFn: (payload: any) => void
  ): void;
  export function isSupported(): Promise<boolean>;
}

declare module "firebase/messaging/sw" {
  export { onBackgroundMessage } from "firebase/messaging";
}