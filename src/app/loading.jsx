import Loading from "@/components/ui/Loading";

/**
 * Root Next.js streaming loading boundary
 * Ensures unified global loading state during route navigation.
 */
export default function GlobalLoading() {
  return <Loading fullScreen message="Loading page..." />;
}
