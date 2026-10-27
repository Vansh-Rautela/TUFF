import { Link } from "react-router-dom";

import { EmptyState } from "@/components/common/EmptyState";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <PageShell stylist={false}>
      <EmptyState eyebrow="404" title="This page has left the collection." action={<Button asChild><Link to="/">Return home</Link></Button>}>
        The link may be old, or the page may have moved.
      </EmptyState>
    </PageShell>
  );
}
