const KEY = 'mindspark_profile_photo';
const EVENT = 'mindspark-profile-photo-change';

export function getProfilePhoto() {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    return null;
  }
}

export function setProfilePhoto(dataUrl) {
  try {
    if (dataUrl) {
      localStorage.setItem(KEY, dataUrl);
    } else {
      localStorage.removeItem(KEY);
    }
  } catch (e) {
    // ignore storage errors (e.g. quota exceeded, private browsing)
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: dataUrl }));
}

export function onProfilePhotoChange(callback) {
  const handler = (e) => callback(e.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
