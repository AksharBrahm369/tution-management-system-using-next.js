import { useEffect, useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

let cachedUser: { id: string; instituteId: string } | null = null;
let authPromise: Promise<{ id: string; instituteId: string }> | null = null;

async function getClientUser(): Promise<{ id: string; instituteId: string }> {
  if (cachedUser) return cachedUser;
  if (!authPromise) {
    authPromise = fetch("/api/auth/me")
      .then((res) => res.json())
      .then((payload) => {
        if (payload.success && payload.data?.user) {
          const u = { id: payload.data.user.id, instituteId: payload.data.user.instituteId };
          cachedUser = u;
          return u;
        }
        throw new Error("Unauthorized");
      });
  }
  return authPromise;
}

interface UseFormDraftOptions<T extends Record<string, any>> {
  keyName: string;
  form?: UseFormReturn<T, any, any>;
  values?: T;
  onRestore?: (values: T, step?: number) => void;
  step?: number;
  setStep?: (step: number) => void;
  excludeFields?: (keyof T)[];
}

export function useFormDraft<T extends Record<string, any>>({
  keyName,
  form,
  values,
  onRestore,
  step,
  setStep,
  excludeFields = [],
}: UseFormDraftOptions<T>) {
  const [currentUser, setCurrentUser] = useState<{ id: string; instituteId: string } | null>(null);
  const onRestoreRef = useRef(onRestore);
  const setStepRef = useRef(setStep);

  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  useEffect(() => {
    setStepRef.current = setStep;
  }, [setStep]);

  // 1. Fetch user to construct scoped storage key
  useEffect(() => {
    let active = true;
    getClientUser()
      .then((user) => {
        if (active) setCurrentUser(user);
      })
      .catch((err) => console.error("Error fetching user profile for draft scoping:", err));
    return () => {
      active = false;
    };
  }, []);

  const getStorageKey = () => {
    if (!currentUser) return null;
    return `tuitionpro:draft:${currentUser.instituteId}:${currentUser.id}:${keyName}`;
  };

  // 2. Load draft when user details are available
  useEffect(() => {
    const key = getStorageKey();
    if (!key) return;

    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const { values: draftValues, step: draftStep } = JSON.parse(saved);
        if (draftValues) {
          const cleanedValues = { ...draftValues };
          excludeFields.forEach((field) => {
            delete cleanedValues[field];
          });

          if (onRestoreRef.current) {
            onRestoreRef.current(cleanedValues, draftStep);
          } else if (form) {
            form.reset({
              ...form.getValues(),
              ...cleanedValues,
            });
          }

          if (draftStep !== undefined && setStepRef.current) {
            setStepRef.current(draftStep);
          }

          toast.success("Draft restored", {
            id: `draft-restored-${keyName}`,
            action: {
              label: "Clear draft",
              onClick: () => {
                sessionStorage.removeItem(key);
                if (form) {
                  form.reset();
                }
                if (setStepRef.current) {
                  setStepRef.current(1);
                }
                toast.dismiss(`draft-restored-${keyName}`);
              },
            },
            duration: 5000,
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load draft:", e);
    }
  }, [currentUser, keyName]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Save draft reactively
  // Watch form values or use passed values
  const watchedFormValues = form ? form.watch() : undefined;
  const currentValues = values || watchedFormValues;

  useEffect(() => {
    const key = getStorageKey();
    if (!key || !currentValues) return;

    const valuesToSave = { ...currentValues };

    // Clean out non-serializable fields
    Object.keys(valuesToSave).forEach((k) => {
      const val = valuesToSave[k];
      if (
        val instanceof File ||
        val instanceof FileList ||
        (typeof val === "object" && val !== null && "size" in val && "type" in val)
      ) {
        delete valuesToSave[k];
      }
    });

    const dataToSave = {
      values: valuesToSave,
      step,
    };

    sessionStorage.setItem(key, JSON.stringify(dataToSave));
  }, [currentValues, step, currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearDraft = () => {
    if (!currentUser) return;
    const key = `tuitionpro:draft:${currentUser.instituteId}:${currentUser.id}:${keyName}`;
    sessionStorage.removeItem(key);
  };

  return { clearDraft };
}
