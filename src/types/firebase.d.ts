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
  export const isSupported: boolean;
}

declare module "firebase/messaging/sw" {
  export { onBackgroundMessage } from "firebase/messaging";
}