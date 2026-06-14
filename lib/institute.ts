import { AsyncLocalStorage } from "async_hooks";

type InstituteStore = {
  instituteId: string | null;
  authScopeDisabled?: boolean;
};

const instituteStorage = new AsyncLocalStorage<InstituteStore>();

export function setRequestInstitute(instituteId: string | null | undefined) {
  instituteStorage.enterWith({ instituteId: instituteId ?? null, authScopeDisabled: false });
}

export function getRequestInstituteId() {
  return instituteStorage.getStore()?.instituteId ?? null;
}

export function isAuthScopeDisabled() {
  return instituteStorage.getStore()?.authScopeDisabled === true;
}

export async function withRequestInstitute<T>(
  instituteId: string | null | undefined,
  work: () => Promise<T>
) {
  return instituteStorage.run({ instituteId: instituteId ?? null, authScopeDisabled: false }, work);
}

export async function withoutAuthScope<T>(work: () => Promise<T>) {
  return instituteStorage.run({ instituteId: null, authScopeDisabled: true }, work);
}
