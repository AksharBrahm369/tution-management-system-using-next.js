import { AsyncLocalStorage } from "async_hooks";

type InstituteStore = {
  instituteId: string | null;
};

const instituteStorage = new AsyncLocalStorage<InstituteStore>();

export function setRequestInstitute(instituteId: string | null | undefined) {
  instituteStorage.enterWith({ instituteId: instituteId ?? null });
}

export function getRequestInstituteId() {
  return instituteStorage.getStore()?.instituteId ?? null;
}

export async function withRequestInstitute<T>(
  instituteId: string | null | undefined,
  work: () => Promise<T>
) {
  return instituteStorage.run({ instituteId: instituteId ?? null }, work);
}

