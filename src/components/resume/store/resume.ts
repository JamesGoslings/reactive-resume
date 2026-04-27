import type { WritableDraft } from "immer";
import type { TemporalState } from "zundo";

import { t } from "@lingui/core/macro";
import { debounce } from "es-toolkit";
import isDeepEqual from "fast-deep-equal";
import { current } from "immer";
import { toast } from "sonner";
import { temporal } from "zundo";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand/react";
import { useStoreWithEqualityFn } from "zustand/traditional";

import type { ResumeData } from "@/schema/resume/data";

import { orpc } from "@/integrations/orpc/client";

type Resume = {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  data: ResumeData;
  isLocked: boolean;
};

type ResumeStoreState = {
  resume: Resume;
  isReady: boolean;
};

type ResumeStoreActions = {
  initialize: (resume: Resume | null) => void;
  updateResumeData: (fn: (draft: WritableDraft<ResumeData>) => void) => void;
};

type ResumeStore = ResumeStoreState & ResumeStoreActions;

const controller = new AbortController();
const signal = controller.signal;

let syncErrorToastId: string | number | undefined;

const _syncResume = async (resume: Resume) => {
  try {
    await orpc.resume.update.call({ id: resume.id, data: resume.data }, { signal });

    // Dismiss error toast on successful sync
    if (syncErrorToastId !== undefined) {
      toast.dismiss(syncErrorToastId);
      syncErrorToastId = undefined;
    }
  } catch (error: unknown) {
    // Ignore aborted requests (e.g. page navigation)
    if (error instanceof DOMException && error.name === "AbortError") return;

    syncErrorToastId = toast.error(
      t`Your latest changes could not be saved. Please make sure you are connected to the internet and try again.`,
      { id: syncErrorToastId, duration: Infinity },
    );
  }
};

const syncResume = debounce(_syncResume, 500, { signal });

// Flush pending sync before the page unloads to prevent data loss
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    syncResume.flush();
  });
}

let errorToastId: string | number | undefined;

type PartializedState = { resume: Resume | null };

export const useResumeStore = create<ResumeStore>()(
  temporal(
    immer((set) => ({
      resume: null as unknown as Resume,
      isReady: false,

      initialize: (resume) => {
        set((state) => {
          state.resume = resume as Resume;
          state.isReady = resume !== null;
          useResumeStore.temporal.getState().clear();
        });
      },

      updateResumeData: (fn) => {
        set((state) => {
          if (!state.resume) return state;

          if (state.resume.isLocked) {
            errorToastId = toast.error(t`This resume is locked and cannot be updated.`, { id: errorToastId });
            return state;
          }

          fn(state.resume.data);
          syncResume(current(state.resume));
        });
      },
    })),
    {
      partialize: (state) => ({ resume: state.resume }),
      equality: (pastState, currentState) => isDeepEqual(pastState, currentState),
      limit: 100,
    },
  ),
);

export function useTemporalStore<T>(selector: (state: TemporalState<PartializedState>) => T): T {
  return useStoreWithEqualityFn(useResumeStore.temporal, selector);
}
