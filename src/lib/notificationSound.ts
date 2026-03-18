const CUSTOMER_SOUND_URL = "/sounds/customer-notification.mp3";
const ADMIN_SOUND_URL = "/sounds/admin-notification.mp3";

let customerAudio: HTMLAudioElement | null = null;
let adminAudio: HTMLAudioElement | null = null;

function getCustomerAudio() {
  if (!customerAudio) customerAudio = new Audio(CUSTOMER_SOUND_URL);
  return customerAudio;
}

function getAdminAudio() {
  if (!adminAudio) adminAudio = new Audio(ADMIN_SOUND_URL);
  return adminAudio;
}

export function playCustomerNotificationSound() {
  try {
    const audio = getCustomerAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      console.warn("[NotificationSound] Failed to play customer sound");
    });
  } catch (e) {
    console.warn("[NotificationSound] Error playing customer sound", e);
  }
}

export function playAdminNotificationSound() {
  try {
    const audio = getAdminAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      console.warn("[NotificationSound] Failed to play admin sound");
    });
  } catch (e) {
    console.warn("[NotificationSound] Error playing admin sound", e);
  }
}