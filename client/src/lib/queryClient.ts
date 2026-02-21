import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 413) {
      toast({
        variant: "destructive",
        title: "Upload Too Large",
        description: "The exam size exceeds server limits. Try reducing image sizes or count.",
      });
      throw new Error("Payload Too Large");
    }

    if (res.status === 403) {
      // If the request was very large, it might be a ModSecurity block (403) instead of a login issue.
      const isLargeRequest = document.body.innerHTML.length > 500000; // Rough heuristic

      toast({
        variant: "destructive",
        title: "Access Denied",
        description: isLargeRequest
          ? "The server rejected this large request. Please try adding fewer images at once."
          : "Your session has expired or role mismatch. Redirecting to login...",
      });

      if (!isLargeRequest) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      }
      throw new Error("Access Denied: Server rejected the request.");
    }

    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
