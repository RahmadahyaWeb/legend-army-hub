import Loading, { ActionSpinner } from "./Loading";

export { Loading, ActionSpinner };
export default Loading;

/**
 * Backward compatibility wrappers redirecting to the single unified Loading system
 */
export function PageLoading({ message = "Loading...", fullScreen = false }) {
  return <Loading fullScreen={fullScreen} message={message} />;
}

export function InlineSpinner({ size = "size-4", className = "" }) {
  return <ActionSpinner className={`${size} ${className}`} />;
}

export function PublicDashboardSkeleton() {
  return <Loading fullScreen message="Loading dashboard..." />;
}

export function AdminDashboardSkeleton() {
  return <Loading message="Loading overview..." />;
}

export function RosterDetailSkeleton() {
  return <Loading message="Loading roster lineup..." />;
}

export function SkeletonTable() {
  return <Loading message="Loading data..." />;
}

export function SkeletonGrid() {
  return <Loading message="Loading events..." />;
}
