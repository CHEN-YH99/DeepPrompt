import { SkeletonGrid } from "@/components/skeleton-grid";

export default function MePromptsLoading() {
  return (
    <main className="shell">
      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section">
          <SkeletonGrid count={4} />
        </div>
      </section>
    </main>
  );
}
