import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#09090f",
    }}>
      <SignIn
        appearance={{
          elements: {
            rootBox: { width: "100%" , maxWidth: 420 },
          },
        }}
      />
    </div>
  );
}
