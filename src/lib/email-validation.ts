const gmailAddressPattern = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/i;

export function isValidGmailAddress(value: string) {
  const email = value.trim();
  const localPart = email.split("@")[0] || "";
  return gmailAddressPattern.test(email) && !localPart.includes("..");
}