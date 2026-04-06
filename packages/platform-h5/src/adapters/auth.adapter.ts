import { createError, fail, ok, type AuthAdapter, type LoginCredential } from "@minix/core";

export interface H5AuthAdapterOptions {
  credential?: LoginCredential;
  credentialProvider?: () => LoginCredential | null | undefined | Promise<LoginCredential | null | undefined>;
}

export function createH5AuthAdapter(options: H5AuthAdapterOptions = {}): AuthAdapter {
  return {
    async login() {
      const credential = options.credentialProvider ? await options.credentialProvider() : options.credential;
      const resolvedCredential =
        credential ??
        options.credential ?? {
          anonymousId: "host-h5-anonymous",
        };

      if (!resolvedCredential || Object.keys(resolvedCredential).length === 0) {
        return fail(createError("LOGIN_FAILED", "h5 login credential is unavailable", { recoverable: true }));
      }

      return ok({
        platform: "h5",
        credential: resolvedCredential,
      });
    },
  };
}
