import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#09090f",
    }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: { width: "100%", maxWidth: 420 },
          },
        }}
      />
    </div>
  );
}
