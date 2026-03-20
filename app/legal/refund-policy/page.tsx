export default function RefundPolicy() {
  return (
    <div>
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>Overview</h2>
        <p style={{ color: "#aaa", marginBottom: "1rem" }}>
          Unbuilt uses a credit-based system. Each credit is one AI analysis powered by Claude Opus — the most capable AI model available. Because each query immediately consumes real AI compute, our refund policy reflects this cost structure.
        </p>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>Used Credits — No Refunds</h2>
        <p style={{ color: "#aaa", marginBottom: "1rem" }}>
          Consumed credits are non-refundable. Each query calls the Anthropic API at a real cost of $0.30–$0.45. This cost is incurred the moment a query is submitted and cannot be recovered.
        </p>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>Unused Credits — Full Refund Within 14 Days</h2>
        <p style={{ color: "#aaa", marginBottom: "1rem" }}>
          If you purchased a credit package and used none of the credits, you may request a full refund within 14 days. Email support@unbuilt.me with your order details.
        </p>
      </section>
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>Technical Failures</h2>
        <p style={{ color: "#aaa", marginBottom: "1rem" }}>
          If a query fails due to a server error on our side, your credit will be automatically restored. If not, contact us and we will restore it manually.
        </p>
      </section>
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>Contact</h2>
        <p style={{ color: "#aaa" }}>Questions? Email support@unbuilt.me. We respond within 1 business day.</p>
      </section>
    </div>
  );
}
