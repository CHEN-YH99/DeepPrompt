import { SkeletonGrid } from "@/components/skeleton-grid";

export default function MyCollectionsLoading() {
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
