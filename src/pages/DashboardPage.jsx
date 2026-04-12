import { useOutletContext, useParams } from 'react-router-dom';
import DashboardWorkspaceContent from './dashboard/DashboardWorkspaceContent.jsx';

/**
 * `/app/dashboard` and `/app/dashboard/:section` — main column only; chrome lives in `WorkspaceLayout`.
 */
export default function DashboardPage() {
  const { section } = useParams();
  const { setup, onSetupChange, onOpenConnections } = useOutletContext();
  const activeNav = section ?? 'overview';

  return (
    <DashboardWorkspaceContent
      setup={setup}
      onSetupChange={onSetupChange}
      onOpenConnections={onOpenConnections}
      activeNav={activeNav}
    />
  );
}
