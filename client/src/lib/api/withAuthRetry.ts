import { getProfile, refreshAccessToken } from "./authHelper";
import { useRouter } from "next/navigation";

/**
 * Universal wrapper for API calls that handles 401 Unauthorized, refreshes token, and retries once.
 * Usage: await withAuthRetry(token, setToken, setProfile, router, () => apiCall(token, ...args))
 */
export async function withAuthRetry(
  token: string,
  setToken: (t: string) => void,
  setProfile: (p: any) => void,
  router: ReturnType<typeof useRouter>,
  apiCall: (token: string) => Promise<any>
) {
  try {
    return await apiCall(token);
  } catch (err: any) {
    if (err?.response?.status === 401) {
      try {
        const user = getProfile();
        const refreshed = await refreshAccessToken(user.refresh_token);
        if (refreshed?.access_token) {
          const newUser = { ...user, ...refreshed };
          localStorage.setItem("user", JSON.stringify(newUser));
          setProfile(newUser);
          setToken(refreshed.access_token);
          return await apiCall(refreshed.access_token);
        } else {
          localStorage.clear();
          router.replace("/login");
        }
      } catch {
        localStorage.clear();
        router.replace("/login");
      }
    } else {
      throw err;
    }
  }
}
