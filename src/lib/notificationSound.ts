const CUSTOMER_SOUND_URL = "/sounds/customer-notification.mp3";
const ADMIN_SOUND_URL = "/sounds/admin-notification.mp3";

let customerAudio: HTMLAudioElement | null = null;
let adminAudio: HTMLAudioElement | null = null;

function getCustomerAudio() {
  if (!customerAudio) {
    customerAudio = new Audio(CUSTOMER_SOUND_URL);
    customerAudio.volume = 0.5;
  }
  return customerAudio;
}

function getAdminAudio() {
  if (!adminAudio) {
    adminAudio = new Audio(ADMIN_SOUND_URL);
    adminAudio.volume = 0.7;
  }
  return adminAudio;
}

export function playCustomerNotificationSound() {
  try {
    const audio = getCustomerAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    console.warn("Failed to play customer notification sound:", e);
  }
}

export function playAdminNotificationSound() {
  try {
    const audio = getAdminAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    console.warn("Failed to play admin notification sound:", e);
  }
}