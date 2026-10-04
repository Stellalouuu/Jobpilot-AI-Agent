import Dashboard from "@/components/Dashboard";

export default function Home() {
  return <Dashboard isDemoMode={process.env.DEMO_MODE === "true"} />;
}
