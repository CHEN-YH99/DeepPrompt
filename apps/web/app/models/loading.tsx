import { SkeletonGrid } from "@/components/skeleton-grid";

export default function ModelsLoading() {
  return (
    <main className="shell">
      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section">
          <SkeletonGrid count={6} />
        </div>
      </section>
    </main>
  );
}
