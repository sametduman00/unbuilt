import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#09090f",
      gap: "1rem",
    }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: { width: "100%", maxWidth: 420 },
          },
        }}
      />
      <p style={{
        maxWidth: 380,
        textAlign: "center",
        fontSize: 12,
        lineHeight: 1.5,
        color: "#666",
        margin: 0,
        padding: "0 1rem",
      }}>
        By signing up, you agree to our{" "}
        <a href="/legal/terms-of-service" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/legal/privacy-policy" style={{ color: "#888", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}
